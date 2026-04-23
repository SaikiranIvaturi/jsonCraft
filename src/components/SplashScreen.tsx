import { useState, useEffect, useRef } from "react";

const BOOT_LINES = [
  "Initializing JSON engine...",
  "Loading syntax validator...",
  "Building tree renderer...",
  "Mounting diff engine...",
  "All systems ready.",
];

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [scanY, setScanY] = useState(0);
  const scanRef = useRef<number>(0);

  useEffect(() => {
    // Scan line animation
    let raf: number;
    const animate = () => {
      scanRef.current = (scanRef.current + 0.4) % 110;
      setScanY(scanRef.current);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    // Boot sequence
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => {
            setVisibleLines(i + 1);
            setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
          },
          250 + i * 280,
        ),
      );
    });

    const totalMs = 250 + BOOT_LINES.length * 280;
    timers.push(setTimeout(() => setExiting(true), totalMs + 600));
    timers.push(setTimeout(() => onDone(), totalMs + 1050));

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      style={{
        transition: "opacity 450ms ease",
        opacity: exiting ? 0 : 1,
        pointerEvents: exiting ? "none" : "all",
        backgroundImage: `radial-gradient(circle, rgba(113, 113, 122, 0.08) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    >
      {/* Scanning line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          top: `${scanY}%`,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.25) 40%, rgba(139, 92, 246, 0.5) 50%, rgba(139, 92, 246, 0.25) 60%, transparent 100%)",
          filter: "blur(1px)",
        }}
      />

      {/* HUD corners */}
      {[
        "top-6 left-6",
        "top-6 right-6",
        "bottom-6 left-6",
        "bottom-6 right-6",
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute w-5 h-5 ${pos}`}
          style={{
            borderTop: i < 2 ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
            borderBottom: i >= 2 ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
            borderLeft:
              i % 2 === 0 ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
            borderRight:
              i % 2 === 1 ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
          }}
        />
      ))}

      {/* Center content */}
      <div className="flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <span
            className="text-[52px] font-black text-primary leading-none select-none"
            style={{
              fontFamily: "monospace",
              textShadow:
                "0 0 15px rgba(139, 92, 246, 0.9), 0 0 35px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2)",
            }}
          >
            {"{"}
          </span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[22px] font-bold tracking-tight text-foreground leading-none">
              JSONCraft
            </span>
            <span className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground/50 leading-none">
              JSON Toolkit
            </span>
          </div>
          <span
            className="text-[52px] font-black text-primary leading-none select-none"
            style={{
              fontFamily: "monospace",
              textShadow:
                "0 0 15px rgba(139, 92, 246, 0.9), 0 0 35px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2)",
            }}
          >
            {"}"}
          </span>
        </div>

        {/* Boot lines */}
        <div className="w-[280px] flex flex-col gap-[9px]">
          {BOOT_LINES.map((line, i) => {
            const shown = i < visibleLines;
            const done =
              shown && (i < visibleLines - 1 || i === BOOT_LINES.length - 1);
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 font-mono text-[11px]"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? "translateY(0)" : "translateY(5px)",
                  transition: "opacity 200ms ease, transform 200ms ease",
                }}
              >
                <span
                  style={{
                    color: done ? "hsl(142 71% 45%)" : "#8b5cf6",
                    textShadow: done
                      ? "0 0 8px hsl(142 71% 45% / 0.6)"
                      : "0 0 8px rgba(139, 92, 246, 0.6)",
                  }}
                >
                  {done ? "✓" : "›"}
                </span>
                <span className="text-muted-foreground/70">{line}</span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-[280px] flex flex-col gap-2">
          <div
            className="h-[2px] w-full rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "#8b5cf6",
                boxShadow: "0 0 8px rgba(139, 92, 246, 0.8)",
                transition: "width 260ms ease-out",
              }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground/35">
            <span>v1.0.0</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
