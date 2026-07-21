import React from 'react';
import {View} from 'react-native';
import {Button, CopyText, Screen} from '../components/ui';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {copyFor} from '../utils/copy';

export function OnboardingScreen({
  route,
  navigation,
  language,
  setLanguage,
  completeOnboarding,
}: {
  route: {params: {page: number}};
  navigation: any;
  language: Language;
  setLanguage: (language: Language) => void;
  completeOnboarding: () => Promise<void>;
}) {
  const c = copyFor(language);
  const page = route.params.page;
  const item = page === 1 ? c.onboarding.screen1 : c.onboarding.screen2;
  const finish = async () => {
    await completeOnboarding();
    navigation.replace('Home');
  };
  return (
    <Screen language={language} setLanguage={setLanguage} navigation={navigation}>
      <CopyText language={language} style={styles.eyebrow}>{page} / 2</CopyText>
      <CopyText language={language} style={styles.title}>{item.headline}</CopyText>
      <CopyText language={language} style={styles.body}>{item.body}</CopyText>
      <View style={styles.flex} />
      {page === 2 ? (
        <Button
          secondary
          rtl={language === 'ur'}
          label={language === 'ur' ? '🔊  آواز والا ٹور سنیں' : '🔊  Hear the voice tour'}
          onPress={() => navigation.navigate('VoiceTour')}
        />
      ) : null}
      <Button
        rtl={language === 'ur'}
        label={page === 1 ? c.onboarding.continue : c.onboarding.begin}
        onPress={() => (page === 1 ? navigation.push('Onboarding', {page: 2}) : finish())}
      />
    </Screen>
  );
}
