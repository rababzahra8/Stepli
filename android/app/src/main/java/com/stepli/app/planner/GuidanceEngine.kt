package com.stepli.app.planner

import android.content.Context
import com.stepli.app.ai.GptPlanner
import com.stepli.app.models.GuidancePlan
import com.stepli.app.models.PlannerMode
import com.stepli.app.models.ScreenModel
import com.stepli.app.repository.GuidanceRepository

/** Selects a planner per privacy mode and falls back locally if remote planning is unavailable. */
class GuidanceEngine(context: Context) {
  private val repository = GuidanceRepository(context)
  private val localPlanner = RuleBasedPlanner()
  private val gptPlanner = GptPlanner()

  fun activeGoal() = repository.activeGoal()
  fun isGptAvailable(): Boolean = gptPlanner.isAvailable()

  fun plan(screen: ScreenModel): GuidancePlan? {
    val goal = repository.activeGoal() ?: return null
    val memory = repository.memory()
    val requestedMode = repository.plannerMode()
    val plan = if (requestedMode == PlannerMode.GPT) {
      try {
        gptPlanner.plan(goal, screen, memory)
      } catch (_: Exception) {
        localPlanner.plan(goal, screen, memory)
      }
    } else {
      localPlanner.plan(goal, screen, memory)
    }
    repository.remember(screen, plan)
    return plan
  }
}
