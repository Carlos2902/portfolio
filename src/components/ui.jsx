// Small shared pieces used across sections.

export const SectionLabel = ({ num, children, className = "" }) => (
  <p data-anim="label" className={`eyebrow flex items-center gap-3 ${className}`}>
    <span className="font-serif text-base normal-case italic tracking-normal">{num}</span>
    <span className="h-px w-6 bg-current opacity-40" />
    {children}
  </p>
);

const Chevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={dir === "prev" ? "rotate-180" : ""}>
    <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowButton = ({ dir, onClick, disabled, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="flex h-12 w-[4.25rem] items-center justify-center rounded-full bg-[color:var(--chip)] transition-[background-color,color,opacity] duration-300 hover:bg-[color:var(--hover-bg)] hover:text-[color:var(--hover-fg)] disabled:pointer-events-none disabled:opacity-35"
  >
    <Chevron dir={dir} />
  </button>
);

export const Arrow = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
    <path d="M2.5 8.5 8.5 2.5M3.5 2.5h5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Link with an underline that draws in on hover. External links open in a new tab.
export const TextLink = ({ href, children, className = "", ...rest }) => {
  const external = /^https?:/.test(href) || href.endsWith(".pdf") || href.startsWith("/latinolink");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`group relative inline-flex items-center gap-1.5 ${className}`}
      {...rest}
    >
      <span className="relative">
        {children}
        <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-100 bg-current opacity-30 transition-[transform,opacity] duration-500 group-hover:opacity-100" />
      </span>
      {external && <Arrow />}
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  );
};
