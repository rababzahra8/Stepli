package com.stepli.app

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

/**
 * Android-native narration is essential because React Native is backgrounded
 * while a person follows guidance in another app.
 */
class GuidanceSpeaker(context: Context) : TextToSpeech.OnInitListener {
  private val appContext = context.applicationContext
  private var ready = false
  private var pending: Pair<String, String>? = null
  private val tts = TextToSpeech(appContext, this)

  override fun onInit(status: Int) {
    ready = status == TextToSpeech.SUCCESS
    if (ready) pending?.let { (text, language) -> pending = null; speak(text, language) }
  }

  fun speak(text: String, language: String) {
    if (text.isBlank()) return
    if (!ready) { pending = text to language; return }
    val preferred = if (language.equals("ur", ignoreCase = true)) Locale.forLanguageTag("ur-PK") else Locale.US
    // Some devices do not have Urdu installed. The system chooses its own
    // fallback voice rather than failing the entire overlay.
    if (tts.isLanguageAvailable(preferred) >= TextToSpeech.LANG_AVAILABLE) tts.language = preferred
    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "stepli-guidance")
  }

  fun stop() {
    pending = null
    if (ready) tts.stop()
  }

  fun shutdown() {
    pending = null
    tts.stop()
    tts.shutdown()
  }
}
