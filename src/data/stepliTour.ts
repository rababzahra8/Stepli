import {Language} from '../types/app';

export type StepliTourStep = {
  id: string;
  title: string;
  body: string;
  /** Spoken aloud with device TTS. */
  spokenText: string;
};

const en: StepliTourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Stepli',
    body: 'Stepli is a calm voice guide. It walks you through another app one step at a time.',
    spokenText:
      'Welcome to Stepli. I am a calm voice guide. I walk you through another app, one step at a time.',
  },
  {
    id: 'pick-guide',
    title: 'Pick a guide',
    body: 'On Home, choose an app like Instagram, WhatsApp, Foodpanda, or YouTube. Tap a guide name to start.',
    spokenText:
      'On the home screen, pick a guide. You can choose Instagram, WhatsApp, Foodpanda, or YouTube. Tap the guide name to start.',
  },
  {
    id: 'overlay',
    title: 'I stay beside you',
    body: 'When a guide starts, I open the app and show a card on top of the screen with the next thing to do.',
    spokenText:
      'When a guide starts, I open the app and show a card on top of your screen. That card tells you the next thing to do.',
  },
  {
    id: 'voice',
    title: 'I speak each step',
    body: 'I read the step out loud. Tap “Hear this step” on the card anytime you want me to say it again.',
    spokenText:
      'I speak each step out loud. If you want to hear it again, tap Hear this step on the guidance card.',
  },
  {
    id: 'control',
    title: 'You stay in control',
    body: 'I never tap or order for you. You do every action. When you’re done with a step, confirm and I’ll move to the next one.',
    spokenText:
      'You stay in control. I never tap or order for you. You do every action. When you finish a step, confirm it, and I will move to the next one.',
  },
  {
    id: 'permissions',
    title: 'Two permissions',
    body: 'Stepli needs overlay permission to show the card, and accessibility permission to find buttons to highlight. It only reads the screen.',
    spokenText:
      'Stepli needs two permissions. Overlay permission so I can show the guidance card, and accessibility permission so I can find buttons to highlight. I only read the screen. I never tap for you.',
  },
  {
    id: 'ready',
    title: 'You’re ready',
    body: 'That’s it. Go back to Home, pick a guide, and try your first walkthrough. You can replay this voice tour anytime.',
    spokenText:
      'You are ready. Go back to Home, pick a guide, and try your first walkthrough. You can replay this voice tour any time.',
  },
];

const ur: StepliTourStep[] = [
  {
    id: 'welcome',
    title: 'Stepli میں خوش آمدید',
    body: 'Stepli ایک پرسکون آواز والی گائیڈ ہے۔ یہ آپ کو دوسری ایپ میں قدم بہ قدم لے کر جاتی ہے۔',
    spokenText:
      'Stepli میں خوش آمدید۔ میں ایک پرسکون آواز والی گائیڈ ہوں۔ میں آپ کو دوسری ایپ میں ایک ایک قدم بتا کر لے کر جاتی ہوں۔',
  },
  {
    id: 'pick-guide',
    title: 'گائیڈ منتخب کریں',
    body: 'ہوم پر Instagram، WhatsApp، Foodpanda یا YouTube جیسی ایپ چنیں۔ گائیڈ کا نام دبا کر شروع کریں۔',
    spokenText:
      'ہوم اسکرین پر گائیڈ چنیں۔ آپ Instagram، WhatsApp، Foodpanda یا YouTube چن سکتے ہیں۔ گائیڈ کا نام دبا کر شروع کریں۔',
  },
  {
    id: 'overlay',
    title: 'میں آپ کے ساتھ رہتی ہوں',
    body: 'گائیڈ شروع ہوتے ہی ایپ کھلتی ہے، اور اسکرین کے اوپر ایک کارڈ دکھاتا ہے کہ آگے کیا کرنا ہے۔',
    spokenText:
      'جب گائیڈ شروع ہوتی ہے تو میں ایپ کھولتی ہوں اور اسکرین کے اوپر ایک کارڈ دکھاتی ہوں۔ اس کارڈ میں اگلا کام لکھا ہوتا ہے۔',
  },
  {
    id: 'voice',
    title: 'ہر قدم بول کر سناتی ہوں',
    body: 'میں قدم زور سے پڑھتی ہوں۔ دوبارہ سننے کے لیے کارڈ پر “یہ قدم سنیں” دبائیں۔',
    spokenText:
      'میں ہر قدم زور سے بولتی ہوں۔ اگر دوبارہ سننا ہو تو گائیڈنس کارڈ پر یہ قدم سنیں دبائیں۔',
  },
  {
    id: 'control',
    title: 'کنٹرول آپ کے پاس',
    body: 'میں کبھی آپ کی جگہ ٹیپ یا آرڈر نہیں کرتی۔ ہر کام آپ کرتے ہیں۔ قدم مکمل ہونے پر تصدیق کریں، پھر اگلا قدم آئے گا۔',
    spokenText:
      'کنٹرول آپ کے پاس رہتا ہے۔ میں کبھی آپ کی جگہ ٹیپ یا آرڈر نہیں کرتی۔ ہر کام آپ خود کرتے ہیں۔ جب قدم مکمل ہو جائے تو تصدیق کریں، پھر میں اگلا قدم بتاؤں گی۔',
  },
  {
    id: 'permissions',
    title: 'دو اجازتیں',
    body: 'کارڈ دکھانے کے لیے اوورلے، اور بٹن تلاش کرنے کے لیے ایکسیسیبیلٹی اجازت چاہیے۔ Stepli صرف اسکرین پڑھتی ہے۔',
    spokenText:
      'Stepli کو دو اجازتیں چاہییں۔ اوورلے اجازت تاکہ کارڈ دکھ سکے، اور ایکسیسیبیلٹی اجازت تاکہ بٹن تلاش کر کے نمایاں کیے جا سکیں۔ میں صرف اسکرین پڑھتی ہوں، ٹیپ نہیں کرتی۔',
  },
  {
    id: 'ready',
    title: 'آپ تیار ہیں',
    body: 'بس اتنا ہی۔ ہوم پر جائیں، گائیڈ چنیں، اور پہلا واک تھرو آزمائیں۔ یہ آواز والا ٹور کبھی بھی دوبارہ سن سکتے ہیں۔',
    spokenText:
      'آپ تیار ہیں۔ ہوم پر واپس جائیں، گائیڈ چنیں، اور پہلا واک تھرو آزمائیں۔ یہ آواز والا ٹور آپ کبھی بھی دوبارہ سن سکتے ہیں۔',
  },
];

export function getStepliVoiceTour(language: Language): StepliTourStep[] {
  return language === 'ur' ? ur : en;
}
