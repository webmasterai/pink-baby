export type CartItem = {
  productId: string;
  quantity: number;
  /** JSON string of selected attribute options, or empty. */
  variantKey?: string;
};

export type WishlistItem = {
  productId: string;
};

export type NewsletterRecord = {
  email: string;
  createdAt: string;
  source: "website";
};

export type ContactRecord = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};
