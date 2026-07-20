import React, {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import {Button, CopyText, Loader, Screen} from '../components/ui';
import {TutorialGuide} from '../models/tutorial';
import {AuthSession, tutorialRepository} from '../services/TutorialRepository';
import {styles} from '../theme/styles';
import {Language} from '../types/app';

export function GuidesScreen({
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
  const [configured, setConfigured] = useState(false);
  const [guides, setGuides] = useState<TutorialGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    const ready = await tutorialRepository.isConfigured();
    setConfigured(ready);
    if (!ready || !session) {
      setGuides([]);
      return;
    }
    setLoading(true);
    try {
      setGuides(await tutorialRepository.listGuides(language));
    } catch {
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, [language, session]);
  useEffect(() => {
    refresh();
    return navigation.addListener('focus', refresh);
  }, [navigation, refresh]);
  return (
    <Screen scroll language={language} setLanguage={setLanguage} navigation={navigation}>
      <CopyText language={language} style={styles.title}>{language === 'ur' ? 'گائیڈز' : 'Guides'}</CopyText>
      {!configured ? (
        <View style={styles.notice}>
          <CopyText language={language} style={styles.noticeBody}>
            {language === 'ur' ? 'Supabase سیٹ اپ مکمل کریں۔' : 'Finish Supabase setup first.'}
          </CopyText>
        </View>
      ) : !session ? (
        <View style={styles.authCard}>
          <CopyText language={language} style={styles.noticeBody}>
            {language === 'ur' ? 'کمیونٹی گائیڈز کے لیے سائن اِن کریں۔' : 'Sign in to browse community guides.'}
          </CopyText>
          <Button label={language === 'ur' ? 'سائن اِن' : 'Sign in'} rtl={language === 'ur'} onPress={() => navigation.navigate('Account')} />
        </View>
      ) : (
        <View>
          <Button label={language === 'ur' ? 'نیا گائیڈ' : 'New guide'} rtl={language === 'ur'} onPress={() => navigation.navigate('GuideEditor')} />
          {loading ? <Loader language={language} label={language === 'ur' ? 'لوڈ ہو رہا ہے…' : 'Loading guides…'} /> : null}
          {!loading
            ? guides.map(guide => (
                <View style={styles.guideListItem} key={guide.id}>
                  <CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{guide.title}</CopyText>
                  <CopyText language={language} style={styles.cardBody} numberOfLines={1}>
                    {guide.appName} · {guide.steps.length} {language === 'ur' ? 'قدم' : 'steps'}
                  </CopyText>
                </View>
              ))
            : null}
          {!loading && !guides.length ? (
            <CopyText language={language} style={styles.hint}>{language === 'ur' ? 'ابھی کوئی گائیڈ نہیں۔' : 'No guides yet.'}</CopyText>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
