import React, {useMemo, useState} from 'react';
import {View} from 'react-native';
import {AppGuideGroupCard, Button, CopyText, Loader, Screen} from '../components/ui';
import {getBuiltInGuides, groupGuidesByApp} from '../data/builtInGuides';
import {useGuideRunner} from '../hooks/useGuideRunner';
import {styles} from '../theme/styles';
import {Language} from '../types/app';

/** Full list of hardcoded guides, grouped by app. */
export function BuiltInGuidesScreen({
  navigation,
  language,
  setLanguage,
}: {
  navigation: any;
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const groups = useMemo(() => groupGuidesByApp(getBuiltInGuides(language)), [language]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const {active, starting, begin, closeNavigator} = useGuideRunner(language, navigation);

  const isExpanded = (appPackage: string) => expanded[appPackage] !== false;

  return (
    <Screen scroll language={language} setLanguage={setLanguage} navigation={navigation}>
      <CopyText language={language} style={styles.title}>
        {language === 'ur' ? 'تمام گائیڈز' : 'All guides'}
      </CopyText>
      <CopyText language={language} style={styles.body}>
        {language === 'ur'
          ? 'ایپ کے نیچے گائیڈ کا نام دیکھیں، پھر شروع کریں۔'
          : 'Browse by app, then pick a guide by name to start.'}
      </CopyText>
      {starting ? <Loader language={language} label={language === 'ur' ? 'گائیڈ شروع ہو رہی ہے…' : 'Starting guide…'} /> : null}
      {active ? (
        <View style={styles.activeGuide}>
          <CopyText language={language} style={styles.activeGuideTitle}>
            {active.guide.title} · {active.index + 1}/{active.guide.steps.length}
          </CopyText>
          <Button danger label={language === 'ur' ? 'روکیں' : 'Stop'} rtl={language === 'ur'} onPress={closeNavigator} />
        </View>
      ) : null}
      {groups.map(group => (
        <View key={group.appPackage}>
          <AppGuideGroupCard
            group={group}
            language={language}
            expanded={isExpanded(group.appPackage)}
            onToggle={() =>
              setExpanded(current => {
                const open = current[group.appPackage] !== false;
                return {...current, [group.appPackage]: !open};
              })
            }
            onStart={begin}
          />
        </View>
      ))}
    </Screen>
  );
}
