import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  User,
} from "lucide-react";
import type { SaasWorkspace } from "@orbit/contracts";
import { StatusBadge } from "./StatusBadge";

export interface ActionModalData {
  id: string;
  title: string;
  resultId: string;
  assigneeId: string;
  dueDate: string;
  state: "open" | "in_progress" | "done";
  version: number;
  kpiName?: string;
  unitName?: string;
  target?: string | null;
  currentValue?: string | null;
}

interface ApprovalModalProps {
  action: ActionModalData | null;
  workspace?: SaasWorkspace;
  onClose: () => void;
  onApprove: (action: ActionModalData) => Promise<void>;
  onReject: (action: ActionModalData) => Promise<void>;
  onRequestRevisions?: (action: ActionModalData) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  action,
  workspace,
  onClose,
  onApprove,
  onReject,
  onRequestRevisions,
}) => {
  const [busy, setBusy] = useState(false);

  if (!action) return null;

  const assignee = workspace?.members.find((m) => m.id === action.assigneeId);
  const assigneeName = assignee ? assignee.displayName : "Assigned Member";
  const isDone = action.state === "done";

  const handleApprove = async () => {
    setBusy(true);
    try {
      await onApprove(action);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await onReject(action);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleRevisions = async () => {
    if (!onRequestRevisions) return;
    setBusy(true);
    try {
      await onRequestRevisions(action);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Executive Decision Memo
              </span>
              <StatusBadge status={action.state} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {action.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 pt-1">
              {action.unitName && (
                <span className="flex items-center gap-1 text-blue-700 font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  {action.unitName}
                </span>
              )}
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Assignee: <strong className="text-slate-800">{assigneeName}</strong>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Due: {action.dueDate}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close memo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] overflow-y-auto">
          {isDone && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Executive authorization approved and recorded in the organization audit trail.
              </span>
            </div>
          )}

          {/* KPI Context */}
          {action.kpiName && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Related KPI Metric & Variance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">
                    KPI Objective
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                    {action.kpiName}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Latest Value
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-800 font-mono mt-1">
                    {action.currentValue ?? "Pending data"}
                  </p>
                </div>
                <div className="bg-amber-50/80 p-3 sm:p-3.5 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-semibold text-amber-800">
                    Target Baseline
                  </span>
                  <p className="text-base sm:text-lg font-black text-amber-700 font-mono mt-1">
                    {action.target ?? "No target set"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Operational & Governance Justification */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Decision Justification & Next Steps
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-medium">
              This action item was initiated to bring performance back on target for{" "}
              <strong>{action.kpiName || "the organization"}</strong> in{" "}
              <strong>{action.unitName || "the primary workspace"}</strong>.
              Completing this item will update the audit trail and mark the decision
              as resolved.
            </p>
          </div>

          {/* Impact Assessment */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Impact Assessment & Accountability
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                <span className="font-bold text-emerald-800 shrink-0 w-24">
                  Accountability:
                </span>
                <span className="text-emerald-900 font-medium">
                  Assigned directly to {assigneeName}. Status updates logged in real-time.
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 shrink-0 w-24">
                  Target Deadline:
                </span>
                <span className="text-slate-800 font-medium font-mono">
                  {action.dueDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer order-last sm:order-first text-center"
          >
            Cancel / Close
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onRequestRevisions && (
                <button
                  onClick={() => void handleRevisions()}
                  disabled={busy || isDone}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg border bg-white hover:bg-slate-100 text-slate-700 border-slate-300 transition-colors cursor-pointer text-center disabled:opacity-40"
                >
                  Mark In Progress
                </button>
              )}

              <button
                onClick={() => void handleReject()}
                disabled={busy || isDone}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer text-center disabled:opacity-40"
              >
                Reject / Close
              </button>
            </div>

            <button
              onClick={() => void handleApprove()}
              disabled={busy || isDone}
              className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isDone
                  ? "bg-emerald-700 text-white cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
              } disabled:opacity-40`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDone ? "Authorized ✓" : "Authorize & Complete"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
