import {data} from "react-router";
import type {Route} from "./+types/api.newsletter";

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
` as const;

const generateSecurePassword = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 24; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

export const action = async ({request, context}: Route.ActionArgs) => {
    const formData = await request.formData();
    const email = formData.get("email");

    if (!email || typeof email !== "string") {
        return data({success: false, error: "Email is required"}, {status: 400});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return data({success: false, error: "Please enter a valid email address"}, {status: 400});
    }

    try {
        const response = await context.storefront.mutate(CUSTOMER_CREATE_MUTATION, {
            variables: {
                input: {
                    email,
                    password: generateSecurePassword(),
                    acceptsMarketing: true
                }
            }
        });

        const {customerCreate} = response;
        const errors = customerCreate?.customerUserErrors;

        if (errors && errors.length > 0) {
            const error = errors[0];

            if (error.code === "TAKEN" || error.code === "CUSTOMER_DISABLED") {
                return data({
                    success: true,
                    message: "You're already subscribed! Thank you for your interest."
                });
            }

            return data({success: false, error: error.message}, {status: 400});
        }

        return data({
            success: true,
            message: "Thank you for subscribing!"
        });
    } catch {
        return data({success: false, error: "Something went wrong. Please try again."}, {status: 500});
    }
};
