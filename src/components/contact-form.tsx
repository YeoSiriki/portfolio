'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { sendContactMessage } from '@/actions/contact';
import { CONTACT_TOPICS } from '@/lib/constants';
import { type ContactInput, contactSchema } from '@/lib/schemas';
import { messageRetentionMonths } from '@/lib/site';

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', topic: CONTACT_TOPICS[0], body: '', website: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await sendContactMessage(values);
      if (result.ok) {
        reset();
        setSent(true);
        return;
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof ContactInput, { message });
      }
      setServerError(result.error);
    } catch {
      setServerError("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    }
  });

  if (sent) {
    return (
      <div role="status" className="rise flex min-h-72 flex-col items-start justify-center gap-4">
        {/* Le cercle puis la coche se tracent (classe draw-check de globals.css). */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="draw-check text-accent"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" pathLength={1} />
          <path d="m8 12.5 2.8 2.8L16 9.5" pathLength={1} />
        </svg>
        <p className="text-2xl font-bold [font-stretch:112%] text-ink">Message envoyé</p>
        <p className="max-w-md leading-relaxed text-ink-2">Merci. Je vous répondrai par e-mail.</p>
        <button type="button" className="btn btn-secondary" onClick={() => setSent(false)}>
          Écrire un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-nom" className="field-label">
            Nom
          </label>
          <input
            id="contact-nom"
            type="text"
            autoComplete="name"
            className="field"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-nom-erreur' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id="contact-nom-erreur" className="mt-1.5 text-sm text-danger">
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="field-label">
            E-mail
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            className="field"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-erreur' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="contact-email-erreur" className="mt-1.5 text-sm text-danger">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-objet" className="field-label">
          Objet
        </label>
        <select id="contact-objet" className="field" {...register('topic')}>
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="field-label">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={6}
          className="field resize-y"
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? 'contact-message-erreur' : undefined}
          {...register('body')}
        />
        {errors.body && (
          <p id="contact-message-erreur" className="mt-1.5 text-sm text-danger">
            {errors.body.message}
          </p>
        )}
      </div>

      {/* Champ piège anti-robots : hors écran, hors tabulation, ignoré des lecteurs d'écran. */}
      <div className="absolute -left-[9999px] size-px overflow-hidden" aria-hidden>
        <label htmlFor="contact-site">Site web (ne pas remplir)</label>
        <input id="contact-site" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      {serverError && (
        <p role="alert" className="rounded-[10px] border border-danger/40 bg-danger-bg px-4 py-3 text-sm text-danger">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
      </button>

      <p className="text-[0.8125rem] leading-relaxed text-ink-3">
        Vos nom, e-mail et message servent uniquement à vous répondre et sont conservés {messageRetentionMonths} mois au
        plus, conformément à la loi ivoirienne n° 2013-450.{' '}
        <Link href="/confidentialite" className="link text-ink-2">
          Politique de confidentialité
        </Link>
      </p>
    </form>
  );
}
