import React from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TutorialGuide} from '../models/tutorial';
import {C} from '../theme/colors';
import {styles} from '../theme/styles';
import {Language} from '../types/app';

export const stepliLogo = require('../assets/stepli-bot.png');

export function Loader({label, language}: {label?: string; language?: Language}) {
  return (
    <View style={styles.loaderRow}>
      <ActivityIndicator color={C.sage} />
      {label ? <Text style={[styles.loaderLabel, language === 'ur' && styles.rtl]}>{label}</Text> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  rtl = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  rtl?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      style={[styles.button, secondary && styles.secondary, danger && styles.danger, (disabled || busy) && styles.disabled]}
      onPress={onPress}>
      {busy ? (
        <ActivityIndicator color={secondary ? C.dark : '#fff'} />
      ) : (
        <Text style={[styles.buttonText, secondary && styles.secondaryText, danger && styles.dangerText, rtl && styles.rtl]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Screen({children, scroll = false}: {children: React.ReactNode; scroll?: boolean}) {
  const content = <View style={styles.screen}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function CopyText({
  children,
  style,
  language,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: object | object[];
  language: Language;
  numberOfLines?: number;
}) {
  return (
    <Text style={[style, language === 'ur' && styles.rtl]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Back({navigation, language}: {navigation: any; language: Language}) {
  return (
    <Pressable accessibilityRole="button" style={styles.back} onPress={() => navigation.goBack()}>
      <CopyText language={language} style={styles.backText}>{language === 'ur' ? 'واپس' : 'Back'}</CopyText>
    </Pressable>
  );
}

export function TutorialCard({guide, language, onPress}: {guide: TutorialGuide; language: Language; onPress: () => void}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.taskCard}>
      <Text style={styles.cardIcon}>{guide.icon || '📱'}</Text>
      <View style={styles.flex}>
        <CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{guide.title}</CopyText>
        <CopyText language={language} style={styles.cardBody} numberOfLines={1}>
          {guide.description || (language === 'ur' ? `${guide.steps.length} قدم` : `${guide.steps.length} steps`)}
        </CopyText>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

export function SettingRow({label, value, setValue, language}: {label: string; value: boolean; setValue: (value: boolean) => void; language: Language}) {
  return (
    <View style={styles.setting}>
      <CopyText language={language}>{label}</CopyText>
      <Switch value={value} onValueChange={setValue} trackColor={{true: C.sage}} />
    </View>
  );
}

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <Image source={stepliLogo} style={styles.headerLogo} />
      <Text style={styles.logo}>Stepli</Text>
    </View>
  );
}
