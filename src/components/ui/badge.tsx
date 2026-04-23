import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/20 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/20 text-destructive',
        outline: 'border-border text-foreground',
        string: 'border-transparent bg-green-500/15 text-green-600 dark:text-green-400',
        number: 'border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        boolean: 'border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400',
        null: 'border-transparent bg-zinc-500/15 text-zinc-500',
        array: 'border-transparent bg-pink-500/15 text-pink-600 dark:text-pink-400',
        object: 'border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
