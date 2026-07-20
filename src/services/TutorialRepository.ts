import {StepliOverlay} from '../native/StepliOverlay';
import {TutorialDraft, TutorialGuide, TutorialStep} from '../models/tutorial';

type BackendConfig = {url: string; anonKey: string; googleWebClientId?: string};
export type AuthSession = {accessToken: string; refreshToken: string; userId: string; email?: string};

type SupabaseTutorialRow = {
  id: string;
  owner_id: string;
  app_name: string;
  app_package: string;
  title: string;
  description: string | null;
  language: 'en' | 'ur';
  visibility: 'private' | 'published';
  tutorial_steps?: SupabaseStepRow[];
};

type SupabaseStepRow = {
  id: string;
  position: number;
  instruction: string;
  spoken_instruction: string | null;
  confirmation_text: string | null;
  matcher: TutorialStep['matcher'] | null;
};

class TutorialRepository {
  private config: BackendConfig | null | undefined;
  private session: AuthSession | null = null;
  private readonly sessionListeners = new Set<(session: AuthSession | null) => void>();

  async getConfig(): Promise<BackendConfig | null> {
    if (this.config !== undefined) return this.config;
    const config = await StepliOverlay.getTutorialBackendConfig();
    this.config = config?.url && config?.anonKey ? config : null;
    return this.config;
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.getConfig());
  }

  /** The Google OAuth web client ID is public app configuration, not a secret. */
  async getGoogleSignInClientId(): Promise<string | null> {
    return (await this.getConfig())?.googleWebClientId || null;
  }

  currentSession(): AuthSession | null {
    return this.session;
  }

  subscribeSession(listener: (session: AuthSession | null) => void): () => void {
    this.sessionListeners.add(listener);
    return () => this.sessionListeners.delete(listener);
  }

  /** Restores and refreshes a session saved by Android's Keystore-backed store. */
  async restoreSession(): Promise<AuthSession | null> {
    const saved = await StepliOverlay.getTutorialSession();
    if (!saved || !(await this.getConfig())) return null;
    try {
      return await this.refreshSession(saved.refreshToken);
    } catch {
      this.setCurrentSession(null);
      await StepliOverlay.clearTutorialSession();
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const data = await this.auth('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({email: email.trim(), password}),
    });
    return this.setSession(data);
  }

  async signUp(email: string, password: string): Promise<AuthSession | null> {
    const data = await this.auth('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({email: email.trim(), password}),
    });
    // With email confirmation enabled Supabase returns a user but no session.
    return data.access_token ? this.setSession(data) : null;
  }

  /** Exchanges a Google OpenID Connect ID token for a Supabase session. */
  async signInWithGoogle(idToken: string): Promise<AuthSession> {
    if (!idToken.trim()) throw new Error('Google did not return an ID token.');
    const data = await this.auth('/auth/v1/token?grant_type=id_token', {
      method: 'POST',
      body: JSON.stringify({provider: 'google', id_token: idToken}),
    });
    return this.setSession(data);
  }

  async signOut() {
    const session = this.session;
    this.setCurrentSession(null);
    try {
      if (session) await this.auth('/auth/v1/logout', {method: 'POST', headers: {Authorization: `Bearer ${session.accessToken}`}});
    } catch {
      // Local sign-out must still succeed when the device is offline.
    } finally {
      await StepliOverlay.clearTutorialSession();
    }
  }

  async listGuides(language: 'en' | 'ur'): Promise<TutorialGuide[]> {
    const session = this.requireSession();
    const config = await this.requireConfig();
    const visibility = `or=(visibility.eq.published,owner_id.eq.${session.userId})`;
    const query = `select=*,tutorial_steps(*)&language=eq.${encodeURIComponent(language)}&${visibility}&order=updated_at.desc`;
    const rows = await this.request<SupabaseTutorialRow[]>(`${config.url}/rest/v1/tutorials?${query}`);
    return rows.map(row => this.toGuide(row));
  }

  async createGuide(draft: TutorialDraft): Promise<TutorialGuide> {
    const session = this.requireSession();
    const tutorial = await this.request<SupabaseTutorialRow[]>(`${(await this.requireConfig()).url}/rest/v1/tutorials`, {
      method: 'POST',
      headers: {Prefer: 'return=representation'},
      body: JSON.stringify({
        owner_id: session.userId,
        app_name: draft.appName.trim(),
        app_package: draft.appPackage.trim(),
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        language: draft.language,
        visibility: draft.visibility,
      }),
    });
    const saved = tutorial[0];
    if (!saved) throw new Error('The tutorial could not be saved.');
    if (draft.steps.length) {
      await this.request(`${(await this.requireConfig()).url}/rest/v1/tutorial_steps`, {
        method: 'POST',
        body: JSON.stringify(draft.steps.map((step, index) => ({
          tutorial_id: saved.id,
          position: index + 1,
          instruction: step.text.trim(),
          spoken_instruction: step.spokenText?.trim() || null,
          confirmation_text: step.confirm.trim() || null,
          matcher: step.matcher || {},
        }))),
      });
    }
    return {
      ...draft,
      id: saved.id,
      ownerId: session.userId,
      source: 'community',
    };
  }

  private async auth(path: string, init: RequestInit): Promise<any> {
    const config = await this.requireConfig();
    const url = `${config.url}${path}`;
    console.log('[Stepli Auth] request', {method: init.method || 'GET', path});
    const response = await fetch(url, {
      ...init,
      headers: {'Content-Type': 'application/json', apikey: config.anonKey, ...(init.headers || {})},
    });
    const data = await this.json(response);
    if (!response.ok) {
      console.error('[Stepli Auth] response failed', {
        path,
        status: response.status,
        body: data,
      });
      throw new Error(data?.msg || data?.error_description || data?.message || data?.error || 'Could not authenticate.');
    }
    console.log('[Stepli Auth] response ok', {path, status: response.status, hasAccessToken: Boolean(data?.access_token)});
    return data;
  }

  private async setSession(data: any): Promise<AuthSession> {
    const session = {accessToken: data.access_token, refreshToken: data.refresh_token, userId: data.user?.id, email: data.user?.email};
    if (!session.accessToken || !session.refreshToken || !session.userId) throw new Error('Could not start a signed-in session.');
    try {
      await StepliOverlay.setTutorialSession(session.accessToken, session.refreshToken, session.userId, session.email);
    } catch (error) {
      // Keep the in-memory session so sign-in still works if Keystore persistence fails.
      console.warn('[Stepli Auth] could not persist encrypted session', error);
    }
    this.setCurrentSession(session);
    return session;
  }

  private async refreshSession(refreshToken: string): Promise<AuthSession> {
    const data = await this.auth('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({refresh_token: refreshToken}),
    });
    return this.setSession(data);
  }

  private async request<T = unknown>(url: string, init: RequestInit = {}, retried = false): Promise<T> {
    const config = await this.requireConfig();
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        apikey: config.anonKey,
        ...(this.session ? {Authorization: `Bearer ${this.session.accessToken}`} : {}),
        ...(init.headers || {}),
      },
    });
    const data = await this.json(response);
    if (response.status === 401 && !retried && this.session?.refreshToken) {
      try {
        await this.refreshSession(this.session.refreshToken);
      } catch (error) {
        this.setCurrentSession(null);
        await StepliOverlay.clearTutorialSession();
        throw error;
      }
      return this.request<T>(url, init, true);
    }
    if (!response.ok) {
      throw new Error(data?.message || data?.hint || data?.error_description || data?.error || 'Could not reach the tutorial service.');
    }
    return data as T;
  }

  private async json(response: Response): Promise<any> {
    const body = await response.text();
    if (!body) return null;
    try { return JSON.parse(body); } catch { return {message: body}; }
  }

  private async requireConfig(): Promise<BackendConfig> {
    const config = await this.getConfig();
    if (!config) throw new Error('Tutorial sharing is not configured yet. Add the Supabase URL and publishable key, then rebuild the app.');
    return config;
  }

  private requireSession(): AuthSession {
    if (!this.session) throw new Error('Sign in before saving a tutorial.');
    return this.session;
  }

  private setCurrentSession(session: AuthSession | null) {
    this.session = session;
    this.sessionListeners.forEach(listener => listener(session));
  }

  private toGuide(row: SupabaseTutorialRow): TutorialGuide {
    const steps = [...(row.tutorial_steps || [])]
      .sort((a, b) => a.position - b.position)
      .map(step => ({
        id: step.id,
        text: step.instruction,
        spokenText: step.spoken_instruction || undefined,
        confirm: step.confirmation_text || 'I did this',
        matcher: step.matcher || undefined,
      }));
    return {
      id: row.id,
      ownerId: row.owner_id,
      appName: row.app_name,
      appPackage: row.app_package,
      title: row.title,
      description: row.description || '',
      language: row.language,
      visibility: row.visibility,
      steps,
      source: 'community',
    };
  }
}

export const tutorialRepository = new TutorialRepository();
