import {cn} from "~/lib/utils";

type ContainerElement = "div" | "section" | "main" | "article" | "header" | "footer" | "aside" | "nav";

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
    as?: ContainerElement;
    noPadding?: boolean;
}

export function Container({children, className, as: Component = "div", noPadding = false}: ContainerProps) {
    return <Component className={cn("w-full", !noPadding && "px-container", className)}>{children}</Component>;
}

export const breakoutClasses = "-mx-[var(--container-padding)] px-[var(--container-padding)]";

export const fullBleedClasses = "-mx-[var(--container-padding)]";

export default Container;
