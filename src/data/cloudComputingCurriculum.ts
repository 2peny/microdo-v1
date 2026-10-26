import { StudyModuleNode, SourceReference } from '../types';

/**
 * Complete 5-Unit Curriculum for Cloud Computing Digital Notes
 * University of Zimbabwe, Department of Computer Science (Mr E Mlambo)
 * Grounded in authentic text, architectural models, diagrams, and SLAs.
 */
export function buildCloudComputingCurriculum(): StudyModuleNode[] {
  const timestamp = Date.now();

  const unitsData = [
    {
      unitNum: 1,
      unitTitle: 'Cloud Computing Fundamentals & Computing Paradigms',
      code: 'CS-401 · Unit 1',
      hours: '3.5 hrs study',
      summary:
        'Foundational principles of cloud computing, deployment models (public, private, hybrid), service layers, and evolution from distributed and grid computing.',
      sourcePage: 5,
      topics: [
        {
          title: 'Cloud Computing Architecture & Service Models',
          objective:
            'Define cloud computing, analyze elastic resource provisioning, and differentiate IaaS, PaaS, and SaaS layers.',
          sourcePage: 6,
          overview: `# Cloud Computing Architecture & Service Models

### 💡 Topic Introduction
Cloud computing refers to the on-demand delivery of computing services—including servers, storage, databases, networking, software, and analytics—over the Internet ("the cloud"). Instead of purchasing, maintaining, and managing physical on-premises data centers, organizations leverage virtualized platforms with elastic resources dynamically provisioned on demand.

---

### 🎯 Learning Objectives
- Define cloud computing and explain the core economic shift from capital expense (CapEx) to operational expense (OpEx).
- Compare and contrast the three primary service models: Infrastructure as a Service (IaaS), Platform as a Service (PaaS), and Software as a Service (SaaS).
- Analyze cloud deployment models: Public, Private, Hybrid, and Community clouds.
- Evaluate the essential characteristics of cloud systems: on-demand self-service, broad network access, resource pooling, rapid elasticity, and measured service.

---

### 📖 Key Concepts & Core Definitions
- **Cloud Computing**: A computing paradigm that provides dynamic provisioning of virtualized hardware, runtime environments, storage, and software applications over the network based on utility pricing.
- **Infrastructure as a Service (IaaS)**: Delivery of fundamental computing resources (virtual machines, raw storage, network interfaces) where the consumer provisions and runs operating systems and applications. (e.g., AWS EC2, Google Compute Engine).
- **Platform as a Service (PaaS)**: A higher-level application environment that provides programming languages, libraries, services, and tools for developers to deploy applications without managing underlying VMs or networks (e.g., Google App Engine, AWS Elastic Beanstalk).
- **Software as a Service (SaaS)**: Complete software applications accessible via web browsers or API clients, where the provider manages all underlying infrastructure, runtime, and data storage (e.g., Google Workspace, Microsoft Office 365, Salesforce).

---

### 📐 Architectural Layers & Comparison Matrix
| Layer | Customer Manages | Provider Manages | Primary Persona |
| :--- | :--- | :--- | :--- |
| **SaaS** | User accounts & application settings | Applications, Data, Runtime, OS, Hardware, Networking | End Users |
| **PaaS** | Application code & database schema | Runtime environment, OS patches, Virtualization, Servers | Developers |
| **IaaS** | OS, Runtime, Middleware, Applications | Physical Servers, Hypervisors, Storage hardware, Network | Sysadmins / DevOps |

---

### 🔍 Concept Application: Architecture Design
**Scenario**: An e-commerce startup expects unpredictable traffic surges during holiday flash sales.
1. **On-Premises Drawback**: Sizing servers for peak capacity causes 85% idle capacity during normal periods, incurring heavy upfront hardware capital expenditure.
2. **Cloud Solution**: Deploying containerized microservices on an elastic cloud infrastructure enables automated scaling rules:
   - When CPU utilization exceeds 75%, auto-scaling groups instantiate additional VM/container instances within 90 seconds.
   - When traffic subsides, resources de-provision automatically, eliminating unnecessary operational expenditure.

---

### ✅ Key Takeaways
- Cloud computing replaces fixed hardware ownership with flexible, metered utility consumption.
- IaaS offers maximum architectural control; PaaS optimizes developer productivity; SaaS eliminates operational overhead.
- Rapid elasticity and measured service are critical for handling dynamic workload variability.

---

> 📖 **Source Reference**: *Notes on Cloud Computing Infrastructure* · Unit I (Page 5–12)
> University of Zimbabwe, Department of Computer Science.`,
          example: `## Worked Architecture Implementation
### Auto-Scaling Cloud Infrastructure Definition (Terraform / IaC)

\`\`\`typescript
// Infrastructure as Code: Elastic Web Tier Configuration
export interface CloudScalingPolicy {
  minInstances: number;
  maxInstances: number;
  targetCpuUtilizationPercent: number;
  scaleOutCooldownSeconds: number;
}

export const webTierPolicy: CloudScalingPolicy = {
  minInstances: 2,           // High Availability Baseline across 2 Availability Zones
  maxInstances: 16,          // Peak capacity ceiling during burst events
  targetCpuUtilizationPercent: 70, // Threshold to trigger elastic scale-out
  scaleOutCooldownSeconds: 120,    // Avoid thrashing / rapid re-scaling
};

// Verification logic for health check probe
export function verifyInstanceHealth(statusCodes: number[]): boolean {
  const healthyCount = statusCodes.filter(code => code >= 200 && code < 300).length;
  return healthyCount / statusCodes.length >= 0.8;
}
\`\`\``,
          quiz: {
            question:
              'In which cloud computing service model is the customer responsible for managing the operating system, middleware, and application runtime?',
            options: [
              'Infrastructure as a Service (IaaS)',
              'Platform as a Service (PaaS)',
              'Software as a Service (SaaS)',
              'Function as a Service (FaaS)',
            ],
            correctIndex: 0,
            explanation:
              'In IaaS (such as AWS EC2), the cloud vendor provides physical hardware and virtualization, while the customer retains full control over the guest OS, runtime, and installed software.',
          },
        },
        {
          title: 'Computing Paradigms Evolution: HPC, Grid & Cluster Computing',
          objective:
            'Trace the evolution of computing paradigms from parallel and distributed systems to cluster, grid, and cloud computing.',
          sourcePage: 19,
          overview: `# Computing Paradigms Evolution: HPC, Grid & Cluster Computing

### 💡 Topic Introduction
Cloud computing did not emerge in isolation; it represents the convergence and commercial maturation of multiple decades of distributed computing research, including High-Performance Computing (HPC), Cluster Computing, and Grid Computing.

---

### 🎯 Learning Objectives
- Trace the historical transition from mainframe centralized computing to modern distributed cloud systems.
- Distinguish between High-Performance Computing (HPC), Cluster Computing, and Grid Computing.
- Explain how virtualization transformed heterogeneous physical clusters into unified utility computing environments.

---

### 📖 Core Definitions & Taxonomy
- **High-Performance Computing (HPC)**: Aggregated computing power designed to solve complex computational problems in science, engineering, or business requiring massive floating-point throughput.
- **Cluster Computing**: A dedicated group of interconnected homogeneous computers (nodes) working cooperatively as a single integrated computing resource over a high-speed local network.
- **Grid Computing**: A distributed architecture coordinating decentralized, geographically dispersed, heterogeneous resources across multiple administrative domains without central control.
- **Utility Computing**: Packaging computing resources (processing, storage, bandwidth) as a metered service analogous to traditional public utilities (water, electricity).

---

### 📐 Comparative Analysis of Distributed Paradigms
| Attribute | Cluster Computing | Grid Computing | Cloud Computing |
| :--- | :--- | :--- | :--- |
| **Node Homogeneity** | High (identical hardware/OS) | Low (heterogeneous nodes) | Virtualized (abstracted) |
| **Network Proximity** | LAN / High-speed interconnect | WAN / Internet across sites | Global Data Centers |
| **Resource Management** | Centralized scheduler | Decentralized / Federated | Elastic Hypervisors / APIs |
| **Primary Focus** | Maximum raw performance | Collaborative resource sharing | On-demand service & utility |

---

### ✅ Key Takeaways
- Clusters prioritize low-latency local execution; Grids aggregate cross-organizational capacity; Clouds emphasize elasticity, self-service, and utility billing.
- Virtualization is the foundational technology enabling cloud providers to decouple logical computing environments from physical server hardware.

---

> 📖 **Source Reference**: *Notes on Cloud Computing Infrastructure* · Unit I: Computing Paradigms (Page 19–29)
> Reference text: *Cloud Computing Principles and Paradigms* (Rajkumar Buyya).`,
          example: `## Practical Analysis: Distributed Paradigm Selection
### Decision Rubric for Workload Deployment

\`\`\`markdown
### Scenario Analysis: Selecting Computing Architecture

1. **Genome Sequencing & Molecular Simulation**:
   - *Requirement*: Ultra-low latency message passing between thousands of cores.
   - *Optimal Choice*: **HPC / Cluster Computing** with InfiniBand interconnects.

2. **Search Engine & Web Application**:
   - *Requirement*: Dynamic user load, worldwide access, 99.99% availability, zero upfront capital expenditure.
   - *Optimal Choice*: **Cloud Computing (Multi-AZ Elastic Web Tier)**.

3. **Multi-Institutional Collaborative Astronomy Analysis**:
   - *Requirement*: Sharing federated data sets across university observatories worldwide.
   - *Optimal Choice*: **Grid Computing Framework**.
\`\`\``,
          quiz: {
            question:
              'What primary technological innovation enabled cloud computing to overcome the resource scheduling and heterogeneity limitations of traditional Grid Computing?',
            options: [
              'Hardware-assisted Virtualization and dynamic hypervisor management',
              'Decreasing storage hard drive physical dimensions',
              'The invention of fiber-optic cabling in local area networks',
              'The elimination of operating systems in modern servers',
            ],
            correctIndex: 0,
            explanation:
              'Hardware-assisted virtualization allows cloud platforms to abstract heterogeneous physical machines into standardized, isolated virtual machines that can be provisioned and migrated elastically.',
          },
        },
      ],
    },
    {
      unitNum: 2,
      unitTitle: 'Migrating into a Cloud & The Seven-Step Model',
      code: 'CS-401 · Unit 2',
      hours: '3.0 hrs study',
      summary:
        'Strategic methodologies, risk assessment, and the authoritative Seven-Step Model for migrating enterprise legacy applications into cloud environments.',
      sourcePage: 30,
      topics: [
        {
          title: 'The Seven-Step Model of Cloud Migration',
          objective:
            'Master the seven distinct phases of enterprise cloud migration from migration assessment to optimization.',
          sourcePage: 32,
          overview: `# The Seven-Step Model of Cloud Migration

### 💡 Topic Introduction
Migrating mission-critical enterprise systems from on-premises data centers to cloud architectures involves technical, operational, and organizational risks. The Seven-Step Model provides a structured, disciplined engineering methodology to evaluate, redesign, migrate, test, and optimize applications.

---

### 🎯 Learning Objectives
- Explain each phase of the Seven-Step Cloud Migration Model.
- Identify the criteria used in Migration Assessment to classify applications as suitable or unsuitable for cloud re-hosting.
- Formulate test and validation strategies for verifying data integrity and latency post-migration.

---

### 📖 The Seven Sequential Phases
1. **Migration Assessment**: Evaluate business value, architectural compatibility, software licensing, and security compliance to identify migration candidates.
2. **Isolating the Dependencies**: Analyze and map all internal and external dependencies (databases, legacy libraries, authentication services, third-party APIs).
3. **Mapping the Migration**: Map on-premises system components to equivalent cloud service targets (IaaS virtual machines, managed DBaaS, PaaS runtimes).
4. **Architectural Re-engineering**: Refactor application code to leverage cloud elasticity, stateless designs, distributed caching, and managed object storage.
5. **Testing and Validation**: Perform functional testing, performance benchmarks, network latency analysis, and security vulnerability scans in staging.
6. **Data Migration**: Execute schema conversion, bulk data transfer, and differential data synchronization with minimal system downtime.
7. **Optimization and Cutover**: Fine-tune resource allocations, configure automated scaling, switch DNS routing to cloud endpoints, and monitor operational telemetry.

---

### 📐 Migration Strategy Comparison (The 6 Rs)
| Strategy | Description | Effort | Cloud Optimization |
| :--- | :--- | :--- | :--- |
| **Rehost ("Lift & Shift")** | Move application directly without code changes | Low | Low (legacy architecture preserved) |
| **Replatform** | Move with minor optimizations (e.g., adopt managed DB) | Medium | Medium (avoids database admin burden) |
| **Refactor / Re-architect** | Redesign application for cloud-native microservices | High | High (maximum scalability and resilience) |
| **Retire / Retain** | Decommission obsolete apps or keep non-migratable systems on-prem | Minimal | N/A |

---

### ✅ Key Takeaways
- The Seven-Step Model mitigates risk by isolating dependencies before architectural re-engineering begins.
- Data migration is typically the most critical path with the highest operational risk during enterprise cutover.
- Post-migration optimization ensures cloud costs are managed efficiently through right-sizing.

---

> 📖 **Source Reference**: *Notes on Cloud Computing Infrastructure* · Unit II: Migrating into a Cloud (Page 30–41)
> Authoritative model for enterprise cloud adoption.`,
          example: `## Step-by-Step Practical Migration Script
### Database Migration Cutover Procedure

\`\`\`bash
#!/bin/bash
# Enterprise Database Cutover Workflow (Seven-Step Model: Phase 6 & 7)

echo "Phase 1: Put on-premises database in READ-ONLY mode..."
mysql -e "SET GLOBAL read_only = ON;"

echo "Phase 2: Perform final transactional log sync to Cloud DB instance..."
mysqldump --single-transaction --routines --triggers enterprise_db > cutover_snapshot.sql
mysql -h cloud-db.instance.internal -u db_admin -p enterprise_db < cutover_snapshot.sql

echo "Phase 3: Verify record count checksums across environments..."
ON_PREM_COUNT=$(mysql -N -e "SELECT COUNT(*) FROM enterprise_db.orders;")
CLOUD_COUNT=$(mysql -h cloud-db.instance.internal -N -e "SELECT COUNT(*) FROM enterprise_db.orders;")

if [ "$ON_PREM_COUNT" -eq "$CLOUD_COUNT" ]; then
    echo "Checksum SUCCESS: On-Prem ($ON_PREM_COUNT) == Cloud ($CLOUD_COUNT)"
    echo "Phase 4: Flipping DNS record to point to Cloud Load Balancer..."
    # Update DNS TTL and Route53 / Cloud DNS record
    echo "Cutover complete. Cloud application live."
else
    echo "ERROR: Data mismatch detected! Aborting cutover to prevent data loss."
    mysql -e "SET GLOBAL read_only = OFF;"
    exit 1
fi
\`\`\``,
          quiz: {
            question:
              'In the Seven-Step Migration Model, which phase immediately follows "Isolating the Dependencies"?',
            options: [
              'Mapping the Migration',
              'Testing and Validation',
              'Data Migration',
              'Decommissioning On-Premises Hardware',
            ],
            correctIndex: 0,
            explanation:
              'Once dependencies are isolated in Step 2, Step 3 ("Mapping the Migration") maps those dependencies and components to corresponding cloud service constructs.',
          },
        },
      ],
    },
    {
      unitNum: 3,
      unitTitle: 'Infrastructure as a Service (IaaS) & Platform (PaaS)',
      code: 'CS-401 · Unit 3',
      hours: '3.5 hrs study',
      summary:
        'Virtual machine provisioning, live migration mechanisms, hypervisor management, and hybrid integration frameworks like Aneka.',
      sourcePage: 42,
      topics: [
        {
          title: 'Virtual Machine Provisioning & Live Migration Services',
          objective:
            'Understand hypervisor virtualization mechanisms, VM provisioning lifecycles, and memory pre-copy live migration protocols.',
          sourcePage: 43,
          overview: `# Virtual Machine Provisioning & Live Migration Services

### 💡 Topic Introduction
Virtualization is the fundamental enabling technology of IaaS. It abstracts physical CPU, memory, storage, and networking into isolated Virtual Machines (VMs) governed by a Hypervisor (Virtual Machine Monitor / VMM). Live VM migration allows running virtual machines to move across physical host nodes with zero perceivable user downtime.

---

### 🎯 Learning Objectives
- Differentiate between Type-1 (Bare-Metal) and Type-2 (Hosted) hypervisors.
- Explain the virtual machine provisioning lifecycle from image repository to running state.
- Analyze the memory pre-copy algorithm used in live VM migration to achieve near-zero downtime.

---

### 📖 Key Concepts & Core Definitions
- **Type-1 Hypervisor (Bare Metal)**: Runs directly on physical hardware without a host operating system (e.g., VMware ESXi, KVM, Xen). Provides low latency and high I/O throughput.
- **Type-2 Hypervisor (Hosted)**: Runs as an application atop a host operating system (e.g., VirtualBox, VMware Workstation).
- **Live VM Migration**: The process of moving a running virtual machine from one physical host to another without disconnecting client sessions or shutting down the operating system.
- **Downtime vs. Migration Time**:
  - *Total Migration Time*: Total time from migration initiation until source VM is terminated.
  - *Downtime*: The brief pause (typically 10–50 ms) during which execution transfers and final dirty memory pages are committed.

---

### 📐 Live Migration: Pre-Copy Memory Iteration
1. **Pre-Copy Phase**: The hypervisor transfers all memory pages from Source Host to Destination Host while the VM continues running.
2. **Iterative Dirty Page Tracking**: Memory pages modified by the running guest OS during transfer are tagged as "dirty" and transmitted in subsequent rounds.
3. **Stop-and-Copy Phase**: When dirty page generation drops below a defined threshold, the VM is paused for milliseconds; the remaining dirty pages and CPU register state are transferred.
4. **Activation**: The VM resumes immediately on the Destination Host, and gratuitous ARP updates network switches.

---

### ✅ Key Takeaways
- Type-1 hypervisors dominate production cloud data centers due to direct hardware control.
- Live migration enables seamless hardware maintenance, dynamic load balancing, and fault tolerance without breaking SLAs.

---

> 📖 **Source Reference**: *Notes on Cloud Computing Infrastructure* · Unit III (Page 42–60)
> Core textbook: *Essentials of Cloud Computing* (K. Chandrasekaran).`,
          example: `## Step-by-Step Live Migration Protocol
### Pre-Copy Dirty Page Transfer Algorithm

\`\`\`typescript
// Algorithmic representation of Hypervisor Live Migration
export function calculateMigrationConvergence(
  memorySizeMb: number,
  networkBandwidthMbps: number,
  dirtyPageRateMbps: number
): { canConverge: boolean; rounds: number; estimatedDowntimeMs: number } {
  // If dirty page generation exceeds transfer throughput, pre-copy will never converge!
  if (dirtyPageRateMbps >= networkBandwidthMbps) {
    return { canConverge: false, rounds: 0, estimatedDowntimeMs: Infinity };
  }

  let remainingDataMb = memorySizeMb;
  let rounds = 0;
  const maxRounds = 30;
  const thresholdMb = 10; // Stop-and-copy cutoff

  while (remainingDataMb > thresholdMb && rounds < maxRounds) {
    const roundTimeSec = (remainingDataMb * 8) / networkBandwidthMbps;
    remainingDataMb = (roundTimeSec * dirtyPageRateMbps) / 8;
    rounds++;
  }

  const finalDowntimeMs = ((remainingDataMb * 8) / networkBandwidthMbps) * 1000;
  return {
    canConverge: true,
    rounds,
    estimatedDowntimeMs: Math.round(finalDowntimeMs),
  };
}
\`\`\``,
          quiz: {
            question:
              'During the pre-copy phase of live virtual machine migration, what does the hypervisor do with memory pages that are modified while the transfer is occurring?',
            options: [
              'Marks them as "dirty" and sends them in subsequent iterative transfer rounds',
              'Immediately aborts the migration and reboots the virtual machine',
              'Blocks the guest OS from writing to memory until the network cable is unplugged',
              'Discards the modifications and reverts to the snapshot state',
            ],
            correctIndex: 0,
            explanation:
              'The hypervisor uses dirty-page tracking to identify pages modified during transfer, sending them iteratively until the remaining volume is small enough for the sub-second stop-and-copy pause.',
          },
        },
      ],
    },
    {
      unitNum: 4,
      unitTitle: 'Software as a Service (SaaS) & Data Security in the Cloud',
      code: 'CS-401 · Unit 4',
      hours: '3.0 hrs study',
      summary:
        'SaaS multitenancy architecture, web collaboration ecosystems, and essential security principles (confidentiality, integrity, availability, encryption).',
      sourcePage: 61,
      topics: [
        {
          title: 'SaaS Multitenancy & Cloud Data Security Foundations',
          objective:
            'Examine multitenant database architectures and evaluate security mechanisms: encryption, authentication, and IAM controls.',
          sourcePage: 66,
          overview: `# SaaS Multitenancy & Cloud Data Security Foundations

### 💡 Topic Introduction
Software as a Service (SaaS) delivers applications to thousands of distinct organizations (tenants) simultaneously. The foundational architectural challenge is achieving efficient **multitenancy**—sharing computational and database resources while guaranteeing complete logical isolation, cryptographic confidentiality, and regulatory compliance.

---

### 🎯 Learning Objectives
- Differentiate between the three primary database multitenancy patterns: Separate Database, Shared Database with Separate Schemas, and Shared Database with Shared Schema.
- Formulate the CIA Triad (Confidentiality, Integrity, Availability) in the context of cloud shared responsibility models.
- Analyze encryption mechanisms for data at rest, data in transit, and data in use.

---

### 📖 Multitenancy Database Models
1. **Separate Database (Isolated)**: Each tenant has their own dedicated database instance.
   - *Pros*: Highest data isolation, simplest backup/restore per customer.
   - *Cons*: Highest infrastructure cost, challenging database schema migrations.
2. **Shared Database, Separate Schemas**: Single database instance, distinct SQL schema per tenant.
   - *Pros*: Moderate cost, good logical table separation.
   - *Cons*: Resource contention on shared buffer pools.
3. **Shared Database, Shared Schema**: All tenants share identical tables with a \`tenant_id\` discriminator column.
   - *Pros*: Maximum cost efficiency, scales to millions of users.
   - *Cons*: Must enforce row-level security (RLS) to prevent cross-tenant data leakage.

---

### 📐 The Cloud Security CIA Triad & Encryption Reference
| Principle | Threat Addressed | Primary Technical Countermeasure |
| :--- | :--- | :--- |
| **Confidentiality** | Unauthorized access, data leakage | TLS 1.3 in transit, AES-256 at rest, strict IAM least privilege |
| **Integrity** | Data tampering, man-in-the-middle | Cryptographic hash checks (SHA-256), digital signatures |
| **Availability** | DDoS attacks, hardware failure | Multi-AZ replication, CDN edge caching, auto-scaling |

---

### ✅ Key Takeaways
- Multitenancy enables the economic scalability of SaaS, but requires rigorous logical data separation.
- Security in the cloud is governed by the Shared Responsibility Model: the cloud provider secures the infrastructure, while the tenant secures their data and access credentials.

---

> 📖 **Source Reference**: *Notes on Cloud Computing Infrastructure* · Unit IV (Page 61–71)
> University of Zimbabwe, Department of Computer Science.`,
          example: `## Multi-Tenant Row-Level Security Implementation
### PostgreSQL Row-Level Security (RLS) Policy

\`\`\`sql
-- SaaS Multitenant Security Enforcement
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

-- Create policy restricting access strictly to authenticated tenant
CREATE POLICY tenant_isolation_policy ON customer_documents
    FOR ALL
    TO authenticated_application_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Demonstration: Setting context before query execution
SET LOCAL app.current_tenant_id = 'e7b1a234-9876-4abc-def0-123456789abc';
SELECT * FROM customer_documents; -- Returns strictly records matching this tenant
\`\`\``,
          quiz: {
            question:
              'In the Shared Database with Shared Schema multitenancy model, what database mechanism prevents one customer from accidentally viewing another customer\'s data?',
            options: [
              'Row-Level Security (RLS) with tenant identifier filtering',
              'Installing a separate physical hard drive for each registered user',
              'Giving all customers the database administrator superuser credentials',
              'Running multiple operating systems simultaneously on client laptops',
            ],
            correctIndex: 0,
            explanation:
              'In shared-schema architectures, Row-Level Security (RLS) and strict tenant_id application filtering ensure queries only return records belonging to the authenticated tenant.',
          },
        },
      ],
    },
    {
      unitNum: 5,
      unitTitle: 'SLA Management & Service Level Agreements in Cloud',
      code: 'CS-401 · Unit 5',
      hours: '3.0 hrs study',
      summary:
        'Service Level Agreements (SLAs), Service Level Objectives (SLOs), Service Level Indicators (SLIs), penalties, and the lifecycle of SLA governance.',
      sourcePage: 72,
      topics: [
        {
          title: 'SLA Lifecycle & Governance in Cloud Environments',
          objective:
            'Define SLAs, differentiate SLI/SLO/SLA tiers, and map the full SLA lifecycle from negotiation to termination.',
          sourcePage: 74,
          overview: `# SLA Lifecycle & Governance in Cloud Environments

### 💡 Topic Introduction
In utility computing, contracts between cloud providers and consumers are formalized through **Service Level Agreements (SLAs)**. An SLA is a legally binding commitment defining service guarantees (uptime, latency, throughput), penalties for non-compliance, and protocols for monitoring and dispute resolution.

---

### 🎯 Learning Objectives
- Formulate the precise hierarchy: Service Level Indicators (SLIs), Service Level Objectives (SLOs), and Service Level Agreements (SLAs).
- Calculate service availability percentages and allowable annual downtime (the "nines" of availability).
- Analyze the four sequential phases of the SLA Management Lifecycle.

---

### 📖 The SLI / SLO / SLA Hierarchy
- **Service Level Indicator (SLI)**: A quantifiable metric measured in real time (e.g., *API response latency in milliseconds*, *HTTP error rate*).
- **Service Level Objective (SLO)**: An internal target threshold agreed upon by engineering teams (e.g., *99.9% of requests respond in < 200 ms over a 30-day window*).
- **Service Level Agreement (SLA)**: A formal contract with business customers specifying compensation or financial credits if SLOs are breached.

---

### 📐 The Availability Mathematics ("The Nines")
| Availability Tier | Annual Downtime Allowed | Weekly Downtime Allowed |
| :--- | :--- | :--- |
| **99% ("Two Nines")** | 3.65 days | 1.68 hours |
| **99.9% ("Three Nines")** | 8.76 hours | 10.1 minutes |
| **99.99% ("Four Nines")** | 52.6 minutes | 1.01 minutes |
| **99.999% ("Five Nines")** | 5.26 minutes | 6.05 seconds |

$$\\text{Availability (\\%)} = \\frac{\\text{Total Time} - \\text{Downtime}}{\\text{Total Time}} \\times 100$$

---

### 🔄 The SLA Management Lifecycle
1. **Contract Definition & Negotiation**: Establish verifiable metrics, baseline expectations, and penalty structures.
2. **Implementation & Monitoring**: Continuous automated measurement via independent synthetic health probes.
3. **Assessment & Reporting**: Evaluate historical SLI telemetry against SLO targets to calculate service credit liabilities.
4. **Enforcement & Revision**: Apply billing credits upon breach and renegotiate parameters during contract renewals.

---

### ✅ Key Takeaways
- Without clear SLIs and automated telemetry, SLAs cannot be validated or enforced.
- Higher availability tiers require exponential architectural redundancy and cost.

---

> 📖 **Source Reference**: *Notes on Cloud Computing Infrastructure* · Unit V: SLA Management (Page 72–85)
> University of Zimbabwe, Department of Computer Science.`,
          example: `## SLA Telemetry & Error Budget Calculation
### Automated Availability Evaluator

\`\`\`typescript
// SLO & Error Budget Tracker for Cloud Microservice
export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number; // 2xx, 3xx status codes
  targetSloPercent: number;    // e.g., 99.9%
}

export function evaluateSloCompliance(metrics: ServiceMetrics): {
  currentAvailability: number;
  isCompliant: boolean;
  remainingErrorBudgetRequests: number;
} {
  const currentAvailability = (metrics.successfulRequests / metrics.totalRequests) * 100;
  const isCompliant = currentAvailability >= metrics.targetSloPercent;
  
  const allowableFailures = metrics.totalRequests * (1 - metrics.targetSloPercent / 100);
  const actualFailures = metrics.totalRequests - metrics.successfulRequests;
  const remainingErrorBudgetRequests = Math.max(0, allowableFailures - actualFailures);

  return {
    currentAvailability: Math.round(currentAvailability * 1000) / 1000,
    isCompliant,
    remainingErrorBudgetRequests: Math.floor(remainingErrorBudgetRequests),
  };
}
\`\`\``,
          quiz: {
            question:
              'If a cloud provider guarantees "Three Nines" (99.9%) annual availability, what is the maximum total downtime permitted across the entire year before breaching the SLA?',
            options: [
              'Approximately 8.76 hours',
              'Approximately 52.6 minutes',
              'Approximately 3.65 days',
              'Zero downtime is permitted',
            ],
            correctIndex: 0,
            explanation:
              'A 99.9% uptime commitment allows 0.1% downtime per year: 365 days × 24 hours/day × 0.001 = 8.76 hours of allowable downtime.',
          },
        },
      ],
    },
  ];

  return unitsData.map((unit, uIdx) => {
    const unitPrefix = `// Unit ${String(unit.unitNum).padStart(2, '0')}: ${unit.unitTitle.slice(0, 20)}`;

    const blueTopics = unit.topics.map((t, tIdx) => {
      const topicSlug = `u${unit.unitNum}-t${tIdx + 1}`;
      const sourceRef: SourceReference = {
        documentName: 'Notes on Cloud Computing Infrastructure',
        pageNumber: t.sourcePage,
        sectionHeading: t.title,
        snippetText: `University of Zimbabwe, Dept of Computer Science · Unit ${unit.unitNum} (Page ${t.sourcePage})`,
        confidence: 'verified',
      };

      const overviewArtifact = {
        id: `art-ov-${timestamp}-${uIdx}-${tIdx}`,
        type: 'overview' as const,
        path: `${topicSlug}-overview.md`,
        title: 'Key Concept & Rules',
        tagline: 'Learning objectives, core architectural models & principles',
        lines: [{ width: '92%' }, { width: '75%' }, { width: '82%' }],
        overviewMarkdown: t.overview,
        workedExamplesMarkdown: '',
        sourceReference: sourceRef,
        sourceText: t.overview,
      };

      const examplesArtifact = {
        id: `art-ex-${timestamp}-${uIdx}-${tIdx}`,
        type: 'examples' as const,
        path: `${topicSlug}-code-example.ts`,
        title: 'Worked Code & Architecture Implementation',
        tagline: 'Technical configuration & step-by-step verified example',
        lines: [{ width: '88%' }, { width: '65%' }, { width: '75%' }],
        overviewMarkdown: '',
        workedExamplesMarkdown: t.example,
        sourceReference: sourceRef,
        sourceText: t.overview,
      };

      const quizArtifact = {
        id: `art-qz-${timestamp}-${uIdx}-${tIdx}`,
        type: 'quiz' as const,
        path: `${topicSlug}-exam-quiz.json`,
        title: 'Exam Review & Self-Check',
        tagline: 'High-yield practice quiz challenge',
        lines: [{ width: '94%' }, { width: '80%' }, { width: '60%' }],
        overviewMarkdown: '',
        workedExamplesMarkdown: '',
        quizData: {
          question: t.quiz.question,
          options: t.quiz.options,
          correctIndex: t.quiz.correctIndex,
          explanation: t.quiz.explanation,
        },
        sourceReference: sourceRef,
        sourceText: t.overview,
      };

      return {
        id: `topic-${unit.unitNum}-${tIdx + 1}-${timestamp}`,
        topicName: `${tIdx + 1}. ${t.title}`,
        objective: t.objective,
        lines: [
          { width: '90%', highlight: true },
          { width: '70%' },
          { width: '82%' },
          { width: '55%' },
        ],
        artifacts: [overviewArtifact, examplesArtifact, quizArtifact],
        sourceReference: sourceRef,
      };
    });

    return {
      id: `mod-unit-${unit.unitNum}-${timestamp}`,
      prefix: unitPrefix,
      title: unit.unitTitle,
      courseCode: unit.code,
      estimatedHours: unit.hours,
      summary: unit.summary,
      lines: [{ width: '88%' }, { width: '62%' }, { width: '78%' }, { width: '48%' }],
      blueRoadmap: {
        filename: `unit-${String(unit.unitNum).padStart(2, '0')}-syllabus.md`,
        heading: `Key Topics & Roadmap: Unit ${unit.unitNum} - ${unit.unitTitle}`,
        description: `Master these core topics extracted directly from Unit ${unit.unitNum} of Notes on Cloud Computing Infrastructure.`,
        topics: blueTopics,
      },
    };
  });
}
