"""Seed the Railway DB with sample applications.

Usage:
    DATABASE_URL=... python -m scripts.seed [--reset]

The --reset flag deletes all rows from the applications table first.
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete

from app.database import AsyncSessionLocal, engine
from app.models import Application, ApplicationStatus

_BASE_DATE = datetime(2026, 5, 21, 12, 0, 0, tzinfo=UTC)


def _days_ago(n: int) -> datetime:
    return _BASE_DATE - timedelta(days=n)


SEED_DATA: list[dict] = [
    {
        "company": "Stripe",
        "title": "Staff Backend Engineer, Payments",
        "status": ApplicationStatus.INTERVIEWING,
        "applied_at": _days_ago(14),
        "description": (
            "We are looking for a Staff Backend Engineer to join the Payments "
            "Infrastructure team. You will design and operate the core ledger "
            "and idempotency layers that move billions of dollars per day.\n\n"
            "Responsibilities:\n"
            "- Own services written in Ruby and Go that process card and bank transactions.\n"
            "- Drive technical strategy around exactly-once delivery and partial failure recovery.\n"
            "- Partner with risk, compliance, and product to ship safe, observable systems.\n\n"
            "Requirements: 8+ years building distributed systems, deep Postgres experience, "
            "comfort with formal modelling (TLA+/Alloy a plus)."
        ),
    },
    {
        "company": "Vercel",
        "title": "Senior Full-stack Engineer, Next.js",
        "status": ApplicationStatus.APPLIED,
        "applied_at": _days_ago(7),
        "description": (
            "Join the Next.js core team to build the framework that powers millions of "
            "production apps. You'll work across the App Router, caching, and React "
            "Server Components.\n\n"
            "What you'll do:\n"
            "- Ship features end-to-end across compiler, runtime, and Vercel platform.\n"
            "- Improve build performance and DX for the open-source community.\n"
            "- Contribute to RFCs and engage with the wider React ecosystem.\n\n"
            "Required: Deep TypeScript, React 19, and Node internals. Bonus: Rust, "
            "Turbopack, edge runtimes."
        ),
    },
    {
        "company": "Anthropic",
        "title": "Research Engineer, Alignment",
        "status": ApplicationStatus.SAVED,
        "applied_at": _days_ago(2),
        "description": (
            "Help build Claude. The Alignment team is hiring engineers to design "
            "training pipelines, evaluations, and red-teaming infrastructure for "
            "frontier language models.\n\n"
            "You will:\n"
            "- Build large-scale data and training tools in Python and PyTorch.\n"
            "- Design and run safety experiments on cutting-edge models.\n"
            "- Collaborate with researchers to translate ideas into reliable code.\n\n"
            "We value rigour, communication, and a genuine concern for AI safety."
        ),
    },
    {
        "company": "Linear",
        "title": "Senior Product Engineer",
        "status": ApplicationStatus.INTERVIEWING,
        "applied_at": _days_ago(18),
        "description": (
            "Linear is hiring senior product engineers to ship beautiful, fast tools "
            "for software teams. We work in small, autonomous pods that own features "
            "end-to-end.\n\n"
            "Expectations:\n"
            "- Strong product taste — you sweat the millisecond and the pixel.\n"
            "- Comfort across TypeScript, React, GraphQL, and Postgres.\n"
            "- Experience designing offline-capable, sync-driven UIs.\n\n"
            "This role is fully remote in EU/Americas timezones."
        ),
    },
    {
        "company": "Supabase",
        "title": "Senior Postgres Engineer",
        "status": ApplicationStatus.APPLIED,
        "applied_at": _days_ago(5),
        "description": (
            "Help us extend Postgres into the database-as-a-service of choice. Work "
            "on extensions, replication, and the multi-tenant control plane.\n\n"
            "Responsibilities:\n"
            "- Author and maintain Postgres extensions in C and pgrx (Rust).\n"
            "- Improve high-availability and PITR for thousands of tenants.\n"
            "- Contribute upstream patches when appropriate.\n\n"
            "Required: deep Postgres internals, comfortable with C, async Rust a plus."
        ),
    },
    {
        "company": "Cloudflare",
        "title": "Senior Systems Engineer, Workers Runtime",
        "status": ApplicationStatus.OFFER,
        "applied_at": _days_ago(35),
        "description": (
            "The Workers Runtime team builds workerd, the open-source V8-based "
            "runtime that powers Cloudflare Workers worldwide.\n\n"
            "You will:\n"
            "- Improve cold-start times, isolate isolation, and per-request memory bounds.\n"
            "- Implement and refine Web standards (Fetch, Streams, WebSockets).\n"
            "- Optimise the JS/Rust boundary for throughput and security.\n\n"
            "We're looking for engineers with strong C++ and systems backgrounds."
        ),
    },
    {
        "company": "Railway",
        "title": "Infrastructure Engineer",
        "status": ApplicationStatus.APPLIED,
        "applied_at": _days_ago(11),
        "description": (
            "Railway is building the deployment platform developers actually enjoy. "
            "We need engineers to push the limits of our scheduling, networking, and "
            "observability stacks.\n\n"
            "Day-to-day:\n"
            "- Operate and extend a multi-region Kubernetes-derived platform.\n"
            "- Improve build pipelines, image caching, and zero-downtime deploys.\n"
            "- Own incidents — we run lean and value strong operators.\n\n"
            "Stack: Go, Rust, Postgres, Nix."
        ),
    },
    {
        "company": "Resend",
        "title": "Senior Backend Engineer",
        "status": ApplicationStatus.INTERVIEWING,
        "applied_at": _days_ago(9),
        "description": (
            "Resend builds the email API developers love. Join a small team building "
            "the deliverability and analytics platform behind millions of "
            "transactional emails per day.\n\n"
            "What you'll do:\n"
            "- Design SMTP and HTTP ingestion services in Go.\n"
            "- Build feedback-loop, bounce, and reputation tracking systems.\n"
            "- Tune Postgres for high-cardinality event workloads.\n\n"
            "Required: distributed systems experience, attention to detail, and "
            "love for email standards."
        ),
    },
    {
        "company": "Plaid",
        "title": "Staff Engineer, Banking APIs",
        "status": ApplicationStatus.REJECTED,
        "applied_at": _days_ago(42),
        "description": (
            "Plaid connects consumers, banks, and developers. The Banking APIs group "
            "owns Auth, Balance, and Transactions — products integrated by thousands "
            "of fintechs.\n\n"
            "Responsibilities:\n"
            "- Lead architecture for high-availability OAuth and screen-scraping pipelines.\n"
            "- Mentor senior engineers and partner with product on multi-quarter roadmaps.\n"
            "- Drive reliability SLOs across a polyglot stack (Go, Python, Node).\n\n"
            "10+ years experience required; financial services background a strong plus."
        ),
    },
    {
        "company": "Datadog",
        "title": "Senior Site Reliability Engineer",
        "status": ApplicationStatus.WITHDRAWN,
        "applied_at": _days_ago(28),
        "description": (
            "Datadog ingests trillions of data points per day. The Reliability "
            "Engineering org keeps that pipeline running across every region.\n\n"
            "Responsibilities:\n"
            "- Operate Kafka, Cassandra, and custom storage at extreme scale.\n"
            "- Design chaos experiments and disaster-recovery drills.\n"
            "- Build tooling to detect and remediate capacity issues automatically.\n\n"
            "Stack: Go, Python, Kubernetes, eBPF."
        ),
    },
    {
        "company": "Notion",
        "title": "Staff Engineer, Sync",
        "status": ApplicationStatus.SAVED,
        "applied_at": _days_ago(1),
        "description": (
            "Notion's sync engine powers real-time collaboration for tens of millions "
            "of users. Help us rewrite it for the next decade.\n\n"
            "You will:\n"
            "- Lead the design of an operational-transform / CRDT replacement layer.\n"
            "- Profile and harden client and server hot paths.\n"
            "- Define migration strategies for billions of existing blocks.\n\n"
            "Required: deep experience with collaborative data structures and high-throughput "
            "Postgres/MySQL."
        ),
    },
    {
        "company": "Figma",
        "title": "Senior Performance Engineer",
        "status": ApplicationStatus.APPLIED,
        "applied_at": _days_ago(4),
        "description": (
            "Figma renders complex vector documents at 120fps in the browser. The "
            "Performance team makes that possible.\n\n"
            "Expectations:\n"
            "- Profile and optimise the C++/Wasm rendering pipeline.\n"
            "- Improve cold-load, memory pressure, and multi-tab behaviour.\n"
            "- Partner with platform teams on graphics APIs (WebGL, WebGPU).\n\n"
            "Required: C++, browser internals, real-time graphics."
        ),
    },
    {
        "company": "Replit",
        "title": "AI Engineer, Agents",
        "status": ApplicationStatus.INTERVIEWING,
        "applied_at": _days_ago(13),
        "description": (
            "Replit Agents writes, runs, and debugs full applications. Join the core "
            "team building the loop.\n\n"
            "You will:\n"
            "- Design tool-use protocols, sandboxed execution, and retrieval surfaces.\n"
            "- Tune prompts, eval suites, and reward functions for code generation.\n"
            "- Ship end-to-end product features behind feature flags.\n\n"
            "Stack: TypeScript, Python, Go. LLM / agent experience required."
        ),
    },
    {
        "company": "Modal",
        "title": "Senior Distributed Systems Engineer",
        "status": ApplicationStatus.SAVED,
        "applied_at": _days_ago(3),
        "description": (
            "Modal is the serverless platform for AI workloads. We're hiring engineers "
            "to build the scheduler, container runtime, and storage layer.\n\n"
            "Responsibilities:\n"
            "- Improve cold-start of GPU workloads to sub-second.\n"
            "- Design and operate a global object store with strong consistency.\n"
            "- Build the gRPC control plane that orchestrates thousands of workers.\n\n"
            "Stack: Rust, Python, gRPC, Linux internals."
        ),
    },
    {
        "company": "Render",
        "title": "Platform Engineer",
        "status": ApplicationStatus.SAVED,
        "applied_at": _days_ago(6),
        "description": (
            "Render is the modern cloud for developers. The Platform team owns the "
            "scheduler, builder, and networking primitives.\n\n"
            "What you'll do:\n"
            "- Operate Kubernetes across multiple regions and accounts.\n"
            "- Build CI-grade build pipelines with caching and reproducibility.\n"
            "- Improve internal abstractions for services, jobs, and cron.\n\n"
            "Stack: Go, Kubernetes, Postgres, Terraform."
        ),
    },
    {
        "company": "Fly.io",
        "title": "Senior Network Engineer",
        "status": ApplicationStatus.OFFER,
        "applied_at": _days_ago(40),
        "description": (
            "Fly.io runs workloads close to users in dozens of regions. The Network "
            "team owns Anycast, WireGuard mesh, and the proxy layer.\n\n"
            "You will:\n"
            "- Build and operate a global Anycast network with BGP peering.\n"
            "- Improve our Rust-based proxy for TLS termination and request routing.\n"
            "- Diagnose pathological behaviour across the public internet.\n\n"
            "Required: deep networking (BGP, TCP, TLS), comfort with Rust or Go."
        ),
    },
    {
        "company": "PlanetScale",
        "title": "Senior Database Engineer",
        "status": ApplicationStatus.REJECTED,
        "applied_at": _days_ago(50),
        "description": (
            "PlanetScale operates the largest Vitess deployments in the world. Help "
            "us push MySQL further.\n\n"
            "Responsibilities:\n"
            "- Improve query planning and routing in Vitess.\n"
            "- Build observability for query performance across sharded clusters.\n"
            "- Contribute upstream to Vitess and MySQL forks.\n\n"
            "Required: deep MySQL internals, Go, experience operating large shards."
        ),
    },
    {
        "company": "Neon",
        "title": "Storage Systems Engineer",
        "status": ApplicationStatus.APPLIED,
        "applied_at": _days_ago(10),
        "description": (
            "Neon is serverless Postgres with separated compute and storage. Join the "
            "Storage team building the page server and safekeeper.\n\n"
            "What you'll do:\n"
            "- Improve the LSM-style page server written in Rust.\n"
            "- Tune WAL ingestion, GC, and tenant isolation.\n"
            "- Design migrations across thousands of tenants safely.\n\n"
            "Required: Rust, deep filesystem/storage knowledge, Postgres internals."
        ),
    },
    {
        "company": "Sentry",
        "title": "Senior Backend Engineer, Errors",
        "status": ApplicationStatus.INTERVIEWING,
        "applied_at": _days_ago(20),
        "description": (
            "Sentry's Errors product ingests billions of events daily. Help us scale "
            "the symbolication and grouping pipelines.\n\n"
            "Responsibilities:\n"
            "- Improve event ingestion in Rust and Python.\n"
            "- Build grouping algorithms that handle noisy, mutating stack traces.\n"
            "- Operate Kafka, Redis, and ClickHouse at high write throughput.\n\n"
            "Required: distributed systems, perf instinct, comfortable across Rust and Python."
        ),
    },
    {
        "company": "PostHog",
        "title": "Senior Data Engineer",
        "status": ApplicationStatus.REJECTED,
        "applied_at": _days_ago(55),
        "description": (
            "PostHog is the all-in-one open-source product analytics platform. Join the "
            "Data team that owns our ClickHouse pipelines.\n\n"
            "You will:\n"
            "- Design schemas and queries for high-cardinality event workloads.\n"
            "- Improve cost and performance of ClickHouse across clusters.\n"
            "- Build cohort, funnel, and retention engines.\n\n"
            "Required: deep ClickHouse, SQL, Python. Open-source contribution a plus."
        ),
    },
]


async def _seed(reset: bool) -> int:
    async with AsyncSessionLocal() as session:
        if reset:
            await session.execute(delete(Application))
            await session.commit()

        rows = [
            Application(
                company=entry["company"],
                title=entry["title"],
                description=entry["description"],
                applied_at=entry["applied_at"],
                status=entry["status"],
            )
            for entry in SEED_DATA
        ]
        session.add_all(rows)
        await session.commit()

        return len(rows)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the SpecFit applications table.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all existing applications before seeding.",
    )
    args = parser.parse_args()

    inserted = await _seed(reset=args.reset)
    print(f"Inserted {inserted} applications (reset={args.reset}).")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
