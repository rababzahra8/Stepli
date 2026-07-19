package com.stepli.app.ai

import com.stepli.app.models.GuidancePlan
import com.stepli.app.models.GuidanceTarget
import org.json.JSONArray
import org.json.JSONObject

/** Parses only the structured model result, with bounded text for the overlay and TTS. */
object GuidanceResponseParser {
  fun parse(responseBody: String): GuidancePlan {
    val response = JSONObject(responseBody)
    val plan = JSONObject(extractOutputText(response))
    val target = plan.optJSONObject("target")?.let {
      GuidanceTarget(
        text = it.optString("text").takeIf(String::isNotBlank),
        resourceId = it.optString("resourceId").takeIf(String::isNotBlank),
      )
    }
    return GuidancePlan(
      screen = bounded(plan.optString("screen"), "Current screen", 80),
      confidence = plan.optDouble("confidence", 0.0).coerceIn(0.0, 1.0),
      explanation = bounded(plan.optString("explanation"), "I am checking this screen.", 260),
      nextAction = bounded(plan.optString("nextAction"), "Wait for the next screen update.", 220),
      reason = bounded(plan.optString("reason"), "AI planner", 220),
      target = target,
      isGoalComplete = plan.optBoolean("isGoalComplete", false),
      planner = "gpt",
    )
  }

  private fun extractOutputText(response: JSONObject): String {
    response.optString("output_text").takeIf { it.isNotBlank() }?.let { return it }
    val output = response.optJSONArray("output") ?: throw IllegalArgumentException("No planner output")
    for (itemIndex in 0 until output.length()) {
      val content = output.optJSONObject(itemIndex)?.optJSONArray("content") ?: continue
      for (contentIndex in 0 until content.length()) {
        val item = content.optJSONObject(contentIndex) ?: continue
        item.optString("text").takeIf { it.isNotBlank() }?.let { return it }
      }
    }
    throw IllegalArgumentException("No structured planner message")
  }

  private fun bounded(value: String, fallback: String, max: Int): String = value
    .replace(Regex("\\s+"), " ")
    .trim()
    .take(max)
    .ifBlank { fallback }
}
