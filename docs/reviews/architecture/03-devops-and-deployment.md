# Hotel-Ops-Suite DevOps and Deployment Architecture

## CI/CD pipeline

```text
Developer
   │
   ▼
Git Branch
   │
   ▼
Pull Request
   │
   ▼
┌─────────────────────────────────────────────┐
│ CI                                          │
│                                             │
│ Format → Lint → Unit Test → Integration     │
│ Test → Security Scan → Build                │
└──────────────────────┬──────────────────────┘
                       │
                    PASS?
                   /                      NO       YES
                 │         │
                 ▼         ▼
             Fix/PR     Artifact
                           │
                           ▼
                    ┌──────────────┐
                    │ CD / Deploy  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
            DEV         STAGING      PRODUCTION
```

## Deployment view

```text
                    PRODUCTION
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Frontend          API           Worker(s)
     Runtime         Runtime          Runtime
                         │              │
                         └──────┬───────┘
                                ▼
                           Database
                                │
                     ┌──────────┴─────────┐
                     ▼                    ▼
                  Storage               Backup
```

## Environment isolation

```text
Development
 ├── DB-DEV
 ├── Storage-DEV
 └── Secrets-DEV

Staging
 ├── DB-STAGING
 ├── Storage-STAGING
 └── Secrets-STAGING

Production
 ├── DB-PROD
 ├── Storage-PROD
 └── Secrets-PROD
```

Production data must not be casually copied into development.

## Secrets

```text
Application
    ↓
Configuration Provider
    ├── Environment configuration
    └── Secret store
```

Never commit secrets, API keys, passwords, tokens, or production credentials to Git.

## Release strategy

Recommended progression:

```text
Feature Branch
     ↓
PR
     ↓
CI
     ↓
Staging
     ↓
Validation
     ↓
Production
```

Production promotion should be controlled and auditable.

## Infrastructure principles

- Infrastructure should be reproducible where practical.
- Production configuration should be version-controlled without storing secrets.
- Deployments should be observable.
- Database migrations must be explicit and reversible where practical.
- Rollback procedures must be documented.
