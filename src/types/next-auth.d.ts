import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: 'ADMIN';
    sessionVersion?: number;
  }

  interface Session {
    user: { id: string; role?: 'ADMIN'; sessionVersion?: number } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    role?: 'ADMIN';
    // Version des sessions du compte au moment de la connexion (voir User.sessionVersion).
    sv?: number;
  }
}
