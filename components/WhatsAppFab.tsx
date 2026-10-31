"use client";

import { siteConfig } from "@/content/site";

export function WhatsAppFab({ href }: { href?: string }) {
  return (
    <a
      href={href || siteConfig.contact.whatsapp.href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-pb-logo-green text-white shadow-lg transition hover:scale-105 hover:bg-pb-logo-green-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-logo-green md:bottom-6 md:right-6"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true" fill="currentColor">
        <path d="M12.04 2c-5.5 0-9.96 4.45-9.96 9.94 0 1.75.46 3.45 1.34 4.95L2 22l5.28-1.38a9.94 9.94 0 0 0 4.76 1.21h.01c5.5 0 9.96-4.45 9.96-9.94C22.01 6.45 17.55 2 12.04 2zm5.79 14.13c-.24.68-1.4 1.24-1.93 1.32-.49.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.61-2.89-1.25-4.77-4.16-4.92-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.17 0 .4-.02.62.47.24.54.81 1.98.88 2.12.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.17.28.75 1.23 1.61 2 .1.99 1.99 1.83 2.3 1.97.31.14.49.12.67-.07.18-.19.77-.9.98-1.21.21-.31.42-.26.71-.16.29.1 1.84.87 2.15 1.03.31.16.52.24.6.37.07.13.07.76-.17 1.44z" />
      </svg>
    </a>
  );
}
