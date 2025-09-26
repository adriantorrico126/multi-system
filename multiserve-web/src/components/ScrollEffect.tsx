import React, { useEffect, useState, useRef } from 'react';

interface ScrollEffectProps {
  children: React.ReactNode;
  effect: 'tech-reveal' | 'cyber-reveal' | 'hologram-reveal' | 'data-stream' | 'matrix-fall';
  delay?: number;
  duration?: number;
}

const ScrollEffect: React.FC<ScrollEffectProps> = ({ 
  children, 
  effect, 
  delay = 0, 
  duration = 1000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay]);

  const getEffectClass = () => {
    const baseClass = 'transition-all duration-1000 ease-out';
    
    switch (effect) {
      case 'tech-reveal':
        return `${baseClass} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`;
      case 'cyber-reveal':
        return `${baseClass} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`;
      case 'hologram-reveal':
        return `${baseClass} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`;
      case 'data-stream':
        return `${baseClass} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`;
      case 'matrix-fall':
        return `${baseClass} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`;
      default:
        return baseClass;
    }
  };

  return (
    <div ref={elementRef} className={getEffectClass()}>
      {children}
    </div>
  );
};

export default ScrollEffect;
