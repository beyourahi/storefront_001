/**
 * Zod-based validation schemas and helpers for common storefront inputs.
 * Prefer these over the regex-only validators in `validation.ts` when you
 * need structured error objects (e.g. form field mapping).
 */

import {z} from "zod";

/** Creates a non-empty string schema with a field-name-aware required message. */
export const createStringSchema = (fieldName: string) => z.string().min(1, `${fieldName} is required`);

export const emailSchema = z.string().min(1, "Email is required").email("Please enter a valid email address");

export const phoneSchema = z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[(]?[\d\s-()]{10,}$/, "Please enter a valid phone number");

/** Accepts a valid URL or an empty string (optional URL fields). */
export const urlSchema = z.string().url("Please enter a valid URL").or(z.literal(""));

/** Shopify handle format: lowercase alphanumeric and hyphens only. */
export const handleSchema = z
    .string()
    .regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens");

export const quantitySchema = z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999");

/** Creates a minimum-length string schema with a field-name-aware error message. */
export const createMinLengthSchema = (minLength: number, fieldName: string) =>
    z.string().min(minLength, `${fieldName} must be at least ${minLength} characters long`);

/** Creates a maximum-length string schema with a field-name-aware error message. */
export const createMaxLengthSchema = (maxLength: number, fieldName: string) =>
    z.string().max(maxLength, `${fieldName} cannot exceed ${maxLength} characters`);

export const productValidationSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    variantId: z.string().min(1, "Variant ID is required"),
    quantity: quantitySchema
});

export const cartLineSchema = z.object({
    id: z.string(),
    quantity: quantitySchema
});

export const cartValidationSchema = z.object({
    cartId: z.string().min(1, "Cart ID is required"),
    lines: z.array(cartLineSchema).min(1, "At least one cart line is required")
});

/**
 * Thrown by `validateSchema` when Zod parsing fails.
 * `formattedErrors` maps dot-notation field paths to their first error message,
 * suitable for passing directly to form field error props.
 */
export class ValidationError extends Error {
    constructor(public issues: z.ZodIssue[]) {
        super("Validation failed");
        this.name = "ValidationError";
    }

    get formattedErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        for (const issue of this.issues) {
            const path = issue.path.join(".");
            errors[path] = issue.message;
        }
        return errors;
    }

    get firstError(): string | null {
        return this.issues[0]?.message ?? null;
    }
}

/**
 * Parse `data` against `schema` and return the typed result.
 * Throws `ValidationError` on failure; use `safeValidate` for non-throwing validation.
 */
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new ValidationError(result.error.issues);
    }
    return result.data;
};

export const validateEmail = (email: string): boolean => {
    return emailSchema.safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
    return phoneSchema.safeParse(phone).success;
};

export const validateUrl = (url: string): boolean => {
    return urlSchema.safeParse(url).success;
};

export const validateHandle = (handle: string): boolean => {
    return handleSchema.safeParse(handle).success;
};

/** Returns true if `quantity` satisfies the base schema and an optional `max` cap. */
export const validateQuantity = (quantity: number, max?: number): boolean => {
    const schema = max ? quantitySchema.max(max) : quantitySchema;
    return schema.safeParse(quantity).success;
};

/**
 * Non-throwing validation. Returns `{success: true, data}` on success or
 * `{success: false, errors}` with field-path-keyed error messages on failure.
 */
export const safeValidate = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
} => {
    const result = schema.safeParse(data);
    if (result.success) {
        return {success: true, data: result.data};
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        errors[path] = issue.message;
    }

    return {success: false, errors};
};
