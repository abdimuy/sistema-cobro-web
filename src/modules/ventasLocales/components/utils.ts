import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date: string): string => {
  return dayjs(date).format("DD MMM YYYY");
};

export const formatDateTime = (date: string): string => {
  return dayjs(date).format("DD MMM, HH:mm");
};

export const formatRelativeDate = (date: string): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffDays = now.diff(target, "day");

  if (diffDays === 0) {
    return `Hoy, ${target.format("HH:mm")}`;
  } else if (diffDays === 1) {
    return `Ayer, ${target.format("HH:mm")}`;
  } else if (diffDays < 7) {
    return target.format("dddd, HH:mm");
  } else {
    return target.format("DD MMM");
  }
};

export const formatPhone = (phone: string): string => {
  if (!phone) return "";
  // Format as (XXX) XXX-XXXX for 10 digit numbers
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
