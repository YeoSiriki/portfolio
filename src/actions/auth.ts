'use server';

import { AuthError } from 'next-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';
import { ADMIN_HINT_COOKIE, LOGIN_MAX_ATTEMPTS } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/guard';
import { clientIpHash, isRateLimited } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/schemas';

export type LoginState = { error?: string };

// Message volontairement générique : il ne dit pas si c'est l'e-mail ou le mot de passe qui est faux.
const INVALID = 'Identifiants incorrects.';

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  // Les essais sont comptés dans authorize() (src/auth.ts) ; ici, on affiche seulement le blocage.
  if (await isRateLimited(`login:${await clientIpHash()}`, LOGIN_MAX_ATTEMPTS)) {
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

  redirect('/admin');
}

export async function loginWithGitHub(): Promise<void> {
  await signIn('github', { redirectTo: '/admin' });
}

export async function logout(): Promise<void> {
  // Toutes les sessions ouvertes, sur ce navigateur comme ailleurs, cessent d'être acceptées.
  const admin = await getAdmin();
  if (admin) await prisma.user.update({ where: { id: admin.id }, data: { sessionVersion: { increment: 1 } } });
  // Le site public cesse aussitôt d'afficher le lien vers l'admin.
  (await cookies()).delete(ADMIN_HINT_COOKIE);
  await signOut({ redirectTo: '/admin/login' });
}
