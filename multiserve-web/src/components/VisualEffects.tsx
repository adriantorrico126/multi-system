import React, { useEffect, useState } from 'react';
import AdvancedParticleSystem from './AdvancedParticleSystem';

interface ParticleProps {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

const VisualEffects: React.FC = () => {
  const [particles, setParticles] = useState<ParticleProps[]>([]);

  useEffect(() => {
    // Crear partículas dinámicas con efectos tecnológicos
    const newParticles: ParticleProps[] = [];
    const colors = ['#00d4ff', '#ff6b35', '#00ff88', '#ffaa00'];
    
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5
      });
    }
    
    setParticles(newParticles);
  }, []);

  return (
    <>
      {/* Sistema de Partículas Avanzado */}
      <AdvancedParticleSystem />

      {/* Partículas flotantes sutiles */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {particles.slice(0, 10).map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: 0.3,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Efectos de gradiente animado tecnológico */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-tech-primary/5 via-tech-accent/5 to-tech-success/5 animate-tech-pulse"></div>
      </div>

      {/* Efectos de ondas tecnológicas */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-tech-primary/10 rounded-full blur-3xl animate-cyber-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-tech-accent/10 rounded-full blur-3xl animate-hologram-distort" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tech-success/10 rounded-full blur-3xl animate-data-flow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Efectos de Matrix Rain */}
      <div className="fixed inset-0 pointer-events-none z-5 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 w-px h-full bg-tech-primary animate-matrix-rain"
              style={{
                left: `${i * 5}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Efectos de Hologram Scan */}
      <div className="fixed inset-0 pointer-events-none z-5 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="w-full h-px bg-tech-success animate-hologram-scan"></div>
        </div>
      </div>
    </>
  );
};

export default VisualEffects;
