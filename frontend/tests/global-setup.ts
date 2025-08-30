import { request, FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  // Authenticate directly against backend to avoid proxy/env mismatch
  const backendBase = process.env.BACKEND_BASE || 'http://localhost:3009';
  const ctx = await request.newContext();

  const email = process.env.E2E_EMAIL || 'owner@example.com';
  const password = process.env.E2E_PASSWORD || 'ChangeMe123!';

  const resp = await ctx.post(`${backendBase}/api/v1/auth/login`, {
    data: { email, password },
    timeout: 5_000,
  });

  if (!resp.ok()) {
    throw new Error(`Login failed: ${resp.status()} ${await resp.text()}`);
  }

  await ctx.storageState({ path: 'storageState.json' });
  await ctx.dispose();
}


