import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  AccountScreen,
  BuiltInGuidesScreen,
  CelebrationScreen,
  GuideEditorScreen,
  GuidesScreen,
  HomeScreen,
  LanguageScreen,
  OnboardingScreen,
  PermissionsScreen,
  SettingsScreen,
  VoiceTourScreen,
} from './src/screens';
import {AuthSession, tutorialRepository} from './src/services/TutorialRepository';
import {StepliOverlay} from './src/native/StepliOverlay';
import {C} from './src/theme/colors';
import {styles} from './src/theme/styles';
import {Language, RootStack} from './src/types/app';
import {confirmUrduSelection} from './src/utils/urduVoice';

const Stack = createNativeStackNavigator<RootStack>();

export default function App() {
  const [language, setLanguageState] = useState<Language | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => tutorialRepository.subscribeSession(next => setSession(next)), []);
  useEffect(() => {
    Promise.all([
      StepliOverlay.getLanguage(),
      StepliOverlay.getOnboardingComplete(),
      tutorialRepository.restoreSession().catch(() => null),
    ])
      .then(([savedLanguage, complete, restoredSession]) => {
        setLanguageState(savedLanguage);
        setOnboardingComplete(complete);
        setSession(restoredSession);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const setLanguage = async (value: Language) => {
    if (value === language) {
      return;
    }
    if (value === 'ur' && !(await confirmUrduSelection())) {
      return;
    }
    await StepliOverlay.setLanguage(value);
    setLanguageState(value);
  };
  const completeOnboarding = async () => {
    await StepliOverlay.setOnboardingComplete();
    setOnboardingComplete(true);
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.boot}>
          <ActivityIndicator size="large" color={C.sage} />
          <Text style={styles.loaderLabel}>Loading Stepli…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!language) {
    return <LanguageScreen onChoose={setLanguage} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={onboardingComplete ? 'Home' : 'Permissions'} screenOptions={{headerShown: false, animation: 'fade'}}>
        <Stack.Screen name="Permissions">
          {props => <PermissionsScreen {...props} language={language} setLanguage={setLanguage} />}
        </Stack.Screen>
        <Stack.Screen name="Onboarding">
          {props => (
            <OnboardingScreen
              {...props}
              language={language}
              setLanguage={setLanguage}
              completeOnboarding={completeOnboarding}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {props => <HomeScreen {...props} language={language} setLanguage={setLanguage} session={session} />}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {props => <SettingsScreen {...props} language={language} setLanguage={setLanguage} session={session} />}
        </Stack.Screen>
        <Stack.Screen name="Account">
          {props => <AccountScreen {...props} language={language} setLanguage={setLanguage} session={session} setSession={setSession} />}
        </Stack.Screen>
        <Stack.Screen name="Guides">
          {props => <GuidesScreen {...props} language={language} setLanguage={setLanguage} session={session} />}
        </Stack.Screen>
        <Stack.Screen name="BuiltInGuides">
          {props => <BuiltInGuidesScreen {...props} language={language} setLanguage={setLanguage} />}
        </Stack.Screen>
        <Stack.Screen name="VoiceTour">
          {props => <VoiceTourScreen {...props} language={language} setLanguage={setLanguage} />}
        </Stack.Screen>
        <Stack.Screen name="GuideEditor">
          {props => <GuideEditorScreen {...props} language={language} setLanguage={setLanguage} />}
        </Stack.Screen>
        <Stack.Screen name="Celebration">
          {props => <CelebrationScreen {...props} language={language} setLanguage={setLanguage} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
