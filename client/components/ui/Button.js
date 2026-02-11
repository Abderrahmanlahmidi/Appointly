"use client";

import Link from "next/link";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition";

const variants = {
  primary:
    "bg-[#0F0F0F] text-white hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
  outline:
    "border border-[#0F0F0F] text-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white",
  soft:
    "border border-[#E0E0E0] bg-white text-[#0F0F0F] hover:bg-[#F6F6F6]",
  link: "text-[#0F0F0F] underline underline-offset-4",
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
