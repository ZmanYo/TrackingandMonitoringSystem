'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initialProjects, initialDocuments, initialReports } from '@/data/mockData';
import { Project, GrantDocument, QuarterlyReport } from '@/types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Edit2
} from 'lucide-react';
import { AccessDenied, canAccessMode, canApproveContent, canDeleteContent, canEditContent, useAuth } from '@/app/auth';

interface ReportFormState {
  reportDate: string;
  month: string;
  year: number;
  projectPhase: Project['projectPhase'];
  scope: QuarterlyReport['scope'];
  schedule: QuarterlyReport['schedule'];
  budget: QuarterlyReport['budget'];
  scopeExplanation: string;
  scheduleExplanation: string;
  budgetExplanation: string;
  hasAmendment: string;
  amendmentNumber: string;
  amendmentStatus: string;
  keyAccomplishments: string;
  executedGrantAgreementDate: string;
  executedGrantAgreementType: string;
  performanceEndDate: string;
  fundsObligatedDate: string;
  fundsObligatedType: string;
  substantialCompletionDate: string;
  substantialCompletionType: string;
  revenueServiceDate: string;
  revenueServiceType: string;
  groundbreakingDate: string;
  groundbreakingType: string;
  ribbonCuttingDate: string;
  ribbonCuttingType: string;
  siteVisitDate: string;
  siteVisitType: string;
  grantAwardAmount: string;
  obligatedAmount: string;
  totalProjectCost: string;
  fundsExpendedDate: string;
}

type ProjectTab = 'details' | 'working' | 'other' | 'executed' | 'reports';
const projectTabs: { id: ProjectTab; label: string }[] = [
  { id: 'details', label: 'Project Details' },
  { id: 'working', label: 'Working Grant Documents' },
  { id: 'other', label: 'Other Documents' },
  { id: 'executed', label: 'Executed Grant Agreement' },
  { id: 'reports', label: 'Quarterly Reports' },
];

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser, logout } = useAuth();

  const [project] = useState<Project>(() => {
    return initialProjects.find((p) => p.id === id) || initialProjects[1];
  });

  const [documents, setDocuments] = useState<GrantDocument[]>(() => {
    const docs = initialDocuments.filter((d) => d.projectId === project.id);
    if (!docs.some((d) => d.fileName.endsWith('.msg'))) {
      docs.push({
        id: 'doc3',
        projectId: project.id,
        fileName: 'B2-FHWA-B19HC001-Other-2023-09-28.msg',
        documentType: 'Other',
        library: 'Other Documents',
        modifiedDate: '9/28/2023 3:36 PM',
        modifiedBy: 'Dredske, Logan (OST)',
        approvalStatus: 'Pending',
        checkInComment: 'Email correspondence attachment.',
      });
    }
    return docs;
  });

  const [reports, setReports] = useState<QuarterlyReport[]>(() => {
    return initialReports.filter((r) => r.projectId === project.id);
  });

  const [activeTab, setActiveTab] = useState<ProjectTab>('reports');

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDocForActions, setSelectedDocForActions] = useState<GrantDocument | null>(null);

  // Quarterly Report Modals and Form State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState<ReportFormState>({
    reportDate: '10/21/2026',
    month: 'October',
    year: 2026,
    projectPhase: 'Construction',
    scope: 'No Deviation',
    schedule: 'No Deviation',
    budget: 'No Deviation',
    scopeExplanation: '',
    scheduleExplanation: '',
    budgetExplanation: '',
    hasAmendment: 'No',
    amendmentNumber: '',
    amendmentStatus: 'In Development',
    keyAccomplishments: '',
    executedGrantAgreementDate: '',
    executedGrantAgreementType: 'Expected',
    performanceEndDate: '',
    fundsObligatedDate: '',
    fundsObligatedType: 'Expected',
    substantialCompletionDate: '',
    substantialCompletionType: 'Expected',
    revenueServiceDate: '',
    revenueServiceType: 'Expected',
    groundbreakingDate: '',
    groundbreakingType: 'Expected',
    ribbonCuttingDate: '',
    ribbonCuttingType: 'Expected',
    siteVisitDate: '',
    siteVisitType: 'Expected',
    grantAwardAmount: '$12,500,000.00',
    obligatedAmount: '$12,500,000.00',
    totalProjectCost: '$15,000,000.00',
    fundsExpendedDate: '',
  });

  const [docForm, setDocForm] = useState({
    fileName: '',
    documentType: 'Amendment' as GrantDocument['documentType'],
    checkInComment: '',
  });
  const hasModeAccess = canAccessMode(currentUser, project.mode);
  const canEdit = hasModeAccess && canEditContent(currentUser);
  const canDelete = hasModeAccess && canDeleteContent(currentUser);
  const canApprove = hasModeAccess && canApproveContent(currentUser);

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    let targetLibrary: GrantDocument['library'] = 'Working Grant Documents';
    if (['Executed Amendment(PDF)', 'Executed Grant Agreement(PDF)'].includes(docForm.documentType)) {
      targetLibrary = 'Executed Grant Agreements';
    } else if (['Letter - Sent', 'Letter - Received', 'White Paper', 'Memo', 'Other'].includes(docForm.documentType)) {
      targetLibrary = 'Other Documents';
    }

    const createdDoc: GrantDocument = {
      id: `doc-${Date.now()}`,
      projectId: project.id,
      fileName: docForm.fileName || `${project.round}-${project.mode}-${project.tigerTrackingNumber}-${docForm.documentType}.docx`,
      documentType: docForm.documentType,
      library: targetLibrary,
      modifiedDate: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      modifiedBy: 'Current User (OST)',
      approvalStatus: 'Pending',
      checkInComment: docForm.checkInComment || 'Uploaded via Supporting Documents.',
    };

    setDocuments([createdDoc, ...documents]);
    setIsDocModalOpen(false);
    setDocForm({ fileName: '', documentType: 'Amendment', checkInComment: '' });
  };

  const handleOpenNewReportModal = () => {
    if (!canEdit) return;
    setEditingReportId(null);
    setReportForm({
      reportDate: new Date().toLocaleDateString(),
      month: 'October',
      year: 2026,
      projectPhase: 'Construction',
      scope: 'No Deviation',
      schedule: 'No Deviation',
      budget: 'No Deviation',
      scopeExplanation: '',
      scheduleExplanation: '',
      budgetExplanation: '',
      hasAmendment: 'No',
      amendmentNumber: '',
      amendmentStatus: 'In Development',
      keyAccomplishments: '',
      executedGrantAgreementDate: '',
      executedGrantAgreementType: 'Expected',
      performanceEndDate: '',
      fundsObligatedDate: '',
      fundsObligatedType: 'Expected',
      substantialCompletionDate: '',
      substantialCompletionType: 'Expected',
      revenueServiceDate: '',
      revenueServiceType: 'Expected',
      groundbreakingDate: '',
      groundbreakingType: 'Expected',
      ribbonCuttingDate: '',
      ribbonCuttingType: 'Expected',
      siteVisitDate: '',
      siteVisitType: 'Expected',
      grantAwardAmount: project.totalRequested,
      obligatedAmount: project.totalRequested,
      totalProjectCost: project.totalCapitalCost || '$15,000,000.00',
      fundsExpendedDate: '',
    });
    setIsReportModalOpen(true);
  };

  const handleOpenEditReportModal = (report: QuarterlyReport) => {
    if (!canEdit) return;
    setEditingReportId(report.id);
    setReportForm({
      reportDate: report.modifiedDate.split(' ')[0],
      month: report.month,
      year: report.year,
      projectPhase: 'Construction',
      scope: report.scope,
      schedule: report.schedule,
      budget: report.budget,
      scopeExplanation: report.scopeExplanation || '',
      scheduleExplanation: report.scheduleExplanation || '',
      budgetExplanation: report.budgetExplanation || '',
      hasAmendment: 'No',
      amendmentNumber: '',
      amendmentStatus: 'In Development',
      keyAccomplishments: '',
      executedGrantAgreementDate: '',
      executedGrantAgreementType: 'Expected',
      performanceEndDate: '',
      fundsObligatedDate: '',
      fundsObligatedType: 'Expected',
      substantialCompletionDate: '',
      substantialCompletionType: 'Expected',
      revenueServiceDate: '',
      revenueServiceType: 'Expected',
      groundbreakingDate: '',
      groundbreakingType: 'Expected',
      ribbonCuttingDate: '',
      ribbonCuttingType: 'Expected',
      siteVisitDate: '',
      siteVisitType: 'Expected',
      grantAwardAmount: project.totalRequested,
      obligatedAmount: project.totalRequested,
      totalProjectCost: project.totalCapitalCost || '$15,000,000.00',
      fundsExpendedDate: '',
    });
    setIsReportModalOpen(true);
  };

  const handleDeleteReport = (reportId: string) => {
    if (!canDelete) return;
    if (confirm('Are you sure you want to delete this Quarterly Report?')) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (editingReportId) {
      // Edit existing report
      setReports((prev) =>
        prev.map((r) =>
          r.id === editingReportId
            ? {
                ...r,
                month: reportForm.month,
                year: reportForm.year,
                scope: reportForm.scope,
                schedule: reportForm.schedule,
                budget: reportForm.budget,
                scopeExplanation: reportForm.scopeExplanation,
                scheduleExplanation: reportForm.scheduleExplanation,
                budgetExplanation: reportForm.budgetExplanation,
                modifiedDate: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              }
            : r
        )
      );
    } else {
      // Create new report
      const newReport: QuarterlyReport = {
        id: `qr-${Date.now()}`,
        projectId: project.id,
        reportName: `Quarterly - ${project.round} - ${project.mode} - ${project.tigerTrackingNumber} - ${reportForm.year}${reportForm.month}`,
        modifiedDate: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        modifiedBy: 'Current User (FHWA)',
        year: reportForm.year,
        month: reportForm.month,
        scope: reportForm.scope,
        schedule: reportForm.schedule,
        budget: reportForm.budget,
        scopeExplanation: reportForm.scopeExplanation,
        scheduleExplanation: reportForm.scheduleExplanation,
        budgetExplanation: reportForm.budgetExplanation,
      };
      setReports([newReport, ...reports]);
    }
    setIsReportModalOpen(false);
  };

  const handleSetApproval = (docId: string, status: string) => {
    if (!canApprove) return;
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, approvalStatus: status } : d)));
    setSelectedDocForActions(null);
  };

  const handleDeleteDoc = (docId: string) => {
    if (!canDelete) return;
    if (confirm('Delete this document?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setSelectedDocForActions(null);
    }
  };

  const renderFileIcon = (fileName: string) => {
    if (fileName.endsWith('.msg')) {
      return (
        <div className="w-8 h-8 bg-[#0078d4] text-white flex items-center justify-center rounded font-bold text-xs shadow-xs shrink-0">
          <Mail className="w-4 h-4" />
        </div>
      );
    }
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return (
        <div className="w-8 h-8 bg-[#185abd] text-white flex items-center justify-center rounded font-bold text-xs shadow-xs shrink-0">
          W
        </div>
      );
    }
    if (fileName.endsWith('.pdf')) {
      return (
        <div className="w-8 h-8 bg-[#d83b01] text-white flex items-center justify-center rounded font-bold text-xs shadow-xs shrink-0">
          PDF
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-gray-600 text-white flex items-center justify-center rounded font-bold text-xs shadow-xs shrink-0">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  if (!hasModeAccess) {
    return <AccessDenied message="This project belongs to a mode outside your account’s access." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-[#005a9c] text-white py-3 px-6 shadow flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full border border-white/60 flex items-center justify-center hover:bg-blue-800 transition"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">
          {project.round}-{project.year} - {project.projectName}
        </h1>
        <button onClick={logout} className="ml-auto rounded border border-white/50 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">Sign out</button>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white border-b border-gray-300 flex justify-between items-center px-4 sm:px-6 shadow-xs rounded-t">
          <div className="flex space-x-6 sm:space-x-8 text-sm">
            {projectTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#005a9c] text-[#005a9c]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="bg-[#005a9c] hover:bg-blue-800 text-white px-4 py-2 rounded text-xs sm:text-sm font-semibold transition shadow-xs"
            >
              Add Supporting Document
            </button>
          )}
        </div>

        <div className="bg-white shadow-xs rounded-b p-6 border-x border-b border-gray-200 min-h-[400px]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Project Master Details (Read-Only)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50 p-5 rounded border border-gray-200 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">TIGER Tracking Number</span>
                  <span className="font-semibold text-gray-800">{project.tigerTrackingNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">Round</span>
                  <span className="font-semibold text-gray-800">{project.round}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">Mode</span>
                  <span className="font-semibold text-gray-800">{project.mode}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">State</span>
                  <span className="font-semibold text-gray-800">{project.state}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">Planning/Capital</span>
                  <span className="font-semibold text-gray-800">{project.planningCapital}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">Applicant</span>
                  <span className="font-semibold text-gray-800">{project.applicant}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">Administering Agency</span>
                  <span className="font-semibold text-gray-800">{project.administeringAgency || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">Total Requested</span>
                  <span className="font-semibold text-gray-800">{project.totalRequested}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-bold uppercase text-[10px]">Total Capital Cost</span>
                  <span className="font-semibold text-gray-800">{project.totalCapitalCost || 'N/A'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Project Description</h4>
                <div className="p-4 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700">
                  {project.projectDescription}
                </div>
              </div>

              {currentUser?.role === 'super-admin' && <div className="pt-2">
                <button className="bg-[#005a9c] text-white px-4 py-2 rounded text-xs font-bold flex items-center space-x-2">
                  <Download className="w-3.5 h-3.5" />
                  <span>Bulk Download Button</span>
                </button>
              </div>}
            </div>
          )}

          {(activeTab === 'working' || activeTab === 'other' || activeTab === 'executed') && (
            <div className="space-y-3">
              {documents
                .filter((d) => {
                  if (activeTab === 'working') return d.library === 'Working Grant Documents';
                  if (activeTab === 'other') return d.library === 'Other Documents';
                  return d.library === 'Executed Grant Agreements';
                })
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="border-b border-gray-200 py-3.5 px-2 flex justify-between items-start sm:items-center hover:bg-gray-50/60 transition"
                  >
                    <div className="flex items-start space-x-4">
                      {renderFileIcon(doc.fileName)}
                      <div>
                        <a href="#" className="font-medium text-[#005a9c] hover:underline text-sm sm:text-base">
                          {doc.fileName}
                        </a>
                        <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-4">
                          <span>Modified: <strong>{doc.modifiedDate}</strong></span>
                          <span>Modified By: <strong>{doc.modifiedBy}</strong></span>
                        </div>
                        <div className="text-xs text-gray-700 mt-1">
                          Approval Status: <strong className="text-gray-900">{doc.approvalStatus}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDocForActions(doc)}
                      className="bg-[#605e5c] hover:bg-gray-700 text-white text-xs font-semibold px-4 py-1.5 rounded transition shadow-xs mt-2 sm:mt-0"
                    >
                      More Actions
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 5: Quarterly Reports with New, Edit, and Delete action buttons */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-800">Quarterly Reports Status</h3>
                {canEdit && (
                  <button
                    onClick={handleOpenNewReportModal}
                    className="bg-[#005a9c] text-white px-3.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 hover:bg-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Quarterly Report</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b text-xs font-bold text-gray-700 uppercase">
                      <th className="p-3">Report File Name</th>
                      <th className="p-3">Scope</th>
                      <th className="p-3">Schedule</th>
                      <th className="p-3">Budget</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <a href="#" className="font-semibold text-[#005a9c] hover:underline">
                            {r.reportName}
                          </a>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Modified: {r.modifiedDate} | Modified By: {r.modifiedBy}
                          </div>
                        </td>
                        <td className="p-3 text-green-600 font-bold">{r.scope}</td>
                        <td className="p-3 text-green-600 font-bold">{r.schedule}</td>
                        <td className="p-3 text-green-600 font-bold">{r.budget}</td>
                        <td className="p-3 text-center space-x-2">
                          {canEdit && <button
                              onClick={() => handleOpenEditReportModal(r)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-semibold inline-flex items-center space-x-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>}
                          {canDelete && <button
                              onClick={() => handleDeleteReport(r.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-semibold inline-flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>}
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                          No quarterly reports found. Click <strong>&quot;New Quarterly Report&quot;</strong> to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Supporting Document Upload */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-[#005a9c] mb-4 border-b pb-2">Upload Supporting Document</h2>
            <form onSubmit={handleUploadDocument} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Document Type *</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value as GrantDocument['documentType'] })}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="Amendment">Amendment</option>
                  <option value="Grant Agreement">Grant Agreement</option>
                  <option value="Executed Amendment(PDF)">Executed Amendment(PDF)</option>
                  <option value="Executed Grant Agreement(PDF)">Executed Grant Agreement(PDF)</option>
                  <option value="Letter - Sent">Letter - Sent</option>
                  <option value="Letter - Received">Letter - Received</option>
                  <option value="White Paper">White Paper</option>
                  <option value="Memo">Memo</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Amendment.docx"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Check In Comment *</label>
                <textarea
                  required
                  rows={2}
                  value={docForm.checkInComment}
                  onChange={(e) => setDocForm({ ...docForm, checkInComment: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="Add check-in comment..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setIsDocModalOpen(false)} className="px-4 py-2 border rounded text-xs font-bold">Close</button>
                <button type="submit" className="px-4 py-2 bg-[#005a9c] text-white rounded text-xs font-bold">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Document Actions */}
      {selectedDocForActions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl text-sm">
            <h3 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Document Details & Actions</h3>
            <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded text-xs border">
              <div><strong>File Name:</strong> {selectedDocForActions.fileName}</div>
              <div><strong>Status:</strong> {selectedDocForActions.approvalStatus}</div>
            </div>
            <div className="space-y-2">
              {canApprove && <>
                <button
                  onClick={() => handleSetApproval(selectedDocForActions.id, 'Approved - OST approved')}
                  className="w-full py-2 bg-green-600 text-white rounded font-bold text-xs flex items-center justify-center space-x-2 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve Document</span>
                </button>
                <button
                  onClick={() => handleSetApproval(selectedDocForActions.id, 'Rejected')}
                  className="w-full py-2 bg-red-600 text-white rounded font-bold text-xs flex items-center justify-center space-x-2 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Document</span>
                </button>
              </>}
              {canDelete && <button
                  onClick={() => handleDeleteDoc(selectedDocForActions.id)}
                  className="w-full py-2 border border-red-200 text-red-600 rounded font-bold text-xs flex items-center justify-center space-x-2 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete File</span>
                </button>}
              <button
                onClick={() => setSelectedDocForActions(null)}
                className="w-full py-2 border rounded font-bold text-xs text-gray-600 mt-2 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Quarterly Report Form (New & Edit Form matching all specifications) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
            <h2 className="text-base font-bold text-[#005a9c] mb-4 border-b pb-2">
              {editingReportId ? 'Edit Quarterly Report' : 'New Quarterly Report Form'}
            </h2>

            <form onSubmit={handleSaveReport} className="space-y-6 text-sm">
              {/* SECTION 1: Project Details (Read-only master attributes) */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase bg-gray-100 p-2 rounded mb-3">Project Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded border text-xs">
                  <div>
                    <span className="text-gray-500 block font-bold">Project Name</span>
                    <span className="font-semibold text-gray-800">{project.projectName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-bold">Tracking Number</span>
                    <span className="font-semibold text-gray-800">{project.tigerTrackingNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-bold">Round / Year</span>
                    <span className="font-semibold text-gray-800">{project.round} / {project.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-bold">Mode / State</span>
                    <span className="font-semibold text-gray-800">{project.mode} / {project.state}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Report Details */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase bg-gray-100 p-2 rounded mb-3">Report Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Report Date</label>
                    <input
                      type="text"
                      value={reportForm.reportDate}
                      onChange={(e) => setReportForm({ ...reportForm, reportDate: e.target.value })}
                      className="w-full border rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Month</label>
                    <select
                      value={reportForm.month}
                      onChange={(e) => setReportForm({ ...reportForm, month: e.target.value })}
                      className="w-full border rounded p-2 text-xs bg-white"
                    >
                      <option value="January">January</option>
                      <option value="April">April</option>
                      <option value="July">July</option>
                      <option value="October">October</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Year *</label>
                    <input
                      type="number"
                      required
                      value={reportForm.year}
                      onChange={(e) => setReportForm({ ...reportForm, year: parseInt(e.target.value) })}
                      className="w-full border rounded p-2 text-xs"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Project Phase *</label>
                  <select
                    value={reportForm.projectPhase}
                    onChange={(e) => setReportForm({ ...reportForm, projectPhase: e.target.value as Project['projectPhase'] })}
                    className="w-full border rounded p-2 text-xs bg-white"
                  >
                    <option value="Pre-construction">Pre-construction</option>
                    <option value="Construction">Construction</option>
                    <option value="Substantially Complete">Substantially Complete</option>
                    <option value="Closed-out">Closed-out</option>
                    <option value="De-obligated/Cancelled">De-obligated/Cancelled</option>
                  </select>
                </div>
              </div>

              {/* SECTION 3: Project Status & Deviations */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase bg-gray-100 p-2 rounded mb-3">Project Status (Deviations)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Scope *</label>
                    <select
                      value={reportForm.scope}
                      onChange={(e) => setReportForm({ ...reportForm, scope: e.target.value as QuarterlyReport['scope'] })}
                      className="w-full border rounded p-2 text-xs bg-white"
                    >
                      <option value="No Deviation">No Deviation</option>
                      <option value="Limited Deviation">Limited Deviation</option>
                      <option value="Material Deviation">Material Deviation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Schedule *</label>
                    <select
                      value={reportForm.schedule}
                      onChange={(e) => setReportForm({ ...reportForm, schedule: e.target.value as QuarterlyReport['schedule'] })}
                      className="w-full border rounded p-2 text-xs bg-white"
                    >
                      <option value="No Deviation">No Deviation</option>
                      <option value="Limited Deviation">Limited Deviation</option>
                      <option value="Material Deviation">Material Deviation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Budget *</label>
                    <select
                      value={reportForm.budget}
                      onChange={(e) => setReportForm({ ...reportForm, budget: e.target.value as QuarterlyReport['budget'] })}
                      className="w-full border rounded p-2 text-xs bg-white"
                    >
                      <option value="No Deviation">No Deviation</option>
                      <option value="Limited Deviation">Limited Deviation</option>
                      <option value="Material Deviation">Material Deviation</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Scope - Explanation of AND Reason for Deviation *</label>
                    <textarea
                      rows={2}
                      value={reportForm.scopeExplanation}
                      onChange={(e) => setReportForm({ ...reportForm, scopeExplanation: e.target.value })}
                      className="w-full border rounded p-2 text-xs"
                      placeholder="Rich text explanation..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Schedule - Explanation of AND Reason for Deviation *</label>
                    <textarea
                      rows={2}
                      value={reportForm.scheduleExplanation}
                      onChange={(e) => setReportForm({ ...reportForm, scheduleExplanation: e.target.value })}
                      className="w-full border rounded p-2 text-xs"
                      placeholder="Rich text explanation..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Budget - Explanation of AND Reason for Deviation *</label>
                    <textarea
                      rows={2}
                      value={reportForm.budgetExplanation}
                      onChange={(e) => setReportForm({ ...reportForm, budgetExplanation: e.target.value })}
                      className="w-full border rounded p-2 text-xs"
                      placeholder="Rich text explanation..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Project Core Accountability */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase bg-gray-100 p-2 rounded mb-3">Project Core Accountability</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600">Grant Award Amount</label>
                    <input
                      type="text"
                      value={reportForm.grantAwardAmount}
                      onChange={(e) => setReportForm({ ...reportForm, grantAwardAmount: e.target.value })}
                      className="w-full border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600">Obligated Amount</label>
                    <input
                      type="text"
                      value={reportForm.obligatedAmount}
                      onChange={(e) => setReportForm({ ...reportForm, obligatedAmount: e.target.value })}
                      className="w-full border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600">Total Project Cost</label>
                    <input
                      type="text"
                      value={reportForm.totalProjectCost}
                      onChange={(e) => setReportForm({ ...reportForm, totalProjectCost: e.target.value })}
                      className="w-full border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600">Funds Expended Date</label>
                    <input
                      type="date"
                      value={reportForm.fundsExpendedDate}
                      onChange={(e) => setReportForm({ ...reportForm, fundsExpendedDate: e.target.value })}
                      className="w-full border rounded p-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border rounded text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005a9c] text-white rounded text-xs font-bold hover:bg-blue-800 shadow"
                >
                  {editingReportId ? 'Update Report' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}