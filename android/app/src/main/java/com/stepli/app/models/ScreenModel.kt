package com.stepli.app.models

import org.json.JSONArray
import org.json.JSONObject

/** A privacy-filtered, app-agnostic description of the visible accessibility UI. */
data class UiElement(
  val kind: String,
  val text: String? = null,
  val contentDescription: String? = null,
  val resourceId: String? = null,
  val clickable: Boolean = false,
  val editable: Boolean = false,
  val scrollable: Boolean = false,
  val bounds: ElementBounds? = null,
) {
  fun label(): String? = listOf(text, contentDescription, resourceId?.substringAfterLast('/'))
    .firstOrNull { !it.isNullOrBlank() }

  fun toJson(): JSONObject = JSONObject().apply {
    put("kind", kind)
    label()?.let { put("label", it) }
    // Resource ids are useful for stable targets, but never include an input value.
    resourceId?.let { put("resourceId", it) }
    put("clickable", clickable)
    put("editable", editable)
    put("scrollable", scrollable)
  }
}

data class ElementBounds(val left: Int, val top: Int, val right: Int, val bottom: Int)

data class ScreenModel(
  val appPackage: String,
  val appName: String,
  val screenText: List<String>,
  val elements: List<UiElement>,
  val scrollable: Boolean,
) {
  val buttons: List<String>
    get() = elements.filter { it.kind == "button" }.mapNotNull { it.label() }.distinct()

  val inputs: List<String>
    get() = elements.filter { it.kind == "input" }.map { it.label() ?: "Input field" }.distinct()

  /** Used for debouncing repeated accessibility events; no user-entered input is present. */
  fun fingerprint(): String = listOf(
    appPackage,
    screenText.joinToString("|"),
    elements.mapNotNull { it.label() }.joinToString("|"),
    scrollable,
  ).joinToString("#").take(2_000)

  fun toJson(): JSONObject = JSONObject().apply {
    put("app", appName)
    put("appPackage", appPackage)
    put("screenText", JSONArray(screenText))
    put("buttons", JSONArray(buttons))
    put("inputs", JSONArray(inputs))
    put("scrollable", scrollable)
    put("elements", JSONArray().apply { elements.forEach { put(it.toJson()) } })
  }
}
