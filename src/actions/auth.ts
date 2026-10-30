'use server';

import { AuthError } from 'next-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';
import { ADMIN_HINT_COOKIE } from '@/lib/constants';
import { clientIpHash, rateLimit, resetRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/schemas';

export type LoginState = { error?: string };

// Message volontairement générique : il ne dit pas si c'est l'e-mail ou le mot de passe qui est faux.
const INVALID = 'Identifiants incorrects.';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const key = `login:${await clientIpHash()}`;
  if (!(await rateLimit(key, MAX_ATTEMPTS, WINDOW_MS)).ok) {
    return { error: 'Trop de tentatives. Réessaie dans 15 minutes.' };
  }

  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: INVALID };

  try {
    await signIn('credentials', { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return { error: INVALID };
    throw error;
  }

  await resetRateLimit(key);
  redirect('/admin');
}

export async function loginWithGitHub(): Promise<void> {
  await signIn('github', { redirectTo: '/admin' });
}

export async function logout(): Promise<void> {
  // Le site public cesse aussitôt d'afficher le lien vers l'admin.
  (await cookies()).delete(ADMIN_HINT_COOKIE);
  await signOut({ redirectTo: '/admin/login' });
}
