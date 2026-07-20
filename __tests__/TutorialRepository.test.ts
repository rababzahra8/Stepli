jest.mock('../src/native/StepliOverlay', () => ({
  StepliOverlay: {
    getTutorialBackendConfig: jest.fn(),
    getTutorialSession: jest.fn(),
    setTutorialSession: jest.fn(),
    clearTutorialSession: jest.fn(),
  },
}));

import {tutorialRepository} from '../src/services/TutorialRepository';
import {StepliOverlay} from '../src/native/StepliOverlay';

const mockOverlay = StepliOverlay as unknown as {
  getTutorialBackendConfig: jest.Mock;
  getTutorialSession: jest.Mock;
  setTutorialSession: jest.Mock;
  clearTutorialSession: jest.Mock;
};

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
}) as unknown as Response;

describe('TutorialRepository session restoration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOverlay.getTutorialBackendConfig.mockResolvedValue({url: 'https://project.supabase.co', anonKey: 'publishable-key'});
  });

  it('refreshes a stored session and re-encrypts the rotated credentials', async () => {
    mockOverlay.getTutorialSession.mockResolvedValue({accessToken: 'old-access', refreshToken: 'old-refresh', userId: 'user-1', email: 'person@example.com'});
    globalThis.fetch = jest.fn().mockResolvedValue(response({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      user: {id: 'user-1', email: 'person@example.com'},
    })) as jest.Mock;

    const session = await tutorialRepository.restoreSession();

    expect(session).toMatchObject({accessToken: 'new-access', refreshToken: 'new-refresh', userId: 'user-1'});
    expect(mockOverlay.setTutorialSession).toHaveBeenCalledWith('new-access', 'new-refresh', 'user-1', 'person@example.com');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/token?grant_type=refresh_token',
      expect.objectContaining({method: 'POST'}),
    );
  });

  it('exchanges a Google ID token for the same encrypted Supabase session', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({
      access_token: 'google-access',
      refresh_token: 'google-refresh',
      user: {id: 'google-user', email: 'person@gmail.com'},
    })) as jest.Mock;

    const session = await tutorialRepository.signInWithGoogle('google-id-token');

    expect(session).toMatchObject({accessToken: 'google-access', userId: 'google-user', email: 'person@gmail.com'});
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/token?grant_type=id_token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({provider: 'google', id_token: 'google-id-token'}),
      }),
    );
    expect(mockOverlay.setTutorialSession).toHaveBeenCalledWith('google-access', 'google-refresh', 'google-user', 'person@gmail.com');
  });
});
