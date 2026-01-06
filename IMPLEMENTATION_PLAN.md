# Implementation Plan - React Query & Zod

## Goal
Migrate `patientService` and `PatientDataTable` to use TanStack Query and Zod validation.

## Steps
1. [x] Install `@tanstack/react-query`, `@tanstack/react-query-devtools`, and `zod`.
2. [ ] Create `ReactQueryProvider` component.
3. [ ] Wrap root layout with `ReactQueryProvider`.
4. [ ] Create Zod schemas at `src/schemas/patientSchema.ts`.
5. [ ] Create custom hooks for patients (`usePatients`, `usePatientMutations`).
6. [ ] Refactor `PatientDataTable.tsx` to use these hooks.
7. [ ] Verify removal of `window.location.reload()`.
