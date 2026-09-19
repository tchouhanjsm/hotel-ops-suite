# Hotel-Ops-Suite Architecture Overview

**Status:** Living architecture blueprint  
**Version:** 1.0  
**Review date:** 2026-09-17

## Purpose

This document is the entry point for the Hotel-Ops-Suite architecture. It separates business architecture, abstractions, technology implementation, and operational delivery.

## Architecture Model

```text
PRODUCT / DOMAIN
      ↓
SYSTEM & CONTAINER ARCHITECTURE
      ↓
APPLICATION / DOMAIN BOUNDARIES
      ↓
ABSTRACTION / PORTS
      ↓
IMPLEMENTATIONS / ADAPTERS
      ↓
INFRASTRUCTURE
      ↓
DEPLOYMENT & OPERATIONS
```

## Core principle

**Architecture defines responsibilities and boundaries. Frameworks implement those responsibilities.**

A framework must not become the architecture.

## Primary views

| View | Answers |
|---|---|
| System Context | Who/what interacts with Hotel-Ops-Suite? |
| Container | What deployable/runtime units exist? |
| Domain | What business capabilities exist? |
| Component | How is each capability internally structured? |
| Abstraction | Which interfaces isolate the core from technology? |
| Technology | Which frameworks/libraries implement each boundary? |
| Deployment | Where does each component run? |
| DevOps | How does code move from commit to production? |
| Observability | How do we know what the system is doing? |
| Security | How are identity, access and secrets handled? |

## Architectural style

Start with a **modular monolith** unless a concrete requirement justifies service extraction.

The system should have strong module boundaries even when modules run in one deployment unit.

## Current / Planned / Future

Every architectural component should be labelled:

- **CURRENT**: implemented and in use
- **PLANNED**: approved direction, not yet implemented
- **FUTURE**: extension point, not currently required

## Architecture ownership

The architecture process is collaborative:

```text
Product / Operations / UX / QA / Developer / DevOps / Security
                         ↓
                  Architecture Review
                         ↓
                Decision + Trade-offs
                         ↓
                     Blueprint
                         ↓
                       ADR
                         ↓
                   Implementation
```

The architect owns the blueprint and trade-offs, while engineering disciplines provide evidence, constraints, and implementation feedback.
