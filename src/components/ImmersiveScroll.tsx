import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ImmersiveScrollProps {
  children: React.ReactNode;
}

const ImmersiveSection = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.3]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, -30]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.98]);

  // First section doesn't fade in from below
  if (index === 0) {
    return (
      <motion.div
        ref={ref}
        style={{ scale }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale }}
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
