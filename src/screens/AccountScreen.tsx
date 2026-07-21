import React, {useEffect, useState} from 'react';
import {Alert, TextInput, View} from 'react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {Button, CopyText, Screen} from '../components/ui';
import {AuthSession, tutorialRepository} from '../services/TutorialRepository';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {errorMessage, friendlyAuthMessage, logAuthError} from '../utils/authErrors';

export function AccountScreen({
  navigation,
  language,
  setLanguage,
  session,
  setSession,
}: {
  navigation: any;
  language: Language;
  setLanguage: (language: Language) => void;
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
}) {
  const [configured, setConfigured] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleWebClientId, setGoogleWebClientId] = useState<string | null>(null);
  useEffect(() => {
    tutorialRepository.isConfigured().then(setConfigured).catch(() => setConfigured(false));
    tutorialRepository.getGoogleSignInClientId().then(setGoogleWebClientId).catch(() => setGoogleWebClientId(null));
  }, []);
  const authenticate = async (signup: boolean) => {
    if (!email.trim() || password.length < 8) {
      Alert.alert(
        language === 'ur' ? 'ای میل اور پاس ورڈ' : 'Email and password',
        language === 'ur' ? 'درست ای میل اور کم از کم 8 حروف کا پاس ورڈ لکھیں۔' : 'Enter an email and a password with at least 8 characters.',
      );
      return;
    }
    setBusy(true);
    console.log(`[Stepli Auth] email ${signup ? 'signUp' : 'signIn'} starting`);
    try {
      const next = signup ? await tutorialRepository.signUp(email, password) : await tutorialRepository.signIn(email, password);
      if (!next) {
        console.warn('[Stepli Auth] email signUp returned no session (confirmation required)');
        Alert.alert(
          language === 'ur' ? 'ای میل تصدیق' : 'Email confirmation',
          language === 'ur'
            ? 'اس ای میل سے اکاؤنٹ بن گیا ہے لیکن تصدیق نہیں ہوئی۔ فری ٹائر پر ای میل اکثر نہیں آتی۔ اسی ای میل سے Continue with Google استعمال کریں، یا Supabase میں Confirm email بند کر دیں۔'
            : 'An account was created but not confirmed. On free-tier Supabase the confirmation email often never arrives. Use Continue with Google with the same email, or turn off Confirm email in the Supabase Auth settings.',
        );
      } else {
        console.log('[Stepli Auth] email auth ok', {userId: next.userId, email: next.email});
        setSession(next);
        setPassword('');
      }
    } catch (error) {
      logAuthError(signup ? 'email signUp failed' : 'email signIn failed', error);
      Alert.alert(language === 'ur' ? 'سائن اِن نہیں ہو سکا' : 'Could not sign in', friendlyAuthMessage(error, language));
    } finally {
      setBusy(false);
    }
  };
  const authenticateWithGoogle = async () => {
    if (!googleWebClientId) {
      console.error('[Stepli Auth] Google sign-in blocked: missing webClientId (rebuild after setting STEPLI_GOOGLE_WEB_CLIENT_ID)');
      return;
    }
    setBusy(true);
    console.log('[Stepli Auth] Google sign-in starting', {webClientIdSuffix: googleWebClientId.slice(-24)});
    try {
      GoogleSignin.configure({webClientId: googleWebClientId});
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        console.log('[Stepli Auth] Google signOut before picker', errorMessage(error));
      }
      const result = await GoogleSignin.signIn();
      console.log('[Stepli Auth] Google account picker result', {
        type: result.type,
        hasIdToken: Boolean(result.type === 'success' && result.data?.idToken),
        email: result.type === 'success' ? result.data?.user?.email : undefined,
      });
      if (result.type === 'cancelled') {
        console.warn('[Stepli Auth] Google sign-in cancelled by user');
        return;
      }
      if (!result.data.idToken) throw new Error('Google did not return an ID token. Check the Web client ID configuration.');
      const nextSession = await tutorialRepository.signInWithGoogle(result.data.idToken);
      console.log('[Stepli Auth] Google → Supabase session ok', {userId: nextSession.userId, email: nextSession.email});
      setSession(nextSession);
    } catch (error) {
      logAuthError('Google sign-in failed', error);
      Alert.alert(language === 'ur' ? 'گوگل سے سائن اِن نہیں ہو سکا' : 'Could not sign in with Google', friendlyAuthMessage(error, language));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen scroll language={language} setLanguage={setLanguage} navigation={navigation}>
      <CopyText language={language} style={styles.title}>{language === 'ur' ? 'اکاؤنٹ' : 'Account'}</CopyText>
      {!configured ? (
        <View style={styles.notice}>
          <CopyText language={language} style={styles.noticeBody}>
            {language === 'ur' ? 'Supabase URL اور key کو .env میں رکھ کر ایپ دوبارہ بنائیں۔' : 'Add Supabase URL and key to .env, then rebuild.'}
          </CopyText>
        </View>
      ) : session ? (
        <View style={styles.authCard}>
          <CopyText language={language} style={styles.hint}>{language === 'ur' ? 'سائن اِن' : 'Signed in'}</CopyText>
          <CopyText language={language} style={styles.cardTitle} numberOfLines={1}>{session.email || session.userId}</CopyText>
          <CopyText language={language} style={styles.hint}>{language === 'ur' ? 'لاگ آؤٹ بائیں سائیڈبار میں ہے۔' : 'Log out is in the left sidebar.'}</CopyText>
        </View>
      ) : (
        <View style={styles.authCard}>
          {googleWebClientId ? (
            <Button
              busy={busy}
              label={language === 'ur' ? 'گوگل سے جاری رکھیں' : 'Continue with Google'}
              rtl={language === 'ur'}
              onPress={authenticateWithGoogle}
            />
          ) : null}
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#8A968C"
            style={styles.input}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder={language === 'ur' ? 'پاس ورڈ (8+)' : 'Password (8+)'}
            placeholderTextColor="#8A968C"
            style={styles.input}
          />
          <Button busy={busy} label={language === 'ur' ? 'سائن اِن' : 'Sign in'} rtl={language === 'ur'} onPress={() => authenticate(false)} />
          <Button
            disabled={busy}
            secondary
            label={language === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create account'}
            rtl={language === 'ur'}
            onPress={() => authenticate(true)}
          />
        </View>
      )}
    </Screen>
  );
}
