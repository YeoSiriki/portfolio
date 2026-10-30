import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Contrôle rapide avant le rendu : redirige les visiteurs non connectés hors de /admin.
// Ce n'est qu'une première barrière : chaque page, action et route revérifie les droits côté serveur.
export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/admin/login';
  const isAdmin = request.auth?.user?.role === 'ADMIN';

  // Pas de renvoi de /admin/login vers /admin ici : le cookie d'une session fermée (déconnexion,
  // nouveau mot de passe) dit encore « ADMIN », et seule la base peut le démentir. Le renvoyer vers
  // /admin, qui le renvoie vers la connexion, ferait une boucle.
  if (!isAdmin && !isLogin) return NextResponse.redirect(new URL('/admin/login', request.nextUrl));
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
