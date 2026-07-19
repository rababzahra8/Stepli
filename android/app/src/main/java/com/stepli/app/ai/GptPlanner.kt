package com.stepli.app.ai

import com.stepli.app.BuildConfig
import com.stepli.app.models.GuidanceMemoryEntry
import com.stepli.app.models.GuidancePlan
import com.stepli.app.models.ScreenModel
import com.stepli.app.models.UserGoal
import com.stepli.app.planner.GuidancePlanner
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.URL
import javax.net.ssl.HttpsURLConnection

class PlannerUnavailableException(message: String) : IllegalStateException(message)

/**
 * OpenAI-compatible remote planner. The API key is a build-time secret for development;
 * production builds should point STEPLI_AI_ENDPOINT at an authenticated server-side gateway.
 */
class GptPlanner(
  private val apiKey: String = BuildConfig.STEPLI_OPENAI_API_KEY,
  private val endpoint: String = BuildConfig.STEPLI_AI_ENDPOINT,
  private val model: String = BuildConfig.STEPLI_AI_MODEL,
) : GuidancePlanner {
  fun isAvailable(): Boolean = apiKey.isNotBlank() && endpoint.startsWith("https://") && model.isNotBlank()

  override fun plan(goal: UserGoal, screen: ScreenModel, memory: List<GuidanceMemoryEntry>): GuidancePlan {
    if (!isAvailable()) throw PlannerUnavailableException("GPT planner is not configured")
    val connection = (URL(endpoint).openConnection() as? HttpsURLConnection)
      ?: throw PlannerUnavailableException("GPT endpoint must use HTTPS")
    return try {
      connection.requestMethod = "POST"
      connection.connectTimeout = CONNECT_TIMEOUT_MS
      connection.readTimeout = READ_TIMEOUT_MS
      connection.doOutput = true
      connection.setRequestProperty("Authorization", "Bearer $apiKey")
      connection.setRequestProperty("Content-Type", "application/json")
      val request = PlannerPromptBuilder.build(model, goal, screen, memory).toString()
      OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(request) }
      val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
      val response = stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
      if (connection.responseCode !in 200..299) {
        throw PlannerUnavailableException("GPT planner request failed (${connection.responseCode})")
      }
      GuidanceResponseParser.parse(response)
    } finally {
      connection.disconnect()
    }
  }

  private companion object {
    const val CONNECT_TIMEOUT_MS = 8_000
    const val READ_TIMEOUT_MS = 12_000
  }
}
