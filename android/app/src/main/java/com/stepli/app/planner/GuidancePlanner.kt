package com.stepli.app.planner

import com.stepli.app.models.GuidanceMemoryEntry
import com.stepli.app.models.GuidancePlan
import com.stepli.app.models.ScreenModel
import com.stepli.app.models.UserGoal

/** Common contract for remote and local planners. Neither planner can perform UI actions. */
interface GuidancePlanner {
  fun plan(goal: UserGoal, screen: ScreenModel, memory: List<GuidanceMemoryEntry>): GuidancePlan
}
