import {
  Incident,
  Service,
  Evidence,
  TimelineEvent,
  User,
  DashboardStats,
  Severity,
  IncidentStatus,
  Investigation,
  Hypothesis,
  HypothesisStatus,
  Organization,
  Team,
  UserRole,
  RolePermissions,
} from './types';

let currentAuthToken = localStorage.getItem('resolveiq_auth_token') || '';
let currentUserId = localStorage.getItem('resolveiq_user_id') || '';

export function getAuthToken(): string {
  if (!currentAuthToken) {
    currentAuthToken = localStorage.getItem('resolveiq_auth_token') || '';
  }
  return currentAuthToken;
}

export function setAuthToken(token: string | null) {
  if (token) {
    currentAuthToken = token;
    localStorage.setItem('resolveiq_auth_token', token);
  } else {
    currentAuthToken = '';
    localStorage.removeItem('resolveiq_auth_token');
  }
}

export function setCurrentUser(userId: string) {
  currentUserId = userId;
  localStorage.setItem('resolveiq_user_id', userId);
}

export function getCurrentUserId(): string {
  const saved = localStorage.getItem('resolveiq_user_id');
  if (saved) {
    currentUserId = saved;
  }
  return currentUserId;
}

export function clearAuthSession() {
  currentAuthToken = '';
  currentUserId = '';
  localStorage.removeItem('resolveiq_auth_token');
  localStorage.removeItem('resolveiq_user_id');
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }
  const uid = getCurrentUserId();
  if (uid) {
    headers['x-user-id'] = uid;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.error) {
        errorMsg = errData.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Auth & Session
  async getSetupStatus(): Promise<{ hasUsers: boolean; userCount: number }> {
    return fetchWithAuth('/api/auth/setup-status');
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    title?: string;
  }): Promise<{ token: string; user: User; organization: Organization; permissions: RolePermissions }> {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      setAuthToken(data.token);
      setCurrentUser(data.user.id);
    }
    return data;
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: User; organization: Organization; permissions: RolePermissions }> {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      setAuthToken(data.token);
      setCurrentUser(data.user.id);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore error
    } finally {
      clearAuthSession();
    }
  },

  async getMe(): Promise<{ user: User; organization: Organization; permissions: RolePermissions }> {
    return fetchWithAuth('/api/auth/me');
  },

  async getUsers(): Promise<User[]> {
    const data = await fetchWithAuth('/api/auth/users');
    return data.users;
  },

  async getCurrentUser(): Promise<{ user: User; permissions: any }> {
    return fetchWithAuth('/api/auth/current');
  },

  // Organization & Team Management
  async getOrgInfo(): Promise<{ organization: Organization }> {
    return fetchWithAuth('/api/org/info');
  },

  async getOrgMembers(): Promise<User[]> {
    const data = await fetchWithAuth('/api/org/members');
    return data.members;
  },

  async addOrgMember(payload: {
    name: string;
    email: string;
    contractorEmail?: string;
    contractorId?: string;
    isContractor?: boolean;
    vendorCompany?: string;
    password: string;
    role: UserRole;
    title?: string;
    teams?: string[];
  }): Promise<User> {
    const data = await fetchWithAuth('/api/org/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.member;
  },

  async updateMember(userId: string, updates: {
    role?: UserRole;
    contractorEmail?: string;
    contractorId?: string;
    isContractor?: boolean;
    vendorCompany?: string;
    title?: string;
    teams?: string[];
    name?: string;
  }): Promise<User> {
    const data = await fetchWithAuth(`/api/org/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.member;
  },

  async updateMemberRole(userId: string, role: UserRole): Promise<User> {
    const data = await fetchWithAuth(`/api/org/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    return data.member;
  },

  async removeOrgMember(userId: string): Promise<boolean> {
    await fetchWithAuth(`/api/org/members/${userId}`, {
      method: 'DELETE',
    });
    return true;
  },

  async getOrgTeams(): Promise<Team[]> {
    const data = await fetchWithAuth('/api/org/teams');
    return data.teams;
  },

  async createOrgTeam(payload: {
    name: string;
    description?: string;
    leadUserId?: string;
    memberUserIds?: string[];
  }): Promise<Team> {
    const data = await fetchWithAuth('/api/org/teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.team;
  },

  async updateOrgTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const data = await fetchWithAuth(`/api/org/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.team;
  },

  async deleteOrgTeam(teamId: string): Promise<boolean> {
    await fetchWithAuth(`/api/org/teams/${teamId}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Product Owner & Admin Operations
  async getAllUsersAcrossOrgs(): Promise<User[]> {
    const data = await fetchWithAuth('/api/admin/users');
    return data.users;
  },

  async assignProductAdmin(userId: string): Promise<{ user: User; message: string }> {
    return fetchWithAuth('/api/admin/assign-product-admin', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async revokeProductAdmin(userId: string): Promise<{ user: User; message: string }> {
    return fetchWithAuth('/api/admin/revoke-product-admin', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async getAllOrganizations(): Promise<(Organization & { memberCount: number; teamCount: number })[]> {
    const data = await fetchWithAuth('/api/admin/organizations');
    return data.organizations;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchWithAuth('/api/dashboard/stats');
  },

  // Services
  async getServices(): Promise<Service[]> {
    const data = await fetchWithAuth('/api/services');
    return data.services;
  },

  async getServiceById(id: string): Promise<Service> {
    const data = await fetchWithAuth(`/api/services/${id}`);
    return data.service;
  },

  async createService(
    service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Service> {
    const data = await fetchWithAuth('/api/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    return data.service;
  },

  async updateService(
    id: string,
    updates: Partial<Omit<Service, 'id' | 'createdAt'>>
  ): Promise<Service> {
    const data = await fetchWithAuth(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.service;
  },

  async deleteService(id: string): Promise<void> {
    await fetchWithAuth(`/api/services/${id}`, {
      method: 'DELETE',
    });
  },

  // Incidents
  async getIncidents(filters?: {
    severity?: Severity;
    status?: IncidentStatus;
    serviceId?: string;
    search?: string;
  }): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.serviceId) params.append('serviceId', filters.serviceId);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await fetchWithAuth(`/api/incidents${query}`);
    return data.incidents;
  },

  async getIncidentById(id: string): Promise<Incident> {
    const data = await fetchWithAuth(`/api/incidents/${id}`);
    return data.incident;
  },

  async getIncident(id: string): Promise<{ incident: Incident; evidence: Evidence[]; timeline: TimelineEvent[] }> {
    const [incident, evidence, timeline] = await Promise.all([
      this.getIncidentById(id),
      this.getEvidenceForIncident(id).catch(() => []),
      this.getTimelineForIncident(id).catch(() => []),
    ]);
    return { incident, evidence, timeline };
  },

  async createIncident(
    incident: Partial<Incident> & { title: string; severity: Severity; serviceId: string; description: string }
  ): Promise<Incident> {
    const data = await fetchWithAuth('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    });
    return data.incident;
  },

  async updateIncident(
    id: string,
    updates: Partial<Incident> & { changeNote?: string },
    changeNote?: string
  ): Promise<Incident> {
    const note = changeNote || updates.changeNote;
    const data = await fetchWithAuth(`/api/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, changeNote: note }),
    });
    return data.incident;
  },

  async deleteIncident(id: string): Promise<void> {
    await fetchWithAuth(`/api/incidents/${id}`, {
      method: 'DELETE',
    });
  },

  // Evidence
  async getEvidenceForIncident(incidentId: string): Promise<Evidence[]> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/evidence`);
    return data.evidence;
  },

  async addEvidence(
    incidentId: string,
    evidence: {
      type: Evidence['type'];
      title: string;
      source: string;
      content: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Evidence> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(evidence),
    });
    return data.evidence;
  },

  async deleteEvidence(incidentIdOrEvidenceId: string, maybeEvidenceId?: string): Promise<void> {
    if (maybeEvidenceId) {
      await fetchWithAuth(`/api/incidents/${incidentIdOrEvidenceId}/evidence/${maybeEvidenceId}`, {
        method: 'DELETE',
      });
    } else {
      await fetchWithAuth(`/api/evidence/${incidentIdOrEvidenceId}`, {
        method: 'DELETE',
      });
    }
  },

  // Timeline
  async getTimelineForIncident(incidentId: string): Promise<TimelineEvent[]> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/timeline`);
    return data.timeline;
  },

  async getTimeline(incidentId: string): Promise<TimelineEvent[]> {
    return this.getTimelineForIncident(incidentId);
  },

  async addTimelineEvent(
    incidentId: string,
    event: {
      eventType: TimelineEvent['eventType'];
      title: string;
      description: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<TimelineEvent> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return data.event;
  },

  // Reset demo
  async resetDemoData(): Promise<void> {
    await fetchWithAuth('/api/reset-demo', {
      method: 'POST',
    });
  },

  // AI Investigation
  async getInvestigation(incidentId: string): Promise<Investigation> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/investigation`);
    return data.investigation;
  },

  async startInvestigation(incidentId: string): Promise<Investigation> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/investigation/start`, {
      method: 'POST',
    });
    return data.investigation;
  },

  async updateHypothesisStatus(
    incidentId: string,
    hypothesisId: string,
    status: HypothesisStatus,
    notes?: { statement?: string; reason?: string }
  ): Promise<{ hypothesis: Hypothesis; incident: Incident; investigation: Investigation }> {
    return fetchWithAuth(`/api/incidents/${incidentId}/hypotheses/${hypothesisId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, ...notes }),
    });
  },

  async sendInvestigationChatMessage(
    incidentId: string,
    message: string
  ): Promise<{ reply: string; groundedEvidence: string[]; investigation: Investigation }> {
    return fetchWithAuth(`/api/incidents/${incidentId}/investigation/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};
