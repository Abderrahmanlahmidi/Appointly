"use client";

import React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Phone, Shield, User } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const fetchProfile = async () => {
  const { data } = await axios.get("/api/profile");
  return data;
};

function ProfileContent() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: 1,
  });

  const profile = data?.user;
  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || "User";

  const [updateMessage, setUpdateMessage] = React.useState("");
  const [updateError, setUpdateError] = React.useState("");
  const [passwordMessage, setPasswordMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");

  const updateForm = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: updateErrors },
  } = updateForm;

  React.useEffect(() => {
    if (!profile) return;
    reset({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values) => {
      const imageValue = values.image;
      const imageFile = imageValue?.[0];
      const image =
        imageFile instanceof File ? await readFileAsDataUrl(imageFile) : "";

      const payload = {
        firstName: values.firstName?.trim(),
        lastName: values.lastName?.trim(),
        phone: values.phone?.trim(),
      };

      if (image) {
        payload.image = image;
      }

      const response = await axios.patch("/api/profile", payload);
      return response.data;
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(["profile"], payload);
      setUpdateMessage("Profile updated successfully.");
      setUpdateError("");
    },
    onError: (err) => {
      setUpdateMessage("");
      setUpdateError(
        err?.response?.data?.error ?? "Unable to update profile."
      );
    },
  });

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

  const onUpdateSubmit = (values) => {
    setUpdateMessage("");
    setUpdateError("");
    updateMutation.mutate(values);
  };

  const onPasswordSubmit = (values) => {
    setPasswordMessage("");
    setPasswordError("");
    passwordMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-12">
        <section className="flex flex-col gap-6 rounded-3xl border border-[#E0E0E0] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {profile?.image ? (
              <img
                src={profile.image}
                alt={fullName}
                className="h-16 w-16 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0F0F0F] text-white">
                <User className="h-7 w-7" />
              </div>
            )}
            <div>
              <div className="text-xl font-semibold">{fullName}</div>
              <div className="text-sm text-[#4B4B4B]">
                {profile?.email || "No email"}
              </div>
            </div>
          </div>
          <div className="rounded-full border border-[#EDEDED] px-3 py-1 text-xs font-semibold text-[#4B4B4B]">
            Manage profile
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Profile information</h2>
              <p className="text-sm text-[#4B4B4B]">
                Update your personal details.
              </p>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#4B4B4B]">Loading profile...</p>
            ) : isError ? (
              <p className="text-sm text-[#EA3A30]">
                {error?.message || "Unable to load profile."}
              </p>
            ) : (
              <form onSubmit={handleSubmit(onUpdateSubmit)} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-[#2D2D2D]">
                      First name
                    </label>
                    <Input
                      className="mt-2"
                      placeholder="First name"
                      {...register("firstName", {
                        required: "First name is required",
                      })}
                    />
                    {updateErrors.firstName ? (
                      <p className="mt-2 text-xs text-[#EA3A30]">
                        {updateErrors.firstName.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#2D2D2D]">
                      Last name
                    </label>
                    <Input
                      className="mt-2"
                      placeholder="Last name"
                      {...register("lastName", {
                        required: "Last name is required",
                      })}
                    />
                    {updateErrors.lastName ? (
                      <p className="mt-2 text-xs text-[#EA3A30]">
                        {updateErrors.lastName.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D2D2D]">
                    Phone
                  </label>
                  <Input
                    className="mt-2"
                    placeholder="+1 555 000 1234"
                    icon={Phone}
                    {...register("phone")}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D2D2D]">
                    Profile image
                  </label>
                  <Input
                    className="mt-2 bg-white"
                    type="file"
                    accept="image/*"
                    inputClassName="file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#0F0F0F] file:shadow-none file:cursor-pointer file:hover:bg-[#F7F6F2]"
                    {...register("image")}
                  />
                </div>

                {updateMessage ? (
                  <p className="text-xs text-[#037347]">{updateMessage}</p>
                ) : null}
                {updateError ? (
                  <p className="text-xs text-[#EA3A30]">{updateError}</p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Change password</h2>
              <p className="text-sm text-[#4B4B4B]">
                Update your password to keep your account secure.
              </p>
            </div>

            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="grid gap-4">
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
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileContent />
    </QueryClientProvider>
  );
}
