/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/native/StepliOverlay', () => ({
  StepliOverlay: {getLanguage: jest.fn().mockResolvedValue(null), setLanguage: jest.fn().mockResolvedValue(null), getOnboardingComplete: jest.fn().mockResolvedValue(false), setOnboardingComplete: jest.fn().mockResolvedValue(null), canDrawOverlays: jest.fn().mockResolvedValue(false), isAccessibilityEnabled: jest.fn().mockResolvedValue(false), getActiveGoal: jest.fn().mockResolvedValue(null), startGuidance: jest.fn().mockResolvedValue(null), stopGuidance: jest.fn().mockResolvedValue(null), getVoiceGuidance: jest.fn().mockResolvedValue(true), setVoiceGuidance: jest.fn().mockResolvedValue(null), getPlannerMode: jest.fn().mockResolvedValue('local'), setPlannerMode: jest.fn().mockResolvedValue(null), isGptAvailable: jest.fn().mockResolvedValue(false)},
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });
});
