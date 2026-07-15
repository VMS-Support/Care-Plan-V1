import type { Permission } from "@/lib/care/permissions";
import type { Role } from "@/lib/care/types";

export const WORKFORCE_CAPABILITIES = [
  "workforce.view",
  "staff_directory.view",
  "staff_directory.view_all_homes",
  "staff_directory.create",
  "staff_directory.edit",
  "staff_directory.change_status",
  "staff_directory.view_personal_details",
  "staff_directory.edit_personal_details",
  "staff_directory.view_contact_details",
  "staff_directory.edit_contact_details",
  "staff_directory.view_address",
  "staff_directory.edit_address",
  "staff_directory.view_emergency_contacts",
  "staff_directory.manage_emergency_contacts",
  "staff_directory.view_account_link",
  "staff_directory.manage_account_link",
  "staff_directory.upload_photo",
  "staff_directory.correct_staff_number",
  "staff_directory.view_metrics",
] as const satisfies readonly Permission[];

export function defaultWorkforceCapabilitiesForRole(role: Role): string[] {
  if (role === "group_owner") return [...WORKFORCE_CAPABILITIES];
  if (role === "don") return [...WORKFORCE_CAPABILITIES.filter((capability) => capability !== "staff_directory.view_all_homes")];
  if (role === "cnm") {
    return [
      "workforce.view",
      "staff_directory.view",
      "staff_directory.view_contact_details",
      "staff_directory.view_account_link",
      "staff_directory.view_metrics",
    ];
  }
  return [];
}
