"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Alert from "../../ui/Alert";
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Chrome,
  Users,
  Calendar,
  Receipt,
} from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [formAlert, setFormAlert] = React.useState(null);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post("/api/register", data);
      return res.data;
    },
    onSuccess: () => {
      setFormAlert({
        variant: "success",
        title: "Account created",
        message: "Your account is ready. Redirecting to sign in...",
      });
      setTimeout(() => {
        router.push("/login");
      }, 1100);
    },
    onError: (error) => {
      setFormAlert({
        variant: "error",
        title: "Registration failed",
        message: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const onSubmit = (data) => {
    setFormAlert(null);
    mutation.mutate(data);
  };

  const password = watch("password", "");

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#0F0F0F]">
      <div className="pointer-events-none absolute left-6 top-20 hidden w-60 rounded-2xl border border-[#E0E0E0] bg-white p-4 lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D2D2D]">
          <Users className="h-4 w-4 text-[#0F0F0F]" />
          Client list
        </div>
        <p className="mt-3 text-xs text-[#4B4B4B]">
          Grow your repeat customers with automated reminders.
        </p>
      </div>

      <div className="pointer-events-none absolute right-8 top-14 hidden w-52 rounded-2xl border border-[#E0E0E0] bg-white p-4 xl:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D2D2D]">
          <Calendar className="h-4 w-4 text-[#0F0F0F]" />
          Smart booking
        </div>
        <p className="mt-3 text-xs text-[#4B4B4B]">
          Sync availability and accept bookings 24/7.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-16 right-10 hidden w-56 rounded-2xl border border-[#E0E0E0] bg-white p-4 lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D2D2D]">
          <Receipt className="h-4 w-4 text-[#0F0F0F]" />
          Invoices ready
        </div>
        <p className="mt-3 text-xs text-[#4B4B4B]">
          Send branded invoices in seconds with Appointly.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[0.7rem] font-semibold text-[#037347]">
          Get paid faster
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen items-center justify-center px-5 py-14">
        <div className="w-full max-w-[480px] rounded-2xl border border-[#E0E0E0] bg-white p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="font-[var(--font-display)] text-base font-semibold tracking-tight">
              Appointly
            </div>
            <div className="rounded-full border border-[#E0E0E0] px-3 py-1 text-[0.7rem] font-medium text-[#4B4B4B]">
              Get started
            </div>
          </div>

          <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#4B4B4B]">
            Create categories, define services, and start booking clients.
          </p>
          {formAlert ? (
            <Alert
              className="mt-5"
              variant={formAlert.variant}
              title={formAlert.title}
              message={formAlert.message}
              onClose={() => setFormAlert(null)}
            />
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="firstname">
                  First name
                </label>
                <Input
                  id="firstname"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Ava"
                  icon={User}
                  className="mt-2"
                  {...register("firstname", { required: "First Name is required" })}
                />
                {errors.firstname && (
                  <p className="mt-2 text-xs text-[#EA3A30]">{errors.firstname.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="lastname">
                  Last name
                </label>
                <Input
                  id="lastname"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Johnson"
                  icon={User}
                  className="mt-2"
                  {...register("lastname", { required: "Last Name is required" })}
                />
                {errors.lastname && (
                  <p className="mt-2 text-xs text-[#EA3A30]">{errors.lastname.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                icon={Mail}
                className="mt-2"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-[#EA3A30]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="phone">
                Phone
              </label>
              <Input
                id="phone"
                type="text"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                icon={Phone}
                className="mt-2"
                {...register("phone", { required: "Phone is required" })}
              />
              {errors.phone && (
                <p className="mt-2 text-xs text-[#EA3A30]">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                icon={Lock}
                className="mt-2"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && (
                <p className="mt-2 text-xs text-[#EA3A30]">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="confirmPassword">
                Confirm password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                icon={Lock}
                className="mt-2"
                {...register("confirmPassword", {
                  required: "Confirm Password is required",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-[#EA3A30]">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              <span>
                {mutation.isPending ? "Creating account..." : "Create account"}
              </span>
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-[#4B4B4B]">
            <span className="h-px flex-1 bg-[#E0E0E0]" />
            or
            <span className="h-px flex-1 bg-[#E0E0E0]" />
          </div>

          <Button
            variant="soft"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/login" })}
          >
            <Chrome size={18} />
            Continue with Google
          </Button>

          <p className="mt-4 text-center text-sm text-[#4B4B4B]">
            Already have an account?{" "}
            <Button
              variant="link"
              onClick={() => router.push("/login")}
              className="font-semibold"
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
