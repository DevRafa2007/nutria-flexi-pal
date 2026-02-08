import React from "react";
import { motion } from "framer-motion";

interface ImmersiveScrollProps {
  children: React.ReactNode;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export const ImmersiveScroll = ({ children }: ImmersiveScrollProps) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="relative">
      {childrenArray.map((child, i) => (
        <motion.div
          key={i}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={sectionVariants}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};
