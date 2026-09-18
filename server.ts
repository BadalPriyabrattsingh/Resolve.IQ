import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { ROLE_PERMISSIONS, User } from './src/types.ts';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple authentication resolution middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const userId = (req.headers['x-user-id'] as string) || '';
    const users = db.getUsers();
    let user = users.find((u) => u.id === userId);
    if (!user) {
      // Default to Sarah Chen (Incident Commander)
      user = users.find((u) => u.role === 'INCIDENT_MANAGER') || users[0];
    }
    req.currentUser = user;
    next();
  });

  // ================= API ROUTES =================

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: 'ResolveIQ' });
  });

  // 2. Auth endpoints
  app.get('/api/auth/users', (req: Request, res: Response) => {
    res.json({ users: db.getUsers() });
  });

  app.get('/api/auth/current', (req: Request, res: Response) => {
    const user = req.currentUser!;
    res.json({
      user,
      permissions: ROLE_PERMISSIONS[user.role],
    });
  });

  // 3. Dashboard Stats
  app.get('/api/dashboard/stats', (req: Request, res: Response) => {
    try {
      const stats = db.getDashboardStats();
      res.json(stats);
    } catch (err) {
      console.error('Failed to get dashboard stats:', err);
      res.status(500).json({ error: 'Failed to calculate dashboard telemetry' });
    }
  });

  // 4. Services
  app.get('/api/services', (req: Request, res: Response) => {
    res.json({ services: db.getServices() });
  });

  app.get('/api/services/:id', (req: Request, res: Response) => {
    const service = db.getServiceById(req.params.id);
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
      });
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
      const service = db.updateService(req.params.id, req.body);
      res.json({ service });
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/services/:id', (req: Request, res: Response) => {
    const user = req.currentUser!;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only ADMINs can delete services' });
    }

    const success = db.deleteService(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ success: true });
  });

  // 5. Incidents
  app.get('/api/incidents', (req: Request, res: Response) => {
    const { severity, status, serviceId, search } = req.query;
    const incidents = db.getIncidents({
      severity: severity as any,
      status: status as any,
      serviceId: serviceId as string,
      search: search as string,
    });
    res.json({ incidents });
  });

  app.get('/api/incidents/:id', (req: Request, res: Response) => {
    const incident = db.getIncidentById(req.params.id);
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

  app.patch('/api/incidents/:id', (req: Request, res: Response) => {
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
  });

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

  // 8. Demo reset
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
