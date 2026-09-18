import {
  Incident,
  Service,
  Evidence,
  TimelineEvent,
  User,
  DashboardStats,
  Severity,
  IncidentStatus,
} from './types';

let currentUserId = 'usr-ic-1'; // Default to Sarah Chen (Incident Manager)

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

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': getCurrentUserId(),
    ...(options.headers || {}),
  };

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
  // Auth
  async getUsers(): Promise<User[]> {
    const data = await fetchWithAuth('/api/auth/users');
    return data.users;
  },

  async getCurrentUser(): Promise<{ user: User; permissions: any }> {
    return fetchWithAuth('/api/auth/current');
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

  async getService(id: string): Promise<Service> {
    const data = await fetchWithAuth(`/api/services/${id}`);
    return data.service;
  },

  async createService(serviceData: Partial<Service>): Promise<Service> {
    const data = await fetchWithAuth('/api/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    return data.service;
  },

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
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

  async getIncident(id: string): Promise<{ incident: Incident; evidence: Evidence[]; timeline: TimelineEvent[] }> {
    return fetchWithAuth(`/api/incidents/${id}`);
  },

  async createIncident(incidentData: {
    title: string;
    description: string;
    severity: Severity;
    serviceId: string;
    environment: 'Production' | 'Staging' | 'Canary';
    customerImpact: boolean;
    impactSummary: string;
    assignedEngineer?: string;
    incidentManager?: string;
  }): Promise<Incident> {
    const data = await fetchWithAuth('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
    return data.incident;
  },

  async updateIncident(
    id: string,
    updates: Partial<Incident> & { changeNote?: string }
  ): Promise<Incident> {
    const data = await fetchWithAuth(`/api/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.incident;
  },

  async deleteIncident(id: string): Promise<void> {
    await fetchWithAuth(`/api/incidents/${id}`, {
      method: 'DELETE',
    });
  },

  // Evidence
  async getEvidence(incidentId: string): Promise<Evidence[]> {
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
    }
  ): Promise<Evidence> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(evidence),
    });
    return data.evidence;
  },

  async deleteEvidence(evidenceId: string): Promise<void> {
    await fetchWithAuth(`/api/evidence/${evidenceId}`, {
      method: 'DELETE',
    });
  },

  // Timeline
  async getTimeline(incidentId: string): Promise<TimelineEvent[]> {
    const data = await fetchWithAuth(`/api/incidents/${incidentId}/timeline`);
    return data.timeline;
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
};
