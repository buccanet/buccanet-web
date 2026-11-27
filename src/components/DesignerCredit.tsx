const DESIGNER_URL = 'https://laboetie.io?utm_source=buccanet&utm_medium=referral&utm_campaign=footer_credit';

/** The studio that designed Buccanet, on the app's legal line: small and muted, underlined on hover. */
export const DesignerCredit = ({ className = '' }: { className?: string }) => (
  <a
    className={`text-xs text-chalk-2 hover:text-chalk hover:underline ${className}`}
    href={DESIGNER_URL} rel="noopener"
  >
    Designed by La Boétie
  </a>
);
