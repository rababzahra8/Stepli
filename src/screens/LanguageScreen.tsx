import React, {useState} from 'react';
import {Image, Text, View} from 'react-native';
import {Button, Screen, stepliLogo} from '../components/ui';
import {styles} from '../theme/styles';
import {Language} from '../types/app';

export function LanguageScreen({onChoose}: {onChoose: (language: Language) => void}) {
  const [choosing, setChoosing] = useState<Language | null>(null);
  const choose = async (language: Language) => {
    setChoosing(language);
    try {
      await onChoose(language);
    } finally {
      setChoosing(null);
    }
  };
  return (
    <Screen>
      <Image source={stepliLogo} style={styles.heroLogo} />
      <Text style={styles.eyebrow}>Stepli</Text>
      <Text style={styles.title}>Choose language / زبان منتخب کریں</Text>
      <View style={styles.flex} />
      <Button busy={choosing === 'en'} label="English" onPress={() => choose('en')} />
      <Button busy={choosing === 'ur'} label="اردو" rtl onPress={() => choose('ur')} secondary />
    </Screen>
  );
}
