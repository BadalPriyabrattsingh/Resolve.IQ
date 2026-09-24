import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { IncidentsListView } from './components/IncidentsListView';
import { IncidentDetailView } from './components/IncidentDetailView';
import { ServicesView } from './components/ServicesView';
import { GlobalTimelineView } from './components/GlobalTimelineView';
import { RbacMatrixView } from './components/RbacMatrixView';
import { CreateIncidentModal } from './components/CreateIncidentModal';
import { AddEvidenceModal } from './components/AddEvidenceModal';
import { AddServiceModal } from './components/AddServiceModal';
import { LoginGateway } from './components/LoginGateway';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { OrgManagementModal } from './components/OrgManagementModal';
import { ProductAdminModal } from './components/ProductAdminModal';
import { api, setCurrentUser } from './api';
import { User, Incident, Service, DashboardStats, Organization, RolePermissions } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidentTab, setIncidentTab] = useState<'investigation' | 'actions' | 'timeline' | 'evidence'>('investigation');
  const [showTutorial, setShowTutorial] = useState(false);

  // Authentication & Organization State
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);

  // Core Data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [addEvidenceIncidentId, setAddEvidenceIncidentId] = useState<string | null>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isProductAdminModalOpen, setIsProductAdminModalOpen] = useState(false);

  // Load user session & telemetry data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      // First verify session
      const me = await api.getMe();
      if (!me || !me.user) {
        setCurrentUserState(null);
        setOrganization(null);
        setPermissions(null);
        setIsLoading(false);
        return;
      }

      setCurrentUserState(me.user);
      setOrganization(me.organization);
      setPermissions(me.permissions);

      // Next load core operational telemetry
      const [users, dashStats, incs, srvs] = await Promise.all([
        api.getUsers().catch(() => [me.user]),
        api.getDashboardStats().catch(() => null),
        api.getIncidents().catch(() => []),
        api.getServices().catch(() => []),
      ]);

      setAllUsers(users);
      setStats(dashStats);
      setIncidents(incs);
      setServices(srvs);
    } catch {
      // User is not authenticated
      setCurrentUserState(null);
      setOrganization(null);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic polling for stats & incidents when logged in (every 10s)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const [dashStats, incs, srvs] = await Promise.all([
          api.getDashboardStats(),
          api.getIncidents(),
          api.getServices(),
        ]);
        setStats(dashStats);
        setIncidents(incs);
        setServices(srvs);
      } catch {
        // quiet background poll error handling
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle successful login or registration from LoginGateway
  const handleAuthSuccess = (data: {
    token: string;
    user: User;
    organization: Organization;
    permissions: RolePermissions;
  }) => {
    setCurrentUserState(data.user);
    setOrganization(data.organization);
    setPermissions(data.permissions);
    loadInitialData();
  };

  // Sign out cleanly
  const handleLogout = async () => {
    await api.logout();
    setCurrentUserState(null);
    setOrganization(null);
    setPermissions(null);
    setIncidents([]);
    setServices([]);
    setStats(null);
    setSelectedIncidentId(null);
  };

  // Switch persona handler for testing RBAC within registered users
  const handleSwitchUser = async (userId: string) => {
    setCurrentUser(userId);
    try {
      const auth = await api.getCurrentUser();
      setCurrentUserState(auth.user);
      await loadInitialData();
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // Reset demo
  const handleResetDemo = async () => {
    await api.resetDemoData();
    await loadInitialData();
    setSelectedIncidentId(null);
    setCurrentTab('dashboard');
  };

  // Select incident to view in detail
  const handleSelectIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
  };

  // Quick select service filter
  const handleSelectService = () => {
    setCurrentTab('services');
    setSelectedIncidentId(null);
  };

  const handleSelectServiceIncidents = () => {
    setCurrentTab('incidents');
    setSelectedIncidentId(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && currentTab !== 'incidents' && !selectedIncidentId) {
      setCurrentTab('incidents');
    }
  };

  // Initial loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-sm text-slate-800 dark:text-slate-200 font-medium flex items-center">
          <span>RESOLVE</span>
          <span className="text-teal-600 dark:text-teal-400 ml-0.5 font-bold">IQ</span>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
          Authenticating telemetry environment...
        </div>
      </div>
    );
  }

  // If user is not logged in, show real Login & Registration Gateway
  if (!currentUser) {
    return (
      <LoginGateway
        onAuthSuccess={handleAuthSuccess}
        onWakeServers={loadInitialData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans flex flex-col antialiased selection:bg-teal-500/15 selection:text-teal-700 dark:selection:text-teal-300 transition-colors">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        organization={organization}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onOpenDeclareIncident={() => setIsDeclareOpen(true)}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        onSelectIncidentById={(id) => setSelectedIncidentId(id)}
        onOpenTutorial={() => setShowTutorial(true)}
        onOpenOrgModal={() => setIsOrgModalOpen(true)}
        onOpenProductAdminModal={() => setIsProductAdminModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Container with Sidebar */}
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setSelectedIncidentId(null);
          }}
          stats={stats}
          onOpenTutorial={() => setShowTutorial(true)}
        />

        {/* Center Workspace */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {selectedIncidentId ? (
            /* Detailed 3-column incident workspace */
            <IncidentDetailView
              incidentId={selectedIncidentId}
              currentUser={currentUser}
              allUsers={allUsers}
              services={services}
              onBack={() => setSelectedIncidentId(null)}
              onSelectService={handleSelectService}
              onOpenAddEvidence={(incId) => setAddEvidenceIncidentId(incId)}
              onIncidentUpdated={loadInitialData}
              initialTab={incidentTab}
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardView
              stats={stats}
              incidents={incidents}
              services={services}
              onSelectIncident={handleSelectIncident}
              onOpenDeclareIncident={() => setIsDeclareOpen(true)}
              onSelectService={handleSelectService}
              onOpenTutorial={() => setShowTutorial(true)}
            />
          ) : currentTab === 'incidents' ? (
            <IncidentsListView
              incidents={incidents}
              services={services}
              currentUser={currentUser}
              onSelectIncident={handleSelectIncident}
              onOpenDeclareIncident={() => setIsDeclareOpen(true)}
            />
          ) : currentTab === 'services' ? (
            <ServicesView
              services={services}
              incidents={incidents}
              currentUser={currentUser}
              onOpenAddService={() => setIsAddServiceOpen(true)}
              onSelectServiceIncidents={handleSelectServiceIncidents}
              onRefresh={loadInitialData}
            />
          ) : currentTab === 'timeline' ? (
            <GlobalTimelineView
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
            />
          ) : currentTab === 'roles' ? (
            <RbacMatrixView
              currentUser={currentUser}
              allUsers={allUsers}
              onSwitchUser={handleSwitchUser}
            />
          ) : null}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Declare Incident Modal */}
      <CreateIncidentModal
        isOpen={isDeclareOpen}
        onClose={() => setIsDeclareOpen(false)}
        services={services}
        allUsers={allUsers}
        onIncidentCreated={(newId) => {
          loadInitialData();
          setSelectedIncidentId(newId);
        }}
      />

      {/* 2. Add Evidence Modal */}
      {addEvidenceIncidentId && (
        <AddEvidenceModal
          isOpen={!!addEvidenceIncidentId}
          incidentId={addEvidenceIncidentId}
          onClose={() => setAddEvidenceIncidentId(null)}
          onEvidenceAdded={loadInitialData}
        />
      )}

      {/* 3. Add Service Modal */}
      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onServiceCreated={loadInitialData}
      />

      {/* 4. Organization & Team Management Modal */}
      <OrgManagementModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        currentUser={currentUser}
        onRefreshData={loadInitialData}
      />

      {/* 5. Product Admin Console Modal */}
      <ProductAdminModal
        isOpen={isProductAdminModalOpen}
        onClose={() => setIsProductAdminModalOpen(false)}
        currentUser={currentUser}
        onRefreshData={loadInitialData}
      />

      {/* 6. Interactive Guided Tour Modal */}
      <InteractiveTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setSelectedIncidentId(null);
        }}
        onOpenDeclareIncident={() => {
          setShowTutorial(false);
          setIsDeclareOpen(true);
        }}
        onOpenDemoIncident={(tab = 'investigation') => {
          const primaryInc = incidents[0];
          if (primaryInc) {
            setIncidentTab(tab);
            setSelectedIncidentId(primaryInc.id);
          } else {
            setCurrentTab('incidents');
          }
        }}
        onSwitchUser={handleSwitchUser}
      />
    </div>
  );
}

export default App;
