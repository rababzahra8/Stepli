package com.stepli.app.repository

import android.content.Context
import com.stepli.app.models.GuidanceMemoryEntry
import com.stepli.app.models.GuidancePlan
import com.stepli.app.models.PlannerMode
import com.stepli.app.models.ScreenModel
import com.stepli.app.models.UserGoal
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/** Persistent session state. It intentionally stores summaries, not raw accessibility trees. */
class GuidanceRepository(context: Context) {
  private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun startGoal(text: String): UserGoal {
    val goal = UserGoal(UUID.randomUUID().toString(), text.trim(), System.currentTimeMillis())
    prefs.edit()
      .putBoolean(KEY_ACTIVE, true)
      .putString(KEY_GOAL_ID, goal.id)
      .putString(KEY_GOAL_TEXT, goal.text)
      .putLong(KEY_GOAL_CREATED, goal.createdAtMillis)
      .remove(KEY_MEMORY)
      .apply()
    return goal
  }

  fun activeGoal(): UserGoal? {
    if (!prefs.getBoolean(KEY_ACTIVE, false)) return null
    val text = prefs.getString(KEY_GOAL_TEXT, null)?.trim().orEmpty()
    if (text.isBlank()) return null
    return UserGoal(
      prefs.getString(KEY_GOAL_ID, "restored-goal") ?: "restored-goal",
      text,
      prefs.getLong(KEY_GOAL_CREATED, 0L),
    )
  }

  fun stopGoal() = prefs.edit().putBoolean(KEY_ACTIVE, false).remove(KEY_MEMORY).apply()

  fun plannerMode(): PlannerMode = PlannerMode.from(prefs.getString(KEY_PLANNER_MODE, null))
  fun setPlannerMode(mode: PlannerMode) = prefs.edit().putString(KEY_PLANNER_MODE, mode.value).apply()

  fun voiceEnabled(): Boolean = prefs.getBoolean(KEY_VOICE, true)
  fun setVoiceEnabled(enabled: Boolean) = prefs.edit().putBoolean(KEY_VOICE, enabled).apply()

  fun memory(): List<GuidanceMemoryEntry> = try {
    val data = JSONArray(prefs.getString(KEY_MEMORY, "[]"))
    buildList {
      for (index in 0 until data.length()) {
        val item = data.getJSONObject(index)
        add(
          GuidanceMemoryEntry(
            screen = item.optString("screen"),
            screenText = item.optJSONArray("screenText")?.toStringList().orEmpty(),
            explanation = item.optString("explanation"),
            nextAction = item.optString("nextAction"),
            timestampMillis = item.optLong("timestamp"),
          ),
        )
      }
    }
  } catch (_: Exception) {
    emptyList()
  }

  fun remember(screen: ScreenModel, plan: GuidancePlan) {
    val entries = memory().takeLast(MAX_MEMORY - 1).toMutableList()
    entries += GuidanceMemoryEntry(
      screen = plan.screen,
      screenText = screen.screenText.take(12),
      explanation = plan.explanation,
      nextAction = plan.nextAction,
      timestampMillis = System.currentTimeMillis(),
    )
    val json = JSONArray().apply {
      entries.forEach { entry ->
        put(JSONObject().apply {
          put("screen", entry.screen)
          put("screenText", JSONArray(entry.screenText))
          put("explanation", entry.explanation)
          put("nextAction", entry.nextAction)
          put("timestamp", entry.timestampMillis)
        })
      }
    }
    prefs.edit().putString(KEY_MEMORY, json.toString()).apply()
  }

  private fun JSONArray.toStringList(): List<String> = buildList {
    for (index in 0 until length()) optString(index).takeIf { it.isNotBlank() }?.let(::add)
  }

  private companion object {
    const val PREFS = "stepli_guidance"
    const val KEY_ACTIVE = "active"
    const val KEY_GOAL_ID = "goal_id"
    const val KEY_GOAL_TEXT = "goal_text"
    const val KEY_GOAL_CREATED = "goal_created"
    const val KEY_MEMORY = "memory"
    const val KEY_PLANNER_MODE = "planner_mode"
    const val KEY_VOICE = "voice"
    const val MAX_MEMORY = 8
  }
}
