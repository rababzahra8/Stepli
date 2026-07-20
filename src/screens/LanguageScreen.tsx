import React from 'react';
import {Image, Text, View} from 'react-native';
import {Button, Screen, stepliLogo} from '../components/ui';
import {styles} from '../theme/styles';
import {Language} from '../types/app';

export function LanguageScreen({onChoose}: {onChoose: (language: Language) => void}) {
  return (
    <Screen>
      <Image source={stepliLogo} style={styles.heroLogo} />
      <Text style={styles.eyebrow}>Stepli</Text>
      <Text style={styles.title}>Choose language / زبان منتخب کریں</Text>
      <View style={styles.flex} />
      <Button label="English" onPress={() => onChoose('en')} />
      <Button label="اردو" rtl onPress={() => onChoose('ur')} secondary />
    </Screen>
  );
}
