import {Alert} from 'react-native';
import {StepliOverlay} from '../native/StepliOverlay';

const URDU_INSTALL_HINT =
  'In Install voice data, look for any of these and download one:\n\n' +
  '• Urdu\n' +
  '• Urdu (Pakistan)\n' +
  '• Urdu (India)\n' +
  '• اردو\n\n' +
  'Path: Settings → Accessibility → Text-to-speech → preferred engine ⚙️ → Install voice data.';

/**
 * When the person picks Urdu, make sure they install an Urdu TTS voice first.
 * Checks all common Urdu locale variants (Pakistan, India, generic).
 */
export async function confirmUrduSelection(): Promise<boolean> {
  try {
    if (await StepliOverlay.isUrduVoiceAvailable()) {
      return true;
    }
  } catch {
    // Native probe unavailable — still prompt so the person knows what to install.
  }

  return new Promise(resolve => {
    Alert.alert('Urdu voice needed first', URDU_INSTALL_HINT, [
      {
        text: 'Open settings',
        onPress: () => {
          StepliOverlay.openTextToSpeechSettings();
          resolve(false);
        },
      },
      {
        text: 'I installed it',
        onPress: () => {
          void StepliOverlay.isUrduVoiceAvailable()
            .then(ok => {
              if (ok) {
                resolve(true);
                return;
              }
              Alert.alert(
                'Still missing',
                'Urdu voice is still not available. Download Urdu / Urdu (Pakistan) / Urdu (India) / اردو, then try again.',
                [
                  {
                    text: 'Open settings',
                    onPress: () => {
                      StepliOverlay.openTextToSpeechSettings();
                      resolve(false);
                    },
                  },
                  {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
                  {text: 'Use Urdu UI anyway', onPress: () => resolve(true)},
                ],
              );
            })
            .catch(() => {
              Alert.alert('Could not verify voice', URDU_INSTALL_HINT, [
                {
                  text: 'Open settings',
                  onPress: () => {
                    StepliOverlay.openTextToSpeechSettings();
                    resolve(false);
                  },
                },
                {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
                {text: 'Use Urdu UI anyway', onPress: () => resolve(true)},
              ]);
            });
        },
      },
      {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
    ]);
  });
}
