"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post("/api/register", data);
      return res.data;
    },
    onSuccess: () => {
      alert("Account created successfully!");
      router.push("/login");
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Something went wrong");
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const password = watch("password", "");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Register</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3 w-80"
      >
        <input
          type="text"
          placeholder="First Name"
          {...register("firstname", { required: "First Name is required" })}
          className="border p-2 rounded"
        />
        {errors.firstname && (
          <p className="text-red-500 text-sm">{errors.firstname.message}</p>
        )}

        <input
          type="text"
          placeholder="Last Name"
          {...register("lastname", { required: "Last Name is required" })}
          className="border p-2 rounded"
        />
        {errors.lastname && (
          <p className="text-red-500 text-sm">{errors.lastname.message}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          {...register("email", { required: "Email is required" })}
          className="border p-2 rounded"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}

        <input
          type="text"
          placeholder="Phone"
          {...register("phone", { required: "Phone is required" })}
          className="border p-2 rounded"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm">{errors.phone.message}</p>
        )}

        <input
          type="password"
          placeholder="Password"
          {...register("password", { required: "Password is required" })}
          className="border p-2 rounded"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}

        <input
          type="password"
          placeholder="Confirm Password"
          {...register("confirmPassword", {
            required: "Confirm Password is required",
            validate: (value) =>
              value === password || "Passwords do not match",
          })}
          className="border p-2 rounded"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">
            {errors.confirmPassword.message}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {mutation.isPending ? "Loading..." : "Register"}
        </button>
      </form>

      <div className="text-gray-500 my-2">OR</div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/login" })}
        className="bg-red-500 text-white p-2 rounded w-80"
      >
        Register with Google
      </button>

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <span
          className="text-blue-500 cursor-pointer"
          onClick={() => router.push("/login")}
        >
          Login here
        </span>
      </p>
    </div>
  );
}
