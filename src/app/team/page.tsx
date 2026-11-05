"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import AuthModal from "@/components/modals/AuthModal";
import { useApp } from "@/context/AppContext";
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  Mail,
  Phone,
  Trash2,
  CheckCircle,
  Copy,
  AlertCircle,
  History,
} from "lucide-react";

export default function TeamPage() {
  const { activeBusiness, showToast } = useApp();

  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const fetchTeamData = async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    try {
      const [teamRes, logRes] = await Promise.all([
        fetch(`/api/team?businessId=${activeBusiness.id}`),
        fetch(`/api/activity?businessId=${activeBusiness.id}`),
      ]);

      const teamData = await teamRes.json();
      const logData = await logRes.json();

      if (teamRes.ok) {
        setMembers(teamData.members || []);
        setInvitations(teamData.invitations || []);
      }
      if (logRes.ok) {
        setActivityLogs(logData.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) fetchTeamData();
  }, [activeBusiness?.id]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail && !invitePhone) {
      showToast({ title: "Error", message: "Please provide an email or phone number", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusiness?.id,
          name: inviteName,
          email: inviteEmail,
          phone: invitePhone,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast({ title: "Success", message: data.message, type: "success" });
        if (data.inviteLink) {
          setGeneratedInviteLink(data.inviteLink);
        } else {
          setInviteModalOpen(false);
          setInviteEmail("");
          setInvitePhone("");
        }
        fetchTeamData();
      } else {
        showToast({ title: "Invite failed", message: data.error, type: "error" });
      }
    } catch (err: any) {
      showToast({ title: "Error", message: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (res.ok) {
        showToast({ title: "Role Updated", message: `Updated to ${newRole}`, type: "success" });
        fetchTeamData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/team?memberId=${memberId}`, { method: "DELETE" });
      if (res.ok) {
        showToast({ title: "Member Removed", type: "info" });
        fetchTeamData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>Multi-User Collaboration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                Team & Audit Activity Log
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Invite staff, accountants, and partners with role-based permissions (Owner, Admin, Editor, Viewer).
              </p>
            </div>

            <button
              onClick={() => {
                setGeneratedInviteLink(null);
                setInviteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Members List (2 Columns on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Active Team Members ({members.length})</span>
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map((m) => (
                    <div key={m.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{m.name}</div>
                          <div className="text-xs text-slate-400">{m.email || m.phone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.role === "OWNER" ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            Owner
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-slate-50 dark:bg-slate-800 outline-none"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="EDITOR">Editor</option>
                              <option value="VIEWER">Viewer</option>
                            </select>

                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                    Pending Invitations ({invitations.length})
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold">{inv.email || inv.phone}</span>
                          <span className="text-slate-400 ml-2">as {inv.role}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Activity Audit Trail (1 Column) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Activity Audit Log</span>
                </h3>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {activityLogs.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-8">
                    No recent activity logged yet.
                  </div>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="text-xs space-y-1 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{log.userName || "System"}</span>
                        <span>{new Date(log.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{log.details}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Invite Modal */}
          {inviteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl p-6 sm:p-7">
                <h3 className="text-lg font-bold">Invite Team Member</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add staff to collaborate with specific permission levels.
                </p>

                {generatedInviteLink ? (
                  <div className="mt-5 space-y-4">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                      Invitation created! Share this join link with the member:
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono break-all select-all">
                      {window.location.origin + generatedInviteLink}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + generatedInviteLink);
                          showToast({ title: "Copied invite link", type: "success" });
                          setInviteModalOpen(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow"
                      >
                        Copy Link & Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Member Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Cashier"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="staff@store.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Or Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Assigned Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none font-semibold"
                      >
                        <option value="ADMIN">Admin (Full book & business permissions)</option>
                        <option value="EDITOR">Editor (Can add, edit & view entries)</option>
                        <option value="VIEWER">Viewer (Read-only access)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setInviteModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition"
                      >
                        {isSubmitting ? "Inviting..." : "Send Invitation"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <AuthModal />
    </div>
  );
}
