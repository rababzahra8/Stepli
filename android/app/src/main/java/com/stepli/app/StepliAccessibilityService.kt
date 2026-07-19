package com.stepli.app

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.graphics.Rect
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONObject

/** Reads only Foodpanda's accessibility tree; it never invokes performAction. */
class StepliAccessibilityService : AccessibilityService() {
  override fun onAccessibilityEvent(event: AccessibilityEvent) {
    if (event.packageName?.toString() != StepliOverlayModule.FOODPANDA_PACKAGE) {
      if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) StepliOverlayService.hide()
      return
    }
    val step = StepliOverlayService.currentStep() ?: return
    val matcher = parseMatcher(step.matcher)
    val target = findTarget(rootInActiveWindow, matcher) ?: return
    val bounds = Rect(); target.getBoundsInScreen(bounds)
    StepliOverlayService.highlight(bounds.left, bounds.top, bounds.right, bounds.bottom)
    if (event.eventType == AccessibilityEvent.TYPE_VIEW_CLICKED && matches(event.source, matcher)) {
      StepliOverlayModule.emit("stepliStepDetected", step.id)
    }
  }
  override fun onInterrupt() = Unit

  private fun parseMatcher(raw: String): Matcher = try {
    val json = JSONObject(raw)
    Matcher(json.optString("resourceId").takeIf { it.isNotBlank() }, json.optString("text").takeIf { it.isNotBlank() }, json.optString("contentDescription").takeIf { it.isNotBlank() })
  } catch (_: Exception) { Matcher(null, null, null) }
  private fun findTarget(node: AccessibilityNodeInfo?, matcher: Matcher): AccessibilityNodeInfo? {
    if (node == null) return null
    if (node.isVisibleToUser && matches(node, matcher)) return node
    for (index in 0 until node.childCount) findTarget(node.getChild(index), matcher)?.let { return it }
    return null
  }
  private fun matches(node: AccessibilityNodeInfo?, matcher: Matcher): Boolean {
    if (node == null) return false
    val resource = node.viewIdResourceName.orEmpty()
    val text = node.text?.toString().orEmpty()
    val description = node.contentDescription?.toString().orEmpty()
    val candidates = listOf(
      matcher.resourceId?.let { resource.contains(it, true) },
      matcher.text?.let { text.equals(it, true) },
      matcher.contentDescription?.let { description.equals(it, true) },
    )
    return candidates.any { it == true }
  }
  data class Matcher(val resourceId: String?, val text: String?, val contentDescription: String?)
  companion object {
    fun isEnabled(c: Context): Boolean = Settings.Secure.getString(c.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)?.contains(ComponentName(c, StepliAccessibilityService::class.java).flattenToString()) == true
    fun emitStepConfirmed(id: String) = StepliOverlayModule.emit("stepliStepDetected", id)
  }
}
