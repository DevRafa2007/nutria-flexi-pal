import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface ImmersiveScrollProps {
  children: React.ReactNode;
}

const springConfig = { stiffness: 80, damping: 30, mass: 0.8 };

const ImmersiveSection = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Raw transforms
  const rawOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.35, 0.65, 0.85, 1],
    [0, 0.6, 1, 1, 0.6, 0]
  );
  const rawY = useTransform(
    scrollYProgress,
    [0, 0.15, 0.35, 0.65, 0.85, 1],
    [120, 40, 0, 0, -40, -120]
  );
  const rawScale = useTransform(
    scrollYProgress,
    [0, 0.15, 0.35, 0.65, 0.85, 1],
    [0.88, 0.95, 1, 1, 0.95, 0.88]
  );
  const rawBlur = useTransform(
    scrollYProgress,
    [0, 0.15, 0.35, 0.65, 0.85, 1],
    [8, 2, 0, 0, 2, 8]
  );

  // Spring-smoothed values for buttery feel
  const opacity = useSpring(rawOpacity, springConfig);
  const y = useSpring(rawY, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const blur = useSpring(rawBlur, springConfig);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  // Hero section: only scale + subtle blur, no fade from bottom
  if (index === 0) {
    const heroOpacity = useTransform(
      scrollYProgress,
      [0, 0.6, 0.85, 1],
      [1, 1, 0.5, 0]
    );
    const heroScale = useTransform(
      scrollYProgress,
      [0, 0.6, 0.85, 1],
      [1, 1, 0.92, 0.85]
    );
    const heroBlur = useTransform(
      scrollYProgress,
      [0, 0.6, 0.85, 1],
      [0, 0, 4, 10]
    );
    const smoothHeroOpacity = useSpring(heroOpacity, springConfig);
    const smoothHeroScale = useSpring(heroScale, springConfig);
    const smoothHeroBlur = useSpring(heroBlur, springConfig);
    const heroFilter = useTransform(smoothHeroBlur, (v) => `blur(${v}px)`);

    return (
      <motion.div
        ref={ref}
        style={{
          opacity: smoothHeroOpacity,
          scale: smoothHeroScale,
          filter: heroFilter,
        }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale, filter }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
};

export const ImmersiveScroll = ({ children }: ImmersiveScrollProps) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="relative">
      {childrenArray.map((child, i) => (
        <ImmersiveSection key={i} index={i}>
          {child}
        </ImmersiveSection>
      ))}
    </div>
  );
};
