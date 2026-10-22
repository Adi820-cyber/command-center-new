import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  Inbox,
  Building2,
  ListChecks,
  FileSpreadsheet,
  Layers,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import type { SaasWorkspace } from "@orbit/contracts";
import { initialOf, roleLabel } from "../identity";

export interface NavItemConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: number;
  ownerOnly?: boolean;
}

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  workspace?: SaasWorkspace;
  email: string;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobileMenuOpen,
  closeMobileMenu,
  activeTab,
  onSelectTab,
  workspace,
  email,
  onSignOut,
}) => {
  const avatar = initialOf(email);
  const isOwner = workspace?.organization.owner ?? false;

  const pendingBatches =
    workspace?.batches.filter((b) => b.status === "submitted").length ?? 0;
  const pendingActions =
    workspace?.actions.filter((a) => a.state !== "done").length ?? 0;
  const totalPendingInbox = pendingActions;

  const navItems: NavItemConfig[] = [
    {
      id: "Dashboard",
      label: "Morning Brief",
      shortLabel: "Morning Brief",
      icon: LayoutDashboard,
    },
    {
      id: "KPI Dashboard",
      label: "KPI Dashboard",
      shortLabel: "KPI Dashboard",
      icon: BarChart3,
    },
    {
      id: "Actions",
      label: "Priority Inbox / Tasks",
      shortLabel: "Priority Inbox",
      icon: Inbox,
      badge: totalPendingInbox > 0 ? totalPendingInbox : undefined,
    },
    {
      id: "Units",
      label: "Facilities & Units",
      shortLabel: "Units",
      icon: Building2,
    },
    {
      id: "KPI library",
      label: "KPI Explorer / Library",
      shortLabel: "KPI Explorer",
      icon: ListChecks,
    },
    {
      id: "Data & approvals",
      label: "Data & Approvals",
      shortLabel: "Data Submissions",
      icon: FileSpreadsheet,
      badge: pendingBatches > 0 ? pendingBatches : undefined,
    },
    {
      id: "Organization",
      label: "Organization Hub",
      shortLabel: "Organization",
      icon: Layers,
      ownerOnly: false,
    },
    {
      id: "Activity",
      label: "Activity & Audit",
      shortLabel: "Audit Trail",
      icon: Clock,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-50 lg:z-30 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "w-72 lg:w-20" : "w-72 lg:w-64"}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div
              className={`flex flex-col truncate ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              <span className="font-bold text-sm tracking-wide text-white truncate">
                {workspace?.organization.name ?? "COMMAND CENTER"}
              </span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider truncate">
                {workspace?.units.length ?? 0} Units · Performance Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Mobile close button */}
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse button */}
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Role Context Pill */}
        {!sidebarCollapsed ? (
          <div className="mx-3 my-3 p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/60 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate" title={email}>
                {email || "Signed in"}
              </p>
              <p className="text-[11px] text-blue-400 truncate">
                {roleLabel(workspace?.me) || (isOwner ? "Organization Owner" : "Member")}
              </p>
            </div>
          </div>
        ) : (
          <div className="my-3 flex justify-center">
            <div
              className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center"
              title={`${email} · ${roleLabel(workspace?.me)}`}
            >
              {avatar}
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Executive Workspace
              </span>
            )}
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  closeMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={item.label}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className="truncate flex-1 text-left">
                    {item.shortLabel}
                  </span>
                )}
                {item.badge !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                      isActive
                        ? "bg-white text-blue-700"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    } ${
                      sidebarCollapsed
                        ? "absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px]"
                        : ""
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & links */}
        <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
          <a
            href="/change-password"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title="Account security"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {!sidebarCollapsed && <span>Account Security</span>}
          </a>

          <button
            onClick={onSignOut}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="px-3 py-1 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Command Center</span>
              <span className="font-mono text-slate-400">v3.2</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
