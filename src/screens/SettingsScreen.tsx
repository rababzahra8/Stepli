import React, {useEffect, useState} from 'react';
import {Alert, Pressable, Text, View} from 'react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {Back, Button, CopyText, Screen, SettingRow} from '../components/ui';
import {AuthSession, tutorialRepository} from '../services/TutorialRepository';
import {StepliOverlay} from '../native/StepliOverlay';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {copyFor} from '../utils/copy';

export function SettingsScreen({
  navigation,
  language,
  setLanguage,
  session,
  setSession,
}: {
  navigation: any;
  language: Language;
  setLanguage: (value: Language) => void;
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
}) {
  const c = copyFor(language);
  const [voice, setVoice] = useState(true);
  const [large, setLarge] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    StepliOverlay.getVoiceGuidance().then(setVoice).catch(() => setVoice(true));
  }, []);
  const updateVoice = async (enabled: boolean) => {
    setVoice(enabled);
    await StepliOverlay.setVoiceGuidance(enabled);
  };
  const close = () => {
    StepliOverlay.closeNavigator();
    Alert.alert(
      language === 'ur' ? 'نیویگیٹر بند ہو گیا' : 'Navigator closed',
      language === 'ur' ? 'ہدایت اور آواز بند کر دی گئی۔' : 'Guidance overlay and voice were stopped.',
    );
  };
  const signOut = async () => {
    setBusy(true);
    try {
      await tutorialRepository.signOut();
      try {
        await GoogleSignin.signOut();
      } catch {
        /* Clears Google's local account choice only. */
      }
    } finally {
      setSession(null);
      setBusy(false);
    }
  };
  return (
    <Screen scroll>
      <Back navigation={navigation} language={language} />
      <CopyText language={language} style={styles.title}>{c.settings.title}</CopyText>
      <CopyText language={language} style={styles.settingLabel}>{c.settings.language}</CopyText>
      <Pressable style={styles.setting} onPress={() => setLanguage('en')}>
        <Text style={styles.settingText}>English</Text>
        {language === 'en' ? <Text style={styles.active}>{c.settings.selected}</Text> : null}
      </Pressable>
      <Pressable style={styles.setting} onPress={() => setLanguage('ur')}>
        <CopyText language="ur" style={styles.settingText}>اردو</CopyText>
        {language === 'ur' ? <CopyText language="ur" style={styles.active}>{c.settings.selected}</CopyText> : null}
      </Pressable>
      <SettingRow language={language} label={c.settings.voice} value={voice} setValue={updateVoice} />
      <SettingRow language={language} label={c.settings.textSize} value={large} setValue={setLarge} />
      <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'اکاؤنٹ' : 'Account'}</CopyText>
      {session ? (
        <View style={styles.authCard}>
          <CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{session.email || session.userId}</CopyText>
          <Button busy={busy} danger label={language === 'ur' ? 'لاگ آؤٹ' : 'Log out'} rtl={language === 'ur'} onPress={signOut} />
        </View>
      ) : (
        <Pressable style={styles.setting} onPress={() => navigation.navigate('Account')}>
          <CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'سائن اِن کریں' : 'Sign in'}</CopyText>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      )}
      <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'نیویگیٹر' : 'Navigator'}</CopyText>
      <Button danger label={language === 'ur' ? 'نیویگیٹر بند کریں' : 'Stop navigator'} rtl={language === 'ur'} onPress={close} />
    </Screen>
  );
}
