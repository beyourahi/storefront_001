import {useState, useEffect, useCallback, useRef} from "react";
import {Link} from "react-router";
import {ArrowRight, Search as SearchIcon} from "lucide-react";
import {Button} from "~/components/ui/button";
import {ParallaxLayer} from "~/components/motion/ParallaxLayer";
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
import {useScreenSize, BREAKPOINTS} from "~/hooks/useScreenSize";
import {useSearchController} from "~/hooks/useSearchController";

interface HeroMedia {
    url: string;
    mediaType: "image" | "video";
    altText?: string | null;
    width?: number | null;
    height?: number | null;
    previewImage?: {
        url: string;
    } | null;
}

interface VideoHeroProps {
    heroHeading?: string;
    heroDescription?: string;
    shopName?: string;
}

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

function HeroBackgroundMedia({
    mobile,
    largeScreen,
    fallbackVideoSrc,
    fallbackImageSrc
}: {
    mobile?: HeroMedia;
    largeScreen?: HeroMedia;
    fallbackVideoSrc: string | undefined;
    fallbackImageSrc?: string;
}) {
    const {width, isHydrated} = useScreenSize();

    const effectiveMobile = mobile || largeScreen;
    const effectiveLargeScreen = largeScreen || mobile;

    const isMobileViewport = isHydrated && width !== null && width < BREAKPOINTS.md;
    const activeMedia = isMobileViewport ? effectiveMobile : effectiveLargeScreen;

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || activeMedia?.mediaType !== "video") return;
        video.load();
        video.play().catch(() => {});
    }, [activeMedia?.url, activeMedia?.mediaType]);

    if (effectiveMobile?.mediaType === "image" && effectiveLargeScreen?.mediaType === "image") {
        return (
            <picture>
                <source
                    media={`(min-width: ${BREAKPOINTS.md}px)`}
                    srcSet={effectiveLargeScreen.url}
                    width={effectiveLargeScreen.width || undefined}
                    height={effectiveLargeScreen.height || undefined}
                />
                <img
                    src={effectiveMobile.url}
                    alt={effectiveMobile.altText || "Hero Section Background"}
                    width={effectiveMobile.width || undefined}
                    height={effectiveMobile.height || undefined}
                    className="h-full w-full cursor-zoom-in object-cover"
                />
            </picture>
        );
    }

    if (activeMedia?.mediaType === "video") {
        return (
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full cursor-zoom-in object-cover"
                poster={activeMedia.previewImage?.url}
            >
                <source src={activeMedia.url} type="video/mp4" />
            </video>
        );
    }

    if (activeMedia?.mediaType === "image") {
        return (
            <img
                src={activeMedia.url}
                alt={activeMedia.altText || "Hero Section Background"}
                className="h-full w-full cursor-zoom-in object-cover"
            />
        );
    }

    if (fallbackImageSrc && !fallbackVideoSrc) {
        return (
            <img
                src={fallbackImageSrc}
                alt="Hero Section Background"
                className="h-full w-full cursor-zoom-in object-cover"
            />
        );
    }

    if (!fallbackVideoSrc) return null;

    return (
        <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full cursor-zoom-in object-cover"
            poster={fallbackImageSrc}
        >
            <source src={fallbackVideoSrc} type="video/mp4" />
        </video>
    );
}

export function VideoHero({heroHeading, heroDescription, shopName}: VideoHeroProps) {
    const {
        heroHeading: defaultHeading,
        heroDescription: defaultDescription,
        heroMediaMobile,
        heroMediaLargeScreen
    } = useSiteSettings();
    const mediaConfig = FALLBACK_HERO_MEDIA_CONFIG as {videoSrc?: string; imageSrc?: string; type?: string};
    const {openSearch} = useSearchController();

    const [greeting, setGreeting] = useState("");

    const fallbackVideoSrc = mediaConfig.videoSrc;
    const fallbackImageSrc = mediaConfig.imageSrc;

    const heading = heroHeading || defaultHeading;
    const description = heroDescription || defaultDescription;

    const updateGreeting = useCallback(() => {
        setGreeting(getGreeting(new Date().getHours()));
    }, []);

    useEffect(() => {
        updateGreeting();
        const intervalId = setInterval(updateGreeting, 60000);
        return () => clearInterval(intervalId);
    }, [updateGreeting]);

    return (
        <section className="group relative flex h-full min-h-[calc(100dvh)] w-full items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <ParallaxLayer
                    className="h-full w-full"
                    contentClassName="sleek h-full w-full group-hover:scale-105"
                    amplitude={32}
                    scale={1.08}
                >
                    <HeroBackgroundMedia
                        mobile={heroMediaMobile}
                        largeScreen={heroMediaLargeScreen}
                        fallbackVideoSrc={fallbackVideoSrc}
                        fallbackImageSrc={fallbackImageSrc}
                    />
                </ParallaxLayer>
                <div className="absolute inset-0 bg-black/50 transition-colors duration-300 lg:bg-black/60 lg:group-hover:bg-black/50" />
            </div>

            <div className="relative z-10 flex h-full w-full items-center justify-center">
                <div className="w-full">
                    <div className="w-full px-4 sm:px-6 md:px-8">
                        <h1
                            className="pb-3 text-center font-serif font-semibold break-words text-white drop-shadow-lg"
                            style={{fontSize: "clamp(1.5rem, 3.5vw, 4.5rem)", lineHeight: 0.9}}
                        >
                            {heading}
                        </h1>
                        <p
                            className="mt-3 text-center text-xs font-medium tracking-[0.2em] uppercase text-white/60 min-h-[1rem] overflow-hidden"
                            aria-hidden={!greeting || undefined}
                        >
                            {greeting}
                        </p>
                    </div>

                    <div className="mx-auto w-full max-w-[2000px] px-2 text-center md:px-4">
                        <p className="mx-auto mb-8 max-w-2xl font-serif text-xs font-semibold text-white/90 uppercase drop-shadow-lg md:text-sm">
                            {description}
                        </p>
                    </div>

                    <div className="mx-auto flex w-[70%] flex-col gap-4 sm:w-auto sm:flex-row sm:justify-center">
                        <Link to="/collections" className="w-full sm:w-auto">
                            <Button size="lg" className="h-12 w-full gap-2 !px-8 leading-none font-semibold sm:w-auto">
                                Explore Collections
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>

                        <button
                            type="button"
                            className="sleek bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-12 w-full shrink-0 select-none items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold whitespace-nowrap shadow-xs outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            onClick={event => openSearch(event.currentTarget)}
                        >
                            <SearchIcon className="h-4 w-4" />
                            {shopName ? `Search ${shopName}` : "Search"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
