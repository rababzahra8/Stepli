import React, {useCallback, useEffect, useState} from 'react';
import {AppState, View} from 'react-native';
import {Button, CopyText, Screen} from '../components/ui';
import {StepliOverlay} from '../native/StepliOverlay';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {copyFor} from '../utils/copy';

export function PermissionsScreen({
  navigation,
  language,
  setLanguage,
}: {
  navigation: any;
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const c = copyFor(language);
  const [overlay, setOverlay] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const refresh = useCallback(async () => {
    setOverlay(await StepliOverlay.canDrawOverlays());
    setAccessibility(await StepliOverlay.isAccessibilityEnabled());
  }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refresh);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    refresh();
    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [navigation, refresh]);
  useEffect(() => {
    if (overlay && accessibility) navigation.replace('Onboarding', {page: 1});
  }, [overlay, accessibility, navigation]);
  const current = !overlay ? c.permissions.overlay : c.permissions.accessibility;
  return (
    <Screen language={language} setLanguage={setLanguage}>
      <CopyText language={language} style={styles.eyebrow}>{c.permissions.setup}</CopyText>
      <CopyText language={language} style={styles.title}>{current.headline}</CopyText>
      <CopyText language={language} style={styles.body}>{current.body}</CopyText>
      <View style={styles.permissionStatus}>
        <CopyText language={language}>{overlay ? '✓' : '○'} {c.permissions.overlayStatus}</CopyText>
        <CopyText language={language}>{accessibility ? '✓' : '○'} {c.permissions.accessibilityStatus}</CopyText>
      </View>
      {overlay && !accessibility ? (
        <View style={styles.guide}>
          <CopyText language={language} style={styles.guideTitle}>{c.permissions.guideTitle}</CopyText>
          <CopyText language={language} style={styles.guideBody}>{c.permissions.guideBody}</CopyText>
          <CopyText language={language} style={styles.guideBody}>{c.permissions.restrictedBody}</CopyText>
          <Button secondary label={c.permissions.restrictedCta} rtl={language === 'ur'} onPress={() => StepliOverlay.openAppDetailsSettings()} />
        </View>
      ) : null}
      <Button
        label={current.cta}
        rtl={language === 'ur'}
        onPress={() => (!overlay ? StepliOverlay.openOverlaySettings() : StepliOverlay.openAccessibilitySettings())}
      />
      <Button secondary label={c.permissions.checkCta} rtl={language === 'ur'} onPress={refresh} />
      <CopyText language={language} style={styles.footnote}>{c.permissions.footnote}</CopyText>
    </Screen>
  );
}
