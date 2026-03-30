import {CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon} from "lucide-react";
import {Toaster as Sonner, type ToasterProps} from "sonner";

const Toaster = ({...props}: ToasterProps) => {
    return (
        <Sonner
            theme="system"
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />
            }}
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:rounded-full group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:rounded-full group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm"
                }
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                    "--z-index": "10001"
                } as React.CSSProperties
            }
            {...props}
        />
    );
};

export {Toaster};
