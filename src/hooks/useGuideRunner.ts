import {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, DeviceEventEmitter} from 'react-native';
import {TutorialGuide} from '../models/tutorial';
import {StepliOverlay} from '../native/StepliOverlay';
import {ActiveTutorial, Language} from '../types/app';
import {copyFor} from '../utils/copy';

/** Starts overlay guidance for a tutorial and advances when steps are confirmed. */
export function useGuideRunner(language: Language, navigation: any) {
  const c = copyFor(language);
  const [active, setActive] = useState<ActiveTutorial | null>(null);
  const [starting, setStarting] = useState(false);
  const activeRef = useRef<ActiveTutorial | null>(null);

  const setActiveGuide = (next: ActiveTutorial | null) => {
    activeRef.current = next;
    setActive(next);
  };

  const show = useCallback(
    async (guide: TutorialGuide, index: number) => {
      const step = guide.steps[index];
      if (!step) return;
      const next = {guide, index};
      setActiveGuide(next);
      await StepliOverlay.showStep(
        step.id,
        step.text,
        step.confirm,
        `${c.settings.step} ${index + 1} ${c.common.stepOf} ${guide.steps.length}`,
        JSON.stringify(step.matcher || {}),
        guide.appPackage,
        language,
        step.spokenText || step.text,
        index > 0,
      );
    },
    [c.common.stepOf, c.settings.step, language],
  );

  const closeNavigator = useCallback(() => {
    StepliOverlay.closeNavigator();
    setActiveGuide(null);
  }, []);

  const begin = useCallback(
    async (guide: TutorialGuide) => {
      if (!guide.steps.length) {
        Alert.alert(
          language === 'ur' ? 'قدم موجود نہیں ہیں' : 'No steps yet',
          language === 'ur' ? 'اس گائیڈ میں ابھی کوئی قدم شامل نہیں ہے۔' : 'This guide does not contain any steps yet.',
        );
        return;
      }
      setStarting(true);
      try {
        const firstStep = guide.steps[0];
        setActiveGuide({guide, index: 0});
        const canOpen = await StepliOverlay.launchAppAndShowStep(
          firstStep.id,
          firstStep.text,
          firstStep.confirm,
          `${c.settings.step} 1 ${c.common.stepOf} ${guide.steps.length}`,
          JSON.stringify(firstStep.matcher || {}),
          guide.appPackage,
          language,
          firstStep.spokenText || firstStep.text,
          false,
        );
        if (!canOpen) {
          StepliOverlay.closeNavigator();
          setActiveGuide(null);
          Alert.alert(
            language === 'ur' ? 'ایپ انسٹال نہیں ہے' : 'App is not installed',
            language === 'ur'
              ? `${guide.appName} انسٹال کریں، پھر دوبارہ کوشش کریں۔`
              : `Install ${guide.appName}, then try again.`,
          );
        }
      } catch {
        StepliOverlay.closeNavigator();
        setActiveGuide(null);
        Alert.alert(
          language === 'ur' ? 'گائیڈ شروع نہیں ہوئی' : 'Could not start guidance',
          language === 'ur' ? 'اجازتیں چیک کر کے دوبارہ کوشش کریں۔' : 'Check the permissions and try again.',
        );
      } finally {
        setStarting(false);
      }
    },
    [c.common.stepOf, c.settings.step, language, show],
  );

  useEffect(() => {
    const advanced = DeviceEventEmitter.addListener('stepliStepDetected', async (id: string) => {
      const current = activeRef.current;
      if (!current || current.guide.steps[current.index]?.id !== id) return;
      if (current.index >= current.guide.steps.length - 1) {
        StepliOverlay.closeNavigator();
        setActiveGuide(null);
        navigation.navigate('Celebration', {title: current.guide.title});
      } else {
        await show(current.guide, current.index + 1);
      }
    });
    const wentBack = DeviceEventEmitter.addListener('stepliStepBack', async () => {
      const current = activeRef.current;
      if (!current || current.index <= 0) return;
      await show(current.guide, current.index - 1);
    });
    const closed = DeviceEventEmitter.addListener('stepliNavigatorClosed', () => setActiveGuide(null));
    return () => {
      advanced.remove();
      wentBack.remove();
      closed.remove();
    };
  }, [navigation, show]);

  return {active, starting, begin, closeNavigator};
}
