import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Pressable, Text, View} from 'react-native';
import {Button, CopyText, Loader, Screen, SettingRow} from '../components/ui';
import {AuthSession} from '../services/TutorialRepository';
import {StepliOverlay, TtsLanguageStatus} from '../native/StepliOverlay';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {copyFor} from '../utils/copy';

export function SettingsScreen({
  navigation,
  language,
  setLanguage,
  session,
}: {
  navigation: any;
  language: Language;
  setLanguage: (value: Language) => void;
  session: AuthSession | null;
}) {
  const c = copyFor(language);
  const [voice, setVoice] = useState(true);
  const [ttsLanguages, setTtsLanguages] = useState<TtsLanguageStatus[]>([]);
  const [checkingVoices, setCheckingVoices] = useState(false);
  const [voiceListOpen, setVoiceListOpen] = useState(false);

  const refreshTtsLanguages = useCallback(async () => {
    setCheckingVoices(true);
    try {
      const list = await StepliOverlay.getInstalledTtsLanguages();
      setTtsLanguages(Array.isArray(list) ? list : []);
    } catch {
      setTtsLanguages([]);
    } finally {
      setCheckingVoices(false);
    }
  }, []);

  useEffect(() => {
    StepliOverlay.getVoiceGuidance().then(setVoice).catch(() => setVoice(true));
    void refreshTtsLanguages();
  }, [refreshTtsLanguages]);

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
  const stepliVoices = ttsLanguages.filter(item => item.code === 'en' || item.code === 'ur' || item.code === 'engine');
  const otherVoices = ttsLanguages.filter(item => item.code !== 'en' && item.code !== 'ur' && item.code !== 'engine');

  return (
    <Screen scroll language={language} setLanguage={setLanguage} navigation={navigation}>
      <CopyText language={language} style={styles.title}>{c.settings.title}</CopyText>
      <CopyText language={language} style={styles.hint}>
        {language === 'ur' ? 'ایپ کی زبان اوپر دائیں جانب موجود ڈراپ ڈاؤن سے بدلیں۔' : 'Change the app language with the dropdown at the top right.'}
      </CopyText>
      <SettingRow language={language} label={c.settings.voice} value={voice} setValue={updateVoice} />

      <CopyText language={language} style={styles.settingLabel}>
        {language === 'ur' ? 'آواز کی حالت' : 'Voice status'}
      </CopyText>
      <CopyText language={language} style={styles.hint}>
        {language === 'ur'
          ? 'یہ زبان منتخب کرنے کی فہرست نہیں ہے۔ یہ صرف بتاتی ہے کہ آپ کے فون میں کون سی بولنے والی آوازیں تیار ہیں۔ “تیار” کو دبانے کی ضرورت نہیں۔'
          : 'This is not a language picker. It only checks which spoken voices are ready on your phone. “Ready” is information, not a button.'}
      </CopyText>
      <Pressable accessibilityRole="button" style={styles.setting} onPress={() => setVoiceListOpen(open => !open)}>
        <CopyText language={language} style={styles.settingText}>
          {language === 'ur' ? 'دستیاب آوازیں دیکھیں' : 'Show available voices'}
        </CopyText>
        <Text style={styles.arrow}>{voiceListOpen ? '⌃' : '⌄'}</Text>
      </Pressable>
      {voiceListOpen ? (
        checkingVoices ? <Loader language={language} label={language === 'ur' ? 'چیک ہو رہا ہے…' : 'Checking voices…'} /> : (
          <View style={styles.notice}>
          {stepliVoices.map(item => (
            <View key={item.code} style={styles.setting}>
              <View style={styles.flex}>
                <Text style={styles.settingText}>{item.label}</Text>
                <Text style={styles.cardMeta}>{item.detail}</Text>
              </View>
              <Text style={item.available ? styles.active : styles.cardMeta}>
                {item.available
                  ? language === 'ur' ? 'تیار' : 'Ready'
                  : language === 'ur' ? 'غائب' : 'Missing'}
              </Text>
            </View>
          ))}
          {otherVoices.length > 0 ? (
            <>
              <CopyText language={language} style={[styles.cardMeta, {marginTop: 8}]}>
                {language === 'ur' ? 'دیگر انسٹال آوازیں' : 'Other installed voices'}
              </CopyText>
              {otherVoices.slice(0, 12).map(item => (
                <View key={item.code} style={styles.setting}>
                  <View style={styles.flex}>
                    <Text style={styles.settingText}>{item.label}</Text>
                    <Text style={styles.cardMeta}>{item.detail}</Text>
                  </View>
                  <Text style={styles.active}>{language === 'ur' ? 'تیار' : 'Ready'}</Text>
                </View>
              ))}
              {otherVoices.length > 12 ? (
                <Text style={styles.hint}>
                  {language === 'ur'
                    ? `+${otherVoices.length - 12} مزید`
                    : `+${otherVoices.length - 12} more`}
                </Text>
              ) : null}
            </>
          ) : null}
          {!stepliVoices.length && !otherVoices.length ? (
            <CopyText language={language} style={styles.noticeBody}>
              {language === 'ur'
                ? 'آواز کی فہرست نہیں ملی۔ نیچے سے سیٹنگز کھولیں۔'
                : 'Could not read voice list. Open settings below to install voices.'}
            </CopyText>
          ) : null}
          </View>
        )
      ) : null}
      <Button
        secondary
        label={language === 'ur' ? 'دوبارہ چیک کریں' : 'Check again'}
        rtl={language === 'ur'}
        onPress={refreshTtsLanguages}
      />
      <Button
        secondary
        label={language === 'ur' ? 'آواز انسٹال سیٹنگز' : 'Install voice languages'}
        rtl={language === 'ur'}
        onPress={() => StepliOverlay.openTextToSpeechSettings()}
      />

      <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'اکاؤنٹ' : 'Account'}</CopyText>
      {session ? (
        <View style={styles.authCard}>
          <CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{session.email || session.userId}</CopyText>
          <CopyText language={language} style={styles.hint}>{language === 'ur' ? 'لاگ آؤٹ بائیں سائیڈبار میں ہے۔' : 'Log out is in the left sidebar.'}</CopyText>
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
