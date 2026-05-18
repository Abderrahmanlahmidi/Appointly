"use client";

import Link from "next/link";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition";

const variants = {
  primary:
    "bg-[var(--color-white)] text-black hover:-translate-y-0.5 hover:bg-[var(--color-muted-strong)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
  outline:
    "border-2 border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[rgba(255,255,255,0.12)] hover:text-[var(--color-foreground)]",
  soft:
    "border-2 border-[var(--color-border)] bg-[rgba(255,255,255,0.05)] text-[var(--color-foreground)] hover:bg-[rgba(255,255,255,0.1)]",
  link: "text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-foreground)]",
};

const sizes = {
  sm: "px-4 py-2",
  md: "px-4 py-3",
  lg: "px-5 py-3",
};

export default function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  children,
  ...rest
}) {
  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = variant === "link" ? "" : sizes[size] || sizes.md;
  const classes = [baseStyles, variantStyles, sizeStyles, className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
}
