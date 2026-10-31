import { Reveal } from "@/components/ui/Reveal";

type Props = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: Props) {
  return (
    <Reveal className="mb-8 md:mb-10">
      <header className="space-y-2 text-center">
        <h1 className="pb-heading-reveal font-display text-3xl font-bold tracking-tight text-pb-charcoal md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="pb-heading-reveal pb-heading-reveal-sub mx-auto max-w-2xl text-sm text-pb-muted md:text-base">
            {description}
          </p>
        ) : null}
      </header>
    </Reveal>
  );
}
