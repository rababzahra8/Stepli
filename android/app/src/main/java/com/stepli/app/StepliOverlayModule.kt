package com.stepli.app

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class StepliOverlayModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  init { reactContext = context }

  private val tutorialSessionStore = SecureSessionStore(context.applicationContext)

  override fun getName() = "StepliOverlayModule"

  private fun prefs() = context.getSharedPreferences("stepli", Context.MODE_PRIVATE)

  @ReactMethod fun getLanguage(promise: Promise) { promise.resolve(prefs().getString("language", null)) }
  @ReactMethod fun setLanguage(language: String, promise: Promise) { prefs().edit().putString("language", language).apply(); promise.resolve(null) }
  @ReactMethod fun getOnboardingComplete(promise: Promise) { promise.resolve(prefs().getBoolean("onboardingComplete", false)) }
  @ReactMethod fun setOnboardingComplete(promise: Promise) { prefs().edit().putBoolean("onboardingComplete", true).apply(); promise.resolve(null) }
  @ReactMethod fun getVoiceGuidance(promise: Promise) { promise.resolve(prefs().getBoolean("voiceGuidance", true)) }
  @ReactMethod fun setVoiceGuidance(enabled: Boolean, promise: Promise) {
    prefs().edit().putBoolean("voiceGuidance", enabled).apply()
    if (!enabled) StepliOverlayService.stopSpeech()
    promise.resolve(null)
  }
  @ReactMethod fun canDrawOverlays(promise: Promise) { promise.resolve(Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)) }
  @ReactMethod fun isAccessibilityEnabled(promise: Promise) { promise.resolve(StepliAccessibilityService.isEnabled(context)) }
  @ReactMethod fun openOverlaySettings() { context.currentActivity?.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))) }
  @ReactMethod fun openAccessibilitySettings() { context.currentActivity?.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }

  /** Lists user-launchable apps, allowing a tutorial to target more than Foodpanda. */
  @ReactMethod fun getLaunchableApps(promise: Promise) {
    try {
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val seen = mutableSetOf<String>()
      val apps = Arguments.createArray()
      context.packageManager.queryIntentActivities(launcher, PackageManager.MATCH_ALL)
        .asSequence()
        .filter { it.activityInfo.packageName != context.packageName && seen.add(it.activityInfo.packageName) }
        .sortedBy { it.loadLabel(context.packageManager).toString().lowercase() }
        .forEach { resolveInfo ->
          apps.pushMap(Arguments.createMap().apply {
            putString("label", resolveInfo.loadLabel(context.packageManager).toString())
            putString("packageName", resolveInfo.activityInfo.packageName)
          })
        }
      promise.resolve(apps)
    } catch (error: Exception) {
      promise.reject("apps_unavailable", "Could not list installed apps", error)
    }
  }

  @ReactMethod fun launchApp(packageName: String, promise: Promise) {
    val cleanPackage = packageName.trim()
    if (cleanPackage.isBlank()) { promise.resolve(false); return }
    val intent = context.packageManager.getLaunchIntentForPackage(cleanPackage)
    if (intent == null) promise.resolve(false) else {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      promise.resolve(true)
    }
  }

  @ReactMethod fun launchFoodpanda(promise: Promise) = launchApp(FOODPANDA_PACKAGE, promise)

  @ReactMethod fun showStep(
    id: String,
    text: String,
    confirm: String,
    progress: String,
    matcher: String,
    targetPackage: String,
    language: String,
    spokenText: String,
    canGoBack: Boolean,
    promise: Promise,
  ) {
    if (targetPackage.isBlank()) { promise.reject("invalid_target", "A target app package is required"); return }
    StepliOverlayService.show(
      context,
      OverlayStep(
        id,
        text,
        confirm,
        progress,
        matcher,
        targetPackage,
        language,
        spokenText.ifBlank { text },
        canGoBack = canGoBack,
      ),
    )
    promise.resolve(null)
  }

  @ReactMethod fun hide() { StepliOverlayService.closeNavigator() }
  @ReactMethod fun closeNavigator() { StepliOverlayService.closeNavigator() }

  /**
   * These are Supabase's public URL and publishable/anon key only. A database
   * password and service-role key must never be placed in a mobile build.
   */
  @ReactMethod fun getTutorialBackendConfig(promise: Promise) {
    val url = BuildConfig.STEPLI_SUPABASE_URL.trim()
    val key = BuildConfig.STEPLI_SUPABASE_ANON_KEY.trim()
    val googleWebClientId = BuildConfig.STEPLI_GOOGLE_WEB_CLIENT_ID.trim()
    if (url.isBlank() || key.isBlank()) { promise.resolve(null); return }
    promise.resolve(Arguments.createMap().apply {
      putString("url", url.removeSuffix("/"))
      putString("anonKey", key)
      if (googleWebClientId.isNotBlank()) putString("googleWebClientId", googleWebClientId)
    })
  }

  /**
   * Reads the encrypted Supabase session, if one is available. Tokens are never
   * exposed through ordinary SharedPreferences or Android logs.
   */
  @ReactMethod fun getTutorialSession(promise: Promise) {
    try {
      val session = tutorialSessionStore.getTutorialSession()
      if (session == null) {
        promise.resolve(null)
        return
      }
      promise.resolve(Arguments.createMap().apply {
        putString("accessToken", session.accessToken)
        putString("refreshToken", session.refreshToken)
        putString("userId", session.userId)
        putString("email", session.email)
      })
    } catch (error: Exception) {
      promise.reject("secure_session_unavailable", "Could not read the saved tutorial session", error)
    }
  }

  /** Writes the full session as one Android-Keystore-encrypted record. */
  @ReactMethod fun setTutorialSession(
    accessToken: String,
    refreshToken: String,
    userId: String,
    email: String?,
    promise: Promise,
  ) {
    try {
      tutorialSessionStore.setTutorialSession(
        TutorialSession(accessToken, refreshToken, userId, email?.trim()?.takeIf { it.isNotEmpty() }),
      )
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("secure_session_unavailable", "Could not save the tutorial session", error)
    }
  }

  /** Removes the encrypted session at sign-out. The Keystore key remains reusable. */
  @ReactMethod fun clearTutorialSession(promise: Promise) {
    try {
      tutorialSessionStore.clearTutorialSession()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("secure_session_unavailable", "Could not clear the tutorial session", error)
    }
  }

  @ReactMethod
  fun isUrduVoiceAvailable(promise: Promise) {
    Thread {
      try {
        promise.resolve(TtsVoiceHelper.isUrduVoiceAvailable(reactApplicationContext))
      } catch (error: Exception) {
        promise.resolve(false)
      }
    }.start()
  }

  /** Lists TTS languages on this phone so the person can see what is installed. */
  @ReactMethod
  fun getInstalledTtsLanguages(promise: Promise) {
    Thread {
      try {
        promise.resolve(TtsVoiceHelper.listVoiceLanguages(reactApplicationContext))
      } catch (error: Exception) {
        promise.resolve(Arguments.createArray())
      }
    }.start()
  }

  @ReactMethod
  fun openTextToSpeechSettings() {
    TtsVoiceHelper.openSettings(reactApplicationContext)
  }

  /** Speaks text with the device TTS engine (for the in-app Stepli voice tour). */
  @ReactMethod
  fun speak(text: String, language: String, promise: Promise) {
    try {
      StepliOverlayService.speakGuidance(reactApplicationContext, text, language)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("tts_unavailable", "Could not speak guidance", error)
    }
  }

  @ReactMethod
  fun stopSpeech(promise: Promise) {
    try {
      StepliOverlayService.stopGuidanceSpeech()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.resolve(null)
    }
  }

  companion object {
    const val FOODPANDA_PACKAGE = "com.global.foodpanda.android"
    var reactContext: ReactApplicationContext? = null
    fun emit(name: String, value: String) {
      reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(name, value)
    }
  }
}
