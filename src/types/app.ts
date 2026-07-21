import {TutorialGuide} from '../models/tutorial';

export type Language = 'en' | 'ur';

export type RootStack = {
  Language: undefined;
  Permissions: undefined;
  Onboarding: {page: number};
  Home: undefined;
  Settings: undefined;
  Account: undefined;
  Guides: {initialTab?: 'mine' | 'community' | 'all'} | undefined;
  BuiltInGuides: undefined;
  VoiceTour: undefined;
  GuideEditor: undefined;
  Celebration: {title?: string} | undefined;
};

export type ActiveTutorial = {guide: TutorialGuide; index: number};
