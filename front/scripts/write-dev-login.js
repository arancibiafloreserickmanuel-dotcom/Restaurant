#!/usr/bin/env node
// Build-time step for a client-preview deploy (see render.yaml).
// If DEMO_LOGIN_EMAIL and DEMO_LOGIN_PASSWORD are set, writes public/dev-login.json
// so the app auto-signs in and skips the landing/login pages (see
// src/app/auth/dev-auto-login.ts). Without both vars set, this is a no-op and the
// app shows the normal login flow — safe to run on every build.
const fs = require('fs');
const path = require('path');

const email = process.env.DEMO_LOGIN_EMAIL;
const password = process.env.DEMO_LOGIN_PASSWORD;

if (!email || !password) {
  console.log('[write-dev-login] DEMO_LOGIN_EMAIL/DEMO_LOGIN_PASSWORD not set — skipping (normal login flow).');
  process.exit(0);
}

const outPath = path.join(__dirname, '..', 'public', 'dev-login.json');
fs.writeFileSync(outPath, JSON.stringify({ email, password }), 'utf8');
console.log(`[write-dev-login] Wrote ${outPath} for auto sign-in (email: ${email}).`);
