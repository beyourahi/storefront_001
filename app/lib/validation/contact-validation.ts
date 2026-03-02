export const isContactInfoValid = (value: string | undefined | null): boolean => {
    if (value == null) {
        return false;
    }

    const trimmedValue = value.trim();
    if (trimmedValue === "") {
        return false;
    }

    return true;
};

export const isEmailValid = (email: string | undefined | null): boolean => {
    return isContactInfoValid(email);
};

export const isPhoneValid = (phone: string | undefined | null): boolean => {
    return isContactInfoValid(phone);
};

export const isAddressValid = (address: string | undefined | null): boolean => {
    return isContactInfoValid(address);
};

export const getAvailableContactMethodsCount = (
    email: string | undefined | null,
    phone: string | undefined | null
): number => {
    let count = 0;
    if (isEmailValid(email)) count++;
    if (isPhoneValid(phone)) count++;
    return count;
};

export const getTotalContactOptionsCount = (
    email: string | undefined | null,
    phone: string | undefined | null,
    address: string | undefined | null
): number => {
    let count = 0;
    if (isEmailValid(email)) count++;
    if (isPhoneValid(phone)) count++;
    if (isAddressValid(address)) count++;
    return count;
};

export const hasFAQContent = (faqs: unknown[] | undefined | null): boolean => {
    if (!Array.isArray(faqs)) return false;
    return faqs.length > 0;
};

export const hasTestimonialsContent = (testimonials: unknown[] | undefined | null): boolean => {
    if (!Array.isArray(testimonials)) return false;
    return testimonials.length > 0;
};

export const hasValidHappyCustomersCount = (happyCustomers: number | undefined | null): boolean => {
    if (typeof happyCustomers !== "number") return false;
    return happyCustomers > 0;
};

export const hasSocialMediaContent = (
    socialLinks: Record<string, string | undefined | null> | undefined | null
): boolean => {
    if (!socialLinks || typeof socialLinks !== "object") return false;

    return Object.values(socialLinks).some(link => isContactInfoValid(link));
};

export const getSocialMediaLinksCount = (
    socialLinks: Record<string, string | undefined | null> | undefined | null
): number => {
    if (!socialLinks || typeof socialLinks !== "object") return 0;

    return Object.values(socialLinks).filter(link => isContactInfoValid(link)).length;
};
