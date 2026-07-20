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
