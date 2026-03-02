export type UrlWithTrackingParams = {
    baseUrl: string;
    trackingParams?: string | null;
    params?: Record<string, string>;
    term: string;
};

export function urlWithTrackingParams({baseUrl, trackingParams, params: extraParams, term}: UrlWithTrackingParams) {
    let search = new URLSearchParams({
        ...(extraParams ?? {}),
        q: encodeURIComponent(term)
    }).toString();

    if (trackingParams) {
        search = `${search}&${trackingParams}`;
    }

    return `${baseUrl}?${search}`;
}
