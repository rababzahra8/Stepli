package com.stepli.app

import android.content.Context
import android.speech.tts.TextToSpeech
import android.widget.Toast
import java.util.Locale

/**
 * Android-native narration is essential because React Native is backgrounded
 * while a person follows guidance in another app.
 */
class GuidanceSpeaker(context: Context) : TextToSpeech.OnInitListener {
  private val appContext = context.applicationContext
  private var ready = false
  private var pending: Pair<String, String>? = null
  private var showedMissingUrduVoiceMessage = false
  // Prefer Google TTS so Urdu works on Samsung (Samsung TTS often has no Urdu).
  private val tts = TtsVoiceHelper.createEngine(appContext, this)

  override fun onInit(status: Int) {
    ready = status == TextToSpeech.SUCCESS
    if (ready) pending?.let { (text, language) -> pending = null; speak(text, language) }
  }

  fun speak(text: String, language: String) {
    if (text.isBlank()) return
    if (!ready) { pending = text to language; return }
    if (!selectLanguage(language)) {
      showMissingUrduVoiceMessage()
      return
    }
    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "stepli-guidance")
  }

  private fun selectLanguage(language: String): Boolean {
    if (!language.equals("ur", ignoreCase = true)) {
      return TtsVoiceHelper.hasEnglishVoice(tts) ||
        tts.setLanguage(Locale.US) >= TextToSpeech.LANG_AVAILABLE
    }
    return TtsVoiceHelper.hasUrduVoice(tts)
  }

  private fun showMissingUrduVoiceMessage() {
    if (showedMissingUrduVoiceMessage) return
    showedMissingUrduVoiceMessage = true
    Toast.makeText(
      appContext,
      "اردو آواز نہیں ملی۔ Samsung TTS میں اردو نہیں ہوتی — Google Text-to-speech لگائیں اور Urdu (Pakistan) ڈاؤن لوڈ کریں۔",
      Toast.LENGTH_LONG,
    ).show()
    TtsVoiceHelper.openSettings(appContext)
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
