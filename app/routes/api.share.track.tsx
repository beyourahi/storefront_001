import type {ActionFunctionArgs, LoaderFunctionArgs} from "react-router";
import {data} from "react-router";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 30});

export const loader = async ({request: _request}: LoaderFunctionArgs) => {
    return data({error: "Method not allowed"}, {status: 405});
};

export const action = async ({request}: ActionFunctionArgs) => {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;
    if (request.method !== "POST") {
        return data({error: "Method not allowed"}, {status: 405});
    }

    try {
        const body = (await request.json()) as {
            platform?: string;
            itemCount?: number;
            shareUrl?: string;
        };
        const {platform, itemCount, shareUrl} = body;

        if (!platform || typeof platform !== "string") {
            return data({error: "Invalid request: platform is required"}, {status: 400});
        }

        if (typeof itemCount !== "number" || itemCount < 0) {
            return data({error: "Invalid request: itemCount must be a positive number"}, {status: 400});
        }

        return data({success: true});
    } catch (error) {
        console.error("Error tracking share event:", error);
        return data({error: "Failed to track share event"}, {status: 500});
    }
};
