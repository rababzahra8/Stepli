package com.stepli.app

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.graphics.Rect
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject

/**
 * Reads only the active tutorial's app accessibility tree. It never invokes
 * performAction, so the person remains in control of every tap and purchase.
 */
class StepliAccessibilityService : AccessibilityService() {
  override fun onAccessibilityEvent(event: AccessibilityEvent) {
    val activeStep = StepliOverlayService.currentStep() ?: return
    if (event.packageName?.toString() != activeStep.targetPackage) return

    val matcher = parseMatcher(activeStep.matcher)
    val target = findTarget(rootInActiveWindow, matcher) ?: run {
      StepliOverlayService.clearHighlight()
      return
    }
    val bounds = Rect()
    target.getBoundsInScreen(bounds)
    StepliOverlayService.highlight(bounds.left, bounds.top, bounds.right, bounds.bottom)
    if (event.eventType == AccessibilityEvent.TYPE_VIEW_CLICKED && matches(event.source, matcher)) {
      StepliOverlayModule.emit("stepliStepDetected", activeStep.id)
    }
  }

  override fun onInterrupt() = Unit

  private fun parseMatcher(raw: String): Matcher = try {
    val json = JSONObject(raw)
    Matcher(
      readValues(json, "resourceId"),
      readValues(json, "text"),
      readValues(json, "contentDescription"),
    )
  } catch (_: Exception) {
    Matcher(emptyList(), emptyList(), emptyList())
  }

  private fun readValues(json: JSONObject, key: String): List<String> {
    if (!json.has(key)) return emptyList()
    return when (val value = json.opt(key)) {
      is JSONArray -> buildList { for (index in 0 until value.length()) value.optString(index).trim().takeIf { it.isNotBlank() }?.let(::add) }
      else -> value?.toString()?.trim()?.takeIf { it.isNotBlank() }?.let(::listOf).orEmpty()
    }
  }

  private fun findTarget(node: AccessibilityNodeInfo?, matcher: Matcher): AccessibilityNodeInfo? {
    if (node == null) return null
    if (node.isVisibleToUser && matches(node, matcher)) return node
    for (index in 0 until node.childCount) findTarget(node.getChild(index), matcher)?.let { return it }
    return null
  }

  private fun matches(node: AccessibilityNodeInfo?, matcher: Matcher): Boolean {
    if (node == null || matcher.isEmpty()) return false
    val resource = node.viewIdResourceName.orEmpty()
    val text = node.text?.toString().orEmpty()
    val description = node.contentDescription?.toString().orEmpty()
    return matcher.resourceIds.any { resource.contains(it, ignoreCase = true) } ||
      matcher.texts.any { text.equals(it, ignoreCase = true) || text.contains(it, ignoreCase = true) } ||
      matcher.contentDescriptions.any { description.equals(it, ignoreCase = true) || description.contains(it, ignoreCase = true) }
  }

  data class Matcher(
    val resourceIds: List<String>,
    val texts: List<String>,
    val contentDescriptions: List<String>,
  ) {
    fun isEmpty() = resourceIds.isEmpty() && texts.isEmpty() && contentDescriptions.isEmpty()
  }

  companion object {
    fun isEnabled(context: Context): Boolean = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
      ?.contains(ComponentName(context, StepliAccessibilityService::class.java).flattenToString()) == true

    fun emitStepConfirmed(id: String) = StepliOverlayModule.emit("stepliStepDetected", id)
  }
}
