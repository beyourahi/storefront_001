/**
 * Regex-based form validation helpers.
 * `isValid*` predicates return a boolean; `validate*` functions return an error
 * string or null (suitable for inline form field error display).
 */

/** Returns true if `email` matches the basic `local@domain.tld` pattern. */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/** Returns true if `phone` contains at least 10 digits (after stripping whitespace). */
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
};

/** Returns true if `url` can be parsed by the `URL` constructor. */
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/** Returns true if `handle` is a valid Shopify handle (lowercase alphanumeric + hyphens). */
export const isValidHandle = (handle: string): boolean => {
    const handleRegex = /^[a-z0-9-]+$/;
    return handleRegex.test(handle);
};

export const validateRequired = (value: string | null | undefined, fieldName: string): string | null => {
    if (!value || value.trim() === "") {
        return `${fieldName} is required`;
    }
    return null;
};

export const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === "") {
        return "Email is required";
    }

    if (!isValidEmail(email)) {
        return "Please enter a valid email address";
    }

    return null;
};

export const validatePhone = (phone: string): string | null => {
    if (!phone || phone.trim() === "") {
        return "Phone number is required";
    }

    if (!isValidPhone(phone)) {
        return "Please enter a valid phone number";
    }

    return null;
};

export const validateQuantity = (quantity: number, max?: number): string | null => {
    if (quantity < 1) {
        return "Quantity must be at least 1";
    }

    if (max !== undefined && quantity > max) {
        return `Quantity cannot exceed ${max}`;
    }

    return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
    if (value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters long`;
    }
    return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
    if (value.length > maxLength) {
        return `${fieldName} cannot exceed ${maxLength} characters`;
    }
    return null;
};
