import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Image, View} from 'react-native';
import {Button, CopyText, Screen, stepliLogo} from '../components/ui';
import {getStepliVoiceTour} from '../data/stepliTour';
import {StepliOverlay} from '../native/StepliOverlay';
import {styles} from '../theme/styles';
import {Language} from '../types/app';

/** In-app product tour with spoken narration — dialog style, no Previous/Next labels. */
export function VoiceTourScreen({
  navigation,
  language,
  setLanguage,
}: {
  navigation: any;
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const steps = useMemo(() => getStepliVoiceTour(language), [language]);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index >= steps.length - 1;
  const canGoBack = index > 0;

  const speakStep = useCallback(
    async (position: number) => {
      const next = steps[position];
      if (!next) return;
      try {
        await StepliOverlay.speak(next.spokenText, language);
      } catch {
        // Tour still works if TTS is unavailable; text remains on screen.
      }
    },
    [language, steps],
  );

  useEffect(() => {
    void speakStep(index);
    return () => {
      void StepliOverlay.stopSpeech();
    };
  }, [index, speakStep]);

  useEffect(() => {
    return () => {
      void StepliOverlay.stopSpeech();
    };
  }, []);

  const finish = () => {
    void StepliOverlay.stopSpeech();
    navigation.replace('Celebration', {
      title: language === 'ur' ? 'Stepli آواز والا ٹور' : 'Stepli voice tour',
    });
  };

  const confirmStep = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex(value => Math.min(value + 1, steps.length - 1));
  };

  const hearLastStepAgain = () => {
    if (!canGoBack) return;
    setIndex(value => Math.max(0, value - 1));
  };

  if (!step) {
    return null;
  }

  return (
    <Screen language={language} setLanguage={setLanguage} navigation={navigation}>
      <View style={styles.guideDialog}>
        <View style={styles.guideDialogHeader}>
          <Image source={stepliLogo} style={styles.guideDialogAvatar} accessibilityLabel="Stepli" />
          <CopyText language={language} style={styles.guideDialogProgress}>
            {language === 'ur' ? 'قدم' : 'Step'} {index + 1} {language === 'ur' ? 'از' : 'of'} {steps.length}
          </CopyText>
        </View>
        <CopyText language={language} style={styles.guideDialogTitle}>{step.title}</CopyText>
        <CopyText language={language} style={styles.guideDialogBody}>{step.body}</CopyText>
        <Button
          secondary
          rtl={language === 'ur'}
          label={language === 'ur' ? '🔊  یہ قدم سنیں' : '🔊  Hear this step'}
          onPress={() => void speakStep(index)}
        />
        {canGoBack ? (
          <Button
            secondary
            rtl={language === 'ur'}
            label={language === 'ur' ? '↩  پچھلا قدم دوبارہ سنیں' : '↩  Hear last step again'}
            onPress={hearLastStepAgain}
          />
        ) : null}
        <Button
          rtl={language === 'ur'}
          label={
            isLast
              ? language === 'ur' ? '✓  میں تیار ہوں' : '✓  I am ready'
              : language === 'ur' ? '✓  میں سمجھ گیا / گئی' : '✓  I got it'
          }
          onPress={confirmStep}
        />
      </View>
      <Button
        secondary
        rtl={language === 'ur'}
        label={language === 'ur' ? 'ٹور بند کریں' : 'Close tour'}
        onPress={() => {
          void StepliOverlay.stopSpeech();
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
