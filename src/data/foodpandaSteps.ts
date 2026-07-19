import {en} from '../strings/en';
import {ur} from '../strings/ur';

export type Matcher = {resourceId?: string; text?: string; contentDescription?: string};
export type FoodpandaStep = {id: string; text: string; confirm: string; matcher: Matcher};
type Copy = typeof en;

export function getFoodpandaSteps(language: 'en' | 'ur'): FoodpandaStep[] {
  const copy: Copy = language === 'ur' ? ur as Copy : en;
  return [
    {id: 'food-search', text: copy.food.step1.text, confirm: copy.food.step1.confirm, matcher: {resourceId: 'search', contentDescription: 'Search'}},
    {id: 'food-search-submit', text: copy.food.step2.text, confirm: copy.food.step2.confirm, matcher: {text: 'Search', contentDescription: 'Search'}},
    {id: 'food-restaurant', text: copy.food.step3.text, confirm: copy.food.step3.confirm, matcher: {resourceId: 'restaurant'}},
    {id: 'food-add-to-cart', text: copy.food.step4.text, confirm: copy.food.step4.confirm, matcher: {text: 'Add to cart'}},
    {id: 'food-checkout', text: copy.food.step5.text, confirm: copy.food.step5.confirm, matcher: {text: 'Checkout'}},
  ];
}
