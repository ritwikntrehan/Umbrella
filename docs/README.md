# Umbrella Spec Index

This repository keeps the authoritative architecture/specification files at the repository root for visibility:

- `SYSTEM_OVERVIEW.md`: system boundaries, components, and high-level flow.
- `CHANNELS.md`: channel definitions and scope.
- `DATA_CONTRACTS.md`: deterministic object contracts and intended data model boundaries.
- `BUILD_SEQUENCE.md`: phased implementation order.
- `OPERATIONS_STANDARDS.md`: orchestration, retry/idempotency, retention, SLOs, and required observability fields.

## How to use these docs during implementation

1. Treat root spec files as the source of truth.
2. Implement code in small slices that map directly to these documents.
3. Prefer adding TODOs for deferred phases instead of introducing speculative systems.
4. Update implementation notes (`IMPLEMENTATION_NOTES.md`) when a phase scaffold is completed.
