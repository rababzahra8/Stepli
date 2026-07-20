import {NativeModules} from 'react-native';
import {InstalledApp} from '../models/tutorial';

export type TutorialBackendConfig = {url: string; anonKey: string; googleWebClientId?: string} | null;
export type TutorialSession = {accessToken: string; refreshToken: string; userId: string; email?: string} | null;

type Overlay = {
  canDrawOverlays(): Promise<boolean>;
  isAccessibilityEnabled(): Promise<boolean>;
  getLanguage(): Promise<'en' | 'ur' | null>;
  setLanguage(language: 'en' | 'ur'): Promise<void>;
  getOnboardingComplete(): Promise<boolean>;
  setOnboardingComplete(): Promise<void>;
  openOverlaySettings(): void;
  openAccessibilitySettings(): void;
  getVoiceGuidance(): Promise<boolean>;
  setVoiceGuidance(enabled: boolean): Promise<void>;
  getLaunchableApps(): Promise<InstalledApp[]>;
  launchApp(packageName: string): Promise<boolean>;
  /** Kept for older callers; new tutorials use launchApp. */
  launchFoodpanda(): Promise<boolean>;
  showStep(id: string, text: string, confirm: string, progress: string, matcher: string, appPackage: string, language: 'en' | 'ur', spokenText?: string): Promise<void>;
  hide(): void;
  closeNavigator(): void;
  getTutorialBackendConfig(): Promise<TutorialBackendConfig>;
  getTutorialSession(): Promise<TutorialSession>;
  setTutorialSession(accessToken: string, refreshToken: string, userId: string, email?: string): Promise<void>;
  clearTutorialSession(): Promise<void>;
};
export const StepliOverlay = NativeModules.StepliOverlayModule as Overlay;
