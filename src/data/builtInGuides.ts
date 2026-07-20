import {getFoodpandaTutorial} from './foodpandaSteps';
import {TutorialGuide, TutorialStep} from '../models/tutorial';

type Lang = 'en' | 'ur';

type StepCopy = {text: string; confirm: string};
type GuideCopy = {
  title: string;
  description: string;
  steps: StepCopy[];
};

const t = (en: GuideCopy, ur: GuideCopy, language: Lang) => (language === 'ur' ? ur : en);

function stepsFrom(
  prefix: string,
  copy: GuideCopy,
  matchers: Array<TutorialStep['matcher']>,
): TutorialStep[] {
  return copy.steps.map((step, index) => ({
    id: `${prefix}-${index + 1}`,
    text: step.text,
    confirm: step.confirm,
    matcher: matchers[index] || {},
  }));
}

function guide(
  id: string,
  appName: string,
  appPackage: string,
  icon: string,
  language: Lang,
  copy: GuideCopy,
  matchers: Array<TutorialStep['matcher']>,
): TutorialGuide {
  return {
    id,
    appName,
    appPackage,
    title: copy.title,
    description: copy.description,
    icon,
    language,
    visibility: 'published',
    steps: stepsFrom(id, copy, matchers),
    source: 'built-in',
  };
}

function instagramPost(language: Lang): TutorialGuide {
  // Path based on Instagram Help + common Android UI: open your Profile
  // (bottom-right picture), then Create (+) → Post → photo → Next → Share.
  // Create can also appear top-left on Feed; Profile is the clearest path for beginners.
  const copy = t(
    {
      title: 'Post a photo on Instagram',
      description: 'Open your Profile, then create and share a photo post.',
      steps: [
        {
          text: 'Open the Instagram app and wait until you see the main screen (feed or home).',
          confirm: 'Instagram is open',
        },
        {
          text:
            'Look at the bottom of the screen. You will see a row of icons. On the far right is a small circle — that is your profile picture. Tap that circle.',
          confirm: 'I tapped my profile picture',
        },
        {
          text:
            'Check that you are on YOUR profile. You should see your username at the top, and below it things like Edit profile and a grid of your photos. If this is someone else’s page, tap Back, then tap the bottom-right circle again.',
          confirm: 'I am on my profile',
        },
        {
          text:
            'At the top of your profile, find the + (plus) button — often near the top-right, next to the menu (three lines ☰). Tap + to create something new.',
          confirm: 'I tapped +',
        },
        {
          text:
            'At the bottom (or in the list), choose Post — not Reel and not Story. We are making a normal photo post on your profile.',
          confirm: 'I chose Post',
        },
        {
          text:
            'If Instagram asks for photo permission, tap Allow. Then pick a photo from Recents or your gallery. Tap the photo once so it is selected.',
          confirm: 'I selected a photo',
        },
        {
          text: 'Tap Next (usually at the top-right) to continue. You can crop or resize if you want, then tap Next again.',
          confirm: 'I tapped Next',
        },
        {
          text:
            'Optional: swipe filters or tap Edit to adjust the photo. When you are happy, tap Next to go to the caption screen.',
          confirm: 'I am on the caption screen',
        },
        {
          text:
            'If you want, type a caption. You can also skip this. When you are ready, tap Share (top-right). Wait until Instagram finishes uploading.',
          confirm: 'I shared the post',
        },
        {
          text:
            'Done. Go back to your Profile (bottom-right circle). Your new photo should appear at the top of your grid.',
          confirm: 'I can see my new post',
        },
      ],
    },
    {
      title: 'انسٹاگرام پر تصویر پوسٹ کریں',
      description: 'پہلے اپنی پروفائل کھولیں، پھر تصویر پوسٹ بنائیں اور شیئر کریں۔',
      steps: [
        {
          text: 'انسٹاگرام ایپ کھولیں اور مرکزی اسکرین (فیڈ یا ہوم) کا انتظار کریں۔',
          confirm: 'انسٹاگرام کھل گیا',
        },
        {
          text:
            'اسکرین کے بالکل نیچے آئیکنز کی قطار دیکھیں۔ سب سے دائیں طرف ایک چھوٹا دائرہ ہے — یہ آپ کی پروفائل تصویر ہے۔ اسی دائرے پر ٹیپ کریں۔',
          confirm: 'میں نے اپنی پروفائل تصویر دبائی',
        },
        {
          text:
            'چیک کریں کہ یہ آپ کی اپنی پروفائل ہے۔ اوپر آپ کا یوزرنیم نظر آنا چاہیے، اور نیچے Edit profile اور آپ کی تصویروں کا گرڈ۔ اگر کسی اور کی پروفائل ہے تو Back دبائیں، پھر دوبارہ نیچے دائیں دائرے پر ٹیپ کریں۔',
          confirm: 'میں اپنی پروفائل پر ہوں',
        },
        {
          text:
            'پروفائل کے اوپر + (پلس) بٹن تلاش کریں — اکثر اوپر دائیں طرف، مینو (☰ تین لکیریں) کے پاس۔ نیا بنانے کے لیے + دبائیں۔',
          confirm: 'میں نے + دبایا',
        },
        {
          text:
            'نیچے (یا فہرست میں) Post چنیں — Reel یا Story نہیں۔ ہم عام تصویر والی پوسٹ بنا رہے ہیں۔',
          confirm: 'میں نے Post چنا',
        },
        {
          text:
            'اگر انسٹاگرام تصویر کی اجازت مانگے تو Allow دبائیں۔ پھر Recents یا گیلری سے تصویر چنیں۔ تصویر ایک بار ٹیپ کر کے منتخب کریں۔',
          confirm: 'میں نے تصویر منتخب کی',
        },
        {
          text: 'آگے بڑھنے کے لیے Next دبائیں (عام طور پر اوپر دائیں)۔ چاہیں تو کراپ کریں، پھر دوبارہ Next دبائیں۔',
          confirm: 'میں نے Next دبایا',
        },
        {
          text:
            'اختیاری: فلٹر یا Edit سے تصویر درست کریں۔ جب ٹھیک لگے تو Next دبا کر caption والی اسکرین پر جائیں۔',
          confirm: 'میں caption والی اسکرین پر ہوں',
        },
        {
          text:
            'چاہیں تو caption لکھیں۔ چھوڑ بھی سکتے ہیں۔ تیار ہوں تو Share (اوپر دائیں) دبائیں اور اپلوڈ مکمل ہونے کا انتظار کریں۔',
          confirm: 'میں نے پوسٹ شیئر کر دی',
        },
        {
          text:
            'مکمل۔ اپنی پروفائل پر واپس جائیں (نیچے دائیں دائرہ)۔ نئی تصویر گرڈ کے اوپر نظر آنی چاہیے۔',
          confirm: 'مجھے نئی پوسٹ نظر آ رہی ہے',
        },
      ],
    },
    language,
  );
  return guide('instagram-post', 'Instagram', 'com.instagram.android', '📸', language, copy, [
    {text: ['Home', 'For you', 'Following', 'Reels'], contentDescription: ['Home', 'Instagram', 'Feed']},
    {
      text: ['Profile', 'Your story'],
      contentDescription: ['Profile', 'Profile tab', 'User profile', 'Account'],
    },
    {text: ['Edit profile', 'Edit Profile', 'Share profile', 'Dashboard'], contentDescription: ['Profile']},
    {
      text: ['Create', 'New post', 'New', 'Post'],
      contentDescription: ['Create', 'New post', 'Create new', 'Plus'],
    },
    {text: ['Post', 'POST', 'Posts'], contentDescription: ['Post']},
    {text: ['Recents', 'Gallery', 'Library', 'Camera roll', 'Photos', 'Allow'], contentDescription: ['Photo', 'Gallery']},
    {text: ['Next', 'Continue', 'OK'], contentDescription: ['Next']},
    {text: ['Next', 'Filter', 'Filters', 'Edit', 'Continue'], contentDescription: ['Next', 'Filter']},
    {text: ['Share', 'Share post', 'Done'], contentDescription: ['Share']},
    {text: ['Edit profile', 'Posts', 'Profile'], contentDescription: ['Profile']},
  ]);
}

function instagramStory(language: Lang): TutorialGuide {
  const copy = t(
    {
      title: 'Share an Instagram Story',
      description: 'Open your Profile or Home, then add a photo to your story.',
      steps: [
        {
          text: 'Open Instagram and wait for the main screen.',
          confirm: 'Instagram is open',
        },
        {
          text:
            'Easy path: tap your small circular profile picture at the bottom-right to open YOUR profile. (Your picture is the last icon in the bottom row.)',
          confirm: 'I opened my profile',
        },
        {
          text:
            'On your profile, tap your large profile picture at the top (or the + on it) to add to Your story. Or tap Create (+) then choose Story.',
          confirm: 'I opened Story camera',
        },
        {
          text: 'Take a photo with the shutter, or swipe up / open the gallery and pick a photo.',
          confirm: 'I chose a photo',
        },
        {
          text: 'Optional: tap Aa for text or the sticker icon. Skip if you do not need them.',
          confirm: 'Looks good',
        },
        {
          text: 'At the bottom, tap Your story (or Share) to publish. Stories disappear after 24 hours.',
          confirm: 'I shared my story',
        },
      ],
    },
    {
      title: 'انسٹاگرام اسٹوری شیئر کریں',
      description: 'پروفائل یا ہوم سے اسٹوری میں تصویر شامل کریں۔',
      steps: [
        {
          text: 'انسٹاگرام کھولیں اور مرکزی اسکرین کا انتظار کریں۔',
          confirm: 'انسٹاگرام کھل گیا',
        },
        {
          text:
            'آسان طریقہ: نیچے دائیں طرف اپنی چھوٹی گول پروفائل تصویر دبائیں — نیچے والی قطار کا آخری آئیکن۔ اس سے آپ کی پروفائل کھلتی ہے۔',
          confirm: 'میں نے اپنی پروفائل کھولی',
        },
        {
          text:
            'پروفائل پر اوپر بڑی پروفائل تصویر (یا اس پر +) دبا کر Your story کھولیں۔ یا Create (+) دبا کر Story چنیں۔',
          confirm: 'میں اسٹوری کیمرا پر ہوں',
        },
        {
          text: 'شٹر سے تصویر لیں، یا گیلری کھول کر تصویر چنیں۔',
          confirm: 'میں نے تصویر چنی',
        },
        {
          text: 'اختیاری: Aa سے متن یا اسٹیکر شامل کریں۔ ضرورت نہ ہو تو چھوڑ دیں۔',
          confirm: 'ٹھیک لگ رہا ہے',
        },
        {
          text: 'نیچے Your story (یا Share) دبا کر شیئر کریں۔ اسٹوری ۲۴ گھنٹے بعد غائب ہو جاتی ہے۔',
          confirm: 'میں نے اسٹوری شیئر کر دی',
        },
      ],
    },
    language,
  );
  return guide('instagram-story', 'Instagram', 'com.instagram.android', '✨', language, copy, [
    {text: ['Home', 'For you', 'Following'], contentDescription: ['Home', 'Instagram']},
    {text: ['Profile'], contentDescription: ['Profile', 'Profile tab', 'User profile']},
    {text: ['Story', 'Your story', 'Create'], contentDescription: ['Story', 'Create', 'Your story']},
    {text: ['Gallery', 'Recents', 'Camera', 'Library', 'Photos'], contentDescription: ['Camera', 'Gallery']},
    {text: ['Done', 'Aa', 'Stickers', 'Download', 'Text'], contentDescription: ['Stickers', 'Text']},
    {text: ['Your story', 'Share to story', 'Share', 'Add to story'], contentDescription: ['Your story', 'Share']},
  ]);
}

function whatsappMessage(language: Lang): TutorialGuide {
  const copy = t(
    {
      title: 'Send a WhatsApp message',
      description: 'Open a chat and send a text message.',
      steps: [
        {text: 'Open WhatsApp and wait for Chats.', confirm: 'I see Chats'},
        {text: 'Tap a chat, or the new chat button to pick someone.', confirm: 'I opened a chat'},
        {text: 'Type your message in the text box at the bottom.', confirm: 'I typed my message'},
        {text: 'Tap the Send button.', confirm: 'I sent the message'},
      ],
    },
    {
      title: 'واٹس ایپ پر پیغام بھیجیں',
      description: 'چیٹ کھولیں اور ٹیکسٹ پیغام بھیجیں۔',
      steps: [
        {text: 'واٹس ایپ کھولیں اور Chats کا انتظار کریں۔', confirm: 'مجھے Chats نظر آ رہے ہیں'},
        {text: 'کسی چیٹ پر دبائیں، یا نیا چیٹ بٹن دبا کر شخص چنیں۔', confirm: 'میں نے چیٹ کھولی'},
        {text: 'نیچے والے باکس میں اپنا پیغام لکھیں۔', confirm: 'میں نے پیغام لکھا'},
        {text: 'Send بٹن دبائیں۔', confirm: 'میں نے پیغام بھیج دیا'},
      ],
    },
    language,
  );
  return guide('whatsapp-message', 'WhatsApp', 'com.whatsapp', '💬', language, copy, [
    {text: ['Chats', 'Chat', 'Updates'], contentDescription: ['Chats', 'WhatsApp']},
    {text: ['New chat', 'Search', 'Message'], contentDescription: ['New chat', 'Search']},
    {text: ['Type a message', 'Message'], contentDescription: ['Type a message', 'Message']},
    {text: ['Send'], contentDescription: ['Send']},
  ]);
}

function youtubeSearch(language: Lang): TutorialGuide {
  const copy = t(
    {
      title: 'Search a video on YouTube',
      description: 'Find a video and start watching.',
      steps: [
        {text: 'Open YouTube and wait for the home screen.', confirm: 'I am on YouTube'},
        {text: 'Tap the Search icon.', confirm: 'I tapped Search'},
        {text: 'Type what you want to watch, then submit search.', confirm: 'I searched'},
        {text: 'Tap a video from the results to play it.', confirm: 'The video is playing'},
      ],
    },
    {
      title: 'یوٹیوب پر ویڈیو تلاش کریں',
      description: 'ویڈیو تلاش کریں اور دیکھنا شروع کریں۔',
      steps: [
        {text: 'یوٹیوب کھولیں اور ہوم اسکرین کا انتظار کریں۔', confirm: 'میں یوٹیوب پر ہوں'},
        {text: 'Search آئیکن دبائیں۔', confirm: 'میں نے Search دبایا'},
        {text: 'جو دیکھنا ہے لکھیں، پھر سرچ کریں۔', confirm: 'میں نے تلاش کر لی'},
        {text: 'نتائج میں سے کوئی ویڈیو دبا کر چلائیں۔', confirm: 'ویڈیو چل رہی ہے'},
      ],
    },
    language,
  );
  return guide('youtube-search', 'YouTube', 'com.google.android.youtube', '▶️', language, copy, [
    {text: ['Home', 'Shorts', 'Subscriptions'], contentDescription: ['Home', 'YouTube']},
    {text: ['Search'], contentDescription: ['Search']},
    {text: ['Search YouTube', 'Search'], contentDescription: ['Search']},
    {text: ['Play', 'Watch'], contentDescription: ['Play video', 'Video']},
  ]);
}

/** Hardcoded starter guides shipped with Stepli. */
export function getBuiltInGuides(language: Lang): TutorialGuide[] {
  return [
    getFoodpandaTutorial(language),
    instagramPost(language),
    instagramStory(language),
    whatsappMessage(language),
    youtubeSearch(language),
  ];
}

export type AppGuideGroup = {
  appName: string;
  appPackage: string;
  icon: string;
  guides: TutorialGuide[];
};

export function groupGuidesByApp(guides: TutorialGuide[]): AppGuideGroup[] {
  const order: string[] = [];
  const map = new Map<string, AppGuideGroup>();
  for (const item of guides) {
    const key = item.appPackage || item.appName;
    const existing = map.get(key);
    if (existing) {
      existing.guides.push(item);
      continue;
    }
    order.push(key);
    map.set(key, {
      appName: item.appName,
      appPackage: item.appPackage,
      icon: item.icon || '📱',
      guides: [item],
    });
  }
  return order.map(key => map.get(key)!);
}

export function getBuiltInGuideById(id: string, language: Lang): TutorialGuide | undefined {
  return getBuiltInGuides(language).find(guide => guide.id === id);
}
