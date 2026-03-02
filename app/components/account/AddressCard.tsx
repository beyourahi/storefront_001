import type {AddressFragment} from "customer-accountapi.generated";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";

type AddressCardProps = {
    address: AddressFragment;
    isDefault: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

export const AddressCard = ({address, isDefault, onEdit, onDelete}: AddressCardProps) => (
    <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
                {isDefault && (
                    <Badge variant="secondary" className="mb-2">
                        Default
                    </Badge>
                )}
                <div className="space-y-1 text-sm">
                    {address.formatted?.map(line => (
                        <p key={line}>{line}</p>
                    ))}
                </div>
                {address.phoneNumber && <p className="text-muted-foreground text-sm">{address.phoneNumber}</p>}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onEdit}>
                    Edit
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete}>
                    Delete
                </Button>
            </div>
        </div>
    </Card>
);
