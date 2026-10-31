import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/content/categories";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={category.href}
      className="pb-card-lift group flex flex-col overflow-hidden rounded-2xl focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-pb-ivory">
        <Image
          src={category.image}
          alt={category.imageAlt}
          fill
          sizes="(max-width:768px) 45vw, 18vw"
          className="pb-img-zoom object-cover"
        />
      </div>
      <span className="mt-3 min-h-[1.6rem] text-center text-[0.95rem] font-bold text-pb-charcoal md:text-base">
        {category.name}
      </span>
    </Link>
  );
}
