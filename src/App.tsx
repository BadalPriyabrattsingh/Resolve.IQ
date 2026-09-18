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
import { api, setCurrentUser } from './api';
import { User, Incident, Service, DashboardStats } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Core Data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
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

  // Initial load
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [users, currentAuth, dashStats, incs, srvs] = await Promise.all([
        api.getUsers(),
        api.getCurrentUser(),
        api.getDashboardStats(),
        api.getIncidents(),
        api.getServices(),
      ]);

      setAllUsers(users);
      setCurrentUserState(currentAuth.user);
      setStats(dashStats);
      setIncidents(incs);
      setServices(srvs);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic polling for stats & incidents (every 10s)
  useEffect(() => {
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
      } catch (err) {
        // quiet background poll error handling
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Switch persona handler
  const handleSwitchUser = async (userId: string) => {
    setCurrentUser(userId);
    try {
      const auth = await api.getCurrentUser();
      setCurrentUserState(auth.user);
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
  const handleSelectService = (serviceId: string) => {
    setCurrentTab('services');
    setSelectedIncidentId(null);
  };

  const handleSelectServiceIncidents = (serviceId: string) => {
    setCurrentTab('incidents');
    setSelectedIncidentId(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && currentTab !== 'incidents' && !selectedIncidentId) {
      setCurrentTab('incidents');
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-mono text-sm text-slate-300 font-semibold">
          Resolve<span className="text-red-400">IQ</span> SRE Console
        </div>
        <div className="font-mono text-xs text-slate-500 mt-1">
          Connecting to incident database and telemetry feeds...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 font-sans flex flex-col antialiased selection:bg-red-500/30 selection:text-red-200">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onOpenDeclareIncident={() => setIsDeclareOpen(true)}
        onResetDemo={handleResetDemo}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        onSelectIncidentById={(id) => setSelectedIncidentId(id)}
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
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardView
              stats={stats}
              incidents={incidents}
              services={services}
              onSelectIncident={handleSelectIncident}
              onOpenDeclareIncident={() => setIsDeclareOpen(true)}
              onSelectService={handleSelectService}
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
    </div>
  );
}

export default App;
