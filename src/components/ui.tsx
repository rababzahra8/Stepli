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

export function LanguageSwitch({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  return (
    <View style={styles.languageSwitch} accessibilityRole="tablist">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: language === 'en'}}
        style={[styles.languageChip, language === 'en' && styles.languageChipActive]}
        onPress={() => setLanguage('en')}>
        <Text style={[styles.languageChipText, language === 'en' && styles.languageChipTextActive]}>EN</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: language === 'ur'}}
        style={[styles.languageChip, language === 'ur' && styles.languageChipActive]}
        onPress={() => setLanguage('ur')}>
        <Text style={[styles.languageChipText, language === 'ur' && styles.languageChipTextActive, styles.rtl]}>اردو</Text>
      </Pressable>
    </View>
  );
}

export function Screen({
  children,
  scroll = false,
  language,
  setLanguage,
  navigation,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  language?: Language;
  setLanguage?: (language: Language) => void;
  /** When set, shows Back on the left of the language switch. */
  navigation?: any;
}) {
  const header =
    language && setLanguage ? (
      <View style={styles.screenHeader}>
        {navigation ? <Back navigation={navigation} language={language} /> : <View style={styles.flex} />}
        <LanguageSwitch language={language} setLanguage={setLanguage} />
      </View>
    ) : null;
  const content = (
    <View style={styles.screen}>
      {header}
      {children}
    </View>
  );
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

export function AppGuideGroupCard({
  group,
  language,
  expanded,
  onToggle,
  onStart,
}: {
  group: {appName: string; icon: string; guides: TutorialGuide[]};
  language: Language;
  expanded: boolean;
  onToggle: () => void;
  onStart: (guide: TutorialGuide) => void;
}) {
  const countLabel =
    language === 'ur'
      ? `${group.guides.length} گائیڈز`
      : `${group.guides.length} guide${group.guides.length === 1 ? '' : 's'}`;

  // Single guide under an app: start directly without an expand step.
  if (group.guides.length === 1) {
    return <TutorialCard guide={group.guides[0]} language={language} onPress={() => onStart(group.guides[0])} />;
  }

  return (
    <View style={styles.appGroup}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={styles.appGroupHeader}>
        <Text style={styles.cardIcon}>{group.icon}</Text>
        <View style={styles.flex}>
          <CopyText language={language} style={styles.cardTitle}>{group.appName}</CopyText>
          <CopyText language={language} style={styles.cardMeta}>{countLabel}</CopyText>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>
      {expanded
        ? (
          <View style={styles.appGroupBody}>
            {group.guides.map((item, index) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => onStart(item)}
                style={[styles.appGroupGuide, index === group.guides.length - 1 && styles.appGroupGuideLast]}>
                <View style={styles.flex}>
                  <CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{item.title}</CopyText>
                  <CopyText language={language} style={styles.cardBody} numberOfLines={1}>
                    {item.description || (language === 'ur' ? `${item.steps.length} قدم` : `${item.steps.length} steps`)}
                  </CopyText>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>
          )
        : null}
    </View>
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
