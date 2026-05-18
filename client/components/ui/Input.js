"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";

const baseInput =
  "w-full rounded-xl border-2 border-[var(--color-border)] bg-[rgba(255,255,255,0.05)] py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-4 focus:ring-black/20";

const Input = React.forwardRef(function Input(
  {
    icon: Icon,
    type = "text",
    className = "",
    inputClassName = "",
    allowToggle,
    ...rest
  },
  ref
) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = React.useState(false);
  const shouldToggle = allowToggle ?? isPassword;
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`relative ${className}`.trim()}>
      {Icon ? (
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
      ) : null}
      <input
        ref={ref}
        type={inputType}
        className={`${baseInput} ${
          Icon ? "pl-10" : "pl-4"
        } ${shouldToggle ? "pr-10" : "pr-3"} ${inputClassName}`.trim()}
        {...rest}
      />
      {shouldToggle ? (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      ) : null}
    </div>
  );
});

export default Input;
