import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, Switch, Text, TextInput, View} from 'react-native';
import {Back, Button, CopyText, Loader, Screen} from '../components/ui';
import {InstalledApp, TutorialDraft, TutorialStep} from '../models/tutorial';
import {tutorialRepository} from '../services/TutorialRepository';
import {StepliOverlay} from '../native/StepliOverlay';
import {C} from '../theme/colors';
import {styles} from '../theme/styles';
import {Language} from '../types/app';
import {errorMessage} from '../utils/authErrors';

export function GuideEditorScreen({navigation, language}: {navigation: any; language: Language}) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [appQuery, setAppQuery] = useState('');
  const [showApps, setShowApps] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [appName, setAppName] = useState('');
  const [appPackage, setAppPackage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([{id: 'draft-1', text: '', spokenText: '', confirm: '', matcher: {}}]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingApps(true);
    StepliOverlay.getLaunchableApps()
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoadingApps(false));
  }, []);

  const filteredApps = useMemo(() => {
    const query = appQuery.trim().toLowerCase();
    const list = query
      ? apps.filter(app => app.label.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query))
      : apps;
    return list.slice(0, 100);
  }, [apps, appQuery]);

  const updateStep = (index: number, changes: Partial<TutorialStep>) =>
    setSteps(current => current.map((step, position) => (position === index ? {...step, ...changes} : step)));
  const updateMatcher = (index: number, key: 'text' | 'resourceId' | 'contentDescription', value: string) => {
    const matcher = {...(steps[index]?.matcher || {})};
    if (value.trim()) matcher[key] = value.trim();
    else delete matcher[key];
    updateStep(index, {matcher});
  };
  const addStep = () => setSteps(current => [...current, {id: `draft-${Date.now()}`, text: '', spokenText: '', confirm: '', matcher: {}}]);
  const removeStep = (index: number) => setSteps(current => (current.length === 1 ? current : current.filter((_, position) => position !== index)));
  const save = async () => {
    const cleanSteps = steps.map((step, index) => ({
      ...step,
      id: `user-step-${index + 1}`,
      text: step.text.trim(),
      spokenText: step.spokenText?.trim(),
      confirm: step.confirm.trim() || (language === 'ur' ? 'میں نے یہ کر لیا' : 'I did this'),
    }));
    if (!appName.trim() || !appPackage.trim() || !title.trim() || cleanSteps.some(step => !step.text)) {
      Alert.alert(
        language === 'ur' ? 'معلومات مکمل کریں' : 'Complete the guide',
        language === 'ur' ? 'ایپ، عنوان اور ہر قدم کی ہدایت شامل کریں۔' : 'Add the app, title, and an instruction for every step.',
      );
      return;
    }
    const draft: TutorialDraft = {appName, appPackage, title, description, language, visibility: published ? 'published' : 'private', steps: cleanSteps};
    setSaving(true);
    try {
      await tutorialRepository.createGuide(draft);
      Alert.alert(
        language === 'ur' ? 'گائیڈ محفوظ ہو گئی' : 'Guide saved',
        language === 'ur' ? 'ہوم اسکرین پر جا کر اپنی گائیڈ شروع کریں۔' : 'Go back to Home to start your guide.',
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert(language === 'ur' ? 'گائیڈ محفوظ نہیں ہوئی' : 'Could not save guide', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen scroll>
      <Back navigation={navigation} language={language} />
      <CopyText language={language} style={styles.title}>{language === 'ur' ? 'نیا گائیڈ' : 'New guide'}</CopyText>
      <Button
        secondary
        label={appName || (language === 'ur' ? 'ایپ منتخب کریں' : 'Choose app')}
        rtl={language === 'ur'}
        onPress={() => setShowApps(value => !value)}
      />
      {showApps ? (
        <View style={styles.appPicker}>
          <TextInput
            value={appQuery}
            onChangeText={setAppQuery}
            autoCorrect={false}
            placeholder={language === 'ur' ? 'ایپ تلاش کریں…' : 'Search installed apps…'}
            placeholderTextColor="#8A968C"
            style={styles.searchInput}
          />
          {loadingApps ? (
            <Loader language={language} label={language === 'ur' ? 'ایپس لوڈ ہو رہی ہیں…' : 'Loading apps…'} />
          ) : (
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.appPickerList}>
              {filteredApps.length ? (
                filteredApps.map(app => (
                  <Pressable
                    key={app.packageName}
                    style={styles.appOption}
                    onPress={() => {
                      setAppName(app.label);
                      setAppPackage(app.packageName);
                      setShowApps(false);
                      setAppQuery('');
                    }}>
                    <Text style={styles.appOptionLabel} numberOfLines={1}>{app.label}</Text>
                    <Text style={styles.appOptionPackage} numberOfLines={1}>{app.packageName}</Text>
                  </Pressable>
                ))
              ) : (
                <CopyText language={language} style={styles.hint}>
                  {language === 'ur' ? 'کوئی ایپ نہیں ملی۔ نیچے دستی لکھیں۔' : 'No apps matched. Type details below.'}
                </CopyText>
              )}
            </ScrollView>
          )}
        </View>
      ) : null}
      <TextInput
        value={appName}
        onChangeText={setAppName}
        placeholder={language === 'ur' ? 'ایپ کا نام' : 'App name'}
        placeholderTextColor="#8A968C"
        style={styles.input}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        value={appPackage}
        onChangeText={setAppPackage}
        placeholder="com.example.app"
        placeholderTextColor="#8A968C"
        style={styles.input}
      />
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={language === 'ur' ? 'عنوان' : 'Title'}
        placeholderTextColor="#8A968C"
        style={styles.input}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={language === 'ur' ? 'مختصر وضاحت (اختیاری)' : 'Short description (optional)'}
        placeholderTextColor="#8A968C"
        style={styles.input}
      />
      <View style={styles.setting}>
        <CopyText language={language}>{language === 'ur' ? 'کمیونٹی میں شیئر' : 'Share publicly'}</CopyText>
        <Switch value={published} onValueChange={setPublished} trackColor={{true: C.sage}} />
      </View>
      <CopyText language={language} style={styles.settingLabel}>{language === 'ur' ? 'قدم' : 'Steps'}</CopyText>
      {steps.map((step, index) => (
        <View style={styles.stepEditor} key={step.id}>
          <View style={styles.stepHeader}>
            <CopyText language={language} style={styles.stepTitle}>
              {language === 'ur' ? 'قدم' : 'Step'} {index + 1}
            </CopyText>
            {steps.length > 1 ? (
              <Pressable onPress={() => removeStep(index)}>
                <CopyText language={language} style={styles.remove}>{language === 'ur' ? 'حذف' : 'Remove'}</CopyText>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            multiline
            value={step.text}
            onChangeText={text => updateStep(index, {text})}
            placeholder={language === 'ur' ? 'صارف کیا کرے؟' : 'What should they do?'}
            placeholderTextColor="#8A968C"
            style={[styles.input, styles.multilineInput]}
          />
          <TextInput
            value={step.confirm}
            onChangeText={confirm => updateStep(index, {confirm})}
            placeholder={language === 'ur' ? 'بٹن کا متن' : 'Confirm button'}
            placeholderTextColor="#8A968C"
            style={styles.input}
          />
          {showAdvanced ? (
            <View>
              <TextInput
                multiline
                value={step.spokenText}
                onChangeText={spokenText => updateStep(index, {spokenText})}
                placeholder={language === 'ur' ? 'بولنے کا متن' : 'Narration (optional)'}
                placeholderTextColor="#8A968C"
                style={[styles.input, styles.multilineInput]}
              />
              <TextInput
                value={typeof step.matcher?.text === 'string' ? step.matcher.text : ''}
                onChangeText={value => updateMatcher(index, 'text', value)}
                placeholder={language === 'ur' ? 'بٹن کا متن' : 'Visible label'}
                placeholderTextColor="#8A968C"
                style={styles.input}
              />
              <TextInput
                autoCapitalize="none"
                value={typeof step.matcher?.resourceId === 'string' ? step.matcher.resourceId : ''}
                onChangeText={value => updateMatcher(index, 'resourceId', value)}
                placeholder="Resource ID"
                placeholderTextColor="#8A968C"
                style={styles.input}
              />
            </View>
          ) : null}
        </View>
      ))}
      <Pressable accessibilityRole="button" onPress={() => setShowAdvanced(value => !value)}>
        <CopyText language={language} style={styles.link}>
          {showAdvanced ? (language === 'ur' ? 'کم دکھائیں' : 'Hide advanced') : language === 'ur' ? 'اضافی اختیارات' : 'Advanced options'}
        </CopyText>
      </Pressable>
      <Button secondary label={language === 'ur' ? 'قدم شامل کریں' : 'Add step'} rtl={language === 'ur'} onPress={addStep} />
      <Button busy={saving} label={language === 'ur' ? 'محفوظ کریں' : 'Save guide'} rtl={language === 'ur'} onPress={save} />
    </Screen>
  );
}
