import React, { useRef, createContext, useContext, useState, useEffect } from "react";
import { motion, useScroll, useTransform, MotionValue, useSpring, useMotionValue } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImmersiveScrollProps {
    children: React.ReactNode;
}

// Context to pass scroll progress to children
interface SectionContextType {
    enterProgress: MotionValue<number>;
    exitProgress: MotionValue<number>;
    isVisible: boolean;
}

const SectionContext = createContext<SectionContextType | null>(null);

export const useSectionAnimation = () => {
    const context = useContext(SectionContext);
    if (!context) {
        throw new Error("useSectionAnimation must be used within a Section");
    }
    return context;
};

// =========================================
// MOBILE SMART SCROLL ENGINE
// =========================================

const MobileSmartScroll = ({ children }: { children: React.ReactNode }) => {
    const childrenArray = React.Children.toArray(children);
    const total = childrenArray.length;

    // We need to measure the height of each child to calculate the scroll timeline
    const [heights, setHeights] = useState<number[]>(new Array(total).fill(0));
    const containerRef = useRef<HTMLDivElement>(null);

    // Measure heights on mount/resize
    useEffect(() => {
        if (!containerRef.current) return;

        const measure = () => {
            const measuredHeights = Array.from(containerRef.current!.children).map(child => {
                // We measure the first child div of each wrapper
                return (child as HTMLElement).scrollHeight || 0;
            });
            setHeights(measuredHeights);
        };

        measure();

        // Optional: Resize observer for dynamic content changes
        const resizeObserver = new ResizeObserver(measure);
        Array.from(containerRef.current.children).forEach(child => resizeObserver.observe(child));

        return () => resizeObserver.disconnect();
    }, [total]);

    // Calculate Timeline
    // Viewport Height
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Config: How much "scroll pixels" to allocate for the fade transition
    const FADE_SCROLL_PX = vh * 0.5;

    // Calculate start/end points for each section in the global scroll
    // Timeline Structure per section:
    // [Enter Transition] -> [Internal Scroll (if tall)] -> [Exit Transition]
    // Note: Exit of i overlaps with Enter of i+1

    const timeline: { start: number; end: number; internalScroll: number }[] = [];
    let currentScroll = 0;

    heights.forEach((h, i) => {
        const isFirst = i === 0;

        // Internal Scroll: How much we need to scroll to see the whole content?
        // If content < vh, internal scroll is 0.
        // If content > vh, we need to scroll (h - vh) + some padding.
        const internalScroll = Math.max(0, h - vh + 100);

        // Start point
        const start = currentScroll;

        // Duration: Fade In (except first) + Internal Scroll + Hold
        const duration = (isFirst ? 0 : FADE_SCROLL_PX) + internalScroll + FADE_SCROLL_PX;

        timeline.push({
            start,
            end: start + duration,
            internalScroll
        });

        // Advance global scroll pointer
        // The next section starts BEFORE this one ends (overlap for fade effect)
        currentScroll += duration; // - FADE_SCROLL_PX (Overlap optional, simpler without for now to avoid z-fighting logic complexity)
    });

    const totalHeight = currentScroll + vh; // Add one screen for final buffer

    const { scrollY } = useScroll();

    return (
        <div style={{ height: totalHeight }} className="relative bg-background">
            {childrenArray.map((child, i) => (
                <MobileSectionRenderer
                    key={i}
                    i={i}
                    total={total}
                    timeline={timeline[i]}
                    scrollY={scrollY}
                    height={heights[i]}
                    vh={vh}
                    fadePx={FADE_SCROLL_PX}
                >
                    {child}
                </MobileSectionRenderer>
            ))}

            {/* Hidden measurement container */}
            <div
                ref={containerRef}
                className="fixed top-0 left-0 w-full opacity-0 pointer-events-none -z-50 invisible"
                aria-hidden="true"
            >
                {childrenArray.map((child, i) => (
                    <div key={i} className="w-full h-auto">
                        <MeasurementWrapper>
                            {child}
                        </MeasurementWrapper>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Wrapper to provide dummy context for measurement
// This prevents children like Hero/Features from crashing when accessing useSectionAnimation
const MeasurementWrapper = ({ children }: { children: React.ReactNode }) => {
    // Static motion value for measurement (no animation needed)
    // We use a hook to create it once
    const dummyValue = useMotionValue(0);

    const contextValue = {
        enterProgress: dummyValue,
        exitProgress: dummyValue,
        isVisible: true
    };

    return (
        <SectionContext.Provider value={contextValue}>
            {children}
        </SectionContext.Provider>
    );
};

const MobileSectionRenderer = ({
    children,
    i,
    total,
    timeline,
    scrollY,
    height,
    vh,
    fadePx
}: {
    children: React.ReactNode;
    i: number;
    total: number;
    timeline: { start: number; end: number; internalScroll: number };
    scrollY: MotionValue<number>;
    height: number;
    vh: number;
    fadePx: number;
}) => {
    // If we haven't measured yet (timeline is undefined), don't render or render hidden
    if (!timeline) return null;

    const { start, end, internalScroll } = timeline;
    const isFirst = i === 0;
    const isLast = i === total - 1;

    // 1. Enter Progress
    // First section enters immediately.
    // Others enter during the first FADE_SCROLL_PX of their timeslot.
    const enterStart = start;
    const enterEnd = start + (isFirst ? 0 : fadePx);
    const enterProgress = useTransform(scrollY, [enterStart, enterEnd], [0, 1]); // Spring not strictly needed if scroll is smooth

    // 2. Exit Progress
    // Last section never exits.
    // Others exit during the last FADE_SCROLL_PX of their timeslot.
    const exitStart = end - fadePx;
    const exitEnd = end;
    const exitProgress = useTransform(scrollY, [exitStart, exitEnd], [0, 1]);

    // 3. Internal Scroll (Reading Progress)
    // Between Enter and Exit.
    // If internalScroll > 0, we translate Y upwards to reveal content.
    const scrollStart = enterEnd;
    const scrollEnd = exitStart;

    // We map scroll from 0 to -internalScroll
    const yTransform = useTransform(
        scrollY,
        [scrollStart, scrollEnd],
        [0, -internalScroll],
        { clamp: true }
    );

    // Visual Transforms based on Enter/Exit
    const opacity = useTransform(
        scrollY,
        // Enter -> Hold -> Exit
        [enterStart, enterEnd, exitStart, exitEnd],
        [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0]
    );

    const scale = useTransform(
        scrollY,
        [enterStart, enterEnd, exitStart, exitEnd],
        [isFirst ? 1 : 0.9, 1, 1, isLast ? 1 : 0.9]
    );

    const filter = useTransform(
        scrollY,
        [enterStart, enterEnd, exitStart, exitEnd],
        [isFirst ? "blur(0px)" : "blur(10px)", "blur(0px)", "blur(0px)", isLast ? "blur(0px)" : "blur(10px)"]
    );

    // Improve performance
    const willChange = useTransform(scrollY, (v) => {
        if (v >= start - vh && v <= end + vh) {
            return "opacity, transform, filter";
        }
        return "auto";
    });

    // Visibility optimization: Hide if completely out of timeline
    const display = useTransform(scrollY, (v) => {
        if (v < start - vh || v > end + vh) return "none";
        return "flex";
    });

    // POINTER EVENTS FIX:
    // Only enable pointer events when the section is significantly visible (opacity > 0.5)
    // This prevents "future" sections (which sit on top) from blocking clicks on "current" sections
    // while they are transparent.
    const pointerEvents = useTransform(
        scrollY,
        // Active range roughly around enterEnd/exitStart
        (v) => (v >= enterEnd - fadePx && v <= exitStart + fadePx) ? "auto" : "none"
    );

    const contextValue = {
        enterProgress,
        exitProgress: isLast ? useTransform(scrollY, [0, 1], [0, 0]) : exitProgress,
        isVisible: true
    };

    return (
        <SectionContext.Provider value={contextValue}>
            <motion.div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100vh", // Viewport height
                    display,
                    opacity,
                    scale,
                    filter,
                    zIndex: i, // Stack order
                    willChange
                }}
                className="flex flex-col items-center justify-start overflow-hidden pointer-events-none"
            >
                {/* 
                   Content Container 
                   We enable pointer-events auto here so buttons work, 
                   but the parent is pointer-events-none to let scroll pass through to body? 
                   Actually, fixed overlays block scrolling. 
                   Solution: The 'body' has the height. We scroll the body. 
                   These fixed elements just sit on top. 
                   So we need pointer-events-none on the fixed container, 
                   BUT pointer-events-auto on the interactive children.
                */}
                <motion.div
                    style={{ y: yTransform, pointerEvents }}
                    className="w-full flex-shrink-0"
                >
                    {children}
                </motion.div>
            </motion.div>
        </SectionContext.Provider>
    );
};


// =========================================
// DESKTOP COMPONENT (Unchanged Legacy Logic)
// =========================================
const DesktopSection = ({
    children,
    i,
    progress,
    total,
}: {
    children: React.ReactNode;
    i: number;
    progress: MotionValue<number>;
    total: number;
}) => {
    const start = i / total;
    const end = (i + 1) / total;
    const prevStart = (i - 1) / total;
    const isLast = i === total - 1;

    // EXIT: Current section fading out
    const exitProgress = useTransform(progress, [start, end], [0, 1]);

    // ENTER: Previous section fading out (revealing this one)
    const enterProgress = useTransform(
        progress,
        [prevStart, start],
        [0, 1]
    );

    const opacity = useTransform(exitProgress, [0, 1], [1, 0]);
    const scale = useTransform(exitProgress, [0, 1], [1, 0.8]);
    const filter = useTransform(exitProgress, [0, 1], ["blur(0px)", "blur(10px)"]);

    const zIndex = total - i;

    const contextValue = {
        enterProgress: i === 0 ? useTransform(progress, [0, 1], [1, 1]) : enterProgress,
        exitProgress: isLast ? useTransform(progress, [0, 1], [0, 0]) : exitProgress,
        isVisible: true,
    };

    return (
        <SectionContext.Provider value={contextValue}>
            <motion.div
                style={{
                    zIndex,
                    opacity: isLast ? 1 : opacity,
                    scale: isLast ? 1 : scale,
                    filter: isLast ? undefined : filter,
                }}
                className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-background"
            >
                {children}
            </motion.div>
        </SectionContext.Provider>
    );
};

export const ImmersiveScroll = ({ children }: ImmersiveScrollProps) => {
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);

    const childrenArray = React.Children.toArray(children);
    const total = childrenArray.length;

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    if (isMobile) {
        return <MobileSmartScroll>{children}</MobileSmartScroll>;
    }

    // Desktop Layout: Sticky stack
    return (
        <div ref={containerRef} style={{ height: `${total * 250}vh` }} className="relative">
            <div className="sticky top-0 h-screen overflow-hidden">
                {childrenArray.map((child, i) => (
                    <DesktopSection
                        key={i}
                        i={i}
                        progress={scrollYProgress}
                        total={total}
                    >
                        {child}
                    </DesktopSection>
                ))}
            </div>
        </div>
    );
};
