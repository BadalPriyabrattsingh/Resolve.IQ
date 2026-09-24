import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Incident,
  Service,
  Evidence,
  TimelineEvent,
  User,
  DashboardStats,
  UserRole,
  Severity,
  IncidentStatus,
  Investigation,
  Hypothesis,
  HypothesisStatus,
  ContractorMapping,
} from '../src/types';
import { synthesizeDeterministicInvestigation } from './aiInvestigation';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ticketPrefix?: string;
  ownerUserId: string;
  createdAt: string;
  isContractorOrg?: boolean;
}

export function generateTicketPrefix(orgName: string): string {
  const clean = orgName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 5) || 'INC';
  }
  let candidate = words.map((w) => w[0]).join('');
  if (candidate.length < 3 && words[0].length >= 3) {
    candidate = words[0].slice(0, 3) + (words[1] ? words[1][0] : '');
  }
  return candidate.slice(0, 5) || 'INC';
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  description: string;
  leadUserId?: string;
  memberUserIds: string[];
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash?: string;
}

export interface Session {
  token: string;
  userId: string;
  activeOrgId?: string; // Currently selected tenant context
  createdAt: string;
  expiresAt: string;
}

interface DatabaseSchema {
  organizations: Organization[];
  teams: Team[];
  users: UserRecord[];
  sessions: Session[];
  services: Service[];
  incidents: Incident[];
  evidence: Evidence[];
  timelineEvents: TimelineEvent[];
  investigations: Investigation[];
  contractorMappings: ContractorMapping[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'resolveiq_db.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_resolveiq_salt_2026').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function sanitizeUser(u: UserRecord): User {
  const { passwordHash, ...rest } = u;
  return rest as User;
}

const SEED_SERVICES: Service[] = [
  {
    id: 'srv-payment',
    name: 'Payment Service',
    description: 'Core credit card processing, merchant payouts, Apple Pay / Google Pay, and Stripe/Adyen orchestration.',
    owningTeam: 'Payments Core',
    environment: 'Production',
    criticality: 'TIER-0',
    repositoryUrl: 'https://github.com/internal-corp/payment-service',
    healthStatus: 'DEGRADED',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2026-09-18T05:20:00.000Z',
  },
  {
    id: 'srv-order',
    name: 'Order Service',
    description: 'Customer checkout checkout pipeline, shopping basket state machine, and order fulfillment lifecycle.',
    owningTeam: 'Checkout Eng',
    environment: 'Production',
    criticality: 'TIER-1',
    repositoryUrl: 'https://github.com/internal-corp/order-service',
    healthStatus: 'HEALTHY',
    createdAt: '2025-01-15T09:30:00.000Z',
    updatedAt: '2026-09-18T04:10:00.000Z',
  },
  {
    id: 'srv-user',
    name: 'User Service',
    description: 'User identity, OAuth2 / OIDC authentication tokens, role-based authorization, and account profiles.',
    owningTeam: 'Identity & Access',
    environment: 'Production',
    criticality: 'TIER-0',
    repositoryUrl: 'https://github.com/internal-corp/user-service',
    healthStatus: 'HEALTHY',
    createdAt: '2025-01-05T12:00:00.000Z',
    updatedAt: '2026-09-18T02:00:00.000Z',
  },
  {
    id: 'srv-notification',
    name: 'Notification Service',
    description: 'High-throughput transactional email, SMS via Twilio, push alerts via FCM/APNS, and internal webhooks.',
    owningTeam: 'Communications',
    environment: 'Production',
    criticality: 'TIER-2',
    repositoryUrl: 'https://github.com/internal-corp/notification-service',
    healthStatus: 'HEALTHY',
    createdAt: '2025-02-01T11:00:00.000Z',
    updatedAt: '2026-09-17T18:00:00.000Z',
  },
  {
    id: 'srv-api-gateway',
    name: 'API Gateway',
    description: 'Envoy-based edge ingress proxy, SSL termination, global rate limiting, and mTLS service mesh routing.',
    owningTeam: 'SRE Edge',
    environment: 'Production',
    criticality: 'TIER-0',
    repositoryUrl: 'https://github.com/internal-corp/edge-api-gateway',
    healthStatus: 'HEALTHY',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-09-18T04:55:00.000Z',
  },
  {
    id: 'srv-database',
    name: 'Database Service',
    description: 'Primary distributed Aurora PostgreSQL database cluster, PgBouncer poolers, and cross-region replicas.',
    owningTeam: 'Data Infrastructure',
    environment: 'Production',
    criticality: 'TIER-0',
    repositoryUrl: 'https://github.com/internal-corp/data-infra-cluster',
    healthStatus: 'HEALTHY',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-09-18T05:15:00.000Z',
  },
];

const SEED_INCIDENTS: Incident[] = [
  {
    id: 'inc-2026-00124',
    incidentNumber: 'INC-2026-00124',
    title: 'Payment API returning 500 errors',
    description: 'Production Payment Service is throwing consecutive HTTP 500 errors on the /v1/charges and /v1/checkout endpoints. Connection pool timeouts observed following recent release.',
    severity: 'SEV-1',
    status: 'INVESTIGATING',
    serviceId: 'srv-payment',
    serviceName: 'Payment Service',
    environment: 'Production',
    reportedBy: 'Marcus Vance',
    assignedEngineer: 'Marcus Vance',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-18T05:14:22.000Z',
    startedTime: '2026-09-18T05:10:00.000Z',
    acknowledgedTime: '2026-09-18T05:16:00.000Z',
    customerImpact: true,
    impactSummary: 'Checkout failures impacting ~14.8% of global customer credit card transactions via Stripe/Adyen endpoints. Elevated cart abandonments reported in US-East.',
    createdTimestamp: '2026-09-18T05:15:00.000Z',
    updatedTimestamp: '2026-09-18T05:35:00.000Z',
  },
  {
    id: 'inc-2026-00123',
    incidentNumber: 'INC-2026-00123',
    title: 'API Gateway rate limiter thread lock under flash traffic',
    description: 'A flash sale event triggered Redis token-bucket locking in edge gateway worker pools, causing 429 Too Many Requests to be served incorrectly to non-throttled callers.',
    severity: 'SEV-2',
    status: 'MITIGATING',
    serviceId: 'srv-api-gateway',
    serviceName: 'API Gateway',
    environment: 'Production',
    reportedBy: 'Sarah Chen',
    assignedEngineer: 'Marcus Vance',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-18T04:45:00.000Z',
    startedTime: '2026-09-18T04:40:00.000Z',
    acknowledgedTime: '2026-09-18T04:48:00.000Z',
    customerImpact: true,
    impactSummary: 'Approximately 5% of web requests intermittently receiving false 429 throttles for 12 minutes.',
    createdTimestamp: '2026-09-18T04:47:00.000Z',
    updatedTimestamp: '2026-09-18T05:22:00.000Z',
  },
  {
    id: 'inc-2026-00122',
    incidentNumber: 'INC-2026-00122',
    title: 'Order Service Kafka consumer lag exceeding 45,000 messages',
    description: 'Partition 3 consumer group on topic `orders.finalized` stalled due to a deserialization failure with a malformed promo code payload.',
    severity: 'SEV-2',
    status: 'INVESTIGATING',
    serviceId: 'srv-order',
    serviceName: 'Order Service',
    environment: 'Production',
    reportedBy: 'Alex Turner',
    assignedEngineer: 'Alex Turner',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-18T03:30:00.000Z',
    startedTime: '2026-09-18T03:22:00.000Z',
    acknowledgedTime: '2026-09-18T03:35:00.000Z',
    customerImpact: false,
    impactSummary: 'Order confirmation emails and downstream analytics delayed by ~8 minutes; order placement unaffected.',
    createdTimestamp: '2026-09-18T03:32:00.000Z',
    updatedTimestamp: '2026-09-18T05:00:00.000Z',
  },
  {
    id: 'inc-2026-00121',
    incidentNumber: 'INC-2026-00121',
    title: 'Database Service read replica replication lag > 180s in eu-central-1',
    description: 'Cross-region physical replication streaming broke after an AWS network partition, causing read replica to fall behind WAL timeline.',
    severity: 'SEV-3',
    status: 'TRIAGED',
    serviceId: 'srv-database',
    serviceName: 'Database Service',
    environment: 'Production',
    reportedBy: 'Marcus Vance',
    assignedEngineer: 'Marcus Vance',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-18T02:15:00.000Z',
    startedTime: '2026-09-18T02:00:00.000Z',
    acknowledgedTime: '2026-09-18T02:20:00.000Z',
    customerImpact: false,
    impactSummary: 'European users observing slightly stale balance display until replication catches up.',
    createdTimestamp: '2026-09-18T02:18:00.000Z',
    updatedTimestamp: '2026-09-18T04:10:00.000Z',
  },
  {
    id: 'inc-2026-00120',
    incidentNumber: 'INC-2026-00120',
    title: 'Notification Service FCM token refresh rate limit exceeded',
    description: 'Firebase Cloud Messaging client credentials triggered Google API quota limits for Android push notifications.',
    severity: 'SEV-3',
    status: 'DETECTED',
    serviceId: 'srv-notification',
    serviceName: 'Notification Service',
    environment: 'Production',
    reportedBy: 'Elena Rostova',
    assignedEngineer: undefined,
    incidentManager: undefined,
    detectedTime: '2026-09-18T01:10:00.000Z',
    startedTime: '2026-09-18T01:05:00.000Z',
    acknowledgedTime: undefined,
    customerImpact: true,
    impactSummary: 'Android push notifications delayed by up to 25 minutes; fallback SMS active.',
    createdTimestamp: '2026-09-18T01:12:00.000Z',
    updatedTimestamp: '2026-09-18T01:12:00.000Z',
  },
  {
    id: 'inc-2026-00119',
    incidentNumber: 'INC-2026-00119',
    title: 'User Service Redis session cache eviction causing slow auth checks',
    description: 'Maxmemory policy was set to noeviction on redis-auth-01, resulting in OOM on new session key creation.',
    severity: 'SEV-3',
    status: 'RESOLVED',
    serviceId: 'srv-user',
    serviceName: 'User Service',
    environment: 'Production',
    reportedBy: 'Sarah Chen',
    assignedEngineer: 'Marcus Vance',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-17T21:00:00.000Z',
    startedTime: '2026-09-17T20:50:00.000Z',
    acknowledgedTime: '2026-09-17T21:04:00.000Z',
    resolvedTime: '2026-09-17T21:42:00.000Z',
    customerImpact: true,
    impactSummary: 'Users experienced momentary login re-prompting during memory pressure; resolved by switching eviction policy to volatile-lru.',
    createdTimestamp: '2026-09-17T21:02:00.000Z',
    updatedTimestamp: '2026-09-17T21:45:00.000Z',
  },
  {
    id: 'inc-2026-00118',
    incidentNumber: 'INC-2026-00118',
    title: 'Payment Service 3D-Secure 2.0 challenge iframe failure on Safari 17.4',
    description: 'Strict Content-Security-Policy header blocked redirect postmessage from Visa Secure verified domain.',
    severity: 'SEV-2',
    status: 'RESOLVED',
    serviceId: 'srv-payment',
    serviceName: 'Payment Service',
    environment: 'Production',
    reportedBy: 'Elena Rostova',
    assignedEngineer: 'Alex Turner',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-17T14:15:00.000Z',
    startedTime: '2026-09-17T13:40:00.000Z',
    acknowledgedTime: '2026-09-17T14:20:00.000Z',
    resolvedTime: '2026-09-17T15:18:00.000Z',
    customerImpact: true,
    impactSummary: 'EU customers using Safari unable to complete card authentication step for 58 minutes.',
    createdTimestamp: '2026-09-17T14:18:00.000Z',
    updatedTimestamp: '2026-09-17T15:20:00.000Z',
  },
  {
    id: 'inc-2026-00117',
    incidentNumber: 'INC-2026-00117',
    title: 'Database Service autovacuum freeze job consuming 98% disk IOPS',
    description: 'Transaction ID wraparound prevention triggered aggressive autovacuum during unexpected midday order rush.',
    severity: 'SEV-3',
    status: 'RESOLVED',
    serviceId: 'srv-database',
    serviceName: 'Database Service',
    environment: 'Production',
    reportedBy: 'Marcus Vance',
    assignedEngineer: 'Marcus Vance',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-16T17:30:00.000Z',
    startedTime: '2026-09-16T17:25:00.000Z',
    acknowledgedTime: '2026-09-16T17:32:00.000Z',
    resolvedTime: '2026-09-16T18:05:00.000Z',
    customerImpact: false,
    impactSummary: 'Database latency elevated by 60ms; autovacuum throttled via vacuum_cost_limit.',
    createdTimestamp: '2026-09-16T17:31:00.000Z',
    updatedTimestamp: '2026-09-16T18:10:00.000Z',
  },
  {
    id: 'inc-2026-00116',
    incidentNumber: 'INC-2026-00116',
    title: 'Order Service duplicate idempotency key evaluation failure',
    description: 'Concurrency race in the distributed lock manager allowed two rapid clicks on Submit Order to generate duplicate records.',
    severity: 'SEV-4',
    status: 'CLOSED',
    serviceId: 'srv-order',
    serviceName: 'Order Service',
    environment: 'Production',
    reportedBy: 'Alex Turner',
    assignedEngineer: 'Alex Turner',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-15T11:00:00.000Z',
    startedTime: '2026-09-15T10:45:00.000Z',
    acknowledgedTime: '2026-09-15T11:15:00.000Z',
    resolvedTime: '2026-09-15T12:00:00.000Z',
    customerImpact: false,
    impactSummary: 'Found 3 duplicate test orders; DB unique constraint caught payments correctly.',
    createdTimestamp: '2026-09-15T11:05:00.000Z',
    updatedTimestamp: '2026-09-15T14:00:00.000Z',
  },
  {
    id: 'inc-2026-00115',
    incidentNumber: 'INC-2026-00115',
    title: 'Notification Service webhook signature verification drift',
    description: 'Clock skew between notification worker nodes caused webhook HMAC sha256 timestamps to fail verification by 12 seconds.',
    severity: 'SEV-4',
    status: 'CLOSED',
    serviceId: 'srv-notification',
    serviceName: 'Notification Service',
    environment: 'Staging',
    reportedBy: 'Elena Rostova',
    assignedEngineer: 'Marcus Vance',
    incidentManager: 'Sarah Chen',
    detectedTime: '2026-09-14T09:00:00.000Z',
    startedTime: '2026-09-14T08:50:00.000Z',
    acknowledgedTime: '2026-09-14T09:10:00.000Z',
    resolvedTime: '2026-09-14T09:35:00.000Z',
    customerImpact: false,
    impactSummary: 'Confined to staging environment. NTP daemon resynchronized.',
    createdTimestamp: '2026-09-14T09:05:00.000Z',
    updatedTimestamp: '2026-09-14T10:00:00.000Z',
  },
];

const SEED_EVIDENCE: Evidence[] = [
  // Realistic evidence for INC-2026-00124 (Payment API returning 500 errors)
  {
    id: 'ev-1',
    incidentId: 'inc-2026-00124',
    type: 'ALERT',
    title: 'PagerDuty High Urgency: PaymentServiceErrorRateHigh',
    source: 'PagerDuty / Datadog Monitor #91822',
    content: 'ALERT: payment-service.http.5xx_rate > 5% over 5m window.\nCurrent value: 14.82% (Threshold: 0.50%)\nTriggered at: 2026-09-18T05:14:22Z\nImpacted nodes: payment-service-pod-7b99c8f, payment-service-pod-2c11a0d\nDashboard: https://datadog.internal/monitors/91822',
    timestamp: '2026-09-18T05:14:22.000Z',
    createdBy: 'Marcus Vance',
    createdTimestamp: '2026-09-18T05:15:30.000Z',
  },
  {
    id: 'ev-2',
    incidentId: 'inc-2026-00124',
    type: 'METRIC',
    title: 'HTTP 500 Error Spike & P99 Latency Telemetry',
    source: 'Prometheus / Grafana Dashboard [Payment Service Golden Signals]',
    content: 'metric: sum(rate(http_requests_total{service="payment-service", status=~"5.."}[1m])) by (endpoint)\n- /v1/charges: 182 req/sec (was: 0.02 req/sec)\n- /v1/checkout/authorize: 94 req/sec (was: 0.00 req/sec)\nP99 Latency: 4,820ms (Baseline: 145ms)\nConnection timeout rate: 38 timeouts/sec',
    timestamp: '2026-09-18T05:16:10.000Z',
    createdBy: 'Marcus Vance',
    createdTimestamp: '2026-09-18T05:17:00.000Z',
  },
  {
    id: 'ev-3',
    incidentId: 'inc-2026-00124',
    type: 'LOG',
    title: 'Stack trace: HikariPool-1 connection acquisition timeout',
    source: 'Elasticsearch / Kibana log query: service:payment-service AND level:ERROR',
    content: '2026-09-18T05:13:58.204Z [pool-1-thread-44] ERROR c.r.p.repository.TransactionDao - Connection is not available, request timed out after 30005ms.\norg.postgresql.util.PSQLException: Connection to 10.240.12.88:5432 refused or pool exhausted.\nat com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:213)\nat com.resolveiq.payment.repository.TransactionDao.executeCharge(TransactionDao.java:89)\nCaused by: java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available',
    timestamp: '2026-09-18T05:18:00.000Z',
    createdBy: 'Marcus Vance',
    createdTimestamp: '2026-09-18T05:18:45.000Z',
  },
  {
    id: 'ev-4',
    incidentId: 'inc-2026-00124',
    type: 'DATABASE',
    title: 'pg_stat_activity: High connection count & lock contention',
    source: 'Aurora PostgreSQL Primary [db-prod-main.internal]',
    content: 'SELECT count(*), state, wait_event FROM pg_stat_activity WHERE datname=\'payment_prod\' GROUP BY 2,3;\ncount: 198 | state: active | wait_event: Lock:tuple\ncount: 2   | state: idle   | wait_event: ClientRead\nMax allowed connections: 200\nActive long-running query detected: migration script #482 running ALTER TABLE transactions ADD COLUMN risk_evaluation_v2 JSONB (locked table for 8.4 mins)',
    timestamp: '2026-09-18T05:21:00.000Z',
    createdBy: 'Sarah Chen',
    createdTimestamp: '2026-09-18T05:22:30.000Z',
  },
  {
    id: 'ev-5',
    incidentId: 'inc-2026-00124',
    type: 'DEPLOYMENT',
    title: 'Release v2.41.0-release deployed by CI/CD pipeline #10492',
    source: 'GitHub Actions / ArgoCD Cluster rollout',
    content: 'Commit: 8f9b1c2 "feat(payments): Introduce automated fraud risk assessment v2 with DB schema migration"\nAuthor: dev-deployer-bot\nDeployed to Production namespace: 2026-09-18T05:08:44Z\nContains flyway migration V482__add_fraud_v2.sql with table-exclusive lock.',
    timestamp: '2026-09-18T05:08:44.000Z',
    createdBy: 'Alex Turner',
    createdTimestamp: '2026-09-18T05:25:00.000Z',
  },
  {
    id: 'ev-6',
    incidentId: 'inc-2026-00124',
    type: 'COMMENT',
    title: 'Root Cause Hypothesis & War Room Summary',
    source: 'Incident Commander Note',
    content: 'Root cause confirmed: Migration V482 took an ACCESS EXCLUSIVE lock on the core `transactions` table. Because of continuous traffic, all write queries backed up in the Hikari pool until it reached the 200 connection ceiling. We are executing an emergency kill of the blocking migration query and temporarily increasing the pool size while rollback is finalized.',
    timestamp: '2026-09-18T05:30:00.000Z',
    createdBy: 'Sarah Chen',
    createdTimestamp: '2026-09-18T05:30:15.000Z',
  },

  // Evidence for other incidents
  {
    id: 'ev-7',
    incidentId: 'inc-2026-00123',
    type: 'ALERT',
    title: 'Edge Gateway Redis Latency Alert',
    source: 'Datadog',
    content: 'Redis token-bucket cluster latency > 50ms. High connection contention.',
    timestamp: '2026-09-18T04:46:00.000Z',
    createdBy: 'Sarah Chen',
    createdTimestamp: '2026-09-18T04:50:00.000Z',
  },
  {
    id: 'ev-8',
    incidentId: 'inc-2026-00122',
    type: 'METRIC',
    title: 'Kafka Consumer Group Lag: orders-consumer-group',
    source: 'Kafka Exporter / Prometheus',
    content: 'Lag jumped from 40 to 45,120 messages on partition 3.',
    timestamp: '2026-09-18T03:31:00.000Z',
    createdBy: 'Alex Turner',
    createdTimestamp: '2026-09-18T03:33:00.000Z',
  },
];

const SEED_TIMELINE_EVENTS: TimelineEvent[] = [
  // Timeline for INC-2026-00124
  {
    id: 'tl-1',
    incidentId: 'inc-2026-00124',
    eventType: 'CREATED',
    title: 'Incident Detected & Declared',
    description: 'Incident INC-2026-00124 auto-declared following high-urgency PagerDuty alert on Payment Service HTTP 500 error spike.',
    actorName: 'Marcus Vance',
    actorRole: 'ENGINEER',
    timestamp: '2026-09-18T05:15:00.000Z',
  },
  {
    id: 'tl-2',
    incidentId: 'inc-2026-00124',
    eventType: 'SEVERITY_CHANGE',
    title: 'Severity Escalated to SEV-1',
    description: 'Severity raised from SEV-2 to SEV-1 due to customer-facing checkout impact exceeding 10% failure rate.',
    actorName: 'Sarah Chen',
    actorRole: 'INCIDENT_MANAGER',
    metadata: { oldSeverity: 'SEV-2', newSeverity: 'SEV-1' },
    timestamp: '2026-09-18T05:16:30.000Z',
  },
  {
    id: 'tl-3',
    incidentId: 'inc-2026-00124',
    eventType: 'ASSIGNMENT',
    title: 'Command Roster Assigned',
    description: 'Sarah Chen assigned as Incident Manager. Marcus Vance assigned as Lead Investigating SRE.',
    actorName: 'Sarah Chen',
    actorRole: 'INCIDENT_MANAGER',
    metadata: { assignedEngineer: 'Marcus Vance', incidentManager: 'Sarah Chen' },
    timestamp: '2026-09-18T05:17:00.000Z',
  },
  {
    id: 'tl-4',
    incidentId: 'inc-2026-00124',
    eventType: 'EVIDENCE_ADDED',
    title: 'Evidence Attached: HTTP 500 & P99 Telemetry',
    description: 'Marcus Vance attached Prometheus golden signals telemetry showing 182 req/sec 500 errors and 4,820ms P99 latency.',
    actorName: 'Marcus Vance',
    actorRole: 'ENGINEER',
    metadata: { evidenceType: 'METRIC', evidenceId: 'ev-2' },
    timestamp: '2026-09-18T05:17:45.000Z',
  },
  {
    id: 'tl-5',
    incidentId: 'inc-2026-00124',
    eventType: 'STATUS_CHANGE',
    title: 'Status Transitioned to INVESTIGATING',
    description: 'Status shifted from TRIAGED to INVESTIGATING. War room established; engineers inspecting logs and database pools.',
    actorName: 'Sarah Chen',
    actorRole: 'INCIDENT_MANAGER',
    metadata: { oldStatus: 'TRIAGED', newStatus: 'INVESTIGATING' },
    timestamp: '2026-09-18T05:18:00.000Z',
  },
  {
    id: 'tl-6',
    incidentId: 'inc-2026-00124',
    eventType: 'EVIDENCE_ADDED',
    title: 'Evidence Attached: Stack Trace & DB Pool Timeout',
    description: 'Kibana log query captured HikariPool-1 timeout after 30005ms waiting for available PostgreSQL connection.',
    actorName: 'Marcus Vance',
    actorRole: 'ENGINEER',
    metadata: { evidenceType: 'LOG', evidenceId: 'ev-3' },
    timestamp: '2026-09-18T05:19:00.000Z',
  },
  {
    id: 'tl-7',
    incidentId: 'inc-2026-00124',
    eventType: 'EVIDENCE_ADDED',
    title: 'Evidence Attached: Aurora DB Connection Lock Data',
    description: 'Sarah Chen queried pg_stat_activity revealing 198/200 active connections waiting on exclusive lock for migration #482.',
    actorName: 'Sarah Chen',
    actorRole: 'INCIDENT_MANAGER',
    metadata: { evidenceType: 'DATABASE', evidenceId: 'ev-4' },
    timestamp: '2026-09-18T05:22:30.000Z',
  },
  {
    id: 'tl-8',
    incidentId: 'inc-2026-00124',
    eventType: 'EVIDENCE_ADDED',
    title: 'Evidence Attached: CI/CD Deployment v2.41.0',
    description: 'Alex Turner verified deployment timestamp matches the onset of error spikes at 05:08:44Z.',
    actorName: 'Alex Turner',
    actorRole: 'ADMIN',
    metadata: { evidenceType: 'DEPLOYMENT', evidenceId: 'ev-5' },
    timestamp: '2026-09-18T05:25:00.000Z',
  },
  {
    id: 'tl-9',
    incidentId: 'inc-2026-00124',
    eventType: 'COMMENT',
    title: 'War Room Update: Mitigation Strategy Formulated',
    description: 'Marcus Vance: "Terminating the blocking lock query on PostgreSQL primary and executing instant pod restart to flush Hikari queue."',
    actorName: 'Marcus Vance',
    actorRole: 'ENGINEER',
    timestamp: '2026-09-18T05:32:00.000Z',
  },
];

function getInitialSeedInvestigations(): Investigation[] {
  return [
    synthesizeDeterministicInvestigation(
      SEED_INCIDENTS[0],
      SEED_EVIDENCE.filter((e) => e.incidentId === 'inc-2026-00124'),
      SEED_TIMELINE_EVENTS.filter((t) => t.incidentId === 'inc-2026-00124')
    ),
  ];
}

// Helper to safely load or initialize database
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDataDir();

  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseSchema = {
      organizations: [],
      teams: [],
      users: [],
      sessions: [],
      services: [],
      incidents: [],
      evidence: [],
      timelineEvents: [],
      investigations: [],
      contractorMappings: [],
    };
    saveDatabase(initialDb);
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    // Filter out any legacy dummy users that don't have passwordHash and orgId
    const validUsers = (parsed.users || []).filter(
      (u) => !!u.passwordHash && !!u.orgId
    );
    const validOrgs = parsed.organizations || [];
    const validTeams = parsed.teams || [];
    const validSessions = parsed.sessions || [];

    const dbData: DatabaseSchema = {
      organizations: validOrgs,
      teams: validTeams,
      users: validUsers,
      sessions: validSessions,
      services: Array.isArray(parsed.services) ? parsed.services : [],
      incidents: Array.isArray(parsed.incidents) ? parsed.incidents : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      timelineEvents: Array.isArray(parsed.timelineEvents) ? parsed.timelineEvents : [],
      investigations: Array.isArray(parsed.investigations) ? parsed.investigations : [],
      contractorMappings: Array.isArray(parsed.contractorMappings) ? parsed.contractorMappings : [],
    };
    saveDatabase(dbData);
    return dbData;
  } catch (err) {
    console.error('Failed to read database file, initializing clean database:', err);
    const fallbackDb: DatabaseSchema = {
      organizations: [],
      teams: [],
      users: [],
      sessions: [],
      services: [],
      incidents: [],
      evidence: [],
      timelineEvents: [],
      investigations: [],
      contractorMappings: [],
    };
    saveDatabase(fallbackDb);
    return fallbackDb;
  }
}

function saveDatabase(data: DatabaseSchema): void {
  ensureDataDir();
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// In-memory cache synced with disk
let dbCache: DatabaseSchema = loadDatabase();

export const db = {
  // USER & AUTH OPERATIONS
  hasUsers(): boolean {
    return dbCache.users.length > 0;
  },

  getUsers(): User[] {
    return dbCache.users.map(sanitizeUser);
  },

  getUserById(id: string): User | undefined {
    const u = dbCache.users.find((u) => u.id === id);
    return u ? sanitizeUser(u) : undefined;
  },

  getUserRecordById(id: string): UserRecord | undefined {
    return dbCache.users.find((u) => u.id === id);
  },

  getUserByEmail(email: string): UserRecord | undefined {
    const clean = email.trim().toLowerCase();
    return dbCache.users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        (u.contractorEmail && u.contractorEmail.toLowerCase() === clean) ||
        (u.contractorId && u.contractorId.toLowerCase() === clean)
    );
  },

  getUserBySession(token: string): {
    user: User;
    organization: Organization;
    availableOrganizations: Organization[];
  } | null {
    if (!token) return null;
    const session = dbCache.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      dbCache.sessions = dbCache.sessions.filter((s) => s.token !== token);
      saveDatabase(dbCache);
      return null;
    }
    const userRecord = dbCache.users.find((u) => u.id === session.userId);
    if (!userRecord) return null;

    // Home organization
    let homeOrg = dbCache.organizations.find((o) => o.id === userRecord.orgId);
    if (!homeOrg) {
      const ticketPrefix = generateTicketPrefix(userRecord.orgName || 'Primary');
      homeOrg = {
        id: userRecord.orgId || 'org-default',
        name: userRecord.orgName || 'Primary Organization',
        slug: (userRecord.orgName || 'primary').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ticketPrefix,
        ownerUserId: userRecord.id,
        createdAt: userRecord.createdAt || new Date().toISOString(),
      };
    }

    // Determine all accessible organizations (Home org + Client orgs where mapped as contractor)
    const availableOrgsMap = new Map<string, Organization>();
    availableOrgsMap.set(homeOrg.id, homeOrg);

    // If user is PRODUCT_OWNER, can access all organizations
    if (userRecord.isProductOwner || userRecord.role === 'PRODUCT_OWNER') {
      dbCache.organizations.forEach((o) => availableOrgsMap.set(o.id, o));
    } else {
      // Find contractor mappings for this user
      (dbCache.contractorMappings || []).forEach((cm) => {
        if (
          cm.userId === userRecord.id ||
          cm.actualEmail.toLowerCase() === userRecord.email.toLowerCase() ||
          (userRecord.contractorEmail &&
            cm.contractorEmail.toLowerCase() === userRecord.contractorEmail.toLowerCase())
        ) {
          const clientOrg = dbCache.organizations.find((o) => o.id === cm.orgId);
          if (clientOrg) {
            availableOrgsMap.set(clientOrg.id, {
              ...clientOrg,
              isContractorOrg: true,
            });
          }
        }
      });
    }

    const availableOrganizations = Array.from(availableOrgsMap.values());

    // Check if session has a specific activeOrgId selected
    let activeOrg = homeOrg;
    let effectiveUser: UserRecord = { ...userRecord };

    if (session.activeOrgId && session.activeOrgId !== homeOrg.id) {
      const targetOrg = availableOrgsMap.get(session.activeOrgId);
      if (targetOrg) {
        activeOrg = targetOrg;
        // Check if there is a contractor mapping for this org
        const cm = (dbCache.contractorMappings || []).find(
          (m) =>
            m.orgId === targetOrg.id &&
            (m.userId === userRecord.id ||
              m.actualEmail.toLowerCase() === userRecord.email.toLowerCase())
        );
        if (cm) {
          effectiveUser.orgId = targetOrg.id;
          effectiveUser.orgName = targetOrg.name;
          effectiveUser.contractorEmail = cm.contractorEmail;
          effectiveUser.contractorId = cm.contractorId;
          effectiveUser.isContractor = true;
          effectiveUser.vendorCompany = cm.vendorCompany;
          effectiveUser.contractorSyncStatus = cm.syncStatus;
          effectiveUser.lastSyncedAt = cm.lastSyncedAt;
          effectiveUser.role = cm.role || 'ENGINEER';
          effectiveUser.title = cm.title || `Outsourced Contractor (${cm.vendorCompany})`;
          effectiveUser.teams = cm.teams || [];
        } else if (userRecord.isProductOwner) {
          effectiveUser.orgId = targetOrg.id;
          effectiveUser.orgName = targetOrg.name;
        }
      }
    }

    return {
      user: sanitizeUser(effectiveUser),
      organization: activeOrg,
      availableOrganizations,
    };
  },

  switchUserOrganization(
    token: string,
    targetOrgId: string
  ): {
    user: User;
    organization: Organization;
    availableOrganizations: Organization[];
  } {
    const session = dbCache.sessions.find((s) => s.token === token);
    if (!session) throw new Error('Invalid or expired session');
    const userRecord = dbCache.users.find((u) => u.id === session.userId);
    if (!userRecord) throw new Error('User not found');

    const targetOrg = dbCache.organizations.find((o) => o.id === targetOrgId);
    if (!targetOrg) throw new Error('Target organization not found');

    const isHomeOrg = userRecord.orgId === targetOrgId;
    const isOwner = userRecord.isProductOwner || userRecord.role === 'PRODUCT_OWNER';
    const isMappedContractor = (dbCache.contractorMappings || []).some(
      (cm) =>
        cm.orgId === targetOrgId &&
        (cm.userId === userRecord.id ||
          cm.actualEmail.toLowerCase() === userRecord.email.toLowerCase())
    );

    if (!isHomeOrg && !isOwner && !isMappedContractor) {
      throw new Error(
        'Access denied: You do not have an active membership or contractor sync in this organization.'
      );
    }

    session.activeOrgId = targetOrgId;
    saveDatabase(dbCache);

    const result = this.getUserBySession(token);
    if (!result) throw new Error('Failed to update active tenant context');
    return result;
  },

  registerUser(payload: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    title?: string;
  }): { token: string; user: User; organization: Organization } {
    const cleanEmail = payload.email.trim().toLowerCase();
    if (dbCache.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    const isFirstUserEver = dbCache.users.length === 0;
    const cleanOrgName = payload.organizationName.trim();
    let org = dbCache.organizations.find(
      (o) => o.name.toLowerCase() === cleanOrgName.toLowerCase()
    );
    let isFirstInOrg = false;
    const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const ticketPrefix = generateTicketPrefix(cleanOrgName);

    if (isFirstUserEver) {
      const orgId = `org-${Date.now().toString(36)}`;
      org = {
        id: orgId,
        name: cleanOrgName,
        slug: cleanOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ticketPrefix,
        ownerUserId: userId,
        createdAt: new Date().toISOString(),
      };
      dbCache.organizations.push(org);
      isFirstInOrg = true;
    } else if (!org) {
      const orgId = `org-${Date.now().toString(36)}`;
      org = {
        id: orgId,
        name: cleanOrgName,
        slug: cleanOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ticketPrefix,
        ownerUserId: userId,
        createdAt: new Date().toISOString(),
      };
      dbCache.organizations.push(org);
      isFirstInOrg = true;
    } else {
      const existingMembers = dbCache.users.filter((u) => u.orgId === org!.id);
      if (existingMembers.length === 0) {
        isFirstInOrg = true;
        org.ownerUserId = userId;
      }
    }

    let role: UserRole = 'ENGINEER';
    let isProductOwner = false;
    let isProductAdmin = false;

    if (isFirstUserEver) {
      role = 'PRODUCT_OWNER';
      isProductOwner = true;
      isProductAdmin = true;
    } else if (isFirstInOrg) {
      role = 'ORG_ADMIN';
    }

    const newUser: UserRecord = {
      id: userId,
      name: payload.name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(payload.password),
      role,
      orgId: org.id,
      orgName: org.name,
      title:
        payload.title?.trim() ||
        (isProductOwner
          ? 'Platform Owner / Lead Architect'
          : isFirstInOrg
          ? 'Organization Administrator'
          : 'Software Engineer'),
      avatarUrl: `https://images.unsplash.com/photo-${
        isProductOwner
          ? '1534528741775-53994a69daeb'
          : isFirstInOrg
          ? '1580489944761-15a19d654956'
          : '1507003211169-0a1dd7228f2d'
      }?w=150&auto=format&fit=crop&q=80`,
      teams: ['Core Reliability'],
      isProductOwner,
      isProductAdmin,
      createdAt: new Date().toISOString(),
    };

    dbCache.users.push(newUser);

    if (isFirstInOrg) {
      const defaultTeam: Team = {
        id: `team-${Date.now().toString(36)}`,
        orgId: org.id,
        name: 'Core Reliability',
        description: 'Primary incident response and site reliability team',
        leadUserId: userId,
        memberUserIds: [userId],
        createdAt: new Date().toISOString(),
      };
      dbCache.teams.push(defaultTeam);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const session: Session = {
      token,
      userId: newUser.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    dbCache.sessions.push(session);

    saveDatabase(dbCache);

    return {
      token,
      user: sanitizeUser(newUser),
      organization: org,
    };
  },

  loginUser(payload: {
    email: string;
    password: string;
  }): {
    token: string;
    user: User;
    organization: Organization;
    availableOrganizations: Organization[];
  } {
    const cleanIdentifier = payload.email.trim().toLowerCase();

    // 1. Direct match on users (actual email, contractor email, contractor ID)
    let user = dbCache.users.find(
      (u) =>
        u.email.toLowerCase() === cleanIdentifier ||
        (u.contractorEmail && u.contractorEmail.toLowerCase() === cleanIdentifier) ||
        (u.contractorId && u.contractorId.toLowerCase() === cleanIdentifier)
    );

    let matchingMapping: ContractorMapping | undefined;

    // 2. Cross-org contractor mapping match
    if (!user) {
      matchingMapping = (dbCache.contractorMappings || []).find(
        (cm) =>
          cm.contractorEmail.toLowerCase() === cleanIdentifier ||
          cm.contractorId.toLowerCase() === cleanIdentifier ||
          cm.actualEmail.toLowerCase() === cleanIdentifier
      );

      if (matchingMapping) {
        if (matchingMapping.userId) {
          user = dbCache.users.find((u) => u.id === matchingMapping!.userId);
        }
        if (!user) {
          user = dbCache.users.find(
            (u) => u.email.toLowerCase() === matchingMapping!.actualEmail.toLowerCase()
          );
        }
      }
    }

    if (!user || !user.passwordHash || !verifyPassword(payload.password, user.passwordHash)) {
      throw new Error('Invalid email or password.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const session: Session = {
      token,
      userId: user.id,
      // If user logged in specifically via client contractor email or badge, enter that client org!
      activeOrgId: matchingMapping ? matchingMapping.orgId : user.orgId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    dbCache.sessions.push(session);
    saveDatabase(dbCache);

    const sessionData = this.getUserBySession(token);
    if (!sessionData) {
      throw new Error('Failed to initialize session');
    }

    return {
      token,
      user: sessionData.user,
      organization: sessionData.organization,
      availableOrganizations: sessionData.availableOrganizations,
    };
  },

  logoutUser(token: string): boolean {
    dbCache.sessions = dbCache.sessions.filter((s) => s.token !== token);
    saveDatabase(dbCache);
    return true;
  },

  // ORGANIZATION & TEAM OPERATIONS
  getOrganizationById(id: string): Organization | undefined {
    return dbCache.organizations.find((o) => o.id === id);
  },

  getAllOrganizations(): (Organization & { memberCount: number; teamCount: number })[] {
    return dbCache.organizations.map((o) => ({
      ...o,
      memberCount: dbCache.users.filter((u) => u.orgId === o.id).length,
      teamCount: dbCache.teams.filter((t) => t.orgId === o.id).length,
    }));
  },

  getOrganizationMembers(orgId: string): User[] {
    const orgUsers = dbCache.users.filter((u) => u.orgId === orgId).map(sanitizeUser);

    // Merge in synced contractors for this client organization
    const contractors: User[] = (dbCache.contractorMappings || [])
      .filter((cm) => cm.orgId === orgId && cm.syncStatus === 'SYNCED')
      .map((cm) => {
        const actualUser = cm.userId
          ? dbCache.users.find((u) => u.id === cm.userId)
          : dbCache.users.find(
              (u) => u.email.toLowerCase() === cm.actualEmail.toLowerCase()
            );

        return {
          id: actualUser?.id || `ctr-${cm.id}`,
          name: cm.contractorName || actualUser?.name || cm.actualEmail.split('@')[0],
          email: cm.actualEmail,
          contractorEmail: cm.contractorEmail,
          contractorId: cm.contractorId,
          isContractor: true,
          vendorCompany: cm.vendorCompany,
          contractorSyncStatus: cm.syncStatus,
          lastSyncedAt: cm.lastSyncedAt,
          role: cm.role || 'ENGINEER',
          orgId: orgId,
          orgName: cm.orgName,
          title: cm.title || `Outsourced Contractor (${cm.vendorCompany})`,
          teams: cm.teams || [],
          avatarUrl:
            actualUser?.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          createdAt: cm.createdAt,
        };
      });

    const result = [...orgUsers];
    contractors.forEach((ctr) => {
      const exists = result.some(
        (u) =>
          u.id === ctr.id ||
          u.email.toLowerCase() === ctr.email.toLowerCase() ||
          (u.contractorEmail &&
            ctr.contractorEmail &&
            u.contractorEmail.toLowerCase() === ctr.contractorEmail.toLowerCase())
      );
      if (!exists) {
        result.push(ctr);
      }
    });

    return result;
  },

  // CONTRACTOR IDENTITY MAPPING OPERATIONS
  getContractorMappings(orgId: string): ContractorMapping[] {
    return (dbCache.contractorMappings || []).filter((cm) => cm.orgId === orgId);
  },

  lookupContractorByActualEmail(actualEmail: string): {
    found: boolean;
    user?: { id: string; name: string; email: string; orgName: string; title: string };
  } {
    const clean = actualEmail.trim().toLowerCase();
    const existing = dbCache.users.find((u) => u.email.toLowerCase() === clean);
    if (existing) {
      return {
        found: true,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          orgName: existing.orgName,
          title: existing.title,
        },
      };
    }
    return { found: false };
  },

  syncContractorMapping(
    orgId: string,
    payload: {
      actualEmail: string;
      contractorEmail: string;
      contractorId: string;
      vendorCompany: string;
      contractorName?: string;
      role?: UserRole;
      title?: string;
      teams?: string[];
      temporaryPassword?: string;
    }
  ): ContractorMapping {
    const clientOrg = dbCache.organizations.find((o) => o.id === orgId);
    if (!clientOrg) throw new Error('Client organization not found');

    const cleanActualEmail = payload.actualEmail.trim().toLowerCase();
    const cleanContractorEmail = payload.contractorEmail.trim().toLowerCase();
    const cleanContractorId = payload.contractorId.trim();
    const cleanVendorCompany = payload.vendorCompany.trim();

    if (!cleanActualEmail || !cleanContractorEmail || !cleanContractorId || !cleanVendorCompany) {
      throw new Error(
        'Missing required fields: Actual Mail ID, Contractor Client Mail, Contractor ID, and Vendor Company'
      );
    }

    if (!dbCache.contractorMappings) {
      dbCache.contractorMappings = [];
    }

    // Check if contractor is already mapped in this org
    let existingMapping = dbCache.contractorMappings.find(
      (cm) =>
        cm.orgId === orgId &&
        (cm.actualEmail.toLowerCase() === cleanActualEmail ||
          cm.contractorEmail.toLowerCase() === cleanContractorEmail ||
          cm.contractorId.toLowerCase() === cleanContractorId.toLowerCase())
    );

    // Look up primary user record
    let linkedUser = dbCache.users.find((u) => u.email.toLowerCase() === cleanActualEmail);

    // If primary user does not exist yet in system, create user record so they can sign in with password
    if (!linkedUser) {
      const defaultPassword = payload.temporaryPassword || 'password123';
      const newUserId = `usr-ctr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const vendorOrgName = cleanVendorCompany || 'Vendor Firm';

      let vendorOrg = dbCache.organizations.find(
        (o) => o.name.toLowerCase() === vendorOrgName.toLowerCase()
      );
      if (!vendorOrg) {
        vendorOrg = {
          id: `org-vendor-${Date.now().toString(36)}`,
          name: vendorOrgName,
          slug: vendorOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          ticketPrefix: generateTicketPrefix(vendorOrgName),
          ownerUserId: newUserId,
          createdAt: new Date().toISOString(),
        };
        dbCache.organizations.push(vendorOrg);
      }

      linkedUser = {
        id: newUserId,
        name: payload.contractorName?.trim() || cleanActualEmail.split('@')[0],
        email: cleanActualEmail,
        contractorEmail: cleanContractorEmail,
        contractorId: cleanContractorId,
        isContractor: true,
        vendorCompany: cleanVendorCompany,
        passwordHash: hashPassword(defaultPassword),
        role: payload.role || 'ENGINEER',
        orgId: vendorOrg.id,
        orgName: vendorOrg.name,
        title: payload.title?.trim() || `Outsourced SRE (${cleanVendorCompany})`,
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        teams: payload.teams || [],
        createdAt: new Date().toISOString(),
      };
      dbCache.users.push(linkedUser);
    } else {
      // User exists! Link them
      linkedUser.contractorEmail = cleanContractorEmail;
      linkedUser.contractorId = cleanContractorId;
      linkedUser.vendorCompany = cleanVendorCompany;
      linkedUser.isContractor = true;
      linkedUser.contractorSyncStatus = 'SYNCED';
      linkedUser.lastSyncedAt = new Date().toISOString();
    }

    const mappingId =
      existingMapping?.id ||
      `cm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const mapping: ContractorMapping = {
      id: mappingId,
      orgId: clientOrg.id,
      orgName: clientOrg.name,
      userId: linkedUser.id,
      actualEmail: cleanActualEmail,
      contractorEmail: cleanContractorEmail,
      contractorId: cleanContractorId,
      vendorCompany: cleanVendorCompany,
      contractorName: payload.contractorName?.trim() || linkedUser.name,
      role: payload.role || 'ENGINEER',
      title: payload.title?.trim() || `Outsourced SRE (${cleanVendorCompany})`,
      teams: payload.teams || [],
      syncStatus: 'SYNCED',
      lastSyncedAt: now,
      createdAt: existingMapping?.createdAt || now,
    };

    if (existingMapping) {
      const idx = dbCache.contractorMappings.indexOf(existingMapping);
      dbCache.contractorMappings[idx] = mapping;
    } else {
      dbCache.contractorMappings.push(mapping);
    }

    // Also sync teams in clientOrg
    if (payload.teams && payload.teams.length > 0) {
      dbCache.teams.forEach((t) => {
        if (
          t.orgId === orgId &&
          payload.teams!.includes(t.name) &&
          !t.memberUserIds.includes(linkedUser!.id)
        ) {
          t.memberUserIds.push(linkedUser!.id);
        }
      });
    }

    saveDatabase(dbCache);
    return mapping;
  },

  resyncContractor(orgId: string, mappingId: string): ContractorMapping {
    const mapping = (dbCache.contractorMappings || []).find(
      (m) => m.id === mappingId && m.orgId === orgId
    );
    if (!mapping) throw new Error('Contractor mapping not found');

    mapping.syncStatus = 'SYNCED';
    mapping.lastSyncedAt = new Date().toISOString();

    if (mapping.userId) {
      const u = dbCache.users.find((usr) => usr.id === mapping.userId);
      if (u) {
        mapping.contractorName = u.name;
        u.contractorSyncStatus = 'SYNCED';
        u.lastSyncedAt = mapping.lastSyncedAt;
      }
    }

    saveDatabase(dbCache);
    return mapping;
  },

  deleteContractorMapping(orgId: string, mappingId: string): boolean {
    const beforeCount = (dbCache.contractorMappings || []).length;
    dbCache.contractorMappings = (dbCache.contractorMappings || []).filter(
      (m) => !(m.id === mappingId && m.orgId === orgId)
    );
    if (dbCache.contractorMappings.length !== beforeCount) {
      saveDatabase(dbCache);
      return true;
    }
    return false;
  },

  addOrganizationMember(
    orgId: string,
    payload: {
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
    }
  ): User {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanContractorEmail = payload.contractorEmail?.trim().toLowerCase();

    // Check duplicate email across actual and contractor email fields
    const duplicate = dbCache.users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (cleanContractorEmail && u.email.toLowerCase() === cleanContractorEmail) ||
        (cleanContractorEmail && u.contractorEmail?.toLowerCase() === cleanContractorEmail) ||
        (u.contractorEmail && u.contractorEmail.toLowerCase() === cleanEmail)
    );
    if (duplicate) {
      throw new Error('A user with this email or contractor email address already exists');
    }

    const org = dbCache.organizations.find((o) => o.id === orgId);
    if (!org) throw new Error('Organization not found');

    const allowedRoles: UserRole[] = ['ORG_ADMIN', 'INCIDENT_MANAGER', 'ENGINEER', 'VIEWER'];
    if (!allowedRoles.includes(payload.role)) {
      throw new Error(`Invalid role for organization member: ${payload.role}`);
    }

    const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const isContractor = payload.isContractor ?? !!(payload.contractorEmail || payload.contractorId || payload.vendorCompany);

    const newUser: UserRecord = {
      id: userId,
      name: payload.name.trim(),
      email: cleanEmail,
      contractorEmail: payload.contractorEmail?.trim() || undefined,
      contractorId: payload.contractorId?.trim() || undefined,
      isContractor,
      vendorCompany: payload.vendorCompany?.trim() || undefined,
      passwordHash: hashPassword(payload.password),
      role: payload.role,
      orgId: org.id,
      orgName: org.name,
      title:
        payload.title?.trim() ||
        (isContractor
          ? `Outsourced Contractor ${payload.vendorCompany ? `(${payload.vendorCompany})` : ''}`
          : 'Team Member'),
      avatarUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
      teams: payload.teams || [],
      isProductOwner: false,
      isProductAdmin: false,
      createdAt: new Date().toISOString(),
    };

    dbCache.users.push(newUser);

    if (payload.teams && payload.teams.length > 0) {
      dbCache.teams.forEach((t) => {
        if (t.orgId === orgId && payload.teams!.includes(t.name) && !t.memberUserIds.includes(userId)) {
          t.memberUserIds.push(userId);
        }
      });
    }

    saveDatabase(dbCache);
    return sanitizeUser(newUser);
  },

  updateMember(
    orgId: string,
    userId: string,
    updates: {
      role?: UserRole;
      contractorEmail?: string;
      contractorId?: string;
      isContractor?: boolean;
      vendorCompany?: string;
      title?: string;
      teams?: string[];
      name?: string;
    }
  ): User {
    const user = dbCache.users.find((u) => u.id === userId && u.orgId === orgId);
    if (!user) throw new Error('User not found in organization');

    if (updates.role) {
      if (user.isProductOwner && updates.role !== 'PRODUCT_OWNER') {
        throw new Error('Cannot change the role of the Product Owner');
      }
      const allowedRoles: UserRole[] = ['ORG_ADMIN', 'INCIDENT_MANAGER', 'ENGINEER', 'VIEWER'];
      if (!allowedRoles.includes(updates.role)) {
        throw new Error(`Invalid role: ${updates.role}`);
      }
      user.role = updates.role;
    }

    if (updates.contractorEmail !== undefined) {
      const cleanContractorEmail = updates.contractorEmail.trim().toLowerCase();
      if (cleanContractorEmail) {
        const conflict = dbCache.users.find(
          (u) =>
            u.id !== userId &&
            (u.email.toLowerCase() === cleanContractorEmail ||
              u.contractorEmail?.toLowerCase() === cleanContractorEmail)
        );
        if (conflict) {
          throw new Error('Contractor email is already in use by another user');
        }
        user.contractorEmail = cleanContractorEmail;
      } else {
        user.contractorEmail = undefined;
      }
    }

    if (updates.contractorId !== undefined) {
      user.contractorId = updates.contractorId.trim() || undefined;
    }

    if (updates.isContractor !== undefined) {
      user.isContractor = updates.isContractor;
    }

    if (updates.vendorCompany !== undefined) {
      user.vendorCompany = updates.vendorCompany.trim() || undefined;
    }

    if (updates.title !== undefined) {
      user.title = updates.title.trim();
    }

    if (updates.name !== undefined) {
      user.name = updates.name.trim();
    }

    if (updates.teams) {
      user.teams = updates.teams;
      dbCache.teams.forEach((t) => {
        if (t.orgId === orgId) {
          if (updates.teams!.includes(t.name)) {
            if (!t.memberUserIds.includes(userId)) t.memberUserIds.push(userId);
          } else {
            t.memberUserIds = t.memberUserIds.filter((id) => id !== userId);
          }
        }
      });
    }

    saveDatabase(dbCache);
    return sanitizeUser(user);
  },

  updateMemberRole(orgId: string, userId: string, newRole: UserRole): User {
    return this.updateMember(orgId, userId, { role: newRole });
  },

  removeMember(orgId: string, userId: string, callerId: string): boolean {
    const user = dbCache.users.find((u) => u.id === userId && u.orgId === orgId);
    if (!user) throw new Error('User not found in organization');
    if (user.isProductOwner) {
      throw new Error('Cannot remove the Product Owner');
    }
    if (user.id === callerId) {
      throw new Error('Cannot remove yourself from the organization');
    }
    dbCache.users = dbCache.users.filter((u) => u.id !== userId);
    dbCache.sessions = dbCache.sessions.filter((s) => s.userId !== userId);
    dbCache.teams.forEach((t) => {
      t.memberUserIds = t.memberUserIds.filter((id) => id !== userId);
      if (t.leadUserId === userId) t.leadUserId = undefined;
    });
    saveDatabase(dbCache);
    return true;
  },

  getOrganizationTeams(orgId: string): Team[] {
    return dbCache.teams.filter((t) => t.orgId === orgId);
  },

  createTeam(
    orgId: string,
    payload: {
      name: string;
      description?: string;
      leadUserId?: string;
      memberUserIds?: string[];
    }
  ): Team {
    const teamId = `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newTeam: Team = {
      id: teamId,
      orgId,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      leadUserId: payload.leadUserId,
      memberUserIds: payload.memberUserIds || [],
      createdAt: new Date().toISOString(),
    };
    dbCache.teams.push(newTeam);
    (payload.memberUserIds || []).forEach((uid) => {
      const u = dbCache.users.find((user) => user.id === uid);
      if (u && !u.teams?.includes(newTeam.name)) {
        u.teams = [...(u.teams || []), newTeam.name];
      }
    });
    saveDatabase(dbCache);
    return newTeam;
  },

  updateTeam(orgId: string, teamId: string, updates: Partial<Team>): Team {
    const team = dbCache.teams.find((t) => t.id === teamId && t.orgId === orgId);
    if (!team) throw new Error('Team not found');
    if (updates.name) team.name = updates.name.trim();
    if (updates.description !== undefined) team.description = updates.description.trim();
    if (updates.leadUserId !== undefined) team.leadUserId = updates.leadUserId;
    if (updates.memberUserIds !== undefined) team.memberUserIds = updates.memberUserIds;
    saveDatabase(dbCache);
    return team;
  },

  deleteTeam(orgId: string, teamId: string): boolean {
    const team = dbCache.teams.find((t) => t.id === teamId && t.orgId === orgId);
    if (!team) throw new Error('Team not found');
    const teamName = team.name;
    dbCache.teams = dbCache.teams.filter((t) => t.id !== teamId);
    dbCache.users.forEach((u) => {
      if (u.teams?.includes(teamName)) {
        u.teams = u.teams.filter((t) => t !== teamName);
      }
    });
    saveDatabase(dbCache);
    return true;
  },

  // PRODUCT OWNER OPERATIONS
  getAllUsersAcrossOrgs(): User[] {
    return dbCache.users.map(sanitizeUser);
  },

  assignProductAdmin(userId: string): User {
    const user = dbCache.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.isProductAdmin = true;
    if (user.role !== 'PRODUCT_OWNER') {
      user.role = 'PRODUCT_ADMIN';
    }
    saveDatabase(dbCache);
    return sanitizeUser(user);
  },

  revokeProductAdmin(userId: string): User {
    const user = dbCache.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (user.isProductOwner) {
      throw new Error('Cannot revoke Product Admin privileges from the Product Owner');
    }
    user.isProductAdmin = false;
    const org = dbCache.organizations.find((o) => o.id === user.orgId);
    if (org && org.ownerUserId === user.id) {
      user.role = 'ORG_ADMIN';
    } else {
      user.role = 'ENGINEER';
    }
    saveDatabase(dbCache);
    return sanitizeUser(user);
  },

  // SERVICE OPERATIONS
  getServices(orgId?: string, allowGlobal = false): Service[] {
    if (!orgId && !allowGlobal) return [];
    let result = [...dbCache.services];
    if (orgId) {
      result = result.filter((s) => s.orgId === orgId);
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  },

  getServiceById(id: string, orgId?: string): Service | undefined {
    return dbCache.services.find((s) => s.id === id && (!orgId || s.orgId === orgId));
  },

  createService(payload: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>, user?: User): Service {
    const orgId = user?.orgId || payload.orgId || 'org-default';
    const newService: Service = {
      ...payload,
      orgId,
      id: `srv-${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbCache.services.push(newService);
    saveDatabase(dbCache);
    return newService;
  },

  updateService(id: string, updates: Partial<Omit<Service, 'id' | 'createdAt'>>, orgId?: string): Service {
    const index = dbCache.services.findIndex((s) => s.id === id && (!orgId || s.orgId === orgId));
    if (index === -1) {
      throw new Error(`Service with id ${id} not found`);
    }
    const updated: Service = {
      ...dbCache.services[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    dbCache.services[index] = updated;

    // Also update cached serviceName in incidents if service name changed
    if (updates.name) {
      dbCache.incidents.forEach((inc) => {
        if (inc.serviceId === id) {
          inc.serviceName = updates.name!;
        }
      });
    }

    saveDatabase(dbCache);
    return updated;
  },

  deleteService(id: string, orgId?: string): boolean {
    const initialLen = dbCache.services.length;
    dbCache.services = dbCache.services.filter((s) => s.id !== id && (!orgId || s.orgId !== orgId));
    if (dbCache.services.length !== initialLen) {
      saveDatabase(dbCache);
      return true;
    }
    return false;
  },

  // INCIDENT OPERATIONS
  getIncidents(
    orgId?: string,
    filters?: {
      severity?: Severity;
      status?: IncidentStatus;
      serviceId?: string;
      search?: string;
      allowGlobal?: boolean;
    }
  ): Incident[] {
    // JIRA multi-tenancy rule: Incidents are strictly tenant-scoped unless explicitly authorized global
    if (!orgId && !filters?.allowGlobal) {
      return [];
    }

    let result = [...dbCache.incidents];

    if (orgId) {
      result = result.filter((i) => i.orgId === orgId);
    }

    if (filters?.severity) {
      result = result.filter((i) => i.severity === filters.severity);
    }
    if (filters?.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.serviceId) {
      result = result.filter((i) => i.serviceId === filters.serviceId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.incidentNumber.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.serviceName.toLowerCase().includes(q) ||
          (i.assignedEngineer && i.assignedEngineer.toLowerCase().includes(q))
      );
    }

    // Sort by createdTimestamp descending
    return result.sort(
      (a, b) => new Date(b.createdTimestamp).getTime() - new Date(a.createdTimestamp).getTime()
    );
  },

  getIncidentById(id: string, orgId?: string, allowGlobal = false): Incident | undefined {
    return dbCache.incidents.find(
      (i) =>
        (i.id === id || i.incidentNumber.toLowerCase() === id.toLowerCase()) &&
        (allowGlobal || !orgId || i.orgId === orgId)
    );
  },

  createIncident(
    payload: {
      title: string;
      description: string;
      severity: Severity;
      status?: IncidentStatus;
      serviceId: string;
      environment: 'Production' | 'Staging' | 'Canary';
      customerImpact: boolean;
      impactSummary: string;
      assignedEngineer?: string;
      incidentManager?: string;
      detectedTime?: string;
    },
    user: User
  ): Incident {
    const service = db.getServiceById(payload.serviceId, user.orgId) || db.getServiceById(payload.serviceId);
    if (!service) {
      throw new Error(`Service not found with ID ${payload.serviceId}`);
    }

    const org = dbCache.organizations.find((o) => o.id === user.orgId);
    const prefix = org?.ticketPrefix || generateTicketPrefix(org?.name || user.orgName || 'INC');

    // JIRA-style sequential ticket key per organization (e.g. BSOL-001, BSOL-002)
    const orgTickets = dbCache.incidents.filter((i) => i.orgId === user.orgId);
    const nextTicketNum = orgTickets.length + 1;
    const incidentNumber = `${prefix}-${String(nextTicketNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newIncident: Incident = {
      id: `inc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      orgId: user.orgId,
      orgName: user.orgName,
      incidentNumber,
      title: payload.title,
      description: payload.description,
      severity: payload.severity,
      status: payload.status || 'DETECTED',
      serviceId: service.id,
      serviceName: service.name,
      environment: payload.environment || 'Production',
      reportedBy: user.name,
      assignedEngineer: payload.assignedEngineer,
      incidentManager: payload.incidentManager,
      detectedTime: payload.detectedTime || now,
      startedTime: payload.detectedTime || now,
      acknowledgedTime: payload.assignedEngineer ? now : undefined,
      customerImpact: payload.customerImpact,
      impactSummary: payload.impactSummary,
      createdTimestamp: now,
      updatedTimestamp: now,
    };

    dbCache.incidents.unshift(newIncident);

    // If service was healthy and severity is SEV-1/SEV-2, degrade service health
    if (['SEV-1', 'SEV-2'].includes(payload.severity)) {
      db.updateService(service.id, {
        healthStatus: 'DEGRADED',
      }, user.orgId);
    }

    // Add initial creation timeline event
    db.addTimelineEvent({
      incidentId: newIncident.id,
      eventType: 'CREATED',
      title: 'Incident Created',
      description: `${user.name} reported ${incidentNumber} with severity ${payload.severity} on ${service.name}.`,
      actorName: user.name,
      actorRole: user.role,
    });

    if (payload.assignedEngineer || payload.incidentManager) {
      db.addTimelineEvent({
        incidentId: newIncident.id,
        eventType: 'ASSIGNMENT',
        title: 'Initial Assignment Set',
        description: `Assigned Engineer: ${payload.assignedEngineer || 'Unassigned'}, Incident Manager: ${payload.incidentManager || 'Unassigned'}`,
        actorName: user.name,
        actorRole: user.role,
        metadata: {
          assignedEngineer: payload.assignedEngineer,
          incidentManager: payload.incidentManager,
        },
      });
    }

    saveDatabase(dbCache);
    return newIncident;
  },

  updateIncident(
    id: string,
    updates: Partial<Incident>,
    user: User,
    changeNote?: string
  ): Incident {
    const index = dbCache.incidents.findIndex(
      (i) => i.id === id || i.incidentNumber.toLowerCase() === id.toLowerCase()
    );
    if (index === -1) {
      throw new Error(`Incident with id ${id} not found`);
    }

    const current = dbCache.incidents[index];
    const now = new Date().toISOString();

    // Check status change
    if (updates.status && updates.status !== current.status) {
      const validStatuses: IncidentStatus[] = [
        'DETECTED',
        'TRIAGED',
        'INVESTIGATING',
        'MITIGATING',
        'RESOLVED',
        'CLOSED',
      ];
      if (!validStatuses.includes(updates.status)) {
        throw new Error(`Invalid incident status: ${updates.status}`);
      }

      const oldStatus = current.status;
      const newStatus = updates.status;

      let resolvedTime = current.resolvedTime;
      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
        resolvedTime = resolvedTime || now;
      } else {
        // Re-opened from resolved or closed
        resolvedTime = undefined;
      }
      updates.resolvedTime = resolvedTime;

      // If progressing past DETECTED and not acknowledged yet, mark acknowledged
      if (!current.acknowledgedTime && newStatus !== 'DETECTED') {
        updates.acknowledgedTime = now;
      }

      db.addTimelineEvent({
        incidentId: current.id,
        eventType: newStatus === 'RESOLVED' ? 'RESOLUTION' : 'STATUS_CHANGE',
        title: `Status Changed: ${oldStatus} → ${newStatus}`,
        description: changeNote
          ? `${user.name} transitioned status to ${newStatus}. Note: "${changeNote}"`
          : `${user.name} transitioned status from ${oldStatus} to ${newStatus}.`,
        actorName: user.name,
        actorRole: user.role,
        metadata: { oldStatus, newStatus, changeNote },
      });
    }

    // Check severity change
    if (updates.severity && updates.severity !== current.severity) {
      const oldSev = current.severity;
      const newSev = updates.severity;

      db.addTimelineEvent({
        incidentId: current.id,
        eventType: 'SEVERITY_CHANGE',
        title: `Severity Adjusted: ${oldSev} → ${newSev}`,
        description: changeNote
          ? `${user.name} adjusted severity from ${oldSev} to ${newSev}. Reason: "${changeNote}"`
          : `${user.name} adjusted severity from ${oldSev} to ${newSev}.`,
        actorName: user.name,
        actorRole: user.role,
        metadata: { oldSeverity: oldSev, newSeverity: newSev, changeNote },
      });
    }

    // Check assignment change
    if (
      (updates.assignedEngineer && updates.assignedEngineer !== current.assignedEngineer) ||
      (updates.incidentManager && updates.incidentManager !== current.incidentManager)
    ) {
      db.addTimelineEvent({
        incidentId: current.id,
        eventType: 'ASSIGNMENT',
        title: 'Incident Roles Updated',
        description: `${user.name} updated assignments. Assigned Engineer: ${updates.assignedEngineer || current.assignedEngineer || 'None'}, Commander: ${updates.incidentManager || current.incidentManager || 'None'}.`,
        actorName: user.name,
        actorRole: user.role,
        metadata: {
          assignedEngineer: updates.assignedEngineer,
          incidentManager: updates.incidentManager,
        },
      });

      if (!current.acknowledgedTime && updates.assignedEngineer) {
        updates.acknowledgedTime = now;
      }
    }

    // Service change check
    if (updates.serviceId && updates.serviceId !== current.serviceId) {
      const srv = db.getServiceById(updates.serviceId);
      if (srv) {
        updates.serviceName = srv.name;
      }
    }

    const updatedIncident: Incident = {
      ...current,
      ...updates,
      updatedTimestamp: now,
    };

    dbCache.incidents[index] = updatedIncident;
    saveDatabase(dbCache);
    return updatedIncident;
  },

  deleteIncident(id: string): boolean {
    const index = dbCache.incidents.findIndex((i) => i.id === id);
    if (index === -1) return false;

    dbCache.incidents.splice(index, 1);
    dbCache.evidence = dbCache.evidence.filter((e) => e.incidentId !== id);
    dbCache.timelineEvents = dbCache.timelineEvents.filter((t) => t.incidentId !== id);
    saveDatabase(dbCache);
    return true;
  },

  // EVIDENCE OPERATIONS
  getEvidenceForIncident(incidentId: string): Evidence[] {
    const target = db.getIncidentById(incidentId);
    const targetId = target ? target.id : incidentId;
    return dbCache.evidence
      .filter((e) => e.incidentId === targetId)
      .sort((a, b) => new Date(b.createdTimestamp).getTime() - new Date(a.createdTimestamp).getTime());
  },

  addEvidence(
    payload: {
      incidentId: string;
      type: Evidence['type'];
      title: string;
      source: string;
      content: string;
      timestamp?: string;
    },
    user: User
  ): Evidence {
    const incident = db.getIncidentById(payload.incidentId);
    if (!incident) {
      throw new Error(`Incident with id ${payload.incidentId} not found`);
    }

    const now = new Date().toISOString();
    const newEvidence: Evidence = {
      id: `ev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      incidentId: incident.id,
      type: payload.type,
      title: payload.title,
      source: payload.source,
      content: payload.content,
      timestamp: payload.timestamp || now,
      createdBy: user.name,
      createdTimestamp: now,
    };

    dbCache.evidence.unshift(newEvidence);

    // Automatically record timeline event for added evidence
    db.addTimelineEvent({
      incidentId: incident.id,
      eventType: payload.type === 'COMMENT' ? 'COMMENT' : 'EVIDENCE_ADDED',
      title: payload.type === 'COMMENT' ? `Comment from ${user.name}` : `Evidence Attached: ${payload.title}`,
      description: payload.type === 'COMMENT'
        ? payload.content
        : `${user.name} attached ${payload.type} evidence from source "${payload.source}".`,
      actorName: user.name,
      actorRole: user.role,
      metadata: { evidenceType: payload.type, evidenceId: newEvidence.id, source: payload.source },
    });

    saveDatabase(dbCache);
    return newEvidence;
  },

  deleteEvidence(id: string): boolean {
    const initialLen = dbCache.evidence.length;
    dbCache.evidence = dbCache.evidence.filter((e) => e.id !== id);
    if (dbCache.evidence.length !== initialLen) {
      saveDatabase(dbCache);
      return true;
    }
    return false;
  },

  // TIMELINE OPERATIONS
  getTimelineForIncident(incidentId: string): TimelineEvent[] {
    const target = db.getIncidentById(incidentId);
    const targetId = target ? target.id : incidentId;
    return dbCache.timelineEvents
      .filter((t) => t.incidentId === targetId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  addTimelineEvent(payload: {
    incidentId: string;
    eventType: TimelineEvent['eventType'];
    title: string;
    description: string;
    actorName: string;
    actorRole: UserRole;
    metadata?: Record<string, unknown>;
  }): TimelineEvent {
    const newEvent: TimelineEvent = {
      id: `tl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      incidentId: payload.incidentId,
      eventType: payload.eventType,
      title: payload.title,
      description: payload.description,
      actorName: payload.actorName,
      actorRole: payload.actorRole,
      metadata: payload.metadata,
      timestamp: new Date().toISOString(),
    };
    dbCache.timelineEvents.push(newEvent);
    saveDatabase(dbCache);
    return newEvent;
  },

  // DASHBOARD STATS
  getDashboardStats(orgId?: string, allowGlobal = false): DashboardStats {
    const incidents = orgId
      ? dbCache.incidents.filter((i) => i.orgId === orgId)
      : allowGlobal
      ? dbCache.incidents
      : [];
    const services = orgId
      ? dbCache.services.filter((s) => s.orgId === orgId)
      : allowGlobal
      ? dbCache.services
      : [];

    const openStatuses: IncidentStatus[] = ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'];
    const openIncidents = incidents.filter((i) => openStatuses.includes(i.status));

    const criticalIncidents = openIncidents.filter((i) => i.severity === 'SEV-1' || i.severity === 'SEV-2');
    const sev1Count = openIncidents.filter((i) => i.severity === 'SEV-1').length;
    const sev2Count = openIncidents.filter((i) => i.severity === 'SEV-2').length;
    const sev3Count = openIncidents.filter((i) => i.severity === 'SEV-3').length;
    const sev4Count = openIncidents.filter((i) => i.severity === 'SEV-4').length;

    // Calculate average resolution time for resolved/closed incidents
    const resolvedList = incidents.filter(
      (i) => (i.status === 'RESOLVED' || i.status === 'CLOSED') && i.resolvedTime && (i.startedTime || i.detectedTime)
    );
    let avgResolutionMinutes = 0;
    if (resolvedList.length > 0) {
      const totalMinutes = resolvedList.reduce((acc, inc) => {
        const start = new Date(inc.startedTime || inc.detectedTime).getTime();
        const end = new Date(inc.resolvedTime!).getTime();
        const diffMin = Math.max(1, Math.round((end - start) / (1000 * 60)));
        return acc + diffMin;
      }, 0);
      avgResolutionMinutes = Math.round(totalMinutes / resolvedList.length);
    }

    // Calculate real MTTA (Mean Time to Acknowledge) from acknowledged incidents
    const acknowledgedList = incidents.filter(
      (i) => i.acknowledgedTime && (i.detectedTime || i.startedTime)
    );
    let avgAcknowledgeMinutes = 0;
    if (acknowledgedList.length > 0) {
      const totalAckMin = acknowledgedList.reduce((acc, inc) => {
        const detected = new Date(inc.detectedTime || inc.startedTime).getTime();
        const ack = new Date(inc.acknowledgedTime!).getTime();
        const diffMin = Math.max(0.2, (ack - detected) / (1000 * 60));
        return acc + diffMin;
      }, 0);
      avgAcknowledgeMinutes = Math.round((totalAckMin / acknowledgedList.length) * 10) / 10;
    }

    // Active AI investigations & hypotheses count from DB
    const allInvestigations = dbCache.investigations || [];
    const activeInvestigationsList = allInvestigations.filter((inv) => {
      const inc = incidents.find((i) => i.id === inv.incidentId);
      return inc && openStatuses.includes(inc.status);
    });
    const activeInvestigations = activeInvestigationsList.length || incidents.filter((i) => i.status === 'INVESTIGATING').length;
    const activeHypothesesCount = activeInvestigationsList.reduce(
      (acc, inv) => acc + (inv.hypotheses?.length || 0),
      0
    );

    // Calculate real incident trend from recorded incident timeline timestamps
    const trendMap: Record<string, { date: string; label: string; count: number; sev1Sev2: number; resolved: number }> = {};
    incidents.forEach((inc) => {
      const d = new Date(inc.detectedTime || inc.startedTime || inc.createdTimestamp);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { date: dateKey, label, count: 0, sev1Sev2: 0, resolved: 0 };
      }
      trendMap[dateKey].count += 1;
      if (inc.severity === 'SEV-1' || inc.severity === 'SEV-2') {
        trendMap[dateKey].sev1Sev2 += 1;
      }
      if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') {
        trendMap[dateKey].resolved += 1;
      }
    });

    const incidentTrend = Object.keys(trendMap)
      .sort()
      .map((k) => trendMap[k]);

    const servicesHealth = {
      total: services.length,
      healthy: services.filter((s) => s.healthStatus === 'HEALTHY').length,
      degraded: services.filter((s) => s.healthStatus === 'DEGRADED').length,
      outage: services.filter((s) => s.healthStatus === 'OUTAGE').length,
      maintenance: services.filter((s) => s.healthStatus === 'MAINTENANCE').length,
    };

    const severityOrder: Severity[] = ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'];
    const severityDistribution = severityOrder.map((sev) => ({
      severity: sev,
      count: incidents.filter((i) => i.severity === sev).length,
    }));

    const statusOrder: IncidentStatus[] = ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED', 'CLOSED'];
    const statusDistribution = statusOrder.map((st) => ({
      status: st,
      count: incidents.filter((i) => i.status === st).length,
    }));

    return {
      openIncidentsCount: openIncidents.length,
      criticalIncidentsCount: criticalIncidents.length,
      sev1Count,
      sev2Count,
      sev3Count,
      sev4Count,
      avgResolutionTimeMinutes: avgResolutionMinutes,
      avgAcknowledgeTimeMinutes: avgAcknowledgeMinutes,
      activeInvestigationsCount: activeInvestigations,
      activeHypothesesCount,
      servicesHealth,
      severityDistribution,
      statusDistribution,
      incidentTrend,
    };
  },

  // INVESTIGATIONS & HYPOTHESES
  getInvestigation(incidentId: string): Investigation | null {
    if (!dbCache.investigations) {
      dbCache.investigations = getInitialSeedInvestigations();
    }
    const inv = dbCache.investigations.find((i) => i.incidentId === incidentId);
    return inv || null;
  },

  saveInvestigation(investigation: Investigation): Investigation {
    if (!dbCache.investigations) {
      dbCache.investigations = [];
    }
    const idx = dbCache.investigations.findIndex((i) => i.incidentId === investigation.incidentId);
    if (idx >= 0) {
      dbCache.investigations[idx] = investigation;
    } else {
      dbCache.investigations.push(investigation);
    }
    saveDatabase(dbCache);
    return investigation;
  },

  updateHypothesisStatus(
    incidentId: string,
    hypothesisId: string,
    status: HypothesisStatus,
    user: User,
    notes?: { statement?: string; reason?: string }
  ): { hypothesis: Hypothesis; incident: Incident; investigation: Investigation } {
    const inv = this.getInvestigation(incidentId);
    if (!inv) {
      throw new Error(`No investigation found for incident ${incidentId}`);
    }

    const hyp = inv.hypotheses.find((h) => h.id === hypothesisId);
    if (!hyp) {
      throw new Error(`Hypothesis ${hypothesisId} not found in investigation`);
    }

    const now = new Date().toISOString();
    hyp.status = status;

    const incident = dbCache.incidents.find((i) => i.id === incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    if (status === 'CONFIRMED') {
      hyp.confirmedBy = user.name;
      hyp.confirmedTimestamp = now;
      hyp.confirmedRootCauseStatement =
        notes?.statement || `${hyp.title}: ${hyp.description}`;

      // Mark other hypotheses back to PROPOSED if previously confirmed
      inv.hypotheses.forEach((other) => {
        if (other.id !== hypothesisId && other.status === 'CONFIRMED') {
          other.status = 'PROPOSED';
        }
      });

      inv.confirmedRootCause = {
        hypothesisId: hyp.id,
        title: hyp.title,
        statement: hyp.confirmedRootCauseStatement,
        confirmedBy: user.name,
        confirmedTimestamp: now,
      };

      incident.confirmedRootCause = inv.confirmedRootCause;

      this.addTimelineEvent({
        incidentId,
        eventType: 'RESOLUTION',
        title: `Root Cause Confirmed: ${hyp.title}`,
        description: `Human-confirmed by ${user.name} (${user.role}): "${hyp.confirmedRootCauseStatement}"`,
        actorName: user.name,
        actorRole: user.role,
        metadata: {
          hypothesisId: hyp.id,
          confidence: hyp.confidence,
          statement: hyp.confirmedRootCauseStatement,
        },
      });
    } else if (status === 'REJECTED') {
      hyp.rejectedBy = user.name;
      hyp.rejectedTimestamp = now;
      hyp.rejectedReason = notes?.reason || 'Rejected following engineer review.';

      if (inv.confirmedRootCause?.hypothesisId === hypothesisId) {
        delete inv.confirmedRootCause;
        delete incident.confirmedRootCause;
      }

      this.addTimelineEvent({
        incidentId,
        eventType: 'INVESTIGATION',
        title: `Hypothesis Rejected: ${hyp.title}`,
        description: `Rejected by ${user.name} (${user.role}). Reason: ${hyp.rejectedReason}`,
        actorName: user.name,
        actorRole: user.role,
        metadata: {
          hypothesisId: hyp.id,
          reason: hyp.rejectedReason,
        },
      });
    } else if (status === 'UNDER_REVIEW') {
      if (inv.confirmedRootCause?.hypothesisId === hypothesisId) {
        delete inv.confirmedRootCause;
        delete incident.confirmedRootCause;
      }
    }

    this.saveInvestigation(inv);
    saveDatabase(dbCache);

    return { hypothesis: hyp, incident, investigation: inv };
  },

  addInvestigationChatMessage(
    incidentId: string,
    message: { role: 'user' | 'assistant'; content: string; groundedEvidence?: string[] }
  ): Investigation {
    const inv = this.getInvestigation(incidentId);
    if (!inv) {
      throw new Error(`No investigation found for incident ${incidentId}`);
    }
    if (!inv.chatHistory) {
      inv.chatHistory = [];
    }
    inv.chatHistory.push({
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
      groundedEvidence: message.groundedEvidence,
    });
    this.saveInvestigation(inv);
    return inv;
  },

  // RESET DATA
  resetDemoData(): void {
    dbCache = {
      organizations: dbCache.organizations,
      teams: dbCache.teams,
      users: dbCache.users,
      sessions: dbCache.sessions,
      services: [],
      incidents: [],
      evidence: [],
      timelineEvents: [],
      investigations: [],
    };
    saveDatabase(dbCache);
  },
};
