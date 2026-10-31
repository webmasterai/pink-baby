export type Category = {
  slug: string;
  name: string;
  href: string;
  image: string;
  imageAlt: string;
  description: string;
};

export const categories: Category[] = [
  {
    slug: "feeding-bottles",
    name: "Feeding Bottles",
    href: "/category/feeding-bottles",
    image: "/images/feeding.png",
    imageAlt: "Pink Baby wide-neck feeding bottle filled with milk",
    description: "Everyday bottles designed for comfortable feeding moments.",
  },
  {
    slug: "breast-care",
    name: "Breast Care",
    href: "/category/breast-care",
    image: "/images/breast.png",
    imageAlt: "Pink Baby manual breast pump",
    description: "Practical breast-care essentials for nursing parents.",
  },
  {
    slug: "pacifiers",
    name: "Pacifiers",
    href: "/category/pacifiers",
    image: "/images/pacifiers.png",
    imageAlt: "Soft silicone pacifiers in pastel colours",
    description: "Soft pacifiers for soothing little ones.",
  },
  {
    slug: "teats",
    name: "Teats",
    href: "/category/teats",
    image: "/images/teats.png",
    imageAlt: "Clear soft silicone bottle teats",
    description: "Replacement teats for compatible feeding bottles.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    href: "/category/accessories",
    image: "/images/accessories.png",
    imageAlt: "Bottle brush and feeding accessories",
    description: "Helpful extras for cleaning and everyday care.",
  },
];

export const navLinks = [
  ...categories.map((c) => ({ name: c.name, href: c.href })),
  { name: "Sale", href: "/sale" },
] as const;

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
