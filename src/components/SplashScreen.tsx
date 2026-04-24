import { useState, useEffect } from "react";

// Faint JSON fragments scattered in the background for texture
const FRAGMENTS = [
  { text: '{ "type": "json" }',   x:  7, y: 13 },
  { text: '"parse": true',         x: 73, y: 21 },
  { text: '[ 1, 2, 3 ]',           x: 13, y: 67 },
  { text: '"valid": null',         x: 70, y: 63 },
  { text: '{ "key": "value" }',    x: 40, y: 88 },
  { text: '"schema": {}',          x: 82, y: 41 },
  { text: '[ "a", "b", "c" ]',     x:  4, y: 43 },
  { text: '"depth": 3',            x: 59, y:  7 },
];

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 80),   // bloom + brackets spring in
      setTimeout(() => setPhase(2), 460),  // rings ripple + name wipes in
      setTimeout(() => setPhase(3), 700),  // tagline rises
      setTimeout(() => setPhase(4), 880),  // scan line sweeps
      setTimeout(() => setPhase(5), 1450), // exit
    ];
    const done = setTimeout(onDone, 1880);
    return () => [...t, done].forEach(clearTimeout);
  }, [onDone]);

  const shown      = phase >= 1;
  const textIn     = phase >= 2;
  const tagIn      = phase >= 3;
  const scanning   = phase >= 4;
  const exiting    = phase >= 5;

  // Shared spring timing for the brackets
  const spring = "620ms cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        overflow: "hidden",
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 430ms cubic-bezier(0.4, 0, 1, 1)" : "none",
        pointerEvents: exiting ? "none" : "all",
      }}
    >
      {/* Radial bloom — purple glow behind the logo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 52% 44% at 50% 50%, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 70%)",
          opacity: shown ? 1 : 0,
          transition: "opacity 900ms ease",
          pointerEvents: "none",
        }}
      />

      {/* Second, tighter bloom that pulses with the ring flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 25% 20% at 50% 50%, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 70%)",
          opacity: textIn ? 0 : 0,
          transition: "opacity 600ms ease",
          pointerEvents: "none",
        }}
      />

      {/* Faint JSON fragments */}
      {FRAGMENTS.map((f, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--foreground)",
            opacity: shown ? 0.045 : 0,
            transition: `opacity 1200ms ease ${i * 55}ms`,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {f.text}
        </span>
      ))}

      {/* ── Logo group ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        {/* Brackets + brand name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>

          {/* Two expanding ripple rings that fire when the text appears */}
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 68,
                height: 68,
                marginLeft: -34,
                marginTop: -34,
                borderRadius: "50%",
                border: "1.5px solid var(--primary)",
                opacity: 0,
                animation: textIn
                  ? `ring-expand 650ms cubic-bezier(0.2, 0, 0.8, 1) ${i * 130}ms both`
                  : "none",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* { — springs in from the left */}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1,
              color: "var(--primary)",
              opacity: shown ? 0.88 : 0,
              transform: shown ? "translateX(0)" : "translateX(-72px)",
              transition: `opacity 380ms ease, transform ${spring}`,
              filter: textIn
                ? "drop-shadow(0 0 16px color-mix(in srgb, var(--primary) 60%, transparent))"
                : "none",
            }}
          >
            {"{"}
          </span>

          {/* JSONCraft — left-to-right clip-path wipe */}
          <span
            style={{
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "var(--foreground)",
              display: "block",
              whiteSpace: "nowrap",
              clipPath: textIn ? "inset(0 0% 0 0 round 2px)" : "inset(0 100% 0 0 round 2px)",
              transition: "clip-path 540ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            JSONCraft
          </span>

          {/* } — springs in from the right, 60ms stagger */}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1,
              color: "var(--primary)",
              opacity: shown ? 0.88 : 0,
              transform: shown ? "translateX(0)" : "translateX(72px)",
              transition: `opacity 380ms ease 60ms, transform ${spring} 60ms`,
              filter: textIn
                ? "drop-shadow(0 0 16px color-mix(in srgb, var(--primary) 60%, transparent))"
                : "none",
            }}
          >
            {"}"}
          </span>
        </div>

        {/* Tagline — slides up after the name */}
        <p
          style={{
            margin: 0,
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
            opacity: tagIn ? 0.48 : 0,
            transform: tagIn ? "translateY(0)" : "translateY(9px)",
            transition: "opacity 500ms ease, transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          Format&nbsp;&nbsp;·&nbsp;&nbsp;Validate&nbsp;&nbsp;·&nbsp;&nbsp;Compare
        </p>
      </div>

      {/* Bottom scan line with a bright leading edge */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          width: scanning ? "100%" : "0%",
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--primary) 35%, transparent) 12%, var(--primary) 78%, white 100%)",
          transition: scanning ? "width 1100ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        }}
      />
    </div>
  );
}
