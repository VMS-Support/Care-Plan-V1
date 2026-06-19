import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mic, Activity } from "lucide-react";

export const Route = createFileRoute("/daily-notes")({
  head: () => ({ meta: [{ title: "Daily Notes — CarePath" }] }),
  component: DailyNotesPage,
});

function NewNote() {
  const { residents, addNote } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ residentId: "", shift: "morning", observation: "", mood: "calm", foodIntake: "most", fluidIntake: "good", sleep: "good", behaviour: "", additionalNotes: "" });
  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { toast.error("Voice not supported in this browser"); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => setF(s => ({ ...s, observation: (s.observation + " " + e.results[0][0].transcript).trim() }));
    rec.start();
    toast.info("Listening…");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>New Daily Note</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Daily Note</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Resident</Label>
            <Select value={f.residentId} onValueChange={v => setF({ ...f, residentId: v })}>
              <SelectTrigger><SelectValue placeholder="Choose resident" /></SelectTrigger>
              <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Shift</Label>
            <Select value={f.shift} onValueChange={v => setF({ ...f, shift: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["morning", "afternoon", "night"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mood</Label>
            <Select value={f.mood} onValueChange={v => setF({ ...f, mood: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["happy", "calm", "anxious", "withdrawn", "agitated"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Food intake</Label>
            <Select value={f.foodIntake} onValueChange={v => setF({ ...f, foodIntake: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["full", "most", "half", "little", "none"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fluid intake</Label>
            <Select value={f.fluidIntake} onValueChange={v => setF({ ...f, fluidIntake: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["good", "moderate", "poor"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sleep</Label>
            <Select value={f.sleep} onValueChange={v => setF({ ...f, sleep: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["good", "broken", "poor"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between"><Label>Observation</Label>
              <Button type="button" size="sm" variant="ghost" onClick={startVoice}><Mic className="h-4 w-4 mr-1" /> Voice</Button>
            </div>
            <Textarea rows={3} value={f.observation} onChange={e => setF({ ...f, observation: e.target.value })} />
          </div>
          <div className="col-span-2"><Label>Behaviour</Label><Textarea rows={2} value={f.behaviour} onChange={e => setF({ ...f, behaviour: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.residentId) { toast.error("Choose a resident"); return; }
            addNote({ ...f, date: new Date().toISOString(), staff: "J. Roberts" } as any);
            toast.success("Note saved");
            setOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DailyNotesPage() {
  const { notes, residents } = useCare();
  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">{notes.length} notes recorded</p>
        </div>
        <NewNote />
      </div>
      <div className="space-y-2">
        {notes.map(n => {
          const r = residents.find(x => x.id === n.residentId);
          return (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-medium">{r?.firstName} {r?.lastName}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{n.shift}</Badge>
                  {n.linkedInterventionId && (
                    <Badge variant="outline" className="text-[10px] bg-info/10 text-info border-info/30 gap-1">
                      <Activity className="h-2.5 w-2.5" /> From intervention
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{n.date.slice(0, 10)} · {n.staff}</span>
                </div>
                <p className="text-sm mt-1">{n.observation}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                  <span>Mood: {n.mood}</span><span>Food: {n.foodIntake}</span>
                  <span>Fluids: {n.fluidIntake}</span><span>Sleep: {n.sleep}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
