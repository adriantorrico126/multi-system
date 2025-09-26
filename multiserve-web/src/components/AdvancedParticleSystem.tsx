import React, { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  type: 'tech' | 'cyber' | 'hologram' | 'data';
  life: number;
  maxLife: number;
}

interface Connection {
  from: Particle;
  to: Particle;
  opacity: number;
}

const AdvancedParticleSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const colors = {
    tech: '#00d4ff',
    cyber: '#ff6b35',
    hologram: '#00ff88',
    data: '#ffaa00'
  };

  const particleTypes: ('tech' | 'cyber' | 'hologram' | 'data')[] = ['tech', 'cyber', 'hologram', 'data'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Crear partículas iniciales
    const initialParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      initialParticles.push(createParticle(canvas.width, canvas.height));
    }
    setParticles(initialParticles);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Loop de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Actualizar y dibujar partículas
      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map(particle => {
          // Actualizar posición
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life--;

          // Efectos de mouse
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            particle.vx += (dx / distance) * force * 0.1;
            particle.vy += (dy / distance) * force * 0.1;
          }

          // Rebote en bordes
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

          // Mantener en canvas
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
          particle.y = Math.max(0, Math.min(canvas.height, particle.y));

          // Dibujar partícula
          drawParticle(ctx, particle);

          return particle;
        }).filter(particle => particle.life > 0);

        // Agregar nuevas partículas
        if (updatedParticles.length < 50) {
          updatedParticles.push(createParticle(canvas.width, canvas.height));
        }

        // Crear conexiones
        const newConnections: Connection[] = [];
        for (let i = 0; i < updatedParticles.length; i++) {
          for (let j = i + 1; j < updatedParticles.length; j++) {
            const dx = updatedParticles[i].x - updatedParticles[j].x;
            const dy = updatedParticles[i].y - updatedParticles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              const opacity = (150 - distance) / 150;
              newConnections.push({
                from: updatedParticles[i],
                to: updatedParticles[j],
                opacity
              });
            }
          }
        }

        // Dibujar conexiones
        newConnections.forEach(connection => {
          drawConnection(ctx, connection);
        });

        return updatedParticles;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePos]);

  const createParticle = (width: number, height: number): Particle => {
    const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
    return {
      id: Math.random(),
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 1,
      color: colors[type],
      type,
      life: Math.random() * 300 + 200,
      maxLife: Math.random() * 300 + 200
    };
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const alpha = particle.life / particle.maxLife;
    
    ctx.save();
    ctx.globalAlpha = alpha;

    // Efectos específicos por tipo
    switch (particle.type) {
      case 'tech':
        // Partícula circular con glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        break;

      case 'cyber':
        // Partícula cuadrada con rotación
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(Date.now() * 0.001);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
        ctx.restore();
        break;

      case 'hologram':
        // Partícula con efecto holográfico
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.fill();
        break;

      case 'data':
        // Partícula con forma de datos
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.size, particle.y);
        ctx.lineTo(particle.x + particle.size, particle.y);
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x, particle.y + particle.size);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
    }

    ctx.restore();
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: Connection) => {
    ctx.save();
    ctx.globalAlpha = connection.opacity * 0.3;
    ctx.strokeStyle = connection.from.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(connection.from.x, connection.from.y);
    ctx.lineTo(connection.to.x, connection.to.y);
    ctx.stroke();
    ctx.restore();
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default AdvancedParticleSystem;
