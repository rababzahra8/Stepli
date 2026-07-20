export type MatcherValue = string | string[];

/**
 * A matcher is deliberately small. We never persist accessibility-tree dumps,
 * screen coordinates, typed text, or screenshots in a tutorial.
 */
export type Matcher = {
  resourceId?: MatcherValue;
  text?: MatcherValue;
  contentDescription?: MatcherValue;
};

export type TutorialStep = {
  id: string;
  text: string;
  spokenText?: string;
  confirm: string;
  matcher?: Matcher;
};

export type TutorialVisibility = 'private' | 'published';

export type TutorialGuide = {
  id: string;
  appName: string;
  appPackage: string;
  title: string;
  description: string;
  icon?: string;
  language: 'en' | 'ur';
  visibility: TutorialVisibility;
  steps: TutorialStep[];
  ownerId?: string;
  source: 'built-in' | 'community';
};

export type InstalledApp = {
  label: string;
  packageName: string;
};

export type TutorialDraft = Omit<TutorialGuide, 'id' | 'ownerId' | 'source'>;
