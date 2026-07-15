import type { AgencyRateAgreement, MoneyAmount } from "@/lib/care/types";

export interface AgencyCostCalculation {
  workedMinutes: number;
  unpaidBreakMinutes: number;
  payableMinutes: number;
  baseCost: MoneyAmount;
  additionalFees: MoneyAmount;
  totalCost: MoneyAmount;
  rateAgreementId?: string;
  explanation: string;
}

export function calculateAgencyTimesheetCost(input: { actualStartAt?: string; actualEndAt?: string; hoursWorked?: number; unpaidBreakMinutes?: number }, rateAgreement?: AgencyRateAgreement): AgencyCostCalculation {
  const currencyCode = rateAgreement?.hourlyRate.currencyCode || "EUR";
  const workedMinutes = input.actualStartAt && input.actualEndAt
    ? Math.max(0, Math.round((new Date(input.actualEndAt).getTime() - new Date(input.actualStartAt).getTime()) / 60000))
    : Math.max(0, Math.round((input.hoursWorked || 0) * 60));
  const unpaidBreakMinutes = Math.max(0, input.unpaidBreakMinutes || 0);
  const payableMinutes = Math.max(0, workedMinutes - unpaidBreakMinutes);
  const hourlyRateMinor = rateAgreement?.hourlyRate.amountMinor || 0;
  const baseMinor = Math.round((hourlyRateMinor * payableMinutes) / 60);
  const feeMinor = rateAgreement?.additionalFlatFee?.amountMinor || 0;
  return {
    workedMinutes,
    unpaidBreakMinutes,
    payableMinutes,
    baseCost: { amountMinor: baseMinor, currencyCode },
    additionalFees: { amountMinor: feeMinor, currencyCode },
    totalCost: { amountMinor: baseMinor + feeMinor, currencyCode },
    rateAgreementId: rateAgreement?.id,
    explanation: rateAgreement ? "Approved rate snapshot applied using integer minor-unit arithmetic." : "No approved Agency rate applies to this shift.",
  };
}
