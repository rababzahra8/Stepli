import {Language} from '../types/app';

export function errorMessage(error: unknown, fallback = 'Please try again.') {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const value = error as {message?: unknown; code?: unknown; statusCode?: unknown};
    if (typeof value.message === 'string' && value.message) return value.message;
    if (value.code != null) return String(value.code);
    if (value.statusCode != null) return `Error ${value.statusCode}`;
  }
  return fallback;
}

export function logAuthError(stage: string, error: unknown) {
  const details =
    error && typeof error === 'object'
      ? {
          message: (error as {message?: unknown}).message,
          code: (error as {code?: unknown}).code,
          statusCode: (error as {statusCode?: unknown}).statusCode,
          name: (error as {name?: unknown}).name,
          stack: error instanceof Error ? error.stack : undefined,
          raw: (() => {
            try {
              return JSON.parse(JSON.stringify(error));
            } catch {
              return String(error);
            }
          })(),
        }
      : {raw: String(error)};
  console.error(`[Stepli Auth] ${stage}`, details);
}

export function friendlyAuthMessage(error: unknown, language: Language) {
  const raw = errorMessage(error).toLowerCase();
  if (raw.includes('already') || raw.includes('registered') || raw.includes('exists')) {
    return language === 'ur'
      ? 'یہ ای میل پہلے سے موجود ہے۔ اگر تصدیق نہیں ہوئی تو Supabase Auth → Users سے اس صارف کو حذف کریں، یا Continue with Google دوبارہ آزمائیں۔'
      : 'This email is already registered. If it was never confirmed, delete that user in Supabase Auth → Users, then try Continue with Google again.';
  }
  if (raw.includes('confirm') || raw.includes('not confirmed') || raw.includes('email not confirmed')) {
    return language === 'ur'
      ? 'ای میل تصدیق نہیں ہوئی۔ فری ٹائر پر ای میل اکثر نہیں آتی — Confirm email بند کریں یا Google استعمال کریں۔'
      : 'Email is not confirmed. Free-tier confirmation emails often never arrive — turn off Confirm email in Supabase, or use Google.';
  }
  return errorMessage(error);
}
