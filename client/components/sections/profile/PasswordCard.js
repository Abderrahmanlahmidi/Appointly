"use client";

import React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

export default function PasswordCard() {
  const [passwordMessage, setPasswordMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
    watch,
  } = passwordForm;

  const newPassword = watch("newPassword");

  const passwordMutation = useMutation({
    mutationFn: async (values) => {
      const response = await axios.post("/api/profile/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      setPasswordMessage("Password updated successfully.");
      setPasswordError("");
      resetPassword();
    },
    onError: (err) => {
      setPasswordMessage("");
      setPasswordError(
        err?.response?.data?.error ?? "Unable to update password."
      );
    },
  });

  const onPasswordSubmit = (values) => {
    setPasswordMessage("");
    setPasswordError("");
    passwordMutation.mutate(values);
  };

  return (
    <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="text-sm text-[#4B4B4B]">
          Update your password to keep your account secure.
        </p>
      </div>

      <form
        onSubmit={handleSubmitPassword(onPasswordSubmit)}
        className="grid gap-4"
      >
        <div>
          <label className="text-xs font-medium text-[#2D2D2D]">
            Current password
          </label>
          <Input
            className="mt-2"
            type="password"
            placeholder="Current password"
            icon={Shield}
            {...registerPassword("currentPassword", {
              required: "Current password is required",
            })}
          />
          {passwordErrors.currentPassword ? (
            <p className="mt-2 text-xs text-[#EA3A30]">
              {passwordErrors.currentPassword.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-xs font-medium text-[#2D2D2D]">
            New password
          </label>
          <Input
            className="mt-2"
            type="password"
            placeholder="New password"
            icon={Shield}
            {...registerPassword("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
          {passwordErrors.newPassword ? (
            <p className="mt-2 text-xs text-[#EA3A30]">
              {passwordErrors.newPassword.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-xs font-medium text-[#2D2D2D]">
            Confirm new password
          </label>
          <Input
            className="mt-2"
            type="password"
            placeholder="Confirm new password"
            icon={Shield}
            {...registerPassword("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            })}
          />
          {passwordErrors.confirmPassword ? (
            <p className="mt-2 text-xs text-[#EA3A30]">
              {passwordErrors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        {passwordMessage ? (
          <p className="text-xs text-[#037347]">{passwordMessage}</p>
        ) : null}
        {passwordError ? (
          <p className="text-xs text-[#EA3A30]">{passwordError}</p>
        ) : null}

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={passwordMutation.isPending}
        >
          {passwordMutation.isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </section>
  );
}
