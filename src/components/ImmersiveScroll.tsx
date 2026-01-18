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
// MOBILE SCROLLYTELLING ENGINE
// =========================================

const MobileSmartScroll = ({ children }: { children: React.ReactNode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const childrenArray = React.Children.toArray(children);
    const total = childrenArray.length;

    // SCROLLYTELLING TIMELINE ALLOCATION
    // We allocate "Time" (Height) to each section based on the complexity of its internal sequence.
    // The user wants "Step 1 -> Step 2 -> Step 3", so we need plenty of scroll space.
    const getSectionHeight = (index: number) => {
        if (index === 0) return 150;  // Hero - Quick intro
        if (index === 1) return 600;  // Features - Faster scroll
        if (index === 2) return 500;  // CTA - Faster scroll
        return 200;
    };

    const sectionHeights = childrenArray.map((_, i) => getSectionHeight(i));
    const totalVh = sectionHeights.reduce((a, b) => a + b, 0);

    // Calculate start points for timeline mapping
    const starts: number[] = [];
    let acc = 0;
    sectionHeights.forEach(h => {
        starts.push(acc);
        acc += h;
    });

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    return (
        <div ref={containerRef} style={{ height: `${totalVh}vh` }} className="relative bg-background">
            <div className="sticky top-0 h-[100dvh] overflow-hidden">
                {childrenArray.map((child, i) => (
                    <MobileScrollyTellingSection
                        key={i}
                        i={i}
                        totalHeight={totalVh}
                        myStart={starts[i]}
                        myHeight={sectionHeights[i]}
                        progress={scrollYProgress}
                        total={total}
                    >
                        {child}
                    </MobileScrollyTellingSection>
                ))}
            </div>
        </div>
    );
};

const MobileScrollyTellingSection = ({
    children,
    i,
    progress,
    total,
    totalHeight,
    myStart,
    myHeight
}: {
    children: React.ReactNode;
    i: number;
    progress: MotionValue<number>;
    total: number;
    totalHeight: number;
    myStart: number;
    myHeight: number;
}) => {
    // SCROLLYTELLING LOGIC
    // We are fixed on screen.
    // 'activeProgress' goes 0 -> 1 during our allocated slot.
    // This drives our internal animation timeline.

    // Timeline Window
    const safeTotal = totalHeight || 1;
    const startNorm = myStart / safeTotal;
    const endNorm = (myStart + myHeight) / safeTotal;

    // Active Progress: 0 to 1 mapping of our specific slot
    const activeProgress = useTransform(progress, [startNorm, endNorm], [0, 1]);

    // Visibility/Transition Logic
    // Stack Order: Higher index = Lower Z-Index (Top card covers bottom).
    // Transition: When we reach end of our slot (1), we FADE OUT to reveal the next card.

    const zIndex = total - i;
    const isLast = i === total - 1;
    const isFirst = i === 0;
    const entranceRange = [0, 0.15];

    // Fade Out at the very end
    // Exit Animation (Last 8% of scroll - section is visible until 92%)
    const exitRange = [0.92, 1];

    const opacity = isFirst
        ? (isLast ? useMotionValue(1) : useTransform(activeProgress, exitRange, [1, 0]))
        : (isLast
            ? useTransform(activeProgress, entranceRange, [0, 1])
            : useTransform(activeProgress, (v) => {
                if (v < entranceRange[1]) return (v - entranceRange[0]) / (entranceRange[1] - entranceRange[0]);
                if (v > exitRange[0]) return 1 - (v - exitRange[0]) / (exitRange[1] - exitRange[0]);
                return 1;
            }));

    // Scale down to 0.9 to simulate "moving back"
    const scale = isFirst
        ? (isLast ? useMotionValue(1) : useTransform(activeProgress, exitRange, [1, 0.9]))
        : (isLast
            ? useTransform(activeProgress, entranceRange, [0.9, 1])
            : useTransform(activeProgress, (v) => {
                if (v < entranceRange[1]) {
                    const p = (v - entranceRange[0]) / (entranceRange[1] - entranceRange[0]);
                    return 0.9 + (p * 0.1);
                }
                if (v > exitRange[0]) {
                    const p = (v - exitRange[0]) / (exitRange[1] - exitRange[0]);
                    return 1 - (p * 0.1);
                }
                return 1;
            }));

    // Blur to simulate depth of field exit
    const filter = isFirst
        ? (isLast ? useMotionValue("blur(0px)") : useTransform(activeProgress, exitRange, ["blur(0px)", "blur(10px)"]))
        : (isLast
            ? useTransform(activeProgress, entranceRange, ["blur(10px)", "blur(0px)"])
            : useTransform(activeProgress, (v) => {
                if (v < entranceRange[1]) {
                    const p = (v - entranceRange[0]) / (entranceRange[1] - entranceRange[0]);
                    return `blur(${10 - (p * 10)}px)`;
                }
                if (v > exitRange[0]) {
                    const p = (v - exitRange[0]) / (exitRange[1] - exitRange[0]);
                    return `blur(${p * 10}px)`;
                }
                return "blur(0px)";
            }));

    const pointerEvents = useTransform(opacity, v => v < 0.1 ? "none" : "auto");

    const contextValue = {
        enterProgress: i === 0
            ? activeProgress
            : useTransform(activeProgress, [entranceRange[1], 1], [0, 1]), // Só começa após entrada completa
        exitProgress: useMotionValue(0),
        isVisible: true,
    };

    return (
        <SectionContext.Provider value={contextValue}>
            <motion.div
                style={{
                    zIndex,
                    opacity,
                    scale,
                    filter,
                    pointerEvents
                }}
                className="absolute top-0 left-0 w-full h-full bg-background flex items-center justify-center overflow-hidden"
            >
                <div className="w-full h-full relative">
                    {children}
                </div>
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

    const pointerEvents = useTransform(opacity, v => v < 0.1 ? "none" : "auto");

    return (
        <SectionContext.Provider value={contextValue}>
            <motion.div
                style={{
                    zIndex,
                    opacity: isLast ? 1 : opacity,
                    scale: isLast ? 1 : scale,
                    filter: isLast ? undefined : filter,
                    pointerEvents: isLast ? "auto" : pointerEvents,
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
