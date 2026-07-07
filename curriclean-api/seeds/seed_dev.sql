-- Seed data for samuelrubenscontato@gmail.com
-- user_id: 3d0ac31c-7088-48df-a793-be19ec2447d8
-- Base date from seed.py: 2026-05-21T12:00:00Z

INSERT INTO applications (id, user_id, company, title, description, applied_at, status, created_at, updated_at) VALUES

('a1000001-0000-4000-8000-000000000001',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Stripe',
 'Staff Backend Engineer, Payments',
 'We are looking for a Staff Backend Engineer to join the Payments Infrastructure team. You will design and operate the core ledger and idempotency layers that move billions of dollars per day.

Responsibilities:
- Own services written in Ruby and Go that process card and bank transactions.
- Drive technical strategy around exactly-once delivery and partial failure recovery.
- Partner with risk, compliance, and product to ship safe, observable systems.

Requirements: 8+ years building distributed systems, deep Postgres experience, comfort with formal modelling (TLA+/Alloy a plus).',
 '2026-05-07T12:00:00.000Z', 'interviewing', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000002',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Vercel',
 'Senior Full-stack Engineer, Next.js',
 'Join the Next.js core team to build the framework that powers millions of production apps. You''ll work across the App Router, caching, and React Server Components.

What you''ll do:
- Ship features end-to-end across compiler, runtime, and Vercel platform.
- Improve build performance and DX for the open-source community.
- Contribute to RFCs and engage with the wider React ecosystem.

Required: Deep TypeScript, React 19, and Node internals. Bonus: Rust, Turbopack, edge runtimes.',
 '2026-05-14T12:00:00.000Z', 'applied', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000003',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Anthropic',
 'Research Engineer, Alignment',
 'Help build Claude. The Alignment team is hiring engineers to design training pipelines, evaluations, and red-teaming infrastructure for frontier language models.

You will:
- Build large-scale data and training tools in Python and PyTorch.
- Design and run safety experiments on cutting-edge models.
- Collaborate with researchers to translate ideas into reliable code.

We value rigour, communication, and a genuine concern for AI safety.',
 '2026-05-19T12:00:00.000Z', 'saved', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000004',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Linear',
 'Senior Product Engineer',
 'Linear is hiring senior product engineers to ship beautiful, fast tools for software teams. We work in small, autonomous pods that own features end-to-end.

Expectations:
- Strong product taste — you sweat the millisecond and the pixel.
- Comfort across TypeScript, React, GraphQL, and Postgres.
- Experience designing offline-capable, sync-driven UIs.

This role is fully remote in EU/Americas timezones.',
 '2026-05-03T12:00:00.000Z', 'interviewing', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000005',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Supabase',
 'Senior Postgres Engineer',
 'Help us extend Postgres into the database-as-a-service of choice. Work on extensions, replication, and the multi-tenant control plane.

Responsibilities:
- Author and maintain Postgres extensions in C and pgrx (Rust).
- Improve high-availability and PITR for thousands of tenants.
- Contribute upstream patches when appropriate.

Required: deep Postgres internals, comfortable with C, async Rust a plus.',
 '2026-05-16T12:00:00.000Z', 'applied', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000006',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Cloudflare',
 'Senior Systems Engineer, Workers Runtime',
 'The Workers Runtime team builds workerd, the open-source V8-based runtime that powers Cloudflare Workers worldwide.

You will:
- Improve cold-start times, isolate isolation, and per-request memory bounds.
- Implement and refine Web standards (Fetch, Streams, WebSockets).
- Optimise the JS/Rust boundary for throughput and security.

We''re looking for engineers with strong C++ and systems backgrounds.',
 '2026-04-16T12:00:00.000Z', 'offer', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000007',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Railway',
 'Infrastructure Engineer',
 'Railway is building the deployment platform developers actually enjoy. We need engineers to push the limits of our scheduling, networking, and observability stacks.

Day-to-day:
- Operate and extend a multi-region Kubernetes-derived platform.
- Improve build pipelines, image caching, and zero-downtime deploys.
- Own incidents — we run lean and value strong operators.

Stack: Go, Rust, Postgres, Nix.',
 '2026-05-10T12:00:00.000Z', 'applied', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000008',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Resend',
 'Senior Backend Engineer',
 'Resend builds the email API developers love. Join a small team building the deliverability and analytics platform behind millions of transactional emails per day.

What you''ll do:
- Design SMTP and HTTP ingestion services in Go.
- Build feedback-loop, bounce, and reputation tracking systems.
- Tune Postgres for high-cardinality event workloads.

Required: distributed systems experience, attention to detail, and love for email standards.',
 '2026-05-12T12:00:00.000Z', 'interviewing', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000009',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Plaid',
 'Staff Engineer, Banking APIs',
 'Plaid connects consumers, banks, and developers. The Banking APIs group owns Auth, Balance, and Transactions — products integrated by thousands of fintechs.

Responsibilities:
- Lead architecture for high-availability OAuth and screen-scraping pipelines.
- Mentor senior engineers and partner with product on multi-quarter roadmaps.
- Drive reliability SLOs across a polyglot stack (Go, Python, Node).

10+ years experience required; financial services background a strong plus.',
 '2026-04-09T12:00:00.000Z', 'rejected', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000010',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Datadog',
 'Senior Site Reliability Engineer',
 'Datadog ingests trillions of data points per day. The Reliability Engineering org keeps that pipeline running across every region.

Responsibilities:
- Operate Kafka, Cassandra, and custom storage at extreme scale.
- Design chaos experiments and disaster-recovery drills.
- Build tooling to detect and remediate capacity issues automatically.

Stack: Go, Python, Kubernetes, eBPF.',
 '2026-04-23T12:00:00.000Z', 'withdrawn', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000011',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Notion',
 'Staff Engineer, Sync',
 'Notion''s sync engine powers real-time collaboration for tens of millions of users. Help us rewrite it for the next decade.

You will:
- Lead the design of an operational-transform / CRDT replacement layer.
- Profile and harden client and server hot paths.
- Define migration strategies for billions of existing blocks.

Required: deep experience with collaborative data structures and high-throughput Postgres/MySQL.',
 '2026-05-20T12:00:00.000Z', 'saved', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000012',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Figma',
 'Senior Performance Engineer',
 'Figma renders complex vector documents at 120fps in the browser. The Performance team makes that possible.

Expectations:
- Profile and optimise the C++/Wasm rendering pipeline.
- Improve cold-load, memory pressure, and multi-tab behaviour.
- Partner with platform teams on graphics APIs (WebGL, WebGPU).

Required: C++, browser internals, real-time graphics.',
 '2026-05-17T12:00:00.000Z', 'applied', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000013',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Replit',
 'AI Engineer, Agents',
 'Replit Agents writes, runs, and debugs full applications. Join the core team building the loop.

You will:
- Design tool-use protocols, sandboxed execution, and retrieval surfaces.
- Tune prompts, eval suites, and reward functions for code generation.
- Ship end-to-end product features behind feature flags.

Stack: TypeScript, Python, Go. LLM / agent experience required.',
 '2026-05-08T12:00:00.000Z', 'interviewing', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000014',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Modal',
 'Senior Distributed Systems Engineer',
 'Modal is the serverless platform for AI workloads. We''re hiring engineers to build the scheduler, container runtime, and storage layer.

Responsibilities:
- Improve cold-start of GPU workloads to sub-second.
- Design and operate a global object store with strong consistency.
- Build the gRPC control plane that orchestrates thousands of workers.

Stack: Rust, Python, gRPC, Linux internals.',
 '2026-05-18T12:00:00.000Z', 'saved', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000015',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Render',
 'Platform Engineer',
 'Render is the modern cloud for developers. The Platform team owns the scheduler, builder, and networking primitives.

What you''ll do:
- Operate Kubernetes across multiple regions and accounts.
- Build CI-grade build pipelines with caching and reproducibility.
- Improve internal abstractions for services, jobs, and cron.

Stack: Go, Kubernetes, Postgres, Terraform.',
 '2026-05-15T12:00:00.000Z', 'saved', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000016',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Fly.io',
 'Senior Network Engineer',
 'Fly.io runs workloads close to users in dozens of regions. The Network team owns Anycast, WireGuard mesh, and the proxy layer.

You will:
- Build and operate a global Anycast network with BGP peering.
- Improve our Rust-based proxy for TLS termination and request routing.
- Diagnose pathological behaviour across the public internet.

Required: deep networking (BGP, TCP, TLS), comfort with Rust or Go.',
 '2026-04-11T12:00:00.000Z', 'offer', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000017',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'PlanetScale',
 'Senior Database Engineer',
 'PlanetScale operates the largest Vitess deployments in the world. Help us push MySQL further.

Responsibilities:
- Improve query planning and routing in Vitess.
- Build observability for query performance across sharded clusters.
- Contribute upstream to Vitess and MySQL forks.

Required: deep MySQL internals, Go, experience operating large shards.',
 '2026-04-01T12:00:00.000Z', 'rejected', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000018',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Neon',
 'Storage Systems Engineer',
 'Neon is serverless Postgres with separated compute and storage. Join the Storage team building the page server and safekeeper.

What you''ll do:
- Improve the LSM-style page server written in Rust.
- Tune WAL ingestion, GC, and tenant isolation.
- Design migrations across thousands of tenants safely.

Required: Rust, deep filesystem/storage knowledge, Postgres internals.',
 '2026-05-11T12:00:00.000Z', 'applied', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000019',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'Sentry',
 'Senior Backend Engineer, Errors',
 'Sentry''s Errors product ingests billions of events daily. Help us scale the symbolication and grouping pipelines.

Responsibilities:
- Improve event ingestion in Rust and Python.
- Build grouping algorithms that handle noisy, mutating stack traces.
- Operate Kafka, Redis, and ClickHouse at high write throughput.

Required: distributed systems, perf instinct, comfortable across Rust and Python.',
 '2026-05-01T12:00:00.000Z', 'interviewing', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z'),

('a1000001-0000-4000-8000-000000000020',
 '3d0ac31c-7088-48df-a793-be19ec2447d8',
 'PostHog',
 'Senior Data Engineer',
 'PostHog is the all-in-one open-source product analytics platform. Join the Data team that owns our ClickHouse pipelines.

You will:
- Design schemas and queries for high-cardinality event workloads.
- Improve cost and performance of ClickHouse across clusters.
- Build cohort, funnel, and retention engines.

Required: deep ClickHouse, SQL, Python. Open-source contribution a plus.',
 '2026-03-27T12:00:00.000Z', 'rejected', '2026-06-01T21:00:00.000Z', '2026-06-01T21:00:00.000Z');
