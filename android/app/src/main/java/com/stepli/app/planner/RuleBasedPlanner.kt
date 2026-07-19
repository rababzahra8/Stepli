package com.stepli.app.planner

import com.stepli.app.models.GuidanceMemoryEntry
import com.stepli.app.models.GuidancePlan
import com.stepli.app.models.GuidanceTarget
import com.stepli.app.models.ScreenModel
import com.stepli.app.models.UiElement
import com.stepli.app.models.UserGoal

/** Offline fallback. It uses generic relevance signals, never app- or screen-specific scripts. */
class RuleBasedPlanner : GuidancePlanner {
  override fun plan(goal: UserGoal, screen: ScreenModel, memory: List<GuidanceMemoryEntry>): GuidancePlan {
    val goalTerms = terms(goal.text)
    val candidates = screen.elements
      .filter { it.clickable && it.label() != null }
      .map { it to relevance(it.label().orEmpty(), goalTerms) }
      .sortedByDescending { it.second }
    val best = candidates.firstOrNull()
    val screenRelevance = relevance(screen.screenText.joinToString(" "), goalTerms)

    if (best != null && best.second > 0) {
      val label = best.first.label().orEmpty()
      return GuidancePlan(
        screen = screen.appName,
        confidence = 0.62,
        explanation = "This screen has an option related to your goal.",
        nextAction = "Tap $label.",
        reason = "Its label matches words in your goal.",
        target = targetFor(best.first),
        planner = "local",
      )
    }

    val previousWasMoreRelevant = memory.lastOrNull()?.let { previous ->
      relevance(previous.screenText.joinToString(" "), goalTerms) > screenRelevance
    } == true
    if (previousWasMoreRelevant && screenRelevance == 0) {
      return GuidancePlan(
        screen = screen.appName,
        confidence = 0.55,
        explanation = "This screen does not appear to move you toward ${goal.text}.",
        nextAction = "Press Back once to return to the previous screen.",
        reason = "The previous screen had more goal-related information.",
        planner = "local",
      )
    }

    val input = screen.elements.firstOrNull { it.editable }
    if (input != null) {
      val label = input.label()?.let { "the $it field" } ?: "the input field"
      return GuidancePlan(
        screen = screen.appName,
        confidence = 0.46,
        explanation = "You are on a screen where you can enter information for your goal.",
        nextAction = "Tap $label and enter the information needed to continue.",
        reason = "A visible input is available.",
        target = targetFor(input),
        planner = "local",
      )
    }

    if (screen.scrollable) {
      return GuidancePlan(
        screen = screen.appName,
        confidence = 0.38,
        explanation = "I cannot yet see an option that clearly matches ${goal.text}.",
        nextAction = "Scroll slowly and look for an option that directly mentions your goal.",
        reason = "The screen contains more content than is currently visible.",
        planner = "local",
      )
    }

    return GuidancePlan(
      screen = screen.appName,
      confidence = 0.25,
      explanation = "I cannot confirm that this screen supports ${goal.text}.",
      nextAction = "Use Back to return to a screen with options related to your goal.",
      reason = "No visible control has a strong connection to the goal.",
      planner = "local",
    )
  }

  private fun terms(text: String): Set<String> = text.lowercase()
    .split(Regex("[^\\p{L}\\p{N}]+"))
    .filter { it.length > 2 && it !in STOP_WORDS }
    .toSet()

  private fun relevance(text: String, goalTerms: Set<String>): Int {
    val textTerms = terms(text)
    return goalTerms.count { goalTerm -> textTerms.any { it == goalTerm || it.contains(goalTerm) || goalTerm.contains(it) } }
  }

  private fun targetFor(element: UiElement): GuidanceTarget = GuidanceTarget(
    text = element.label(),
    resourceId = element.resourceId,
  )

  private companion object {
    val STOP_WORDS = setOf("the", "and", "for", "with", "from", "that", "this", "help", "want", "need", "please")
  }
}
