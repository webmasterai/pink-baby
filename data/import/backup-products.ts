export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  image: string;
  imageAlt: string;
  shortDescription: string;
  description: string;
  featured: boolean;
  available: boolean;
};

export const products: Product[] = [
  {
    id: "pb-wide-neck-bottle-handles",
    slug: "wide-neck-feeding-bottle-with-handles",
    name: "Wide Neck Feeding Bottle with Handles",
    categorySlug: "feeding-bottles",
    image: "/images/feeding.png",
    imageAlt: "Wide neck feeding bottle with handles",
    shortDescription: "Easy-grip wide-neck bottle for comfortable feeding.",
    description:
      "A wide-neck feeding bottle with handles designed for everyday use. Product specifications beyond the name shown in the approved design are pending catalogue confirmation.",
    featured: true,
    available: true,
  },
  {
    id: "pb-manual-breast-pump",
    slug: "manual-breast-pump",
    name: "Manual Breast Pump",
    categorySlug: "breast-care",
    image: "/images/breast.png",
    imageAlt: "Manual breast pump",
    shortDescription: "Manual pump for flexible breast-care routines.",
    description:
      "A manual breast pump from the Pink Baby breast-care range. Detailed clinical claims and certifications are not listed here; only verified catalogue naming is shown.",
    featured: true,
    available: true,
  },
  {
    id: "pb-silicone-pacifier-set",
    slug: "silicone-pacifier-set-2-pack",
    name: "Silicone Pacifier Set (2 Pack)",
    categorySlug: "pacifiers",
    image: "/images/pacifiers.png",
    imageAlt: "Silicone pacifier set, two pack",
    shortDescription: "Soft silicone pacifiers in a two-pack set.",
    description:
      "A two-pack silicone pacifier set. Age ranges and materials beyond the product name require catalogue verification before publication of further claims.",
    featured: true,
    available: true,
  },
  {
    id: "pb-soft-silicone-teat",
    slug: "soft-silicone-teat-2-pack",
    name: "Soft Silicone Teat (2 Pack)",
    categorySlug: "teats",
    image: "/images/teats.png",
    imageAlt: "Soft silicone teat, two pack",
    shortDescription: "Soft silicone replacement teats, two per pack.",
    description:
      "Soft silicone teats sold as a two-pack. Flow rates and bottle compatibility details are pending verified catalogue data.",
    featured: true,
    available: true,
  },
];

export function getAllProducts(): Product[] {
  return products;
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter((p) => {
    const haystack = [
      p.name,
      p.shortDescription,
      p.description,
      p.categorySlug,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
