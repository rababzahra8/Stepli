import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, DeviceEventEmitter, Pressable, Text, View} from 'react-native';
import {BrandMark, Button, CopyText, Loader, Screen, TutorialCard} from '../components/ui';
import {getFoodpandaTutorial} from '../data/foodpandaSteps';
import {TutorialGuide} from '../models/tutorial';
import {AuthSession, tutorialRepository} from '../services/TutorialRepository';
import {StepliOverlay} from '../native/StepliOverlay';
import {styles} from '../theme/styles';
import {ActiveTutorial, Language} from '../types/app';
import {copyFor} from '../utils/copy';

export function HomeScreen({
  navigation,
  language,
  session,
}: {
  navigation: any;
  language: Language;
  session: AuthSession | null;
}) {
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
    if (!session || !(await tutorialRepository.isConfigured())) {
      setCommunityGuides([]);
      return;
    }
    setLoadingGuides(true);
    try {
      setCommunityGuides(await tutorialRepository.listGuides(language));
    } catch {
      setCommunityGuides([]);
    } finally {
      setLoadingGuides(false);
    }
  }, [language, session]);

  const show = useCallback(
    async (guide: TutorialGuide, index: number) => {
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
    },
    [c.common.stepOf, c.settings.step, language],
  );

  const closeNavigator = useCallback(async () => {
    StepliOverlay.closeNavigator();
    setActiveGuide(null);
  }, []);

  const begin = useCallback(
    async (guide: TutorialGuide) => {
      if (!guide.steps.length) {
        Alert.alert(
          language === 'ur' ? 'قدم موجود نہیں ہیں' : 'No steps yet',
          language === 'ur' ? 'اس گائیڈ میں ابھی کوئی قدم شامل نہیں ہے۔' : 'This guide does not contain any steps yet.',
        );
        return;
      }
      setStarting(true);
      try {
        await show(guide, 0);
        const canOpen = await StepliOverlay.launchApp(guide.appPackage);
        if (!canOpen) {
          StepliOverlay.closeNavigator();
          setActiveGuide(null);
          Alert.alert(
            language === 'ur' ? 'ایپ انسٹال نہیں ہے' : 'App is not installed',
            language === 'ur' ? `${guide.appName} انسٹال کریں، پھر دوبارہ کوشش کریں۔` : `Install ${guide.appName}, then try again.`,
          );
        }
      } catch {
        StepliOverlay.closeNavigator();
        setActiveGuide(null);
        Alert.alert(
          language === 'ur' ? 'گائیڈ شروع نہیں ہوئی' : 'Could not start guidance',
          language === 'ur' ? 'اجازتیں چیک کر کے دوبارہ کوشش کریں۔' : 'Check the permissions and try again.',
        );
      } finally {
        setStarting(false);
      }
    },
    [language, show],
  );

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
    return () => {
      advanced.remove();
      closed.remove();
    };
  }, [navigation, show]);

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <BrandMark />
        <View style={styles.topActions}>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Account')}>
            <CopyText language={language} style={styles.settings}>
              {session ? (language === 'ur' ? 'اکاؤنٹ' : 'Account') : language === 'ur' ? 'سائن اِن' : 'Sign in'}
            </CopyText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')}>
            <CopyText language={language} style={styles.settings}>{c.home.settings}</CopyText>
          </Pressable>
        </View>
      </View>
      <CopyText language={language} style={styles.homeTitle}>{c.home.greeting}</CopyText>
      {starting ? <Loader language={language} label={language === 'ur' ? 'گائیڈ شروع ہو رہی ہے…' : 'Starting guide…'} /> : null}
      {active ? (
        <View style={styles.activeGuide}>
          <CopyText language={language} style={styles.activeGuideTitle}>
            {active.guide.title} · {active.index + 1}/{active.guide.steps.length}
          </CopyText>
          <Button danger label={language === 'ur' ? 'روکیں' : 'Stop'} rtl={language === 'ur'} onPress={closeNavigator} />
        </View>
      ) : null}
      <CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'گائیڈز' : 'Guides'}</CopyText>
      <TutorialCard guide={foodpanda} language={language} onPress={() => begin(foodpanda)} />
      <View style={styles.sectionRow}>
        <CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'کمیونٹی' : 'Community'}</CopyText>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate(session ? 'Guides' : 'Account')}>
          <CopyText language={language} style={styles.link}>
            {session ? (language === 'ur' ? 'سب' : 'All') : language === 'ur' ? 'سائن اِن' : 'Sign in'}
          </CopyText>
        </Pressable>
      </View>
      {session ? (
        <View>
          {loadingGuides ? <Loader language={language} label={language === 'ur' ? 'لوڈ ہو رہا ہے…' : 'Loading…'} /> : null}
          {!loadingGuides
            ? communityGuides.slice(0, 2).map(guide => (
                <TutorialCard key={guide.id} guide={guide} language={language} onPress={() => begin(guide)} />
              ))
            : null}
          {!loadingGuides && !communityGuides.length ? (
            <CopyText language={language} style={styles.hint}>
              {language === 'ur' ? 'ابھی کوئی کمیونٹی گائیڈ نہیں۔' : 'No community guides yet.'}
            </CopyText>
          ) : null}
          {communityGuides.length > 2 ? (
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Guides')}>
              <CopyText language={language} style={styles.link}>{language === 'ur' ? 'مزید دیکھیں' : 'See more'}</CopyText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Account')} style={styles.notice}>
          <CopyText language={language} style={styles.noticeBody}>
            {language === 'ur' ? 'کمیونٹی کے لیے سائن اِن کریں۔' : 'Sign in for community guides.'}
          </CopyText>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate(session ? 'GuideEditor' : 'Account')}
        style={styles.addGuideCard}>
        <Text style={styles.addGuideIcon}>＋</Text>
        <CopyText language={language} style={styles.cardTitle}>
          {session ? (language === 'ur' ? 'نیا گائیڈ' : 'New guide') : language === 'ur' ? 'گائیڈ کے لیے سائن اِن' : 'Sign in to create'}
        </CopyText>
      </Pressable>
    </Screen>
  );
}
