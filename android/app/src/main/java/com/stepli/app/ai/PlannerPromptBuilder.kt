package com.stepli.app.ai

import com.stepli.app.models.GuidanceMemoryEntry
import com.stepli.app.models.ScreenModel
import com.stepli.app.models.UserGoal
import org.json.JSONArray
import org.json.JSONObject

/** Builds a constrained JSON request for the OpenAI Responses API. */
object PlannerPromptBuilder {
  fun build(model: String, goal: UserGoal, screen: ScreenModel, memory: List<GuidanceMemoryEntry>): JSONObject {
    val context = JSONObject().apply {
      put("goal", goal.text)
      put("currentUi", screen.toJson())
      put("recentGuidance", JSONArray().apply {
        memory.takeLast(5).forEach { entry ->
          put(JSONObject().apply {
            put("screen", entry.screen)
            put("screenText", JSONArray(entry.screenText))
            put("lastInstruction", entry.nextAction)
          })
        }
      })
    }
    val instructions = """
      You are Stepli's safety-first Android guidance planner. Decide the single safest next user action from the goal and the privacy-filtered visible UI. Do not assume a scripted app flow. Adapt if the screen is unrelated or the user has gone off course; when appropriate recommend pressing Back. Never claim an element exists unless it is present in currentUi. Never ask the user to share passwords, payment details, or codes. Do not perform actions and do not give more than one next action. Return only JSON that satisfies the schema.
    """.trimIndent()
    return JSONObject().apply {
      put("model", model)
      put("input", JSONArray().put(message("developer", instructions)).put(message("user", context.toString())))
      put("text", JSONObject().put("format", JSONObject().apply {
        put("type", "json_schema")
        put("name", "stepli_guidance_plan")
        put("strict", true)
        put("schema", RESPONSE_SCHEMA)
      }))
      // A small bounded response keeps screen updates fast and prevents long narration.
      put("max_output_tokens", 350)
    }
  }

  private fun message(role: String, text: String): JSONObject = JSONObject().apply {
    put("role", role)
    put("content", JSONArray().put(JSONObject().put("type", "input_text").put("text", text)))
  }

  private val RESPONSE_SCHEMA = JSONObject("""
    {
      "type":"object",
      "additionalProperties":false,
      "required":["screen","confidence","explanation","nextAction","reason","isGoalComplete","target"],
      "properties":{
        "screen":{"type":"string"},
        "confidence":{"type":"number","minimum":0,"maximum":1},
        "explanation":{"type":"string"},
        "nextAction":{"type":"string"},
        "reason":{"type":"string"},
        "isGoalComplete":{"type":"boolean"},
        "target":{
          "anyOf":[
            {"type":"null"},
            {"type":"object","additionalProperties":false,"required":["text","resourceId"],"properties":{"text":{"anyOf":[{"type":"string"},{"type":"null"}]},"resourceId":{"anyOf":[{"type":"string"},{"type":"null"}]}}}
          ]
        }
      }
    }
  """)
}
