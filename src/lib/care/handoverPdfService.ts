import { jsPDF } from "jspdf";
import {
  generatedHandoverRepository,
  type GeneratedHandover,
  type GeneratedHandoverItem,
  type GeneratedHandoverResidentSection,
} from "./generatedHandovers";

const clean = (value: string) =>
  value
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
const date = (value: string) =>
  new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" }).format(new Date(value));
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
const time = (value: string) =>
  new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(value),
  );
const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const displayRole = (value: string) => {
  const normalised = value
    .trim()
    .toLowerCase()
    .replace(/[ _-]+/g, " ");
  if (["don", "director of nursing"].includes(normalised)) return "Director of Nursing";
  return titleCase(value);
};
const clinicalTitle = (value: string) => {
  const text = value.trim().replace(/\s+/g, " ");
  const acronyms = new Set(["mmse", "mna", "news", "news2", "must", "adls", "mdt"]);
  return text
    .split(" ")
    .map((word, index) =>
      acronyms.has(word.toLowerCase())
        ? word.toUpperCase()
        : index === 0
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word,
    )
    .join(" ")
    .replace(
      /^Incident:\s*([^()]+)(?:\s*\([^)]*\))?/i,
      (_, name: string) => `${name.trim()} incident`,
    );
};
const watermark = (handover: GeneratedHandover) =>
  handover.archived
    ? "ARCHIVED"
    : handover.status === "draft"
      ? "DRAFT"
      : handover.status === "cancelled"
        ? "CANCELLED"
        : handover.status === "superseded"
          ? "SUPERSEDED"
          : undefined;
const sectionOrder = [
  "Daily Notes and Care Delivered",
  "Assessments and Observations",
  "Care Plans and Care Actions",
  "Medication Related Notes",
  "Incidents and Escalations",
  "Outstanding or Follow-Up Items",
  "Other Clinical Activity",
];
const clinicalSectionTitle = (value: string) =>
  value === "Care Plans and Care Actions"
    ? "Care Plan Updates & Care Actions"
    : value === "Outstanding or Follow-Up Items"
      ? "Outstanding Actions"
      : value.replace(" and ", " & ");
const withoutDuplicateRecorder = (summary: string, author?: string) =>
  author
    ? summary
        .replace(
          new RegExp(
            `(?:\\s*[·—-]?\\s*)?(?:Recorded|Completed|Updated) by:?\\s*${author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.?`,
            "ig",
          ),
          "",
        )
        .trim()
    : summary;
const isBirthday = (section: GeneratedHandoverResidentSection, from: string, to: string) => {
  if (!section.residentDateOfBirth) return false;
  const dob = new Date(section.residentDateOfBirth);
  const start = new Date(from),
    end = new Date(to);
  return [start, end].some(
    (day) => dob.getUTCMonth() === day.getUTCMonth() && dob.getUTCDate() === day.getUTCDate(),
  );
};

async function imageData(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Image could not load.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Image could not load."));
    reader.readAsDataURL(blob);
  });
}
const logoData = async () => {
  try {
    return await imageData("/oritas-favicon.png");
  } catch {
    throw new Error("ORITAS logo could not load.");
  }
};

export const handoverPdfService = {
  getPdfFileName(h: GeneratedHandover) {
    return `${clean(["ORITAS-Handover", h.nursingHomeName, h.wingName, h.periodFrom.slice(0, 10), titleCase(h.shiftType), h.referenceNumber, `v${h.versionNumber}`].filter(Boolean).join("-"))}.pdf`;
  },
  async generatePdfBlob(handover: GeneratedHandover): Promise<Blob> {
    const logo = await logoData();
    const photos = new Map<string, string>();
    await Promise.all(
      handover.sections.map(async (section) => {
        if (!section.residentPhotoUrl) return;
        try {
          photos.set(section.id, await imageData(section.residentPhotoUrl));
        } catch {
          /* clean placeholder is intentional */
        }
      }),
    );
    const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" });
    const W = 210,
      H = 297,
      L = 16,
      R = 194,
      CONTENT = R - L,
      BOTTOM = 260;
    const teal: [number, number, number] = [36, 138, 159],
      ink: [number, number, number] = [25, 30, 38],
      muted: [number, number, number] = [82, 91, 105],
      line: [number, number, number] = [190, 198, 209];
    let y = 15;
    let currentResident = "";
    const newPage = (continuation?: string) => {
      doc.addPage();
      y = 15;
      if (continuation) {
        doc.setTextColor(...ink);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(`${continuation} — continued`, L, y + 5);
        doc.setDrawColor(...teal);
        doc.setLineWidth(0.35);
        doc.line(L, y + 8, R, y + 8);
        y += 13;
      }
    };
    const ensure = (space: number) => {
      if (y + space > BOTTOM) newPage(currentResident || undefined);
    };
    const linesFor = (value: string, width: number, size = 9) => {
      doc.setFontSize(size);
      return doc.splitTextToSize(value || "", width) as string[];
    };
    const paragraph = (
      value: string,
      options: {
        size?: number;
        bold?: boolean;
        x?: number;
        width?: number;
        colour?: [number, number, number];
        after?: number;
      } = {},
    ) => {
      const size = options.size ?? 9.5,
        x = options.x ?? L,
        width = options.width ?? CONTENT;
      const lines = linesFor(value, width, size);
      const height = Math.max(1, lines.length) * size * 0.43;
      ensure(height + 2);
      doc.setFont("helvetica", options.bold ? "bold" : "normal");
      doc.setTextColor(...(options.colour ?? ink));
      doc.text(lines, x, y);
      y += height + (options.after ?? 2.2);
    };
    const labelValue = (label: string, value: string, x: number, top: number, width: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...muted);
      doc.text(`${label}:`, x, top);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...ink);
      doc.text(doc.splitTextToSize(value, width) as string[], x + 27, top);
    };
    const heading = (value: string) => {
      ensure(12);
      y += 2;
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(), L, y + 5);
      doc.setDrawColor(...teal);
      doc.setLineWidth(0.35);
      doc.line(L, y + 8, R, y + 8);
      y += 13;
    };

    // Compact clinical-document header.
    doc.addImage(logo, "PNG", L, 11, 14, 14);
    doc.setTextColor(...teal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.text("Resident Shift Handover", L + 20, 20);
    doc.setTextColor(...ink);
    doc.setFontSize(13);
    doc.text(handover.nursingHomeName, L, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const shiftLine = [handover.wingName, `${titleCase(handover.shiftType)} Shift`]
      .filter(Boolean)
      .join(" · ");
    doc.text(shiftLine, L, 39);
    doc.text(
      `${date(handover.periodFrom)} · ${time(handover.periodFrom)}–${time(handover.periodTo)}`,
      L,
      45,
    );
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.55);
    doc.line(L, 50, R, 50);
    y = 58;
    const role = displayRole(handover.generatedByRole);
    const details: Array<[string, string]> = [
      ["Generated by", `${handover.generatedByName}${role ? `, ${role}` : ""}`],
      ["Generated at", dateTime(handover.generatedAt)],
      ["Reference", handover.referenceNumber],
      ["Version", String(handover.versionNumber)],
      ["Status", `${handover.archived ? "Archived · " : ""}${titleCase(handover.status)}`],
      ["Residents included", String(handover.residentCount)],
    ];
    const detailRows = Math.ceil(details.length / 2);
    const detailTop = y;
    details.forEach(([label, value], index) => {
      const column = index % 2,
        row = Math.floor(index / 2);
      labelValue(label, value, L + column * 91, detailTop + row * 8, 60);
    });
    y += detailRows * 8 + 5;
    if (handover.correctionReason)
      paragraph(`Correction reason: ${handover.correctionReason}`, { size: 8.5 });
    if (handover.cancellationReason)
      paragraph(
        `Cancellation reason: ${handover.cancellationReason}${handover.cancellationNotes ? ` — ${handover.cancellationNotes}` : ""}`,
        { size: 8.5, bold: true },
      );

    // Shift overview: only defensible snapshot-derived counts.
    const metrics = [
      ["Residents Included", handover.residentCount],
      ["Requiring Follow-up", handover.items.filter((i) => i.followUpRequired).length],
      ["Important Items", handover.items.filter((i) => i.important).length],
      [
        "Incidents",
        handover.items.filter((i) => i.sectionType === "Incidents and Escalations").length,
      ],
      ["Assessments", handover.items.filter((i) => i.sourceEntityType === "assessment").length],
      [
        "Care Plan Updates",
        handover.items.filter((i) => i.sourceEntityType === "care_plan").length,
      ],
      [
        "Outstanding Actions",
        handover.items.filter((i) => i.followUpRequired).length +
          handover.sections.filter((section) => section.nextShiftNotes.trim()).length,
      ],
    ] as const;
    heading("Shift summary");
    const visibleMetrics = metrics.filter(
      ([label, value]) => label === "Residents Included" || value > 0,
    );
    ensure(visibleMetrics.length * 6 + 2);
    visibleMetrics.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...ink);
      doc.text(label, L, y);
      doc.setFont("helvetica", "bold");
      doc.text(String(value), 102, y, { align: "right" });
      doc.setDrawColor(225, 228, 232);
      doc.line(L, y + 2, 104, y + 2);
      y += 6;
    });
    y += 2;

    for (const [residentIndex, section] of handover.sections.entries()) {
      if (residentIndex > 0 && y > 205) newPage();
      else y += 6;
      currentResident = section.residentName;
      ensure(38);
      const cardTop = y;
      doc.setDrawColor(...line);
      doc.setLineWidth(0.3);
      doc.line(L, cardTop, R, cardTop);
      const photo = photos.get(section.id);
      if (photo) {
        try {
          const props = doc.getImageProperties(photo);
          const scale = Math.min(20 / props.width, 20 / props.height);
          const imageW = props.width * scale,
            imageH = props.height * scale;
          doc.addImage(
            photo,
            props.fileType,
            L + 2 + (20 - imageW) / 2,
            cardTop + 4 + (20 - imageH) / 2,
            imageW,
            imageH,
          );
        } catch {
          photos.delete(section.id);
        }
      }
      if (!photos.has(section.id)) {
        doc.setFillColor(224, 227, 231);
        doc.circle(L + 12, cardTop + 14, 10, "F");
        doc.setTextColor(...muted);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(
          section.residentName
            .split(/\s+/)
            .map((part) => part[0])
            .slice(0, 2)
            .join(""),
          L + 12,
          cardTop + 16,
          { align: "center" },
        );
      }
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(section.residentName, L + 28, cardTop + 10);
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.7);
      const preferred =
        section.preferredName &&
        !section.residentName.toLowerCase().startsWith(section.preferredName.toLowerCase())
          ? `Preferred name: ${section.preferredName}`
          : undefined;
      const identity = [
        section.room ? `Room ${section.room}` : undefined,
        section.wing || handover.wingName,
        section.residentIdentifier ? `ID: ${section.residentIdentifier}` : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
      if (preferred) doc.text(preferred, L + 28, cardTop + 17);
      if (identity) doc.text(identity, L + 28, cardTop + (preferred ? 23 : 18));
      doc.line(L, cardTop + 29, R, cardTop + 29);
      y += 34;
      if (isBirthday(section, handover.periodFrom, handover.periodTo)) {
        ensure(21);
        doc.setDrawColor(...teal);
        doc.setLineWidth(0.7);
        doc.line(L, y, L, y + 12);
        doc.setTextColor(...ink);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(
          `Happy Birthday, ${section.preferredName || section.residentName.split(" ")[0]}.`,
          L + 5,
          y + 7,
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`Best wishes from everyone at ${handover.nursingHomeName}.`, L + 5, y + 13);
        y += 17;
      }
      if (section.shiftSummary.trim()) {
        heading("Shift Summary");
        paragraph(section.shiftSummary);
      }
      const items = handover.items
        .filter((item) => item.residentSectionId === section.id && !item.excluded)
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
      const groups = [...new Set(items.map((item) => item.sectionType))].sort((a, b) => {
        const ai = sectionOrder.indexOf(a),
          bi = sectionOrder.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
      for (const group of groups) {
        heading(clinicalSectionTitle(group));
        for (const item of items.filter((value) => value.sectionType === group)) {
          const summary = withoutDuplicateRecorder(item.summary, item.authorName);
          const summaryLines = linesFor(summary, CONTENT - 20, 9.5);
          const blockHeight =
            11 +
            summaryLines.length * 4.2 +
            (item.authorName ? 5 : 1) +
            (item.important ? 4 : 0) +
            (item.followUpRequired ? 5 : 0);
          ensure(Math.min(blockHeight, 55));
          if (item.important) {
            doc.setTextColor(...ink);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.text("IMPORTANT", L, y + 3.5);
            y += 6;
          }
          const top = y;
          doc.setTextColor(...muted);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.text(time(item.occurredAt), L, top + 4);
          doc.setTextColor(...ink);
          doc.setFontSize(10.5);
          doc.text(clinicalTitle(item.title), L + 18, top + 4);
          let eventY = top + 10;
          if (group === "Incidents and Escalations") {
            doc.setDrawColor(...teal);
            doc.setLineWidth(0.7);
            doc.line(L, top, L, top + blockHeight - 2);
            doc.setTextColor(...ink);
            doc.setFontSize(8.5);
            doc.text("Incident / escalation", L + 4, eventY);
            eventY += 5;
          }
          doc.setTextColor(...ink);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.text(summaryLines, L + (group === "Incidents and Escalations" ? 4 : 0), eventY);
          eventY += summaryLines.length * 4.2 + 2;
          if (item.authorName) {
            doc.setTextColor(...muted);
            doc.setFontSize(8);
            doc.text(
              `Recorded by: ${item.authorName}`,
              L + (group === "Incidents and Escalations" ? 4 : 0),
              eventY,
            );
            eventY += 5;
          }
          if (item.followUpRequired) {
            doc.setTextColor(...ink);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.text(
              "FOLLOW-UP REQUIRED",
              L + (group === "Incidents and Escalations" ? 4 : 0),
              eventY + 3.5,
            );
          }
          y = top + Math.max(15, blockHeight) + 2;
          doc.setDrawColor(225, 228, 232);
          doc.setLineWidth(0.2);
          doc.line(L, y, R, y);
          y += 4;
        }
      }
      heading("Next Shift Actions");
      const followUpItems = items.filter((item) => item.followUpRequired);
      if (section.nextShiftNotes.trim()) paragraph(section.nextShiftNotes.trim(), { bold: true });
      for (const item of followUpItems)
        paragraph(`• ${item.title}: ${withoutDuplicateRecorder(item.summary, item.authorName)}`, {
          size: 9,
        });
      if (!section.nextShiftNotes.trim() && !followUpItems.length)
        paragraph("No outstanding actions recorded.");
      currentResident = "";
    }

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      const mark = watermark(handover);
      if (mark) {
        doc.saveGraphicsState();
        doc.setTextColor(218, 221, 227);
        doc.setFontSize(39);
        doc.setFont("helvetica", "bold");
        doc.text(mark, W / 2, H / 2, { align: "center", angle: 35 });
        doc.restoreGraphicsState();
      }
      doc.setDrawColor(...line);
      doc.line(L, 266, R, 266);
      doc.setTextColor(...muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Confidential Clinical Information", L, 272);
      doc.text(
        `${handover.referenceNumber} · Version ${handover.versionNumber} · Page ${page} of ${pages}`,
        R,
        272,
        { align: "right" },
      );
      doc.setFont("helvetica", "normal");
      doc.text("Generated by ORITAS · © ORITAS", L, 278);
      if (page === pages)
        doc.text(
          "Store securely and dispose of printed copies according to organisational policy.",
          R,
          278,
          { align: "right" },
        );
    }
    return doc.output("blob");
  },
  async generatePdf(handoverId: string, actor = "Current user") {
    const handover = generatedHandoverRepository.getById(handoverId);
    if (!handover) throw new Error("Handover not found.");
    const blob = await this.generatePdfBlob(handover);
    generatedHandoverRepository.savePdfMetadata(handover.id, {
      fileName: this.getPdfFileName(handover),
      generatedAt: new Date().toISOString(),
      generatedBy: actor,
      version: handover.versionNumber,
    });
    return blob;
  },
  async previewPdf(handoverId: string, actor?: string) {
    return URL.createObjectURL(await this.generatePdf(handoverId, actor));
  },
  async downloadPdf(handoverId: string, actor?: string) {
    const handover = generatedHandoverRepository.getById(handoverId);
    if (!handover) throw new Error("Handover not found.");
    const blob = await this.generatePdf(handoverId, actor);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = this.getPdfFileName(handover);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  async printPdf(handoverId: string, actor?: string) {
    const url = await this.previewPdf(handoverId, actor);
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.opacity = "0";
    frame.src = url;
    document.body.appendChild(frame);
    frame.onload = () => {
      if (!frame.contentWindow) throw new Error("Browser blocked print window.");
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => {
        frame.remove();
        URL.revokeObjectURL(url);
      }, 3000);
    };
  },
};
