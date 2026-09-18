import fs from 'fs';
import path from 'path';
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
} from '../src/types';

interface DatabaseSchema {
  users: User[];
  services: Service[];
  incidents: Incident[];
  evidence: Evidence[];
  timelineEvents: TimelineEvent[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'resolveiq_db.json');

// Initial seed data
const SEED_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Alex Turner',
    email: 'alex.turner@resolveiq.internal',
    role: 'ADMIN',
    title: 'Lead Platform Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-ic-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@resolveiq.internal',
    role: 'INCIDENT_MANAGER',
    title: 'Principal Incident Commander',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-eng-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@resolveiq.internal',
    role: 'ENGINEER',
    title: 'Senior SRE / Distributed Systems',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-view-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@resolveiq.internal',
    role: 'VIEWER',
    title: 'Operations Analyst / Stakeholder',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

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
      users: SEED_USERS,
      services: SEED_SERVICES,
      incidents: SEED_INCIDENTS,
      evidence: SEED_EVIDENCE,
      timelineEvents: SEED_TIMELINE_EVENTS,
    };
    saveDatabase(initialDb);
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    // ensure all arrays exist
    return {
      users: parsed.users || SEED_USERS,
      services: parsed.services || SEED_SERVICES,
      incidents: parsed.incidents || SEED_INCIDENTS,
      evidence: parsed.evidence || SEED_EVIDENCE,
      timelineEvents: parsed.timelineEvents || SEED_TIMELINE_EVENTS,
    };
  } catch (err) {
    console.error('Failed to read database file, re-initializing with seed data:', err);
    const fallbackDb: DatabaseSchema = {
      users: SEED_USERS,
      services: SEED_SERVICES,
      incidents: SEED_INCIDENTS,
      evidence: SEED_EVIDENCE,
      timelineEvents: SEED_TIMELINE_EVENTS,
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
  // USER OPERATIONS
  getUsers(): User[] {
    return dbCache.users;
  },

  getUserById(id: string): User | undefined {
    return dbCache.users.find((u) => u.id === id);
  },

  // SERVICE OPERATIONS
  getServices(): Service[] {
    return [...dbCache.services].sort((a, b) => a.name.localeCompare(b.name));
  },

  getServiceById(id: string): Service | undefined {
    return dbCache.services.find((s) => s.id === id);
  },

  createService(payload: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Service {
    const newService: Service = {
      ...payload,
      id: `srv-${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbCache.services.push(newService);
    saveDatabase(dbCache);
    return newService;
  },

  updateService(id: string, updates: Partial<Omit<Service, 'id' | 'createdAt'>>): Service {
    const index = dbCache.services.findIndex((s) => s.id === id);
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

  deleteService(id: string): boolean {
    const initialLen = dbCache.services.length;
    dbCache.services = dbCache.services.filter((s) => s.id !== id);
    if (dbCache.services.length !== initialLen) {
      saveDatabase(dbCache);
      return true;
    }
    return false;
  },

  // INCIDENT OPERATIONS
  getIncidents(filters?: {
    severity?: Severity;
    status?: IncidentStatus;
    serviceId?: string;
    search?: string;
  }): Incident[] {
    let result = [...dbCache.incidents];

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
          i.serviceName.toLowerCase().includes(q)
      );
    }

    // Sort by createdTimestamp descending
    return result.sort(
      (a, b) => new Date(b.createdTimestamp).getTime() - new Date(a.createdTimestamp).getTime()
    );
  },

  getIncidentById(id: string): Incident | undefined {
    return dbCache.incidents.find(
      (i) => i.id === id || i.incidentNumber.toLowerCase() === id.toLowerCase()
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
    const service = db.getServiceById(payload.serviceId);
    if (!service) {
      throw new Error(`Service not found with ID ${payload.serviceId}`);
    }

    // Generate next sequential incident number
    const count = dbCache.incidents.length + 125;
    const incidentNumber = `INC-2026-${String(count).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newIncident: Incident = {
      id: `inc-${Date.now().toString(36)}`,
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
        healthStatus: payload.severity === 'SEV-1' ? 'DEGRADED' : 'DEGRADED',
      });
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
      const oldStatus = current.status;
      const newStatus = updates.status;

      let resolvedTime = current.resolvedTime;
      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
        resolvedTime = now;
      }

      updates.resolvedTime = resolvedTime;

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
  getDashboardStats(): DashboardStats {
    const incidents = dbCache.incidents;
    const services = dbCache.services;

    const openStatuses: IncidentStatus[] = ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'];
    const openIncidents = incidents.filter((i) => openStatuses.includes(i.status));

    const criticalIncidents = openIncidents.filter((i) => i.severity === 'SEV-1' || i.severity === 'SEV-2');
    const sev1Count = openIncidents.filter((i) => i.severity === 'SEV-1').length;
    const sev2Count = openIncidents.filter((i) => i.severity === 'SEV-2').length;
    const sev3Count = openIncidents.filter((i) => i.severity === 'SEV-3').length;
    const sev4Count = openIncidents.filter((i) => i.severity === 'SEV-4').length;

    const activeInvestigations = incidents.filter((i) => i.status === 'INVESTIGATING').length;

    // Calculate average resolution time for resolved/closed incidents
    const resolvedList = incidents.filter((i) => (i.status === 'RESOLVED' || i.status === 'CLOSED') && i.resolvedTime && i.startedTime);
    let avgResolutionMinutes = 38; // sensible default
    if (resolvedList.length > 0) {
      const totalMinutes = resolvedList.reduce((acc, inc) => {
        const start = new Date(inc.startedTime).getTime();
        const end = new Date(inc.resolvedTime!).getTime();
        const diffMin = Math.max(1, Math.round((end - start) / (1000 * 60)));
        return acc + diffMin;
      }, 0);
      avgResolutionMinutes = Math.round(totalMinutes / resolvedList.length);
    }

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
      activeInvestigationsCount: activeInvestigations,
      servicesHealth,
      severityDistribution,
      statusDistribution,
    };
  },

  // RESET DEMO DATA
  resetDemoData(): void {
    dbCache = {
      users: SEED_USERS,
      services: SEED_SERVICES,
      incidents: SEED_INCIDENTS,
      evidence: SEED_EVIDENCE,
      timelineEvents: SEED_TIMELINE_EVENTS,
    };
    saveDatabase(dbCache);
  },
};
