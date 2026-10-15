import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-[background-color,border-color,color] duration-[180ms] ease-out disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover",
        secondary: "border border-line bg-chip text-ink hover:border-line-strong hover:bg-board",
        outline: "border border-line bg-white text-ink hover:border-line-strong hover:bg-primary-soft",
        ghost: "bg-transparent text-ink hover:bg-canvas",
        destructive: "bg-danger text-white hover:bg-danger-hover",
        danger: "bg-danger text-white hover:bg-danger-hover",
        teal: "bg-teal text-white hover:bg-teal-hover",
      },
      size: {
        sm: "h-10 px-3.5",
        md: "h-11 px-4",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }) {
  const classNames = cn(buttonVariants({ variant, size }), className);
  if (asChild) return <Slot className={classNames} {...props}>{children}</Slot>;
  return (
    <button className={classNames} aria-busy={loading || undefined} disabled={disabled || loading} {...props}>
      {children}
    </button>
  );
}

export { buttonVariants };
