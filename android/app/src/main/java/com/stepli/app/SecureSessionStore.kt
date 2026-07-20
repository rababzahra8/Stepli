package com.stepli.app

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONObject

/**
 * A small, dependency-free encrypted store for the Supabase session kept by the
 * React Native layer. The ciphertext lives in app-private SharedPreferences;
 * the non-exportable AES key lives in Android Keystore.
 *
 * This is deliberately not a general preferences wrapper. Keeping the complete
 * session in one encrypted record means an interrupted write cannot leave an
 * access token and user id out of sync.
 */
data class TutorialSession(
  val accessToken: String,
  val refreshToken: String,
  val userId: String,
  val email: String?,
)

class SecureSessionStore(context: Context) {
  private val appContext = context.applicationContext
  private val preferences = appContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  @Synchronized
  fun getTutorialSession(): TutorialSession? {
    val encryptedSession = preferences.getString(SESSION_PREFERENCE_KEY, null) ?: return null

    return try {
      val sessionJson = JSONObject(decrypt(encryptedSession))
      if (sessionJson.optInt("version", 0) != SESSION_FORMAT_VERSION) {
        throw IllegalStateException("Unsupported saved session format")
      }

      val accessToken = sessionJson.requiredString("accessToken")
      val refreshToken = sessionJson.requiredString("refreshToken")
      val userId = sessionJson.requiredString("userId")
      val email = sessionJson.optionalString("email")
      TutorialSession(accessToken, refreshToken, userId, email)
    } catch (_: Exception) {
      // A restored backup, key invalidation, or a corrupt value must not leave a
      // stale/ciphertext session around. The caller can simply show signed-out UI.
      clearTutorialSession()
      null
    }
  }

  @Synchronized
  fun setTutorialSession(session: TutorialSession) {
    require(session.accessToken.isNotBlank()) { "An access token is required" }
    require(session.refreshToken.isNotBlank()) { "A refresh token is required" }
    require(session.userId.isNotBlank()) { "A user id is required" }

    val value = JSONObject().apply {
      put("version", SESSION_FORMAT_VERSION)
      put("accessToken", session.accessToken)
      put("refreshToken", session.refreshToken)
      put("userId", session.userId)
      if (session.email != null) put("email", session.email)
    }.toString()

    val saved = preferences.edit()
      .putString(SESSION_PREFERENCE_KEY, encrypt(value))
      .commit()
    check(saved) { "Could not persist the tutorial session" }
  }

  @Synchronized
  fun clearTutorialSession() {
    preferences.edit().remove(SESSION_PREFERENCE_KEY).commit()
  }

  /**
   * Android Keystore AES-GCM keys require randomized encryption by default, so
   * the cipher must generate the IV. Passing a caller-made IV throws
   * InvalidAlgorithmParameterException on ENCRYPT_MODE.
   */
  private fun encrypt(plainText: String): String {
    return try {
      encryptWithCurrentKey(plainText)
    } catch (_: Exception) {
      // Emulator resets / key invalidation can leave an unusable Keystore entry.
      deleteKey()
      preferences.edit().remove(SESSION_PREFERENCE_KEY).commit()
      encryptWithCurrentKey(plainText)
    }
  }

  private fun encryptWithCurrentKey(plainText: String): String {
    val cipher = Cipher.getInstance(TRANSFORMATION).apply {
      init(Cipher.ENCRYPT_MODE, secretKey())
    }
    val iv = cipher.iv
    require(iv != null && iv.isNotEmpty()) { "Keystore did not provide a GCM IV" }
    val cipherText = cipher.doFinal(plainText.toByteArray(StandardCharsets.UTF_8))
    return Base64.encodeToString(iv + cipherText, Base64.NO_WRAP)
  }

  private fun decrypt(encodedCipherText: String): String {
    val packed = Base64.decode(encodedCipherText, Base64.NO_WRAP)
    require(packed.size > GCM_IV_LENGTH_BYTES) { "Invalid encrypted session" }
    val iv = packed.copyOfRange(0, GCM_IV_LENGTH_BYTES)
    val cipherText = packed.copyOfRange(GCM_IV_LENGTH_BYTES, packed.size)
    val cipher = Cipher.getInstance(TRANSFORMATION).apply {
      init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv))
    }
    return String(cipher.doFinal(cipherText), StandardCharsets.UTF_8)
  }

  private fun secretKey(): SecretKey {
    val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
    val existingKey = keyStore.getKey(KEY_ALIAS, null) as? SecretKey
    if (existingKey != null) return existingKey
    return createKey()
  }

  private fun createKey(): SecretKey {
    val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
    val keySpec = KeyGenParameterSpec.Builder(
      KEY_ALIAS,
      KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
    )
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setRandomizedEncryptionRequired(true)
      .build()
    keyGenerator.init(keySpec)
    return keyGenerator.generateKey()
  }

  private fun deleteKey() {
    try {
      val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
      if (keyStore.containsAlias(KEY_ALIAS)) keyStore.deleteEntry(KEY_ALIAS)
    } catch (_: Exception) {
      // Best-effort cleanup before recreating the key.
    }
  }

  private fun JSONObject.requiredString(name: String): String {
    val value = optString(name, "")
    require(value.isNotBlank()) { "Missing $name" }
    return value
  }

  private fun JSONObject.optionalString(name: String): String? {
    if (!has(name) || isNull(name)) return null
    return optString(name, "").takeIf { it.isNotBlank() }
  }

  private companion object {
    const val PREFERENCES_NAME = "stepli.secure.tutorial.session"
    const val SESSION_PREFERENCE_KEY = "session.v1"
    const val KEY_ALIAS = "com.stepli.app.tutorial-session.v1"
    const val ANDROID_KEYSTORE = "AndroidKeyStore"
    const val TRANSFORMATION = "AES/GCM/NoPadding"
    const val SESSION_FORMAT_VERSION = 1
    const val GCM_IV_LENGTH_BYTES = 12
    const val GCM_TAG_LENGTH_BITS = 128
  }
}
