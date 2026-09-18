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
}

export interface DashboardStats {
  openIncidentsCount: number;
  criticalIncidentsCount: number;
  sev1Count: number;
  sev2Count: number;
  sev3Count: number;
  sev4Count: number;
  avgResolutionTimeMinutes: number;
  activeInvestigationsCount: number;
  servicesHealth: {
    total: number;
    healthy: number;
    degraded: number;
    outage: number;
    maintenance: number;
  };
  severityDistribution: { severity: Severity; count: number }[];
  statusDistribution: { status: IncidentStatus; count: number }[];
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
  },
};
