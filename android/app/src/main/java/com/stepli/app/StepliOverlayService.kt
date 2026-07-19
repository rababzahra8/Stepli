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
import android.widget.LinearLayout
import android.widget.TextView

/** Renderer only. It does not and cannot interact with Foodpanda. */
object StepliOverlayService {
  private var wm:WindowManager?=null; private var panel:View?=null; private var panelParams:WindowManager.LayoutParams?=null; private var ring:HighlightRingView?=null; private var step: OverlayStep?=null
  fun show(c:Context,s:OverlayStep) { if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(c)) return; hide(); step=s; wm=c.getSystemService(Context.WINDOW_SERVICE) as WindowManager; val type=if(Build.VERSION.SDK_INT>=26)2038 else 2002; val flags=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
    // The highlight covers the whole display, so it must never receive touches.
    // Without FLAG_NOT_TOUCHABLE it blocks taps on the Foodpanda UI below it.
    ring=HighlightRingView(c); wm?.addView(ring,WindowManager.LayoutParams(-1,-1,type,flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,-3))
    val box=LinearLayout(c).apply { orientation=LinearLayout.VERTICAL; setPadding(22,18,22,18); background=round(Color.rgb(251,246,233),22) }
    val header=LinearLayout(c).apply { orientation=LinearLayout.HORIZONTAL; gravity=Gravity.CENTER_VERTICAL }
    header.addView(TextView(c).apply { text=s.progress; setTextColor(Color.rgb(110,139,114)); textSize=13f },LinearLayout.LayoutParams(0,-2,1f))
    val close=TextView(c).apply { text="×"; textSize=28f; gravity=Gravity.CENTER; setTextColor(Color.rgb(40,68,53)); contentDescription="Close guidance card" }
    header.addView(close,LinearLayout.LayoutParams(dp(c,36),dp(c,36)))
    box.addView(header)
    box.addView(TextView(c).apply { text=s.text; setTextColor(Color.rgb(40,68,53)); textSize=18f; setPadding(0,8,0,14) })
    box.addView(TextView(c).apply { text="🎙  ${s.confirm}"; setTextColor(Color.WHITE); textSize=16f; gravity=Gravity.CENTER; setPadding(14,14,14,14); background=round(Color.rgb(200,109,69),14); setOnClickListener { StepliAccessibilityService.emitStepConfirmed(s.id) } })
    val bubble=TextView(c).apply { text="S"; textSize=22f; gravity=Gravity.CENTER; setTextColor(Color.WHITE); setPadding(0,0,0,0); background=round(Color.rgb(110,139,114),28); contentDescription="Show or hide Stepli guidance" }
    val container=LinearLayout(c).apply { orientation=LinearLayout.VERTICAL; gravity=Gravity.END; addView(box,LinearLayout.LayoutParams(dp(c,300),-2).apply { bottomMargin=dp(c,10) }); addView(bubble,LinearLayout.LayoutParams(dp(c,56),dp(c,56))) }
    close.setOnClickListener { box.visibility=View.GONE }
    val slop=ViewConfiguration.get(c).scaledTouchSlop
    var downX=0f; var downY=0f; var startX=0; var startY=0; var moved=false
    bubble.setOnTouchListener { _, event ->
      when(event.action) {
        MotionEvent.ACTION_DOWN -> { downX=event.rawX; downY=event.rawY; startX=panelParams?.x ?: 0; startY=panelParams?.y ?: 0; moved=false; true }
        MotionEvent.ACTION_MOVE -> { val dx=event.rawX-downX; val dy=event.rawY-downY; if(!moved && (kotlin.math.abs(dx)>slop || kotlin.math.abs(dy)>slop)) moved=true; if(moved) { panelParams?.let { params -> params.x=startX-dx.toInt(); params.y=startY-dy.toInt(); wm?.updateViewLayout(container,params) } }; true }
        MotionEvent.ACTION_UP -> { if(!moved) box.visibility=if(box.visibility==View.VISIBLE) View.GONE else View.VISIBLE; true }
        else -> true
      }
    }
    // Keep the entire assistant behind the keyboard while the user types, then show
    // the connected card-and-bubble again after the keyboard closes.
    panel=container; panelParams=WindowManager.LayoutParams(dp(c,300),-2,type,flags or WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM,-3).apply { gravity=Gravity.BOTTOM or Gravity.END; x=dp(c,18); y=dp(c,32) }; wm?.addView(container,panelParams) }
  fun highlight(l:Int,t:Int,r:Int,b:Int) { ring?.setBounds(l,t,r,b) }
  fun currentStep(): OverlayStep? = step
  fun hide() { panel?.let { wm?.removeView(it) }; ring?.let { wm?.removeView(it) }; panel=null;panelParams=null;ring=null;step=null }
  private fun round(color:Int,r:Int)=GradientDrawable().apply { setColor(color); cornerRadius=r.toFloat() }; private fun dp(c:Context,v:Int)=(v*c.resources.displayMetrics.density).toInt()
}
