function Row({ items, hidden }: { items: string[]; hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden}>
      {items.map((item) => (
        <li
          key={item}
          className="flex items-center gap-10 pr-10 font-serif text-[1.35rem] whitespace-nowrap text-ink-2 italic"
        >
          {item}
          <span className="size-1.5 rotate-45 bg-gold" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

/** Bandeau défilant des domaines. Il se met en pause au survol et s'arrête si les animations sont réduites. */
export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  // La liste est répétée pour que la piste dépasse toujours la largeur de l'écran.
  const repeated = items.length < 8 ? [...items, ...items] : items;

  return (
    <div
      className="marquee overflow-hidden border-y border-line bg-surface py-5"
      role="group"
      aria-label="Domaines et technologies"
    >
      <div className="marquee-track">
        <Row items={repeated} />
        <Row items={repeated} hidden />
      </div>
    </div>
  );
}
