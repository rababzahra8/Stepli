package com.stepli.app.parser

import android.content.Context
import android.graphics.Rect
import android.view.accessibility.AccessibilityNodeInfo
import com.stepli.app.models.ElementBounds
import com.stepli.app.models.ScreenModel
import com.stepli.app.models.UiElement

/** Converts a visible accessibility tree into a compact model shared by every planner. */
class AccessibilityScreenParser(private val context: Context) {
  fun parse(root: AccessibilityNodeInfo): ScreenModel {
    val packageName = root.packageName?.toString().orEmpty()
    val screenText = linkedSetOf<String>()
    val elements = mutableListOf<UiElement>()
    var isScrollable = false

    fun visit(node: AccessibilityNodeInfo?) {
      if (node == null || !node.isVisibleToUser) return
      val editable = node.isEditable
      val password = node.isPassword
      // Typed text and passwords are deliberately excluded from the model and network prompt.
      val text = if (editable || password) null else clean(node.text?.toString())
      val description = clean(node.contentDescription?.toString())
      val resourceId = clean(node.viewIdResourceName)
      val kind = when {
        editable -> "input"
        node.isScrollable -> "list"
        node.isClickable || node.className?.toString()?.contains("Button", true) == true -> "button"
        else -> "text"
      }
      val hasMeaningfulData = text != null || description != null || resourceId != null || editable || node.isScrollable
      if (hasMeaningfulData) {
        val rect = Rect().also(node::getBoundsInScreen)
        elements += UiElement(
          kind = kind,
          text = text,
          contentDescription = description,
          resourceId = resourceId,
          clickable = node.isClickable,
          editable = editable,
          scrollable = node.isScrollable,
          bounds = ElementBounds(rect.left, rect.top, rect.right, rect.bottom),
        )
      }
      text?.let(screenText::add)
      description?.let(screenText::add)
      isScrollable = isScrollable || node.isScrollable
      for (index in 0 until node.childCount) visit(node.getChild(index))
    }

    visit(root)
    return ScreenModel(
      appPackage = packageName,
      appName = appLabel(packageName),
      screenText = screenText.take(MAX_SCREEN_TEXT),
      elements = elements.take(MAX_ELEMENTS),
      scrollable = isScrollable,
    )
  }

  private fun appLabel(packageName: String): String = try {
    val info = context.packageManager.getApplicationInfo(packageName, 0)
    context.packageManager.getApplicationLabel(info).toString()
  } catch (_: Exception) {
    packageName.substringAfterLast('.').ifBlank { "Unknown app" }
  }

  private fun clean(value: String?): String? = value
    ?.replace(Regex("\\s+"), " ")
    ?.trim()
    ?.take(MAX_LABEL_LENGTH)
    ?.takeIf { it.isNotBlank() }

  private companion object {
    const val MAX_SCREEN_TEXT = 60
    const val MAX_ELEMENTS = 80
    const val MAX_LABEL_LENGTH = 120
  }
}
