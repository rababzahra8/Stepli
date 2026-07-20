package com.stepli.app

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/** Renderer only. It does not and cannot interact with another app's UI. */
object StepliOverlayService {
  private var wm: WindowManager? = null
  private var panel: View? = null
  private var panelParams: WindowManager.LayoutParams? = null
  private var ring: HighlightRingView? = null
  private var step: OverlayStep? = null
  private var speaker: GuidanceSpeaker? = null

  @Suppress("DEPRECATION")
  fun show(context: Context, nextStep: OverlayStep) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) return
    removeViews()
    step = nextStep
    wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE
    val flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN

    // The highlight must never consume touches intended for the app underneath.
    ring = HighlightRingView(context)
    wm?.addView(ring, WindowManager.LayoutParams(-1, -1, type, flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE, -3))

    val card = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(context, 22), dp(context, 18), dp(context, 22), dp(context, 18))
      background = round(Color.rgb(168, 195, 160), dp(context, 22))
    }
    val header = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
    header.addView(TextView(context).apply {
      text = nextStep.progress
      setTextColor(Color.rgb(110, 139, 114))
      textSize = 13f
    }, LinearLayout.LayoutParams(0, -2, 1f))
    val minimize = TextView(context).apply {
      text = "−"
      textSize = 26f
      gravity = Gravity.CENTER
      setTextColor(Color.rgb(40, 68, 53))
      contentDescription = "Minimize guidance card"
      setOnClickListener { card.visibility = View.GONE }
    }
    val close = TextView(context).apply {
      text = "×"
      textSize = 28f
      gravity = Gravity.CENTER
      setTextColor(Color.rgb(40, 68, 53))
      contentDescription = "Close navigator completely"
      setOnClickListener { closeNavigator() }
    }
    header.addView(minimize, LinearLayout.LayoutParams(dp(context, 34), dp(context, 36)))
    header.addView(close, LinearLayout.LayoutParams(dp(context, 36), dp(context, 36)))
    card.addView(header)
    card.addView(TextView(context).apply {
      text = nextStep.text
      setTextColor(Color.rgb(40, 68, 53))
      textSize = 18f
      setPadding(0, dp(context, 8), 0, dp(context, 12))
    })
    val shouldSpeak = voiceEnabled(context)
    if (shouldSpeak) {
      val replayLabel = if (nextStep.language.equals("ur", ignoreCase = true)) "🔊  یہ قدم سنیں" else "🔊  Hear this step"
      card.addView(actionButton(context, replayLabel, Color.rgb(110, 139, 114)) {
        speaker?.speak(nextStep.spokenText, nextStep.language)
      })
    }
    card.addView(actionButton(context, "✓  ${nextStep.confirm}", Color.rgb(200, 109, 69)) {
      StepliAccessibilityService.emitStepConfirmed(nextStep.id)
    }.apply { (layoutParams as? LinearLayout.LayoutParams)?.topMargin = dp(context, 8) })

    val bubble = FrameLayout(context).apply {
      background = round(Color.rgb(168, 195, 160), dp(context, 28))
      contentDescription = "Show or hide Stepli guidance"
    }
    bubble.addView(ImageView(context).apply {
      setImageResource(R.drawable.stepli_bot)
      scaleType = ImageView.ScaleType.FIT_CENTER
    }, FrameLayout.LayoutParams(dp(context, 46), dp(context, 46), Gravity.CENTER))
    val container = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.END
      addView(card, LinearLayout.LayoutParams(dp(context, 300), -2).apply { bottomMargin = dp(context, 10) })
      addView(bubble, LinearLayout.LayoutParams(dp(context, 56), dp(context, 56)))
    }

    val slop = ViewConfiguration.get(context).scaledTouchSlop
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    var moved = false
    bubble.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          downX = event.rawX
          downY = event.rawY
          startX = panelParams?.x ?: 0
          startY = panelParams?.y ?: 0
          moved = false
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = event.rawX - downX
          val dy = event.rawY - downY
          if (!moved && (kotlin.math.abs(dx) > slop || kotlin.math.abs(dy) > slop)) moved = true
          if (moved) panelParams?.let { params ->
            params.x = startX - dx.toInt()
            params.y = startY - dy.toInt()
            try { wm?.updateViewLayout(container, params) } catch (_: IllegalArgumentException) { }
          }
          true
        }
        MotionEvent.ACTION_UP -> {
          if (!moved) card.visibility = if (card.visibility == View.VISIBLE) View.GONE else View.VISIBLE
          true
        }
        else -> true
      }
    }

    panel = container
    panelParams = WindowManager.LayoutParams(dp(context, 300), -2, type, flags or WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM, -3).apply {
      gravity = Gravity.BOTTOM or Gravity.END
      x = dp(context, 18)
      y = dp(context, 32)
    }
    wm?.addView(container, panelParams)

    if (shouldSpeak) {
      speaker = speaker ?: GuidanceSpeaker(context)
      speaker?.speak(nextStep.spokenText, nextStep.language)
    }
  }

  fun highlight(left: Int, top: Int, right: Int, bottom: Int) = ring?.setBounds(left, top, right, bottom)
  fun clearHighlight() = ring?.clear()
  fun stopSpeech() = speaker?.stop()

  fun currentStep(): OverlayStep? = step

  /** Fully stops the guide: card, bubble, highlight, active step, and voice. */
  fun closeNavigator() {
    removeViews()
    speaker?.shutdown()
    speaker = null
    StepliOverlayModule.emit("stepliNavigatorClosed", "")
  }

  /** Legacy alias kept for callers that used hide before the close control existed. */
  fun hide() = closeNavigator()

  private fun removeViews() {
    panel?.let { view -> try { wm?.removeView(view) } catch (_: IllegalArgumentException) { } }
    ring?.let { view -> try { wm?.removeView(view) } catch (_: IllegalArgumentException) { } }
    panel = null
    panelParams = null
    ring = null
    step = null
    speaker?.stop()
  }

  private fun actionButton(context: Context, label: String, color: Int, onClick: () -> Unit): TextView = TextView(context).apply {
    text = label
    setTextColor(Color.WHITE)
    textSize = 16f
    gravity = Gravity.CENTER
    setPadding(dp(context, 14), dp(context, 13), dp(context, 14), dp(context, 13))
    background = round(color, dp(context, 14))
    setOnClickListener { onClick() }
    layoutParams = LinearLayout.LayoutParams(-1, -2)
  }

  private fun voiceEnabled(context: Context) = context.getSharedPreferences("stepli", Context.MODE_PRIVATE).getBoolean("voiceGuidance", true)
  private fun round(color: Int, radius: Int) = GradientDrawable().apply { setColor(color); cornerRadius = radius.toFloat() }
  private fun dp(context: Context, value: Int) = (value * context.resources.displayMetrics.density).toInt()
}
