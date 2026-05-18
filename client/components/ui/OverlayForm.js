"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import Button from "./Button";
import Input from "./Input";

const buildDefaultValues = (fields, defaults) => {
  const values = { ...(defaults || {}) };
  fields.forEach((field) => {
    if (values[field.name] === undefined) {
      if (field.defaultValue !== undefined) {
        values[field.name] = field.defaultValue;
      } else {
        values[field.name] = "";
      }
    }
  });
  return values;
};

const baseSelectClassName =
  "w-full rounded-xl border-2 border-[var(--color-border)] bg-[rgba(255,255,255,0.05)] px-4 py-3 pr-9 text-sm text-[var(--color-foreground)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-4 focus:ring-black/20";

export default function OverlayForm({
  mode = "create",
  open,
  title,
  description,
  fields = [],
  defaultValues = {},
  onSubmit,
  onCancel,
  submitText,
  submittingText,
  createTitle = "Create",
  updateTitle = "Update",
  createSubmitText = "Create",
  updateSubmitText = "Update",
  createSubmittingText = "Creating...",
  updateSubmittingText = "Updating...",
  cancelText = "Cancel",
  submitVariant = "primary",
  submitClassName = "",
  loading = false,
  disabled = false,
  formClassName = "",
  cardClassName = "",
}) {
  const [mounted, setMounted] = React.useState(false);

  const computedDefaults = React.useMemo(
    () => buildDefaultValues(fields, defaultValues),
    [fields, defaultValues]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: computedDefaults });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    reset(computedDefaults);
  }, [open, reset, computedDefaults]);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  React.useEffect(() => {
    if (!open || !mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const resolvedTitle =
    title ?? (mode === "update" ? updateTitle : createTitle);
  const resolvedSubmitText =
    submitText ?? (mode === "update" ? updateSubmitText : createSubmitText);
  const resolvedSubmittingText =
    submittingText ??
    (mode === "update" ? updateSubmittingText : createSubmittingText);
  const isBusy = loading || isSubmitting || disabled;
  const handleFormSubmit = (values) => onSubmit?.(values, mode);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-lg items-center justify-center px-4 py-6 sm:py-10">
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "w-full max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--color-border)] bg-[rgba(8,10,14,0.96)] p-6 shadow-xl",
            cardClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {resolvedTitle ? (
            <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-foreground)]">
              {resolvedTitle}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
          ) : null}

          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className={["mt-6 grid gap-4", formClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {fields.map((field) => {
              const fieldId = field.id ?? field.name;
              const rules = field.rules ?? {};
              const isSelectField = field.type === "select";
              const options = Array.isArray(field.options) ? field.options : [];
              return (
                <div key={field.name}>
                  {field.label ? (
                    <label
                      htmlFor={fieldId}
                      className="text-xs font-medium text-[var(--color-muted)]"
                    >
                      {field.label}
                    </label>
                  ) : null}
                  {isSelectField ? (
                    <select
                      id={fieldId}
                      className={[
                        "mt-2",
                        baseSelectClassName,
                        field.inputClassName,
                        field.className,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={isBusy || field.disabled}
                      {...register(field.name, rules)}
                      {...field.inputProps}
                    >
                      {field.placeholder ? (
                        <option value="">{field.placeholder}</option>
                      ) : null}
                      {options.map((option) => {
                        const rawValue =
                          typeof option === "object" ? option.value : option;
                        const rawLabel =
                          typeof option === "object" ? option.label : option;
                        const optionDisabled =
                          typeof option === "object" && option.disabled;
                        const value = String(rawValue ?? "");
                        const label = String(rawLabel ?? "");
                        return (
                          <option
                            key={`${field.name}-${value}`}
                            value={value}
                            disabled={Boolean(optionDisabled)}
                          >
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <Input
                      id={fieldId}
                      className={["mt-2", field.className]
                        .filter(Boolean)
                        .join(" ")}
                      inputClassName={field.inputClassName}
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      icon={field.icon}
                      allowToggle={field.allowToggle}
                      disabled={isBusy || field.disabled}
                      {...register(field.name, rules)}
                      {...field.inputProps}
                    />
                  )}
                  {errors?.[field.name] ? (
                    <p className="mt-2 text-xs text-[#ff95a9]">
                      {errors[field.name].message}
                    </p>
                  ) : null}
                </div>
              );
            })}

            <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="soft"
                className="w-full sm:w-auto"
                onClick={onCancel}
                disabled={isBusy}
              >
                {cancelText}
              </Button>
              <Button
                type="submit"
                variant={submitVariant}
                className={["w-full sm:w-auto", submitClassName]
                  .filter(Boolean)
                  .join(" ")}
                disabled={isBusy}
              >
                {isBusy ? resolvedSubmittingText : resolvedSubmitText}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
