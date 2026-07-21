import React from 'react';
import {Text, View} from 'react-native';
import {Button, CopyText, Screen} from '../components/ui';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {copyFor} from '../utils/copy';

export function CelebrationScreen({
  navigation,
  route,
  language,
  setLanguage,
}: {
  navigation: any;
  route: {params?: {title?: string}};
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const c = copyFor(language);
  return (
    <Screen language={language} setLanguage={setLanguage} navigation={navigation}>
      <Text style={styles.celebrate}>🎉</Text>
      <CopyText language={language} style={styles.title}>{c.celebration.headline}</CopyText>
      <CopyText language={language} style={styles.body}>
        {route.params?.title ? `${route.params.title}. ${c.celebration.body}` : c.celebration.body}
      </CopyText>
      <View style={styles.flex} />
      <Button rtl={language === 'ur'} label={c.celebration.ctaHome} onPress={() => navigation.replace('Home')} />
    </Screen>
  );
}
