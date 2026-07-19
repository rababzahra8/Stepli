package com.stepli.app.speech

import android.content.Context
import android.speech.tts.TextToSpeech
import com.stepli.app.models.GuidancePlan
import com.stepli.app.repository.GuidanceRepository
import java.util.Locale

/** Speaks only the planner's explanation and one next action. */
class GuidanceSpeaker(context: Context) : TextToSpeech.OnInitListener {
  private val appContext = context.applicationContext
  private val repository = GuidanceRepository(appContext)
  private var ready = false
  private var pendingPlan: GuidancePlan? = null
  private val tts = TextToSpeech(appContext, this)

  override fun onInit(status: Int) {
    ready = status == TextToSpeech.SUCCESS
    if (ready) {
      tts.language = Locale.getDefault()
      pendingPlan?.let { plan -> pendingPlan = null; speak(plan) }
    }
  }

  fun speak(plan: GuidancePlan) {
    if (!repository.voiceEnabled()) return
    if (!ready) { pendingPlan = plan; return }
    val utterance = "${plan.explanation} Next action: ${plan.nextAction}"
    tts.speak(utterance, TextToSpeech.QUEUE_FLUSH, null, "stepli-guidance")
  }

  fun shutdown() = tts.shutdown()
}
