package com.stepli.app
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class StepliOverlayModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  init { reactContext = context }
  override fun getName() = "StepliOverlayModule"
  @ReactMethod fun getLanguage(p: Promise) = p.resolve(context.getSharedPreferences("stepli", Context.MODE_PRIVATE).getString("language", null))
  @ReactMethod fun setLanguage(language: String, p: Promise) { context.getSharedPreferences("stepli", Context.MODE_PRIVATE).edit().putString("language", language).apply(); p.resolve(null) }
  @ReactMethod fun getOnboardingComplete(p: Promise) = p.resolve(context.getSharedPreferences("stepli", Context.MODE_PRIVATE).getBoolean("onboardingComplete", false))
  @ReactMethod fun setOnboardingComplete(p: Promise) { context.getSharedPreferences("stepli", Context.MODE_PRIVATE).edit().putBoolean("onboardingComplete", true).apply(); p.resolve(null) }
  @ReactMethod fun canDrawOverlays(p: Promise) = p.resolve(Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context))
  @ReactMethod fun isAccessibilityEnabled(p: Promise) = p.resolve(StepliAccessibilityService.isEnabled(context))
  @ReactMethod fun openOverlaySettings() { context.currentActivity?.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))) }
  @ReactMethod fun openAccessibilitySettings() { context.currentActivity?.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
  @ReactMethod fun launchFoodpanda(p: Promise) { val i=context.packageManager.getLaunchIntentForPackage(FOODPANDA_PACKAGE); if(i==null) p.resolve(false) else { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); context.startActivity(i); p.resolve(true) } }
  @ReactMethod fun showStep(id: String, text: String, confirm: String, progress: String, matcher: String) = StepliOverlayService.show(context, OverlayStep(id,text,confirm,progress,matcher))
  @ReactMethod fun hide() = StepliOverlayService.hide()
  companion object { const val FOODPANDA_PACKAGE = "com.global.foodpanda.android"; var reactContext: ReactApplicationContext? = null
    fun emit(name: String, value: String) { reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(name, value) }
  }
}
