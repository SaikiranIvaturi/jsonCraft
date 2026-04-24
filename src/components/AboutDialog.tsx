import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Code2, Layers, Zap } from "lucide-react";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SKILLS = ["React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js"];

const HIGHLIGHTS = [
  { icon: Code2,  text: "Clean, maintainable code" },
  { icon: Layers, text: "Scalable UI architecture" },
  { icon: Zap,    text: "Performance-first mindset" },
];

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">

        {/* Header band */}
        <div className="relative h-24 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex-shrink-0">
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 24px,white 24px,white 25px), repeating-linear-gradient(90deg,transparent,transparent 24px,white 24px,white 25px)",
            }}
          />
          {/* Avatar */}
          <div className="absolute -bottom-8 left-6 h-16 w-16 rounded-2xl border-4 border-background bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg tracking-tight select-none">ISK</span>
          </div>
        </div>

        {/* Body */}
        <div className="pt-12 px-6 pb-6 flex flex-col gap-4">

          {/* Name + title */}
          <div>
            <h2 className="text-base font-bold leading-tight">Ivaturi Sai Kiran</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Frontend Engineer</p>
          </div>

          {/* Bio */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            I build fast, polished web applications with a focus on developer experience
            and clean UI. Currently crafting tools like JSONCraft to make everyday
            dev workflows smoother.
          </p>

          {/* Highlights */}
          <div className="flex flex-col gap-1.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                {text}
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => (
              <span
                key={s}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTA */}
          <Button
            asChild
            className="w-full gap-2 mt-1"
          >
            <a
              href="https://cv-portfolio-orpin.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Portfolio
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
