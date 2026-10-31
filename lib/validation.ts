import { z } from "zod";

const MAX_BODY = 8_000;

export function sanitizeText(input: string, max = 500): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Please enter your email address.")
    .max(254, "Email is too long.")
    .email("Please enter a valid email address.")
    .transform((v) => v.toLowerCase()),
});

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Name is too long.")
    .transform((v) => sanitizeText(v, 100)),
  email: z
    .string()
    .trim()
    .min(3, "Please enter your email address.")
    .max(254, "Email is too long.")
    .email("Please enter a valid email address.")
    .transform((v) => v.toLowerCase()),
  message: z
    .string()
    .trim()
    .min(10, "Please enter a message (at least 10 characters).")
    .max(2000, "Message is too long.")
    .transform((v) => sanitizeText(v, 2000)),
});

export function assertBodySize(raw: string, max = MAX_BODY): void {
  if (raw.length > max) {
    throw new Error("Request body too large.");
  }
}

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100)
    .transform((v) => sanitizeText(v, 100)),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? sanitizeText(v, 30) : "")),
  password: z.string().min(10).max(128),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});

/** CMS admin login — username may be an email or a plain username. */
export const adminLoginSchema = z
  .object({
    username: z.string().trim().min(1).max(254).optional(),
    email: z.string().trim().min(1).max(254).optional(),
    password: z.string().min(1).max(128),
  })
  .superRefine((data, ctx) => {
    if (!(data.username ?? data.email)?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Username is required.",
        path: ["username"],
      });
    }
  })
  .transform((data) => ({
    username: (data.username ?? data.email)!.trim(),
    password: data.password,
  }));

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(10).max(128),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  fullName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .transform((v) => sanitizeText(v, 100)),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .transform((v) => sanitizeText(v, 30)),
  line1: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .transform((v) => sanitizeText(v, 200)),
  line2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? sanitizeText(v, 200) : "")),
  city: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((v) => sanitizeText(v, 80)),
  province: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((v) => sanitizeText(v, 80)),
  postalCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? sanitizeText(v, 20) : "")),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .transform((v) => sanitizeText(v, 100)),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .transform((v) => sanitizeText(v, 30)),
  line1: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .transform((v) => sanitizeText(v, 200)),
  line2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? sanitizeText(v, 200) : "")),
  city: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((v) => sanitizeText(v, 80)),
  province: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((v) => sanitizeText(v, 80)),
  postalCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? sanitizeText(v, 20) : "")),
  paymentMethod: z.enum(["order_request", "cod", "bank_transfer", "card_test"]),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? sanitizeText(v, 500) : "")),
  idempotencyKey: z.string().min(8).max(80),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(99),
        variantKey: z.string().max(200).optional(),
        claimedUnitPrice: z.number().optional().nullable(),
      }),
    )
    .min(1)
    .max(50),
});

export const reviewSchema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  body: z
    .string()
    .trim()
    .min(10)
    .max(2000)
    .transform((v) => sanitizeText(v, 2000)),
  authorName: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((v) => sanitizeText(v, 80)),
});

export const pakistanProvinces = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;
