import {Link} from "react-router";
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
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">{message}</h2>
        <p className="text-muted-foreground max-w-md">{description}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
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
);
