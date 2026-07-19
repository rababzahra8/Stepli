package com.stepli.app
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.content.Context
import com.stepli.app.accessibility.StepliAccessibilityService
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.stepli.app.models.PlannerMode
import com.stepli.app.planner.GuidanceEngine
import com.stepli.app.repository.GuidanceRepository

class StepliOverlayModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  init { reactContext = context }
  override fun getName() = "StepliOverlayModule"
  // React Native's TurboModule interop requires @ReactMethod methods to have JVM void return types.
  @ReactMethod fun getLanguage(p: Promise) { p.resolve(context.getSharedPreferences("stepli", Context.MODE_PRIVATE).getString("language", null)) }
  @ReactMethod fun setLanguage(language: String, p: Promise) { context.getSharedPreferences("stepli", Context.MODE_PRIVATE).edit().putString("language", language).apply(); p.resolve(null) }
  @ReactMethod fun getOnboardingComplete(p: Promise) { p.resolve(context.getSharedPreferences("stepli", Context.MODE_PRIVATE).getBoolean("onboardingComplete", false)) }
  @ReactMethod fun setOnboardingComplete(p: Promise) { context.getSharedPreferences("stepli", Context.MODE_PRIVATE).edit().putBoolean("onboardingComplete", true).apply(); p.resolve(null) }
  @ReactMethod fun canDrawOverlays(p: Promise) { p.resolve(Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)) }
  @ReactMethod fun isAccessibilityEnabled(p: Promise) { p.resolve(StepliAccessibilityService.isEnabled(context)) }
  @ReactMethod fun openOverlaySettings() { context.currentActivity?.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))) }
  @ReactMethod fun openAccessibilitySettings() { context.currentActivity?.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
  @ReactMethod fun startGuidance(goal: String, p: Promise) {
    val cleanGoal = goal.trim().take(300)
    if (cleanGoal.isBlank()) { p.reject("invalid_goal", "A guidance goal is required"); return }
    GuidanceRepository(context).startGoal(cleanGoal)
    p.resolve(null)
  }
  @ReactMethod fun stopGuidance(p: Promise) { GuidanceRepository(context).stopGoal(); StepliOverlayService.hide(); p.resolve(null) }
  @ReactMethod fun getActiveGoal(p: Promise) { p.resolve(GuidanceRepository(context).activeGoal()?.text) }
  @ReactMethod fun getPlannerMode(p: Promise) { p.resolve(GuidanceRepository(context).plannerMode().value) }
  @ReactMethod fun setPlannerMode(mode: String, p: Promise) { GuidanceRepository(context).setPlannerMode(PlannerMode.from(mode)); p.resolve(null) }
  @ReactMethod fun isGptAvailable(p: Promise) { p.resolve(GuidanceEngine(context).isGptAvailable()) }
  @ReactMethod fun getVoiceGuidance(p: Promise) { p.resolve(GuidanceRepository(context).voiceEnabled()) }
  @ReactMethod fun setVoiceGuidance(enabled: Boolean, p: Promise) { GuidanceRepository(context).setVoiceEnabled(enabled); p.resolve(null) }
  @ReactMethod fun repeatGuidance() { StepliAccessibilityService.repeatCurrentGuidance() }
  @ReactMethod fun launchFoodpanda(p: Promise) { val i=context.packageManager.getLaunchIntentForPackage(FOODPANDA_PACKAGE); if(i==null) p.resolve(false) else { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); context.startActivity(i); p.resolve(true) } }
  @ReactMethod fun hide() { StepliOverlayService.hide() }
  companion object { const val FOODPANDA_PACKAGE = "com.global.foodpanda.android"; var reactContext: ReactApplicationContext? = null
    fun emit(name: String, value: String) { reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(name, value) }
  }
}
