package com.stepli.app.models

data class UserGoal(
  val id: String,
  val text: String,
  val createdAtMillis: Long,
)

data class GuidanceTarget(
  val text: String? = null,
  val resourceId: String? = null,
) {
  fun findIn(elements: List<UiElement>): UiElement? = elements.firstOrNull { element ->
    val textMatches = text?.let { target ->
      element.label()?.contains(target, ignoreCase = true) == true
    } ?: false
    val idMatches = resourceId?.let { target ->
      element.resourceId?.contains(target, ignoreCase = true) == true
    } ?: false
    textMatches || idMatches
  }
}

data class GuidancePlan(
  val screen: String,
  val confidence: Double,
  val explanation: String,
  val nextAction: String,
  val reason: String,
  val target: GuidanceTarget? = null,
  val isGoalComplete: Boolean = false,
  val planner: String,
)

data class GuidanceMemoryEntry(
  val screen: String,
  val screenText: List<String>,
  val explanation: String,
  val nextAction: String,
  val timestampMillis: Long,
)

enum class PlannerMode(val value: String) {
  LOCAL("local"),
  GPT("gpt");

  companion object {
    fun from(value: String?): PlannerMode = entries.firstOrNull { it.value == value } ?: LOCAL
  }
}
