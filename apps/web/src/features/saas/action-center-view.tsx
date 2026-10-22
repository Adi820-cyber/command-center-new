import React, { useState, useMemo } from "react";
import {
  Inbox,
  Search,
  User,
  Plus,
} from "lucide-react";
import type { SaasWorkspace } from "@orbit/contracts";
import { StatusBadge } from "./components/StatusBadge";
import { ApprovalModal, type ActionModalData } from "./components/ApprovalModal";

interface ActionCenterViewProps {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
}

export const ActionCenterView: React.FC<ActionCenterViewProps> = ({
  workspace: w,
  change,
}) => {
  const [selectedTier, setSelectedTier] = useState<
    "all" | "action-now" | "monitor" | "on-track"
  >("all");
  const [search, setSearch] = useState("");
  const [activeModalAction, setActiveModalAction] =
    useState<ActionModalData | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Filtered action items
  const filteredActions = useMemo(() => {
    let list = w.actions;
    const needle = search.trim().toLowerCase();

    if (selectedTier === "action-now") {
      list = list.filter((a) => a.state === "open");
    } else if (selectedTier === "monitor") {
      list = list.filter((a) => a.state === "in_progress");
    } else if (selectedTier === "on-track") {
      list = list.filter((a) => a.state === "done");
    }

    if (needle) {
      list = list.filter((a) => {
        const assignee = w.members.find((m) => m.id === a.assigneeId)?.displayName ?? "";
        return (
          a.title.toLowerCase().includes(needle) ||
          assignee.toLowerCase().includes(needle)
        );
      });
    }

    return list;
  }, [w.actions, w.members, selectedTier, search]);

  const actionNowCount = w.actions.filter((a) => a.state === "open").length;
  const monitorCount = w.actions.filter((a) => a.state === "in_progress").length;
  const doneCount = w.actions.filter((a) => a.state === "done").length;

  const tiers = [
    { id: "all", label: "All Items", count: w.actions.length },
    {
      id: "action-now",
      label: "Action Now",
      count: actionNowCount,
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      id: "monitor",
      label: "Monitor",
      count: monitorCount,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "on-track",
      label: "On Track",
      count: doneCount,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
  ];

  const handleOpenAction = (a: (typeof w.actions)[number]) => {
    const kpi = w.kpis.find((k) =>
      w.results.some((r) => r.id === a.resultId && r.kpiId === k.id),
    );
    const unit = w.units.find((u) =>
      w.results.some((r) => r.id === a.resultId && r.unitId === u.id),
    );
    const result = w.results.find((r) => r.id === a.resultId);
    const val =
      result?.value.status === "available" ? result.value.value : null;

    setActiveModalAction({
      id: a.id,
      title: a.title,
      resultId: a.resultId,
      assigneeId: a.assigneeId,
      dueDate: a.dueDate,
      state: a.state,
      version: a.version,
      kpiName: kpi?.name,
      unitName: unit?.name,
      target: kpi?.target,
      currentValue: val,
    });
  };

  const handleApprove = async (act: ActionModalData) => {
    await change(`/actions/${act.id}/transition`, {
      state: "done",
      expectedVersion: act.version,
    });
  };

  const handleReject = async (act: ActionModalData) => {
    await change(`/actions/${act.id}/transition`, {
      state: "done",
      expectedVersion: act.version,
    });
  };

  const handleRevisions = async (act: ActionModalData) => {
    await change(`/actions/${act.id}/transition`, {
      state: "in_progress",
      expectedVersion: act.version,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await change("/actions", {
      title: (f.get("title") as string).trim(),
      resultId: f.get("resultId"),
      assigneeId: f.get("assigneeId"),
      dueDate: f.get("dueDate"),
    });
    if (ok) setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-blue-100 text-blue-700">
              <Inbox className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {w.organization.name} Governance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Priority Inbox / Action Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accountable operational decisions and recovery actions linked directly to calculated results.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Action</span>
          </button>
        </div>
      </div>

      {/* New Action Form (Collapsible) */}
      {isCreateOpen && (
        <section className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              Initiate Next Performance Step
            </h2>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={(e) => void handleCreateSubmit(e)} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Action Objective / What needs to happen
              </label>
              <input
                name="title"
                required
                maxLength={200}
                placeholder="e.g. Schedule clinical audit review in Branch A"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Evidence Result
                </label>
                <select
                  name="resultId"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {w.results.map((r) => {
                    const kpi = w.kpis.find((k) => k.id === r.kpiId);
                    const unit = w.units.find((u) => u.id === r.unitId);
                    return (
                      <option key={r.id} value={r.id}>
                        {kpi?.name} · {unit?.name} ({r.end})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Owner / Assignee
                </label>
                <select
                  name="assigneeId"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {w.members
                    .filter((m) => m.active)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                        {m.subject === w.subject ? " (you)" : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Due Date
                </label>
                <input
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={today}
                  min={today}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Commit to Register
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {tiers.map((tab) => {
            const isActive = selectedTier === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTier(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : tab.badgeColor || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>
      </div>

      {/* Action Items Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4">Action Item</th>
                <th className="py-3 px-4">Metric & Unit</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No actions match this view. Create an action from any off-target KPI.
                  </td>
                </tr>
              ) : (
                filteredActions.map((action) => {
                  const kpi = w.kpis.find((k) =>
                    w.results.some((r) => r.id === action.resultId && r.kpiId === k.id),
                  );
                  const unit = w.units.find((u) =>
                    w.results.some((r) => r.id === action.resultId && r.unitId === u.id),
                  );
                  const assignee = w.members.find(
                    (m) => m.id === action.assigneeId,
                  );
                  const isDone = action.state === "done";

                  return (
                    <tr
                      key={action.id}
                      onClick={() => handleOpenAction(action)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <StatusBadge status={action.state} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block">
                          {action.title}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {kpi?.name ?? "KPI Metric"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {unit?.name ?? "Primary Unit"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{assignee?.displayName ?? "Assigned Member"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {action.dueDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAction(action);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                            isDone
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isDone ? "View Memo" : "Review Memo"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Memo Modal */}
      <ApprovalModal
        action={activeModalAction}
        workspace={w}
        onClose={() => setActiveModalAction(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestRevisions={handleRevisions}
      />
    </div>
  );
};
