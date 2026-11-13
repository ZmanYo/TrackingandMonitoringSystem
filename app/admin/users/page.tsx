'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Plus, Shield, Trash2, Users } from 'lucide-react';
import { AccessDenied, AccountInput, AccountUpdate, UserAccount, UserRole, useAuth } from '@/app/auth';
import type { TransportationMode } from '@/types';

const modes: TransportationMode[] = ['FHWA', 'FRA', 'FTA', 'MARAD'];

const roleLabels: Record<UserRole, string> = {
  basic: 'Basic User',
  'mode-admin': 'Mode-Admin',
  admin: 'Admin',
  'super-admin': 'Super Admin',
};

const permissions: { role: UserRole; description: string }[] = [
  { role: 'basic', description: 'View, add, and edit items in the assigned mode. Cannot delete or approve/reject.' },
  { role: 'mode-admin', description: 'View, add, edit, delete, and approve/reject items in the assigned mode.' },
  { role: 'admin', description: 'View, add, edit, and delete items across all modes. No user-access management.' },
  { role: 'super-admin', description: 'All-mode CRUD, user access, views, lists, libraries, and data export.' },
];

interface AccountForm {
  username: string;
  password: string;
  role: UserRole;
  mode: TransportationMode;
  active: boolean;
}

const emptyForm: AccountForm = {
  username: '',
  password: '',
  role: 'basic',
  mode: 'FHWA',
  active: true,
};

export default function UserAccessPage() {
  const { accounts, currentUser, createAccount, updateAccount, deleteAccount, logout } = useAuth();
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const needsMode = form.role === 'basic' || form.role === 'mode-admin';

  const openNewAccount = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setIsFormOpen(true);
  };

  const openEditAccount = (account: UserAccount) => {
    setEditingId(account.id);
    setForm({
      username: account.username,
      password: '',
      role: account.role,
      mode: account.mode ?? 'FHWA',
      active: account.active,
    });
    setError(null);
    setIsFormOpen(true);
  };

  const saveAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (editingId) {
        const update: AccountUpdate = {
          username: form.username,
          password: form.password,
          role: form.role,
          ...(needsMode ? { mode: form.mode } : {}),
          active: form.active,
        };
        await updateAccount(editingId, update);
      } else {
        const account: AccountInput = {
          username: form.username,
          password: form.password,
          role: form.role,
          ...(needsMode ? { mode: form.mode } : {}),
        };
        await createAccount(account);
      }
      setIsFormOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the account.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeAccount = (account: UserAccount) => {
    if (!confirm(`Delete the account "${account.username}"?`)) return;
    setError(null);
    try {
      deleteAccount(account.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the account.');
    }
  };

  if (currentUser?.role !== 'super-admin') {
    return <AccessDenied message="Only Super Admins can manage user access." />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#005a9c] px-5 py-4 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to projects" className="rounded-full p-2 hover:bg-blue-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">User Access Management</h1>
              <p className="text-xs text-blue-100">Signed in as {currentUser?.username} · Super Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-blue-100 hover:text-white">Return to projects</Link>
            <button onClick={logout} className="rounded border border-white/50 px-3 py-2 text-xs font-semibold hover:bg-white/10">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Users</h2>
            <p className="mt-1 text-sm text-slate-600">Create accounts and assign a role and mode scope.</p>
          </div>
          <button onClick={openNewAccount} className="inline-flex items-center gap-2 rounded-md bg-[#005a9c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            <Plus className="h-4 w-4" /> Create user
          </button>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          This demo stores user records in this browser’s local storage. Passwords are salted and hashed, but browser-side roles and data are not secure authentication. Do not use real credentials or rely on this prototype to protect production data.
        </div>

        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b bg-slate-50 px-5 py-4">
            <Users className="h-5 w-5 text-[#005a9c]" />
            <h3 className="font-bold text-slate-800">User accounts ({accounts.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Mode scope</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {account.username}{account.id === currentUser?.id && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                    </td>
                    <td className="px-5 py-4">{roleLabels[account.role]}</td>
                    <td className="px-5 py-4">{account.mode ?? 'All modes'}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${account.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                        {account.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openEditAccount(account)} className="mr-4 font-semibold text-blue-700 hover:text-blue-900">Edit</button>
                      <button
                        onClick={() => removeAccount(account)}
                        disabled={account.id === currentUser?.id}
                        aria-label={`Delete ${account.username}`}
                        className="inline-flex items-center text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No accounts have been created.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {permissions.map(({ role, description }) => (
            <article key={role} className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-bold text-slate-800">{roleLabels[role]}</h3>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </article>
          ))}
          <article className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:col-span-2">
            <h3 className="flex items-center gap-2 font-bold text-blue-900"><Shield className="h-4 w-4" /> Super Admin tools</h3>
            <p className="mt-1 text-sm text-blue-800">Super Admins have access to user management, all transportation modes, and the system-wide views, lists, libraries, and export functions as those modules are added.</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-800"><KeyRound className="h-4 w-4" /> User passwords are never displayed after account creation.</div>
          </article>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit user account' : 'Create user account'}</h2>
            <form onSubmit={saveAccount} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Username
                <input required minLength={3} maxLength={32} pattern="[a-zA-Z0-9._\-]+" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
                <span className="mt-1 block text-xs font-normal text-slate-500">3-32 letters, numbers, dots, underscores, or hyphens.</span>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {editingId ? 'New password (leave blank to keep current)' : 'Password'}
                <input
                  type="password"
                  autoComplete="new-password"
                  required={!editingId}
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Permission group
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal">
                  {Object.entries(roleLabels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                </select>
              </label>
              {needsMode && (
                <label className="block text-sm font-semibold text-slate-700">
                  Assigned mode
                  <select value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as TransportationMode })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal">
                    {modes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </label>
              )}
              {editingId && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                  Account active
                </label>
              )}
              {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-md border px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" disabled={isSaving} className="rounded-md bg-[#005a9c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Create user'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
