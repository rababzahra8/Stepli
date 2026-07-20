import {getBuiltInGuides, groupGuidesByApp} from '../src/data/builtInGuides';
import {getFoodpandaSteps, getFoodpandaTutorial} from '../src/data/foodpandaSteps';

describe('Foodpanda tutorial', () => {
  it('covers location, promotions, cart, checkout, payment, and completion', () => {
    const ids = getFoodpandaSteps('en').map(step => step.id);
    expect(ids).toEqual(expect.arrayContaining([
      'food-location-start',
      'food-promo',
      'food-view-cart',
      'food-cart-review',
      'food-address-review',
      'food-delivery-option',
      'food-payment-method',
      'food-confirm-address',
      'food-place-order',
    ]));
    expect(ids.indexOf('food-view-cart')).toBeGreaterThan(ids.indexOf('food-add-to-cart'));
    expect(ids.indexOf('food-place-order')).toBe(ids.length - 1);
  });

  it('uses the Foodpanda package and supports Urdu copy', () => {
    const guide = getFoodpandaTutorial('ur');
    expect(guide.appPackage).toBe('com.global.foodpanda.android');
    expect(guide.language).toBe('ur');
    expect(guide.steps.length).toBeGreaterThan(10);
    expect(guide.steps[0].text).toContain('فوڈ پانڈا');
  });
});

describe('Built-in guides', () => {
  it('includes Instagram, WhatsApp, YouTube, and Foodpanda', () => {
    const guides = getBuiltInGuides('en');
    const ids = guides.map(guide => guide.id);
    expect(ids).toEqual(expect.arrayContaining([
      'foodpanda-order-food',
      'instagram-post',
      'instagram-story',
      'whatsapp-message',
      'youtube-search',
    ]));
  });

  it('groups multiple Instagram guides under one app', () => {
    const groups = groupGuidesByApp(getBuiltInGuides('en'));
    const instagram = groups.find(group => group.appPackage === 'com.instagram.android');
    expect(instagram?.guides.map(guide => guide.id)).toEqual(['instagram-post', 'instagram-story']);
  });

  it('teaches opening Profile before creating an Instagram post', () => {
    const guide = getBuiltInGuides('en').find(item => item.id === 'instagram-post');
    expect(guide?.steps.length).toBeGreaterThanOrEqual(9);
    const joined = guide!.steps.map(step => step.text).join(' ');
    expect(joined).toMatch(/bottom/i);
    expect(joined).toMatch(/profile picture/i);
    expect(joined).toMatch(/Share/i);
  });

  it('provides Urdu titles for Instagram post', () => {
    const guide = getBuiltInGuides('ur').find(item => item.id === 'instagram-post');
    expect(guide?.title).toContain('انسٹاگرام');
    expect(guide?.steps.length).toBeGreaterThanOrEqual(9);
    expect(guide!.steps[1].text).toContain('دائیں');
  });
});

describe('Stepli voice tour', () => {
  it('has spoken narration for every step in English and Urdu', () => {
    const {getStepliVoiceTour} = require('../src/data/stepliTour');
    for (const language of ['en', 'ur'] as const) {
      const steps = getStepliVoiceTour(language);
      expect(steps.length).toBeGreaterThanOrEqual(5);
      steps.forEach((step: {spokenText: string; title: string; body: string}) => {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.body.length).toBeGreaterThan(0);
        expect(step.spokenText.length).toBeGreaterThan(10);
      });
    }
  });
});
