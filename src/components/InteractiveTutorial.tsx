import React, { useEffect, useState } from 'react';
import {
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
  Activity,
  AlertTriangle,
  Brain,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Sliders,
  User as UserIcon,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';

export interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenDeclareIncident: () => void;
  onOpenDemoIncident?: (initialTab?: 'investigation' | 'actions' | 'timeline' | 'evidence') => void;
  onSwitchUser?: (userId: string) => void;
}

interface StepConfig {
  id: string;
  stepNumber: number;
  totalSteps: number;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  accentBadge: string;
  targetLocationName: string;
  proTip: string;
  primaryFeatures: { title: string; desc: string }[];
  actionTrigger: () => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenDeclareIncident,
  onOpenDemoIncident,
  onSwitchUser,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Steps definition where each step executes real navigation
  const steps: StepConfig[] = [
    {
      id: 'step-dashboard',
      stepNumber: 1,
      totalSteps: 6,
      category: 'Operations Overview',
      title: 'Real-Time Operations Dashboard',
      subtitle: 'Cluster health glass pane, live active incident counters, and MTTR telemetry.',
      description:
        'You are currently viewing the live Operations Dashboard. The top cards aggregate cluster availability, critical active SEV-1 incidents, degraded services, and mean time to resolution.',
      icon: Activity,
      accentBadge: 'Live Dashboard',
      targetLocationName: 'Overview Dashboard',
      proTip:
        'Notice the top-right persona menu: you can switch between Admin, Incident Commander, SRE Engineer, and Viewer at any time to experience live RBAC access control.',
      primaryFeatures: [
        {
          title: 'Live Outage Pulse',
          desc: 'SEV-1 active incident banner with pulsing indicator and immediate MTTR counter.',
        },
        {
          title: 'Microservice Health Rollup',
          desc: 'Immediate visibility into Tier-0 core systems, degraded dependencies, and error rates.',
        },
        {
          title: 'Quick Incident Navigation',
          desc: 'Clicking any incident row in the registry immediately opens its dedicated War Room.',
        },
      ],
      actionTrigger: () => {
        onNavigateTab('dashboard');
      },
    },
    {
      id: 'step-declare',
      stepNumber: 2,
      totalSteps: 6,
      category: 'Incident Creation',
      title: 'Incident Registry & Declaring Incidents',
      subtitle: 'Instant outage triage with automated ID sequence and notification triggers.',
      description:
        'We have navigated you to the Incident Directory. Click the orange "Declare Incident" button or use this step to simulate declaring a critical outage with auto-generated INC-2026 sequence IDs and severity ratings.',
      icon: AlertTriangle,
      accentBadge: 'Incident Directory',
      targetLocationName: 'Incident Registry',
      proTip:
        'You can filter by Severity (SEV-1 to SEV-4), Status (Active, Investigating, Mitigating, Resolved), or by impacted microservice.',
      primaryFeatures: [
        {
          title: 'Multi-Facet Search & Filter',
          desc: 'Search by ID, title, summary, or assigned engineer with instant filtering.',
        },
        {
          title: 'Declare Outage Workflow',
          desc: 'Sets severity, impact blast radius, customer visibility, and initial on-call assignment.',
        },
        {
          title: 'Lifecycle State Tracking',
          desc: 'Transitions through Detected → Triaged → Investigating → Mitigating → Resolved → Closed.',
        },
      ],
      actionTrigger: () => {
        onNavigateTab('incidents');
      },
    },
    {
      id: 'step-war-room',
      stepNumber: 3,
      totalSteps: 6,
      category: 'War Room Command',
      title: 'The Incident War Room (INC-2026-0842)',
      subtitle: 'The 3-panel command center where commanders and engineers investigate and mitigate outages.',
      description:
        'We have automatically opened incident INC-2026-0842 (Payment Gateway 500 Spike). Look at the top banner: you have SLA acknowledgement, severity escalation, engineer assignment, and real-time outage duration timer.',
      icon: Brain,
      accentBadge: 'War Room Workspace',
      targetLocationName: 'Incident Detail (INC-2026-0842)',
      proTip:
        'Use the "Assign Me" button or role selectors on the left column to take ownership of this incident in real time.',
      primaryFeatures: [
        {
          title: 'Real-Time Operational Controls',
          desc: 'Acknowledge SLA, step through incident states, or escalate severity instantly.',
        },
        {
          title: 'Evidence Locker Tab',
          desc: 'Attach telemetry logs, database stack traces, Prometheus snapshots, and comments.',
        },
        {
          title: 'Audit Trail',
          desc: 'Every change made in this war room is recorded with an immutable timestamp.',
        },
      ],
      actionTrigger: () => {
        if (onOpenDemoIncident) {
          onOpenDemoIncident('evidence');
        }
      },
    },
    {
      id: 'step-ai-investigation',
      stepNumber: 4,
      totalSteps: 6,
      category: 'AI Root-Cause Engine',
      title: 'Evidence-Grounded AI Copilot & Hypotheses',
      subtitle: 'Non-autonomous, human-in-the-loop AI that analyzes logs, traces, and metrics.',
      description:
        'We switched your workspace directly into the "AI Investigation" tab. Instead of hallucinating, ResolveIQ synthesizes the exact telemetry evidence attached to the incident, proposes causal hypotheses with confidence scores, and awaits human engineer verification.',
      icon: Sparkles,
      accentBadge: 'AI Investigation Tab',
      targetLocationName: 'AI Root-Cause Engine',
      proTip:
        'Safety Guardrail: AI proposes hypotheses and ranks them by confidence, but all root-cause conclusions require human SRE confirmation before closing.',
      primaryFeatures: [
        {
          title: 'Ranked Hypotheses with Confidence',
          desc: 'Correlates deployment milestones with database pool exhaustion and log error spikes.',
        },
        {
          title: 'Human Verification Loop',
          desc: 'Engineers confirm or reject root-cause findings with an audit statement.',
        },
        {
          title: 'Automated Mitigation Runbooks',
          desc: 'Interactive shell commands and rollback verification checklists ready to execute.',
        },
      ],
      actionTrigger: () => {
        if (onOpenDemoIncident) {
          onOpenDemoIncident('investigation');
        }
      },
    },
    {
      id: 'step-services',
      stepNumber: 5,
      totalSteps: 6,
      category: 'Infrastructure',
      title: 'Microservice Catalog & Dependency Topology',
      subtitle: 'Monitor service tier classifications, owning engineering squads, and health states.',
      description:
        'We navigated you to the Service Catalog. Here you see all 7 microservices registered in your cluster, their criticality tiers (TIER-0 to TIER-3), health states, repository links, and active outages.',
      icon: Layers,
      accentBadge: 'Service Catalog',
      targetLocationName: 'Service Topology',
      proTip:
        'Click the "Active Incidents" button on any service card to quickly filter the incident registry to outages impacting that specific microservice.',
      primaryFeatures: [
        {
          title: 'Tiered Criticality Management',
          desc: 'Categorize services from TIER-0 (core revenue checkout) down to TIER-3 (internal analytics).',
        },
        {
          title: 'Live Service Health Overrides',
          desc: 'Quickly toggle service state between Healthy, Degraded, Outage, or Maintenance.',
        },
        {
          title: 'Git Repository Integration',
          desc: 'Direct repository links to inspect code diffs and commit histories during triage.',
        },
      ],
      actionTrigger: () => {
        onNavigateTab('services');
      },
    },
    {
      id: 'step-rbac',
      stepNumber: 6,
      totalSteps: 6,
      category: 'Enterprise Governance',
      title: 'Role-Based Access Control (RBAC) System',
      subtitle: 'Strict enterprise personas and capabilities enforced across UI and API.',
      description:
        'We brought you to the RBAC Matrix. ResolveIQ provides 4 realistic personas: Admin (Marcus), Incident Manager (Sarah), SRE Engineer (David), and Read-Only Viewer (Elena). You can switch between them right on this screen.',
      icon: Shield,
      accentBadge: 'Access Control',
      targetLocationName: 'RBAC Matrix',
      proTip:
        'Click on "Elena Rostova (Viewer)" to see how mutation buttons like "Declare Incident" and status changes instantly disable with helpful permission tooltips.',
      primaryFeatures: [
        {
          title: '4 Distinct Personas',
          desc: 'Switch identities with a single click to test varying permission privileges.',
        },
        {
          title: 'Real-Time Permission Matrix',
          desc: 'Clear visual audit of which roles are permitted to declare, edit, or resolve incidents.',
        },
        {
          title: 'Safe Read-Only Viewer Mode',
          desc: 'Permits stakeholders to observe war-room triage without risk of inadvertent mutations.',
        },
      ],
      actionTrigger: () => {
        onNavigateTab('roles');
      },
    },
  ];

  // Whenever step changes, run the step's live navigation action
  useEffect(() => {
    if (isOpen && steps[currentStepIndex]) {
      steps[currentStepIndex].actionTrigger();
    }
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
  };

  return (
    <>
      {/* 1. Non-blocking Subtle Top/Bottom Floating Guide Dock */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 md:max-w-xl w-auto pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="bg-[#0E151E] border-2 border-[#2dd4bf]/40 rounded-xl shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-[#090D13] border-b border-[#1E2631] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-ping" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2dd4bf]">
                Live Interactive Tour • Step {currentStep.stepNumber} of {currentStep.totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentStepIndex(0)}
                title="Restart Tour from Step 1"
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#16202B] transition-colors text-xs inline-flex items-center gap-1 font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Restart</span>
              </button>
              <button
                onClick={onClose}
                title="Exit Guided Tour"
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#16202B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Step Indicators */}
          <div className="px-4 py-1.5 bg-[#0B0F14] border-b border-[#1E2631] flex items-center justify-between gap-1 overflow-x-auto">
            {steps.map((st, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <button
                  key={st.id}
                  onClick={() => handleJumpToStep(idx)}
                  className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#182635] text-[#2dd4bf] font-bold border border-[#2dd4bf]/40'
                      : isPast
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isActive
                        ? 'bg-[#2dd4bf] text-[#0B0F14]'
                        : isPast
                        ? 'bg-teal-500/20 text-[#2dd4bf]'
                        : 'bg-[#16202B] text-slate-500'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{st.category.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {/* Title with icon & current location */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-[#2dd4bf] shrink-0 mt-0.5">
                <StepIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-100 font-sans">
                    {currentStep.title}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#16202B] text-teal-300 border border-[#232F3E]">
                    Viewing: {currentStep.targetLocationName}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {currentStep.primaryFeatures.map((feat, i) => (
                <div
                  key={i}
                  className="p-2 rounded-md bg-[#0B0F14] border border-[#1E2631] text-[11px]"
                >
                  <div className="font-semibold text-slate-200 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-[#2dd4bf] shrink-0" />
                    <span className="truncate">{feat.title}</span>
                  </div>
                  <div className="text-slate-400 text-[10.5px] mt-0.5 line-clamp-2">
                    {feat.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Operator Pro Tip */}
            <div className="p-2 rounded-md bg-teal-950/20 border border-teal-500/20 text-[11px] text-slate-300 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#2dd4bf] font-mono mr-1">OPERATOR TIP:</strong>
                <span>{currentStep.proTip}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-4 py-2.5 bg-[#090D13] border-t border-[#1E2631] flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                currentStepIndex === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-600'
                  : 'text-slate-300 hover:text-white bg-[#16202B] hover:bg-[#1E2A38] cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] font-mono text-slate-400">
              {currentStepIndex + 1} / {steps.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors cursor-pointer"
              >
                Close Guide
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#0B0F14] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
