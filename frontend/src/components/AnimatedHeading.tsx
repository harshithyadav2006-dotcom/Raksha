import React, { useEffect, useState } from 'react';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
}

export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({ text, className = '' }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Small delay to ensure the component is mounted before triggering the animation
    const timer = setTimeout(() => {
      setIsRendered(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const lines = text.split('\n');

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          <span className="inline-block" style={{ whiteSpace: 'nowrap' }}>
            {line.split('').map((char, charIndex) => {
              const delay = (lineIndex * line.length * 30) + (charIndex * 30) + 200;
              return (
                <span
                  key={charIndex}
                  className="inline-block transition-all"
                  style={{
                    opacity: isRendered ? 1 : 0,
                    transform: isRendered ? 'translateX(0)' : 'translateX(-18px)',
                    transitionDuration: '500ms',
                    transitionDelay: `${delay}ms`,
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </span>
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};
