import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { roleLabels } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — CarePath" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const {
    currentUser, updateUser, wings, residents, tasks, interventions, assessments,
    incidents, mdtNotes, carePlans,
  } = useCare();
  const [draft, setDraft] = useState({ email: currentUser.email, phone: currentUser.phone });

  const assignedWingNames = currentUser.assignedWings.length === 0
    ? "Entire nursing home"
    : currentUser.assignedWings.map(id => wings.find(w => w.id === id)?.name || id).join(", ");

  const myResidentIds = currentUser.assignedWings.length === 0
    ? residents.map(r => r.id)
    : residents.filter(r => currentUser.assignedWings.includes(r.wingId || "")).map(r => r.id);
  const mySet = new Set(myResidentIds);

  const myStats = {
    residents: myResidentIds.length,
    tasks: tasks.filter(t => !t.residentId || mySet.has(t.residentId)).length,
    interventions: interventions.filter(i => mySet.has(i.residentId) && i.staff === currentUser.name).length,
    assessments: assessments.filter(a => a.assessor === currentUser.name).length,
    incidents: incidents.filter(i => mySet.has(i.residentId) && i.reportedBy.includes(currentUser.name.split(" ").pop() || "")).length,
    mdt: mdtNotes.filter(m => m.authoredBy === currentUser.name).length,
    carePlans: carePlans.filter(c => mySet.has(c.residentId) && c.createdBy === currentUser.name).length,
    reviews: carePlans.filter(c => mySet.has(c.residentId) && new Date(c.reviewDate) <= new Date(Date.now() + 7 * 86400000)).length,
  };

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-5xl">
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl bg-accent text-accent-foreground">
              {currentUser.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">{currentUser.name}</h1>
              <Badge variant="outline" className="capitalize">{roleLabels[currentUser.role]}</Badge>
              <Badge variant="secondary" className="capitalize">{currentUser.status}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <Info label="Employee #" value={currentUser.employeeNumber} />
              <Info label="Department" value={currentUser.department} />
              <Info label="Start date" value={currentUser.startDate} />
              <Info label="Last login" value={currentUser.lastLogin.slice(0, 10)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Profile Info</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="p-5 grid md:grid-cols-2 gap-4 text-sm">
              <Info label="Full name" value={currentUser.name} />
              <Info label="Role" value={roleLabels[currentUser.role]} />
              <Info label="Email" value={currentUser.email} />
              <Info label="Phone" value={currentUser.phone} />
              <Info label="Department" value={currentUser.department} />
              <Info label="Assigned wing(s)" value={assignedWingNames} />
              <Info label="Employee number" value={currentUser.employeeNumber} />
              <Info label="Start date" value={currentUser.startDate} />
              <Info label="Last login" value={currentUser.lastLogin.slice(0, 16).replace("T", " ")} />
              <Info label="Account status" value={currentUser.status} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Contact details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Email</Label><Input value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
              <Button onClick={() => { updateUser(currentUser.id, draft); toast.success("Profile updated"); }}>Save changes</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Password</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Current password</Label><Input type="password" disabled placeholder="(demo: password change disabled)" /></div>
              <Button variant="outline" disabled>Change password</Button>
              <p className="text-xs text-muted-foreground">Real password management requires backend auth — enable Lovable Cloud to switch this on.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Notification preferences</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(["email", "sms", "inApp", "criticalAlertsOnly"] as const).map(k => (
                <div key={k} className="flex items-center justify-between">
                  <Label className="capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</Label>
                  <Switch
                    checked={currentUser.notificationPrefs[k]}
                    onCheckedChange={(v) => updateUser(currentUser.id, { notificationPrefs: { ...currentUser.notificationPrefs, [k]: v } })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="My Residents" value={myStats.residents} />
            <Stat label="My Tasks" value={myStats.tasks} />
            <Stat label="My Interventions" value={myStats.interventions} />
            <Stat label="My Assessments" value={myStats.assessments} />
            <Stat label="My Incidents" value={myStats.incidents} />
            <Stat label="My MDT Notes" value={myStats.mdt} />
            <Stat label="My Care Plans" value={myStats.carePlans} />
            <Stat label="Upcoming Reviews (7d)" value={myStats.reviews} />
          </div>
          <Separator className="my-4" />
          <Card>
            <CardHeader><CardTitle className="text-base">My Residents</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {residents.filter(r => mySet.has(r.id)).slice(0, 12).map(r => (
                <Link key={r.id} to="/residents/$id" params={{ id: r.id }} className="border rounded p-2 hover:bg-accent">
                  <div className="font-medium">{r.firstName} {r.lastName}</div>
                  <div className="text-xs text-muted-foreground">Room {r.roomNumber} · {wings.find(w => w.id === r.wingId)?.name || "—"}</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-sm capitalize">{value}</div></div>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </CardContent></Card>
  );
}
