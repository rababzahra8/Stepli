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
  private val tts = TextToSpeech(appContext, this)

  override fun onInit(status: Int) {
    ready = status == TextToSpeech.SUCCESS
    if (ready) pending?.let { (text, language) -> pending = null; speak(text, language) }
  }

  fun speak(text: String, language: String) {
    if (text.isBlank()) return
    if (!ready) { pending = text to language; return }
    if (!selectLanguage(language)) {
      // Do not let Android pronounce Urdu text with the previously selected
      // (usually English) voice. The user needs to install an Urdu TTS voice.
      showMissingUrduVoiceMessage()
      return
    }
    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "stepli-guidance")
  }

  /**
   * TextToSpeech may accept a locale but retain its previous voice. Confirm
   * that the selected voice is Urdu before allowing Urdu narration to play.
   */
  private fun selectLanguage(language: String): Boolean {
    if (!language.equals("ur", ignoreCase = true)) {
      return tts.setLanguage(Locale.US) >= TextToSpeech.LANG_AVAILABLE
    }
    val urduLocales = listOf(Locale.forLanguageTag("ur-PK"), Locale.forLanguageTag("ur"))
    return urduLocales.any { locale ->
      val result = tts.setLanguage(locale)
      result >= TextToSpeech.LANG_AVAILABLE && (tts.voice?.locale?.language?.equals("ur", ignoreCase = true) ?: true)
    }
  }

  private fun showMissingUrduVoiceMessage() {
    if (showedMissingUrduVoiceMessage) return
    showedMissingUrduVoiceMessage = true
    Toast.makeText(
      appContext,
      "اردو آواز کے لیے فون کی ٹیکسٹ ٹو اسپیچ سیٹنگز میں اردو (پاکستان) کی آواز انسٹال کریں۔",
      Toast.LENGTH_LONG,
    ).show()
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
