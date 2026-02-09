import React, { useRef, useEffect, useState } from "react";

interface ImmersiveScrollProps {
  children: React.ReactNode;
}

type VisibilityState = 'hidden' | 'entering' | 'visible' | 'exiting';

interface SectionProps {
  children: React.ReactNode;
  index: number;
}

const ImmersiveSection = ({ children, index }: SectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VisibilityState>(index === 0 ? 'visible' : 'hidden');
  const [intersectionRatio, setIntersectionRatio] = useState(index === 0 ? 1 : 0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Thresholds para detectar diferentes níveis de visibilidade
    const thresholds = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          setIntersectionRatio(ratio);

          // Determinar estado baseado na visibilidade
          if (ratio === 0) {
            setState('hidden');
          } else if (ratio < 0.3) {
            // Detectar se está entrando (vindo de baixo) ou saindo (indo para cima)
            const rect = entry.boundingClientRect;
            if (rect.top > 0) {
              setState('entering');
            } else {
              setState('exiting');
            }
          } else {
            setState('visible');
          }
        });
      },
      {
        threshold: thresholds,
        rootMargin: '0px',
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Calcular estilos baseados no estado e ratio
  const getStyles = (): React.CSSProperties => {
    const baseTransition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

    switch (state) {
      case 'hidden':
        return {
          opacity: 0,
          transform: 'translateY(30px) scale(0.98)',
          transition: baseTransition,
        };
      case 'entering':
        // Interpolação suave baseada no ratio
        const enterOpacity = Math.min(intersectionRatio * 3, 1);
        const enterY = Math.max(30 - (intersectionRatio * 100), 0);
        const enterScale = 0.98 + (intersectionRatio * 0.02);
        return {
          opacity: enterOpacity,
          transform: `translateY(${enterY}px) scale(${enterScale})`,
          transition: baseTransition,
        };
      case 'visible':
        return {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
          transition: baseTransition,
        };
      case 'exiting':
        // Fade out suave ao sair
        const exitOpacity = Math.max(intersectionRatio * 2, 0.1);
        const exitY = -((1 - intersectionRatio) * 20);
        return {
          opacity: exitOpacity,
          transform: `translateY(${exitY}px) scale(0.99)`,
          transition: baseTransition,
        };
    }
  };

  return (
    <div
      ref={ref}
      style={getStyles()}
      className="will-change-transform"
    >
      {children}
    </div>
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
