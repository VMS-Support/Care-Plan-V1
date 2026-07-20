import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { Role, StaffMember, StaffMemberStatus, UserAccount } from "@/lib/care/types";
import {
  EMPLOYMENT_CONTRACT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  WORKFORCE_CAPABILITIES,
  getAuthorisedWorkforceScope,
  getStaffDirectory,
  STAFF_MEMBER_STATUS_LABELS,
  type SaveStaffMemberInput,
  type StaffDirectorySortKey,
} from "@/domain/workforce";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/workforce/staff")({
  head: () => ({ meta: [{ title: "Staff Directory - NuCare" }] }),
  component: StaffDirectoryPage,
});

const ALL = "__all__";
const PAGE_SIZES = [25, 50, 100];
const ACCOUNT_STATUS_LABELS: Record<UserAccount["accountStatus"], string> = {
  invited: "Login Invited",
  active: "Active Login",
  suspended: "Login Suspended",
  locked: "Login Locked",
  disabled: "Login Disabled",
};

const LOGIN_ROLES: { value: Role; label: string }[] = [
  { value: "carer", label: "Care Assistant" },
  { value: "nurse", label: "Nurse" },
  { value: "doctor", label: "Doctor" },
  { value: "cnm", label: "CNM" },
  { value: "don", label: "DON" },
  { value: "group_owner", label: "Group Owner" },
];

const STAFF_ROLES = LOGIN_ROLES.filter((role) => role.value !== "group_owner");

const STAFF_ROLE_TO_WORKFORCE_KEY: Record<Role, string> = {
  carer: "HCA",
  nurse: "NURSE",
  doctor: "DOCTOR",
  cnm: "CNM",
  don: "DON",
  group_owner: "GROUP_OWNER",
};

const STAFF_ROLE_TO_CATEGORY: Record<Role, "clinical" | "care" | "management" | "administration" | "other"> = {
  carer: "care",
  nurse: "clinical",
  doctor: "clinical",
  cnm: "management",
  don: "management",
  group_owner: "administration",
};

function StaffDirectoryPage() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [homeId, setHomeId] = useState<string>(ALL);
  const [account, setAccount] = useState<string>(ALL);
  const [employmentStatus, setEmploymentStatus] = useState<string>(ALL);
  const [employmentType, setEmploymentType] = useState<string>(ALL);
  const [department, setDepartment] = useState<string>(ALL);
  const [roleKey, setRoleKey] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<StaffDirectorySortKey>("surname");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; staff?: StaffMember } | null>(null);
  const [loginStaff, setLoginStaff] = useState<StaffMember | null>(null);

  const capabilities = WORKFORCE_CAPABILITIES.filter((capability) =>
    care.canAccess(capability, { nursingHomeId: care.activeFacilityId }),
  );
  const scope = getAuthorisedWorkforceScope({ currentUser: care.currentUser, activeFacilityId: care.activeFacilityId, facilities: care.facilities });
  const selectedHomeIds = homeId === ALL ? scope.nursingHomeIds : [homeId];
  const selectedAccountStatuses =
    account !== ALL && account !== "linked" && account !== "not_linked" ? [account as UserAccount["accountStatus"]] : undefined;

  const directory = useMemo(
    () =>
      getStaffDirectory(
        care,
        {
          nursingHomeIds: selectedHomeIds,
          statuses: status === ALL ? undefined : [status as StaffMemberStatus],
          linkedUserAccount: account === "linked" || account === "not_linked" ? (account as "linked" | "not_linked") : undefined,
          accountStatuses: selectedAccountStatuses,
          employmentStatuses: employmentStatus === ALL ? undefined : [employmentStatus as never],
          employmentTypes: employmentType === ALL ? undefined : [employmentType as never],
          departments: department === ALL ? undefined : [department],
          roleKeys: roleKey === ALL ? undefined : [roleKey],
          search,
        },
        { page, pageSize },
        { key: sortKey, direction: "asc" },
        { user: care.currentUser, capabilities, scope },
      ),
    [
      care,
      selectedHomeIds.join(","),
      status,
      account,
      selectedAccountStatuses?.join(","),
      employmentStatus,
      employmentType,
      department,
      roleKey,
      search,
      page,
      pageSize,
      sortKey,
      capabilities.join(","),
      scope.nursingHomeIds.join(","),
    ],
  );

  const allRows = useMemo(
    () =>
      getStaffDirectory(
        care,
        { nursingHomeIds: selectedHomeIds },
        { page: 0, pageSize: Math.max(care.staffMembers.length, 1) },
        { key: "surname", direction: "asc" },
        { user: care.currentUser, capabilities, scope },
      ).rows,
    [care, selectedHomeIds.join(","), capabilities.join(","), scope.nursingHomeIds.join(",")],
  );

  const canCreate = capabilities.includes("staff_directory.create");
  const canEdit = capabilities.includes("staff_directory.edit");
  const canManageAccounts = capabilities.includes("staff_directory.manage_account_link");
  const homeOptions = care.facilities.filter((facility) => scope.nursingHomeIds.includes(facility.id));
  const departmentOptions = Array.from(new Set(allRows.map((row) => row.department).filter(Boolean) as string[])).sort();
  const roleOptions = Array.from(
    new Map(allRows.map((row) => [row.primaryRole?.key || row.primaryRole?.label, row.primaryRole?.label]).filter(([key]) => Boolean(key)) as [string, string][]).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));
  const lastPage = Math.max(0, Math.ceil(directory.totalMatching / pageSize) - 1);

  if (!capabilities.includes("staff_directory.view") && !capabilities.includes("workforce.view")) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to the Staff Directory.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage Staff identity, employment, roles, Training, documents and account access.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.info("Export is ready to connect to reporting.")}>
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => toast.info("Bulk actions will use the selected staff list.")}>
            <Users className="mr-2 h-4 w-4" /> Bulk Actions
          </Button>
          {canCreate && (
            <Button onClick={() => setDialog({ mode: "create" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Staff Member
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,minmax(150px,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, staff number, role, department or work email"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
            </div>
            <FilterSelect label="Status" value={status} onChange={setStatus} onResetPage={() => setPage(0)}>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {Object.entries(STAFF_MEMBER_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Home" value={homeId} onChange={setHomeId} onResetPage={() => setPage(0)}>
              <SelectItem value={ALL}>All authorised homes</SelectItem>
              {homeOptions.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="User Account" value={account} onChange={setAccount} onResetPage={() => setPage(0)}>
              <SelectItem value={ALL}>All account states</SelectItem>
              <SelectItem value="linked">Any linked login</SelectItem>
              <SelectItem value="not_linked">No User Account</SelectItem>
              {Object.entries(ACCOUNT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Sort" value={sortKey} onChange={(value) => setSortKey(value as StaffDirectorySortKey)}>
              <SelectItem value="surname">Surname</SelectItem>
              <SelectItem value="firstName">First name</SelectItem>
              <SelectItem value="staffNumber">Staff number</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="primaryRole">Primary role</SelectItem>
              <SelectItem value="primaryHome">Primary home</SelectItem>
              <SelectItem value="updatedAt">Updated date</SelectItem>
            </FilterSelect>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <FilterSelect label="Employment Status" value={employmentStatus} onChange={setEmploymentStatus} onResetPage={() => setPage(0)}>
              <SelectItem value={ALL}>All employment statuses</SelectItem>
              {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Employment Type" value={employmentType} onChange={setEmploymentType} onResetPage={() => setPage(0)}>
              <SelectItem value={ALL}>All employment types</SelectItem>
              {Object.entries(EMPLOYMENT_CONTRACT_TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Department" value={department} onChange={setDepartment} onResetPage={() => setPage(0)}>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departmentOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Role" value={roleKey} onChange={setRoleKey} onResetPage={() => setPage(0)}>
              <SelectItem value={ALL}>All roles</SelectItem>
              {roleOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </FilterSelect>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-[1180px] w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-4 py-3 font-medium">Staff Number</th>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Primary Home</th>
                  <th className="px-4 py-3 font-medium">Employment Type</th>
                  <th className="px-4 py-3 font-medium">Employment Status</th>
                  <th className="px-4 py-3 font-medium">Service Length</th>
                  <th className="px-4 py-3 font-medium">Work Contact</th>
                  <th className="px-4 py-3 font-medium">User Account</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {directory.rows.map((row) => {
                  const staff = care.staffMembers.find((item) => String(item.id) === row.staffMemberId);
                  return (
                    <tr key={row.staffMemberId} className="border-t">
                      <td className="px-4 py-3">
                        <Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }} className="flex items-center gap-3 font-medium">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={row.photoUrl} />
                            <AvatarFallback>{row.initials}</AvatarFallback>
                          </Avatar>
                          <span>
                            {row.displayName}
                            <span className="block text-xs font-normal text-muted-foreground">{row.statusLabel}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row.staffNumber}</td>
                      <td className="px-4 py-3">{row.position || row.primaryRole?.label || "Role Not Recorded"}</td>
                      <td className="px-4 py-3">{row.department || "Not recorded"}</td>
                      <td className="px-4 py-3">{row.primaryHome?.name || "Primary Home Not Recorded"}</td>
                      <td className="px-4 py-3">{formatContract(row.employmentType)}</td>
                      <td className="px-4 py-3"><StatusBadge label={formatEmploymentStatus(row.employmentStatus) || row.statusLabel} /></td>
                      <td className="px-4 py-3">{row.serviceLength || "Not recorded"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.workEmail || row.workPhone || "Not recorded"}</td>
                      <td className="px-4 py-3"><AccountBadge label={row.userAccount?.label} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Open Profile</Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit && staff && <DropdownMenuItem onClick={() => setDialog({ mode: "edit", staff })}><Pencil className="mr-2 h-4 w-4" /> Edit Profile</DropdownMenuItem>}
                              {canManageAccounts && staff && !row.linkedUserAccount && <DropdownMenuItem onClick={() => setLoginStaff(staff)}>Create Login</DropdownMenuItem>}
                              {canManageAccounts && row.linkedUserAccount && <DropdownMenuItem onClick={() => toast.info("Open the staff profile User Account tab to manage this login.")}><ShieldCheck className="mr-2 h-4 w-4" /> Manage Login</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Add Employment Record</Link></DropdownMenuItem>
                              <DropdownMenuItem asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Assign Training</Link></DropdownMenuItem>
                              <DropdownMenuItem asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Add Leave</Link></DropdownMenuItem>
                              <DropdownMenuItem asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Upload Document</Link></DropdownMenuItem>
                              {canEdit && staff && row.status !== "inactive" && (
                                <DropdownMenuItem onClick={() => {
                                  care.changeStaffMemberStatus(String(staff.id), "inactive", "Deactivated from Staff Directory");
                                  toast.success("Staff Member deactivated.");
                                }}>
                                  Deactivate Staff Member
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>View History</Link></DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {directory.rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      {search || status !== ALL || homeId !== ALL || account !== ALL ? "No Staff Members match the selected filters." : "No Staff Members have been added for the selected scope."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Showing {directory.rows.length ? page * pageSize + 1 : 0}-{Math.min((page + 1) * pageSize, directory.totalMatching)} of {directory.totalMatching} Staff Member{directory.totalMatching === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(0); }}>
                <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft className="h-4 w-4" /> Previous</Button>
              <span className="text-xs text-muted-foreground">Page {page + 1} of {lastPage + 1}</span>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StaffMemberDialog
        open={Boolean(dialog)}
        mode={dialog?.mode || "create"}
        staff={dialog?.staff}
        homeOptions={homeOptions}
        canCreateLogin={canManageAccounts}
        onOpenChange={(open) => !open && setDialog(null)}
        onSave={({ staffInput, staffRole, loginInput }) => {
          try {
            if (loginInput?.createLogin && (!loginInput.name.trim() || !loginInput.email.trim())) {
              throw new Error("Name and email are required to create a user account.");
            }
            if (dialog?.mode === "edit" && dialog.staff) {
              care.updateStaffMember(String(dialog.staff.id), staffInput);
              toast.success("Staff Member saved.");
            } else {
              const createdStaff = care.createStaffMember(staffInput);
              care.createEmploymentRecord({
                staffMemberId: String(createdStaff.id),
                employeeNumber: staffInput.staffNumber,
                contractType: "permanent_full_time",
                status: staffInput.status === "pre_employment" ? "pre_employment" : staffInput.status === "left_employment" || staffInput.status === "inactive" ? "ended" : staffInput.status === "suspended" ? "suspended" : "active",
                startDate: new Date().toISOString().slice(0, 10),
                primaryNursingHomeId: staffInput.primaryNursingHomeId,
                primaryRoleKey: STAFF_ROLE_TO_WORKFORCE_KEY[staffRole],
                employmentCategory: STAFF_ROLE_TO_CATEGORY[staffRole],
                isPrimaryEmployment: true,
                notes: "Created from Staff Directory.",
              });
              if (loginInput?.createLogin) {
                care.createStaffUser({
                  staffMemberId: String(createdStaff.id),
                  name: loginInput.name,
                  email: loginInput.email,
                  role: loginInput.role,
                  status: loginInput.accountStatus === "disabled" ? "inactive" : loginInput.accountStatus === "suspended" || loginInput.accountStatus === "locked" ? "suspended" : "active",
                  accountStatus: loginInput.accountStatus,
                  temporaryPassword: loginInput.temporaryPassword || undefined,
                });
              }
              toast.success("Staff Member added.");
            }
            setDialog(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "The Staff Member could not be saved.");
          }
        }}
      />
      <CreateLoginDialog
        staff={loginStaff}
        open={Boolean(loginStaff)}
        onOpenChange={(open) => !open && setLoginStaff(null)}
        onCreate={(input) => {
          try {
            care.createStaffUser(input);
            toast.success(input.accountStatus === "invited" ? "Login invitation recorded." : "User account created.");
            setLoginStaff(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "The user account could not be created.");
          }
        }}
      />
    </div>
  );
}

function FilterSelect({ label, value, onChange, onResetPage, children }: { label: string; value: string; onChange: (value: string) => void; onResetPage?: () => void; children: React.ReactNode }) {
  return (
    <Select value={value} onValueChange={(next) => { onChange(next); onResetPage?.(); }}>
      <SelectTrigger aria-label={label}><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function StatusBadge({ label }: { label: string }) {
  const cls = label === "Active" ? "bg-emerald-50 text-emerald-700" : label.includes("Suspended") || label.includes("Ended") ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700";
  return <Badge className={`${cls} border-0`}>{label}</Badge>;
}

function AccountBadge({ label }: { label?: string }) {
  if (!label) return <span className="text-muted-foreground">No User Account</span>;
  const cls = label.includes("Active") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : label.includes("Invited") ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-700";
  return <Badge variant="outline" className={cls}>{label}</Badge>;
}

function formatContract(value?: string) {
  if (!value) return "Not recorded";
  return EMPLOYMENT_CONTRACT_TYPE_LABELS[value as keyof typeof EMPLOYMENT_CONTRACT_TYPE_LABELS] || value.replaceAll("_", " ");
}

function formatEmploymentStatus(value?: string) {
  if (!value) return undefined;
  return EMPLOYMENT_STATUS_LABELS[value as keyof typeof EMPLOYMENT_STATUS_LABELS] || STAFF_MEMBER_STATUS_LABELS[value as keyof typeof STAFF_MEMBER_STATUS_LABELS] || value.replaceAll("_", " ");
}

type StaffMemberDialogSave = {
  staffInput: SaveStaffMemberInput;
  staffRole: Role;
  loginInput?: {
    createLogin: boolean;
    name: string;
    email: string;
    role: Role;
    accountStatus: UserAccount["accountStatus"];
    temporaryPassword?: string;
  };
};

function StaffMemberDialog({
  open,
  mode,
  staff,
  homeOptions,
  canCreateLogin,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  staff?: StaffMember;
  homeOptions: { id: string; name: string }[];
  canCreateLogin: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: StaffMemberDialogSave) => void;
}) {
  const [form, setForm] = useState<SaveStaffMemberInput>(() => draftFromStaff(staff, homeOptions[0]?.id));
  const [staffRole, setStaffRole] = useState<Role>("nurse");
  const [createLogin, setCreateLogin] = useState(false);
  const [login, setLogin] = useState({
    name: "",
    email: "",
    role: "nurse" as Role,
    accountStatus: "invited" as UserAccount["accountStatus"],
    temporaryPassword: "",
  });
  useEffect(() => setForm(draftFromStaff(staff, homeOptions[0]?.id)), [staff, homeOptions[0]?.id, open]);
  useEffect(() => {
    if (!open) return;
    const surname = form.surname || "";
    const name = `${form.preferredName || form.firstName || ""} ${surname}`.trim();
    setStaffRole("nurse");
    setCreateLogin(false);
    setLogin({
      name,
      email: form.workEmail || "",
      role: "nurse",
      accountStatus: "invited",
      temporaryPassword: "",
    });
  }, [open, staff?.id]);
  const set = (key: keyof SaveStaffMemberInput, value: string) => setForm((current) => ({ ...current, [key]: value || undefined }));
  const updateStaffRole = (value: Role) => {
    setStaffRole(value);
    setLogin((current) => ({ ...current, role: value }));
  };
  const syncLoginName = (nextForm: SaveStaffMemberInput) => {
    if (mode === "edit") return;
    const name = `${nextForm.preferredName || nextForm.firstName || ""} ${nextForm.surname || ""}`.trim();
    setLogin((current) => ({ ...current, name: current.name && current.name !== login.name ? current.name : name, email: current.email || nextForm.workEmail || "" }));
  };
  const setStaffField = (key: keyof SaveStaffMemberInput, value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value || undefined };
      syncLoginName(next);
      return next;
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === "edit" ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Staff Number"><Input value={form.staffNumber} onChange={(event) => set("staffNumber", event.target.value)} disabled={mode === "edit"} /></Field>
          <Field label="Primary Home"><Select value={form.primaryNursingHomeId || homeOptions[0]?.id} onValueChange={(value) => set("primaryNursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homeOptions.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="First Name"><Input value={form.firstName} onChange={(event) => setStaffField("firstName", event.target.value)} /></Field>
          <Field label="Surname"><Input value={form.surname} onChange={(event) => setStaffField("surname", event.target.value)} /></Field>
          <Field label="Preferred Name"><Input value={form.preferredName || ""} onChange={(event) => setStaffField("preferredName", event.target.value)} /></Field>
          <Field label="Staff Role"><Select value={staffRole} onValueChange={(value) => updateStaffRole(value as Role)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAFF_ROLES.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STAFF_MEMBER_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Work Email"><Input value={form.workEmail || ""} onChange={(event) => setStaffField("workEmail", event.target.value)} /></Field>
          <Field label="Work Phone"><Input value={form.workPhone || ""} onChange={(event) => set("workPhone", event.target.value)} /></Field>
          <Field label="Personal Email"><Input value={form.personalEmail || ""} onChange={(event) => set("personalEmail", event.target.value)} /></Field>
          <Field label="Personal Phone"><Input value={form.personalPhone || ""} onChange={(event) => set("personalPhone", event.target.value)} /></Field>
          <Field label="Address Line 1"><Input value={form.addressLine1 || ""} onChange={(event) => set("addressLine1", event.target.value)} /></Field>
          <Field label="City"><Input value={form.city || ""} onChange={(event) => set("city", event.target.value)} /></Field>
          <Field label="Photo URL"><Input value={form.photoUrl || ""} onChange={(event) => set("photoUrl", event.target.value)} /></Field>
          <Field label="Date of Birth"><Input type="date" value={form.dateOfBirth || ""} onChange={(event) => set("dateOfBirth", event.target.value)} /></Field>
        </div>
        {mode === "create" && canCreateLogin && (
          <div className="mt-5 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">User Account</h3>
                <p className="text-sm text-muted-foreground">Staff roles do not require login access. Create a login only when this person needs to use the system.</p>
              </div>
              <Button variant={createLogin ? "default" : "outline"} onClick={() => setCreateLogin((value) => !value)}>
                {createLogin ? "Login Will Be Created" : "No Login Required"}
              </Button>
            </div>
            {createLogin && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Display Name"><Input value={login.name} onChange={(event) => setLogin((current) => ({ ...current, name: event.target.value }))} /></Field>
                <Field label="Login Email"><Input value={login.email} onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))} /></Field>
                <Field label="Login Role"><Select value={login.role} onValueChange={(value) => setLogin((current) => ({ ...current, role: value as Role }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LOGIN_ROLES.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Account Status"><Select value={login.accountStatus} onValueChange={(value) => setLogin((current) => ({ ...current, accountStatus: value as UserAccount["accountStatus"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ACCOUNT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Temporary Password"><Input value={login.temporaryPassword} onChange={(event) => setLogin((current) => ({ ...current, temporaryPassword: event.target.value }))} placeholder="Optional" /></Field>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({ staffInput: form, staffRole, loginInput: createLogin ? { createLogin, ...login } : undefined })}>{mode === "edit" ? "Save Staff Member" : "Add Staff Member"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateLoginDialog({ staff, open, onOpenChange, onCreate }: { staff: StaffMember | null; open: boolean; onOpenChange: (open: boolean) => void; onCreate: (input: { staffMemberId: string; name: string; role: Role; email: string; status: "active" | "inactive" | "suspended"; accountStatus: UserAccount["accountStatus"]; temporaryPassword?: string }) => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "nurse" as Role,
    accountStatus: "invited" as UserAccount["accountStatus"],
    temporaryPassword: "",
  });

  useEffect(() => {
    if (!staff) return;
    const surname = staff.surname || staff.lastName || "";
    setForm({
      name: staff.displayName || `${staff.firstName || ""} ${surname}`.trim(),
      email: staff.contactDetails?.workEmail || staff.email || "",
      role: "nurse",
      accountStatus: "invited",
      temporaryPassword: "",
    });
  }, [staff, open]);

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Create User Account</DialogTitle></DialogHeader>
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="font-medium">{form.name}</div>
          <div className="text-muted-foreground">Staff account will be linked to {staff.staffNumber || "this Staff Member"}.</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Display Name"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Login Email"><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field>
          <Field label="Role"><Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as Role }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LOGIN_ROLES.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Account Status"><Select value={form.accountStatus} onValueChange={(value) => setForm((current) => ({ ...current, accountStatus: value as UserAccount["accountStatus"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ACCOUNT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Temporary Password"><Input value={form.temporaryPassword} onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))} placeholder="Optional" /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onCreate({ staffMemberId: String(staff.id), name: form.name, email: form.email, role: form.role, status: form.accountStatus === "disabled" ? "inactive" : form.accountStatus === "suspended" || form.accountStatus === "locked" ? "suspended" : "active", accountStatus: form.accountStatus, temporaryPassword: form.temporaryPassword || undefined })}>Create Login</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function draftFromStaff(staff: StaffMember | undefined, fallbackHomeId?: string): SaveStaffMemberInput {
  return {
    staffNumber: staff?.staffNumber || "",
    firstName: staff?.firstName || "",
    surname: staff?.surname || staff?.lastName || "",
    preferredName: staff?.preferredName || "",
    status: staff?.status || (staff?.active ? "active" : "inactive"),
    primaryNursingHomeId: staff?.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : fallbackHomeId,
    workEmail: staff?.contactDetails?.workEmail || staff?.email || "",
    workPhone: staff?.contactDetails?.workPhone || staff?.phone || "",
    personalEmail: staff?.contactDetails?.personalEmail || "",
    personalPhone: staff?.contactDetails?.personalPhone || "",
    addressLine1: staff?.address?.line1 || "",
    city: staff?.address?.city || "",
    photoUrl: staff?.photoUrl || "",
    dateOfBirth: staff?.dateOfBirth || "",
  };
}
