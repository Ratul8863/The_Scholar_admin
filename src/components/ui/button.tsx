import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("disabled:pointer-events-none", {
  variants: {
    variant: {
      primary: "go-pill",
      secondary: "nav-pill",
      outline: "open-pill",
      ghost: "nav-pill",
      destructive: "danger-pill",
      danger: "danger-pill",
      teal: "go-pill",
    },
    size: {
      sm: "",
      md: "",
      icon: "icon-circle",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

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
