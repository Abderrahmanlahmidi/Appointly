"use client";

import React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function ProfileInfoCard({
  profile,
  isLoading,
  isError,
  error,
}) {
  const queryClient = useQueryClient();
  const [updateMessage, setUpdateMessage] = React.useState("");
  const [updateError, setUpdateError] = React.useState("");

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

  const onUpdateSubmit = (values) => {
    setUpdateMessage("");
    setUpdateError("");
    updateMutation.mutate(values);
  };

  return (
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
            <label className="text-xs font-medium text-[#2D2D2D]">Phone</label>
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
  );
}
