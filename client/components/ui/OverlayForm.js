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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={[
          "relative z-10 w-full max-w-lg rounded-2xl border border-[#E0E0E0] bg-white p-6 shadow-xl",
          cardClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {resolvedTitle ? (
          <h2 className="text-lg font-semibold text-[#0F0F0F]">
            {resolvedTitle}
          </h2>
        ) : null}
        {description ? (
          <p className="mt-2 text-sm text-[#4B4B4B]">{description}</p>
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
            return (
              <div key={field.name}>
                {field.label ? (
                  <label
                    htmlFor={fieldId}
                    className="text-xs font-medium text-[#2D2D2D]"
                  >
                    {field.label}
                  </label>
                ) : null}
                <Input
                  id={fieldId}
                  className={["mt-2", field.className].filter(Boolean).join(" ")}
                  inputClassName={field.inputClassName}
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  icon={field.icon}
                  allowToggle={field.allowToggle}
                  disabled={isBusy || field.disabled}
                  {...register(field.name, rules)}
                  {...field.inputProps}
                />
                {errors?.[field.name] ? (
                  <p className="mt-2 text-xs text-[#EA3A30]">
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
    </div>,
    document.body
  );
}
