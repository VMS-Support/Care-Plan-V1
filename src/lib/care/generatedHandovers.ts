/**
 * Client-side prototype only. Replace with an authenticated server repository
 * before production use. localStorage provides no secure retention, audit
 * integrity, cross-device concurrency, or controlled clinical-record deletion.
 */
export type GeneratedHandoverStatus = "draft" | "finalised" | "superseded" | "cancelled";
export interface GeneratedHandoverItem {
  id: string;
  handoverId: string;
  residentSectionId: string;
  residentId: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceEventId?: string;
  occurredAt: string;
  title: string;
  summary: string;
  sectionType: string;
  authorName?: string;
  systemGenerated: boolean;
  manuallyAdded: boolean;
  important: boolean;
  followUpRequired: boolean;
  excluded: boolean;
  sortOrder: number;
}
export interface GeneratedHandoverResidentSection {
  id: string;
  handoverId: string;
  residentId: string;
  residentName: string;
  preferredName?: string;
  room?: string;
  wing?: string;
  residentIdentifier?: string;
  shiftSummary: string;
  nextShiftNotes: string;
  sortOrder: number;
}
export interface HandoverPdfMetadata {
  fileName: string;
  generatedAt: string;
  generatedBy: string;
  version: number;
}
export interface GeneratedHandover {
  id: string;
  referenceNumber: string;
  status: GeneratedHandoverStatus;
  shiftType: "morning" | "afternoon" | "night" | "custom";
  periodFrom: string;
  periodTo: string;
  nursingHomeId: string;
  nursingHomeName: string;
  wingId?: string;
  wingName?: string;
  generatedByUserId: string;
  generatedByName: string;
  generatedByRole: string;
  generatedAt: string;
  finalisedBy?: string;
  finalisedAt?: string;
  versionNumber: number;
  versionCreatedBy?: string;
  versionCreatedAt?: string;
  supersedesHandoverId?: string;
  supersededByHandoverId?: string;
  correctionReason?: string;
  residentIds: string[];
  residentCount: number;
  createdAt: string;
  updatedAt: string;
  sections: GeneratedHandoverResidentSection[];
  items: GeneratedHandoverItem[];
  cancellationReason?: string;
  cancellationNotes?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  archived: boolean;
  archivedBy?: string;
  archivedAt?: string;
  archiveReason?: string;
  restoredBy?: string;
  restoredAt?: string;
  pdfFileName?: string;
  pdfGeneratedAt?: string;
  pdfGeneratedBy?: string;
  pdfVersion?: number;
}

export interface HandoverRepository {
  createDraft(value: GeneratedHandover): GeneratedHandover;
  getById(id: string): GeneratedHandover | undefined;
  list(): GeneratedHandover[];
  listByResident(residentId: string): GeneratedHandover[];
  listVersions(referenceNumber: string): GeneratedHandover[];
  getCurrentVersion(referenceNumber: string): GeneratedHandover | undefined;
  updateDraft(value: GeneratedHandover): GeneratedHandover;
  finalise(id: string, actor?: string): GeneratedHandover;
  cancel(id: string, reason: string, notes?: string, actor?: string): GeneratedHandover;
  archive(id: string, reason?: string, actor?: string): GeneratedHandover;
  restore(id: string, actor?: string): GeneratedHandover;
  deleteDraft(id: string): void;
  createCorrectedVersion(
    id: string,
    correctionReason: string,
    actor: string,
    actorId?: string,
  ): GeneratedHandover;
  savePdfMetadata(id: string, metadata: HandoverPdfMetadata): GeneratedHandover;
  getPdfMetadata(id: string): HandoverPdfMetadata | undefined;
}

const KEY = "oritas.generated-shift-handovers.v1";
const normalise = (value: GeneratedHandover): GeneratedHandover => ({
  ...value,
  archived: value.archived ?? false,
  versionNumber: value.versionNumber || 1,
  versionCreatedAt: value.versionCreatedAt || value.createdAt,
  versionCreatedBy: value.versionCreatedBy || value.generatedByName,
});
const load = (): GeneratedHandover[] =>
  typeof window === "undefined"
    ? []
    : (JSON.parse(window.localStorage.getItem(KEY) || "[]") as GeneratedHandover[]).map(normalise);
const save = (items: GeneratedHandover[]) =>
  window.localStorage.setItem(KEY, JSON.stringify(items));
const required = (items: GeneratedHandover[], id: string) => {
  const item = items.find((value) => value.id === id);
  if (!item) throw new Error("Handover not found.");
  return item;
};
const replace = (items: GeneratedHandover[], value: GeneratedHandover) =>
  items.map((item) => (item.id === value.id ? value : item));

export const generatedHandoverRepository: HandoverRepository = {
  createDraft(value) {
    const all = load();
    if (all.some((item) => item.id === value.id)) throw new Error("Handover already exists.");
    const next = normalise(value);
    save([next, ...all]);
    return next;
  },
  getById: (id) => load().find((item) => item.id === id),
  list: () =>
    load().sort(
      (a, b) => b.generatedAt.localeCompare(a.generatedAt) || b.versionNumber - a.versionNumber,
    ),
  listByResident: (residentId) =>
    load()
      .filter((item) => item.residentIds.includes(residentId))
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)),
  listVersions: (referenceNumber) =>
    load()
      .filter((item) => item.referenceNumber === referenceNumber)
      .sort((a, b) => b.versionNumber - a.versionNumber),
  getCurrentVersion(referenceNumber) {
    return (
      this.listVersions(referenceNumber).find(
        (item) => item.status === "finalised" && !item.archived,
      ) || this.listVersions(referenceNumber)[0]
    );
  },
  updateDraft(value) {
    const all = load();
    const current = required(all, value.id);
    if (current.status !== "draft") throw new Error("Only drafts can be edited.");
    const next = normalise({ ...value, updatedAt: new Date().toISOString() });
    save(replace(all, next));
    return next;
  },
  finalise(id, actor) {
    const all = load();
    const current = required(all, id);
    if (current.status !== "draft") throw new Error("Handover is already finalised or read-only.");
    const now = new Date().toISOString();
    const next = {
      ...current,
      status: "finalised" as const,
      finalisedAt: now,
      finalisedBy: actor || current.generatedByName,
      updatedAt: now,
    };
    const updated = all.map((item) =>
      item.id === id
        ? next
        : item.id === current.supersedesHandoverId
          ? { ...item, status: "superseded" as const, supersededByHandoverId: id, updatedAt: now }
          : item,
    );
    save(updated);
    return next;
  },
  cancel(id, reason, notes, actor = "Current user") {
    if (!reason.trim()) throw new Error("A cancellation reason is required.");
    const all = load();
    const current = required(all, id);
    if (current.status !== "finalised")
      throw new Error("Only a current finalised handover can be cancelled.");
    const now = new Date().toISOString();
    const next = {
      ...current,
      status: "cancelled" as const,
      cancellationReason: reason.trim(),
      cancellationNotes: notes?.trim(),
      cancelledBy: actor,
      cancelledAt: now,
      updatedAt: now,
    };
    save(replace(all, next));
    return next;
  },
  archive(id, reason, actor = "Current user") {
    const all = load();
    const current = required(all, id);
    if (current.archived) throw new Error("Handover is already archived.");
    const now = new Date().toISOString();
    const next = {
      ...current,
      archived: true,
      archivedBy: actor,
      archivedAt: now,
      archiveReason: reason?.trim(),
      updatedAt: now,
    };
    save(replace(all, next));
    return next;
  },
  restore(id, actor = "Current user") {
    const all = load();
    const current = required(all, id);
    if (!current.archived) throw new Error("Handover is not archived.");
    const now = new Date().toISOString();
    const next = {
      ...current,
      archived: false,
      restoredBy: actor,
      restoredAt: now,
      updatedAt: now,
    };
    save(replace(all, next));
    return next;
  },
  deleteDraft(id) {
    const all = load();
    const current = required(all, id);
    if (current.status !== "draft")
      throw new Error("Only draft handovers can be permanently deleted.");
    save(all.filter((item) => item.id !== id));
  },
  createCorrectedVersion(id, correctionReason, actor, actorId) {
    if (!correctionReason.trim()) throw new Error("A correction reason is required.");
    const all = load();
    const source = required(all, id);
    if (source.status === "draft") throw new Error("Drafts cannot have corrected versions.");
    const existing = all.find(
      (item) => item.supersedesHandoverId === id && item.status === "draft",
    );
    if (existing) throw new Error("A corrected draft already exists.");
    const now = new Date().toISOString();
    const nextId = `gh-${crypto.randomUUID()}`;
    const nextVersion =
      Math.max(
        ...all
          .filter((item) => item.referenceNumber === source.referenceNumber)
          .map((item) => item.versionNumber),
        source.versionNumber,
      ) + 1;
    const sectionIds = new Map(
      source.sections.map((section, index) => [section.id, `${nextId}-section-${index + 1}`]),
    );
    const next: GeneratedHandover = {
      ...source,
      id: nextId,
      status: "draft",
      archived: false,
      versionNumber: nextVersion,
      supersedesHandoverId: source.id,
      supersededByHandoverId: undefined,
      correctionReason: correctionReason.trim(),
      generatedByName: actor,
      generatedByUserId: actorId || source.generatedByUserId,
      generatedAt: now,
      versionCreatedBy: actor,
      versionCreatedAt: now,
      finalisedAt: undefined,
      finalisedBy: undefined,
      cancelledAt: undefined,
      cancelledBy: undefined,
      cancellationReason: undefined,
      cancellationNotes: undefined,
      archivedAt: undefined,
      archivedBy: undefined,
      archiveReason: undefined,
      restoredAt: undefined,
      restoredBy: undefined,
      pdfFileName: undefined,
      pdfGeneratedAt: undefined,
      pdfGeneratedBy: undefined,
      pdfVersion: undefined,
      createdAt: now,
      updatedAt: now,
      sections: source.sections.map((section) => ({
        ...section,
        id: sectionIds.get(section.id)!,
        handoverId: nextId,
      })),
      items: source.items.map((item, index) => ({
        ...item,
        id: `${nextId}-item-${index + 1}`,
        handoverId: nextId,
        residentSectionId: sectionIds.get(item.residentSectionId)!,
      })),
    };
    save([next, ...all]);
    return next;
  },
  savePdfMetadata(id, metadata) {
    const all = load();
    const current = required(all, id);
    const next = {
      ...current,
      pdfFileName: metadata.fileName,
      pdfGeneratedAt: metadata.generatedAt,
      pdfGeneratedBy: metadata.generatedBy,
      pdfVersion: metadata.version,
      updatedAt: new Date().toISOString(),
    };
    save(replace(all, next));
    return next;
  },
  getPdfMetadata(id) {
    const item = this.getById(id);
    return item?.pdfFileName && item.pdfGeneratedAt && item.pdfGeneratedBy
      ? {
          fileName: item.pdfFileName,
          generatedAt: item.pdfGeneratedAt,
          generatedBy: item.pdfGeneratedBy,
          version: item.pdfVersion || item.versionNumber,
        }
      : undefined;
  },
};
