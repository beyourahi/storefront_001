import type {AddressFragment} from "customer-accountapi.generated";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Pencil, Trash2} from "lucide-react";

type AddressCardProps = {
    address: AddressFragment;
    isDefault: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

export const AddressCard = ({address, isDefault, onEdit, onDelete}: AddressCardProps) => (
    <Card className="overflow-hidden p-0 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between gap-4 p-4 md:p-5">
            <div className="min-w-0 space-y-1">
                {isDefault && (
                    <Badge variant="default" className="mb-2">
                        Default
                    </Badge>
                )}
                <div className="space-y-0.5 text-sm text-foreground">
                    {address.formatted?.map(line => (
                        <p key={line}>{line}</p>
                    ))}
                </div>
                {address.phoneNumber && <p className="mt-1 text-xs text-muted-foreground">{address.phoneNumber}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Pencil className="size-3.5 sm:mr-1.5" />
                    <span className="sr-only sm:not-sr-only">Edit</span>
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete}>
                    <Trash2 className="size-3.5 sm:mr-1.5" />
                    <span className="sr-only sm:not-sr-only">Delete</span>
                </Button>
            </div>
        </div>
    </Card>
);
