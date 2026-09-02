export type CreditLink = {
  label: string;
  href: string;
  ariaLabel: string;
  shortLabel?: string;
  mobile?: boolean;
};

export const CREDIT_LINKS: readonly CreditLink[] = [
  {
    label: "tinity",
    href: "https://github.com/jseramn/tinity",
    ariaLabel: "Tinity on GitHub",
    mobile: true,
  },
  {
    label: "@jseramn_",
    href: "https://x.com/jseramn_",
    ariaLabel: "@jseramn_ on X",
    mobile: true,
  },
  {
    label: "@tinityorch",
    href: "https://x.com/tinityorch",
    ariaLabel: "@tinityorch on X",
  },
  {
    label: "jseramn.tech",
    href: "https://jseramn.tech",
    ariaLabel: "jseramn.tech",
  },
  {
    label: "Deployed on Vercel",
    shortLabel: "Vercel",
    href: "https://vercel.com/?utm_source=tinity&utm_campaign=oss",
    ariaLabel: "Deployed on Vercel",
    mobile: true,
  },
  {
    label: "made with canvasui",
    href: "https://canvasui.dev",
    ariaLabel: "made with canvasui",
  },
];

function VercelGlyph() {
  return (
    <svg
      className="credits-vercel-glyph"
      viewBox="0 0 76 65"
      aria-hidden="true"
    >
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
    </svg>
  );
}

function CanvasuiMark() {
  return (
    <svg
      className="credits-canvasui-mark"
      viewBox="0 0 81 75"
      aria-hidden="true"
    >
      <g clipPath="url(#credits-canvasui-a)">
        <path d="M0 36.8065C7.30748 36.7896 13.2368 36.6511 15.0566 36.2868C20.9086 35.1153 25.4864 30.5384 26.6581 24.6864C27.1904 22.0279 27.237 11.1168 27.1316 7.1804e-05H0V36.8065Z" fill="currentColor" />
        <path d="M41.0144 36.3585C47.192 36.3585 51.8069 30.6364 52.9983 24.6864C53.5389 21.9865 53.5874 11.0942 53.4807 7.1804e-05H28.5482C28.4415 11.0936 28.4901 21.9851 29.0305 24.6853C30.2216 30.6358 34.735 36.3585 41.0144 36.3585Z" fill="currentColor" />
        <path d="M81.0113 7.1804e-05H54.8973C54.7919 11.1161 54.8386 22.0263 55.3707 24.6853C56.5422 30.5376 61.12 35.1152 66.9723 36.2868C68.7167 36.636 74.1886 36.7766 81.0113 36.8026V7.1804e-05Z" fill="currentColor" />
        <path d="M26.6581 50.2614C25.4867 44.409 20.9089 39.8309 15.0566 38.6593C13.2367 38.295 7.30732 38.1576 0 38.1408V74.7421H26.6581V50.2614Z" fill="currentColor" />
        <path d="M81.0113 38.1447C74.1887 38.1706 68.7168 38.3101 66.9723 38.6593C61.1199 39.8309 56.5422 44.409 55.3707 50.2614V74.7421H81.0113V38.1447Z" fill="currentColor" />
        <path d="M52.9983 50.2614C51.8073 44.3109 47.2132 39.8337 40.9272 39.8335C34.641 39.8335 30.2216 44.3108 29.0305 50.2614V74.7421H52.9983V50.2614Z" fill="currentColor" />
      </g>
      <g clipPath="url(#credits-canvasui-b)">
        <path d="M0 38.286C7.30748 38.3029 13.2368 38.4414 15.0566 38.8056C20.9086 39.9772 25.4864 44.5541 26.6581 50.4061C27.1904 53.0646 27.237 63.9757 27.1316 75.0924H0V38.286Z" fill="currentColor" />
        <path d="M41.0144 38.7339C47.192 38.734 51.8069 44.456 52.9983 50.4061C53.5389 53.1059 53.5874 63.9983 53.4807 75.0924H28.5482C28.4415 63.9989 28.4901 53.1074 29.0305 50.4072C30.2216 44.4567 34.735 38.7339 41.0144 38.7339Z" fill="currentColor" />
        <path d="M81.0113 75.0924H54.8973C54.7919 63.9764 54.8386 53.0661 55.3707 50.4072C56.5422 44.5548 61.12 39.9772 66.9723 38.8056C68.7167 38.4565 74.1886 38.3159 81.0113 38.2899V75.0924Z" fill="currentColor" />
        <path d="M26.6581 24.8311C25.4867 30.6835 20.9089 35.2616 15.0566 36.4332C13.2367 36.7975 7.30732 36.9348 0 36.9517V0.35038H26.6581V24.8311Z" fill="currentColor" />
        <path d="M81.0113 36.9478C74.1887 36.9218 68.7168 36.7823 66.9723 36.4332C61.1199 35.2616 56.5422 30.6835 55.3707 24.8311V0.35038H81.0113V36.9478Z" fill="currentColor" />
        <path d="M52.9983 24.8311C51.8073 30.7816 47.2132 35.2588 40.9272 35.2589C34.641 35.2589 30.2216 30.7816 29.0305 24.8311V0.35038H52.9983V24.8311Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="credits-canvasui-a">
          <rect width="81.0113" height="37.3711" fill="currentColor" />
        </clipPath>
        <clipPath id="credits-canvasui-b">
          <rect
            width="81.0113"
            height="37.3711"
            fill="currentColor"
            transform="matrix(1 0 0 -1 0 75.0924)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

function itemClassName(href: string): string {
  if (href.startsWith("https://vercel.com")) return "credits-item credits-vercel";
  if (href === "https://canvasui.dev") return "credits-item credits-badge credits-canvasui";
  return "credits-item";
}

function CreditBody({ link }: { link: CreditLink }) {
  if (link.href.startsWith("https://vercel.com")) {
    return (
      <>
        <span className="credits-label credits-chip">
          <VercelGlyph />
          Deployed on Vercel
        </span>
        <span className="credits-short credits-chip">
          <VercelGlyph />
          Vercel
        </span>
      </>
    );
  }
  if (link.href === "https://canvasui.dev") {
    return (
      <span className="credits-label credits-chip">
        <CanvasuiMark />
        made with canvasui
      </span>
    );
  }
  return (
    <>
      <span className="credits-label">{link.label}</span>
      {link.shortLabel ? (
        <span className="credits-short">{link.shortLabel}</span>
      ) : null}
    </>
  );
}

export function Credits() {
  return (
    <nav className="credits" aria-label="Project links">
      {CREDIT_LINKS.map((link) => (
        <a
          key={link.href}
          className={itemClassName(link.href)}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.ariaLabel}
          data-mobile={link.mobile ? "true" : undefined}
        >
          <CreditBody link={link} />
        </a>
      ))}
    </nav>
  );
}
