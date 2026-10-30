import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { prisma } from './db';
import { decideRateLimit } from './rate-limit-core';

/** Empreinte de l'adresse IP : on ne stocke jamais l'adresse en clair. */
export async function clientIpHash(): Promise<string> {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'inconnue';
  return createHash('sha256')
    .update(`${ip}:${process.env.AUTH_SECRET ?? ''}`)
    .digest('hex')
    .slice(0, 32);
}

/** Compte une tentative et indique si elle est autorisée (fenêtre fixe, stockée en base). */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean }> {
  const now = new Date();
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  const decision = decideRateLimit(row, now, limit, windowMs);
  if (decision.allowed) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: decision.count, resetAt: decision.resetAt },
      update: { count: decision.count, resetAt: decision.resetAt },
    });
  }
  return { ok: decision.allowed };
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}
