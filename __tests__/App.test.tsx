/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../src/native/StepliOverlay', () => ({
  StepliOverlay: {getLanguage: jest.fn().mockResolvedValue(null), setLanguage: jest.fn().mockResolvedValue(null), getOnboardingComplete: jest.fn().mockResolvedValue(false), setOnboardingComplete: jest.fn().mockResolvedValue(null), canDrawOverlays: jest.fn().mockResolvedValue(false), isAccessibilityEnabled: jest.fn().mockResolvedValue(false), getVoiceGuidance: jest.fn().mockResolvedValue(true), setVoiceGuidance: jest.fn().mockResolvedValue(null), getLaunchableApps: jest.fn().mockResolvedValue([]), launchApp: jest.fn().mockResolvedValue(false), launchFoodpanda: jest.fn().mockResolvedValue(false), showStep: jest.fn().mockResolvedValue(null), closeNavigator: jest.fn(), hide: jest.fn(), getTutorialBackendConfig: jest.fn().mockResolvedValue(null), getTutorialSession: jest.fn().mockResolvedValue(null), setTutorialSession: jest.fn().mockResolvedValue(null), clearTutorialSession: jest.fn().mockResolvedValue(null)},
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });
});
