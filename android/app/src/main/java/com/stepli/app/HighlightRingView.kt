package com.stepli.app
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.view.View
class HighlightRingView(context: Context) : View(context) {
  private val paint=Paint(Paint.ANTI_ALIAS_FLAG).apply { color=0xFFC86D45.toInt(); style=Paint.Style.STROKE; strokeWidth=8f }; private var target: RectF?=null
  fun setBounds(l:Int,t:Int,r:Int,b:Int) { target=RectF(l.toFloat(),t.toFloat(),r.toFloat(),b.toFloat()); invalidate() }
  fun clear() { target=null; invalidate() }
  override fun onDraw(c:Canvas) { target?.let { c.drawRoundRect(it,18f,18f,paint) } }
}
