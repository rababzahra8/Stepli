import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, Switch, Text, View} from 'react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TutorialGuide} from '../models/tutorial';
import {AuthSession, tutorialRepository} from '../services/TutorialRepository';
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
  onPress: () => void | Promise<void>;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  rtl?: boolean;
  busy?: boolean;
}) {
  const [pressing, setPressing] = useState(false);
  const handlePress = async () => {
    const result = onPress();
    if (result && typeof (result as Promise<void>).then === 'function') {
      setPressing(true);
      try {
        await result;
      } finally {
        setPressing(false);
      }
    }
  };
  const isBusy = busy || pressing;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || isBusy}
      style={[styles.button, secondary && styles.secondary, danger && styles.danger, (disabled || isBusy) && styles.disabled]}
      onPress={handlePress}>
      {isBusy ? (
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
  setLanguage: (language: Language) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const choose = async (value: Language) => {
    if (value === language) {
      setOpen(false);
      return;
    }
    setChanging(true);
    try {
      await setLanguage(value);
    } finally {
      setChanging(false);
      setOpen(false);
    }
  };
  return (
    <View style={styles.languageSwitch}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        style={styles.languagePickerButton}
        onPress={() => setOpen(value => !value)}>
        {changing ? <ActivityIndicator size="small" color={C.sage} /> : <Text style={styles.languageChipText}>{language === 'ur' ? 'اردو ▾' : 'English ▾'}</Text>}
      </Pressable>
      {open ? (
        <View style={styles.languageMenu} accessibilityRole="menu">
          <Pressable accessibilityRole="menuitem" style={styles.languageOption} onPress={() => void choose('en')}>
            <Text style={styles.languageChipText}>English</Text>
          </Pressable>
          <Pressable accessibilityRole="menuitem" style={styles.languageOption} onPress={() => void choose('ur')}>
            <Text style={[styles.languageChipText, styles.rtl]}>اردو</Text>
          </Pressable>
        </View>
      ) : null}
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
  setLanguage?: (language: Language) => void | Promise<void>;
  /** Enables the Stepli sidebar when navigation is available. */
  navigation?: any;
}) {
  const header = <AppHeader language={language} setLanguage={setLanguage} navigation={navigation} />;
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

function AppHeader({
  language,
  setLanguage,
  navigation,
}: {
  language?: Language;
  setLanguage?: (language: Language) => void | Promise<void>;
  navigation?: any;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => tutorialRepository.currentSession());
  const [signingOut, setSigningOut] = useState(false);
  const drawerX = useRef(new Animated.Value(-360)).current;
  useEffect(() => tutorialRepository.subscribeSession(setSession), []);
  const openMenu = () => {
    drawerX.setValue(-360);
    setMenuVisible(true);
    Animated.timing(drawerX, {toValue: 0, duration: 220, useNativeDriver: true}).start();
  };
  const closeMenu = (afterClose?: () => void) => {
    Animated.timing(drawerX, {toValue: -360, duration: 180, useNativeDriver: true}).start(() => {
      setMenuVisible(false);
      afterClose?.();
    });
  };
  const openGuides = (initialTab: 'mine' | 'community' | 'all') => {
    closeMenu(() => navigation?.navigate('Guides', {initialTab}));
  };
  const signOut = async () => {
    setSigningOut(true);
    try {
      await tutorialRepository.signOut();
      try {
        await GoogleSignin.signOut();
      } catch {
        /* Clearing Google's account picker is optional. */
      }
    } finally {
      setSigningOut(false);
      closeMenu();
    }
  };
  return (
    <>
      <View style={styles.screenHeader}>
        {navigation ? (
          <Pressable accessibilityRole="button" accessibilityLabel={language === 'ur' ? 'مینو کھولیں' : 'Open menu'} onPress={openMenu}>
            <BrandMark />
          </Pressable>
        ) : <BrandMark />}
        {language && setLanguage ? <LanguageSwitch language={language} setLanguage={setLanguage} /> : <View />}
      </View>
      {navigation && language ? (
        <Modal visible={menuVisible} transparent animationType="none" onRequestClose={() => closeMenu()}>
          <View style={styles.menuOverlay}>
            <Pressable style={styles.menuBackdrop} onPress={() => closeMenu()} />
            <Animated.View style={[styles.sideMenu, {transform: [{translateX: drawerX}]}]}>
              <View style={styles.sideMenuHeader}>
                <BrandMark />
                <Pressable accessibilityRole="button" accessibilityLabel={language === 'ur' ? 'مینو بند کریں' : 'Close menu'} onPress={() => closeMenu()}>
                  <Text style={styles.menuClose}>×</Text>
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => closeMenu(() => navigation.navigate('Home'))}>
                <CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'ہوم' : 'Home'}</CopyText>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => openGuides('mine')}>
                <CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'میری گائیڈز' : 'My guides'}</CopyText>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => openGuides('community')}>
                <CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'کمیونٹی گائیڈز' : 'Community guides'}</CopyText>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => openGuides('all')}>
                <CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'تمام گائیڈز' : 'All guides'}</CopyText>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => closeMenu(() => navigation.navigate('Settings'))}>
                <CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'سیٹنگز' : 'Settings'}</CopyText>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
              {session ? (
                <Pressable accessibilityRole="button" disabled={signingOut} style={[styles.menuItem, signingOut && styles.disabled]} onPress={() => void signOut()}>
                  <CopyText language={language} style={styles.remove}>{signingOut ? (language === 'ur' ? 'لاگ آؤٹ ہو رہا ہے…' : 'Logging out…') : language === 'ur' ? 'لاگ آؤٹ' : 'Log out'}</CopyText>
                  {signingOut ? <ActivityIndicator size="small" color={C.danger} /> : <Text style={styles.arrow}>›</Text>}
                </Pressable>
              ) : (
                <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => closeMenu(() => navigation.navigate('Account'))}>
                  <CopyText language={language} style={styles.settingText}>{language === 'ur' ? 'سائن اِن' : 'Sign in'}</CopyText>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              )}
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </>
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

export function SettingRow({label, value, setValue, language}: {label: string; value: boolean; setValue: (value: boolean) => void | Promise<void>; language: Language}) {
  const [saving, setSaving] = useState(false);
  const update = async (next: boolean) => {
    setSaving(true);
    try {
      await setValue(next);
    } finally {
      setSaving(false);
    }
  };
  return (
    <View style={styles.setting}>
      <CopyText language={language}>{label}</CopyText>
      {saving ? <ActivityIndicator size="small" color={C.sage} /> : <Switch value={value} onValueChange={update} trackColor={{true: C.sage}} />}
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
