import {useState} from "react";
import {useNavigate} from "react-router";
import type {Route} from "./+types/gift-finder";
import {useAgentSurface} from "~/lib/agent-surface-context";
import {AgentFallbackBanner} from "~/components/AgentFallbackBanner";
import {
    Gift,
    User,
    Users,
    Baby,
    Cake,
    Heart,
    Star,
    Zap,
    Home,
    Mountain,
    Shirt,
    Leaf,
    Monitor,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ArrowRight
} from "lucide-react";
import {cn} from "~/lib/utils";
import {resolveGiftQuery, type GiftFinderAnswers} from "~/lib/agentic/quizzes/gift-finder";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";

export const meta: Route.MetaFunction = () => {
    return [{title: "Gift Finder | Find the Perfect Gift"}];
};

export async function loader() {
    return {};
}

/* ── Types ── */
type StepKey = "recipient" | "budget" | "occasion" | "interest";

interface Option {
    value: string;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
}

/* ── Step definitions ── */
const STEPS: {key: StepKey; question: string; options: Option[]}[] = [
    {
        key: "recipient",
        question: "Who are you shopping for?",
        options: [
            {value: "him", label: "Him", sublabel: "Men's gifts", icon: <User className="w-7 h-7" />},
            {value: "her", label: "Her", sublabel: "Women's gifts", icon: <Heart className="w-7 h-7" />},
            {value: "them", label: "Them", sublabel: "Gender-neutral", icon: <Users className="w-7 h-7" />},
            {value: "kids", label: "Kids", sublabel: "Children's gifts", icon: <Baby className="w-7 h-7" />}
        ]
    },
    {
        key: "budget",
        question: "What's your budget?",
        options: [
            {value: "under25", label: "Under $25", sublabel: "Small treat", icon: <Leaf className="w-7 h-7" />},
            {value: "25to75", label: "$25 – $75", sublabel: "Sweet spot", icon: <Star className="w-7 h-7" />},
            {value: "75to150", label: "$75 – $150", sublabel: "Something special", icon: <Sparkles className="w-7 h-7" />},
            {value: "over150", label: "Over $150", sublabel: "Truly memorable", icon: <Gift className="w-7 h-7" />}
        ]
    },
    {
        key: "occasion",
        question: "What's the occasion?",
        options: [
            {value: "birthday", label: "Birthday", sublabel: "Make it a celebration", icon: <Cake className="w-7 h-7" />},
            {
                value: "anniversary",
                label: "Anniversary",
                sublabel: "A year worth marking",
                icon: <Heart className="w-7 h-7" />
            },
            {
                value: "holiday",
                label: "Holiday",
                sublabel: "Seasonal joy",
                icon: <Sparkles className="w-7 h-7" />
            },
            {
                value: "justbecause",
                label: "Just Because",
                sublabel: "No reason needed",
                icon: <Star className="w-7 h-7" />
            }
        ]
    },
    {
        key: "interest",
        question: "What are their interests?",
        options: [
            {value: "fashion", label: "Fashion", sublabel: "Style & accessories", icon: <Shirt className="w-7 h-7" />},
            {
                value: "wellness",
                label: "Wellness",
                sublabel: "Skincare & beauty",
                icon: <Leaf className="w-7 h-7" />
            },
            {value: "tech", label: "Tech", sublabel: "Gadgets & gear", icon: <Monitor className="w-7 h-7" />},
            {value: "home", label: "Home", sublabel: "Decor & living", icon: <Home className="w-7 h-7" />},
            {
                value: "outdoor",
                label: "Outdoor",
                sublabel: "Adventure & sports",
                icon: <Mountain className="w-7 h-7" />
            },
            {
                value: "zap",
                label: "Surprise Me",
                sublabel: "Curated picks",
                icon: <Zap className="w-7 h-7" />
            }
        ]
    }
];

/* ── Component ── */
export default function GiftFinder() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<GiftFinderAnswers>({});
    const [transitioning, setTransitioning] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof resolveGiftQuery> | null>(null);
    const agentSurface = useAgentSurface();

    const totalSteps = STEPS.length;

    // Agent path: guided quiz requires interactive browser input — redirect agents to catalog.
    if (agentSurface.isAgent) return <AgentFallbackBanner />;
    const step = STEPS[currentStep];
    const progressPct = ((currentStep) / totalSteps) * 100;

    const selectedValue = step ? answers[step.key] : undefined;

    function selectOption(value: string) {
        if (!step) return;
        setAnswers(prev => ({...prev, [step.key]: value as never}));
    }

    function goNext() {
        if (!selectedValue || transitioning) return;

        if (currentStep === totalSteps - 1) {
            // Final step — resolve
            const resolved = resolveGiftQuery(answers);
            setTransitioning(true);
            setTimeout(() => {
                setResult(resolved);
                setTransitioning(false);
            }, 260);
        } else {
            setTransitioning(true);
            setTimeout(() => {
                setCurrentStep(s => s + 1);
                setTransitioning(false);
            }, 260);
        }
    }

    function goBack() {
        if (currentStep === 0 || transitioning) return;
        setTransitioning(true);
        setTimeout(() => {
            setCurrentStep(s => s - 1);
            setTransitioning(false);
        }, 260);
    }

    function handleShopGifts() {
        if (!result) return;
        void navigate(`/search?q=${encodeURIComponent(result.query)}`);
    }

    function resetQuiz() {
        setResult(null);
        setAnswers({});
        setCurrentStep(0);
    }

    /* ── Results screen ── */
    if (result) {
        return (
            <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
                <PageBreadcrumbs customTitle="Gift Finder" />

                <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16">
                    {/* Decorative ring */}
                    <div
                        className="mb-8 flex items-center justify-center w-24 h-24 rounded-full"
                        style={{
                            background: "var(--brand-primary-subtle)",
                            boxShadow: "0 0 0 8px var(--brand-primary-subtle)"
                        }}
                    >
                        <Gift className="w-10 h-10" style={{color: "var(--brand-primary)"}} />
                    </div>

                    <p
                        className="font-mono text-xs tracking-widest uppercase mb-4"
                        style={{color: "var(--text-subtle)"}}
                    >
                        Your perfect match
                    </p>

                    <h2
                        className="font-serif font-bold text-3xl md:text-5xl text-center max-w-2xl mb-6 leading-tight"
                        style={{color: "var(--text-primary)"}}
                    >
                        {result.headline}
                    </h2>

                    <p className="text-base text-center max-w-md mb-10" style={{color: "var(--text-secondary)"}}>
                        {"We've curated a selection based on your preferences. Ready to find the one?"}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                        <button
                            onClick={handleShopGifts}
                            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.97]"
                            style={{
                                background: "var(--brand-primary)",
                                color: "var(--brand-primary-foreground)"
                            }}
                        >
                            Shop these gifts
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={resetQuiz}
                            className="flex items-center justify-center py-4 px-5 rounded-xl font-medium text-sm transition-all duration-200 border"
                            style={{
                                borderColor: "var(--border-subtle)",
                                color: "var(--text-secondary)"
                            }}
                        >
                            Retake quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Quiz screen ── */
    return (
        <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
            <PageBreadcrumbs customTitle="Gift Finder" />

            <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
                {/* Progress indicator */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                        <span
                            className="font-mono text-xs tracking-widest uppercase"
                            style={{color: "var(--text-subtle)"}}
                        >
                            Step {currentStep + 1} of {totalSteps}
                        </span>
                        <span className="font-mono text-xs" style={{color: "var(--text-subtle)"}}>
                            {Math.round(progressPct)}% complete
                        </span>
                    </div>
                    <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{background: "var(--surface-muted)"}}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${progressPct}%`,
                                background: "var(--brand-primary)"
                            }}
                        />
                    </div>
                    {/* Step dots */}
                    <div className="flex gap-2 mt-3 justify-center">
                        {STEPS.map((step, i) => (
                            <div
                                key={step.key}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: i === currentStep ? "24px" : "8px",
                                    height: "8px",
                                    background: i <= currentStep ? "var(--brand-primary)" : "var(--surface-interactive)"
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Question */}
                <div
                    className="transition-all duration-260"
                    style={{
                        opacity: transitioning ? 0 : 1,
                        transform: transitioning ? "translateY(8px)" : "translateY(0)"
                    }}
                >
                    <h1
                        className="font-serif font-bold text-2xl md:text-4xl text-center mb-10"
                        style={{color: "var(--text-primary)"}}
                    >
                        {step?.question}
                    </h1>

                    {/* Options grid */}
                    <div
                        className={cn(
                            "grid gap-3",
                            step && step.options.length > 4
                                ? "grid-cols-2 sm:grid-cols-3"
                                : "grid-cols-2"
                        )}
                    >
                        {step?.options.map(option => {
                            const isSelected = selectedValue === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => selectOption(option.value)}
                                    className="group relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl text-center transition-all duration-200 active:scale-[0.97] border-2"
                                    style={{
                                        background: isSelected
                                            ? "var(--brand-primary-subtle)"
                                            : "var(--surface-raised)",
                                        borderColor: isSelected
                                            ? "var(--brand-primary)"
                                            : "transparent",
                                        boxShadow: isSelected
                                            ? "0 0 0 1px var(--brand-primary)"
                                            : "var(--shadow-sm)"
                                    }}
                                    aria-pressed={isSelected}
                                >
                                    {/* Icon */}
                                    <span
                                        className="flex items-center justify-center w-14 h-14 rounded-xl transition-colors duration-200"
                                        style={{
                                            background: isSelected
                                                ? "var(--brand-primary)"
                                                : "var(--surface-interactive)",
                                            color: isSelected
                                                ? "var(--brand-primary-foreground)"
                                                : "var(--text-secondary)"
                                        }}
                                    >
                                        {option.icon}
                                    </span>

                                    <span>
                                        <span
                                            className="block font-semibold text-sm sm:text-base"
                                            style={{
                                                color: isSelected
                                                    ? "var(--brand-primary-subtle-foreground)"
                                                    : "var(--text-primary)"
                                            }}
                                        >
                                            {option.label}
                                        </span>
                                        {option.sublabel && (
                                            <span
                                                className="block text-xs mt-0.5"
                                                style={{color: "var(--text-subtle)"}}
                                            >
                                                {option.sublabel}
                                            </span>
                                        )}
                                    </span>

                                    {/* Selected indicator dot */}
                                    {isSelected && (
                                        <span
                                            className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                                            style={{background: "var(--brand-primary)"}}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10 gap-3">
                    <button
                        onClick={goBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 py-3 px-5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                            background: "var(--surface-interactive)",
                            color: "var(--text-secondary)"
                        }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        onClick={goNext}
                        disabled={!selectedValue || transitioning}
                        className="flex items-center gap-2 py-3 px-7 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                        style={{
                            background: "var(--brand-primary)",
                            color: "var(--brand-primary-foreground)"
                        }}
                    >
                        {currentStep === totalSteps - 1 ? "Find my gift" : "Next"}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
