import React, { useEffect, useState } from 'react';

interface HologramEffectProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'tech' | 'cyber' | 'hologram' | 'data';
}

const HologramEffect: React.FC<HologramEffectProps> = ({ 
  children, 
  intensity = 'medium',
  color = 'tech' 
}) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsActive(prev => !prev);
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  const getIntensityClass = () => {
    switch (intensity) {
      case 'low':
        return 'opacity-30';
      case 'medium':
        return 'opacity-50';
      case 'high':
        return 'opacity-70';
      default:
        return 'opacity-50';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'tech':
        return 'shadow-tech';
      case 'cyber':
        return 'shadow-cyber';
      case 'hologram':
        return 'shadow-hologram';
      case 'data':
        return 'shadow-data';
      default:
        return 'shadow-tech';
    }
  };

  return (
    <div className={`relative ${getIntensityClass()} ${getColorClass()}`}>
      {/* Efecto de distorsión holográfica */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-hologram-distort ${isActive ? 'animate-hologram-flicker' : ''}`} />
      
      {/* Efecto de escaneo */}
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-current to-transparent opacity-10 animate-hologram-scan ${isActive ? 'animate-hologram-flicker' : ''}`} />
      
      {/* Contenido principal */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Efecto de borde holográfico */}
      <div className={`absolute inset-0 border-2 border-current opacity-30 animate-hologram-flicker ${isActive ? 'animate-hologram-distort' : ''}`} />
    </div>
  );
};

export default HologramEffect;
