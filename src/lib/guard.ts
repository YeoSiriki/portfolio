import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from './db';

export type Admin = { id: string; email: string };

/** Vérifie la session ET l'existence du compte administrateur en base. */
export async function getAdmin(): Promise<Admin | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user && user.role === 'ADMIN' ? { id: user.id, email: user.email } : null;
}

/** Pour les pages : redirige vers la connexion si la personne n'est pas administratrice. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Accès refusé.');
  }
}

/** Pour les actions serveur et les routes d'API : lève une erreur au lieu de rediriger. */
export async function assertAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}
