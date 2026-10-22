import React from "react";

export type SeverityType = "critical" | "high" | "medium" | "low" | "info";
export type StatusType =
  | "healthy"
  | "warning"
  | "critical"
  | "neutral"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Changes Requested"
  | "On Track"
  | "At Risk"
  | "Delayed"
  | "Completed"
  | "open"
  | "in_progress"
  | "done";

interface StatusBadgeProps {
  status?: StatusType | string;
  severity?: SeverityType | string;
  label?: string;
  size?: "sm" | "md";
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  severity,
  label,
  size = "md",
  pulse = false,
}) => {
  const displayLabel = label || status || severity || "Status";

  let bgClass = "bg-slate-100 text-slate-700 border-slate-200";
  let dotClass = "bg-slate-500";

  const lowerSev = severity?.toLowerCase();
  const lowerStat = status?.toLowerCase();

  if (
    lowerSev === "critical" ||
    lowerStat === "critical" ||
    status === "At Risk" ||
    status === "Delayed"
  ) {
    bgClass = "bg-rose-50 text-rose-700 border-rose-200";
    dotClass = "bg-rose-500";
  } else if (
    lowerSev === "high" ||
    status === "Changes Requested" ||
    lowerStat === "high"
  ) {
    bgClass = "bg-amber-50 text-amber-800 border-amber-200";
    dotClass = "bg-amber-500";
  } else if (
    lowerSev === "medium" ||
    lowerStat === "warning" ||
    lowerStat === "in_progress"
  ) {
    bgClass = "bg-amber-50 text-amber-800 border-amber-200";
    dotClass = "bg-amber-500";
  } else if (
    lowerStat === "healthy" ||
    status === "On Track" ||
    status === "Approved" ||
    status === "Completed" ||
    lowerStat === "done"
  ) {
    bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotClass = "bg-emerald-500";
  } else if (status === "Pending" || lowerStat === "open") {
    bgClass = "bg-blue-50 text-blue-700 border-blue-200";
    dotClass = "bg-blue-500";
  } else if (status === "Rejected") {
    bgClass = "bg-slate-100 text-slate-600 border-slate-200";
    dotClass = "bg-slate-400";
  }

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1.5"
      : "text-xs font-semibold px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses} ${bgClass} transition-colors tracking-wide shrink-0`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotClass} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
};
