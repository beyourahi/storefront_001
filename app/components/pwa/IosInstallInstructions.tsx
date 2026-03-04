import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetBody,
    SheetFooter
} from "~/components/ui/sheet";
import {Button} from "~/components/ui/button";
import {PwaAppIcon} from "./PwaAppIcon";
import {SafariShareIcon} from "~/components/icons/SafariShareIcon";
import {Plus} from "lucide-react";

interface IosInstallInstructionsProps {
    open: boolean;
    onDismiss: () => void;
    appName: string | null;
    appIcon: string | null;
}

export const IosInstallInstructions = ({open, onDismiss, appName, appIcon}: IosInstallInstructionsProps) => {
    return (
        <Sheet open={open} onOpenChange={isOpen => !isOpen && onDismiss()}>
            <SheetContent side="bottom" hideCloseButton>
                <SheetHeader className="items-center text-center">
                    <SheetTitle className="sr-only">Add to Home Screen</SheetTitle>
                    <SheetDescription className="sr-only">
                        How to install {appName || "this app"} on your device
                    </SheetDescription>
                </SheetHeader>

                <SheetBody className="pt-2">
                    <div className="flex flex-col items-center gap-3">
                        <PwaAppIcon src={appIcon} alt={appName} size="lg" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-foreground">Add to Home Screen</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Install {appName || "this app"} for quick access
                            </p>
                        </div>
                    </div>

                    <ol className="space-y-4 mt-6">
                        <li className="flex items-start gap-3">
                            <span className="shrink-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                1
                            </span>
                            <div className="flex items-center gap-2 pt-0.5">
                                <span className="text-sm text-foreground">Tap the</span>
                                <span className="inline-flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                                    <SafariShareIcon className="size-5" />
                                </span>
                                <span className="text-sm text-foreground">Share button</span>
                            </div>
                        </li>

                        <li className="flex items-start gap-3">
                            <span className="shrink-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                2
                            </span>
                            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                <span className="text-sm text-foreground">Scroll down and tap</span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-foreground text-sm font-medium">
                                    <Plus className="size-4" />
                                    Add to Home Screen
                                </span>
                            </div>
                        </li>
                    </ol>

                    <p className="text-sm text-muted-foreground text-center mt-6">
                        The app will appear on your home screen for quick access
                    </p>
                </SheetBody>

                <SheetFooter>
                    <div className="flex flex-col w-full">
                        <Button onClick={onDismiss} className="w-full">
                            Got it
                        </Button>
                        <Button variant="ghost" onClick={onDismiss} className="w-full">
                            Not now
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
