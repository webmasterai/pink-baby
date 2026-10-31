import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function base(props: IconProps) {
  const { title, ...rest } = props;
  return { title, rest };
}

export function IconSearch(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.8-3.2 4.2-4.5 7-4.5s5.2 1.3 7 4.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M12 20s-7-4.4-7-9.2A4.2 4.2 0 0 1 12 7.5a4.2 4.2 0 0 1 7 3.3C19 15.6 12 20 12 20z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBag(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M6 8h15l-1.5 9.5a2 2 0 0 1-2 1.7H9a2 2 0 0 1-2-1.5L5 4H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function IconGrid(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconList(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M8 7h12M8 12h12M8 17h12" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconEnvelope(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMapPin(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconPhone(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M7 3h3l1 5-2 1a12 12 0 0 0 6 6l1-2 5 1v3a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTruck(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function IconHand(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5.5a1.5 1.5 0 0 1 3 0V11M14 10V6.5a1.5 1.5 0 0 1 3 0V14c0 3.5-2.5 6-5.5 6H12c-3 0-5-2-5-5v-3.5a1.5 1.5 0 0 1 3 0V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFacebook(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
    </svg>
  );
}

export function IconInstagram(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconYoutube(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M22 12.2s0-3.2-.4-4.7a2.9 2.9 0 0 0-2-2C17.8 5 12 5 12 5s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2C2 9 2 12.2 2 12.2s0 3.2.4 4.7a2.9 2.9 0 0 0 2 2C6.2 19.4 12 19.4 12 19.4s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2c.4-1.5.4-4.7.4-4.7zM10 15.2V9.3l5.2 2.95L10 15.2z" />
    </svg>
  );
}

export function IconPinterest(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M12 2C6.5 2 2 6.5 2 12c0 4.1 2.5 7.6 6 9-.1-.8-.2-2 0-2.9.2-.8 1.4-5.9 1.4-5.9s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.4-.9 3.8-.3 1.1.5 2 1.6 2 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3 0-4.9 2.3-4.9 4.8 0 .9.3 1.5.7 2 .2.2.2.3.1.6l-.3 1c-.1.3-.2.4-.5.3-1.4-.6-2-2.2-2-4 0-3 2.5-6.6 7.5-6.6 4 0 6.7 2.9 6.7 6 0 4.1-2.3 7.1-5.6 7.1-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2.9-.8 1.9-1.3 2.6A10 10 0 0 0 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}
