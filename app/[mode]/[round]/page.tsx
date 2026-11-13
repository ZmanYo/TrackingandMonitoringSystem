'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { initialProjects } from '@/data/mockData';
import { Project } from '@/types';
import { Search, Plus, Trash2, ArrowLeft, Download } from 'lucide-react';
import { AccessDenied, canAccessMode, canDeleteContent, canEditContent, useAuth } from '@/app/auth';
import type { TransportationMode } from '@/types';

function createProjectId(): string {
  return `p-${Date.now()}`;
}

export default function ProjectListPage() {
  const params = useParams();
  const mode = (params?.mode as string)?.toUpperCase() || 'FHWA';
  const roundYear = params?.round as string || 'B6-2026';
  const { currentUser, logout } = useAuth();
  const canEdit = canEditContent(currentUser) && canAccessMode(currentUser, mode);
  const canDelete = canDeleteContent(currentUser) && canAccessMode(currentUser, mode);
  
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    tigerTrackingNumber: `${mode[0]}26HC999`,
    projectName: '',
    applicant: '',
    state: 'California',
    planningCapital: 'Capital',
    totalRequested: '$5,000,000.00',
    projectDescription: '',
    projectPhase: 'Pre-construction',
  });

  const currentRoundCode = roundYear.split('-')[0];
  const currentYear = parseInt(roundYear.split('-')[1] || '2026');

  const modeProjects = projects.filter(
    (p) => p.mode === mode && p.round.toUpperCase() === currentRoundCode.toUpperCase()
  );

  const filteredProjects = modeProjects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tigerTrackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.applicant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (editingProjectId) {
      setProjects((current) => current.map((project) => project.id === editingProjectId
        ? {
            ...project,
            tigerTrackingNumber: newProject.tigerTrackingNumber || project.tigerTrackingNumber,
            projectName: newProject.projectName || project.projectName,
            state: newProject.state || project.state,
            applicant: newProject.applicant || project.applicant,
            projectDescription: newProject.projectDescription || project.projectDescription,
          }
        : project));
      setIsNewModalOpen(false);
      setEditingProjectId(null);
      return;
    }
    const created: Project = {
      id: createProjectId(),
      tigerTrackingNumber: newProject.tigerTrackingNumber || 'B26NEW',
      projectName: newProject.projectName || 'New Project',
      round: currentRoundCode,
      year: currentYear,
      mode: mode as TransportationMode,
      state: newProject.state || 'California',
      planningCapital: newProject.planningCapital || 'Capital',
      applicant: newProject.applicant || 'Local Municipality',
      totalRequested: newProject.totalRequested || '$1,000,000.00',
      projectDescription: newProject.projectDescription || 'No description provided.',
      projectPhase: newProject.projectPhase || 'Pre-construction',
    };

    setProjects((current) => [created, ...current]);
    setIsNewModalOpen(false);
  };

  const handleOpenEdit = (project: Project) => {
    if (!canEdit) return;
    setEditingProjectId(project.id);
    setNewProject(project);
    setIsNewModalOpen(true);
  };

  const handleExport = () => {
    if (currentUser?.role !== 'super-admin') return;
    const columns: (keyof Project)[] = [
      'tigerTrackingNumber',
      'projectName',
      'mode',
      'round',
      'year',
      'state',
      'applicant',
      'projectPhase',
      'totalRequested',
    ];
    const escapeCsv = (value: string | number | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
      columns.join(','),
      ...filteredProjects.map((project) => columns.map((column) => escapeCsv(project[column])).join(',')),
    ].join('\r\n');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mode}-${roundYear}-projects.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!canAccessMode(currentUser, mode)) {
    return <AccessDenied message={`Your account is limited to ${currentUser?.mode ?? 'its assigned'} mode.`} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#005a9c] text-white py-4 px-6 shadow flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 rounded-full hover:bg-blue-800 transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">{mode} Projects</h1>
        </div>
        <div className="flex items-center gap-2">
          {currentUser?.role === 'super-admin' && (
            <button onClick={handleExport} className="inline-flex items-center gap-2 rounded border border-white/50 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => {
                setEditingProjectId(null);
                setNewProject({
                  tigerTrackingNumber: `${mode[0]}26HC999`,
                  projectName: '',
                  applicant: '',
                  state: 'California',
                  planningCapital: 'Capital',
                  totalRequested: '$5,000,000.00',
                  projectDescription: '',
                  projectPhase: 'Pre-construction',
                });
                setIsNewModalOpen(true);
              }}
              className="bg-white text-[#005a9c] px-4 py-2 rounded font-semibold flex items-center space-x-2 shadow hover:bg-blue-50 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}
          <button onClick={logout} className="rounded border border-white/50 px-3 py-2 text-xs font-semibold hover:bg-white/10">Sign out</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="bg-[#0f62fe] text-white px-6 py-3 flex justify-between items-center">
            <span className="font-bold text-lg">{roundYear}</span>
            <span className="text-sm font-medium bg-blue-800 px-3 py-1 rounded">Count: {filteredProjects.length}</span>
          </div>

          <div className="p-4 border-b flex items-center space-x-3 bg-gray-50">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-80 bg-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b text-xs font-bold text-gray-700 uppercase">
                  <th className="p-3">Tracking Number</th>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Applicant</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Round</th>
                  <th className="p-3">Project Phase</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-blue-50/50 text-sm">
                      <td className="p-3 font-semibold text-blue-600">
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.tigerTrackingNumber}
                        </Link>
                      </td>
                      <td className="p-3">
                        <Link href={`/projects/${p.id}`} className="text-blue-600 font-medium hover:underline">
                          {p.projectName}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-700">{p.applicant}</td>
                      <td className="p-3 text-gray-700">{p.state}</td>
                      <td className="p-3 text-gray-700">{p.round}</td>
                      <td className="p-3 text-gray-700">{p.projectPhase}</td>
                      <td className="p-3 text-center space-x-3">
                        {canEdit && (
                          <button onClick={() => handleOpenEdit(p)} className="text-blue-600 text-xs font-semibold">
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            aria-label={`Delete ${p.projectName}`}
                            className="text-red-600 text-xs font-semibold inline-flex items-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500 text-sm">
                      No projects currently listed for {roundYear}.{canEdit && <> Click <strong>&quot;New Project&quot;</strong> to add one.</>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-[#005a9c]">{editingProjectId ? 'Edit Project' : 'Add New Project'}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.projectName || ''}
                  onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Tracking Number</label>
                  <input
                    type="text"
                    required
                    value={newProject.tigerTrackingNumber || ''}
                    onChange={(e) => setNewProject({ ...newProject, tigerTrackingNumber: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">State</label>
                  <input
                    type="text"
                    required
                    value={newProject.state || ''}
                    onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Applicant</label>
                <input
                  type="text"
                  required
                  value={newProject.applicant || ''}
                  onChange={(e) => setNewProject({ ...newProject, applicant: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Project Description</label>
                <textarea
                  rows={3}
                  value={newProject.projectDescription || ''}
                  onChange={(e) => setNewProject({ ...newProject, projectDescription: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setEditingProjectId(null);
                  }}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005a9c] text-white rounded text-sm font-semibold hover:bg-blue-800"
                >
                  {editingProjectId ? 'Save Changes' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}