package com.stepli.app

/** A single, read-only tutorial instruction rendered over another app. */
data class OverlayStep(
  val id: String,
  val text: String,
  val confirm: String,
  val progress: String,
  val matcher: String,
  val targetPackage: String,
  val language: String,
  val spokenText: String,
  /** When true, the card shows “hear last step again” (go back one step). */
  val canGoBack: Boolean = false,
)
