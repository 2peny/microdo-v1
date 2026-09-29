import { StudyDirectoryCourse } from '../types';

export const INITIAL_STUDY_COURSES: StudyDirectoryCourse[] = [
  {
    id: 'cs-systems',
    name: 'Computer Systems & Architecture',
    discipline: 'Computer Science',
    quote: 'SPEC-DRIVEN STUDY ARCHITECTURE',
    subquote: 'module as root of truth · key topics as blueprint · concise artifacts as mastery',
    modules: [
      {
        id: 'mod-cache',
        prefix: '// Module 01: Cache Memory Hierarchy',
        title: 'Memory Hierarchy & Locality',
        courseCode: 'CS-6004 · Chapter 5',
        estimatedHours: '3.5 hrs study',
        summary: 'Deep dive into SRAM/DRAM latency gaps, spatial & temporal locality principles, and cache line structures.',
        lines: [{ width: '85%' }, { width: '60%' }, { width: '75%' }, { width: '45%' }],
        blueRoadmap: {
          filename: 'cache-syllabus.md',
          heading: 'Core Topics: Memory Hierarchy & Cache Optimization',
          description: 'Master these 3 core topics to understand high-speed memory systems and avoid latency penalties.',
          topics: [
            {
              id: 'topic-locality',
              topicName: '1. Temporal & Spatial Locality Principles',
              objective: 'Understand how memory access patterns directly determine cache hit ratios.',
              lines: [
                { width: '92%', highlight: true },
                { width: '74%' },
                { width: '86%' },
                { width: '58%' },
              ],
              artifacts: [
                {
                  id: 'art-locality-overview',
                  type: 'overview',
                  path: 'locality-overview.md',
                  title: 'Core Concept & Principles',
                  tagline: 'Summary of 90/10 Rule and Memory Bounds',
                  lines: [{ width: '94%' }, { width: '78%' }, { width: '85%' }, { width: '60%' }],
                  overviewMarkdown: `# Core Concept: Locality of Reference

Programs do not access memory uniformly at random; memory references obey two fundamental laws:

## 1. Temporal Locality (Locality in Time)
If a memory location is referenced once, it is likely to be referenced again soon in the near future.
- **Classic examples**: Loop iteration counters, accumulator variables (\`sum += arr[i]\`), instruction loops.
- **Hardware Mechanism**: Keep recently accessed data in the fastest L1/L2 cache levels.

## 2. Spatial Locality (Locality in Space)
If a memory location is referenced, nearby memory locations are likely to be referenced soon.
- **Classic examples**: Sequential array traversals, linear instruction stream execution.
- **Hardware Mechanism**: Fetch data in multi-byte **cache blocks / cache lines** (typically 64 bytes) rather than single words.

> **Rule of Thumb**: The 90/10 rule dictates that a program spends 90% of its execution time inside 10% of its code.`,
                  workedExamplesMarkdown: `# Worked Example: Row-Major vs Column-Major Traversal

In C/C++, matrices are stored in **Row-Major Order** (contiguous row elements sit adjacent in RAM).

### High Spatial Locality (Fast):
\`\`\`c
// Strides sequentially through RAM: Stride = 1
for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
        sum += matrix[i][j]; // Cache hit rate ~95%
    }
}
\`\`\`

### Poor Spatial Locality (Up to 10x Slower):
\`\`\`c
// Strides by N words: Every iteration jumps across cache lines!
for (int j = 0; j < N; j++) {
    for (int i = 0; i < N; i++) {
        sum += matrix[i][j]; // Cache miss on almost every access!
    }
}
\`\`\`

**Latency impact**: Missing L1/L2 causes CPU stalls of 150-200 clock cycles fetching from DRAM.`,
                  quizData: {
                    question: 'A 64-bit integer array (8 bytes per element) is scanned sequentially on a CPU with 64-byte cache lines. In a cold cache, what is the theoretical miss rate?',
                    options: [
                      '100% (Every element causes a miss)',
                      '50% (Every second element causes a miss)',
                      '12.5% (1 miss per 8 elements: 1/8)',
                      '0% (Hardware prefetching prevents all misses)',
                    ],
                    correctIndex: 2,
                    explanation: 'Each 64-byte cache line holds 64 / 8 = 8 integer elements. Accessing the 1st element misses and loads all 8 elements into cache. The next 7 elements are cache hits. Thus, 1 miss per 8 elements = 12.5% miss rate.',
                  },
                },
                {
                  id: 'art-locality-examples',
                  type: 'examples',
                  path: 'locality-benchmark.ts',
                  title: 'Worked Code & Benchmark',
                  tagline: 'Concrete stride analysis and speedup metrics',
                  lines: [{ width: '88%' }, { width: '65%' }, { width: '82%' }, { width: '50%' }],
                  overviewMarkdown: `# Locality Benchmark: Quantitative Verification

Testing cache line effects by varying memory stride distance from 1 to 64.`,
                  workedExamplesMarkdown: `// Cache Stride Benchmark in TypeScript / Node
function benchmarkStride(stride: number, size: number = 10_000_000) {
  const buffer = new Int32Array(size);
  const start = performance.now();
  
  let acc = 0;
  for (let i = 0; i < size; i += stride) {
    acc += buffer[i];
  }
  
  const elapsedMs = performance.now() - start;
  return { stride, timeMs: elapsedMs.toFixed(2), throughput: (size / elapsedMs).toFixed(0) + ' ops/ms' };
}

// Results across typical x86_64 CPU:
// Stride 1:  14.2 ms (Maximum Spatial Locality)
// Stride 4:  22.8 ms
// Stride 16: 68.4 ms (Cache line strided - every read misses L1)
// Stride 64: 110.1 ms (Severe bus thrashing)`,
                  quizData: {
                    question: 'Which software design pattern best preserves spatial cache locality?',
                    options: [
                      'Linked Lists with fragmented node heap allocations',
                      'Array of Structs with 2KB large objects',
                      'Struct of Arrays (SoA) for vectorized attributes',
                      'Deeply nested polymorphic object graphs',
                    ],
                    correctIndex: 2,
                    explanation: 'Struct of Arrays (SoA) groups identical fields in contiguous arrays, ensuring that scanning an attribute (e.g. position.x) packs data tightly into cache lines without wasting bytes on unused fields.',
                  },
                },
                {
                  id: 'art-locality-quiz',
                  type: 'quiz',
                  path: 'exam-checklist.md',
                  title: 'Exam Review & Quiz',
                  tagline: 'High-yield exam formulas & test problem',
                  lines: [{ width: '92%' }, { width: '80%' }, { width: '70%' }],
                  overviewMarkdown: `# Exam Review: High-Yield Formulas

## Average Memory Access Time (AMAT)
$$AMAT = \\text{Hit Time} + (\\text{Miss Rate} \\times \\text{Miss Penalty})$$

### Multi-Level AMAT:
$$AMAT = L_1\\text{ Hit} + L_1\\text{ Miss Rate} \\times (L_2\\text{ Hit} + L_2\\text{ Miss Rate} \\times \\text{Memory Penalty})$$

## Key Invariants for Exams
1. Increasing cache block size reduces compulsory misses (spatial locality), but if too large, increases conflict misses and transfer penalty.
2. Increasing associativity reduces conflict misses, but increases hit latency and tag comparator complexity.`,
                  workedExamplesMarkdown: `### Worked Exam Question:
Given:
- L1 Hit Time = 1 ns
- L1 Miss Rate = 5% (0.05)
- DRAM Access Penalty = 100 ns

Calculate AMAT:
AMAT = 1 ns + (0.05 * 100 ns) = 1 ns + 5 ns = 6.0 ns!
Note: Even a 5% miss rate increases effective memory latency by 6x!`,
                  quizData: {
                    question: 'If L1 hit time is 2ns, L1 miss rate is 4%, and main memory penalty is 50ns, what is the AMAT?',
                    options: ['2.0 ns', '4.0 ns', '52.0 ns', '2.08 ns'],
                    correctIndex: 1,
                    explanation: 'AMAT = 2ns + (0.04 * 50ns) = 2ns + 2ns = 4.0 ns.',
                  },
                },
              ],
            },
            {
              id: 'topic-mapping',
              topicName: '2. Cache Mapping: Direct, Set-Associative & Fully',
              objective: 'Learn how memory addresses decompose into Tag, Index, and Offset fields.',
              lines: [
                { width: '90%', highlight: true },
                { width: '68%' },
                { width: '82%' },
                { width: '62%' },
              ],
              artifacts: [
                {
                  id: 'art-mapping-overview',
                  type: 'overview',
                  path: 'address-decomposition.md',
                  title: 'Address Decomposition',
                  tagline: 'Tag, Index, and Block Offset breakdown',
                  lines: [{ width: '95%' }, { width: '70%' }, { width: '80%' }],
                  overviewMarkdown: `# Cache Address Decomposition

Every 32-bit or 64-bit physical memory address is divided into three distinct segments:

| Tag Bits (High) | Index Bits (Middle) | Block Offset Bits (Low) |
|---|---|---|
| Identifies specific block | Selects cache set row | Selects byte within block |

### Formulas:
- **Offset bits**: $b = \\log_2(\\text{Block Size in bytes})$
- **Index bits**: $s = \\log_2(\\text{Number of Sets})$
- **Tag bits**: $t = \\text{Address Width} - s - b$`,
                  workedExamplesMarkdown: `### Worked Example:
32-bit address space with a 16 KB, 4-way set associative cache with 64-byte blocks:

1. Block size = 64 bytes -> Offset bits = log2(64) = 6 bits.
2. Number of blocks = 16 KB / 64 bytes = 256 blocks.
3. Number of sets = 256 blocks / 4 ways = 64 sets.
4. Index bits = log2(64 sets) = 6 bits.
5. Tag bits = 32 - 6 (index) - 6 (offset) = 20 bits.`,
                  quizData: {
                    question: 'In a direct-mapped cache, how many ways per set are there?',
                    options: ['1 way (Every set holds exactly 1 block)', '2 ways', '4 ways', 'Infinite ways'],
                    correctIndex: 0,
                    explanation: 'A direct-mapped cache is simply a 1-way set-associative cache. Each memory address maps to exactly one specific line in the cache.',
                  },
                },
                {
                  id: 'art-mapping-examples',
                  type: 'examples',
                  path: 'mapping-simulator.ts',
                  title: 'Address Bit Parser Code',
                  tagline: 'Bitmasking simulator for address bit fields',
                  lines: [{ width: '85%' }, { width: '72%' }, { width: '90%' }],
                  overviewMarkdown: `# Address Bit Extraction Code

Demonstration of bit shifts and masks used by memory management units.`,
                  workedExamplesMarkdown: `function parseAddress(address: number, blockSize: number, numSets: number) {
  const offsetBits = Math.log2(blockSize);
  const indexBits = Math.log2(numSets);
  
  const offsetMask = (1 << offsetBits) - 1;
  const indexMask = (1 << indexBits) - 1;
  
  const offset = address & offsetMask;
  const index = (address >> offsetBits) & indexMask;
  const tag = address >> (offsetBits + indexBits);
  
  return { tag: '0x' + tag.toString(16), index, offset };
}

// Example: Address 0x000F43A2
// parseAddress(0x000F43A2, 64, 128) -> Tag: 0x3d0, Index: 114, Offset: 34`,
                  quizData: {
                    question: 'If block size is doubled from 32 bytes to 64 bytes without changing total cache capacity, what happens to the offset and index bits?',
                    options: [
                      'Offset bits increase by 1, Index bits decrease by 1',
                      'Both increase by 1',
                      'Offset bits decrease by 1, Index bits increase by 1',
                      'Neither changes',
                    ],
                    correctIndex: 0,
                    explanation: 'Offset bits = log2(BlockSize); doubling it adds 1 bit. Total cache capacity is constant, so number of blocks is halved, which halves the number of sets, reducing index bits by 1.',
                  },
                },
                {
                  id: 'art-mapping-quiz',
                  type: 'quiz',
                  path: 'conflict-misses.md',
                  title: 'Conflict Miss Analysis',
                  tagline: 'Thrashing scenarios and associativity solutions',
                  lines: [{ width: '90%' }, { width: '75%' }, { width: '65%' }],
                  overviewMarkdown: `# Conflict Misses & Cache Thrashing

When two frequently used variables map to the exact same cache index, they repeatedly evict each other even when the rest of the cache is completely empty!

This condition is called **Cache Thrashing**.
Increasing associativity (e.g. 2-way, 4-way, 8-way) provides alternate slots in the set to store both items simultaneously.`,
                  workedExamplesMarkdown: `// Classic Thrashing Example in Direct Mapped Cache
int a[1024]; // Maps to Set 0
int b[1024]; // Also maps to Set 0!

for (int i = 0; i < 1024; i++) {
    // a[i] loads into Set 0 (evicts b)
    // b[i] loads into Set 0 (evicts a)
    sum += a[i] * b[i]; // 100% Miss Rate!
}`,
                  quizData: {
                    question: 'Which cache type has zero conflict misses by definition?',
                    options: [
                      'Direct-mapped cache',
                      'Fully associative cache',
                      '2-way set associative cache',
                      'Instruction cache',
                    ],
                    correctIndex: 1,
                    explanation: 'A fully associative cache has only 1 set containing all blocks. Any block can be placed in any location, so conflict misses cannot occur (only compulsory and capacity misses exist).',
                  },
                },
              ],
            },
            {
              id: 'topic-replacement',
              topicName: '3. Replacement Policies: LRU & Write-Back Protocols',
              objective: 'Master Least-Recently-Used eviction and dirty-bit coherency.',
              lines: [
                { width: '94%', highlight: true },
                { width: '70%' },
                { width: '80%' },
              ],
              artifacts: [
                {
                  id: 'art-replacement-overview',
                  type: 'overview',
                  path: 'lru-overview.md',
                  title: 'LRU & Write Policies',
                  tagline: 'Write-Through vs Write-Back & Dirty Bits',
                  lines: [{ width: '92%' }, { width: '80%' }, { width: '68%' }],
                  overviewMarkdown: `# Cache Write Policies & Dirty Bits

When a CPU executes a store instruction (\`write\`), two strategies exist:

### 1. Write-Through
Write data to both the cache AND main memory simultaneously.
- **Advantage**: Simpler hardware, memory is always consistent.
- **Disadvantage**: Slow memory bus bottleneck on every write.

### 2. Write-Back (Modern Standard)
Write data *only* to the cache line and mark the line with a **Dirty Bit = 1**.
- The cache line is written back to main memory only when it is eventually evicted by LRU!
- **Advantage**: High write bandwidth; multiple writes to the same line require only a single memory write.`,
                  workedExamplesMarkdown: `### LRU State Machine
In a 4-way set, each set maintains age bits:
- On Access: Reset accessed way to age 0 (Most Recently Used).
- Increment other ways.
- On Eviction: Select way with age = 3 (Least Recently Used).`,
                  quizData: {
                    question: 'What is the purpose of the "Dirty Bit" in a write-back cache?',
                    options: [
                      'To indicate that data is corrupted and needs CRC check',
                      'To indicate the cache line was modified and must be written to memory upon eviction',
                      'To indicate that another CPU core is currently reading the block',
                      'To reset the cache tag',
                    ],
                    correctIndex: 1,
                    explanation: 'The dirty bit is set to 1 whenever a write occurs. When that line is later evicted, the cache controller checks the dirty bit: if 1, it writes the modified data to memory; if 0, it can safely discard it without extra memory traffic.',
                  },
                },
                {
                  id: 'art-replacement-examples',
                  type: 'examples',
                  path: 'lru-cache.ts',
                  title: 'LRU Cache Implementation',
                  tagline: 'Doubly Linked List + Hash Map in O(1)',
                  lines: [{ width: '88%' }, { width: '75%' }, { width: '60%' }],
                  overviewMarkdown: `# O(1) LRU Cache Algorithm

Standard computer science algorithm pairing a Hash Map with a Doubly Linked List.`,
                  workedExamplesMarkdown: `class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, V>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // Refresh position to MRU (end of Map)
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      // Evict LRU (first key in map iterator)
      const lruKey = this.map.keys().next().value;
      if (lruKey !== undefined) this.map.delete(lruKey);
    }
    this.map.set(key, value);
  }
}`,
                  quizData: {
                    question: 'What is the time complexity of get and put operations in an optimal LRU cache?',
                    options: ['O(1) time', 'O(log N) time', 'O(N) time', 'O(N^2) time'],
                    correctIndex: 0,
                    explanation: 'By combining a doubly-linked list with a hash map, both lookup, insertion, and eviction occur in O(1) constant time.',
                  },
                },
                {
                  id: 'art-replacement-quiz',
                  type: 'quiz',
                  path: 'exam-cases.md',
                  title: 'Exam Case Scenarios',
                  tagline: 'Step-by-step eviction trace on a 3-block cache',
                  lines: [{ width: '95%' }, { width: '65%' }, { width: '80%' }],
                  overviewMarkdown: `# Eviction Trace Exercise

Trace sequence of references: **A, B, C, D, A, B, E** on a 3-block fully associative LRU cache:

1. Reference A -> Miss (Cache: [A])
2. Reference B -> Miss (Cache: [A, B])
3. Reference C -> Miss (Cache: [A, B, C])
4. Reference D -> Miss, evicts A (Cache: [B, C, D])
5. Reference A -> Miss, evicts B (Cache: [C, D, A])
6. Reference B -> Miss, evicts C (Cache: [D, A, B])
7. Reference E -> Miss, evicts D (Cache: [A, B, E])`,
                  workedExamplesMarkdown: `Total misses: 7 out of 7 references (100% miss rate due to cyclic access larger than cache size).
This is known as **LRU Thrashing** on cyclic access loops!`,
                  quizData: {
                    question: 'If a program loops cyclically through 5 unique blocks on a 4-block LRU cache, what will be the steady-state hit rate?',
                    options: ['0% (Every single access will miss)', '20%', '80%', '100%'],
                    correctIndex: 0,
                    explanation: 'Because each block accessed is precisely the one that was evicted 4 steps ago, every access results in a cache miss. The hit rate is 0%.',
                  },
                },
              ],
            },
          ],
        },
      },
      {
        id: 'mod-vm',
        prefix: '// Module 02: Virtual Memory & Paging',
        title: 'Virtual Memory & Page Tables',
        courseCode: 'CS-6004 · Chapter 6',
        estimatedHours: '4.0 hrs study',
        summary: 'Hardware translation mechanisms, multi-level page tables, Translation Lookaside Buffers (TLB), and demand paging.',
        lines: [{ width: '80%' }, { width: '55%' }, { width: '70%' }, { width: '40%' }],
        blueRoadmap: {
          filename: 'vm-syllabus.md',
          heading: 'Core Topics: Address Translation & Virtual Memory',
          description: 'Master these 3 core topics for OS-to-hardware memory isolation and paging architectures.',
          topics: [
            {
              id: 'topic-translation',
              topicName: '1. Virtual-to-Physical Address Translation',
              objective: 'Understand how VPN and VPO map to PPN and PPO via page table entries.',
              lines: [{ width: '90%', highlight: true }, { width: '72%' }, { width: '82%' }],
              artifacts: [
                {
                  id: 'art-trans-overview',
                  type: 'overview',
                  path: 'translation-overview.md',
                  title: 'Page Translation Mechanics',
                  tagline: 'VPN, PPN, and Page Table Base Registers',
                  lines: [{ width: '92%' }, { width: '76%' }, { width: '64%' }],
                  overviewMarkdown: `# Virtual to Physical Address Translation

Virtual addresses consist of:
- **Virtual Page Number (VPN)**: Index into page table
- **Virtual Page Offset (VPO)**: Byte offset within page

Physical addresses consist of:
- **Physical Page Number (PPN)**: Identifies physical frame in RAM
- **Physical Page Offset (PPO)**: Identical to VPO (offset remains unchanged!)`,
                  workedExamplesMarkdown: `Given: 4 KB pages (2^12 bytes):
- Offset bits = 12 bits.
- Virtual Address = 0x00401A38
- VPO = 0xA38
- VPN = 0x00401
- If PageTable[VPN] = PPN 0x7F2
- Physical Address = (PPN << 12) | PPO = 0x007F2A38!`,
                  quizData: {
                    question: 'Why does the page offset (VPO) equal the physical offset (PPO)?',
                    options: [
                      'Because page sizes and physical frames are identical in size',
                      'Because the TLB handles offset translation',
                      'Because RAM is contiguous',
                      'Because the OS zeroes the offset',
                    ],
                    correctIndex: 0,
                    explanation: 'Pages and physical frames have identical byte lengths (usually 4 KB), so the relative position within the page is preserved exactly.',
                  },
                },
                {
                  id: 'art-trans-examples',
                  type: 'examples',
                  path: 'page-fault-handler.md',
                  title: 'Demand Paging & Page Faults',
                  tagline: 'Hardware trap and OS disk fetch cycle',
                  lines: [{ width: '85%' }, { width: '70%' }, { width: '60%' }],
                  overviewMarkdown: `# Page Fault Sequence

When the **Valid Bit** in a PTE is 0, the CPU raises an interrupt exception: **Page Fault**.`,
                  workedExamplesMarkdown: `Step 1: CPU hardware saves registers and traps to OS kernel.
Step 2: OS finds an empty physical frame (or evicts an existing page via LRU).
Step 3: Disk DMA transfers page from swap space into RAM.
Step 4: OS updates PTE with new PPN and Valid Bit = 1.
Step 5: CPU restarts the exact instruction that faulted!`,
                  quizData: {
                    question: 'Approximately how many orders of magnitude slower is a page fault serviced from disk compared to an L1 cache hit?',
                    options: ['10x slower', '100x slower', '100,000x to 1,000,000x slower', 'Same speed'],
                    correctIndex: 2,
                    explanation: 'L1 hits take ~1 nanosecond. Reading a missing page from an NVMe/SSD takes ~10-100 microseconds (10,000x - 100,000x), and mechanical disks take milliseconds (~1,000,000x slower).',
                  },
                },
                {
                  id: 'art-trans-quiz',
                  type: 'quiz',
                  path: 'tlb-exam-quiz.md',
                  title: 'TLB & Multi-Level Page Exam',
                  tagline: 'TLB hit rate impact on Effective Access Time (EAT)',
                  lines: [{ width: '90%' }, { width: '65%' }, { width: '85%' }],
                  overviewMarkdown: `# Translation Lookaside Buffer (TLB)

The TLB is a tiny, associative hardware cache inside the MMU that stores recent VPN -> PPN translations.`,
                  workedExamplesMarkdown: `Effective Access Time with TLB:
EAT = TLB_Hit_Rate * (TLB_Time + RAM_Time) + (1 - TLB_Hit_Rate) * (TLB_Time + 2 * RAM_Time)`,
                  quizData: {
                    question: 'Why do modern 64-bit systems use Multi-Level (Hierarchical) Page Tables instead of a single flat table?',
                    options: [
                      'A single flat 64-bit table would require petabytes of RAM just to store unused PTEs',
                      'Multi-level tables are faster on TLB hits',
                      'Single tables do not support read-only permissions',
                      'Hardware MMUs cannot read 32-bit words',
                    ],
                    correctIndex: 0,
                    explanation: 'A 64-bit address space has 2^52 virtual pages. A flat table would require over 30 million gigabytes of RAM. Multi-level tables only allocate subtables for virtual address ranges that are actively mapped.',
                  },
                },
              ],
            },
            {
              id: 'topic-protection',
              topicName: '2. Memory Protection & User/Kernel Boundaries',
              objective: 'Master page permissions (R/W/X), ring privilege levels, and memory sandboxing.',
              lines: [{ width: '88%', highlight: true }, { width: '65%' }, { width: '75%' }],
              artifacts: [
                {
                  id: 'art-prot-overview',
                  type: 'overview',
                  path: 'permissions-overview.md',
                  title: 'Permission Bits & Privilege',
                  tagline: 'Read, Write, Execute, and User/Supervisor flags',
                  lines: [{ width: '90%' }, { width: '75%' }, { width: '65%' }],
                  overviewMarkdown: `# Page Protection Flags

Each Page Table Entry (PTE) encodes security flags:
- **R (Read)**: Page can be read.
- **W (Write)**: Page can be mutated. If 0, writing triggers a Segfault.
- **X (Execute / NX bit)**: Prohibits code execution in stack/heap data regions (mitigates buffer overflows).
- **U/S (User / Supervisor)**: Restricts kernel memory from user-mode access.`,
                  workedExamplesMarkdown: `// Example: Linux Memory Map
// 0x00400000 - Text Segment (Code): R-X (Read + Executable)
// 0x00600000 - Data Segment: RW- (Read + Write)
// 0x7FFFFFFF - Stack: RW- (NX enabled - cannot execute injected shellcode!)`,
                  quizData: {
                    question: 'What security vulnerability is mitigated by the NX (No-Execute) bit on the stack?',
                    options: ['Buffer Overflow Stack-Smashing Attacks', 'DDoS Attacks', 'SQL Injection', 'Race Conditions'],
                    correctIndex: 0,
                    explanation: 'The NX bit ensures that stack memory marked writable cannot be executed as CPU instructions, preventing attackers from running shellcode injected via buffer overflows.',
                  },
                },
                {
                  id: 'art-prot-examples',
                  type: 'examples',
                  path: 'copy-on-write.md',
                  title: 'Copy-on-Write (CoW) in fork()',
                  tagline: 'High-performance process cloning',
                  lines: [{ width: '85%' }, { width: '70%' }, { width: '80%' }],
                  overviewMarkdown: `# Copy-on-Write (CoW)

When a process calls \`fork()\`, copying gigabytes of RAM immediately is wasteful.
Instead, parent and child share physical pages marked **Read-Only**!`,
                  workedExamplesMarkdown: `1. fork() duplicates the page table, but marks all PTEs as Read-Only.
2. If either process attempts to write to a page, the MMU raises a Protection Fault.
3. The OS catches the fault, allocates a fresh physical frame, copies that single 4 KB page, and updates the PTE to Read-Write!`,
                  quizData: {
                    question: 'What is the time complexity of fork() when using Copy-on-Write?',
                    options: [
                      'O(Page Table Size), nearly instantaneous',
                      'O(Total RAM Size), very slow',
                      'O(Disk Size)',
                      'O(Number of CPU cores)',
                    ],
                    correctIndex: 0,
                    explanation: 'Only the page table pointers are copied, which takes microseconds regardless of whether the process holds 100 MB or 100 GB of memory.',
                  },
                },
                {
                  id: 'art-prot-quiz',
                  type: 'quiz',
                  path: 'segfault-quiz.md',
                  title: 'Segmentation Fault Quiz',
                  tagline: 'Identifying memory violation triggers',
                  lines: [{ width: '92%' }, { width: '60%' }, { width: '78%' }],
                  overviewMarkdown: `# Segfaults vs Bus Errors

- **Segmentation Fault (SIGSEGV)**: Accessing a virtual address not mapped in the page table, or violating permission flags (e.g. writing to string literal in .rodata).
- **Bus Error (SIGBUS)**: Hardware alignment violation or accessing unbacked mapped files.`,
                  workedExamplesMarkdown: `char *str = "Hello World"; // Stored in .rodata (R--)
str[0] = 'h'; // CRASH: Hardware triggers SIGSEGV!`,
                  quizData: {
                    question: 'Why does dereferencing a NULL pointer (0x0) cause a segmentation fault?',
                    options: [
                      'Operating systems intentionally leave page 0 unmapped so any access faults immediately',
                      'Address 0 is physically damaged in RAM',
                      'The CPU cannot count from 0',
                      'The compiler removes all 0 pointers',
                    ],
                    correctIndex: 0,
                    explanation: 'Virtual address 0 is deliberately unmapped by the kernel so that null pointer bugs trigger a fast, reliable protection trap rather than silently corrupting memory.',
                  },
                },
              ],
            },
            {
              id: 'topic-tlb',
              topicName: '3. TLB Organization & Context Switching',
              objective: 'Learn Address Space Identifiers (ASID) and TLB shootdown overhead.',
              lines: [{ width: '85%', highlight: true }, { width: '70%' }, { width: '60%' }],
              artifacts: [
                {
                  id: 'art-tlb-overview',
                  type: 'overview',
                  path: 'asid-overview.md',
                  title: 'ASIDs & Context Switches',
                  tagline: 'Preventing cross-process TLB invalidation',
                  lines: [{ width: '90%' }, { width: '80%' }, { width: '70%' }],
                  overviewMarkdown: `# Address Space IDs (ASID)

Without ASIDs, switching between Process A and Process B requires flushing the entire TLB, leading to poor cold-cache performance after every context switch!

Modern CPUs tag each TLB entry with an **ASID**. The MMU matches both the VPN AND current ASID register.`,
                  workedExamplesMarkdown: `Context switch without ASID:
CR3 register write -> TLB fully flushed -> Next 100 memory accesses all miss TLB!

Context switch with ASID:
CR3 register write + ASID update -> TLB entries for previous processes remain valid!`,
                  quizData: {
                    question: 'What is a "TLB Shootdown" in multi-core systems?',
                    options: [
                      'An inter-processor interrupt (IPI) forcing other CPU cores to invalidate a cached translation',
                      'A hardware failure in the MMU',
                      'A power saving state',
                      'A kernel panic',
                    ],
                    correctIndex: 0,
                    explanation: 'When one core unmaps or modifies a page table entry, it must send IPI interrupts to all other cores that might have that mapping cached in their local TLBs to prevent stale memory writes.',
                  },
                },
                {
                  id: 'art-tlb-examples',
                  type: 'examples',
                  path: 'huge-pages.md',
                  title: 'Huge Pages & Performance',
                  tagline: '2MB and 1GB pages in databases and AI workloads',
                  lines: [{ width: '88%' }, { width: '65%' }, { width: '75%' }],
                  overviewMarkdown: `# Transparent Huge Pages (THP)

Standard pages: **4 KB**
Huge pages: **2 MB** (512x larger!) or **1 GB**

A standard 512-entry TLB covers only 2 MB of RAM with 4KB pages.
With 2MB huge pages, the same TLB covers **1 Gigabyte** of RAM!`,
                  workedExamplesMarkdown: `Databases (PostgreSQL, Redis) and LLM inference engines use huge pages to achieve near 99.9% TLB hit rates across massive working sets.`,
                  quizData: {
                    question: 'What is the primary downside of using 1GB huge pages?',
                    options: [
                      'Internal fragmentation (wasted memory if data is small)',
                      'Slower TLB lookup time',
                      'Incompatibility with 64-bit CPUs',
                      'Excessive CPU heat',
                    ],
                    correctIndex: 0,
                    explanation: 'If an application only needs 10 KB, allocating a 1GB huge page wastes over 99.9% of that physical frame to internal fragmentation.',
                  },
                },
                {
                  id: 'art-tlb-quiz',
                  type: 'quiz',
                  path: 'tlb-exam.md',
                  title: 'TLB Exam Synthesis',
                  tagline: 'End-to-end memory access calculation',
                  lines: [{ width: '92%' }, { width: '75%' }, { width: '60%' }],
                  overviewMarkdown: `# End-to-End Memory Hierarchy Flow

1. CPU issues Virtual Address.
2. Check TLB:
   - Hit -> Get PPN immediately.
   - Miss -> MMU walks Page Table in RAM, fetches PPN, loads into TLB.
3. Form Physical Address (PPN + PPO).
4. Check L1 Data Cache:
   - Hit -> Return word to CPU register (1-4 cycles).
   - Miss -> Check L2, L3, then DRAM.`,
                  workedExamplesMarkdown: `Best Case: TLB Hit (0.5ns) + L1 Cache Hit (1ns) = 1.5ns!
Worst Case: TLB Miss (Page Table Walk: 50ns) + L1 Miss + DRAM Page Fault (10ms) = 10,000,000ns!`,
                  quizData: {
                    question: 'Can a memory reference result in a TLB Hit and a Cache Miss simultaneously?',
                    options: [
                      'Yes! The translation is known, but the data is not in cache',
                      'No, TLB and Cache are the same hardware',
                      'No, a TLB hit guarantees the data is in L1',
                      'Only during a page fault',
                    ],
                    correctIndex: 0,
                    explanation: 'Yes. The TLB caches address translations (VPN -> PPN), whereas the L1 cache stores data values. Knowing the physical address does not mean the data line currently resides in L1 cache.',
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  },
];
