import {useState, useEffect, useCallback} from "react";
import {Link} from "react-router";
import {ArrowRight, Search} from "lucide-react";
import {Button} from "~/components/ui/button";
const FALLBACK_GREETINGS = {
    nightOwl: "Night owls find the best things",
    evening: "Wind down with something worth it",
    earlyBird: "Early birds get the best picks",
    morning: "Great days start with great finds",
    midMorning: "Your next favorite is waiting",
    lunch: "Take a break. Treat yourself.",
    afternoon: "Afternoon energy, endless options",
    goldenHour: "Golden hour, golden finds",
    fallback: "Discover something worth keeping"
} as const;

const FALLBACK_HERO_MEDIA_CONFIG: {type: "video" | "image"; videoSrc?: string; imageSrc?: string} = {
    type: "video",
    videoSrc: "/hero-video.mp4"
};
import {useSiteSettings} from "~/lib/site-content-context";

type HeroSectionProps = {
    shopName?: string;
};

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    });

const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    });

const getGreeting = (hours: number): string => {
    const greetings = FALLBACK_GREETINGS;
    if (hours >= 2 && hours < 5) return greetings.nightOwl;
    if (hours >= 22 || hours < 2) return greetings.evening;
    if (hours >= 5 && hours < 6) return greetings.earlyBird;
    if (hours >= 6 && hours < 9) return greetings.morning;
    if (hours >= 9 && hours < 12) return greetings.midMorning;
    if (hours >= 12 && hours < 14) return greetings.lunch;
    if (hours >= 14 && hours < 17) return greetings.afternoon;
    if (hours >= 17 && hours < 19) return greetings.goldenHour;
    if (hours >= 19 && hours < 22) return greetings.evening;
    return greetings.fallback;
};

export const HeroSection = ({shopName}: HeroSectionProps) => {
    const {heroDescription} = useSiteSettings();
    const mediaConfig = FALLBACK_HERO_MEDIA_CONFIG;
    const [currentDate, setCurrentDate] = useState("");
    const [currentTime, setCurrentTime] = useState("");
    const [greeting, setGreeting] = useState("");

    const updateDateTime = useCallback(() => {
        const now = new Date();
        setCurrentDate(formatDate(now));
        setCurrentTime(formatTime(now));
        setGreeting(getGreeting(now.getHours()));
    }, []);

    const updateTimeOnly = useCallback(() => {
        setCurrentTime(formatTime(new Date()));
    }, []);

    useEffect(() => {
        updateDateTime();
        const timeIntervalId = setInterval(updateTimeOnly, 1000);
        const dateIntervalId = setInterval(updateDateTime, 60000);

        return () => {
            clearInterval(timeIntervalId);
            clearInterval(dateIntervalId);
        };
    }, [updateDateTime, updateTimeOnly]);

    return (
        <section className="group relative flex h-full min-h-[calc(100dvh)] w-full items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="sleek h-full w-full overflow-hidden group-hover:scale-105">
                    {mediaConfig.type === "video" ? (
                        <video className="h-full w-full cursor-zoom-in object-cover" autoPlay muted loop playsInline>
                            <source src="/hero-video.mp4" type="video/mp4" />
                        </video>
                    ) : null}
                </div>
                <div className="absolute inset-0 bg-black/50 transition-colors duration-300 lg:bg-black/60 lg:group-hover:bg-black/50" />
            </div>

            <div className="relative z-10 flex h-full w-full items-center justify-center">
                <div className="w-full">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="mb-3 flex items-center justify-center gap-3 text-white/90 drop-shadow-lg">
                            <span className="text-sm font-medium uppercase">{currentDate}</span>
                            <span className="animate-pulse text-white/90 drop-shadow-lg">&bull;</span>
                            <span className="font-mono text-sm font-medium uppercase">{currentTime}</span>
                        </div>
                    </div>

                    <div className="w-full px-4 sm:px-6 md:px-8">
                        <h1
                            className="pb-3 text-center font-serif font-semibold break-words text-white drop-shadow-lg"
                            style={{fontSize: "clamp(1.5rem, 3.5vw, 4.5rem)", lineHeight: 0.9}}
                        >
                            {greeting}
                        </h1>
                    </div>

                    <div className="mx-auto w-full max-w-[2000px] px-2 text-center md:px-4">
                        <p className="mx-auto mb-8 max-w-2xl font-serif text-xs font-semibold text-white/90 uppercase drop-shadow-lg md:text-sm">
                            {heroDescription}
                        </p>
                    </div>

                    <div className="mx-auto flex w-[70%] flex-col gap-4 sm:w-auto sm:flex-row sm:justify-center">
                        <Link to="/collections" className="w-full sm:w-auto">
                            <Button size="lg" className="h-12 w-full gap-2 !px-8 leading-none font-semibold sm:w-auto">
                                Explore Collections
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>

                        <Link to="/search" className="w-full sm:w-auto">
                            <Button variant="secondary" size="lg" className="h-12 w-full gap-2 font-semibold sm:w-auto">
                                <Search className="h-4 w-4" />
                                {shopName ? `Search ${shopName}` : "Search"}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};
