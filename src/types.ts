export type UserRole = 'ADMIN' | 'INCIDENT_MANAGER' | 'ENGINEER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
}

export type Severity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export type IncidentStatus =
  | 'DETECTED'
  | 'TRIAGED'
  | 'INVESTIGATING'
  | 'MITIGATING'
  | 'RESOLVED'
  | 'CLOSED';

export type Environment = 'Production' | 'Staging' | 'Canary';

export type ServiceCriticality = 'TIER-0' | 'TIER-1' | 'TIER-2' | 'TIER-3';

export type ServiceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'OUTAGE' | 'MAINTENANCE';
export type ServiceHealth = ServiceHealthStatus;

export interface Service {
  id: string;
  name: string;
  description: string;
  owningTeam: string;
  environment: Environment;
  criticality: ServiceCriticality;
  repositoryUrl: string;
  healthStatus: ServiceHealthStatus;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceType =
  | 'LOG'
  | 'METRIC'
  | 'DEPLOYMENT'
  | 'ALERT'
  | 'CONFIG_CHANGE'
  | 'DATABASE'
  | 'NETWORK'
  | 'USER_REPORT'
  | 'COMMENT';

export interface Evidence {
  id: string;
  incidentId: string;
  type: EvidenceType;
  title: string;
  source: string;
  content: string;
  timestamp: string;
  createdBy: string;
  createdTimestamp: string;
}

export type TimelineEventType =
  | 'CREATED'
  | 'STATUS_CHANGE'
  | 'SEVERITY_CHANGE'
  | 'ASSIGNMENT'
  | 'EVIDENCE_ADDED'
  | 'INVESTIGATION'
  | 'COMMENT'
  | 'RESOLUTION';

export interface TimelineEvent {
  id: string;
  incidentId: string;
  eventType: TimelineEventType;
  title: string;
  description: string;
  actorName: string;
  actorRole: UserRole;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  serviceId: string;
  serviceName: string;
  environment: Environment;
  reportedBy: string;
  assignedEngineer?: string;
  incidentManager?: string;
  detectedTime: string;
  startedTime: string;
  acknowledgedTime?: string;
  resolvedTime?: string;
  customerImpact: boolean;
  impactSummary: string;
  createdTimestamp: string;
  updatedTimestamp: string;
  confirmedRootCause?: {
    hypothesisId: string;
    title: string;
    statement: string;
    confirmedBy: string;
    confirmedTimestamp: string;
  };
}

// ================= AI INVESTIGATION TYPES =================

export type FindingClassification =
  | 'OBSERVED_FACT'
  | 'CORRELATION'
  | 'AI_HYPOTHESIS'
  | 'RECOMMENDATION'
  | 'HUMAN_CONFIRMED';

export type HypothesisStatus =
  | 'PROPOSED'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED';

export interface RecommendedRunbook {
  id: string;
  title: string;
  description: string;
  command?: string;
  requiresApproval: boolean;
  docUrl?: string;
}

export interface Hypothesis {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  confidence: number; // 0 to 100
  status: HypothesisStatus;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  conclusion: string;
  recommendedSteps: string[];
  recommendedRunbooks: RecommendedRunbook[];
  createdAt: string;
  confirmedBy?: string;
  confirmedTimestamp?: string;
  confirmedRootCauseStatement?: string;
  rejectedBy?: string;
  rejectedTimestamp?: string;
  rejectedReason?: string;
}

export interface InvestigationFinding {
  id: string;
  classification: FindingClassification;
  title: string;
  detail: string;
  sourceEvidenceId?: string;
  timestamp?: string;
}

export interface InvestigationTimelineItem {
  id: string;
  timestamp: string;
  title: string;
  type: 'ALERT' | 'METRIC' | 'DEPLOYMENT' | 'LOG' | 'DATABASE' | 'SYSTEM';
  isAbnormal: boolean;
  classification: FindingClassification;
  detail: string;
}

export interface InvestigationChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundedEvidence?: string[];
}

export type InvestigationStatus = 'IDLE' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface Investigation {
  id: string;
  incidentId: string;
  status: InvestigationStatus;
  startedAt?: string;
  completedAt?: string;
  findings: InvestigationFinding[];
  timeline: InvestigationTimelineItem[];
  hypotheses: Hypothesis[];
  recommendedInvestigationSteps: string[];
  recommendedRunbooks: RecommendedRunbook[];
  confirmedRootCause?: {
    hypothesisId: string;
    title: string;
    statement: string;
    confirmedBy: string;
    confirmedTimestamp: string;
  };
  chatHistory: InvestigationChatMessage[];
  summary: string;
}

export interface IncidentTrendPoint {
  date: string;
  label: string;
  count: number;
  sev1Sev2: number;
  resolved: number;
}

export interface DashboardStats {
  openIncidentsCount: number;
  criticalIncidentsCount: number;
  sev1Count: number;
  sev2Count: number;
  sev3Count: number;
  sev4Count: number;
  avgResolutionTimeMinutes: number;
  avgAcknowledgeTimeMinutes: number;
  activeInvestigationsCount: number;
  activeHypothesesCount: number;
  servicesHealth: {
    total: number;
    healthy: number;
    degraded: number;
    outage: number;
    maintenance: number;
  };
  severityDistribution: { severity: Severity; count: number }[];
  statusDistribution: { status: IncidentStatus; count: number }[];
  incidentTrend: IncidentTrendPoint[];
}

export interface RolePermissions {
  canCreateIncident: boolean;
  canChangeStatus: boolean;
  canChangeSeverity: boolean;
  canAssignEngineer: boolean;
  canAddEvidence: boolean;
  canAddComment: boolean;
  canManageServices: boolean;
  canDeleteIncident: boolean;
  canManageInvestigation: boolean;
  canConfirmHypothesis: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canCreateIncident: true,
    canChangeStatus: true,
    canChangeSeverity: true,
    canAssignEngineer: true,
    canAddEvidence: true,
    canAddComment: true,
    canManageServices: true,
    canDeleteIncident: true,
    canManageInvestigation: true,
    canConfirmHypothesis: true,
  },
  INCIDENT_MANAGER: {
    canCreateIncident: true,
    canChangeStatus: true,
    canChangeSeverity: true,
    canAssignEngineer: true,
    canAddEvidence: true,
    canAddComment: true,
    canManageServices: true,
    canDeleteIncident: false,
    canManageInvestigation: true,
    canConfirmHypothesis: true,
  },
  ENGINEER: {
    canCreateIncident: true,
    canChangeStatus: true,
    canChangeSeverity: false,
    canAssignEngineer: true,
    canAddEvidence: true,
    canAddComment: true,
    canManageServices: false,
    canDeleteIncident: false,
    canManageInvestigation: true,
    canConfirmHypothesis: true,
  },
  VIEWER: {
    canCreateIncident: false,
    canChangeStatus: false,
    canChangeSeverity: false,
    canAssignEngineer: false,
    canAddEvidence: false,
    canAddComment: false,
    canManageServices: false,
    canDeleteIncident: false,
    canManageInvestigation: false,
    canConfirmHypothesis: false,
  },
};
