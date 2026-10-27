import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';

/**
 * Auto sign-in shortcut: used for local dev, and for a client-preview deploy that
 * should skip the landing/login pages. Active only when `public/dev-login.json`
 * exists — gitignored locally (see .gitignore), and on a client-preview deploy it
 * is generated at build time by scripts/write-dev-login.js from DEMO_LOGIN_EMAIL /
 * DEMO_LOGIN_PASSWORD env vars (see render.yaml). Absent that file, this guard is
 * a no-op and the normal landing/login flow runs. The backend authentication is
 * untouched either way: the session is a real login against POST /token.
 */
async function devSignIn(api: ApiService): Promise<boolean> {
  try {
    if (api.getCurrentUser() || (await firstValueFrom(api.checkAuth()))) {
      return true;
    }
    const res = await fetch('/dev-login.json', { cache: 'no-store' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) {
      return false;
    }
    const creds = (await res.json()) as { email?: string; password?: string };
    if (!creds.email || !creds.password) {
      return false;
    }
    await firstValueFrom(api.login(creds.email, creds.password));
    return !!(await firstValueFrom(api.checkAuth()));
  } catch {
    return false;
  }
}

/** On `/` and `/login`: if dev-login.json exists, auto sign in and go straight to the dashboard. */
export const devSkipLoginGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const signedIn = await devSignIn(inject(ApiService));
  return signedIn ? router.createUrlTree(['/dashboard']) : true;
};
