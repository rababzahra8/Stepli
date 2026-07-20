import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, AppState, DeviceEventEmitter, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {en} from './src/strings/en';
import {ur} from './src/strings/ur';
import {getFoodpandaTutorial} from './src/data/foodpandaSteps';
import {InstalledApp, TutorialDraft, TutorialGuide, TutorialStep} from './src/models/tutorial';
import {AuthSession, tutorialRepository} from './src/services/TutorialRepository';
import {StepliOverlay} from './src/native/StepliOverlay';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

type Language = 'en' | 'ur';
type RootStack = {
  Language: undefined;
  Permissions: undefined;
  Onboarding: {page: number};
  Home: undefined;
  Settings: undefined;
  Account: undefined;
  Guides: undefined;
  GuideEditor: undefined;
  Celebration: {title?: string} | undefined;
};
type ActiveTutorial = {guide: TutorialGuide; index: number};

const Stack = createNativeStackNavigator<RootStack>();
const C = {cream: '#A8C3A0', sage: '#6E8B72', dark: '#284435', amber: '#C86D45', ink: '#26352B', pale: '#E5EDDC', white: '#F6F9F0', danger: '#9D3D35'};
const stepliLogo = require('./src/assets/stepli-bot.png');
const copyFor = (language: Language) => language === 'ur' ? ur : en;

function Button({label, onPress, secondary = false, danger = false, disabled = false, rtl = false}: {label: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; rtl?: boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} style={[styles.button, secondary && styles.secondary, danger && styles.danger, disabled && styles.disabled]} onPress={onPress}><Text style={[styles.buttonText, secondary && styles.secondaryText, danger && styles.dangerText, rtl && styles.rtl]}>{label}</Text></Pressable>;
}

function Screen({children, scroll = false}: {children: React.ReactNode; scroll?: boolean}) {
  const content = <View style={styles.screen}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}</SafeAreaView>;
}

function CopyText({children, style, language}: {children: React.ReactNode; style?: object; language: Language}) {
  return <Text style={[style, language === 'ur' && styles.rtl]}>{children}</Text>;
}

function Back({navigation, language}: {navigation: any; language: Language}) {
  return <Pressable accessibilityRole="button" style={styles.back} onPress={() => navigation.goBack()}><CopyText language={language} style={styles.backText}>{language === 'ur' ? 'واپس' : 'Back'}</CopyText></Pressable>;
}

function LanguageScreen({onChoose}: {onChoose: (language: Language) => void}) {
  return <Screen><Image source={stepliLogo} style={styles.heroLogo}/><Text style={styles.eyebrow}>Stepli</Text><Text style={styles.title}>Choose your language</Text><Text style={[styles.title, styles.rtl]}>اپنی زبان منتخب کریں</Text><View style={styles.flex}/><Button label="English" onPress={() => onChoose('en')}/><Button label="اردو" rtl onPress={() => onChoose('ur')} secondary/></Screen>;
}

function Permissions({navigation, language}: any) {
  const c = copyFor(language);
  const [overlay, setOverlay] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const refresh = useCallback(async () => {
    setOverlay(await StepliOverlay.canDrawOverlays());
    setAccessibility(await StepliOverlay.isAccessibilityEnabled());
  }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refresh);
    const appState = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    refresh();
    return () => { unsubscribe(); appState.remove(); };
  }, [navigation, refresh]);
  useEffect(() => { if (overlay && accessibility) navigation.replace('Onboarding', {page: 1}); }, [overlay, accessibility, navigation]);
  const current = !overlay ? c.permissions.overlay : c.permissions.accessibility;
  return <Screen><CopyText language={language} style={styles.eyebrow}>{c.permissions.setup}</CopyText><CopyText language={language} style={styles.title}>{current.headline}</CopyText><CopyText language={language} style={styles.body}>{current.body}</CopyText>
    <View style={styles.permissionStatus}><CopyText language={language}>{overlay ? '✓' : '○'} {c.permissions.overlayStatus}</CopyText><CopyText language={language}>{accessibility ? '✓' : '○'} {c.permissions.accessibilityStatus}</CopyText></View>
    {overlay && !accessibility && <View style={styles.guide}><CopyText language={language} style={styles.guideTitle}>{c.permissions.guideTitle}</CopyText><CopyText language={language} style={styles.guideBody}>{c.permissions.guideBody}</CopyText></View>}
    <Button label={current.cta} rtl={language === 'ur'} onPress={() => !overlay ? StepliOverlay.openOverlaySettings() : StepliOverlay.openAccessibilitySettings()}/><Button secondary label={c.permissions.checkCta} rtl={language === 'ur'} onPress={refresh}/><CopyText language={language} style={styles.footnote}>{c.permissions.footnote}</CopyText>
  </Screen>;
}

function Onboarding({route, navigation, language, completeOnboarding}: any) {
  const c = copyFor(language);
  const page = route.params.page;
  const item = page === 1 ? c.onboarding.screen1 : c.onboarding.screen2;
  const finish = async () => { await completeOnboarding(); navigation.replace('Home'); };
  return <Screen><CopyText language={language} style={styles.eyebrow}>{page} / 2</CopyText><CopyText language={language} style={styles.title}>{item.headline}</CopyText><CopyText language={language} style={styles.body}>{item.body}</CopyText><View style={styles.flex}/><Button rtl={language === 'ur'} label={page === 1 ? c.onboarding.continue : c.onboarding.begin} onPress={() => page === 1 ? navigation.push('Onboarding', {page: 2}) : finish()}/></Screen>;
}

function Home({navigation, language, session, onSessionChange}: {navigation: any; language: Language; session: AuthSession | null; onSessionChange: (session: AuthSession | null) => void}) {
  const c = copyFor(language);
  const foodpanda = useMemo(() => getFoodpandaTutorial(language), [language]);
  const [communityGuides, setCommunityGuides] = useState<TutorialGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [active, setActive] = useState<ActiveTutorial | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const activeRef = useRef<ActiveTutorial | null>(null);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await tutorialRepository.signOut();
      try { await GoogleSignin.signOut(); } catch { /* Clears Google's local account choice only. */ }
    } finally {
      onSessionChange(null);
      setSigningOut(false);
    }
  };

  const setActiveGuide = (next: ActiveTutorial | null) => {
    activeRef.current = next;
    setActive(next);
  };
  const refreshGuides = useCallback(async () => {
    if (!session || !(await tutorialRepository.isConfigured())) { setCommunityGuides([]); return; }
    setLoadingGuides(true);
    try { setCommunityGuides(await tutorialRepository.listGuides(language)); }
    catch { setCommunityGuides([]); }
    finally { setLoadingGuides(false); }
  }, [language, session]);

  const show = useCallback(async (guide: TutorialGuide, index: number) => {
    const step = guide.steps[index];
    if (!step) return;
    const next = {guide, index};
    setActiveGuide(next);
    await StepliOverlay.showStep(
      step.id,
      step.text,
      step.confirm,
      `${c.settings.step} ${index + 1} ${c.common.stepOf} ${guide.steps.length}`,
      JSON.stringify(step.matcher || {}),
      guide.appPackage,
      language,
      step.spokenText || step.text,
    );
  }, [c.common.stepOf, c.settings.step, language]);

  const closeNavigator = useCallback(async () => {
    StepliOverlay.closeNavigator();
    setActiveGuide(null);
  }, []);

  const begin = useCallback(async (guide: TutorialGuide) => {
    if (!guide.steps.length) {
      Alert.alert(language === 'ur' ? 'قدم موجود نہیں ہیں' : 'No steps yet', language === 'ur' ? 'اس گائیڈ میں ابھی کوئی قدم شامل نہیں ہے۔' : 'This guide does not contain any steps yet.');
      return;
    }
    try {
      await show(guide, 0);
      const canOpen = await StepliOverlay.launchApp(guide.appPackage);
      if (!canOpen) {
        StepliOverlay.closeNavigator();
        setActiveGuide(null);
        Alert.alert(language === 'ur' ? 'ایپ انسٹال نہیں ہے' : 'App is not installed', language === 'ur' ? `${guide.appName} انسٹال کریں، پھر دوبارہ کوشش کریں۔` : `Install ${guide.appName}, then try again.`);
      }
    } catch {
      StepliOverlay.closeNavigator();
      setActiveGuide(null);
      Alert.alert(language === 'ur' ? 'گائیڈ شروع نہیں ہوئی' : 'Could not start guidance', language === 'ur' ? 'اجازتیں چیک کر کے دوبارہ کوشش کریں۔' : 'Check the permissions and try again.');
    }
  }, [language, show]);

  useEffect(() => {
    refreshGuides();
    return navigation.addListener('focus', refreshGuides);
  }, [navigation, refreshGuides]);

  useEffect(() => {
    const advanced = DeviceEventEmitter.addListener('stepliStepDetected', async (id: string) => {
      const current = activeRef.current;
      if (!current || current.guide.steps[current.index]?.id !== id) return;
      if (current.index >= current.guide.steps.length - 1) {
        StepliOverlay.closeNavigator();
        setActiveGuide(null);
        navigation.navigate('Celebration', {title: current.guide.title});
      } else {
        await show(current.guide, current.index + 1);
      }
    });
    const closed = DeviceEventEmitter.addListener('stepliNavigatorClosed', () => setActiveGuide(null));
    return () => { advanced.remove(); closed.remove(); };
  }, [navigation, show]);

  return <Screen scroll><View style={styles.topRow}><View style={styles.brand}><Image source={stepliLogo} style={styles.headerLogo}/><Text style={styles.logo}>Stepli</Text></View><View style={styles.topActions}><Pressable accessibilityRole="button" onPress={() => navigation.navigate('Account')}><CopyText language={language} style={styles.settings}>{session ? (language === 'ur' ? 'اکاؤنٹ' : 'Account') : (language === 'ur' ? 'سائن اِن' : 'Sign in')}</CopyText></Pressable><Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')}><CopyText language={language} style={styles.settings}>{c.home.settings}</CopyText></Pressable></View></View>
    {session && <View style={styles.signedIn}><View style={styles.flex}><CopyText language={language} style={styles.cardMeta}>{language === 'ur' ? 'سائن اِن' : 'Signed in'}</CopyText><Text style={[styles.activeGuideText, language === 'ur' && styles.rtl]} numberOfLines={1}>{session.email || session.userId}</Text></View><Pressable accessibilityRole="button" disabled={signingOut} onPress={signOut}><CopyText language={language} style={[styles.link, signingOut && styles.disabled]}>{language === 'ur' ? 'لاگ آؤٹ' : 'Log out'}</CopyText></Pressable></View>}
    <CopyText language={language} style={styles.homeTitle}>{c.home.greeting}</CopyText><CopyText language={language} style={styles.body}>{c.home.subtext}</CopyText>
    {active && <View style={styles.activeGuide}><CopyText language={language} style={styles.activeGuideTitle}>{language === 'ur' ? 'نیویگیٹر چل رہا ہے' : 'Navigator is running'}</CopyText><CopyText language={language} style={styles.activeGuideText}>{active.guide.title} · {language === 'ur' ? 'قدم' : 'Step'} {active.index + 1}/{active.guide.steps.length}</CopyText><Button danger label={language === 'ur' ? 'نیویگیٹر مکمل بند کریں' : 'Close navigator completely'} rtl={language === 'ur'} onPress={closeNavigator}/></View>}
    <View style={styles.sectionRow}><CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'اسٹیپلی گائیڈز' : 'Stepli guides'}</CopyText></View>
    <TutorialCard guide={foodpanda} language={language} onPress={() => begin(foodpanda)}/>
    <View style={styles.sectionRow}><CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'کمیونٹی گائیڈز' : 'Community guides'}</CopyText><Pressable accessibilityRole="button" onPress={() => navigation.navigate(session ? 'Guides' : 'Account')}><CopyText language={language} style={styles.link}>{session ? (language === 'ur' ? 'سب دیکھیں' : 'See all') : (language === 'ur' ? 'سائن اِن' : 'Sign in')}</CopyText></Pressable></View>
    {session ? <>{communityGuides.map(guide => <TutorialCard key={guide.id} guide={guide} language={language} onPress={() => begin(guide)}/>) }{loadingGuides && <ActivityIndicator color={C.sage} style={styles.loader}/>} {!loadingGuides && !communityGuides.length && <View style={styles.notice}><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'ابھی کوئی کمیونٹی گائیڈ موجود نہیں ہے۔ آپ پہلی گائیڈ بنا سکتے ہیں۔' : 'There are no community guides yet. You can create the first one.'}</CopyText></View>}</> : <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Account')} style={styles.notice}><CopyText language={language} style={styles.noticeTitle}>{language === 'ur' ? 'کمیونٹی گائیڈز دیکھنے کے لیے سائن اِن کریں' : 'Sign in to see community guides'}</CopyText><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'اکاؤنٹ بنانے کے بعد آپ دوسرے لوگوں کے شائع کردہ ٹیوٹوریل دیکھ اور استعمال کر سکیں گے۔' : 'After creating an account, you can see and use tutorials published by other people.'}</CopyText></Pressable>}
    <Pressable accessibilityRole="button" onPress={() => navigation.navigate(session ? 'Guides' : 'Account')} style={styles.addGuideCard}><Text style={styles.addGuideIcon}>＋</Text><View style={styles.flex}><CopyText language={language} style={styles.cardTitle}>{session ? (language === 'ur' ? 'کسی اور ایپ کے لیے گائیڈ بنائیں' : 'Create a guide for another app') : (language === 'ur' ? 'گائیڈ بنانے کے لیے اکاؤنٹ بنائیں' : 'Create an account to make guides')}</CopyText><CopyText language={language} style={styles.cardBody}>{language === 'ur' ? 'اپنی ایپ اور قدم شامل کریں، پھر انہیں دوبارہ استعمال کریں۔' : 'Add your app and steps, then use them again whenever you need help.'}</CopyText></View></Pressable>
  </Screen>;
}

function TutorialCard({guide, language, onPress}: {guide: TutorialGuide; language: Language; onPress: () => void}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.taskCard}><Text style={styles.cardIcon}>{guide.icon || '📱'}</Text><View style={styles.flex}><CopyText language={language} style={styles.cardTitle}>{guide.title}</CopyText><CopyText language={language} style={styles.cardBody}>{guide.description || (language === 'ur' ? `${guide.steps.length} قدم` : `${guide.steps.length} steps`)}</CopyText><CopyText language={language} style={styles.cardMeta}>{guide.source === 'built-in' ? (language === 'ur' ? 'اسٹیپلی گائیڈ' : 'Stepli guide') : (guide.visibility === 'published' ? (language === 'ur' ? 'کمیونٹی گائیڈ' : 'Community guide') : (language === 'ur' ? 'میرا نجی گائیڈ' : 'My private guide'))}</CopyText></View><Text style={styles.arrow}>›</Text></Pressable>;
}

function Account({navigation, language, session, onSessionChange}: {navigation: any; language: Language; session: AuthSession | null; onSessionChange: (session: AuthSession | null) => void}) {
  const [configured, setConfigured] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleWebClientId, setGoogleWebClientId] = useState<string | null>(null);
  useEffect(() => {
    tutorialRepository.isConfigured().then(setConfigured).catch(() => setConfigured(false));
    tutorialRepository.getGoogleSignInClientId().then(setGoogleWebClientId).catch(() => setGoogleWebClientId(null));
  }, []);
  const authenticate = async (signup: boolean) => {
    if (!email.trim() || password.length < 8) { Alert.alert(language === 'ur' ? 'ای میل اور پاس ورڈ' : 'Email and password', language === 'ur' ? 'درست ای میل اور کم از کم 8 حروف کا پاس ورڈ لکھیں۔' : 'Enter an email and a password with at least 8 characters.'); return; }
    setBusy(true);
    try {
      const next = signup ? await tutorialRepository.signUp(email, password) : await tutorialRepository.signIn(email, password);
      if (!next) Alert.alert(language === 'ur' ? 'ای میل چیک کریں' : 'Check your email', language === 'ur' ? 'اکاؤنٹ کی تصدیق کے لیے ای میل میں موجود لنک کھولیں، پھر سائن اِن کریں۔' : 'Open the confirmation link in your email, then sign in.');
      else { onSessionChange(next); setPassword(''); }
    } catch (error) { Alert.alert(language === 'ur' ? 'سائن اِن نہیں ہو سکا' : 'Could not sign in', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const authenticateWithGoogle = async () => {
    if (!googleWebClientId) return;
    setBusy(true);
    try {
      GoogleSignin.configure({webClientId: googleWebClientId});
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') return;
      if (!result.data.idToken) throw new Error('Google did not return an ID token. Check the Web client ID configuration.');
      onSessionChange(await tutorialRepository.signInWithGoogle(result.data.idToken));
    } catch (error) { Alert.alert(language === 'ur' ? 'گوگل سے سائن اِن نہیں ہو سکا' : 'Could not sign in with Google', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    setBusy(true);
    try {
      await tutorialRepository.signOut();
      try { await GoogleSignin.signOut(); } catch { /* This only clears Google's local account choice. */ }
    }
    finally { onSessionChange(null); setBusy(false); }
  };
  return <Screen scroll><Back navigation={navigation} language={language}/><CopyText language={language} style={styles.title}>{language === 'ur' ? 'آپ کا اکاؤنٹ' : 'Your account'}</CopyText><CopyText language={language} style={styles.body}>{language === 'ur' ? 'سائن اِن کریں تاکہ آپ دوسرے لوگوں کے شائع کردہ گائیڈز دیکھ سکیں اور اپنی گائیڈز محفوظ کر سکیں۔' : 'Sign in to see guides published by other people and save guides of your own.'}</CopyText>
    {!configured ? <View style={styles.notice}><CopyText language={language} style={styles.noticeTitle}>{language === 'ur' ? 'ٹیوٹوریل سروس سیٹ اپ کریں' : 'Set up tutorial sharing'}</CopyText><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'Supabase URL اور publishable key کو مقامی .env میں شامل کریں، پھر ایپ دوبارہ بنائیں۔ ڈیٹابیس پاس ورڈ یا service-role key کبھی ایپ میں شامل نہ کریں۔' : 'Add the Supabase URL and publishable key to your local .env, then rebuild. Never put a database password or service-role key in the app.'}</CopyText></View> : session ? <View style={styles.authCard}><CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'آپ سائن اِن ہیں' : 'You are signed in'}</CopyText><CopyText language={language} style={styles.activeGuideText}>{session.email || session.userId}</CopyText><CopyText language={language} style={styles.footnote}>{language === 'ur' ? 'آپ کا سیشن اس فون پر محفوظ ہے۔ سائن آؤٹ کرنے سے یہ فون سے ہٹا دیا جائے گا۔' : 'Your session is securely saved on this phone. Signing out removes it from this device.'}</CopyText><Button danger disabled={busy} label={language === 'ur' ? 'سائن آؤٹ' : 'Sign out'} rtl={language === 'ur'} onPress={signOut}/></View> : <View style={styles.authCard}><CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'سائن اِن یا اکاؤنٹ بنائیں' : 'Sign in or create an account'}</CopyText>{googleWebClientId && <Button disabled={busy} secondary label={language === 'ur' ? 'گوگل کے ساتھ جاری رکھیں' : 'Continue with Google'} rtl={language === 'ur'} onPress={authenticateWithGoogle}/>}<TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#657568" style={styles.input}/><TextInput autoCapitalize="none" autoCorrect={false} secureTextEntry value={password} onChangeText={setPassword} placeholder={language === 'ur' ? 'کم از کم 8 حروف کا پاس ورڈ' : 'Password (at least 8 characters)'} placeholderTextColor="#657568" style={styles.input}/><Button disabled={busy} label={busy ? (language === 'ur' ? 'براہِ کرم انتظار کریں' : 'Please wait') : (language === 'ur' ? 'سائن اِن کریں' : 'Sign in')} rtl={language === 'ur'} onPress={() => authenticate(false)}/><Button disabled={busy} secondary label={language === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Create account'} rtl={language === 'ur'} onPress={() => authenticate(true)}/></View>}
  </Screen>;
}

function Guides({navigation, language, session}: {navigation: any; language: Language; session: AuthSession | null}) {
  const [configured, setConfigured] = useState(false);
  const [guides, setGuides] = useState<TutorialGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    const ready = await tutorialRepository.isConfigured();
    setConfigured(ready);
    if (!ready || !session) { setGuides([]); return; }
    setLoading(true);
    try { setGuides(await tutorialRepository.listGuides(language)); } catch { setGuides([]); }
    finally { setLoading(false); }
  }, [language, session]);
  useEffect(() => { refresh(); return navigation.addListener('focus', refresh); }, [navigation, refresh]);
  return <Screen scroll><Back navigation={navigation} language={language}/><CopyText language={language} style={styles.title}>{language === 'ur' ? 'ٹیوٹوریل گائیڈز' : 'Tutorial guides'}</CopyText><CopyText language={language} style={styles.body}>{language === 'ur' ? 'دوسرے لوگوں کے شائع کردہ گائیڈز دیکھیں، یا اپنی ایپ کے لیے قدم بنائیں۔' : 'See guides published by other people, or make steps for an app of your own.'}</CopyText>
    {!configured ? <View style={styles.notice}><CopyText language={language} style={styles.noticeTitle}>{language === 'ur' ? 'ٹیوٹوریل سروس سیٹ اپ کریں' : 'Set up tutorial sharing'}</CopyText><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'Supabase URL اور publishable key کو مقامی .env میں شامل کریں، پھر ایپ دوبارہ بنائیں۔' : 'Add the Supabase URL and publishable key to your local .env, then rebuild.'}</CopyText></View> : !session ? <View style={styles.authCard}><CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'کمیونٹی گائیڈز کے لیے سائن اِن کریں' : 'Sign in for community guides'}</CopyText><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'اکاؤنٹ بنانے کے بعد آپ دوسرے لوگوں کے شائع کردہ ٹیوٹوریل دیکھ اور اپنی گائیڈز محفوظ کر سکیں گے۔' : 'After creating an account, you can see tutorials published by other people and save your own guides.'}</CopyText><Button label={language === 'ur' ? 'سائن اِن کریں' : 'Sign in'} rtl={language === 'ur'} onPress={() => navigation.navigate('Account')}/></View> : <><Button label={language === 'ur' ? 'نیا گائیڈ بنائیں' : 'Create a new guide'} rtl={language === 'ur'} onPress={() => navigation.navigate('GuideEditor')}/>{loading && <ActivityIndicator color={C.sage} style={styles.loader}/>} {guides.length > 0 && <><CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'دستیاب گائیڈز' : 'Available guides'}</CopyText>{guides.map(guide => <View style={styles.guideListItem} key={guide.id}><CopyText language={language} style={styles.cardTitle}>{guide.title}</CopyText><CopyText language={language} style={styles.cardBody}>{guide.appName} · {guide.steps.length} {language === 'ur' ? 'قدم' : 'steps'}</CopyText></View>)}</>}{!loading && !guides.length && <View style={styles.notice}><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'ابھی کوئی کمیونٹی گائیڈ موجود نہیں ہے۔' : 'There are no community guides yet.'}</CopyText></View>}</>}
  </Screen>;
}

function GuideEditor({navigation, language}: any) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [showApps, setShowApps] = useState(false);
  const [appName, setAppName] = useState('');
  const [appPackage, setAppPackage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([{id: 'draft-1', text: '', spokenText: '', confirm: '', matcher: {}}]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { StepliOverlay.getLaunchableApps().then(setApps).catch(() => setApps([])); }, []);
  const updateStep = (index: number, changes: Partial<TutorialStep>) => setSteps(current => current.map((step, position) => position === index ? {...step, ...changes} : step));
  const updateMatcher = (index: number, key: 'text' | 'resourceId' | 'contentDescription', value: string) => {
    const matcher = {...(steps[index]?.matcher || {})};
    if (value.trim()) matcher[key] = value.trim(); else delete matcher[key];
    updateStep(index, {matcher});
  };
  const addStep = () => setSteps(current => [...current, {id: `draft-${Date.now()}`, text: '', spokenText: '', confirm: '', matcher: {}}]);
  const removeStep = (index: number) => setSteps(current => current.length === 1 ? current : current.filter((_, position) => position !== index));
  const save = async () => {
    const cleanSteps = steps.map((step, index) => ({...step, id: `user-step-${index + 1}`, text: step.text.trim(), spokenText: step.spokenText?.trim(), confirm: step.confirm.trim() || (language === 'ur' ? 'میں نے یہ کر لیا' : 'I did this')}));
    if (!appName.trim() || !appPackage.trim() || !title.trim() || cleanSteps.some(step => !step.text)) { Alert.alert(language === 'ur' ? 'معلومات مکمل کریں' : 'Complete the guide', language === 'ur' ? 'ایپ، عنوان اور ہر قدم کی ہدایت شامل کریں۔' : 'Add the app, title, and an instruction for every step.'); return; }
    const draft: TutorialDraft = {appName, appPackage, title, description, language, visibility: published ? 'published' : 'private', steps: cleanSteps};
    setSaving(true);
    try { await tutorialRepository.createGuide(draft); Alert.alert(language === 'ur' ? 'گائیڈ محفوظ ہو گئی' : 'Guide saved', language === 'ur' ? 'ہوم اسکرین پر جا کر اپنی گائیڈ شروع کریں۔' : 'Go back to Home to start your guide.'); navigation.goBack(); }
    catch (error) { Alert.alert(language === 'ur' ? 'گائیڈ محفوظ نہیں ہوئی' : 'Could not save guide', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  };
  return <Screen scroll><Back navigation={navigation} language={language}/><CopyText language={language} style={styles.title}>{language === 'ur' ? 'نیا گائیڈ' : 'New guide'}</CopyText><CopyText language={language} style={styles.body}>{language === 'ur' ? 'صرف وہی متن یا accessibility label شامل کریں جسے قدم پہچاننے کے لیے ضروری ہو۔ پاس ورڈ، نجی پیغام یا اسکرین شاٹ شامل نہ کریں۔' : 'Only add labels needed to recognise a step. Do not add passwords, private messages, or screenshots.'}</CopyText>
    <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'ایپ' : 'App'}</CopyText><Button secondary label={language === 'ur' ? 'انسٹال شدہ ایپس منتخب کریں' : 'Choose an installed app'} rtl={language === 'ur'} onPress={() => setShowApps(value => !value)}/>{showApps && <View style={styles.appPicker}>{apps.length ? apps.slice(0, 80).map(app => <Pressable key={app.packageName} style={styles.appOption} onPress={() => { setAppName(app.label); setAppPackage(app.packageName); setShowApps(false); }}><Text style={styles.appOptionLabel}>{app.label}</Text><Text style={styles.appOptionPackage}>{app.packageName}</Text></Pressable>) : <CopyText language={language} style={styles.cardBody}>{language === 'ur' ? 'ایپس کی فہرست دستیاب نہیں ہے؛ نیچے نام اور package ID لکھیں۔' : 'The app list is unavailable; enter the name and package ID below.'}</CopyText>}</View>}
    <TextInput value={appName} onChangeText={setAppName} placeholder={language === 'ur' ? 'ایپ کا نام، مثلاً WhatsApp' : 'App name, for example WhatsApp'} placeholderTextColor="#657568" style={styles.input}/><TextInput autoCapitalize="none" autoCorrect={false} value={appPackage} onChangeText={setAppPackage} placeholder="Package ID, for example com.whatsapp" placeholderTextColor="#657568" style={styles.input}/><TextInput value={title} onChangeText={setTitle} placeholder={language === 'ur' ? 'گائیڈ کا عنوان' : 'Guide title'} placeholderTextColor="#657568" style={styles.input}/><TextInput value={description} onChangeText={setDescription} multiline placeholder={language === 'ur' ? 'مختصر وضاحت (اختیاری)' : 'Short description (optional)'} placeholderTextColor="#657568" style={[styles.input, styles.multilineInput]}/>
    <View style={styles.setting}><CopyText language={language}>{language === 'ur' ? 'کمیونٹی کے ساتھ شیئر کریں' : 'Share with the community'}</CopyText><Switch value={published} onValueChange={setPublished} trackColor={{true: C.sage}}/></View>{published && <CopyText language={language} style={styles.footnote}>{language === 'ur' ? 'صرف محفوظ، عمومی گائیڈ شائع کریں۔ شائع گائیڈ کو استعمال سے پہلے جائزہ لینے کی ضرورت ہو سکتی ہے۔' : 'Only publish safe, general guides. Published guides may need review before being shown to others.'}</CopyText>}
    <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'قدم' : 'Steps'}</CopyText>{steps.map((step, index) => <View style={styles.stepEditor} key={step.id}><View style={styles.stepHeader}><CopyText language={language} style={styles.stepTitle}>{language === 'ur' ? 'قدم' : 'Step'} {index + 1}</CopyText>{steps.length > 1 && <Pressable onPress={() => removeStep(index)}><CopyText language={language} style={styles.remove}>{language === 'ur' ? 'حذف کریں' : 'Remove'}</CopyText></Pressable>}</View><TextInput multiline value={step.text} onChangeText={text => updateStep(index, {text})} placeholder={language === 'ur' ? 'صارف کو کیا کرنا ہے؟' : 'What should the person do?'} placeholderTextColor="#657568" style={[styles.input, styles.multilineInput]}/><TextInput multiline value={step.spokenText} onChangeText={spokenText => updateStep(index, {spokenText})} placeholder={language === 'ur' ? 'بولنے کے لیے متن (اختیاری)' : 'Text to narrate (optional)'} placeholderTextColor="#657568" style={[styles.input, styles.multilineInput]}/><TextInput value={step.confirm} onChangeText={confirm => updateStep(index, {confirm})} placeholder={language === 'ur' ? 'تصدیقی بٹن کا متن' : 'Confirmation button text'} placeholderTextColor="#657568" style={styles.input}/><CopyText language={language} style={styles.matcherLabel}>{language === 'ur' ? 'خودکار شناخت (اختیاری)' : 'Automatic detection (optional)'}</CopyText><TextInput value={typeof step.matcher?.text === 'string' ? step.matcher.text : ''} onChangeText={value => updateMatcher(index, 'text', value)} placeholder={language === 'ur' ? 'بٹن کا دکھائی دینے والا متن' : 'Visible button text'} placeholderTextColor="#657568" style={styles.input}/><TextInput autoCapitalize="none" value={typeof step.matcher?.resourceId === 'string' ? step.matcher.resourceId : ''} onChangeText={value => updateMatcher(index, 'resourceId', value)} placeholder="Resource ID (optional)" placeholderTextColor="#657568" style={styles.input}/><TextInput value={typeof step.matcher?.contentDescription === 'string' ? step.matcher.contentDescription : ''} onChangeText={value => updateMatcher(index, 'contentDescription', value)} placeholder={language === 'ur' ? 'Accessibility description (اختیاری)' : 'Accessibility description (optional)'} placeholderTextColor="#657568" style={styles.input}/></View>)}
    <Button secondary label={language === 'ur' ? 'ایک اور قدم شامل کریں' : 'Add another step'} rtl={language === 'ur'} onPress={addStep}/><Button disabled={saving} label={saving ? (language === 'ur' ? 'محفوظ ہو رہی ہے' : 'Saving…') : (language === 'ur' ? 'گائیڈ محفوظ کریں' : 'Save guide')} rtl={language === 'ur'} onPress={save}/>
  </Screen>;
}

function Settings({navigation, language, setLanguage}: {navigation: any; language: Language; setLanguage: (value: Language) => void}) {
  const c = copyFor(language);
  const [voice, setVoice] = useState(true);
  const [large, setLarge] = useState(false);
  useEffect(() => { StepliOverlay.getVoiceGuidance().then(setVoice).catch(() => setVoice(true)); }, []);
  const updateVoice = async (enabled: boolean) => { setVoice(enabled); await StepliOverlay.setVoiceGuidance(enabled); };
  const close = () => { StepliOverlay.closeNavigator(); Alert.alert(language === 'ur' ? 'نیویگیٹر بند ہو گیا' : 'Navigator closed', language === 'ur' ? 'فلوٹنگ بٹن، ہائی لائٹ اور آواز سب بند کر دیے گئے ہیں۔' : 'The floating button, highlight, and voice have all been stopped.'); };
  return <Screen scroll><Back navigation={navigation} language={language}/><CopyText language={language} style={styles.title}>{c.settings.title}</CopyText><CopyText language={language} style={styles.settingLabel}>{c.settings.language}</CopyText><Pressable style={styles.setting} onPress={() => setLanguage('en')}><Text>English</Text>{language === 'en' && <Text style={styles.active}>{c.settings.selected}</Text>}</Pressable><Pressable style={styles.setting} onPress={() => setLanguage('ur')}><CopyText language="ur">اردو</CopyText>{language === 'ur' && <CopyText language="ur" style={styles.active}>{c.settings.selected}</CopyText>}</Pressable><Row language={language} label={c.settings.voice} value={voice} setValue={updateVoice}/><Row language={language} label={c.settings.textSize} value={large} setValue={setLarge}/><CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'ایکٹو گائیڈ' : 'Active guide'}</CopyText><Button danger label={language === 'ur' ? 'نیویگیٹر مکمل بند کریں' : 'Close navigator completely'} rtl={language === 'ur'} onPress={close}/><CopyText language={language} style={styles.footnote}>{language === 'ur' ? 'یہ اختیار ہدایت کارڈ، فلوٹنگ بٹن، ہائی لائٹ اور آواز سب کو فوراً بند کر دیتا ہے۔' : 'This immediately removes the instruction card, floating button, highlight, and narration.'}</CopyText></Screen>;
}

function Row({label, value, setValue, language}: any) {
  return <View style={styles.setting}><CopyText language={language}>{label}</CopyText><Switch value={value} onValueChange={setValue} trackColor={{true: C.sage}}/></View>;
}

function Celebration({navigation, route, language}: any) {
  const c = copyFor(language);
  return <Screen><Text style={styles.celebrate}>🎉</Text><CopyText language={language} style={styles.title}>{c.celebration.headline}</CopyText><CopyText language={language} style={styles.body}>{route.params?.title ? `${route.params.title}. ${c.celebration.body}` : c.celebration.body}</CopyText><View style={styles.flex}/><Button rtl={language === 'ur'} label={c.celebration.ctaHome} onPress={() => navigation.replace('Home')}/></Screen>;
}

export default function App() {
  const [language, setLanguageState] = useState<Language | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => tutorialRepository.subscribeSession(next => setSession(next)), []);
  useEffect(() => {
    Promise.all([
      StepliOverlay.getLanguage(),
      StepliOverlay.getOnboardingComplete(),
      tutorialRepository.restoreSession().catch(() => null),
    ]).then(([savedLanguage, complete, restoredSession]) => {
      setLanguageState(savedLanguage);
      setOnboardingComplete(complete);
      setSession(restoredSession);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);
  const setLanguage = async (value: Language) => { await StepliOverlay.setLanguage(value); setLanguageState(value); };
  const completeOnboarding = async () => { await StepliOverlay.setOnboardingComplete(); setOnboardingComplete(true); };
  if (!loaded) return <SafeAreaView style={styles.safe}/>;
  if (!language) return <LanguageScreen onChoose={setLanguage}/>;
  return <NavigationContainer><Stack.Navigator initialRouteName={onboardingComplete ? 'Home' : 'Permissions'} screenOptions={{headerShown: false, animation: 'fade'}}><Stack.Screen name="Permissions">{props => <Permissions {...props} language={language}/>}</Stack.Screen><Stack.Screen name="Onboarding">{props => <Onboarding {...props} language={language} completeOnboarding={completeOnboarding}/>}</Stack.Screen><Stack.Screen name="Home">{props => <Home {...props} language={language} session={session} onSessionChange={setSession}/>}</Stack.Screen><Stack.Screen name="Settings">{props => <Settings {...props} language={language} setLanguage={setLanguage}/>}</Stack.Screen><Stack.Screen name="Account">{props => <Account {...props} language={language} session={session} onSessionChange={setSession}/>}</Stack.Screen><Stack.Screen name="Guides">{props => <Guides {...props} language={language} session={session}/>}</Stack.Screen><Stack.Screen name="GuideEditor">{props => <GuideEditor {...props} language={language}/>}</Stack.Screen><Stack.Screen name="Celebration">{props => <Celebration {...props} language={language}/>}</Stack.Screen></Stack.Navigator></NavigationContainer>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.cream}, scroll:{flexGrow:1}, screen:{flex:1,padding:28,backgroundColor:C.cream}, heroLogo:{width:128,height:128,alignSelf:'center',marginTop:42,resizeMode:'contain'}, eyebrow:{color:C.sage,fontWeight:'700',letterSpacing:1,textTransform:'uppercase',fontSize:13,marginTop:24}, title:{fontFamily:'serif',fontSize:38,lineHeight:46,color:C.dark,marginTop:18,fontWeight:'700'}, homeTitle:{fontFamily:'serif',fontSize:34,lineHeight:42,color:C.dark,marginTop:56,fontWeight:'700'}, body:{fontSize:19,lineHeight:29,color:C.ink,marginTop:18}, button:{minHeight:56,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:C.amber,marginTop:20,paddingHorizontal:20}, buttonText:{color:'#fff',fontSize:18,fontWeight:'700',textAlign:'center'}, secondary:{backgroundColor:'transparent',borderWidth:1,borderColor:C.sage}, secondaryText:{color:C.dark}, danger:{backgroundColor:C.danger}, dangerText:{color:'#fff'}, disabled:{opacity:.55}, permissionStatus:{backgroundColor:C.pale,borderRadius:16,padding:18,gap:12,marginTop:32}, guide:{backgroundColor:'#FFF0DF',borderRadius:16,padding:18,marginTop:18}, guideTitle:{fontSize:17,fontWeight:'700',color:C.dark}, guideBody:{fontSize:15,lineHeight:23,color:C.ink,marginTop:8}, footnote:{fontSize:14,lineHeight:20,color:C.ink,marginTop:14}, flex:{flex:1}, topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, topActions:{flexDirection:'row',alignItems:'center',gap:14}, brand:{flexDirection:'row',alignItems:'center',gap:8}, headerLogo:{width:38,height:38,resizeMode:'contain'}, logo:{fontFamily:'serif',fontWeight:'700',fontSize:28,color:C.dark}, settings:{fontSize:16,color:C.sage,fontWeight:'700'}, taskCard:{backgroundColor:C.pale,borderRadius:22,padding:20,marginTop:16,flexDirection:'row',alignItems:'center',gap:14}, addGuideCard:{backgroundColor:'#F6F9F0',borderColor:C.sage,borderWidth:1,borderStyle:'dashed',borderRadius:22,padding:20,marginTop:22,flexDirection:'row',alignItems:'center',gap:14}, cardIcon:{fontSize:36}, addGuideIcon:{fontSize:35,color:C.sage}, cardTitle:{fontSize:21,fontWeight:'700',color:C.dark,lineHeight:27}, cardBody:{fontSize:15,lineHeight:21,color:C.ink,marginTop:5}, cardMeta:{fontSize:13,lineHeight:18,color:C.sage,fontWeight:'700',marginTop:7}, arrow:{fontSize:40,color:C.amber}, settingLabel:{fontSize:15,color:C.sage,fontWeight:'700',marginTop:28,marginBottom:8}, setting:{minHeight:61,borderBottomWidth:1,borderColor:'#D9DECF',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, active:{color:C.sage,fontWeight:'700'}, rtl:{writingDirection:'rtl',textAlign:'right',fontFamily:'NotoSansArabic-Regular'}, sectionRow:{marginTop:32,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, sectionTitle:{fontSize:21,fontWeight:'700',color:C.dark}, link:{fontSize:15,fontWeight:'700',color:C.sage}, activeGuide:{backgroundColor:'#FFF0DF',borderRadius:16,padding:17,marginTop:24}, activeGuideTitle:{fontWeight:'700',fontSize:17,color:C.dark}, activeGuideText:{fontSize:15,lineHeight:22,color:C.ink,marginTop:5}, loader:{marginTop:18}, back:{alignSelf:'flex-start',paddingVertical:7,paddingRight:18}, backText:{fontSize:16,fontWeight:'700',color:C.sage}, notice:{backgroundColor:'#FFF0DF',borderRadius:16,padding:18,marginTop:22}, noticeTitle:{fontSize:17,fontWeight:'700',color:C.dark}, noticeBody:{fontSize:15,lineHeight:22,color:C.ink,marginTop:8}, authCard:{backgroundColor:C.pale,borderRadius:18,padding:18,marginTop:22}, input:{minHeight:51,borderWidth:1,borderColor:C.sage,borderRadius:13,paddingHorizontal:14,paddingVertical:11,fontSize:16,color:C.ink,backgroundColor:C.white,marginTop:12}, multilineInput:{minHeight:78,textAlignVertical:'top'}, signedIn:{backgroundColor:C.pale,borderRadius:14,padding:16,marginTop:22,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10}, guideListItem:{backgroundColor:C.white,borderRadius:14,padding:16,marginTop:10}, appPicker:{backgroundColor:C.white,borderRadius:14,marginTop:12,maxHeight:330,overflow:'hidden'}, appOption:{padding:14,borderBottomWidth:1,borderColor:'#D9DECF'}, appOptionLabel:{fontSize:16,color:C.dark,fontWeight:'700'}, appOptionPackage:{fontSize:12,color:C.sage,marginTop:3}, stepEditor:{backgroundColor:C.pale,borderRadius:18,padding:16,marginTop:14}, stepHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, stepTitle:{fontSize:18,fontWeight:'700',color:C.dark}, remove:{fontSize:14,fontWeight:'700',color:C.danger}, matcherLabel:{fontSize:14,color:C.sage,fontWeight:'700',marginTop:15}, celebrate:{fontSize:64,marginTop:70,textAlign:'center'},
});
