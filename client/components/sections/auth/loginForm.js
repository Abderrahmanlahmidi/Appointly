"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Alert from "../../ui/Alert";
import {
  Mail,
  Lock,
  ArrowRight,
  Chrome,
  Calendar,
  CreditCard,
  Shield,
} from "lucide-react";

export default function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = React.useState(false);
  const [formAlert, setFormAlert] = React.useState(null);

  const onSubmit = async (data) => {
    setFormAlert(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setFormAlert({
          variant: "error",
          title: "Sign in failed",
          message: result.error,
        });
      } else {
        setFormAlert({
          variant: "success",
          title: "Signed in",
          message: "You're now signed in. Redirecting...",
        });
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 900);
      }
    } catch (error) {
      setFormAlert({
        variant: "error",
        title: "Something went wrong",
        message: "Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#0F0F0F]">
      <div className="pointer-events-none absolute left-6 top-24 hidden w-56 rounded-2xl border border-[#E0E0E0] bg-white p-4 lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D2D2D]">
          <Calendar className="h-4 w-4 text-[#0F0F0F]" />
          Appointment board
        </div>
        <p className="mt-3 text-xs text-[#4B4B4B]">
          12 upcoming client visits scheduled today.
        </p>
        <div className="mt-3 h-1.5 w-full rounded-full bg-[#EDEDED]">
          <div className="h-1.5 w-2/3 rounded-full bg-[#0F0F0F]" />
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 top-16 hidden w-52 rounded-2xl border border-[#E0E0E0] bg-white p-4 xl:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D2D2D]">
          <Shield className="h-4 w-4 text-[#0F0F0F]" />
          Secure access
        </div>
        <p className="mt-3 text-xs text-[#4B4B4B]">
          Multi-factor protected sign in for teams.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-16 right-10 hidden w-60 rounded-2xl border border-[#E0E0E0] bg-white p-4 lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D2D2D]">
          <CreditCard className="h-4 w-4 text-[#0F0F0F]" />
          Payments
        </div>
        <p className="mt-3 text-xs text-[#4B4B4B]">
          $4,820 processed this week with instant deposits.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[0.7rem] font-semibold text-[#037347]">
          +18% week over week
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen items-center justify-center px-5 py-14">
        <div className="w-full max-w-[440px] rounded-2xl border border-[#E0E0E0] bg-white p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="font-[var(--font-display)] text-base font-semibold tracking-tight">
              Appointly
            </div>
            <div className="rounded-full border border-[#E0E0E0] px-3 py-1 text-[0.7rem] font-medium text-[#4B4B4B]">
              Secure access
            </div>
          </div>

          <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[#4B4B4B]">
            Welcome back. Manage appointments across every service you offer.
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
            <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              icon={Lock}
              className="mt-2"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="mt-2 text-xs text-[#EA3A30]">{errors.password.message}</p>
            )}
          </div>

            <div className="flex justify-end">
              <Button
                variant="link"
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <span>{loading ? "Signing in..." : "Sign in"}</span>
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
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <Chrome size={18} />
            Continue with Google
          </Button>

          <p className="mt-4 text-center text-sm text-[#4B4B4B]">
            New to Appointly?{" "}
            <Button
              variant="link"
              onClick={() => router.push("/register")}
              className="font-semibold"
            >
              Create an account
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
