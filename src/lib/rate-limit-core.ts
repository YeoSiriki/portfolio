type Window = { count: number; resetAt: Date };

type Decision = { allowed: true; count: number; resetAt: Date } | { allowed: false; resetAt: Date };

/** Logique pure de la limitation de débit, séparée de la base pour être testable. */
export function decideRateLimit(current: Window | null, now: Date, limit: number, windowMs: number): Decision {
  if (!current || current.resetAt.getTime() <= now.getTime()) {
    return { allowed: true, count: 1, resetAt: new Date(now.getTime() + windowMs) };
  }
  if (current.count >= limit) return { allowed: false, resetAt: current.resetAt };
  return { allowed: true, count: current.count + 1, resetAt: current.resetAt };
}
