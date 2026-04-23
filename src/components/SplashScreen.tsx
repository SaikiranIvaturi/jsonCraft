import { useState, useEffect } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [tagVisible, setTagVisible] = useState(false);
  const [lineWidth, setLineWidth] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setLogoVisible(true), 60));
    t.push(setTimeout(() => setTagVisible(true), 340));
    t.push(setTimeout(() => setLineWidth(100), 420));
    t.push(setTimeout(() => setExiting(true), 1300));
    t.push(setTimeout(() => onDone(), 1700));
    return () => t.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      style={{
        opacity: exiting ? 0 : 1,
        transition: exiting
          ? "opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)"
          : "none",
        pointerEvents: exiting ? "none" : "all",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="flex flex-col items-center gap-5">
        {/* Logo mark */}
        <div
          className="flex items-center gap-5 select-none"
          style={{
            opacity: logoVisible ? 1 : 0,
            transform: logoVisible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
            transition:
              "opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span
            className="text-primary leading-none"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 50,
              fontWeight: 800,
              opacity: 0.85,
            }}
          >
            {"{"}
          </span>
          <div className="flex flex-col items-center gap-1.5">
            <span
              className="text-foreground leading-none"
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              JSONCraft
            </span>
          </div>
          <span
            className="text-primary leading-none"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 50,
              fontWeight: 800,
              opacity: 0.85,
            }}
          >
            {"}"}
          </span>
        </div>

        {/* Tagline */}
        <p
          className="text-muted-foreground uppercase tracking-widest"
          style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.22em",
            opacity: tagVisible ? 0.45 : 0,
            transform: tagVisible ? "translateY(0)" : "translateY(5px)",
            transition: "opacity 500ms ease, transform 500ms ease",
          }}
        >
          Format&nbsp;&nbsp;·&nbsp;&nbsp;Validate&nbsp;&nbsp;·&nbsp;&nbsp;Compare
        </p>
      </div>

      {/* Bottom sweep */}
      <div
        className="absolute bottom-0 left-0"
        style={{
          height: 1,
          width: `${lineWidth}%`,
          background:
            "linear-gradient(90deg, transparent 0%, var(--primary) 35%, var(--primary) 65%, transparent 100%)",
          opacity: 0.5,
          transition: "width 1000ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}
