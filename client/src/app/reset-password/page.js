"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { resetPassword } from "../actions/authActions";
import { useState, Suspense } from "react";
import { Lock, Calendar, Shield, CreditCard } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        if (!token) {
            setError("Invalid link (missing token)");
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const result = await resetPassword(token, data.password);
            if (result.error) {
                setError(result.error);
            } else {
                setMessage("Password updated successfully! Redirecting...");
                setTimeout(() => router.push("/login"), 2000);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
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
                    {!token ? (
                        <>
                            <div className="mb-5 flex items-center gap-3">
                                <div className="font-[var(--font-display)] text-base font-semibold tracking-tight">
                                    Appointly
                                </div>
                                <div className="rounded-full border border-[#E0E0E0] px-3 py-1 text-[0.7rem] font-medium text-[#4B4B4B]">
                                    Reset access
                                </div>
                            </div>
                            <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
                                Invalid link
                            </h1>
                            <p className="mt-2 text-sm text-[#4B4B4B]">
                                The Appointly reset link is invalid or expired.
                            </p>
                            <Button
                                href="/forgot-password"
                                variant="link"
                                className="mt-4"
                            >
                                Request a new link
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="mb-5 flex items-center gap-3">
                                <div className="font-[var(--font-display)] text-base font-semibold tracking-tight">
                                    Appointly
                                </div>
                                <div className="rounded-full border border-[#E0E0E0] px-3 py-1 text-[0.7rem] font-medium text-[#4B4B4B]">
                                    Set new password
                                </div>
                            </div>

                            <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
                                Set new password
                            </h1>
                            <p className="mt-2 text-sm text-[#4B4B4B]">
                                Choose a strong password for your Appointly account.
                            </p>

                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="mt-6 flex flex-col gap-4"
                            >
                                <div>
                                    <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="password">
                                        New password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Create a password"
                                        icon={Lock}
                                        className="mt-2"
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Use at least 6 characters" },
                                        })}
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
                                        placeholder="Repeat your password"
                                        icon={Lock}
                                        className="mt-2"
                                        {...register("confirmPassword", {
                                            required: "Please confirm your password",
                                            validate: (val) => {
                                                if (watch("password") != val) {
                                                    return "Your passwords do no match";
                                                }
                                            },
                                        })}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="mt-2 text-xs text-[#EA3A30]">
                                            {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                {message && <p className="text-xs text-[#037347]">{message}</p>}
                                {error && <p className="text-xs text-[#EA3A30]">{error}</p>}

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? "Updating..." : "Update password"}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
