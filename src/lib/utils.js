import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function isOfflineError(err) {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg.includes("err_connection")
  );
}

export function getRentalDueDate(order) {
  const raw = order?.returnDueDate || order?.rentalDetails?.endDate;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getOrderItemNames(order, vendorId) {
  const items = order?.items || [];
  const scoped = vendorId
    ? items.filter((item) => !item?.vendorId || item.vendorId === vendorId)
    : items;
  const source = scoped.length ? scoped : items;
  const names = [];
  for (const item of source) {
    const name = (item?.name || "").trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export function getOrderName(order, vendorId) {
  const names = getOrderItemNames(order, vendorId);
  if (!names.length) return order?.id || "—";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
}

export function getOrderSearchText(order, vendorId) {
  const names = getOrderItemNames(order, vendorId).join(" ");
  return `${order?.id || ""} ${names}`.trim().toLowerCase();
}

const RENTAL_WITH_CUSTOMER = ["delivered", "active"];

export function isRentalOverdue(order) {
  const due = getRentalDueDate(order);
  if (!due || due.getTime() >= Date.now()) return false;
  if (order?.returnRequested || order?.status === "returned" || order?.status === "cancelled") return false;
  const rentalStatus = order?.rentalStatus;
  if (["completed", "deposit_refunded", "cancelled", "pending_return", "awaiting_inspection", "inspected"].includes(rentalStatus)) {
    return false;
  }
  return RENTAL_WITH_CUSTOMER.includes(rentalStatus) || order?.status === "delivered";
}
