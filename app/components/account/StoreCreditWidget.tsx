import {useState} from "react";
import {Card, CardContent} from "~/components/ui/card";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "~/components/ui/collapsible";
import {Button} from "~/components/ui/button";
import {WalletIcon, ChevronDownIcon, InfoIcon} from "lucide-react";
import {cn} from "~/lib/utils";
import type {StoreCreditAccount, StoreCreditTransaction} from "~/graphql/customer-account/StoreCreditQueries";
import {isCredit} from "~/graphql/customer-account/StoreCreditQueries";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {formatShopifyMoney} from "~/lib/currency-formatter";

interface StoreCreditWidgetProps {
    balance: {amount: string; currencyCode: string} | null;
    accounts: StoreCreditAccount[];
}

export const StoreCreditWidget = ({balance, accounts}: StoreCreditWidgetProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasBalance = balance && parseFloat(balance.amount) > 0;

    const allTransactions: StoreCreditTransaction[] = accounts.flatMap(account => account.transactions.nodes);

    return (
        <section>
            <Card className="overflow-hidden rounded-2xl bg-gradient-to-br from-green-50/50 via-card to-green-50/30 py-0 shadow-sm">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4 md:gap-5">
                            <div className="flex items-center justify-center size-14 md:size-16 rounded-2xl bg-green-500/15 shrink-0 shadow-inner">
                                <WalletIcon className="size-7 md:size-8 text-green-600" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                                    Store Credit Balance
                                </p>
                                <p className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold text-foreground tracking-tight">
                                    {hasBalance ? formatShopifyMoney(balance) : "$0"}
                                </p>
                                {hasBalance && (
                                    <p className="text-sm text-green-600 font-medium">
                                        Available to use at checkout
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/50 px-4 py-3.5">
                        <InfoIcon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Store credit is issued when you receive a refund or when an order is cancelled. It&apos;s
                            automatically applied at checkout.
                        </p>
                    </div>

                    {allTransactions.length > 0 && (
                        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between px-0 hover:bg-transparent group"
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        Transaction History ({allTransactions.length})
                                    </span>
                                    <ChevronDownIcon
                                        className={cn(
                                            "size-4 text-muted-foreground transition-transform duration-300 group-hover:text-foreground",
                                            isOpen && "rotate-180"
                                        )}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-4">
                                <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl bg-muted/30 p-3">
                                    {allTransactions.map(transaction => (
                                        <TransactionItem key={transaction.id} transaction={transaction} />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </CardContent>
            </Card>
        </section>
    );
};

const TransactionItem = ({transaction}: {transaction: StoreCreditTransaction}) => {
    const credit = isCredit(transaction);
    const formattedDate = new Date(transaction.createdAt).toLocaleDateString(STORE_FORMAT_LOCALE, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <div className="flex items-center justify-between py-2.5 last:pb-0 first:pt-0">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "size-8 rounded-full flex items-center justify-center text-sm font-medium",
                        credit
                            ? "bg-green-500/20 text-green-600"
                            : "bg-amber-500/20 text-amber-700"
                    )}
                >
                    {credit ? "+" : "-"}
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">{credit ? "Credit Added" : "Credit Used"}</p>
                    <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
            </div>
            <div className="text-right">
                <p
                    className={cn(
                        "text-sm font-medium",
                        credit ? "text-green-600" : "text-amber-700"
                    )}
                >
                    {credit ? "+" : "-"}
                    {formatShopifyMoney(transaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground">Bal: {formatShopifyMoney(transaction.balanceAfterTransaction)}</p>
            </div>
        </div>
    );
};
