import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {AppGuideGroupCard, BrandMark, Button, CopyText, Loader, Screen, TutorialCard, stepliLogo} from '../components/ui';
import {getBuiltInGuides, groupGuidesByApp} from '../data/builtInGuides';
import {useGuideRunner} from '../hooks/useGuideRunner';
import {TutorialGuide} from '../models/tutorial';
import {AuthSession, tutorialRepository} from '../services/TutorialRepository';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {copyFor} from '../utils/copy';

export function HomeScreen({
  navigation,
  language,
  setLanguage,
  session,
}: {
  navigation: any;
  language: Language;
  setLanguage: (language: Language) => void;
  session: AuthSession | null;
}) {
  const c = copyFor(language);
  const builtInGroups = useMemo(() => groupGuidesByApp(getBuiltInGuides(language)), [language]);
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});
  const [communityGuides, setCommunityGuides] = useState<TutorialGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const {active, starting, begin, closeNavigator} = useGuideRunner(language, navigation);

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

  useEffect(() => {
    refreshGuides();
    return navigation.addListener('focus', refreshGuides);
  }, [navigation, refreshGuides]);

  return (
    <Screen scroll language={language} setLanguage={setLanguage}>
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
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('VoiceTour')} style={styles.taskCard}>
        <Image source={stepliLogo} style={styles.guideCardImage} accessibilityLabel="Stepli" />
        <View style={styles.flex}>
          <CopyText language={language} style={styles.cardTitle}>
            {language === 'ur' ? 'Stepli کیسے استعمال کریں؟' : 'How to use Stepli'}
          </CopyText>
          <CopyText language={language} style={styles.cardBody}>
            {language === 'ur'
              ? 'آواز والا ٹور — Stepli کیا کرتی ہے، قدم بہ قدم سنیں۔'
              : 'Voice tour — hear what Stepli does, step by step.'}
          </CopyText>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      {starting ? <Loader language={language} label={language === 'ur' ? 'گائیڈ شروع ہو رہی ہے…' : 'Starting guide…'} /> : null}
      {active ? (
        <View style={styles.activeGuide}>
          <CopyText language={language} style={styles.activeGuideTitle}>
            {active.guide.title} · {active.index + 1}/{active.guide.steps.length}
          </CopyText>
          <Button danger label={language === 'ur' ? 'روکیں' : 'Stop'} rtl={language === 'ur'} onPress={closeNavigator} />
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <CopyText language={language} style={styles.sectionTitle}>{language === 'ur' ? 'گائیڈز' : 'Guides'}</CopyText>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('BuiltInGuides')}>
          <CopyText language={language} style={styles.link}>{language === 'ur' ? 'سب دیکھیں' : 'See all'}</CopyText>
        </Pressable>
      </View>
      {builtInGroups.map(group => (
        <AppGuideGroupCard
          key={group.appPackage}
          group={group}
          language={language}
          expanded={Boolean(expandedApps[group.appPackage])}
          onToggle={() =>
            setExpandedApps(current => ({
              ...current,
              [group.appPackage]: !current[group.appPackage],
            }))
          }
          onStart={begin}
        />
      ))}

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
