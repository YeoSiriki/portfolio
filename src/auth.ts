import 'server-only';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { clientIpHash, rateLimit, resetRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/schemas';

export const githubLoginEnabled = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && process.env.ADMIN_GITHUB_LOGIN,
);

// Empreinte factice : la comparaison a toujours lieu, même si le compte n'existe pas,
// pour ne pas révéler son existence par le temps de réponse.
let dummyHash: string | undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // Session courte et glissante : expire après 2 h d'inactivité.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 2, updateAge: 60 * 5 },
  pages: { signIn: '/admin/login', error: '/admin/login' },
  logger: {
    // Un mot de passe erroné n'est pas une panne : inutile de remplir les journaux d'erreurs.
    error(error) {
      if (error.name !== 'CredentialsSignin') console.error('[auth]', error);
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        // Le blocage est appliqué ici et non dans le seul formulaire : /api/auth/callback/credentials
        // appelle authorize() directement. Il est vérifié avant bcrypt, coûteux en calcul.
        const key = `login:${await clientIpHash(request.headers)}`;
        if (!(await rateLimit(key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)).ok) return null;

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        dummyHash ??= await bcrypt.hash(randomUUID(), 12);
        const matches = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? dummyHash);
        if (!user?.passwordHash || !matches || user.role !== 'ADMIN') return null;

        await resetRateLimit(key);
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
    ...(githubLoginEnabled ? [GitHub] : []),
  ],
  callbacks: {
    // GitHub : seul le compte du propriétaire est accepté.
    async signIn({ account, profile }) {
      if (account?.provider !== 'github') return true;
      const githubId = profile?.id ? String(profile.id) : '';
      if (!githubId) return false;
      const linked = await prisma.user.findUnique({ where: { githubId } });
      if (linked) return linked.role === 'ADMIN';

      const allowedLogin = (process.env.ADMIN_GITHUB_LOGIN ?? '').toLowerCase();
      const login = typeof profile?.login === 'string' ? profile.login.toLowerCase() : '';
      if (!allowedLogin || login !== allowedLogin) return false;

      // Première connexion GitHub du propriétaire : rattachement au compte administrateur.
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN', githubId: null },
        orderBy: { createdAt: 'asc' },
      });
      if (!admin) return false;
      await prisma.user.update({ where: { id: admin.id }, data: { githubId } });
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'github' && profile?.id) {
        const admin = await prisma.user.findUnique({ where: { githubId: String(profile.id) } });
        if (admin) {
          token.uid = admin.id;
          token.role = admin.role;
          token.email = admin.email;
        }
      } else if (user) {
        token.uid = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = typeof token.uid === 'string' ? token.uid : '';
      session.user.role = token.role === 'ADMIN' ? 'ADMIN' : undefined;
      return session;
    },
  },
});
