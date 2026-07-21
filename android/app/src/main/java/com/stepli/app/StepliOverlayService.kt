package com.stepli.app

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
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
import kotlin.math.abs

/** Renderer only. It does not and cannot interact with another app's UI. */
object StepliOverlayService {
  private var wm: WindowManager? = null
  private var panel: View? = null
  private var panelParams: WindowManager.LayoutParams? = null
  private var ring: HighlightRingView? = null
  private var step: OverlayStep? = null
  private var speaker: GuidanceSpeaker? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  private var pendingShow: Runnable? = null

  /**
   * Launching an app and drawing an overlay in the same instant can be unstable
   * on a first launch. Wait for the target app to own the foreground, then draw.
   */
  fun showAfterAppLaunch(context: Context, nextStep: OverlayStep, delayMs: Long = 450) {
    pendingShow?.let(mainHandler::removeCallbacks)
    val scheduled = Runnable {
      pendingShow = null
      show(context.applicationContext, nextStep)
    }
    pendingShow = scheduled
    mainHandler.postDelayed(scheduled, delayMs)
  }

  @Suppress("DEPRECATION")
  fun show(context: Context, nextStep: OverlayStep) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) return
    removeViews()
    step = nextStep
    wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      WindowManager.LayoutParams.TYPE_PHONE
    }
    val flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN

    // The highlight must never consume touches intended for the app underneath.
    ring = HighlightRingView(context)
    wm?.addView(ring, WindowManager.LayoutParams(-1, -1, type, flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE, -3))

    val card = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(context, 18), dp(context, 14), dp(context, 18), dp(context, 16))
      background = round(Color.rgb(168, 195, 160), dp(context, 22))
    }
    val header = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }
    header.addView(
      ImageView(context).apply {
        setImageResource(R.drawable.stepli_bot)
        scaleType = ImageView.ScaleType.FIT_CENTER
        contentDescription = "Stepli"
      },
      LinearLayout.LayoutParams(dp(context, 40), dp(context, 40)).apply {
        marginEnd = dp(context, 8)
      },
    )
    header.addView(TextView(context).apply {
      text = nextStep.progress
      setTextColor(Color.rgb(110, 139, 114))
      textSize = 13f
    }, LinearLayout.LayoutParams(0, -2, 1f))
    header.addView(TextView(context).apply {
      text = "⠿"
      textSize = 22f
      gravity = Gravity.CENTER
      setTextColor(Color.rgb(40, 68, 53))
      contentDescription = "Drag this handle to move Stepli guidance"
    }, LinearLayout.LayoutParams(dp(context, 32), dp(context, 36)))
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
      contentDescription = "Close guidance card. Tap the Stepli bubble to show it again."
      // Keep the bubble, highlight, and current guide running so “close” means
      // hide this dialog—not abandon the guide.
      setOnClickListener { card.visibility = View.GONE }
    }
    header.addView(minimize, LinearLayout.LayoutParams(dp(context, 34), dp(context, 36)))
    header.addView(close, LinearLayout.LayoutParams(dp(context, 36), dp(context, 36)))
    card.addView(header)
    card.addView(TextView(context).apply {
      text = nextStep.text
      setTextColor(Color.rgb(40, 68, 53))
      textSize = 17f
      setPadding(0, dp(context, 8), 0, dp(context, 12))
    })
    val isUrdu = nextStep.language.equals("ur", ignoreCase = true)
    val shouldSpeak = voiceEnabled(context)
    if (shouldSpeak) {
      val replayLabel = if (isUrdu) "🔊  یہ قدم سنیں" else "🔊  Read this step"
      card.addView(actionButton(context, replayLabel, Color.rgb(110, 139, 114)) {
        speaker?.speak(nextStep.spokenText, nextStep.language)
      })
    }
    if (nextStep.canGoBack) {
      val backLabel = if (isUrdu) "↩  پچھلا قدم دوبارہ سنیں" else "↩  Hear last step again"
      card.addView(
        actionButton(context, backLabel, Color.rgb(110, 139, 114)) {
          StepliOverlayModule.emit("stepliStepBack", nextStep.id)
        }.apply { (layoutParams as? LinearLayout.LayoutParams)?.topMargin = dp(context, 8) },
      )
    }
    card.addView(actionButton(context, "✓  ${nextStep.confirm}", Color.rgb(200, 109, 69)) {
      StepliAccessibilityService.emitStepConfirmed(nextStep.id)
    }.apply { (layoutParams as? LinearLayout.LayoutParams)?.topMargin = dp(context, 8) })

    val bubble = FrameLayout(context).apply {
      background = round(Color.rgb(168, 195, 160), dp(context, 28))
      contentDescription = "Show or hide Stepli guidance"
      setOnClickListener {
        card.visibility = if (card.visibility == View.VISIBLE) View.GONE else View.VISIBLE
      }
    }
    bubble.addView(ImageView(context).apply {
      setImageResource(R.drawable.stepli_bot)
      scaleType = ImageView.ScaleType.FIT_CENTER
    }, FrameLayout.LayoutParams(dp(context, 46), dp(context, 46), Gravity.CENTER))

    val container = DraggableOverlayPanel(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.END
      addView(card, LinearLayout.LayoutParams(dp(context, 300), -2).apply { bottomMargin = dp(context, 10) })
      addView(bubble, LinearLayout.LayoutParams(dp(context, 56), dp(context, 56)))
      onDrag = { dx, dy ->
        panelParams?.let { params ->
          params.x = params.x - dx
          params.y = params.y - dy
          try {
            wm?.updateViewLayout(this, params)
          } catch (_: IllegalArgumentException) {
          }
        }
      }
    }

    panel = container
    panelParams = WindowManager.LayoutParams(
      dp(context, 300),
      -2,
      type,
      flags or WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM,
      -3,
    ).apply {
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

  /**
   * Speaks guidance without showing the overlay card. Used for the in-app
   * “How to use Stepli” voice tour.
   */
  fun speakGuidance(context: Context, text: String, language: String) {
    if (text.isBlank() || !voiceEnabled(context)) return
    speaker = speaker ?: GuidanceSpeaker(context.applicationContext)
    speaker?.speak(text, language)
  }

  /** Stops speech without closing an active overlay navigator. */
  fun stopGuidanceSpeech() {
    speaker?.stop()
  }

  fun currentStep(): OverlayStep? = step

  /** Fully stops the guide: card, bubble, highlight, active step, and voice. */
  fun closeNavigator() {
    pendingShow?.let(mainHandler::removeCallbacks)
    pendingShow = null
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

  private fun voiceEnabled(context: Context) =
    context.getSharedPreferences("stepli", Context.MODE_PRIVATE).getBoolean("voiceGuidance", true)

  private fun round(color: Int, radius: Int) = GradientDrawable().apply {
    setColor(color)
    cornerRadius = radius.toFloat()
  }

  private fun dp(context: Context, value: Int) =
    (value * context.resources.displayMetrics.density).toInt()
}

/**
 * Drags the whole overlay (card + bubble). Clicks on buttons still work because
 * we only intercept after the finger moves past the touch slop.
 */
private class DraggableOverlayPanel(context: Context) : LinearLayout(context) {
  var onDrag: ((dx: Int, dy: Int) -> Unit)? = null

  private val slop = ViewConfiguration.get(context).scaledTouchSlop
  private var downRawX = 0f
  private var downRawY = 0f
  private var lastRawX = 0f
  private var lastRawY = 0f
  private var dragging = false

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        downRawX = ev.rawX
        downRawY = ev.rawY
        lastRawX = ev.rawX
        lastRawY = ev.rawY
        dragging = false
        return false
      }
      MotionEvent.ACTION_MOVE -> {
        if (!dragging && (abs(ev.rawX - downRawX) > slop || abs(ev.rawY - downRawY) > slop)) {
          dragging = true
          parent?.requestDisallowInterceptTouchEvent(true)
          return true
        }
      }
    }
    return false
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_MOVE -> {
        if (dragging) {
          val dx = (event.rawX - lastRawX).toInt()
          val dy = (event.rawY - lastRawY).toInt()
          lastRawX = event.rawX
          lastRawY = event.rawY
          onDrag?.invoke(dx, dy)
        }
        return true
      }
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        val wasDragging = dragging
        dragging = false
        return wasDragging
      }
    }
    return dragging
  }
}
