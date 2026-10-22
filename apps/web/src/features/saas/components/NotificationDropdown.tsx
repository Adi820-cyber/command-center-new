import React, { useRef, useEffect } from "react";
import { Bell, Check, Clock, FileCheck2, AlertCircle } from "lucide-react";
import type { SaasWorkspace } from "@orbit/contracts";

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  workspace?: SaasWorkspace;
  onSelectTab: (tab: any) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  workspace,
  onSelectTab,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Derive notifications from workspace batches and pending actions
  const pendingBatches =
    workspace?.batches.filter((b) => b.status === "submitted") ?? [];
  const openActions =
    workspace?.actions.filter((a) => a.state !== "done") ?? [];

  const items = [
    ...pendingBatches.map((b) => ({
      id: b.id,
      title: "Batch awaiting approval",
      description: `Period ${b.start} to ${b.end} submitted from ${b.origin}`,
      date: "Pending review",
      type: "batch",
      badge: "Needs Review",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      action: () => {
        onSelectTab("Data & approvals");
        onClose();
      },
    })),
    ...openActions.map((a) => ({
      id: a.id,
      title: a.title,
      description: `Due ${a.dueDate} · Status: ${a.state.replace("_", " ")}`,
      date: `Due ${a.dueDate}`,
      type: "action",
      badge: a.state === "open" ? "Action Now" : "In Progress",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      action: () => {
        onSelectTab("Actions");
        onClose();
      },
    })),
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-sm text-slate-800">
            Notifications
          </span>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full font-mono">
            {items.length} active
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-slate-800">All caught up</p>
            <p className="mt-0.5">No pending batches or critical actions.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={item.action}
              className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mt-0.5">
                {item.type === "batch" ? (
                  <FileCheck2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono shrink-0 ${item.color}`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Close Notifications
        </button>
      </div>
    </div>
  );
};
