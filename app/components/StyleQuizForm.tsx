import {useState, useEffect} from "react";
import {useNavigate} from "react-router";
import {ChevronLeft, ChevronRight, Sparkles, ArrowRight, RotateCcw} from "lucide-react";
import {cn} from "~/lib/utils";
import {resolveStyleQuery, type StyleProfile} from "~/lib/agentic/quizzes/style-fit";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepKey = keyof StyleProfile;

interface PillOption {
    value: string;
    label: string;
    descriptor: string;
}

interface QuizStep {
    key: StepKey;
    question: string;
    options: PillOption[];
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: QuizStep[] = [
    {
        key: "fit",
        question: "What's your fit preference?",
        options: [
            {value: "relaxed", label: "Relaxed", descriptor: "Comfortable and easygoing"},
            {value: "regular", label: "Regular", descriptor: "Classic, true-to-size cut"},
            {value: "slim", label: "Slim", descriptor: "Tailored, close to the body"},
            {value: "oversized", label: "Oversized", descriptor: "Loose, intentionally large"}
        ]
    },
    {
        key: "style",
        question: "What's your style?",
        options: [
            {value: "casual", label: "Casual", descriptor: "Effortless everyday looks"},
            {value: "formal", label: "Formal", descriptor: "Polished and professional"},
            {value: "streetwear", label: "Streetwear", descriptor: "Urban edge with graphic flair"},
            {value: "minimalist", label: "Minimalist", descriptor: "Clean lines, less is more"},
            {value: "eclectic", label: "Eclectic", descriptor: "Bold patterns and mixed-era pieces"}
        ]
    },
    {
        key: "color",
        question: "What colors do you prefer?",
        options: [
            {value: "neutrals", label: "Neutrals", descriptor: "Whites, greys, beiges"},
            {value: "bold", label: "Bold", descriptor: "Vivid, eye-catching hues"},
            {value: "pastels", label: "Pastels", descriptor: "Soft, muted tones"},
            {value: "earth", label: "Earth Tones", descriptor: "Browns, terracottas, greens"},
            {value: "monochrome", label: "Monochrome", descriptor: "One color, many shades"}
        ]
    }
];

const TOTAL_STEPS = STEPS.length;
const LOCALSTORAGE_KEY = "style_profile";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Self-contained style/fit quiz component.
 * Feature 9 — Style & Fit Quiz.
 * Persists resolved profile label to localStorage; navigates to /search on completion.
 */
export function StyleQuizForm() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [profile, setProfile] = useState<StyleProfile>({});
    const [transitioning, setTransitioning] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof resolveStyleQuery> | null>(null);
    const [savedProfile, setSavedProfile] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const step = STEPS[currentStep];
    const progressPct = (currentStep / TOTAL_STEPS) * 100;
    const selectedValue = step ? profile[step.key] : undefined;

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem(LOCALSTORAGE_KEY);
            if (saved) setSavedProfile(saved);
        } catch {
            // localStorage unavailable
        }
    }, []);

    useEffect(() => {
        if (!result) return;
        try {
            localStorage.setItem(LOCALSTORAGE_KEY, result.label);
            setSavedProfile(result.label);
        } catch {
            // localStorage unavailable
        }
    }, [result]);

    function selectOption(value: string) {
        if (!step) return;
        setProfile(prev => ({...prev, [step.key]: value as never}));
    }

    function goNext() {
        if (!selectedValue || transitioning) return;
        if (currentStep === TOTAL_STEPS - 1) {
            const resolved = resolveStyleQuery(profile);
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

    function handleShopStyle() {
        if (!result) return;
        void navigate(`/search?q=${encodeURIComponent(result.query)}`);
    }

    function resetQuiz() {
        setResult(null);
        setProfile({});
        setCurrentStep(0);
    }

    /* ── Results screen ── */
    if (result) {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16">
                <div
                    className="mb-8 flex items-center justify-center w-24 h-24 rounded-full"
                    style={{
                        background: "var(--brand-accent-subtle)",
                        boxShadow: "0 0 0 8px var(--brand-accent-subtle)"
                    }}
                >
                    <Sparkles className="w-10 h-10" style={{color: "var(--brand-accent)"}} />
                </div>

                <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{color: "var(--text-subtle)"}}>
                    Your style profile
                </p>

                <h2
                    className="font-serif font-bold text-3xl md:text-5xl text-center max-w-2xl mb-4 leading-tight capitalize"
                    style={{color: "var(--text-primary)"}}
                >
                    {result.label}
                </h2>

                <p className="text-base text-center max-w-md mb-10" style={{color: "var(--text-secondary)"}}>
                    {"We've built a style guide around your preferences. Start exploring pieces that feel like you."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button
                        onClick={handleShopStyle}
                        className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.97]"
                        style={{background: "var(--brand-primary)", color: "var(--brand-primary-foreground)"}}
                    >
                        Shop Your Style
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={resetQuiz}
                        className="flex items-center justify-center gap-2 py-4 px-5 rounded-xl font-medium text-sm transition-all duration-200 border"
                        style={{borderColor: "var(--border-subtle)", color: "var(--text-secondary)"}}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retake
                    </button>
                </div>
            </div>
        );
    }

    /* ── Quiz screen ── */
    return (
        <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
            {/* Welcome back banner */}
            {mounted && savedProfile && currentStep === 0 && (
                <div
                    className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl"
                    style={{background: "var(--brand-primary-subtle)"}}
                >
                    <div className="flex-1">
                        <p className="text-sm font-medium" style={{color: "var(--brand-primary-subtle-foreground)"}}>
                            Welcome back!
                        </p>
                        <p className="text-xs mt-0.5" style={{color: "var(--text-secondary)"}}>
                            Your style profile: <strong>{savedProfile}</strong>
                        </p>
                    </div>
                    <button
                        onClick={() => void navigate(`/search?q=${encodeURIComponent(savedProfile)}`)}
                        className="text-xs font-semibold py-2 px-4 rounded-lg transition-colors duration-150 whitespace-nowrap"
                        style={{background: "var(--brand-primary)", color: "var(--brand-primary-foreground)"}}
                    >
                        Shop your style
                    </button>
                </div>
            )}

            {/* Progress indicator */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs tracking-widest uppercase" style={{color: "var(--text-subtle)"}}>
                        Step {currentStep + 1} of {TOTAL_STEPS}
                    </span>
                    <span className="font-mono text-xs" style={{color: "var(--text-subtle)"}}>
                        {Math.round(progressPct)}% complete
                    </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{background: "var(--surface-muted)"}}>
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{width: `${progressPct}%`, background: "var(--brand-primary)"}}
                    />
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                    {STEPS.map((s, i) => (
                        <div
                            key={s.key}
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

            {/* Question + options */}
            <div
                className="transition-all duration-260"
                style={{
                    opacity: transitioning ? 0 : 1,
                    transform: transitioning ? "translateY(8px)" : "translateY(0)"
                }}
            >
                <h1
                    className="font-serif font-bold text-2xl md:text-4xl text-center mb-8"
                    style={{color: "var(--text-primary)"}}
                >
                    {step?.question}
                </h1>

                <div className="flex flex-col gap-3">
                    {step?.options.map(option => {
                        const isSelected = selectedValue === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => selectOption(option.value)}
                                className={cn(
                                    "relative flex items-center gap-4 py-4 px-5 rounded-xl text-left",
                                    "transition-all duration-200 active:scale-[0.99] border-l-4 w-full"
                                )}
                                style={{
                                    background: isSelected ? "var(--brand-primary-subtle)" : "var(--surface-raised)",
                                    borderLeftColor: isSelected ? "var(--brand-primary)" : "transparent",
                                    boxShadow: isSelected ? "none" : "var(--shadow-sm)"
                                }}
                                aria-pressed={isSelected}
                            >
                                <div className="flex-1 min-w-0">
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
                                    <span className="block text-xs mt-0.5" style={{color: "var(--text-subtle)"}}>
                                        {option.descriptor}
                                    </span>
                                </div>
                                <span
                                    className="shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-150 flex items-center justify-center"
                                    style={{
                                        borderColor: isSelected ? "var(--brand-primary)" : "var(--border-strong)"
                                    }}
                                >
                                    {isSelected && (
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{background: "var(--brand-primary)"}}
                                        />
                                    )}
                                </span>
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
                    style={{background: "var(--surface-interactive)", color: "var(--text-secondary)"}}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={goNext}
                    disabled={!selectedValue || transitioning}
                    className="flex items-center gap-2 py-3 px-7 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                    style={{background: "var(--brand-primary)", color: "var(--brand-primary-foreground)"}}
                >
                    {currentStep === TOTAL_STEPS - 1 ? "See my style" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
