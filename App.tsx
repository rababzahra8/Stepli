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

function errorMessage(error: unknown, fallback = 'Please try again.') {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const value = error as {message?: unknown; code?: unknown; statusCode?: unknown};
    if (typeof value.message === 'string' && value.message) return value.message;
    if (value.code != null) return String(value.code);
    if (value.statusCode != null) return `Error ${value.statusCode}`;
  }
  return fallback;
}

function logAuthError(stage: string, error: unknown) {
  const details =
    error && typeof error === 'object'
      ? {
          message: (error as {message?: unknown}).message,
          code: (error as {code?: unknown}).code,
          statusCode: (error as {statusCode?: unknown}).statusCode,
          name: (error as {name?: unknown}).name,
          stack: error instanceof Error ? error.stack : undefined,
          raw: (() => {
            try {
              return JSON.parse(JSON.stringify(error));
            } catch {
              return String(error);
            }
          })(),
        }
      : {raw: String(error)};
  console.error(`[Stepli Auth] ${stage}`, details);
}

function friendlyAuthMessage(error: unknown, language: Language) {
  const raw = errorMessage(error).toLowerCase();
  if (raw.includes('already') || raw.includes('registered') || raw.includes('exists')) {
    return language === 'ur'
      ? 'یہ ای میل پہلے سے موجود ہے۔ اگر تصدیق نہیں ہوئی تو Supabase Auth → Users سے اس صارف کو حذف کریں، یا Continue with Google دوبارہ آزمائیں۔'
      : 'This email is already registered. If it was never confirmed, delete that user in Supabase Auth → Users, then try Continue with Google again.';
  }
  if (raw.includes('confirm') || raw.includes('not confirmed') || raw.includes('email not confirmed')) {
    return language === 'ur'
      ? 'ای میل تصدیق نہیں ہوئی۔ فری ٹائر پر ای میل اکثر نہیں آتی — Confirm email بند کریں یا Google استعمال کریں۔'
      : 'Email is not confirmed. Free-tier confirmation emails often never arrive — turn off Confirm email in Supabase, or use Google.';
  }
  return errorMessage(error);
}

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
const C = {bg: '#E8EEE4', cream: '#A8C3A0', sage: '#6E8B72', dark: '#284435', amber: '#C86D45', ink: '#3A4A3E', pale: '#F2F5EE', white: '#FFFFFF', danger: '#9D3D35', line: '#D5DDD0'};
const stepliLogo = require('./src/assets/stepli-bot.png');
const copyFor = (language: Language) => language === 'ur' ? ur : en;

function Loader({label, language}: {label?: string; language?: Language}) {
  return <View style={styles.loaderRow}><ActivityIndicator color={C.sage}/>{label ? <Text style={[styles.loaderLabel, language === 'ur' && styles.rtl]}>{label}</Text> : null}</View>;
}

function Button({label, onPress, secondary = false, danger = false, disabled = false, rtl = false, busy = false}: {label: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; rtl?: boolean; busy?: boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled || busy} style={[styles.button, secondary && styles.secondary, danger && styles.danger, (disabled || busy) && styles.disabled]} onPress={onPress}>{busy ? <ActivityIndicator color={secondary ? C.dark : '#fff'}/> : <Text style={[styles.buttonText, secondary && styles.secondaryText, danger && styles.dangerText, rtl && styles.rtl]}>{label}</Text>}</Pressable>;
}

function Screen({children, scroll = false}: {children: React.ReactNode; scroll?: boolean}) {
  const content = <View style={styles.screen}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}</SafeAreaView>;
}

function CopyText({children, style, language, numberOfLines}: {children: React.ReactNode; style?: object | object[]; language: Language; numberOfLines?: number}) {
  return <Text style={[style, language === 'ur' && styles.rtl]} numberOfLines={numberOfLines}>{children}</Text>;
}

function Back({navigation, language}: {navigation: any; language: Language}) {
  return <Pressable accessibilityRole="button" style={styles.back} onPress={() => navigation.goBack()}><CopyText language={language} style={styles.backText}>{language === 'ur' ? 'واپس' : 'Back'}</CopyText></Pressable>;
}

function LanguageScreen({onChoose}: {onChoose: (language: Language) => void}) {
  return <Screen><Image source={stepliLogo} style={styles.heroLogo}/><Text style={styles.eyebrow}>Stepli</Text><Text style={styles.title}>Choose language / زبان منتخب کریں</Text><View style={styles.flex}/><Button label="English" onPress={() => onChoose('en')}/><Button label="اردو" rtl onPress={() => onChoose('ur')} secondary/></Screen>;
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

function Home({navigation, language, session}: {navigation: any; language: Language; session: AuthSession | null}) {
  const c = copyFor(language);
  const foodpanda = useMemo(() => getFoodpandaTutorial(language), [language]);
  const [communityGuides, setCommunityGuides] = useState<TutorialGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [active, setActive] = useState<ActiveTutorial | null>(null);
  const [starting, setStarting] = useState(false);
  const activeRef = useRef<ActiveTutorial | null>(null);

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
    setStarting(true);
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
    } finally {
      setStarting(false);
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

  return <Screen scroll>
    <View style={styles.topRow}>
      <View style={styles.brand}><Image source={stepliLogo} style={styles.headerLogo}/><Text style={styles.logo}>Stepli</Text></View>
      <View style={styles.topActions}>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Account')}><CopyText language={language} style={styles.settings}>{session ? (language === 'ur' ? 'اکاؤنٹ' : 'Account') : (language === 'ur' ? 'سائن اِن' : 'Sign in')}</CopyText></Pressable>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')}><CopyText language={language} style={styles.settings}>{c.home.settings}</CopyText></Pressable>
      </View>
    </View>
    <CopyText language={language} style={styles.homeTitle}>{c.home.greeting}</CopyText>
    {starting ? <Loader language={language} label={language === 'ur' ? 'گائیڈ شروع ہو رہی ہے…' : 'Starting guide…'}/> : null}
    {active ? <View style={styles.activeGuide}><CopyText language={language} style={styles.activeGuideTitle}>{active.guide.title} · {active.index + 1}/{active.guide.steps.length}</CopyText><Button danger label={language === 'ur' ? 'روکیں' : 'Stop'} rtl={language === 'ur'} onPress={closeNavigator}/></View> : null}
    <CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'گائیڈز' : 'Guides'}</CopyText>
    <TutorialCard guide={foodpanda} language={language} onPress={() => begin(foodpanda)}/>
    <View style={styles.sectionRow}>
      <CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'کمیونٹی' : 'Community'}</CopyText>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate(session ? 'Guides' : 'Account')}><CopyText language={language} style={styles.link}>{session ? (language === 'ur' ? 'سب' : 'All') : (language === 'ur' ? 'سائن اِن' : 'Sign in')}</CopyText></Pressable>
    </View>
    {session ? <View>
      {loadingGuides ? <Loader language={language} label={language === 'ur' ? 'لوڈ ہو رہا ہے…' : 'Loading…'}/> : null}
      {!loadingGuides ? communityGuides.slice(0, 2).map(guide => <TutorialCard key={guide.id} guide={guide} language={language} onPress={() => begin(guide)}/>) : null}
      {!loadingGuides && !communityGuides.length ? <CopyText language={language} style={styles.hint}>{language === 'ur' ? 'ابھی کوئی کمیونٹی گائیڈ نہیں۔' : 'No community guides yet.'}</CopyText> : null}
      {communityGuides.length > 2 ? <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Guides')}><CopyText language={language} style={styles.link}>{language === 'ur' ? 'مزید دیکھیں' : 'See more'}</CopyText></Pressable> : null}
    </View> : <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Account')} style={styles.notice}><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'کمیونٹی کے لیے سائن اِن کریں۔' : 'Sign in for community guides.'}</CopyText></Pressable>}
    <Pressable accessibilityRole="button" onPress={() => navigation.navigate(session ? 'GuideEditor' : 'Account')} style={styles.addGuideCard}>
      <Text style={styles.addGuideIcon}>＋</Text>
      <CopyText language={language} style={styles.cardTitle}>{session ? (language === 'ur' ? 'نیا گائیڈ' : 'New guide') : (language === 'ur' ? 'گائیڈ کے لیے سائن اِن' : 'Sign in to create')}</CopyText>
    </Pressable>
  </Screen>;
}

function TutorialCard({guide, language, onPress}: {guide: TutorialGuide; language: Language; onPress: () => void}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.taskCard}><Text style={styles.cardIcon}>{guide.icon || '📱'}</Text><View style={styles.flex}><CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{guide.title}</CopyText><CopyText language={language} style={styles.cardBody} numberOfLines={1}>{guide.description || (language === 'ur' ? `${guide.steps.length} قدم` : `${guide.steps.length} steps`)}</CopyText></View><Text style={styles.arrow}>›</Text></Pressable>;
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
    console.log(`[Stepli Auth] email ${signup ? 'signUp' : 'signIn'} starting`);
    try {
      const next = signup ? await tutorialRepository.signUp(email, password) : await tutorialRepository.signIn(email, password);
      if (!next) {
        console.warn('[Stepli Auth] email signUp returned no session (confirmation required)');
        Alert.alert(
          language === 'ur' ? 'ای میل تصدیق' : 'Email confirmation',
          language === 'ur'
            ? 'اس ای میل سے اکاؤنٹ بن گیا ہے لیکن تصدیق نہیں ہوئی۔ فری ٹائر پر ای میل اکثر نہیں آتی۔ اسی ای میل سے Continue with Google استعمال کریں، یا Supabase میں Confirm email بند کر دیں۔'
            : 'An account was created but not confirmed. On free-tier Supabase the confirmation email often never arrives. Use Continue with Google with the same email, or turn off Confirm email in the Supabase Auth settings.',
        );
      } else {
        console.log('[Stepli Auth] email auth ok', {userId: next.userId, email: next.email});
        onSessionChange(next);
        setPassword('');
      }
    } catch (error) {
      logAuthError(signup ? 'email signUp failed' : 'email signIn failed', error);
      Alert.alert(language === 'ur' ? 'سائن اِن نہیں ہو سکا' : 'Could not sign in', friendlyAuthMessage(error, language));
    }
    finally { setBusy(false); }
  };
  const authenticateWithGoogle = async () => {
    if (!googleWebClientId) {
      console.error('[Stepli Auth] Google sign-in blocked: missing webClientId (rebuild after setting STEPLI_GOOGLE_WEB_CLIENT_ID)');
      return;
    }
    setBusy(true);
    console.log('[Stepli Auth] Google sign-in starting', {webClientIdSuffix: googleWebClientId.slice(-24)});
    try {
      GoogleSignin.configure({webClientId: googleWebClientId});
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      // Clear the previous Google account so the email picker shows again.
      try { await GoogleSignin.signOut(); } catch (error) { console.log('[Stepli Auth] Google signOut before picker', errorMessage(error)); }
      const result = await GoogleSignin.signIn();
      console.log('[Stepli Auth] Google account picker result', {
        type: result.type,
        hasIdToken: Boolean(result.type === 'success' && result.data?.idToken),
        email: result.type === 'success' ? result.data?.user?.email : undefined,
      });
      if (result.type === 'cancelled') {
        console.warn('[Stepli Auth] Google sign-in cancelled by user');
        return;
      }
      if (!result.data.idToken) throw new Error('Google did not return an ID token. Check the Web client ID configuration.');
      const session = await tutorialRepository.signInWithGoogle(result.data.idToken);
      console.log('[Stepli Auth] Google → Supabase session ok', {userId: session.userId, email: session.email});
      onSessionChange(session);
    } catch (error) {
      logAuthError('Google sign-in failed', error);
      Alert.alert(language === 'ur' ? 'گوگل سے سائن اِن نہیں ہو سکا' : 'Could not sign in with Google', friendlyAuthMessage(error, language));
    }
    finally { setBusy(false); }
  };
  return <Screen scroll><Back navigation={navigation} language={language}/><CopyText language={language} style={styles.title}>{language === 'ur' ? 'اکاؤنٹ' : 'Account'}</CopyText>
    {!configured ? <View style={styles.notice}><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'Supabase URL اور key کو .env میں رکھ کر ایپ دوبارہ بنائیں۔' : 'Add Supabase URL and key to .env, then rebuild.'}</CopyText></View> : session ? <View style={styles.authCard}><CopyText language={language} style={styles.hint}>{language === 'ur' ? 'سائن اِن' : 'Signed in'}</CopyText><CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{session.email || session.userId}</CopyText><CopyText language={language} style={styles.hint}>{language === 'ur' ? 'لاگ آؤٹ Settings میں ہے۔' : 'Log out is in Settings.'}</CopyText></View> : <View style={styles.authCard}>{googleWebClientId ? <Button busy={busy} label={language === 'ur' ? 'گوگل سے جاری رکھیں' : 'Continue with Google'} rtl={language === 'ur'} onPress={authenticateWithGoogle}/> : null}<TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#8A968C" style={styles.input}/><TextInput autoCapitalize="none" autoCorrect={false} secureTextEntry value={password} onChangeText={setPassword} placeholder={language === 'ur' ? 'پاس ورڈ (8+)' : 'Password (8+)'} placeholderTextColor="#8A968C" style={styles.input}/><Button busy={busy} label={language === 'ur' ? 'سائن اِن' : 'Sign in'} rtl={language === 'ur'} onPress={() => authenticate(false)}/><Button disabled={busy} secondary label={language === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create account'} rtl={language === 'ur'} onPress={() => authenticate(true)}/></View>}
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
  return <Screen scroll><Back navigation={navigation} language={language}/><CopyText language={language} style={styles.title}>{language === 'ur' ? 'گائیڈز' : 'Guides'}</CopyText>
    {!configured ? <View style={styles.notice}><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'Supabase سیٹ اپ مکمل کریں۔' : 'Finish Supabase setup first.'}</CopyText></View> : !session ? <View style={styles.authCard}><CopyText language={language} style={styles.noticeBody}>{language === 'ur' ? 'کمیونٹی گائیڈز کے لیے سائن اِن کریں۔' : 'Sign in to browse community guides.'}</CopyText><Button label={language === 'ur' ? 'سائن اِن' : 'Sign in'} rtl={language === 'ur'} onPress={() => navigation.navigate('Account')}/></View> : <View><Button label={language === 'ur' ? 'نیا گائیڈ' : 'New guide'} rtl={language === 'ur'} onPress={() => navigation.navigate('GuideEditor')}/>{loading ? <Loader language={language} label={language === 'ur' ? 'لوڈ ہو رہا ہے…' : 'Loading guides…'}/> : null}{!loading ? guides.map(guide => <View style={styles.guideListItem} key={guide.id}><CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{guide.title}</CopyText><CopyText language={language} style={styles.cardBody} numberOfLines={1}>{guide.appName} · {guide.steps.length} {language === 'ur' ? 'قدم' : 'steps'}</CopyText></View>) : null}{!loading && !guides.length ? <CopyText language={language} style={styles.hint}>{language === 'ur' ? 'ابھی کوئی گائیڈ نہیں۔' : 'No guides yet.'}</CopyText> : null}</View>}
  </Screen>;
}

function GuideEditor({navigation, language}: any) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [appQuery, setAppQuery] = useState('');
  const [showApps, setShowApps] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [appName, setAppName] = useState('');
  const [appPackage, setAppPackage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([{id: 'draft-1', text: '', spokenText: '', confirm: '', matcher: {}}]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingApps(true);
    StepliOverlay.getLaunchableApps()
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoadingApps(false));
  }, []);

  const filteredApps = useMemo(() => {
    const query = appQuery.trim().toLowerCase();
    const list = query
      ? apps.filter(app => app.label.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query))
      : apps;
    return list.slice(0, 100);
  }, [apps, appQuery]);

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
    catch (error) { Alert.alert(language === 'ur' ? 'گائیڈ محفوظ نہیں ہوئی' : 'Could not save guide', errorMessage(error)); }
    finally { setSaving(false); }
  };
  return <Screen scroll><Back navigation={navigation} language={language}/><CopyText language={language} style={styles.title}>{language === 'ur' ? 'نیا گائیڈ' : 'New guide'}</CopyText>
    <Button secondary label={appName || (language === 'ur' ? 'ایپ منتخب کریں' : 'Choose app')} rtl={language === 'ur'} onPress={() => setShowApps(value => !value)}/>
    {showApps ? <View style={styles.appPicker}>
      <TextInput value={appQuery} onChangeText={setAppQuery} autoCorrect={false} placeholder={language === 'ur' ? 'ایپ تلاش کریں…' : 'Search installed apps…'} placeholderTextColor="#8A968C" style={styles.searchInput}/>
      {loadingApps ? <Loader language={language} label={language === 'ur' ? 'ایپس لوڈ ہو رہی ہیں…' : 'Loading apps…'}/> : <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.appPickerList}>
        {filteredApps.length ? filteredApps.map(app => <Pressable key={app.packageName} style={styles.appOption} onPress={() => { setAppName(app.label); setAppPackage(app.packageName); setShowApps(false); setAppQuery(''); }}><Text style={styles.appOptionLabel} numberOfLines={1}>{app.label}</Text><Text style={styles.appOptionPackage} numberOfLines={1}>{app.packageName}</Text></Pressable>) : <CopyText language={language} style={styles.hint}>{language === 'ur' ? 'کوئی ایپ نہیں ملی۔ نیچے دستی لکھیں۔' : 'No apps matched. Type details below.'}</CopyText>}
      </ScrollView>}
    </View> : null}
    <TextInput value={appName} onChangeText={setAppName} placeholder={language === 'ur' ? 'ایپ کا نام' : 'App name'} placeholderTextColor="#8A968C" style={styles.input}/>
    <TextInput autoCapitalize="none" autoCorrect={false} value={appPackage} onChangeText={setAppPackage} placeholder="com.example.app" placeholderTextColor="#8A968C" style={styles.input}/>
    <TextInput value={title} onChangeText={setTitle} placeholder={language === 'ur' ? 'عنوان' : 'Title'} placeholderTextColor="#8A968C" style={styles.input}/>
    <TextInput value={description} onChangeText={setDescription} placeholder={language === 'ur' ? 'مختصر وضاحت (اختیاری)' : 'Short description (optional)'} placeholderTextColor="#8A968C" style={styles.input}/>
    <View style={styles.setting}><CopyText language={language}>{language === 'ur' ? 'کمیونٹی میں شیئر' : 'Share publicly'}</CopyText><Switch value={published} onValueChange={setPublished} trackColor={{true: C.sage}}/></View>
    <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'قدم' : 'Steps'}</CopyText>
    {steps.map((step, index) => <View style={styles.stepEditor} key={step.id}><View style={styles.stepHeader}><CopyText language={language} style={styles.stepTitle}>{language === 'ur' ? 'قدم' : 'Step'} {index + 1}</CopyText>{steps.length > 1 ? <Pressable onPress={() => removeStep(index)}><CopyText language={language} style={styles.remove}>{language === 'ur' ? 'حذف' : 'Remove'}</CopyText></Pressable> : null}</View><TextInput multiline value={step.text} onChangeText={text => updateStep(index, {text})} placeholder={language === 'ur' ? 'صارف کیا کرے؟' : 'What should they do?'} placeholderTextColor="#8A968C" style={[styles.input, styles.multilineInput]}/><TextInput value={step.confirm} onChangeText={confirm => updateStep(index, {confirm})} placeholder={language === 'ur' ? 'بٹن کا متن' : 'Confirm button'} placeholderTextColor="#8A968C" style={styles.input}/>{showAdvanced ? <View><TextInput multiline value={step.spokenText} onChangeText={spokenText => updateStep(index, {spokenText})} placeholder={language === 'ur' ? 'بولنے کا متن' : 'Narration (optional)'} placeholderTextColor="#8A968C" style={[styles.input, styles.multilineInput]}/><TextInput value={typeof step.matcher?.text === 'string' ? step.matcher.text : ''} onChangeText={value => updateMatcher(index, 'text', value)} placeholder={language === 'ur' ? 'بٹن کا متن' : 'Visible label'} placeholderTextColor="#8A968C" style={styles.input}/><TextInput autoCapitalize="none" value={typeof step.matcher?.resourceId === 'string' ? step.matcher.resourceId : ''} onChangeText={value => updateMatcher(index, 'resourceId', value)} placeholder="Resource ID" placeholderTextColor="#8A968C" style={styles.input}/></View> : null}</View>)}
    <Pressable accessibilityRole="button" onPress={() => setShowAdvanced(value => !value)}><CopyText language={language} style={styles.link}>{showAdvanced ? (language === 'ur' ? 'کم دکھائیں' : 'Hide advanced') : (language === 'ur' ? 'اضافی اختیارات' : 'Advanced options')}</CopyText></Pressable>
    <Button secondary label={language === 'ur' ? 'قدم شامل کریں' : 'Add step'} rtl={language === 'ur'} onPress={addStep}/>
    <Button busy={saving} label={language === 'ur' ? 'محفوظ کریں' : 'Save guide'} rtl={language === 'ur'} onPress={save}/>
  </Screen>;
}

function Settings({navigation, language, setLanguage, session, onSessionChange}: {navigation: any; language: Language; setLanguage: (value: Language) => void; session: AuthSession | null; onSessionChange: (session: AuthSession | null) => void}) {
  const c = copyFor(language);
  const [voice, setVoice] = useState(true);
  const [large, setLarge] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { StepliOverlay.getVoiceGuidance().then(setVoice).catch(() => setVoice(true)); }, []);
  const updateVoice = async (enabled: boolean) => { setVoice(enabled); await StepliOverlay.setVoiceGuidance(enabled); };
  const close = () => { StepliOverlay.closeNavigator(); Alert.alert(language === 'ur' ? 'نیویگیٹر بند ہو گیا' : 'Navigator closed', language === 'ur' ? 'ہدایت اور آواز بند کر دی گئی۔' : 'Guidance overlay and voice were stopped.'); };
  const signOut = async () => {
    setBusy(true);
    try {
      await tutorialRepository.signOut();
      try { await GoogleSignin.signOut(); } catch { /* Clears Google's local account choice only. */ }
    } finally {
      onSessionChange(null);
      setBusy(false);
    }
  };
  return <Screen scroll>
    <Back navigation={navigation} language={language}/>
    <CopyText language={language} style={styles.title}>{c.settings.title}</CopyText>
    <CopyText language={language} style={styles.settingLabel}>{c.settings.language}</CopyText>
    <Pressable style={styles.setting} onPress={() => setLanguage('en')}><Text style={styles.settingText}>English</Text>{language === 'en' ? <Text style={styles.active}>{c.settings.selected}</Text> : null}</Pressable>
    <Pressable style={styles.setting} onPress={() => setLanguage('ur')}><CopyText language="ur" style={styles.settingText}>اردو</CopyText>{language === 'ur' ? <CopyText language="ur" style={styles.active}>{c.settings.selected}</CopyText> : null}</Pressable>
    <Row language={language} label={c.settings.voice} value={voice} setValue={updateVoice}/>
    <Row language={language} label={c.settings.textSize} value={large} setValue={setLarge}/>
    <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'اکاؤنٹ' : 'Account'}</CopyText>
    {session ? <View style={styles.authCard}><CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{session.email || session.userId}</CopyText><Button busy={busy} danger label={language === 'ur' ? 'لاگ آؤٹ' : 'Log out'} rtl={language === 'ur'} onPress={signOut}/></View> : <Pressable style={styles.setting} onPress={() => navigation.navigate('Account')}><CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'سائن اِن کریں' : 'Sign in'}</CopyText><Text style={styles.arrow}>›</Text></Pressable>}
    <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'نیویگیٹر' : 'Navigator'}</CopyText>
    <Button danger label={language === 'ur' ? 'نیویگیٹر بند کریں' : 'Stop navigator'} rtl={language === 'ur'} onPress={close}/>
  </Screen>;
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
  if (!loaded) {
    return <SafeAreaView style={styles.safe}><View style={styles.boot}><ActivityIndicator size="large" color={C.sage}/><Text style={styles.loaderLabel}>Loading Stepli…</Text></View></SafeAreaView>;
  }
  if (!language) return <LanguageScreen onChoose={setLanguage}/>;
  return <NavigationContainer><Stack.Navigator initialRouteName={onboardingComplete ? 'Home' : 'Permissions'} screenOptions={{headerShown: false, animation: 'fade'}}><Stack.Screen name="Permissions">{props => <Permissions {...props} language={language}/>}</Stack.Screen><Stack.Screen name="Onboarding">{props => <Onboarding {...props} language={language} completeOnboarding={completeOnboarding}/>}</Stack.Screen><Stack.Screen name="Home">{props => <Home {...props} language={language} session={session}/>}</Stack.Screen><Stack.Screen name="Settings">{props => <Settings {...props} language={language} setLanguage={setLanguage} session={session} onSessionChange={setSession}/>}</Stack.Screen><Stack.Screen name="Account">{props => <Account {...props} language={language} session={session} onSessionChange={setSession}/>}</Stack.Screen><Stack.Screen name="Guides">{props => <Guides {...props} language={language} session={session}/>}</Stack.Screen><Stack.Screen name="GuideEditor">{props => <GuideEditor {...props} language={language}/>}</Stack.Screen><Stack.Screen name="Celebration">{props => <Celebration {...props} language={language}/>}</Stack.Screen></Stack.Navigator></NavigationContainer>;
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  boot: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10},
  scroll: {flexGrow: 1, paddingBottom: 20},
  screen: {flex: 1, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg},
  heroLogo: {width: 72, height: 72, alignSelf: 'center', marginTop: 20, resizeMode: 'contain'},
  eyebrow: {color: C.sage, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', fontSize: 11, marginTop: 10},
  title: {fontSize: 22, lineHeight: 28, color: C.dark, marginTop: 8, fontWeight: '700'},
  homeTitle: {fontSize: 20, lineHeight: 26, color: C.dark, marginTop: 12, marginBottom: 2, fontWeight: '700'},
  body: {fontSize: 13, lineHeight: 18, color: C.ink, marginTop: 6},
  button: {minHeight: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.amber, marginTop: 10, paddingHorizontal: 14},
  buttonText: {color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center'},
  secondary: {backgroundColor: C.white, borderWidth: 1, borderColor: C.line},
  secondaryText: {color: C.dark},
  danger: {backgroundColor: C.danger},
  dangerText: {color: '#fff'},
  disabled: {opacity: 0.55},
  permissionStatus: {backgroundColor: C.white, borderRadius: 10, padding: 12, gap: 6, marginTop: 12, borderWidth: 1, borderColor: C.line},
  guide: {backgroundColor: C.white, borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.line},
  guideTitle: {fontSize: 13, fontWeight: '700', color: C.dark},
  guideBody: {fontSize: 12, lineHeight: 17, color: C.ink, marginTop: 4},
  footnote: {fontSize: 11, lineHeight: 15, color: C.ink, marginTop: 8},
  hint: {fontSize: 12, lineHeight: 16, color: C.ink, marginTop: 6},
  flex: {flex: 1},
  topRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  topActions: {flexDirection: 'row', alignItems: 'center', gap: 12},
  brand: {flexDirection: 'row', alignItems: 'center', gap: 6},
  headerLogo: {width: 26, height: 26, resizeMode: 'contain'},
  logo: {fontWeight: '700', fontSize: 18, color: C.dark},
  settings: {fontSize: 13, color: C.sage, fontWeight: '600'},
  taskCard: {backgroundColor: C.white, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line},
  addGuideCard: {backgroundColor: C.white, borderColor: C.sage, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8},
  cardIcon: {fontSize: 20},
  addGuideIcon: {fontSize: 18, color: C.sage},
  cardTitle: {fontSize: 14, fontWeight: '700', color: C.dark, lineHeight: 18},
  cardBody: {fontSize: 12, lineHeight: 16, color: C.ink, marginTop: 2},
  cardMeta: {fontSize: 11, lineHeight: 14, color: C.sage, fontWeight: '600', marginTop: 2},
  arrow: {fontSize: 20, color: C.amber},
  settingLabel: {fontSize: 11, color: C.sage, fontWeight: '700', marginTop: 14, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4},
  setting: {minHeight: 44, borderBottomWidth: 1, borderColor: C.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  settingText: {fontSize: 14, color: C.dark},
  active: {color: C.sage, fontWeight: '700', fontSize: 12},
  rtl: {writingDirection: 'rtl', textAlign: 'right', fontFamily: 'NotoSansArabic-Regular'},
  sectionRow: {marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sectionTitle: {fontSize: 13, fontWeight: '700', color: C.dark, marginTop: 12},
  link: {fontSize: 12, fontWeight: '700', color: C.sage, marginTop: 6},
  activeGuide: {backgroundColor: C.white, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.line},
  activeGuideTitle: {fontWeight: '700', fontSize: 13, color: C.dark, lineHeight: 17},
  activeGuideText: {fontSize: 12, lineHeight: 16, color: C.ink, marginTop: 2},
  loader: {marginTop: 8},
  loaderRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10},
  loaderLabel: {fontSize: 12, color: C.ink},
  back: {alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 10},
  backText: {fontSize: 13, fontWeight: '700', color: C.sage},
  notice: {backgroundColor: C.white, borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: C.line},
  noticeTitle: {fontSize: 13, fontWeight: '700', color: C.dark},
  noticeBody: {fontSize: 12, lineHeight: 16, color: C.ink},
  authCard: {backgroundColor: C.white, borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.line},
  input: {minHeight: 40, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: C.ink, backgroundColor: C.white, marginTop: 8},
  searchInput: {minHeight: 40, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: C.ink, backgroundColor: C.pale, marginBottom: 6},
  multilineInput: {minHeight: 56, textAlignVertical: 'top'},
  signedIn: {backgroundColor: C.white, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.line},
  signedInEmail: {flex: 1, fontSize: 12, lineHeight: 16, color: C.ink},
  guideListItem: {backgroundColor: C.white, borderRadius: 10, padding: 10, marginTop: 6, borderWidth: 1, borderColor: C.line},
  appPicker: {backgroundColor: C.white, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: C.line, padding: 8, maxHeight: 260},
  appPickerList: {maxHeight: 190},
  appOption: {paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: C.line},
  appOptionLabel: {fontSize: 13, color: C.dark, fontWeight: '700'},
  appOptionPackage: {fontSize: 11, color: C.sage, marginTop: 2},
  stepEditor: {backgroundColor: C.white, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.line},
  stepHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  stepTitle: {fontSize: 13, fontWeight: '700', color: C.dark},
  remove: {fontSize: 12, fontWeight: '700', color: C.danger},
  matcherLabel: {fontSize: 11, color: C.sage, fontWeight: '700', marginTop: 8},
  celebrate: {fontSize: 40, marginTop: 36, textAlign: 'center'},
});

