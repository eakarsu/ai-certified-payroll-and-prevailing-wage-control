"use client";
import { useEffect, useState } from "react";
import EvidenceUpload from "@/components/EvidenceUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canWrite } from "@/lib/record-policy";

type Weekly = { id: string; title: string; weekEnding: string; payrollNumber: string };
type Packet = { id: string; status: string; snapshotHash: string; issues: string[]; preparedById: string; acceptedById: string | null; receiptReference: string | null; receiptArtifactId: string | null; createdAt: string; snapshot: { assessment?: { ruleVersionId: string | null; calculationScope: string }; sourceAuthority?: string } };
async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) throw Error(value.error || "Packet request failed");
  return value;
}

export default function PayrollPacketWorkspace() {
  const [weeklyRows, setWeeklyRows] = useState<Weekly[]>([]);
  const [weeklyId, setWeeklyId] = useState("");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [role, setRole] = useState("ANALYST");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [artifactIds, setArtifactIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([request("/api/records/WeeklyPayroll?pageSize=100"), request("/api/session")])
      .then(([records, session]) => { if (active) { setWeeklyRows(records.rows); setRole(session.user.role); } })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : "Could not load weekly payroll"); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!weeklyId) { setPackets([]); return; }
    let active = true;
    request(`/api/payroll-packets?weeklyPayrollId=${encodeURIComponent(weeklyId)}`)
      .then(value => { if (active) { setPackets(value.packets); setError(""); } })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : "Could not load packets"); });
    return () => { active = false; };
  }, [weeklyId]);
  async function send(body: unknown, method: "POST" | "PATCH") {
    setBusy(true); setError("");
    try {
      await request("/api/payroll-packets", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const list = await request(`/api/payroll-packets?weeklyPayrollId=${encodeURIComponent(weeklyId)}`);
      setPackets(list.packets);
    } catch (error) { setError(error instanceof Error ? error.message : "Packet action failed"); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-xl border bg-white p-5">
    <h2 className="text-xl font-semibold">Weekly packet review and acknowledgement</h2>
    <p className="text-sm">Freeze a packet from linked payroll lines, the week&apos;s timecards, determinations and rule records. A different staff reviewer accepts a clean snapshot. A recorded acknowledgement is user-supplied evidence, not automatic agency confirmation.</p>
    {error && <p role="alert" className="rounded border border-red-300 p-2">{error}</p>}
    <label className="block space-y-1">Weekly payroll
      <select className="block w-full rounded border p-2" value={weeklyId} onChange={event => { setWeeklyId(event.target.value); setArtifactIds([]); }}>
        <option value="">Select a weekly payroll record</option>
        {weeklyRows.map(row => <option key={row.id} value={row.id}>{row.title} · {row.payrollNumber} · {row.weekEnding.slice(0, 10)}</option>)}
      </select>
    </label>
    {weeklyId && <><Button disabled={!canWrite(role) || busy} onClick={() => void send({ weeklyPayrollId: weeklyId }, "POST")}>Prepare frozen packet</Button>
      <EvidenceUpload key={weeklyId} entity="WeeklyPayroll" id={weeklyId} onSelect={setArtifactIds}/>
      <label className="block space-y-1">Independent review notes<textarea className="block min-h-20 w-full rounded border p-2" maxLength={5000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="State what you reviewed and any remaining limits" /></label>
      <label className="block space-y-1">External acknowledgement reference<Input value={reference} maxLength={200} onChange={event => setReference(event.target.value)} placeholder="Reference from actual external receipt" /></label>
      <div className="space-y-4">{packets.map(packet => <article key={packet.id} className="space-y-2 rounded border p-3">
        <h3 className="font-semibold">{packet.status} · {new Date(packet.createdAt).toLocaleString()}</h3>
        <p className="break-all text-xs">Snapshot SHA-256: {packet.snapshotHash}</p>
        <p className="text-sm">{packet.snapshot.sourceAuthority}</p>
        <p className="text-sm">Rule version: {packet.snapshot.assessment?.ruleVersionId ?? "Not matched"}. {packet.snapshot.assessment?.calculationScope}</p>
        {packet.issues.length ? <ul className="list-disc pl-5 text-sm">{packet.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul> : <p className="text-sm">No machine-detected packet issues. Reviewer must still assess the source and legal requirements.</p>}
        {packet.status === "PREPARED" && <Button disabled={!canWrite(role) || busy || packet.issues.length > 0 || notes.trim().length < 20} onClick={() => void send({ packetId: packet.id, action: "ACCEPT", notes }, "PATCH")}>Accept frozen packet as reviewer</Button>}
        {packet.status === "ACCEPTED_BY_OPERATOR" && <Button disabled={!canWrite(role) || busy || reference.trim().length < 10 || artifactIds.length !== 1} onClick={() => void send({ packetId: packet.id, action: "RECORD_RECEIPT", reference, artifactId: artifactIds[0] }, "PATCH")}>Record reviewed acknowledgement</Button>}
        {packet.receiptReference && <p className="text-sm">User-recorded acknowledgement: {packet.receiptReference} · source {packet.receiptArtifactId}. External acceptance remains unverified.</p>}
        <details><summary>Frozen source snapshot</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(packet.snapshot, null, 2)}</pre></details>
      </article>)}</div>
    </>}
  </section>;
}
