import {Image} from "@shopify/hydrogen";
import type {CustomerAddressInput, CustomerUpdateInput} from "@shopify/hydrogen/customer-account-api-types";
import type {AddressFragment, CustomerFragment} from "customer-accountapi.generated";
import type {Route} from "./+types/account.profile";
import type {AccountOutletContext} from "~/routes/account";
import {CUSTOMER_UPDATE_MUTATION} from "~/graphql/customer-account/CustomerUpdateMutation";
import {
    UPDATE_ADDRESS_MUTATION,
    DELETE_ADDRESS_MUTATION,
    CREATE_ADDRESS_MUTATION
} from "~/graphql/customer-account/CustomerAddressMutations";
import {
    data as remixData,
    Form,
    Link,
    useActionData,
    useFetcher,
    useLoaderData,
    useNavigation,
    useOutletContext
} from "react-router";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {Button} from "~/components/ui/button";
import {Avatar, AvatarFallback} from "~/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "~/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "~/components/ui/alert-dialog";
import {AddressCard} from "~/components/account/AddressCard";
import {MailIcon, PhoneIcon, PlusIcon, CheckIcon, Loader2Icon} from "lucide-react";
import {ButtonSpinner} from "~/components/ui/button-spinner";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";

type ActionResponse = {
    customer?: CustomerFragment | null;
    addressId?: string | null;
    createdAddress?: {id: string} | null;
    updatedAddress?: {id: string} | null;
    deletedAddress?: string | null;
    error?: string | Record<string, string> | null;
};

export const meta: Route.MetaFunction = () => [{title: "Account Details"}, {name: "robots", content: "noindex,nofollow"}];

export const shouldRevalidate = () => true;

const AUTO_SAVE_DELAY = 800;

export const loader = async ({context}: Route.LoaderArgs) => {
    let isAuthenticated: boolean;
    try {
        isAuthenticated = await context.customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    return remixData(
        {isAuthenticated},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
};

export const action = async ({request, context}: Route.ActionArgs) => {
    const {customerAccount} = context;
    const form = await request.formData();
    const intent = form.get("intent");

    try {
        if (intent === "createAddress" || intent === "updateAddress" || intent === "deleteAddress") {
            const addressId = form.has("addressId") ? String(form.get("addressId")) : null;
            if (!addressId && intent !== "createAddress") {
                throw new Error("You must provide an address id.");
            }

            const isLoggedIn = await customerAccount.isLoggedIn();
            if (!isLoggedIn) {
                return remixData({error: "Unauthorized"} as ActionResponse, {
                    status: 401,
                    headers: {"Set-Cookie": await context.session.commit()}
                });
            }

            const defaultAddress = form.has("defaultAddress") ? String(form.get("defaultAddress")) === "on" : false;
            const address: CustomerAddressInput = {};
            const keys: (keyof CustomerAddressInput)[] = [
                "address1",
                "address2",
                "city",
                "company",
                "territoryCode",
                "firstName",
                "lastName",
                "phoneNumber",
                "zoneCode",
                "zip"
            ];

            for (const key of keys) {
                const value = form.get(key);
                if (typeof value === "string") {
                    address[key] = value;
                }
            }

            if (intent === "createAddress") {
                const {data, errors} = await customerAccount.mutate(CREATE_ADDRESS_MUTATION, {
                    variables: {address, defaultAddress}
                });

                if (errors?.length) throw new Error(errors[0].message);
                if (data?.customerAddressCreate?.userErrors?.length) {
                    throw new Error(data.customerAddressCreate.userErrors[0].message);
                }

                return remixData(
                    {error: null, createdAddress: data?.customerAddressCreate?.customerAddress} as ActionResponse,
                    {
                        headers: {
                            "Set-Cookie": await context.session.commit(),
                            "Cache-Control": "no-cache, no-store, must-revalidate"
                        }
                    }
                );
            }

            if (intent === "updateAddress") {
                const {data, errors} = await customerAccount.mutate(UPDATE_ADDRESS_MUTATION, {
                    variables: {address, addressId: decodeURIComponent(addressId!), defaultAddress}
                });

                if (errors?.length) throw new Error(errors[0].message);
                if (data?.customerAddressUpdate?.userErrors?.length) {
                    throw new Error(data.customerAddressUpdate.userErrors[0].message);
                }

                return remixData(
                    {error: null, updatedAddress: data?.customerAddressUpdate?.customerAddress} as ActionResponse,
                    {
                        headers: {
                            "Set-Cookie": await context.session.commit(),
                            "Cache-Control": "no-cache, no-store, must-revalidate"
                        }
                    }
                );
            }

            if (intent === "deleteAddress") {
                const {data, errors} = await customerAccount.mutate(DELETE_ADDRESS_MUTATION, {
                    variables: {addressId: decodeURIComponent(addressId!)}
                });

                if (errors?.length) throw new Error(errors[0].message);
                if (data?.customerAddressDelete?.userErrors?.length) {
                    throw new Error(data.customerAddressDelete.userErrors[0].message);
                }

                return remixData({error: null, deletedAddress: addressId} as ActionResponse, {
                    headers: {
                        "Set-Cookie": await context.session.commit(),
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }
        }

        if (request.method === "PUT") {
            const customer: CustomerUpdateInput = {};
            const validKeys = ["firstName", "lastName"] as const;

            for (const [key, value] of form.entries()) {
                if (!validKeys.includes(key as (typeof validKeys)[number])) continue;
                if (typeof value === "string" && value.length) {
                    customer[key as (typeof validKeys)[number]] = value;
                }
            }

            const {data: mutationData, errors} = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
                variables: {customer}
            });

            if (errors?.length) throw new Error(errors[0].message);
            if (!mutationData?.customerUpdate?.customer) throw new Error("Customer profile update failed.");

            return remixData({error: null, customer: mutationData.customerUpdate.customer} as ActionResponse, {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            });
        }

        return remixData({error: "Method not allowed"} as ActionResponse, {
            status: 405,
            headers: {"Set-Cookie": await context.session.commit()}
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        return remixData({error: errorMessage, customer: null} as ActionResponse, {
            status: 400,
            headers: {"Set-Cookie": await context.session.commit()}
        });
    }
};

const AddressFormDialog = ({
    open,
    onOpenChange,
    address,
    isDefault
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    address: AddressFragment | null;
    isDefault: boolean;
}) => {
    const isEditing = !!address;
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Address" : "Add New Address"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update your shipping address details."
                            : "Add a new shipping address to your account."}
                    </DialogDescription>
                </DialogHeader>
                <Form method="post">
                    <input type="hidden" name="intent" value={isEditing ? "updateAddress" : "createAddress"} />
                    {isEditing && <input type="hidden" name="addressId" value={address.id} />}
                    {!isEditing && <input type="hidden" name="addressId" value="new" />}

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" defaultValue={address?.firstName ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" defaultValue={address?.lastName ?? ""} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input id="company" name="company" defaultValue={address?.company ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address1">Address Line 1</Label>
                            <Input id="address1" name="address1" defaultValue={address?.address1 ?? ""} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address2">Address Line 2</Label>
                            <Input id="address2" name="address2" defaultValue={address?.address2 ?? ""} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" defaultValue={address?.city ?? ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zoneCode">State / Province</Label>
                                <Input id="zoneCode" name="zoneCode" defaultValue={address?.zoneCode ?? ""} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="zip">Postal Code</Label>
                                <Input id="zip" name="zip" defaultValue={address?.zip ?? ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="territoryCode">Country Code</Label>
                                <Input
                                    id="territoryCode"
                                    name="territoryCode"
                                    defaultValue={address?.territoryCode ?? "US"}
                                    required
                                    placeholder="US"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone</Label>
                            <Input
                                id="phoneNumber"
                                name="phoneNumber"
                                defaultValue={address?.phoneNumber ?? ""}
                                type="tel"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="defaultAddress"
                                name="defaultAddress"
                                defaultChecked={isDefault}
                                className="size-4 rounded border-input"
                            />
                            <Label htmlFor="defaultAddress" className="text-sm font-normal">
                                Set as default address
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="relative">
                            <span className={isSubmitting ? "opacity-0" : undefined}>
                                {isEditing ? "Update Address" : "Add Address"}
                            </span>
                            {isSubmitting && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <ButtonSpinner />
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const DeleteAddressDialog = ({
    open,
    onOpenChange,
    addressId
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    addressId: string | null;
}) => {
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Address</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this address? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Form method="post">
                        <input type="hidden" name="intent" value="deleteAddress" />
                        <input type="hidden" name="addressId" value={addressId ?? ""} />
                        <Button type="submit" variant="destructive" disabled={isSubmitting} className="relative">
                            <span className={isSubmitting ? "opacity-0" : undefined}>Delete</span>
                            {isSubmitting && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <ButtonSpinner />
                                </span>
                            )}
                        </Button>
                    </Form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const AccountProfile = () => {
    const {isAuthenticated} = useLoaderData<typeof loader>();
    const {customer} = useOutletContext<AccountOutletContext>();
    const {state} = useNavigation();
    const actionData = useActionData<ActionResponse>();

    const profileFetcher = useFetcher<ActionResponse>();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<AddressFragment | null>(null);
    const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

    const [firstName, setFirstName] = useState(customer?.firstName ?? "");
    const [lastName, setLastName] = useState(customer?.lastName ?? "");
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (profileFetcher.state === "idle" && profileFetcher.data?.customer) {
            setShowSaveSuccess(true);
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
            successTimeoutRef.current = setTimeout(() => setShowSaveSuccess(false), 2000);
        }
    }, [profileFetcher.state, profileFetcher.data]);

    useEffect(() => {
        if (state === "idle" && actionData) {
            if (actionData.createdAddress) {
                toast.success("Address created successfully");
                setIsAddDialogOpen(false);
            } else if (actionData.updatedAddress) {
                toast.success("Address updated successfully");
                setEditingAddress(null);
            } else if (actionData.deletedAddress) {
                toast.success("Address deleted successfully");
                setDeletingAddressId(null);
            } else if (actionData.error) {
                const msg = typeof actionData.error === "string" ? actionData.error : "An error occurred";
                toast.error(msg);
            }
        }
    }, [actionData, state]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        };
    }, []);

    if (!isAuthenticated || !customer) {
        return (
            <div className="rounded-2xl bg-gradient-to-br from-muted/40 via-card to-muted/20 px-6 py-20 text-center sm:px-12">
                <h2 className="font-serif text-xl font-medium text-foreground md:text-2xl lg:text-3xl">Sign in to manage your account</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Access your profile, manage addresses, and update your account details.
                </p>
                <Button asChild size="lg" className="mt-6">
                    <Link to="/account/login">Sign In</Link>
                </Button>
            </div>
        );
    }

    const initials = [customer.firstName?.[0], customer.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

    const isProfileSaving = profileFetcher.state !== "idle";

    const autoSaveProfile = (newFirstName: string, newLastName: string) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        const hasChanged = newFirstName !== (customer.firstName ?? "") || newLastName !== (customer.lastName ?? "");
        if (!hasChanged) return;

        saveTimeoutRef.current = setTimeout(() => {
            const formData = new FormData();
            formData.append("firstName", newFirstName);
            formData.append("lastName", newLastName);
            void profileFetcher.submit(formData, {method: "PUT", action: "/account/profile"});
        }, AUTO_SAVE_DELAY);
    };

    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        setShowSaveSuccess(false);
        autoSaveProfile(value, lastName);
    };

    const handleLastNameChange = (value: string) => {
        setLastName(value);
        setShowSaveSuccess(false);
        autoSaveProfile(firstName, value);
    };

    const addresses = customer.addresses?.nodes ?? [];
    const defaultAddressId = customer.defaultAddress?.id;

    return (
        <div className="mx-auto max-w-5xl space-y-10 md:space-y-14">
            <div className="flex items-center gap-4 md:gap-6">
                <Avatar className="size-16 sm:size-20 shrink-0">
                    {customer.imageUrl ? (
                        <Image
                            src={customer.imageUrl}
                            alt={customer.displayName ?? ""}
                            className="size-full object-cover"
                        />
                    ) : (
                        <AvatarFallback className="text-xl sm:text-2xl font-semibold">{initials}</AvatarFallback>
                    )}
                </Avatar>
                <div>
                    <h1 className="font-serif text-xl font-medium text-foreground md:text-2xl lg:text-3xl">{customer.displayName || "Your Profile"}</h1>
                    <p className="text-muted-foreground text-sm">Manage your account details and preferences</p>
                </div>
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    {isProfileSaving && (
                        <>
                            <Loader2Icon className="size-4 animate-spin" />
                            <span className="hidden sm:inline">Saving...</span>
                        </>
                    )}
                    {showSaveSuccess && !isProfileSaving && (
                        <>
                            <CheckIcon className="size-4 text-green-600" />
                            <span className="hidden sm:inline text-green-600">Saved</span>
                        </>
                    )}
                </div>
            </div>

            <section className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                {typeof profileFetcher.data?.error === "string" && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {profileFetcher.data.error}
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="profileFirstName">First Name</Label>
                        <Input
                            id="profileFirstName"
                            value={firstName}
                            onChange={e => handleFirstNameChange(e.target.value)}
                            placeholder="First name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="profileLastName">Last Name</Label>
                        <Input
                            id="profileLastName"
                            value={lastName}
                            onChange={e => handleLastNameChange(e.target.value)}
                            placeholder="Last name"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                            <MailIcon className="size-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">
                                {customer.emailAddress?.emailAddress ?? "Not set"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                            <PhoneIcon className="size-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium">{customer.phoneNumber?.phoneNumber ?? "Not set"}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Saved Addresses</h2>
                    <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                        <PlusIcon className="size-4" />
                        Add Address
                    </Button>
                </div>

                {addresses.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {addresses.map(address => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                isDefault={address.id === defaultAddressId}
                                onEdit={() => setEditingAddress(address)}
                                onDelete={() => setDeletingAddressId(address.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl bg-gradient-to-br from-muted/40 via-card to-muted/20 px-6 py-12 text-center sm:px-12">
                        <p className="text-sm text-muted-foreground">No saved addresses yet</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                            Add Your First Address
                        </Button>
                    </div>
                )}
            </section>

            <AddressFormDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                address={null}
                isDefault={addresses.length === 0}
            />

            <AddressFormDialog
                open={!!editingAddress}
                onOpenChange={open => !open && setEditingAddress(null)}
                address={editingAddress}
                isDefault={editingAddress?.id === defaultAddressId}
            />

            <DeleteAddressDialog
                open={!!deletingAddressId}
                onOpenChange={open => !open && setDeletingAddressId(null)}
                addressId={deletingAddressId}
            />
        </div>
    );
};

export default AccountProfile;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
