import { useEffect, useMemo, useState } from "react";
import { PageWrapper, FadeItem } from "../motion-utils";
import { motion } from "motion/react";
import { Shield, Search, Plus, Settings2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { roleService } from "@/services/role";
import { getApiErrorMessage } from "@/services/api.ts";

interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  user_count: number;
  permissions: Array<{
    id: string;
    code: string;
    module_name: string;
    action_name: string;
    description?: string;
  }>;
  created_at: string;
}

interface PermissionRow {
  id: string;
  code: string;
  module_name: string;
  action_name: string;
  description?: string;
}

interface RoleCreateForm {
  code: string;
  name: string;
  description: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function RoleCreateModal(props: {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onSubmit: (payload: RoleCreateForm) => Promise<void>;
}) {
  const { open, creating, onClose, onSubmit } = props;
  const [form, setForm] = useState<RoleCreateForm>({ code: "", name: "", description: "" });

  useEffect(() => {
    if (!open) {
      setForm({ code: "", name: "", description: "" });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-xl rounded-[16px] border border-white/70 bg-white shadow-[0_12px_38px_rgba(15,23,42,0.2)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-800">Tao role moi</h3>
            <p className="mt-0.5 text-[12px] text-slate-400">Role se duoc luu truc tiep vao auth_db</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Code</span>
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase().replace(/\s+/g, "_") }))}
              placeholder="VD: AUDITOR"
              className="w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-violet-300 focus:ring-[3px] focus:ring-violet-500/10"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Ten role</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="VD: Thu kho"
              className="w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-violet-300 focus:ring-[3px] focus:ring-violet-500/10"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Mo ta</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Mo ta ngan cho role"
              className="w-full resize-none rounded-[10px] border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-violet-300 focus:ring-[3px] focus:ring-violet-500/10"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50">
            Huy
          </button>
          <button
            disabled={creating || !form.code.trim() || !form.name.trim()}
            onClick={() => void onSubmit(form)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-violet-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {creating ? "Dang tao..." : "Tao role"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RolePermissionModal(props: {
  open: boolean;
  role: RoleRow | null;
  permissions: PermissionRow[];
  selected: Set<string>;
  loadingPermissions: boolean;
  saving: boolean;
  keyword: string;
  onClose: () => void;
  onToggle: (permissionId: string) => void;
  onSearchChange: (value: string) => void;
  onSelectAllFiltered: () => void;
  onClearFiltered: () => void;
  onSave: () => Promise<void>;
}) {
  const {
    open,
    role,
    permissions,
    selected,
    loadingPermissions,
    saving,
    keyword,
    onClose,
    onToggle,
    onSearchChange,
    onSelectAllFiltered,
    onClearFiltered,
    onSave,
  } = props;

  const filteredPermissions = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return permissions;
    return permissions.filter((permission) => {
      return (
        permission.code.toLowerCase().includes(key)
        || String(permission.description || "").toLowerCase().includes(key)
        || String(permission.module_name || "").toLowerCase().includes(key)
      );
    });
  }, [keyword, permissions]);

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionRow[]>();
    for (const permission of filteredPermissions) {
      const group = permission.module_name || "other";
      if (!map.has(group)) map.set(group, []);
      map.get(group)?.push(permission);
    }
    return [...map.entries()];
  }, [filteredPermissions]);

  if (!open || !role) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-5">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[16px] border border-white/70 bg-white shadow-[0_12px_42px_rgba(15,23,42,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-800">Phan quyen role: {role.name}</h3>
            <p className="mt-0.5 text-[12px] text-slate-400">Code: {role.code} · Tick de cap/thu hoi quyen va luu vao DB</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tim permission theo code/module/mo ta"
                className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-violet-300 focus:ring-[3px] focus:ring-violet-500/10"
              />
            </div>
            <button
              onClick={onSelectAllFiltered}
              className="rounded-[10px] border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Chon tat ca ket qua
            </button>
            <button
              onClick={onClearFiltered}
              className="rounded-[10px] border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Bo chon ket qua
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loadingPermissions ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Dang tai danh sach permission...
            </div>
          ) : groupedPermissions.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-slate-400">Khong co permission phu hop</div>
          ) : (
            <div className="space-y-4">
              {groupedPermissions.map(([moduleName, modulePermissions]) => (
                <div key={moduleName} className="rounded-[12px] border border-slate-100">
                  <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                    {moduleName}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {modulePermissions.map((permission) => {
                      const checked = selected.has(permission.id);
                      return (
                        <label key={permission.id} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-violet-50/40">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(permission.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
                          />
                          <div>
                            <p className="text-[13px] font-semibold text-slate-700">{permission.code}</p>
                            <p className="text-[12px] text-slate-500">{permission.description || `${permission.module_name}.${permission.action_name}`}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <p className="text-[12px] text-slate-500">Da chon {selected.size} permission</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50">
              Huy
            </button>
            <button
              disabled={saving}
              onClick={() => void onSave()}
              className="inline-flex items-center gap-2 rounded-[10px] bg-violet-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Dang luu..." : "Luu thay doi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionKeyword, setPermissionKeyword] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAll();
      setRoles((response?.data || []) as RoleRow[]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong tai duoc danh sach role"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const loadPermissions = async () => {
    if (permissions.length > 0) return;
    try {
      setLoadingPermissions(true);
      const response = await roleService.getPermissions();
      setPermissions((response?.data || []) as PermissionRow[]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong tai duoc danh sach permission"));
    } finally {
      setLoadingPermissions(false);
    }
  };

  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return roles;

    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(keyword)
        || role.code.toLowerCase().includes(keyword)
        || String(role.description || "").toLowerCase().includes(keyword)
      );
    });
  }, [roles, search]);

  const totalUsers = useMemo(() => roles.reduce((sum, role) => sum + Number(role.user_count || 0), 0), [roles]);
  const totalGrantedPermissions = useMemo(
    () => roles.reduce((sum, role) => sum + (Array.isArray(role.permissions) ? role.permissions.length : 0), 0),
    [roles],
  );

  const openPermissionModal = async (role: RoleRow) => {
    setEditingRole(role);
    setPermissionKeyword("");
    setSelectedPermissionIds(new Set((role.permissions || []).map((permission) => permission.id)));
    await loadPermissions();
  };

  const closePermissionModal = () => {
    if (savingPermissions) return;
    setEditingRole(null);
    setPermissionKeyword("");
    setSelectedPermissionIds(new Set());
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const selectAllFilteredPermissions = () => {
    const key = permissionKeyword.trim().toLowerCase();
    const filtered = !key
      ? permissions
      : permissions.filter((permission) => {
        return (
          permission.code.toLowerCase().includes(key)
          || String(permission.description || "").toLowerCase().includes(key)
          || String(permission.module_name || "").toLowerCase().includes(key)
        );
      });

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      for (const permission of filtered) {
        next.add(permission.id);
      }
      return next;
    });
  };

  const clearFilteredPermissions = () => {
    const key = permissionKeyword.trim().toLowerCase();
    const filteredIds = new Set(
      (!key
        ? permissions
        : permissions.filter((permission) => {
          return (
            permission.code.toLowerCase().includes(key)
            || String(permission.description || "").toLowerCase().includes(key)
            || String(permission.module_name || "").toLowerCase().includes(key)
          );
        })
      ).map((permission) => permission.id),
    );

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) {
        next.delete(id);
      }
      return next;
    });
  };

  const saveRolePermissions = async () => {
    if (!editingRole) return;
    try {
      setSavingPermissions(true);
      await roleService.update(editingRole.id, {
        permission_ids: [...selectedPermissionIds],
      });
      toast.success(`Da cap nhat permission cho role ${editingRole.code}`);
      await loadData();
      closePermissionModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong cap nhat duoc permission"));
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateRole = async (payload: RoleCreateForm) => {
    try {
      setCreatingRole(true);
      await roleService.create({
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        description: payload.description.trim() || undefined,
      });
      toast.success("Tao role thanh cong");
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong tao duoc role"));
    } finally {
      setCreatingRole(false);
    }
  };

  return (
    <PageWrapper className="space-y-5">
      <FadeItem>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center border border-violet-200/40">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="tracking-[-0.02em]">Role Management</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Hien thi role va permission tu du lieu DB</p>
          </div>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-[12px] border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50/60 p-4">
            <p className="text-[11px] text-violet-700">Total Roles</p>
            <p className="mt-1 text-[28px] text-violet-700" style={{ fontWeight: 700 }}>{roles.length}</p>
          </div>
          <div className="rounded-[12px] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50/60 p-4">
            <p className="text-[11px] text-blue-700">Users Assigned</p>
            <p className="mt-1 text-[28px] text-blue-700" style={{ fontWeight: 700 }}>{totalUsers}</p>
          </div>
          <div className="rounded-[12px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4">
            <p className="text-[11px] text-emerald-700">Granted Permissions</p>
            <p className="mt-1 text-[28px] text-emerald-700" style={{ fontWeight: 700 }}>{totalGrantedPermissions}</p>
          </div>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-sm flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tim theo role code, ten, mo ta..."
              className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none focus:border-violet-300 focus:ring-[3px] focus:ring-violet-500/10"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-violet-600 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Tao role
          </button>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="overflow-hidden rounded-[16px] border border-white/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-violet-50/40 to-transparent">
                {[
                  "Role",
                  "Code",
                  "Description",
                  "Users",
                  "Permissions",
                  "System",
                  "Created",
                  "Actions",
                ].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[13px] text-slate-400">Dang tai du lieu...</td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[13px] text-slate-400">Khong co role nao</td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <motion.tr key={role.id} className="border-b border-slate-50 last:border-0 hover:bg-violet-50/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-5 py-3.5 text-[13px] font-semibold">{role.name}</td>
                    <td className="px-5 py-3.5 text-[12px] font-mono text-violet-700">{role.code}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500 max-w-[280px]">{role.description || "-"}</td>
                    <td className="px-5 py-3.5 text-[13px]">{role.user_count || 0}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {(role.permissions || []).slice(0, 4).map((permission) => (
                          <span key={permission.id} className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                            {permission.code}
                          </span>
                        ))}
                        {(role.permissions || []).length > 4 ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            +{(role.permissions || []).length - 4}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${role.is_system ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                        {role.is_system ? "SYSTEM" : "CUSTOM"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{formatDate(role.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => void openPermissionModal(role)}
                        className="inline-flex items-center gap-1.5 rounded-[9px] border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[12px] font-semibold text-violet-700 transition hover:bg-violet-100"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Phan quyen
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeItem>

      <RoleCreateModal
        open={showCreateModal}
        creating={creatingRole}
        onClose={() => {
          if (!creatingRole) setShowCreateModal(false);
        }}
        onSubmit={handleCreateRole}
      />

      <RolePermissionModal
        open={Boolean(editingRole)}
        role={editingRole}
        permissions={permissions}
        selected={selectedPermissionIds}
        loadingPermissions={loadingPermissions}
        saving={savingPermissions}
        keyword={permissionKeyword}
        onClose={closePermissionModal}
        onToggle={togglePermission}
        onSearchChange={setPermissionKeyword}
        onSelectAllFiltered={selectAllFilteredPermissions}
        onClearFiltered={clearFilteredPermissions}
        onSave={saveRolePermissions}
      />
    </PageWrapper>
  );
}
