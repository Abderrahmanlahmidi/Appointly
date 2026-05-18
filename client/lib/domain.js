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
  PENDING:
    "border-[rgba(255,197,61,0.24)] bg-[rgba(255,197,61,0.1)] text-[#ffd98a]",
  APPROVED:
    "border-[rgba(17,255,153,0.22)] bg-[rgba(17,255,153,0.1)] text-[#8affc7]",
  REJECTED:
    "border-[rgba(255,32,71,0.24)] bg-[rgba(255,32,71,0.1)] text-[#ff95a9]",
  ACTIVE:
    "border-[rgba(17,255,153,0.22)] bg-[rgba(17,255,153,0.1)] text-[#8affc7]",
  INACTIVE:
    "border-[var(--color-border)] bg-[rgba(255,255,255,0.05)] text-[var(--color-muted)]",
  CONFIRMED:
    "border-[rgba(17,255,153,0.22)] bg-[rgba(17,255,153,0.1)] text-[#8affc7]",
  CANCELLED:
    "border-[rgba(255,32,71,0.24)] bg-[rgba(255,32,71,0.1)] text-[#ff95a9]",
};
