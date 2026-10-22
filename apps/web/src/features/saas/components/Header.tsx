import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  Search,
  Check,
  ChevronRight,
  Sparkles,
  BarChart3,
  Menu,
  Building2,
} from "lucide-react";
import type { TenantListSchema, SaasWorkspace } from "@orbit/contracts";
import { initialOf, roleLabel } from "../identity";
import { NotificationDropdown } from "./NotificationDropdown";

interface HeaderProps {
  sidebarCollapsed: boolean;
  toggleMobileMenu: () => void;
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  organizations: ReturnType<typeof TenantListSchema.parse>;
  tenant: string;
  selectTenant: (id: string) => void;
  workspace?: SaasWorkspace;
  openAskAi: () => void;
  onSelectTab: (tab: any) => void;
  email: string;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarCollapsed,
  toggleMobileMenu,
  activeTab,
  searchQuery,
  setSearchQuery,
  organizations,
  tenant,
  selectTenant,
  workspace,
  openAskAi,
  onSelectTab,
  email,
}) => {
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsTenantMenuOpen(false);
      }
    };
    if (isTenantMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTenantMenuOpen]);

  const avatar = initialOf(email);
  const activeOrg = organizations.find((o) => o.id === tenant);
  const pendingCount =
    (workspace?.batches.filter((b) => b.status === "submitted").length ?? 0) +
    (workspace?.actions.filter((a) => a.state !== "done").length ?? 0);

  return (
    <header
      className={`sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between transition-all duration-300 ml-0 ${
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      }`}
    >
      {/* Left: Mobile Menu Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center text-xs text-slate-600 font-medium min-w-0">
          <button
            onClick={() => onSelectTab("Dashboard")}
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-800 hidden sm:inline">
              {workspace?.organization.name ?? "Command Center"}
            </span>
            <span className="font-bold text-slate-800 sm:hidden">Command</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate">
            {activeTab}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search KPIs, units, measures, decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Right: Ask AI + Notifications + Org/User Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={openAskAi}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
          title="Ask anything in plain words"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Ask anything</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            workspace={workspace}
            onSelectTab={onSelectTab}
          />
        </div>

        <div className="h-5 w-px bg-slate-200 hidden xs:block" />

        {/* Organization / Profile Switcher */}
        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-2 p-1.5 sm:pr-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <button
              onClick={() => setIsTenantMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Switch organization"
            >
              {avatar}
            </button>
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                {roleLabel(workspace?.me) || "WORKSPACE"}
              </span>
              <button
                onClick={() => setIsTenantMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 text-xs font-bold text-slate-900 leading-tight text-left cursor-pointer focus:outline-none rounded"
              >
                <span className="truncate max-w-[150px] md:max-w-[180px]">
                  {activeOrg?.name ?? "Select workspace"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${
                    isTenantMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Org switch dropdown */}
          {isTenantMenuOpen && (
            <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Select Organization
                </span>
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {organizations.map((org) => {
                  const isSelected = org.id === tenant;
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        selectTenant(org.id);
                        setIsTenantMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-50/70" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs truncate ${
                            isSelected
                              ? "text-blue-900 font-bold"
                              : "text-slate-800 font-medium"
                          }`}
                        >
                          {org.name}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {org.status === "active" ? "Active" : org.status}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
