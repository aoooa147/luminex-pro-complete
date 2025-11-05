'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Logo3DProps {
  size?: number;
  interactive?: boolean;
  className?: string;
}

const Logo3D: React.FC<Logo3DProps> = ({ 
  size = 160, 
  interactive = true,
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), {
    stiffness: 150,
    damping: 15
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), {
    stiffness: 150,
    damping: 15
  });

  useEffect(() => {
    if (!interactive || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      
      mouseX.set(x);
      mouseY.set(y);
      setMousePosition({ x, y });
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
      setMousePosition({ x: 0, y: 0 });
      setIsHovered(false);
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseenter', () => setIsHovered(true));

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={!interactive || !isHovered ? {
          rotateY: [0, 360],
        } : {}}
        transition={!interactive || !isHovered ? {
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        } : {}}
      >
        {/* Outermost faint rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`outer-ring-${i}`}
            className="absolute inset-0 rounded-full border border-yellow-600/10"
            style={{
              width: `${100 + (i + 1) * 20}%`,
              height: `${100 + (i + 1) * 20}%`,
              left: `-${(i + 1) * 10}%`,
              top: `-${(i + 1) * 10}%`,
              transform: `translateZ(${-i * 5}px)`,
              boxShadow: `0 0 ${20 + i * 10}px rgba(234, 179, 8, ${0.05 - i * 0.01})`,
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}

        {/* Dashed outer ring with glowing dots */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: '120%',
            height: '120%',
            left: '-10%',
            top: '-10%',
            transform: 'translateZ(10px)',
            border: '2px dashed rgba(234, 179, 8, 0.4)',
            boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)',
            borderDasharray: '8 6',
          } as React.CSSProperties}
          animate={{
            rotate: [0, 360],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            rotate: {
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            },
            opacity: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          {/* Glowing dots on dashed ring */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const radius = 50;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <motion.div
                key={`dot-${i}`}
                className="absolute rounded-full bg-yellow-400"
                style={{
                  width: '6px',
                  height: '6px',
                  left: `calc(50% + ${x}% - 3px)`,
                  top: `calc(50% + ${y}% - 3px)`,
                  boxShadow: '0 0 10px rgba(234, 179, 8, 0.8), 0 0 20px rgba(234, 179, 8, 0.5)',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </motion.div>

        {/* Solid golden ring (beveled) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: '110%',
            height: '110%',
            left: '-5%',
            top: '-5%',
            transform: 'translateZ(5px)',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.8) 0%, rgba(217, 119, 6, 0.9) 50%, rgba(234, 179, 8, 0.8) 100%)',
            border: '2px solid rgba(251, 191, 36, 0.6)',
            boxShadow: `
              inset 0 2px 4px rgba(255, 255, 255, 0.3),
              inset 0 -2px 4px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(234, 179, 8, 0.5),
              0 0 40px rgba(234, 179, 8, 0.3)
            `,
          }}
        />

        {/* Central golden circle with 3D effect */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            transform: 'translateZ(15px)',
            background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 25%, #d4af37 50%, #b8941f 75%, #d4af37 100%)',
            boxShadow: `
              inset 0 4px 8px rgba(255, 255, 255, 0.4),
              inset 0 -4px 8px rgba(0, 0, 0, 0.4),
              0 0 30px rgba(234, 179, 8, 0.6),
              0 0 60px rgba(234, 179, 8, 0.4),
              0 10px 40px rgba(0, 0, 0, 0.5)
            `,
          }}
          animate={{
            boxShadow: [
              'inset 0 4px 8px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.4), 0 0 30px rgba(234, 179, 8, 0.6), 0 0 60px rgba(234, 179, 8, 0.4), 0 10px 40px rgba(0, 0, 0, 0.5)',
              'inset 0 4px 8px rgba(255, 255, 255, 0.5), inset 0 -4px 8px rgba(0, 0, 0, 0.3), 0 0 40px rgba(234, 179, 8, 0.8), 0 0 80px rgba(234, 179, 8, 0.5), 0 10px 40px rgba(0, 0, 0, 0.5)',
              'inset 0 4px 8px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.4), 0 0 30px rgba(234, 179, 8, 0.6), 0 0 60px rgba(234, 179, 8, 0.4), 0 10px 40px rgba(0, 0, 0, 0.5)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner content with L and LUMINEX text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Large 3D Letter L */}
            <motion.div
              className="relative"
              style={{
                fontSize: `${size * 0.35}px`,
                fontWeight: 900,
                color: '#f4d03f',
                textShadow: `
                  2px 2px 0px rgba(0, 0, 0, 0.5),
                  4px 4px 8px rgba(0, 0, 0, 0.3),
                  0 0 20px rgba(251, 191, 36, 0.6),
                  inset -2px -2px 4px rgba(0, 0, 0, 0.2)
                `,
                transform: 'translateZ(5px)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.05em',
              }}
              animate={{
                textShadow: [
                  '2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(251, 191, 36, 0.6), inset -2px -2px 4px rgba(0, 0, 0, 0.2)',
                  '3px 3px 0px rgba(0, 0, 0, 0.5), 6px 6px 12px rgba(0, 0, 0, 0.3), 0 0 30px rgba(251, 191, 36, 0.8), inset -2px -2px 4px rgba(0, 0, 0, 0.2)',
                  '2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(251, 191, 36, 0.6), inset -2px -2px 4px rgba(0, 0, 0, 0.2)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              L
            </motion.div>

            {/* LUMINEX text */}
            <motion.div
              className="relative mt-1"
              style={{
                fontSize: `${size * 0.12}px`,
                fontWeight: 700,
                color: '#f4d03f',
                textShadow: `
                  1px 1px 0px rgba(0, 0, 0, 0.5),
                  2px 2px 4px rgba(0, 0, 0, 0.3),
                  0 0 10px rgba(251, 191, 36, 0.5)
                `,
                transform: 'translateZ(5px)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              LUMINEX
            </motion.div>

            {/* Inner highlight for 3D effect */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 60%)',
                transform: 'translateZ(2px)',
              }}
            />
          </div>
        </motion.div>

        {/* Ambient glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.2) 0%, transparent 70%)',
            transform: 'translateZ(-10px)',
            filter: 'blur(20px)',
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  );
};

export default Logo3D;
