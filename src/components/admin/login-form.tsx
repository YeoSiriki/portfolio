'use client';

import { useActionState } from 'react';
import { type LoginState, login, loginWithGitHub } from '@/actions/auth';
import { GitHubIcon } from '@/components/ui';

export function LoginForm({ github }: { github: boolean }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="w-full max-w-[400px]">
      <h2 className="text-3xl font-bold [font-stretch:112%] text-ink">Connexion</h2>

      <form action={formAction} className="mt-8 space-y-5">
        <div>
          <label htmlFor="connexion-email" className="field-label">
            E-mail
          </label>
          <input
            id="connexion-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="field min-h-13"
          />
        </div>
        <div>
          <label htmlFor="connexion-mot-de-passe" className="field-label">
            Mot de passe
          </label>
          <input
            id="connexion-mot-de-passe"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field min-h-13"
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-[10px] border border-danger/40 bg-danger-bg px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary min-h-13 w-full">
          {pending ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {github && (
        <>
          <div className="my-6 flex items-center gap-4 font-mono text-xs text-ink-3" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>
          <form action={loginWithGitHub}>
            <button type="submit" className="btn btn-secondary min-h-13 w-full">
              <GitHubIcon /> Continuer avec GitHub
            </button>
          </form>
        </>
      )}
    </div>
  );
}
