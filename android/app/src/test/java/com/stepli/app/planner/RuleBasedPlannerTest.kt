package com.stepli.app.planner

import com.stepli.app.models.GuidanceMemoryEntry
import com.stepli.app.models.ScreenModel
import com.stepli.app.models.UiElement
import com.stepli.app.models.UserGoal
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RuleBasedPlannerTest {
  private val planner = RuleBasedPlanner()
  private val goal = UserGoal("goal-1", "Order a pizza", 1L)

  @Test
  fun `selects a visible goal-related control`() {
    val plan = planner.plan(
      goal,
      screen(text = listOf("Restaurants"), elements = listOf(button("Pizza Palace"))),
      emptyList(),
    )

    assertEquals("Tap Pizza Palace.", plan.nextAction)
    assertEquals("Pizza Palace", plan.target?.text)
    assertEquals("local", plan.planner)
  }

  @Test
  fun `recommends recovery when navigation moves away from a more relevant screen`() {
    val memory = listOf(
      GuidanceMemoryEntry("Restaurant list", listOf("Pizza restaurants"), "", "Tap a restaurant.", 1L),
    )
    val plan = planner.plan(
      goal,
      screen(text = listOf("Account", "Preferences"), elements = listOf(button("Settings"))),
      memory,
    )

    assertTrue(plan.explanation.contains("does not appear to move you toward"))
    assertEquals("Press Back once to return to the previous screen.", plan.nextAction)
  }

  private fun screen(text: List<String>, elements: List<UiElement>) = ScreenModel(
    appPackage = "example.app",
    appName = "Example",
    screenText = text,
    elements = elements,
    scrollable = false,
  )

  private fun button(label: String) = UiElement(kind = "button", text = label, clickable = true)
}
