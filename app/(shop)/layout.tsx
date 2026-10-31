import { ContactStrip } from "@/components/ContactStrip";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { resolveCmsPreview } from "@/lib/cms/preview";
import {
  getFooterContent,
  getHeaderContent,
  getSiteContent,
} from "@/lib/cms/site-content";

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preview = await resolveCmsPreview();
  const site = getSiteContent({ preview });
  const header = getHeaderContent({ preview });
  const footer = getFooterContent({ preview });

  return (
    <>
      <ContactStrip site={site} header={header} />
      <Header
        logoSrc={site.logos.primary || undefined}
        showSearch={header?.showSearch !== false}
        showWishlist={header?.showWishlist !== false}
        showAccount={header?.showAccount !== false}
      />
      <main id="main">{children}</main>
      <Footer site={site} footer={footer} />
      <WhatsAppFab href={site.contact.whatsapp.href} />
    </>
  );
}
