import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, Text, TextInput, View} from 'react-native';
import {Button, CopyText, Loader, Screen, TutorialCard} from '../components/ui';
import {useGuideRunner} from '../hooks/useGuideRunner';
import {TutorialGuide} from '../models/tutorial';
import {AuthSession, tutorialRepository} from '../services/TutorialRepository';
import {styles} from '../theme/styles';
import {Language} from '../types/app';

export function GuidesScreen({
  navigation,
  route,
  language,
  setLanguage,
  session,
}: {
  navigation: any;
  route: any;
  language: Language;
  setLanguage: (language: Language) => void;
  session: AuthSession | null;
}) {
  const [configured, setConfigured] = useState(false);
  const [guides, setGuides] = useState<TutorialGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'mine' | 'community' | 'all'>(route?.params?.initialTab || 'all');
  const {active, starting, begin, closeNavigator} = useGuideRunner(language, navigation);
  const refresh = useCallback(async () => {
    const ready = await tutorialRepository.isConfigured();
    setConfigured(ready);
    if (!ready || !session) {
      setGuides([]);
      return;
    }
    setLoading(true);
    try {
      setGuides(await tutorialRepository.listGuides(language));
    } catch {
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, [language, session]);
  useEffect(() => {
    refresh();
    return navigation.addListener('focus', refresh);
  }, [navigation, refresh]);
  useEffect(() => {
    const requestedTab = route?.params?.initialTab;
    if (requestedTab === 'mine' || requestedTab === 'community' || requestedTab === 'all') {
      setSelectedTab(requestedTab);
    }
  }, [route?.params?.initialTab]);
  const removeGuide = (guide: TutorialGuide) => {
    Alert.alert(
      language === 'ur' ? 'گائیڈ حذف کریں؟' : 'Remove this guide?',
      language === 'ur' ? 'یہ گائیڈ کمیونٹی سے بھی ہٹ جائے گی۔' : 'This will remove the guide from your community list too.',
      [
        {text: language === 'ur' ? 'منسوخ' : 'Cancel', style: 'cancel'},
        {
          text: language === 'ur' ? 'حذف کریں' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(guide.id);
            try {
              await tutorialRepository.deleteGuide(guide.id);
              await refresh();
            } catch {
              Alert.alert(
                language === 'ur' ? 'گائیڈ حذف نہیں ہوئی' : 'Could not remove guide',
                language === 'ur' ? 'براہِ کرم دوبارہ کوشش کریں۔' : 'Please try again.',
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };
  const visibleGuides = useMemo(() => {
    const mine = guides.filter(guide => guide.ownerId === session?.userId);
    const community = guides.filter(guide => guide.ownerId !== session?.userId);
    const source = selectedTab === 'mine' ? mine : selectedTab === 'community' ? community : guides;
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return source;
    return source.filter(guide => `${guide.title} ${guide.appName} ${guide.description}`.toLocaleLowerCase().includes(query));
  }, [guides, searchQuery, selectedTab, session?.userId]);
  const isMine = selectedTab === 'mine';
  return (
    <Screen scroll language={language} setLanguage={setLanguage} navigation={navigation}>
      <CopyText language={language} style={styles.title}>{language === 'ur' ? 'گائیڈز' : 'Guides'}</CopyText>
      {!configured ? (
        <View style={styles.notice}>
          <CopyText language={language} style={styles.noticeBody}>
            {language === 'ur' ? 'Supabase سیٹ اپ مکمل کریں۔' : 'Finish Supabase setup first.'}
          </CopyText>
        </View>
      ) : !session ? (
        <View style={styles.authCard}>
          <CopyText language={language} style={styles.noticeBody}>
            {language === 'ur' ? 'کمیونٹی گائیڈز کے لیے Settings سے سائن اِن کریں۔' : 'Sign in from Settings to browse guides.'}
          </CopyText>
          <Button label={language === 'ur' ? 'سیٹنگز کھولیں' : 'Open Settings'} rtl={language === 'ur'} onPress={() => navigation.navigate('Settings')} />
        </View>
      ) : (
        <View>
          <Button label={language === 'ur' ? 'نیا گائیڈ' : 'New guide'} rtl={language === 'ur'} onPress={() => navigation.navigate('GuideEditor')} />
          <View style={styles.searchField}>
            <Text style={styles.searchIcon} accessibilityLabel={language === 'ur' ? 'تلاش' : 'Search'}>🔍</Text>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={language === 'ur' ? 'گائیڈ یا ایپ تلاش کریں' : 'Search guides or apps'}
              placeholderTextColor="#72806d"
              style={[styles.searchInput, language === 'ur' && styles.rtl]}
              accessibilityLabel={language === 'ur' ? 'گائیڈز تلاش کریں' : 'Search guides'}
            />
          </View>
          <Button secondary label={language === 'ur' ? 'تلاش کریں' : 'Search'} rtl={language === 'ur'} onPress={() => setSearchQuery(searchText)} />
          <View style={styles.tabRow} accessibilityRole="tablist">
            {[
              {id: 'mine', en: 'My guides', ur: 'میری گائیڈز'},
              {id: 'community', en: 'Community', ur: 'کمیونٹی'},
              {id: 'all', en: 'All', ur: 'سب'},
            ].map(tab => (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{selected: selectedTab === tab.id}}
                onPress={() => setSelectedTab(tab.id as 'mine' | 'community' | 'all')}
                style={[styles.tab, selectedTab === tab.id && styles.tabActive]}>
                <CopyText language={language} style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
                  {language === 'ur' ? tab.ur : tab.en}
                </CopyText>
              </Pressable>
            ))}
          </View>
          <CopyText language={language} style={styles.hint}>
            {isMine
              ? language === 'ur' ? 'صرف آپ کی بنائی ہوئی گائیڈز۔ حذف کا بٹن ہر گائیڈ کے نیچے ہے۔' : 'Only your guides are shown. Remove appears below each one.'
              : selectedTab === 'community'
                ? language === 'ur' ? 'دوسرے لوگوں کی بنائی ہوئی گائیڈز۔' : 'Guides created by other people.'
                : language === 'ur' ? 'آپ کی اور کمیونٹی کی تمام گائیڈز۔' : 'Your guides and community guides together.'}
          </CopyText>
          {loading ? <Loader language={language} label={language === 'ur' ? 'لوڈ ہو رہا ہے…' : 'Loading guides…'} /> : null}
          {starting ? <Loader language={language} label={language === 'ur' ? 'گائیڈ شروع ہو رہی ہے…' : 'Starting guide…'} /> : null}
          {active ? (
            <View style={styles.activeGuide}>
              <CopyText language={language} style={styles.activeGuideTitle}>{active.guide.title}</CopyText>
              <Button danger label={language === 'ur' ? 'روکیں' : 'Stop'} rtl={language === 'ur'} onPress={closeNavigator} />
            </View>
          ) : null}
          {!loading
            ? visibleGuides.map(guide => (
                <View key={guide.id}>
                  <TutorialCard guide={guide} language={language} onPress={() => begin(guide)} />
                  {guide.ownerId === session.userId ? (
                    <Pressable
                      style={styles.removeGuideButton}
                      accessibilityRole="button"
                      accessibilityLabel={language === 'ur' ? 'گائیڈ حذف کریں' : 'Remove guide'}
                      disabled={deletingId === guide.id}
                      onPress={() => removeGuide(guide)}>
                      <CopyText language={language} style={styles.remove}>
                        {deletingId === guide.id ? (language === 'ur' ? 'حذف ہو رہی ہے…' : 'Removing…') : language === 'ur' ? 'حذف کریں' : 'Remove'}
                      </CopyText>
                    </Pressable>
                  ) : null}
                </View>
              ))
            : null}
          {!loading && !visibleGuides.length ? (
            <CopyText language={language} style={styles.hint}>
              {searchQuery
                ? language === 'ur' ? 'اس تلاش سے کوئی گائیڈ نہیں ملی۔' : 'No guides match that search.'
                : isMine
                  ? language === 'ur' ? 'آپ نے ابھی کوئی گائیڈ نہیں بنائی۔' : 'You have not created a guide yet.'
                  : language === 'ur' ? 'ابھی کوئی کمیونٹی گائیڈ نہیں۔' : 'No community guides yet.'}
            </CopyText>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
