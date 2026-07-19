package com.stepli.app.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import com.stepli.app.StepliOverlayModule
import com.stepli.app.StepliOverlayService
import com.stepli.app.models.GuidancePlan
import com.stepli.app.models.ScreenModel
import com.stepli.app.parser.AccessibilityScreenParser
import com.stepli.app.planner.GuidanceEngine
import com.stepli.app.speech.GuidanceSpeaker
import java.util.concurrent.Executors

/**
 * Reads whichever foreground app the user is using while a goal is active. It only renders
 * guidance/highlights; it never calls performAction, types, or navigates for the user.
 */
class StepliAccessibilityService : AccessibilityService() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val planningExecutor = Executors.newSingleThreadExecutor()
  private lateinit var parser: AccessibilityScreenParser
  private lateinit var engine: GuidanceEngine
  private lateinit var speaker: GuidanceSpeaker
  private var lastFingerprint = ""
  private var currentPlan: GuidancePlan? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    parser = AccessibilityScreenParser(applicationContext)
    engine = GuidanceEngine(applicationContext)
    speaker = GuidanceSpeaker(applicationContext)
    activeService = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent) {
    if (!::engine.isInitialized || engine.activeGoal() == null) {
      StepliOverlayService.hide()
      return
    }
    if (event.packageName?.toString() == packageName) return
    if (event.eventType !in RELEVANT_EVENTS) return
    val root = rootInActiveWindow ?: return
    val screen = parser.parse(root)
    // The goal id lets a newly started goal plan immediately even on an unchanged screen.
    val fingerprint = "${engine.activeGoal()?.id}:${screen.fingerprint()}"
    if (fingerprint == lastFingerprint) return
    lastFingerprint = fingerprint

    planningExecutor.execute {
      val plan = engine.plan(screen) ?: return@execute
      mainHandler.post {
        if (engine.activeGoal() == null) return@post
        render(screen, plan)
      }
    }
  }

  private fun render(screen: ScreenModel, plan: GuidancePlan) {
    currentPlan = plan
    StepliOverlayService.show(applicationContext, plan)
    plan.target?.findIn(screen.elements)?.bounds?.let { bounds ->
      StepliOverlayService.highlight(bounds.left, bounds.top, bounds.right, bounds.bottom)
    } ?: StepliOverlayService.clearHighlight()
    speaker.speak(plan)
    StepliOverlayModule.emit("stepliGuidanceUpdated", plan.toEventJson())
  }

  private fun GuidancePlan.toEventJson(): String = org.json.JSONObject().apply {
    put("screen", screen)
    put("confidence", confidence)
    put("explanation", explanation)
    put("nextAction", nextAction)
    put("planner", planner)
    put("isGoalComplete", isGoalComplete)
  }.toString()

  fun repeatGuidance() { currentPlan?.let(speaker::speak) }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    if (activeService === this) activeService = null
    planningExecutor.shutdownNow()
    if (::speaker.isInitialized) speaker.shutdown()
    StepliOverlayService.hide()
    super.onDestroy()
  }

  companion object {
    private val RELEVANT_EVENTS = setOf(
      AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
      AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      AccessibilityEvent.TYPE_VIEW_CLICKED,
    )
    @Volatile private var activeService: StepliAccessibilityService? = null

    fun isEnabled(context: Context): Boolean = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    )?.contains(ComponentName(context, StepliAccessibilityService::class.java).flattenToString()) == true

    fun repeatCurrentGuidance() = activeService?.repeatGuidance()
  }
}
