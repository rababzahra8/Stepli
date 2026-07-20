import {Alert} from 'react-native';
import {StepliOverlay} from '../native/StepliOverlay';

/**
 * Samsung note: Speech recognition ≠ Text-to-speech.
 * Samsung TTS often has no Urdu — install Google Text-to-speech, then Urdu voice data.
 */
const URDU_INSTALL_HINT =
  'Urdu voice is for speaking (Text-to-speech), not Speech recognition.\n\n' +
  'On Samsung, Urdu is usually missing in Samsung TTS. Do this:\n\n' +
  '1. Install / open “Speech Services by Google” (Google Text-to-speech) from Play Store\n' +
  '2. Settings → General management → Text-to-speech output\n' +
  '3. Preferred engine → Google Text-to-speech (not Samsung)\n' +
  '4. Tap ⚙️ next to Google → Install voice data\n' +
  '5. Download Urdu / Urdu (Pakistan) / اردو\n\n' +
  'Then return here and tap “I installed it”.';

/**
 * When the person picks Urdu, make sure they install an Urdu TTS voice first.
 * Checks all common Urdu locale variants (Pakistan, India, generic) via Google TTS when possible.
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
    Alert.alert('Urdu speaking voice needed', URDU_INSTALL_HINT, [
      {
        text: 'Open TTS settings',
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
                'Stepli still cannot find an Urdu speaking voice.\n\n' +
                  'Make sure Preferred engine is Google Text-to-speech (not Samsung), then download Urdu (Pakistan) under Install voice data.\n\n' +
                  'Speech recognition / Voice input is a different setting and will not help.',
                [
                  {
                    text: 'Open TTS settings',
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
                  text: 'Open TTS settings',
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
