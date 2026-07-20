import {en} from '../strings/en';
import {ur} from '../strings/ur';
import {TutorialGuide, TutorialStep} from '../models/tutorial';

export type FoodpandaStep = TutorialStep;
type Copy = typeof en;

export function getFoodpandaSteps(language: 'en' | 'ur'): FoodpandaStep[] {
  const copy: Copy = language === 'ur' ? ur as Copy : en;
  return [
    // Location and promotional screens are conditional. Every card can be
    // confirmed manually, so the guide never traps someone when Foodpanda
    // skips one of those screens or changes a label in a later app version.
    {id: 'food-location-start', text: copy.food.locationStart.text, confirm: copy.food.locationStart.confirm, matcher: {text: ['Confirm location', 'Set location', 'Choose location']}},
    {id: 'food-location-search', text: copy.food.locationSearch.text, confirm: copy.food.locationSearch.confirm, matcher: {text: ['Search for an area', 'Search location', 'Add location'], contentDescription: 'Search'}},
    {id: 'food-location-confirm', text: copy.food.locationConfirm.text, confirm: copy.food.locationConfirm.confirm, matcher: {text: ['Confirm location', 'Save address', 'Confirm address']}},
    {id: 'food-promo', text: copy.food.promo.text, confirm: copy.food.promo.confirm, matcher: {text: ['Not now', 'Skip', 'No thanks', 'Close']}},
    {id: 'food-search', text: copy.food.search.text, confirm: copy.food.search.confirm, matcher: {resourceId: 'search', contentDescription: 'Search'}},
    {id: 'food-search-submit', text: copy.food.searchSubmit.text, confirm: copy.food.searchSubmit.confirm, matcher: {text: 'Search', contentDescription: 'Search'}},
    {id: 'food-restaurant', text: copy.food.restaurant.text, confirm: copy.food.restaurant.confirm, matcher: {resourceId: 'restaurant', text: ['Restaurants', 'Restaurants near you']}},
    {id: 'food-add-to-cart', text: copy.food.addToCart.text, confirm: copy.food.addToCart.confirm, matcher: {resourceId: ['add_to_cart', 'add'], text: ['Add to cart', 'Add'], contentDescription: 'Add'}},
    {id: 'food-view-cart', text: copy.food.viewCart.text, confirm: copy.food.viewCart.confirm, matcher: {text: ['View your cart', 'View cart']}},
    {id: 'food-cart-review', text: copy.food.cartReview.text, confirm: copy.food.cartReview.confirm, matcher: {text: ['Checkout', 'Go to checkout', 'Proceed to checkout']}},
    {id: 'food-address-review', text: copy.food.addressReview.text, confirm: copy.food.addressReview.confirm, matcher: {text: ['Change', 'Change address', 'Delivery address']}},
    {id: 'food-delivery-option', text: copy.food.deliveryOption.text, confirm: copy.food.deliveryOption.confirm, matcher: {text: ['Delivery options', 'Delivery fee', 'Standard delivery']}},
    {id: 'food-payment-change', text: copy.food.paymentChange.text, confirm: copy.food.paymentChange.confirm, matcher: {text: ['Change payment method', 'Payment method', 'Change']}},
    {id: 'food-payment-method', text: copy.food.paymentMethod.text, confirm: copy.food.paymentMethod.confirm, matcher: {text: ['Cash on delivery', 'Add card', 'Credit or debit card']}},
    {id: 'food-confirm-address', text: copy.food.confirmAddress.text, confirm: copy.food.confirmAddress.confirm, matcher: {text: ['Confirm address', 'Save address', 'Continue']}},
    {id: 'food-place-order', text: copy.food.placeOrder.text, confirm: copy.food.placeOrder.confirm, matcher: {text: ['Place order', 'Confirm order', 'Order now']}},
  ];
}

export function getFoodpandaTutorial(language: 'en' | 'ur'): TutorialGuide {
  const copy: Copy = language === 'ur' ? ur as Copy : en;
  return {
    id: 'foodpanda-order-food',
    appName: 'Foodpanda',
    appPackage: 'com.global.foodpanda.android',
    title: copy.home.cardFoodpanda,
    description: copy.home.cardBody,
    icon: '🍲',
    language,
    visibility: 'published',
    steps: getFoodpandaSteps(language),
    source: 'built-in',
  };
}
