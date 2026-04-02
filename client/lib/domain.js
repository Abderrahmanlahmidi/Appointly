export const normalizeRole = (value) =>
  String(value ?? "").trim().toUpperCase();

export const formatPrice = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (value, options) => {
  if (!value) return "N/A";

  const date = new Date(
    typeof value === "string" && value.length <= 10
      ? `${value}T00:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString(
    "en-US",
    options ?? {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};

export const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

export const formatTime = (value) => {
  if (!value) return "N/A";
  return String(value).slice(0, 5);
};

export const formatSlot = (date, startTime, endTime) => {
  const day = formatDate(date);
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  return `${day} • ${start}${end !== "N/A" ? ` - ${end}` : ""}`;
};

export const formatStatusLabel = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const statusToneMap = {
  PENDING: "border-[#F7E2B5] bg-[#FFF7E6] text-[#9A5B00]",
  APPROVED: "border-[#BDE5D3] bg-[#F0FBF5] text-[#037347]",
  REJECTED: "border-[#F5C2C0] bg-[#FFF5F4] text-[#B42318]",
  ACTIVE: "border-[#BDE5D3] bg-[#F0FBF5] text-[#037347]",
  INACTIVE: "border-[#E0E0E0] bg-[#F7F7F7] text-[#4B4B4B]",
  CONFIRMED: "border-[#BDE5D3] bg-[#F0FBF5] text-[#037347]",
  CANCELLED: "border-[#F5C2C0] bg-[#FFF5F4] text-[#B42318]",
};
