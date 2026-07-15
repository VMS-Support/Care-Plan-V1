import type { ProfessionalRegistration, StaffMember } from "@/lib/care/types";
import { normaliseRegistrationStatus } from "./registrationStatus";

export function getProfessionalRegistrationAlerts(input: { registrations: ProfessionalRegistration[]; staffMembers: StaffMember[]; warningWindow?: number; effectiveAt?: string }) {
  const at = input.effectiveAt || new Date().toISOString().slice(0, 10);
  const warningWindow = input.warningWindow ?? 30;
  return input.registrations.flatMap((registration) => {
    if (registration.status === "entered_in_error") return [];
    const staff = input.staffMembers.find((item) => item.id === registration.staffMemberId);
    const status = normaliseRegistrationStatus(registration, at);
    const days = registration.expiryDate ? Math.ceil((Date.parse(registration.expiryDate) - Date.parse(at)) / 86400000) : undefined;
    if (status === "expired") {
      return [{ id: `reg-alert-expired-${registration.id}`, type: "expired", staffName: staff?.displayName || "Staff Member", registrationBody: registration.registrationBody, expiryDate: registration.expiryDate, action: "Review registration immediately.", route: `/workforce/staff/${registration.staffMemberId}` }];
    }
    if (days !== undefined && days >= 0 && days <= warningWindow) {
      return [{ id: `reg-alert-expiring-${registration.id}`, type: days <= 7 ? "urgent_expiry" : "expiring_soon", staffName: staff?.displayName || "Staff Member", registrationBody: registration.registrationBody, expiryDate: registration.expiryDate, daysRemaining: days, action: "Arrange renewal evidence.", route: `/workforce/staff/${registration.staffMemberId}` }];
    }
    if (registration.verificationStatus && registration.verificationStatus !== "verified") {
      return [{ id: `reg-alert-verification-${registration.id}`, type: "verification_pending", staffName: staff?.displayName || "Staff Member", registrationBody: registration.registrationBody, expiryDate: registration.expiryDate, action: "Complete registration verification.", route: `/workforce/staff/${registration.staffMemberId}` }];
    }
    return [];
  });
}
