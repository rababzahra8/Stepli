import {en} from '../strings/en';
import {ur} from '../strings/ur';
import {Language} from '../types/app';

export const copyFor = (language: Language) => (language === 'ur' ? ur : en);
