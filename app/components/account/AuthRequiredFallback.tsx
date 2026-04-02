import {Link} from "react-router";
import {LogIn} from "lucide-react";
import {Button} from "~/components/ui/button";

interface AuthRequiredFallbackProps {
    message?: string;
    description?: string;
    secondaryCTA?: {
        label: string;
        to: string;
    };
}

export const AuthRequiredFallback = ({
    message = "Sign in to your account",
    description = "Access your orders, manage addresses, and update your account details.",
    secondaryCTA
}: AuthRequiredFallbackProps) => (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center sm:py-20">
        <div className="rounded-2xl bg-gradient-to-br from-muted/40 via-card to-muted/20 px-8 py-12 sm:px-16 sm:py-16">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <LogIn className="size-7 text-primary animate-[float_3s_ease-in-out_infinite]" />
            </div>
            <h2 className="font-serif text-xl font-medium text-foreground sm:text-2xl md:text-3xl">{message}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                    <Link to="/account/login">Sign In</Link>
                </Button>
                {secondaryCTA && (
                    <Button asChild size="lg" variant="outline">
                        <Link to={secondaryCTA.to}>{secondaryCTA.label}</Link>
                    </Button>
                )}
            </div>
        </div>
    </div>
);
