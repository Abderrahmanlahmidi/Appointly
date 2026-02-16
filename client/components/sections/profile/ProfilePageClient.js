"use client";

import React from "react";
import axios from "axios";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { User } from "lucide-react";
import ProfileInfoCard from "./ProfileInfoCard";
import PasswordCard from "./PasswordCard";

const fetchProfile = async () => {
  const { data } = await axios.get("/api/profile");
  return data;
};

function ProfileContent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: 1,
  });

  const profile = data?.user;
  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || "User";

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
          <ProfileInfoCard
            profile={profile}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
          <PasswordCard />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageClient() {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileContent />
    </QueryClientProvider>
  );
}
