import {NativeModules} from 'react-native';
import {InstalledApp} from '../models/tutorial';

export type TutorialBackendConfig = {url: string; anonKey: string; googleWebClientId?: string} | null;
export type TutorialSession = {accessToken: string; refreshToken: string; userId: string; email?: string} | null;

export type TtsLanguageStatus = {
  code: string;
  label: string;
  detail: string;
  available: boolean;
};

type Overlay = {
  canDrawOverlays(): Promise<boolean>;
  isAccessibilityEnabled(): Promise<boolean>;
  getLanguage(): Promise<'en' | 'ur' | null>;
  setLanguage(language: 'en' | 'ur'): Promise<void>;
  getOnboardingComplete(): Promise<boolean>;
  setOnboardingComplete(): Promise<void>;
  openOverlaySettings(): void;
  openAppDetailsSettings(): void;
  openAccessibilitySettings(): void;
  getVoiceGuidance(): Promise<boolean>;
  setVoiceGuidance(enabled: boolean): Promise<void>;
  getLaunchableApps(): Promise<InstalledApp[]>;
  launchApp(packageName: string): Promise<boolean>;
  launchAppAndShowStep(id: string, text: string, confirm: string, progress: string, matcher: string, appPackage: string, language: 'en' | 'ur', spokenText?: string, canGoBack?: boolean): Promise<boolean>;
  /** Kept for older callers; new tutorials use launchApp. */
  launchFoodpanda(): Promise<boolean>;
  showStep(id: string, text: string, confirm: string, progress: string, matcher: string, appPackage: string, language: 'en' | 'ur', spokenText?: string, canGoBack?: boolean): Promise<void>;
  hide(): void;
  closeNavigator(): void;
  getTutorialBackendConfig(): Promise<TutorialBackendConfig>;
  getTutorialSession(): Promise<TutorialSession>;
  setTutorialSession(accessToken: string, refreshToken: string, userId: string, email?: string): Promise<void>;
  clearTutorialSession(): Promise<void>;
  isUrduVoiceAvailable(): Promise<boolean>;
  getInstalledTtsLanguages(): Promise<TtsLanguageStatus[]>;
  openTextToSpeechSettings(): void;
  speak(text: string, language: 'en' | 'ur'): Promise<void>;
  stopSpeech(): Promise<void>;
};
export const StepliOverlay = NativeModules.StepliOverlayModule as Overlay;
