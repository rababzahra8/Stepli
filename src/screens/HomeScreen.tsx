import React, {useMemo, useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {AppGuideGroupCard, Button, CopyText, Loader, Screen, stepliLogo} from '../components/ui';
import {getBuiltInGuides, groupGuidesByApp} from '../data/builtInGuides';
import {useGuideRunner} from '../hooks/useGuideRunner';
import {AuthSession} from '../services/TutorialRepository';
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
  const {active, starting, begin, closeNavigator} = useGuideRunner(language, navigation);

  return (
    <Screen scroll language={language} setLanguage={setLanguage} navigation={navigation}>
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

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate(session ? 'GuideEditor' : 'Settings')}
        style={styles.addGuideCard}>
        <Text style={styles.addGuideIcon}>＋</Text>
        <CopyText language={language} style={styles.cardTitle}>
          {session ? (language === 'ur' ? 'نیا گائیڈ' : 'New guide') : language === 'ur' ? 'گائیڈ بنانے کے لیے سیٹنگز میں اکاؤنٹ بنائیں' : 'Create an account in Settings to add a guide'}
        </CopyText>
      </Pressable>
    </Screen>
  );
}
