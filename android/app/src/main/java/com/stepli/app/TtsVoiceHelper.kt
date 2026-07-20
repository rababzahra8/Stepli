package com.stepli.app

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import java.util.Locale
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/**
 * Probes the device Text-to-speech engine for installed voices.
 * Stepli needs this before Urdu (and to show users which languages are ready).
 */
object TtsVoiceHelper {
  /** Locale tags people may see when installing Urdu voice data. */
  val URDU_LOCALE_TAGS = listOf("ur-PK", "ur-IN", "ur")

  /** Locale tags that count as English for narration. */
  val ENGLISH_LOCALE_TAGS = listOf("en-US", "en-GB", "en")

  fun openSettings(context: Context) {
    val appContext = context.applicationContext
    val intents = listOf(
      Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA),
      Intent("com.android.settings.TTS_SETTINGS"),
      Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS),
    )
    for (intent in intents) {
      try {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        appContext.startActivity(intent)
        return
      } catch (_: Exception) {
        // Try the next known settings screen.
      }
    }
  }

  fun isUrduVoiceAvailable(context: Context): Boolean =
    isLanguageAvailable(context, URDU_LOCALE_TAGS, "ur")

  fun isEnglishVoiceAvailable(context: Context): Boolean =
    isLanguageAvailable(context, ENGLISH_LOCALE_TAGS, "en")

  fun hasUrduVoice(tts: TextToSpeech): Boolean =
    hasLanguageVoice(tts, URDU_LOCALE_TAGS, "ur")

  fun hasEnglishVoice(tts: TextToSpeech): Boolean =
    hasLanguageVoice(tts, ENGLISH_LOCALE_TAGS, "en")

  /**
   * Returns every language the current TTS engine reports as available,
   * plus Stepli's checked languages (English / Urdu) with an explicit status.
   */
  fun listVoiceLanguages(context: Context): WritableArray {
    val result = Arguments.createArray()
    withEngine(context) { tts ->
      val installed = collectInstalledLocales(tts)

      addStatusRow(result, "en", "English", "English (US / UK)", hasEnglishVoice(tts))
      addStatusRow(
        result,
        "ur",
        "Urdu",
        "Urdu / اردو — Pakistan or India",
        hasUrduVoice(tts),
      )

      installed
        .asSequence()
        .filter { locale ->
          val lang = locale.language.lowercase(Locale.US)
          lang != "en" && lang != "ur"
        }
        .sortedBy { it.displayName.lowercase(Locale.US) }
        .forEach { locale ->
          addStatusRow(
            result,
            locale.toLanguageTag(),
            locale.getDisplayLanguage(Locale.US).ifBlank { locale.language },
            locale.getDisplayName(Locale.US),
            true,
          )
        }
    }
    return result
  }

  private fun addStatusRow(
    array: WritableArray,
    code: String,
    label: String,
    detail: String,
    available: Boolean,
  ) {
    array.pushMap(
      Arguments.createMap().apply {
        putString("code", code)
        putString("label", label)
        putString("detail", detail)
        putBoolean("available", available)
      },
    )
  }

  private fun collectInstalledLocales(tts: TextToSpeech): List<Locale> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      val fromLanguages = tts.availableLanguages
      if (!fromLanguages.isNullOrEmpty()) {
        return fromLanguages.toList()
      }
      val fromVoices = tts.voices
        ?.mapNotNull { it.locale }
        ?.distinctBy { it.toLanguageTag().lowercase(Locale.US) }
      if (!fromVoices.isNullOrEmpty()) {
        return fromVoices
      }
    }
    // Fallback probe for older devices / engines that omit availableLanguages.
    return (ENGLISH_LOCALE_TAGS + URDU_LOCALE_TAGS)
      .map { Locale.forLanguageTag(it) }
      .filter { tts.isLanguageAvailable(it) >= TextToSpeech.LANG_AVAILABLE }
  }

  private fun isLanguageAvailable(
    context: Context,
    tags: List<String>,
    languageCode: String,
  ): Boolean {
    var found = false
    withEngine(context) { tts ->
      found = hasLanguageVoice(tts, tags, languageCode)
    }
    return found
  }

  private fun hasLanguageVoice(
    tts: TextToSpeech,
    tags: List<String>,
    languageCode: String,
  ): Boolean =
    tags.any { tag ->
      val locale = Locale.forLanguageTag(tag)
      val result = tts.setLanguage(locale)
      result >= TextToSpeech.LANG_AVAILABLE &&
        (tts.voice?.locale?.language?.equals(languageCode, ignoreCase = true) ?: true)
    }

  private fun withEngine(context: Context, block: (TextToSpeech) -> Unit) {
    val latch = CountDownLatch(1)
    val engineRef = AtomicReference<TextToSpeech?>(null)

    Handler(Looper.getMainLooper()).post {
      engineRef.set(
        TextToSpeech(context.applicationContext) { status ->
          try {
            val engine = engineRef.get()
            if (status == TextToSpeech.SUCCESS && engine != null) {
              block(engine)
            }
          } finally {
            try {
              engineRef.get()?.shutdown()
            } catch (_: Exception) {
              // Ignore shutdown races during the probe.
            }
            latch.countDown()
          }
        },
      )
    }

    try {
      latch.await(5, TimeUnit.SECONDS)
    } catch (_: InterruptedException) {
      // Timed out — caller sees empty / false results.
    }
  }
}
