import { inject, isDevMode } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';

/**
 * Local development shortcut (Angular dev mode only; compiled out of production builds).
 * Signs in with the credentials in `public/dev-login.json` (gitignored) so the
 * landing and login pages are skipped. The backend authentication is untouched:
 * the session is a real login against POST /token.
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

/** On `/` and `/login`: in dev mode, auto sign in and go straight to the dashboard. */
export const devSkipLoginGuard: CanActivateFn = async () => {
  if (!isDevMode()) {
    return true;
  }
  const router = inject(Router);
  const signedIn = await devSignIn(inject(ApiService));
  return signedIn ? router.createUrlTree(['/dashboard']) : true;
};
