import React, { useEffect } from 'react';

const Confetti: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // Animation duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
      {[...Array(150)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            // @ts-ignore
            '--x': `${Math.random() * 100}vw`,
            '--angle': `${Math.random() * 360}deg`,
            '--delay': `${Math.random() * 4}s`,
            '--duration': `${2 + Math.random() * 2}s`,
            backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
          }}
        />
      ))}
      <style>{`
        .confetti {
          position: absolute;
          width: 10px;
          height: 20px;
          top: -30px;
          left: var(--x);
          animation: fall var(--duration) var(--delay) linear infinite;
        }

        @keyframes fall {
          from {
            transform: translateY(0) rotate(0deg);
          }
          to {
            transform: translateY(100vh) rotate(var(--angle));
          }
        }
      `}</style>
    </div>
  );
};

export default Confetti;
