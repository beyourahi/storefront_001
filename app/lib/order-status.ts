export type OrderStatusVariant = "default" | "secondary" | "destructive" | "outline";

export const getOrderStatusVariant = (status: string | null | undefined): OrderStatusVariant => {
    if (!status) return "secondary";

    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
        case "FULFILLED":
        case "DELIVERED":
        case "SUCCESS":
        case "PAID":
            return "default";

        case "UNFULFILLED":
        case "IN_PROGRESS":
        case "PENDING":
        case "AUTHORIZED":
            return "secondary";

        case "ON_HOLD":
        case "PARTIALLY_FULFILLED":
            return "outline";

        case "CANCELLED":
        case "VOIDED":
        case "REFUNDED":
        case "PARTIALLY_REFUNDED":
        case "FAILURE":
            return "destructive";

        default:
            return "secondary";
    }
};

export const formatOrderStatus = (status: string | null | undefined): string => {
    if (!status) return "Processing";

    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
        case "FULFILLED":
        case "DELIVERED":
            return "Delivered";
        case "UNFULFILLED":
            return "Processing";
        case "PARTIALLY_FULFILLED":
            return "Partial";
        case "IN_PROGRESS":
            return "In Progress";
        case "ON_HOLD":
            return "On Hold";
        case "PENDING":
            return "Pending";
        case "SUCCESS":
            return "Success";
        case "CANCELLED":
            return "Cancelled";
        case "VOIDED":
            return "Voided";
        case "REFUNDED":
            return "Refunded";
        case "PARTIALLY_REFUNDED":
            return "Partial Refund";
        case "FAILURE":
            return "Failed";
        case "PAID":
            return "Paid";
        case "AUTHORIZED":
            return "Authorized";
        default:
            return status
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, l => l.toUpperCase());
    }
};
