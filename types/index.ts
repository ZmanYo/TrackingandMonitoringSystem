export type TransportationMode = 'FHWA' | 'FRA' | 'FTA' | 'MARAD';

export interface Project {
  id: string;
  tigerTrackingNumber: string;
  projectName: string;
  round: string;
  year: number;
  mode: TransportationMode;
  state: string;
  planningCapital: 'Planning' | 'Capital';
  applicant: string;
  administeringAgency?: string;
  totalRequested: string;
  totalCapitalCost?: string;
  projectDescription: string;
  projectPhase: 'Pre-construction' | 'Construction' | 'Substantially Complete' | 'Closed-out' | 'De-obligated/Cancelled';
}

export interface GrantDocument {
  id: string;
  projectId: string;
  fileName: string;
  documentType: 'Amendment' | 'Grant Agreement' | 'Executed Amendment(PDF)' | 'Executed Grant Agreement(PDF)' | 'Letter - Sent' | 'Letter - Received' | 'White Paper' | 'Memo' | 'Other';
  library: 'Working Grant Documents' | 'Other Documents' | 'Executed Grant Agreements';
  modifiedDate: string;
  modifiedBy: string;
  approvalStatus: string;
  checkInComment: string;
}

export interface QuarterlyReport {
  id: string;
  projectId: string;
  reportName: string;
  modifiedDate: string;
  modifiedBy: string;
  year: number;
  month: string;
  scope: 'No Deviation' | 'Limited Deviation' | 'Material Deviation';
  schedule: 'No Deviation' | 'Limited Deviation' | 'Material Deviation';
  budget: 'No Deviation' | 'Limited Deviation' | 'Material Deviation';
  scopeExplanation?: string;
  scheduleExplanation?: string;
  budgetExplanation?: string;
}