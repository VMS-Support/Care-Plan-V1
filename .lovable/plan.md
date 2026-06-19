## Refactor Vital Signs → 8 Dedicated Observation Modules

Split the current monolithic `RecordVitalDialog` into eight independent observation modules. Each module owns its own form, history table, trend charts, alerts, audit trail, scheduling, and reports.

### 1. Modules

| # | Module | Slug | Key fields |
|---|---|---|---|
| 1 | Weight & Nutrition | `weight` | weight, height, MUAC, appetite, notes |
| 2 | NEWS2 / Clinical | `news2` | temp, pulse, RR, BP, SpO2, O2 + litres, ACVPU |
| 3 | Blood Glucose | `glucose` | glucose, meal context, insulin, notes |
| 4 | Pain | `pain` | score, location, type, duration, intervention, outcome |
| 5 | Fluid Balance | `fluid` | intake (oral/PEG/other), output (urine/vomit/drainage/other) |
| 6 | Bowel | `bowel` | motion, Bristol scale, amount, notes |
| 7 | Urinary | `urinary` | voided, incontinent episode, catheter output, colour, odour |
| 8 | Wounds | `wound` | type, location, L×W×D, exudate, dressing, photo, notes |

BMI and BMI category remain **derived at read time** from weight + most-recent height (existing rule preserved).

### 2. Data model (`src/lib/care/types.ts`)

Replace the single `VitalSign` type with a discriminated union `Observation`:

```ts
type ObservationBase = {
  id; residentId; type: ObservationType;
  date; time; recordedAt;
  recordedByUserId; recordedByName; recordedByRole;
  createdAt; lastModifiedAt; modificationReason?;
  deletedAt?; deletedReason?;
  history: { at; byName; action: 'created'|'edited'|'deleted'; reason? }[];
};
```

Plus one payload type per module (e.g. `WeightObservation`, `News2Observation`, …). `ObservationPlan` extended to per-type frequency.

Existing `VitalSign` kept as a deprecated alias temporarily — migrated by mapping old records to NEWS2/Weight/Glucose/Pain/Fluid observations on store init so historic data isn't lost.

### 3. Library (`src/lib/care/observations/`)

One file per module: `weight.ts`, `news2.ts`, `glucose.ts`, `pain.ts`, `fluid.ts`, `bowel.ts`, `urinary.ts`, `wound.ts`. Each exports:
- `derive<Type>Alerts(obs[])` — thresholds per spec (e.g. NEWS2 ≥5 medium / ≥7 high; glucose <4 hypo / >11 hyper; weight loss 5/10/15%; no bowel >3 days; etc.)
- `trend<Type>(obs[])` — windowed aggregates for charts
- `complianceFor(planItem, obs[])` — due/overdue/missed status

Existing `vitals.ts` slimmed to shared helpers (`calcBMI`, `bmiCategory`, `calcNEWS2`, ACVPU enum, formatters) and re-exports.

### 4. Store (`src/lib/care/store.tsx`)

- State: `observations: Observation[]`, `observationPlans` (per-type), `clinicalAlerts`.
- Actions: `recordObservation(payload)`, `updateObservation(id, patch, reason)`, `softDeleteObservation(id, reason)`, `setObservationPlan(residentId, type, frequency)`, `acknowledgeClinicalAlert`, `addEscalationNote`.
- Selectors per type: `getObservations(residentId, type)`, `getLatest(residentId, type)`, `getDueByType`, `getOverdueByType`, `getComplianceByType`.
- Migration shim: on first load, fold legacy `vitals[]` into typed `observations[]`.

### 5. Permissions (`src/lib/care/permissions.ts`)

Replace `vital.*` actions with `observation.view|record|edit|delete|comment|audit|escalate` (same role mapping). Old `vital.*` kept as aliases mapping to new actions to avoid breaking existing callers in one pass.

### 6. UI — shared components (`src/components/care/observations/`)

- `ObservationFormShell` — date/time/notes/audit footer wrapper used by every module's dialog.
- `ObservationHistoryTable<T>` — generic history table with columns prop + soft-delete + edit dialog (reason required).
- `ObservationTrendChart` — recharts wrapper accepting a metric selector.
- `ObservationAlertList` — per-module alert panel with acknowledge/escalate.
- `ObservationComplianceBadge` — pulls per-type compliance.

### 7. UI — per-module dialogs (one per module)

`RecordWeightDialog`, `RecordNews2Dialog`, `RecordGlucoseDialog`, `RecordPainDialog`, `RecordFluidDialog`, `RecordBowelDialog`, `RecordUrinaryDialog`, `RecordWoundDialog`. Each shows ONLY its own fields plus the audit footer. Live BMI in Weight; live NEWS2 in News2; live balance in Fluid.

### 8. Routes

```
/observations                  → Observation Dashboard (8 cards)
/observations/weight           → list + dashboard for type
/observations/news2
/observations/glucose
/observations/pain
/observations/fluid
/observations/bowel
/observations/urinary
/observations/wounds
/observations/audit            → unified audit (filter by type)

/residents/$id/observations    → tabbed view (Weight | NEWS2 | Glucose | Pain | Fluid | Bowel | Urinary | Wounds)
```

Each per-type route shows: cards (residents requiring review, alerts, overdue), table of recent entries, link into resident-level view.

`/vitals` and `/vitals/audit` redirect to `/observations` and `/observations/audit`. The existing resident `/residents/$id/vitals` redirects to `/residents/$id/observations`. Sidebar entry "Vitals" renamed to "Observations".

### 9. Resident profile integration

`src/routes/residents.$id.tsx` Vitals tab → "Clinical Observations" tab pointing at new tabbed sub-route. `ClinicalSnapshot.tsx` updated to pull latest per-type observations (weight, news2, glucose, pain) and show per-type alert chips.

### 10. Scheduling & compliance

`ObservationPlan` becomes `{ residentId, items: { type, frequency, required, notes }[] }`. Per-shift frequencies added (`per_shift`, `before_meals`, `every_shift`). Dashboard cards show Due / Overdue / Completed / Compliance % per type.

### 11. Audit

Every observation stores `history[]` of create/edit/delete events with user, role, timestamp, reason. `/observations/audit` shows a flat sortable/filterable view across all types (type filter, date range, user).

### 12. Out of scope (explicit)

- Photo upload storage (Wound photo field shows URL input only; real upload requires Lovable Cloud — flag to user).
- E-signature, PDF report export, device integration.
- Auto-creation of assessments or auto-scheduling of reassessments (preserves earlier rule).

### Files touched (high level)

- **New**: `src/lib/care/observations/{weight,news2,glucose,pain,fluid,bowel,urinary,wound}.ts`, `src/components/care/observations/*` (shell + 8 dialogs + shared components), `src/routes/observations.tsx`, `src/routes/observations.{weight,news2,glucose,pain,fluid,bowel,urinary,wounds,audit}.tsx`, `src/routes/residents.$id.observations.tsx`.
- **Edited**: `src/lib/care/types.ts`, `src/lib/care/store.tsx`, `src/lib/care/permissions.ts`, `src/lib/care/vitals.ts` (slimmed), `src/components/care/ClinicalSnapshot.tsx`, `src/components/layout/AppShell.tsx` (sidebar), `src/routes/residents.$id.tsx`.
- **Redirects / removed UI**: `src/routes/vitals.tsx`, `src/routes/vitals.audit.tsx`, `src/routes/residents.$id.vitals.tsx` become thin redirects. Legacy `RecordVitalDialog` deleted after migration.

### Question before I build

Wound photos require file storage. Do you want me to:
**(A)** Ship Wounds with a photo-URL text field only now (no upload), or
**(B)** Enable Lovable Cloud and wire real photo uploads as part of this change?
