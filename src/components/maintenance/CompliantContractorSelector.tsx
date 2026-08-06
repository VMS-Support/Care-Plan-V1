import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { contractorCompliance } from "@/domain/maintenance/contractors";
import { useCare } from "@/lib/care/store";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { loadPhase5AGovernance } from "@/domain/maintenance/phase5aGovernance";

export function CompliantContractorSelector({ homeId, requiredService, value, onChange }: { homeId: string; requiredService?: string; value?: string; onChange: (id: string) => void }) {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [showIneligible, setShowIneligible] = useState(false);
  const serviceRules = useMemo(() => loadPhase5AGovernance().services, []);
  const rows = useMemo(() => care.maintenanceContractors.map((contractor) => {
    const association = care.maintenanceContractorHomeAssociations.find((item) => item.contractorId === contractor.id && item.homeId === homeId && item.active);
    const services = care.maintenanceContractorServiceAreas.filter((item) => item.contractorId === contractor.id && item.active && !item.archivedAt).map((item) => item.name);
    const result = contractorCompliance({ contractor, association, tenantId: contractor.tenantId, homeId, requiredTrade: requiredService, recordedTrades: services, serviceRules, certificates: care.maintenanceCertificates, versions: care.maintenanceCertificateVersions, types: care.maintenanceCertificateTypes, attachments: care.maintenanceCertificateAttachments, contractorLinks: care.maintenanceCertificateContractorLinks, requirements: care.maintenanceCertificateRequirements });
    return { contractor, association, services, result };
  }).filter((row) => showIneligible || row.result.assignable).filter((row) => [row.contractor.legalName, row.contractor.tradingName, row.contractor.primaryContactName, row.contractor.generalEmail, ...row.services].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())).sort((a, b) => Number(b.result.assignable) - Number(a.result.assignable)), [care, homeId, requiredService, search, showIneligible]);
  return <div className="space-y-3 rounded-lg border p-3"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, contact or service" /></div><label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={showIneligible} onCheckedChange={(checked) => setShowIneligible(Boolean(checked))} />Show ineligible contractors</label><div className="max-h-72 space-y-2 overflow-y-auto">{rows.map(({ contractor, association, services, result }) => <button type="button" key={contractor.id} disabled={!result.assignable} onClick={() => onChange(contractor.id)} className={`w-full rounded-md border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value === contractor.id ? "border-primary bg-primary/5" : ""} ${!result.assignable ? "cursor-not-allowed bg-muted/40 opacity-80" : "hover:bg-muted/40"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{contractor.tradingName || contractor.legalName}</span><Badge variant={result.assignable ? "secondary" : "destructive"}>{result.assignable ? result.state.replaceAll("_", " ") : "Assignment blocked"}</Badge></div><div className="mt-1 text-sm text-muted-foreground">{services[0] || "No service recorded"} · {association ? "Home access recorded" : "Not approved for this Home"}</div><div className="mt-1 text-sm">{result.nextExpiry ? `Next expiry: ${new Date(result.nextExpiry).toLocaleDateString("en-IE")}` : "No expiry recorded"}</div>{!result.assignable && <ul className="mt-2 list-disc pl-5 text-sm text-destructive">{result.blockers.map((reason) => <li key={reason}>{reason}</li>)}</ul>}</button>)}{!rows.length && <p className="py-6 text-center text-sm text-muted-foreground">No eligible contractors match this Work Order.</p>}</div></div>;
}
