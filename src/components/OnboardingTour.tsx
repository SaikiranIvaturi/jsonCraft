import { useState } from "react";
import { Wand2, GitCompare, Share2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ONBOARDED_KEY = "jsoncraft-v1-onboarded";

const STEPS = [
  {
    icon: null,
    title: "Welcome to JSONCraft",
    description:
      "A free, privacy-first JSON toolkit. Everything runs in your browser — your data never leaves your device.",
    hint: null,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    icon: Wand2,
    title: "Format, Validate & Minify",
    description:
      "Paste any JSON and click Format. Errors are highlighted at the exact line as you type. Minify strips whitespace for API payloads.",
    hint: "Ctrl+Shift+F (⌘⇧F on Mac) formats instantly",
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
  },
  {
    icon: GitCompare,
    title: "Diff & Convert",
    description:
      "Switch to Diff to compare two JSONs side-by-side. Use Convert to generate TypeScript interfaces, YAML, CSV, or a JSON Schema.",
    hint: "Tap the Diff tab → paste two JSONs to compare",
    iconColor: "text-sky-500",
    iconBg: "bg-sky-500/10",
  },
  {
    icon: Share2,
    title: "Share & Multi-tab",
    description:
      "Hit Share to get a compressed URL anyone can open. Add up to 5 tabs to work on multiple JSONs at once.",
    hint: "Double-click a tab name to rename it",
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
];

interface OnboardingTourProps {
  onDone: () => void;
}

export function OnboardingTour({ onDone }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-5 p-6 animate-slideInUp">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${current.iconBg}`}>
            {Icon ? (
              <Icon className={`h-5 w-5 ${current.iconColor}`} />
            ) : (
              /* Gem logo for welcome step */
              <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${current.iconColor}`} aria-hidden="true">
                <path
                  d="M8 4h8l5 6-9 10L3 10l5-6z"
                  fill="currentColor" fillOpacity="0.18"
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                />
                <path
                  d="M8 4L12 10M16 4L12 10M12 4L12 10M3 10L21 10M12 10L12 20"
                  stroke="currentColor" strokeWidth="0.9"
                  strokeOpacity="0.65" strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <button
            onClick={onDone}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-base leading-snug">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          {current.hint && (
            <p className="text-xs text-primary bg-primary/8 rounded-lg px-3 py-2 mt-1">
              {current.hint}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === step
                    ? "w-4 bg-primary"
                    : i < step
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted-foreground/25"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                onClick={onDone}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Skip
              </button>
            )}
            <Button
              size="sm"
              onClick={isLast ? onDone : () => setStep((s) => s + 1)}
              className="gap-1.5"
            >
              {isLast ? "Get started" : "Next"}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
