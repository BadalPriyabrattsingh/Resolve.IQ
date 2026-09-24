import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { ROLE_PERMISSIONS, User, HypothesisStatus, Organization, Team, UserRole } from './src/types.ts';
import { runInvestigationAnalysis, answerInvestigationQuery } from './server/aiInvestigation.ts';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      currentOrg?: Organization;
      authToken?: string;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Real authentication resolution middleware via Bearer token or x-auth-token
  app.use((req: Request, res: Response, next: NextFunction) => {
    let token = '';
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = (req.headers['x-auth-token'] as string).trim();
    }

    if (token) {
      const sessionData = db.getUserBySession(token);
      if (sessionData) {
        req.currentUser = sessionData.user;
        req.currentOrg = sessionData.organization;
        req.authToken = token;
      }
    } else {
      // Fallback lookup by x-user-id if explicitly provided
      const userId = (req.headers['x-user-id'] as string) || '';
      if (userId) {
        const user = db.getUserById(userId);
        if (user) {
          req.currentUser = user;
          const org = db.getOrganizationById(user.orgId);
          if (org) req.currentOrg = org;
        }
      }
    }

    next();
  });

  // Guard middleware for protected endpoints
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    next();
  };

  // ================= API ROUTES =================

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: 'ResolveIQ' });
  });

  // 2. Setup status (checks if database has any registered users)
  app.get('/api/auth/setup-status', (req: Request, res: Response) => {
    res.json({
      hasUsers: db.hasUsers(),
      userCount: db.getUsers().length,
    });
  });

  // 3. User Registration (first user of any org is Org Admin; first user of entire platform is Product Owner)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, organizationName, title } = req.body;
    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({
        error: 'Please fill in all required fields (Name, Email, Password, and Organization Name).',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
      const result = db.registerUser({
        name,
        email,
        password,
        organizationName,
        title,
      });

      res.status(201).json({
        token: result.token,
        user: result.user,
        organization: result.organization,
        permissions: ROLE_PERMISSIONS[result.user.role],
      });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // 4. User Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const result = db.loginUser({ email, password });
      res.json({
        token: result.token,
        user: result.user,
        organization: result.organization,
        permissions: ROLE_PERMISSIONS[result.user.role],
      });
    } catch (err) {
      res.status(401).json({ error: (err as Error).message });
    }
  });

  // 5. User Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    if (req.authToken) {
      db.logoutUser(req.authToken);
    }
    res.json({ message: 'Signed out successfully' });
  });

  // 6. Get Current User / Session Check
  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const sessionData = req.authToken ? db.getUserBySession(req.authToken) : null;
    const user = sessionData?.user || req.currentUser!;
    const org = sessionData?.organization || req.currentOrg || db.getOrganizationById(user.orgId);
    res.json({
      user,
      organization: org,
      availableOrganizations: sessionData?.availableOrganizations || (org ? [org] : []),
      permissions: ROLE_PERMISSIONS[user.role],
    });
  });

  app.post('/api/auth/switch-org', requireAuth, (req: Request, res: Response) => {
    const { orgId } = req.body;
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });
    try {
      const sessionData = db.switchUserOrganization(req.authToken!, orgId);
      res.json({
        user: sessionData.user,
        organization: sessionData.organization,
        availableOrganizations: sessionData.availableOrganizations,
        permissions: ROLE_PERMISSIONS[sessionData.user.role],
      });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get('/api/auth/current', (req: Request, res: Response) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = req.currentUser;
    res.json({
      user,
      permissions: ROLE_PERMISSIONS[user.role],
    });
  });

  app.get('/api/auth/users', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    // In JIRA, user roster is scoped to the tenant organization (including synced contractors)
    const members = db.getOrganizationMembers(user.orgId);
    res.json({ users: members });
  });

  // 7. Organization & Team Management Routes
  app.get('/api/org/info', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const org = db.getOrganizationById(user.orgId) || req.currentOrg;
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json({ organization: org });
  });

  app.get('/api/org/members', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const members = db.getOrganizationMembers(user.orgId);
    res.json({ members });
  });

  // Contractor Mapping & Outsourcing Sync Routes
  app.get('/api/org/contractors', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const contractors = db.getContractorMappings(user.orgId);
    res.json({ contractors });
  });

  app.get('/api/org/contractors/lookup', requireAuth, (req: Request, res: Response) => {
    const email = (req.query.email as string) || '';
    if (!email) return res.status(400).json({ error: 'Email query parameter required' });
    const result = db.lookupContractorByActualEmail(email);
    res.json(result);
  });

  app.post('/api/org/contractors', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageMembers && !user.isProductOwner) {
      return res.status(403).json({ error: 'Only Organization Admins can map outsourced contractors' });
    }
    const { actualEmail, contractorEmail, contractorId, vendorCompany, contractorName, role, title, teams, temporaryPassword } = req.body;
    if (!actualEmail || !contractorEmail || !contractorId || !vendorCompany) {
      return res.status(400).json({
        error: 'Please provide Actual Mail ID, Client Contractor Mail, Contractor Badge ID, and Vendor Company',
      });
    }
    try {
      const mapping = db.syncContractorMapping(user.orgId, {
        actualEmail,
        contractorEmail,
        contractorId,
        vendorCompany,
        contractorName,
        role: role as UserRole,
        title,
        teams,
        temporaryPassword,
      });
      res.status(201).json({ contractor: mapping, message: `Contractor ${actualEmail} synced with ${contractorEmail}` });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/org/contractors/:id/resync', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageMembers && !user.isProductOwner) {
      return res.status(403).json({ error: 'Only Organization Admins can resync contractors' });
    }
    try {
      const updated = db.resyncContractor(user.orgId, req.params.id);
      res.json({ contractor: updated, message: 'Contractor identity synchronized with primary directory' });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/org/contractors/:id', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageMembers && !user.isProductOwner) {
      return res.status(403).json({ error: 'Only Organization Admins can unlink contractors' });
    }
    try {
      db.deleteContractorMapping(user.orgId, req.params.id);
      res.json({ message: 'Contractor mapping unlinked successfully' });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/org/members', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageMembers) {
      return res.status(403).json({ error: 'Only Organization Admins or Product Owners can add members' });
    }
    const { name, email, contractorEmail, contractorId, isContractor, vendorCompany, password, role, title, teams } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing name, email, password, or role' });
    }
    try {
      const newMember = db.addOrganizationMember(user.orgId, {
        name,
        email,
        contractorEmail,
        contractorId,
        isContractor,
        vendorCompany,
        password,
        role: role as UserRole,
        title,
        teams,
      });
      res.status(201).json({ member: newMember });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.put('/api/org/members/:id', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageMembers) {
      return res.status(403).json({ error: 'Only Organization Admins can manage members' });
    }
    try {
      const updated = db.updateMember(user.orgId, req.params.id, req.body);
      res.json({ member: updated });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.put('/api/org/members/:id/role', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageMembers) {
      return res.status(403).json({ error: 'Only Organization Admins can manage roles' });
    }
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });
    try {
      const updated = db.updateMemberRole(user.orgId, req.params.id, role as UserRole);
      res.json({ member: updated });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/org/members/:id', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageMembers) {
      return res.status(403).json({ error: 'Only Organization Admins can remove members' });
    }
    try {
      db.removeMember(user.orgId, req.params.id, user.id);
      res.json({ message: 'Member removed successfully' });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get('/api/org/teams', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const teams = db.getOrganizationTeams(user.orgId);
    res.json({ teams });
  });

  app.post('/api/org/teams', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageTeams) {
      return res.status(403).json({ error: 'Only Organization Admins can create teams' });
    }
    const { name, description, leadUserId, memberUserIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name is required' });
    try {
      const team = db.createTeam(user.orgId, { name, description, leadUserId, memberUserIds });
      res.status(201).json({ team });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.put('/api/org/teams/:id', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageTeams) {
      return res.status(403).json({ error: 'Only Organization Admins can edit teams' });
    }
    try {
      const team = db.updateTeam(user.orgId, req.params.id, req.body);
      res.json({ team });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/org/teams/:id', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageTeams) {
      return res.status(403).json({ error: 'Only Organization Admins can delete teams' });
    }
    try {
      db.deleteTeam(user.orgId, req.params.id);
      res.json({ message: 'Team deleted successfully' });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // 8. Product Administration Routes (Product Owner & Product Admins)
  app.get('/api/admin/users', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    if (!user.isProductOwner && !user.isProductAdmin && user.role !== 'PRODUCT_OWNER' && user.role !== 'PRODUCT_ADMIN') {
      return res.status(403).json({ error: 'Access restricted to Product Owner and Product Admins' });
    }
    const users = db.getAllUsersAcrossOrgs();
    res.json({ users });
  });

  app.post('/api/admin/assign-product-admin', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    if (!user.isProductOwner && user.role !== 'PRODUCT_OWNER') {
      return res.status(403).json({ error: 'Only the Product Owner can assign Product Admins' });
    }
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    try {
      const updated = db.assignProductAdmin(userId);
      res.json({ user: updated, message: `${updated.name} has been appointed as Product Admin.` });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/admin/revoke-product-admin', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    if (!user.isProductOwner && user.role !== 'PRODUCT_OWNER') {
      return res.status(403).json({ error: 'Only the Product Owner can revoke Product Admin permissions' });
    }
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    try {
      const updated = db.revokeProductAdmin(userId);
      res.json({ user: updated, message: `Product Admin privileges revoked for ${updated.name}.` });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get('/api/admin/organizations', requireAuth, (req: Request, res: Response) => {
    const user = req.currentUser!;
    if (!user.isProductOwner && !user.isProductAdmin && user.role !== 'PRODUCT_OWNER' && user.role !== 'PRODUCT_ADMIN') {
      return res.status(403).json({ error: 'Access restricted to Product Owner and Product Admins' });
    }
    const organizations = db.getAllOrganizations();
    res.json({ organizations });
  });

  // 3. Dashboard Stats
  app.get('/api/dashboard/stats', (req: Request, res: Response) => {
    try {
      const stats = db.getDashboardStats(req.currentUser?.orgId);
      res.json(stats);
    } catch (err) {
      console.error('Failed to get dashboard stats:', err);
      res.status(500).json({ error: 'Failed to calculate dashboard telemetry' });
    }
  });

  // 4. Services
  app.get('/api/services', (req: Request, res: Response) => {
    res.json({ services: db.getServices(req.currentUser?.orgId) });
  });

  app.get('/api/services/:id', (req: Request, res: Response) => {
    const service = db.getServiceById(req.params.id, req.currentUser?.orgId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ service });
  });

  app.post('/api/services', (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageServices) {
      return res.status(403).json({ error: `User with role ${user.role} is not permitted to create services` });
    }

    const { name, description, owningTeam, environment, criticality, repositoryUrl, healthStatus } = req.body;
    if (!name || !description || !owningTeam || !criticality) {
      return res.status(400).json({ error: 'Missing required service fields: name, description, owningTeam, criticality' });
    }

    try {
      const service = db.createService({
        name,
        description,
        owningTeam,
        environment: environment || 'Production',
        criticality,
        repositoryUrl: repositoryUrl || '',
        healthStatus: healthStatus || 'HEALTHY',
      }, user);
      res.status(201).json({ service });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.put('/api/services/:id', (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageServices) {
      return res.status(403).json({ error: `User with role ${user.role} is not permitted to update services` });
    }

    try {
      const service = db.updateService(req.params.id, req.body, user.orgId);
      res.json({ service });
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/services/:id', (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageServices) {
      return res.status(403).json({ error: 'You do not have permission to delete services' });
    }

    const success = db.deleteService(req.params.id, user.orgId);
    if (!success) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ success: true });
  });

  // 5. Incidents
  app.get('/api/incidents', (req: Request, res: Response) => {
    const { severity, status, serviceId, search } = req.query;
    const incidents = db.getIncidents(req.currentUser?.orgId, {
      severity: severity as any,
      status: status as any,
      serviceId: serviceId as string,
      search: search as string,
    });
    res.json({ incidents });
  });

  app.get('/api/incidents/:id', (req: Request, res: Response) => {
    const incident = db.getIncidentById(req.params.id, req.currentUser?.orgId) || db.getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: `Incident ${req.params.id} not found` });
    }
    const evidence = db.getEvidenceForIncident(incident.id);
    const timeline = db.getTimelineForIncident(incident.id);
    res.json({ incident, evidence, timeline });
  });

  app.post('/api/incidents', (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canCreateIncident) {
      return res.status(403).json({ error: `User with role ${user.role} is not authorized to create incidents` });
    }

    const { title, description, severity, serviceId, environment, customerImpact, impactSummary, assignedEngineer, incidentManager } = req.body;
    if (!title || !description || !severity || !serviceId) {
      return res.status(400).json({ error: 'Missing required incident fields: title, description, severity, serviceId' });
    }

    try {
      const incident = db.createIncident(
        {
          title,
          description,
          severity,
          serviceId,
          environment: environment || 'Production',
          customerImpact: Boolean(customerImpact),
          impactSummary: impactSummary || '',
          assignedEngineer,
          incidentManager,
        },
        user
      );
      res.status(201).json({ incident });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  const handleUpdateIncident = (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    const { status, severity, assignedEngineer, incidentManager, customerImpact, impactSummary, description, changeNote } = req.body;

    // Authorization checks
    if (status && !perms.canChangeStatus) {
      return res.status(403).json({ error: `Role ${user.role} cannot transition incident status` });
    }
    if (severity && !perms.canChangeSeverity) {
      return res.status(403).json({ error: `Role ${user.role} cannot modify incident severity. Requires INCIDENT_MANAGER or ADMIN.` });
    }
    if ((assignedEngineer || incidentManager) && !perms.canAssignEngineer) {
      return res.status(403).json({ error: `Role ${user.role} cannot reassign incident personnel` });
    }

    try {
      const updated = db.updateIncident(
        req.params.id,
        {
          ...(status && { status }),
          ...(severity && { severity }),
          ...(assignedEngineer !== undefined && { assignedEngineer }),
          ...(incidentManager !== undefined && { incidentManager }),
          ...(customerImpact !== undefined && { customerImpact: Boolean(customerImpact) }),
          ...(impactSummary !== undefined && { impactSummary }),
          ...(description !== undefined && { description }),
        },
        user,
        changeNote
      );
      res.json({ incident: updated });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  app.patch('/api/incidents/:id', handleUpdateIncident);
  app.put('/api/incidents/:id', handleUpdateIncident);

  app.delete('/api/incidents/:id', (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canDeleteIncident) {
      return res.status(403).json({ error: 'Only ADMINs can delete incident records' });
    }

    const success = db.deleteIncident(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ success: true });
  });

  // 6. Evidence
  app.get('/api/incidents/:id/evidence', (req: Request, res: Response) => {
    const evidence = db.getEvidenceForIncident(req.params.id);
    res.json({ evidence });
  });

  app.post('/api/incidents/:id/evidence', (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    const { type, title, source, content } = req.body;

    if (type === 'COMMENT') {
      if (!perms.canAddComment) {
        return res.status(403).json({ error: `Role ${user.role} cannot add comments` });
      }
    } else {
      if (!perms.canAddEvidence) {
        return res.status(403).json({ error: `Role ${user.role} cannot attach evidence` });
      }
    }

    if (!type || !title || !content) {
      return res.status(400).json({ error: 'Missing required evidence fields: type, title, content' });
    }

    try {
      const item = db.addEvidence(
        {
          incidentId: req.params.id,
          type,
          title,
          source: source || `${user.name} (${user.role})`,
          content,
        },
        user
      );
      res.status(201).json({ evidence: item });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/evidence/:id', (req: Request, res: Response) => {
    const user = req.currentUser!;
    if (user.role === 'VIEWER') {
      return res.status(403).json({ error: 'Viewers cannot delete evidence' });
    }
    const success = db.deleteEvidence(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Evidence record not found' });
    }
    res.json({ success: true });
  });

  // 7. Timeline
  app.get('/api/incidents/:id/timeline', (req: Request, res: Response) => {
    const timeline = db.getTimelineForIncident(req.params.id);
    res.json({ timeline });
  });

  app.post('/api/incidents/:id/timeline', (req: Request, res: Response) => {
    const user = req.currentUser!;
    if (user.role === 'VIEWER') {
      return res.status(403).json({ error: 'Viewers cannot create timeline events directly' });
    }
    const { eventType, title, description, metadata } = req.body;
    if (!eventType || !title || !description) {
      return res.status(400).json({ error: 'Missing timeline fields: eventType, title, description' });
    }

    const event = db.addTimelineEvent({
      incidentId: req.params.id,
      eventType,
      title,
      description,
      actorName: user.name,
      actorRole: user.role,
      metadata,
    });
    res.status(201).json({ event });
  });

  // 8. AI Investigation Endpoints
  app.get('/api/incidents/:id/investigation', (req: Request, res: Response) => {
    const incidentId = req.params.id;
    const incident = db.getIncidentById(incidentId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    let investigation = db.getInvestigation(incidentId);
    if (!investigation) {
      // Lazy generate initial deterministic investigation for incident
      const evidence = db.getEvidenceForIncident(incidentId);
      const timeline = db.getTimelineForIncident(incidentId);
      const initial = runInvestigationAnalysis(incident, evidence, timeline);
      // in case async, wait or fallback
      investigation = db.getInvestigation(incidentId);
    }
    res.json({ investigation });
  });

  app.post('/api/incidents/:id/investigation/start', async (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canManageInvestigation) {
      return res.status(403).json({ error: `User with role ${user.role} is not permitted to trigger investigations` });
    }

    const incidentId = req.params.id;
    const incident = db.getIncidentById(incidentId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const evidence = db.getEvidenceForIncident(incidentId);
    const timeline = db.getTimelineForIncident(incidentId);

    try {
      const investigation = await runInvestigationAnalysis(incident, evidence, timeline);
      db.saveInvestigation(investigation);

      db.addTimelineEvent({
        incidentId,
        eventType: 'INVESTIGATION',
        title: 'AI Investigation Executed',
        description: `Triggered by ${user.name} (${user.role}). Analyzed ${evidence.length} evidence records and generated ${investigation.hypotheses.length} hypotheses.`,
        actorName: user.name,
        actorRole: user.role,
        metadata: {
          hypothesisCount: investigation.hypotheses.length,
          evidenceCount: evidence.length,
        },
      });

      res.json({ investigation });
    } catch (err) {
      console.error('Failed to run investigation analysis:', err);
      res.status(500).json({ error: 'Failed to process AI investigation' });
    }
  });

  const handleHypothesisStatusUpdate = (req: Request, res: Response) => {
    const user = req.currentUser!;
    const perms = ROLE_PERMISSIONS[user.role];
    const { status, statement, reason } = req.body as {
      status: HypothesisStatus;
      statement?: string;
      reason?: string;
    };

    if (status === 'CONFIRMED' || status === 'REJECTED') {
      if (!perms.canConfirmHypothesis) {
        return res
          .status(403)
          .json({ error: `Role ${user.role} cannot confirm or reject root cause hypotheses. Only Engineers or Incident Managers can verify.` });
      }
    } else {
      if (!perms.canManageInvestigation) {
        return res.status(403).json({ error: `Role ${user.role} cannot update hypothesis status.` });
      }
    }

    if (!['PROPOSED', 'UNDER_REVIEW', 'CONFIRMED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid hypothesis status' });
    }

    try {
      const result = db.updateHypothesisStatus(req.params.id, req.params.hypothesisId, status, user, {
        statement,
        reason,
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  app.post('/api/incidents/:id/hypotheses/:hypothesisId/status', handleHypothesisStatusUpdate);
  app.patch('/api/incidents/:id/hypotheses/:hypothesisId/status', handleHypothesisStatusUpdate);
  app.post('/api/incidents/:id/investigation/hypotheses/:hypothesisId/status', handleHypothesisStatusUpdate);
  app.patch('/api/incidents/:id/investigation/hypotheses/:hypothesisId/status', handleHypothesisStatusUpdate);

  app.post('/api/incidents/:id/investigation/chat', async (req: Request, res: Response) => {
    const user = req.currentUser!;
    const incidentId = req.params.id;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const incident = db.getIncidentById(incidentId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    let investigation = db.getInvestigation(incidentId);
    if (!investigation) {
      const evidence = db.getEvidenceForIncident(incidentId);
      const timeline = db.getTimelineForIncident(incidentId);
      investigation = await runInvestigationAnalysis(incident, evidence, timeline);
      db.saveInvestigation(investigation);
    }

    const evidenceList = db.getEvidenceForIncident(incidentId);

    try {
      // Record user query
      db.addInvestigationChatMessage(incidentId, {
        role: 'user',
        content: message.trim(),
      });

      // Get AI answer strictly grounded in incident evidence
      const { answer, groundedEvidence } = await answerInvestigationQuery(
        incident,
        investigation,
        evidenceList,
        message.trim()
      );

      // Record assistant reply
      const updatedInv = db.addInvestigationChatMessage(incidentId, {
        role: 'assistant',
        content: answer,
        groundedEvidence,
      });

      res.json({
        reply: answer,
        groundedEvidence,
        investigation: updatedInv,
      });
    } catch (err) {
      console.error('Failed to answer investigation query:', err);
      res.status(500).json({ error: 'Failed to answer investigation query' });
    }
  });

  // 9. Demo reset
  app.post('/api/reset-demo', (req: Request, res: Response) => {
    db.resetDemoData();
    res.json({ message: 'Demo data reset successfully', stats: db.getDashboardStats() });
  });

  // ================= VITE MIDDLEWARE / STATIC =================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResolveIQ server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting ResolveIQ server:', err);
  process.exit(1);
});
