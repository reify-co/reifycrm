'use client';
import { useState, useMemo, useEffect } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const TEAM = {
  owner: { id: "owner", name: "You (Owner)", initials: "YO", role: "owner", color: "#1a6b4a" },
  nikitha: { id: "nikitha", name: "Nikitha", initials: "NK", role: "agent", color: "#c2410c" },
  aman: { id: "aman", name: "Aman", initials: "AM", role: "agent", color: "#1d4ed8" },
};

const DESTINATIONS = [
  "Goa", "Kerala", "Rajasthan", "Himachal Pradesh", "Uttarakhand",
  "Kashmir", "Andaman & Nicobar", "Leh Ladakh", "Northeast India",
  "Karnataka", "Tamil Nadu", "Maharashtra", "Madhya Pradesh", "Gujarat",
];

const PACKAGE_TYPES = [
  "Honeymoon", "Family Tour", "Group Tour", "Solo Trip",
  "Adventure", "Pilgrimage", "Corporate/MICE", "Weekend Getaway",
];

const LEAD_STATUSES = ["New", "Contacted", "Interested", "Proposal Sent", "Negotiating", "Booked", "Lost"];
const LEAD_SOURCES = ["Google Ads", "WhatsApp", "Phone Call", "Email", "Referral"];
const FOLLOWUP_TYPES = ["Call", "WhatsApp", "Email", "Meeting", "Video Call"];
const FOLLOWUP_OUTCOMES = ["Reached", "No Answer", "Callback Requested", "Sent Info", "Meeting Scheduled", "Not Interested", "Converted"];

const STATUS_COLORS = {
  "New": { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
  "Contacted": { bg: "#f1f5f9", text: "#475569", dot: "#64748b" },
  "Interested": { bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
  "Proposal Sent": { bg: "#f3e8ff", text: "#7c3aed", dot: "#8b5cf6" },
  "Negotiating": { bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
  "Booked": { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  "Lost": { bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" },
};

const SOURCE_COLORS = {
  "Google Ads": { bg: "#dbeafe", text: "#1d4ed8" },
  "WhatsApp": { bg: "#dcfce7", text: "#15803d" },
  "Phone Call": { bg: "#fff7ed", text: "#c2410c" },
  "Email": { bg: "#f3e8ff", text: "#7c3aed" },
  "Referral": { bg: "#f0fdf4", text: "#166534" },
};

// Day-based rotation: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// Nikitha: odd days (Mon/Wed/Fri), Aman: even days (Sun/Tue/Thu/Sat)
function getRotationAgent(dateStr, leaveData = {}) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0-6
  const primary = day % 2 === 0 ? "aman" : "nikitha";
  const secondary = primary === "aman" ? "nikitha" : "aman";
  if (leaveData[primary]) return secondary;
  return primary;
}

// Sample leads
const INITIAL_LEADS = [
  {
    id: "L001", name: "Rajesh Sharma", phone: "+91 98201 34567", email: "rajesh.sharma@gmail.com",
    source: "Google Ads", status: "Interested", assignedTo: "nikitha",
    destination: "Goa", packageType: "Family Tour", travelDates: "Jun 10–17 2026",
    paxCount: 4, budget: 45000, specialRequests: "Sea-facing rooms, kids-friendly resort",
    createdAt: "2026-04-21T09:15:00Z", lastContact: "2026-04-25T14:30:00Z",
    nextFollowUp: "2026-04-28T10:00:00Z", daysInPipeline: 6, isOverdue: false,
    notes: "Very keen, comparing 2 resorts. Decision by weekend.",
    followUpLog: [
      { id: "f1", date: "2026-04-25T14:30:00Z", type: "WhatsApp", notes: "Sent resort PDF. Asked about availability.", outcome: "Sent Info", agentId: "nikitha" },
      { id: "f2", date: "2026-04-21T09:15:00Z", type: "Email", notes: "Google Ads lead. Auto-reply sent.", outcome: "Sent Info", agentId: "nikitha" },
    ],
    reminders: [{ id: "r1", dueDate: "2026-04-28", dueTime: "10:00", note: "Follow up on Goa resort quote", isCompleted: false }],
  },
  {
    id: "L002", name: "Priya & Vikram Nair", phone: "+91 99870 56234", email: "priya.nair@outlook.com",
    source: "Google Ads", status: "Proposal Sent", assignedTo: "aman",
    destination: "Kerala", packageType: "Honeymoon", travelDates: "Jul 5–12 2026",
    paxCount: 2, budget: 65000, specialRequests: "Houseboat, backwaters, Ayurveda spa",
    createdAt: "2026-04-20T08:00:00Z", lastContact: "2026-04-24T16:00:00Z",
    nextFollowUp: "2026-04-26T09:00:00Z", daysInPipeline: 7, isOverdue: true,
    notes: "Proposal sent. Awaiting confirmation. Honeymoon couple.",
    followUpLog: [
      { id: "f3", date: "2026-04-24T16:00:00Z", type: "WhatsApp", notes: "Sent Kerala houseboat itinerary. Read receipts show delivered.", outcome: "Sent Info", agentId: "aman" },
    ],
    reminders: [{ id: "r2", dueDate: "2026-04-26", dueTime: "09:00", note: "Follow up on Kerala proposal — overdue", isCompleted: false }],
  },
  {
    id: "L003", name: "Deepak Verma", phone: "+91 97654 12890", email: "deepak.v@yahoo.com",
    source: "Phone Call", status: "Negotiating", assignedTo: "nikitha",
    destination: "Rajasthan", packageType: "Group Tour", travelDates: "Nov 1–8 2026",
    paxCount: 12, budget: 180000, specialRequests: "Heritage hotels, camel safari",
    createdAt: "2026-04-15T11:00:00Z", lastContact: "2026-04-23T15:00:00Z",
    nextFollowUp: "2026-04-27T14:00:00Z", daysInPipeline: 12, isOverdue: false,
    notes: "High-value group. Negotiating heritage hotel pricing. Close to booking.",
    followUpLog: [
      { id: "f4", date: "2026-04-23T15:00:00Z", type: "Call", notes: "Negotiating hotel upgrade for 12 pax.", outcome: "Callback Requested", agentId: "nikitha", duration: "30 min" },
    ],
    reminders: [],
  },
  {
    id: "L004", name: "Sunita Joshi", phone: "+91 88234 56789", email: "sunita.joshi@gmail.com",
    source: "Email", status: "New", assignedTo: "aman",
    destination: "Kashmir", packageType: "Family Tour", travelDates: "May 20–26 2026",
    paxCount: 5, budget: 90000, specialRequests: "Houseboat Dal Lake, Pahalgam",
    createdAt: "2026-04-26T08:30:00Z", lastContact: "", nextFollowUp: "2026-04-27T09:00:00Z",
    daysInPipeline: 1, isOverdue: false, notes: "New Google Ads email inquiry. Not yet contacted.",
    followUpLog: [], reminders: [],
  },
  {
    id: "L005", name: "Meena & Raj Pillai", phone: "+91 94562 78901", email: "meena.pillai@gmail.com",
    source: "Google Ads", status: "Booked", assignedTo: "aman",
    destination: "Andaman & Nicobar", packageType: "Honeymoon", travelDates: "May 10–16 2026",
    paxCount: 2, budget: 72000,
    createdAt: "2026-04-05T13:00:00Z", lastContact: "2026-04-20T11:00:00Z",
    nextFollowUp: "", daysInPipeline: 22, isOverdue: false,
    notes: "Booked! Full payment received. Ferry tickets arranged.",
    followUpLog: [
      { id: "f5", date: "2026-04-20T11:00:00Z", type: "Call", notes: "Booking confirmed. Payment received.", outcome: "Converted", agentId: "aman", duration: "10 min" },
    ],
    reminders: [],
  },
  {
    id: "L006", name: "Ananya Krishnan", phone: "+91 93456 78901", email: "ananya.k@gmail.com",
    source: "WhatsApp", status: "Contacted", assignedTo: "nikitha",
    destination: "Himachal Pradesh", packageType: "Weekend Getaway", travelDates: "May 3–5 2026",
    paxCount: 3, budget: 18000, specialRequests: "Manali snow experience",
    createdAt: "2026-04-24T10:00:00Z", lastContact: "2026-04-24T12:00:00Z",
    nextFollowUp: "2026-04-28T10:00:00Z", daysInPipeline: 3, isOverdue: false,
    notes: "WhatsApp inquiry. Initial contact made. Budget tight.",
    followUpLog: [
      { id: "f6", date: "2026-04-24T12:00:00Z", type: "WhatsApp", notes: "Replied to inquiry. Sent Manali options.", outcome: "Sent Info", agentId: "nikitha" },
    ],
    reminders: [],
  },
];

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

function Avatar({ name, initials, color, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "22", color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      border: `1.5px solid ${color}44`,
      fontFamily: "'DM Mono', monospace",
    }}>{initials}</div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["New"];
  return (
    <span style={{
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

function SourceBadge({ source }) {
  const c = SOURCE_COLORS[source] || { bg: "#f1f5f9", text: "#475569" };
  return (
    <span style={{
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20,
    }}>{source}</span>
  );
}

function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: width,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", fontFamily: "'DM Serif Display', serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "16px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", options, required, placeholder, style }) {
  const base = {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
    fontSize: 13, color: "#0f172a", background: "#f8fafc", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", ...style,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>{label}{required && <span style={{ color: "#ef4444" }}>*</span>}</label>}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={base}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", small, style, disabled }) {
  const styles = {
    primary: { background: "#1a6b4a", color: "#fff", border: "none" },
    secondary: { background: "#f1f5f9", color: "#334155", border: "1.5px solid #e2e8f0" },
    danger: { background: "#fee2e2", color: "#b91c1c", border: "1.5px solid #fca5a5" },
    ghost: { background: "none", color: "#64748b", border: "1px solid #e2e8f0" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], borderRadius: 8, padding: small ? "5px 12px" : "8px 16px",
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1,
      fontFamily: "inherit", transition: "all 0.15s", ...style,
    }}>{children}</button>
  );
}

// ─── GMAIL IMPORT PANEL ──────────────────────────────────────────────────────

function GmailImportPanel({ onImport }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | searching | done | error
  const [foundLeads, setFoundLeads] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [msg, setMsg] = useState("");

  async function connectAndSearch() {
    setStatus("connecting");
    setMsg("Connecting to Gmail via MCP...");
    // Simulate MCP Gmail connection + search for Google Ads lead emails
    await new Promise(r => setTimeout(r, 1200));
    setStatus("searching");
    setMsg("Searching for Google Ads lead notification emails...");
    await new Promise(r => setTimeout(r, 1500));

    // In real integration this would call Gmail MCP search_messages
    // with query: "from:noreply@google.com Google Ads New lead"
    const mockFound = [
      { id: "gm1", name: "Rahul Desai", phone: "+91 90123 45678", email: "rahul.desai@gmail.com", destination: "Leh Ladakh", source: "Google Ads", campaign: "Adventure India 2026", receivedAt: "2026-04-27T08:12:00Z" },
      { id: "gm2", name: "Pooja Agarwal", phone: "+91 96543 21098", email: "pooja.agarwal@gmail.com", destination: "Kerala", source: "Google Ads", campaign: "South India Honeymoon 2026", receivedAt: "2026-04-26T17:44:00Z" },
    ];
    setFoundLeads(mockFound);
    setSelected(new Set(mockFound.map(l => l.id)));
    setStatus("done");
    setMsg(`Found ${mockFound.length} new leads from Gmail.`);
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function importSelected() {
    const toImport = foundLeads.filter(l => selected.has(l.id));
    onImport(toImport);
  }

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
        Connect Gmail to automatically find and import Google Ads lead notification emails. New leads will be created and assigned based on today's rotation.
      </p>

      {status === "idle" && (
        <Btn onClick={connectAndSearch}>
          📧 Connect Gmail & Search for Leads
        </Btn>
      )}

      {(status === "connecting" || status === "searching") && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
          <span style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>⏳</span>
          <span style={{ fontSize: 13, color: "#166534" }}>{msg}</span>
        </div>
      )}

      {status === "done" && foundLeads.length === 0 && (
        <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 10, fontSize: 13, color: "#64748b" }}>
          ✅ No new lead emails found since last import.
        </div>
      )}

      {status === "done" && foundLeads.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: "#166534", background: "#f0fdf4", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
            ✅ {msg}
          </div>
          {foundLeads.map(lead => (
            <div key={lead.id} style={{
              border: `1.5px solid ${selected.has(lead.id) ? "#86efac" : "#e2e8f0"}`,
              borderRadius: 10, padding: "12px 14px", marginBottom: 8,
              background: selected.has(lead.id) ? "#f0fdf4" : "#fff",
              cursor: "pointer", transition: "all 0.15s",
            }} onClick={() => toggleSelect(lead.id)}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{lead.phone} · {lead.email}</div>
                  <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 4 }}>📍 {lead.destination} · 🎯 {lead.campaign}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Received: {new Date(lead.receivedAt).toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn onClick={importSelected} disabled={selected.size === 0}>
              ✅ Import {selected.size} Lead{selected.size !== 1 ? "s" : ""}
            </Btn>
            <Btn variant="secondary" onClick={() => { setStatus("idle"); setFoundLeads([]); }}>Reset</Btn>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: "14px 16px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>ℹ️ To enable real Gmail sync:</div>
        <ol style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#78350f", lineHeight: 1.8 }}>
          <li>Connect Gmail MCP in Claude Settings → Connectors</li>
          <li>Grant read access to your inbox</li>
          <li>This panel will then search for emails from <code>noreply@google.com</code> with subject containing "New lead"</li>
          <li>Lead details will be parsed and pre-filled automatically</li>
        </ol>
      </div>
    </div>
  );
}

// ─── LEAD FORM ───────────────────────────────────────────────────────────────

function LeadForm({ lead, onSave, onCancel, currentUser }) {
  const isNew = !lead?.id;
  const today = new Date().toISOString().split("T")[0];
  const assignedAgent = getRotationAgent(today);

  const [form, setForm] = useState({
    name: lead?.name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    source: lead?.source || "Google Ads",
    status: lead?.status || "New",
    assignedTo: lead?.assignedTo || assignedAgent,
    destination: lead?.destination || "",
    packageType: lead?.packageType || "",
    travelDates: lead?.travelDates || "",
    paxCount: lead?.paxCount || 2,
    budget: lead?.budget || "",
    specialRequests: lead?.specialRequests || "",
    notes: lead?.notes || "",
  });

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit() {
    if (!form.name || !form.phone) return alert("Name and phone are required.");
    onSave({ ...lead, ...form, paxCount: Number(form.paxCount), budget: Number(form.budget) });
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Input label="Full Name" value={form.name} onChange={set("name")} required />
        <Input label="Phone" value={form.phone} onChange={set("phone")} required />
        <Input label="Email" value={form.email} onChange={set("email")} type="email" />
        <Input label="Source" value={form.source} onChange={set("source")} options={LEAD_SOURCES} />
        <Input label="Status" value={form.status} onChange={set("status")} options={LEAD_STATUSES} />
        <Input label="Assign To" value={form.assignedTo} onChange={set("assignedTo")}
          options={currentUser === "owner" ? ["nikitha", "aman"] : []} />
        <Input label="Destination" value={form.destination} onChange={set("destination")} options={DESTINATIONS} />
        <Input label="Package Type" value={form.packageType} onChange={set("packageType")} options={PACKAGE_TYPES} />
        <Input label="Travel Dates" value={form.travelDates} onChange={set("travelDates")} placeholder="e.g. Jun 10–17 2026" />
        <Input label="No. of Pax" value={form.paxCount} onChange={set("paxCount")} type="number" />
        <Input label="Budget (₹)" value={form.budget} onChange={set("budget")} type="number" placeholder="e.g. 45000" style={{ gridColumn: "1/-1" }} />
      </div>
      <Input label="Special Requests" value={form.specialRequests} onChange={set("specialRequests")} type="textarea" />
      <Input label="Internal Notes" value={form.notes} onChange={set("notes")} type="textarea" />
      {isNew && (
        <div style={{ padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#166534", marginBottom: 14 }}>
          🔄 Auto-assigned to <strong>{assignedAgent === "nikitha" ? "Nikitha" : "Aman"}</strong> based on today's rotation schedule.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={handleSubmit}>{isNew ? "Create Lead" : "Save Changes"}</Btn>
      </div>
    </div>
  );
}

// ─── FOLLOW UP LOG TAB ───────────────────────────────────────────────────────

function FollowUpTab({ lead, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: "Call", notes: "", outcome: "Reached", duration: "" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  function addLog() {
    const newLog = {
      id: "f" + Date.now(), date: new Date().toISOString(),
      ...form, agentId: lead.assignedTo,
    };
    onUpdate({ ...lead, followUpLog: [newLog, ...lead.followUpLog], lastContact: newLog.date });
    setShowAdd(false);
    setForm({ type: "Call", notes: "", outcome: "Reached", duration: "" });
  }

  const typeIcons = { Call: "📞", WhatsApp: "💬", Email: "📧", Meeting: "🤝", "Video Call": "🎥" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Follow-up Log ({lead.followUpLog.length})</span>
        <Btn small onClick={() => setShowAdd(!showAdd)}>+ Log Interaction</Btn>
      </div>

      {showAdd && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Type" value={form.type} onChange={set("type")} options={FOLLOWUP_TYPES} />
            <Input label="Outcome" value={form.outcome} onChange={set("outcome")} options={FOLLOWUP_OUTCOMES} />
            <Input label="Duration (optional)" value={form.duration} onChange={set("duration")} placeholder="e.g. 15 min" />
          </div>
          <Input label="Notes" value={form.notes} onChange={set("notes")} type="textarea" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" small onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn small onClick={addLog}>Save</Btn>
          </div>
        </div>
      )}

      {lead.followUpLog.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>No follow-up logs yet.</div>
      )}

      {lead.followUpLog.map(log => (
        <div key={log.id} style={{ borderLeft: "3px solid #1a6b4a33", paddingLeft: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>{typeIcons[log.type] || "📝"}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{log.type}</span>
              {log.duration && <span style={{ fontSize: 11, color: "#94a3b8" }}>· {log.duration}</span>}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(log.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.6 }}>{log.notes}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 20 }}>{log.outcome}</span>
            <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>by {TEAM[log.agentId]?.name || log.agentId}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── REMINDERS TAB ───────────────────────────────────────────────────────────

function RemindersTab({ lead, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ dueDate: "", dueTime: "09:00", note: "" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  function addReminder() {
    const r = { id: "r" + Date.now(), ...form, isCompleted: false };
    onUpdate({ ...lead, reminders: [...lead.reminders, r] });
    setShowAdd(false);
    setForm({ dueDate: "", dueTime: "09:00", note: "" });
  }

  function toggleComplete(id) {
    onUpdate({ ...lead, reminders: lead.reminders.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r) });
  }

  const pending = lead.reminders.filter(r => !r.isCompleted);
  const done = lead.reminders.filter(r => r.isCompleted);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Reminders ({pending.length} pending)</span>
        <Btn small onClick={() => setShowAdd(!showAdd)}>+ Add Reminder</Btn>
      </div>
      {showAdd && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Input label="Due Date" value={form.dueDate} onChange={set("dueDate")} type="date" />
            <Input label="Due Time" value={form.dueTime} onChange={set("dueTime")} type="time" />
          </div>
          <Input label="Note" value={form.note} onChange={set("note")} type="textarea" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" small onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn small onClick={addReminder}>Save</Btn>
          </div>
        </div>
      )}
      {lead.reminders.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>No reminders set.</div>}
      {pending.map(r => (
        <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: "1.5px solid #fde68a", borderRadius: 10, marginBottom: 8, background: "#fefce8" }}>
          <input type="checkbox" checked={false} onChange={() => toggleComplete(r.id)} style={{ marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{r.note}</div>
            <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>📅 {r.dueDate} at {r.dueTime}</div>
          </div>
        </div>
      ))}
      {done.map(r => (
        <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, marginBottom: 8, opacity: 0.55 }}>
          <input type="checkbox" checked={true} onChange={() => toggleComplete(r.id)} style={{ marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#64748b", textDecoration: "line-through" }}>{r.note}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>📅 {r.dueDate} at {r.dueTime}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LEAD DETAIL DRAWER ──────────────────────────────────────────────────────

function LeadDrawer({ lead, onClose, onUpdate, currentUser }) {
  const [tab, setTab] = useState("info");
  const agent = TEAM[lead.assignedTo];

  const tabs = [
    { id: "info", label: "Lead Info" },
    { id: "followup", label: `Follow-ups (${lead.followUpLog.length})` },
    { id: "reminders", label: `Reminders (${lead.reminders.filter(r => !r.isCompleted).length})` },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex" }} onClick={onClose}>
      <div style={{ flex: 1 }} />
      <div style={{
        width: 560, background: "#fff", height: "100vh", overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{lead.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{lead.phone} · {lead.email}</div>
            </div>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#64748b", fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <StatusBadge status={lead.status} />
            <SourceBadge source={lead.source} />
            <span style={{ fontSize: 12, color: "#64748b" }}>📍 {lead.destination}</span>
            {agent && <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
              <Avatar name={agent.name} initials={agent.initials} color={agent.color} size={24} />
              <span style={{ fontSize: 12, color: "#64748b" }}>{agent.name}</span>
            </div>}
          </div>
          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[
              { label: "Budget", value: `₹${Number(lead.budget).toLocaleString("en-IN")}` },
              { label: "Pax", value: `${lead.paxCount} travellers` },
              { label: "Pipeline", value: `${lead.daysInPipeline}d` },
            ].map(s => (
              <div key={s.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Pass to other agent */}
          {currentUser === "owner" && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#166534" }}>Pass lead to other agent</span>
              <Btn small variant="ghost" onClick={() => {
                const newAgent = lead.assignedTo === "nikitha" ? "aman" : "nikitha";
                onUpdate({ ...lead, assignedTo: newAgent });
              }}>
                → Pass to {lead.assignedTo === "nikitha" ? "Aman" : "Nikitha"}
              </Btn>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 24px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "12px 0", marginRight: 24, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.id ? "#1a6b4a" : "transparent"}`,
              color: tab === t.id ? "#1a6b4a" : "#64748b", fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13, cursor: "pointer", transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: "20px 24px", flex: 1 }}>
          {tab === "info" && (
            <LeadForm lead={lead} onSave={updated => { onUpdate(updated); }} onCancel={onClose} currentUser={currentUser} />
          )}
          {tab === "followup" && <FollowUpTab lead={lead} onUpdate={onUpdate} />}
          {tab === "reminders" && <RemindersTab lead={lead} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
}

// ─── ROTATION BANNER ─────────────────────────────────────────────────────────

function RotationBanner({ onLeaveChange, leaveData }) {
  const today = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIdx = today.getDay();
  const todayAgent = getRotationAgent(today.toISOString(), leaveData);

  // Show next 7 days
  const schedule = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const agentId = getRotationAgent(d.toISOString(), leaveData);
    return { date: d, dayIdx: d.getDay(), agentId, isToday: i === 0 };
  });

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Today's Lead Assignment</span>
          <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>· Auto-rotation schedule</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["nikitha", "aman"].map(agentId => {
            const agent = TEAM[agentId];
            const onLeave = !!leaveData[agentId];
            return (
              <button key={agentId} onClick={() => onLeaveChange(agentId, !onLeave)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
                borderRadius: 8, border: `1.5px solid ${onLeave ? "#fca5a5" : "#e2e8f0"}`,
                background: onLeave ? "#fee2e2" : "#f8fafc", cursor: "pointer",
                fontSize: 12, color: onLeave ? "#b91c1c" : "#475569",
              }}>
                <Avatar initials={agent.initials} color={agent.color} size={20} />
                {agent.name} {onLeave ? "🏥 On Leave" : "✓ Available"}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {schedule.map(({ date, dayIdx, agentId, isToday }) => {
          const agent = TEAM[agentId];
          return (
            <div key={dayIdx + date.getDate()} style={{
              minWidth: 64, padding: "8px 10px", borderRadius: 10, textAlign: "center",
              border: `1.5px solid ${isToday ? agent.color : "#e2e8f0"}`,
              background: isToday ? agent.color + "12" : "#f8fafc",
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: isToday ? agent.color : "#94a3b8", fontWeight: isToday ? 700 : 500 }}>{days[dayIdx]}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{date.getDate()}</div>
              <Avatar initials={agent.initials} color={agent.color} size={22} />
              <div style={{ fontSize: 10, fontWeight: 700, color: agent.color, marginTop: 4 }}>
                {agentId === "nikitha" ? "NK" : "AM"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OWNER DASHBOARD ─────────────────────────────────────────────────────────

function OwnerDashboard({ leads, leaveData, onLeaveChange }) {
  const total = leads.length;
  const booked = leads.filter(l => l.status === "Booked").length;
  const lost = leads.filter(l => l.status === "Lost").length;
  const overdue = leads.filter(l => l.isOverdue).length;
  const pipelineValue = leads.filter(l => !["Booked", "Lost"].includes(l.status)).reduce((s, l) => s + Number(l.budget), 0);
  const bookedValue = leads.filter(l => l.status === "Booked").reduce((s, l) => s + Number(l.budget), 0);

  const byStatus = LEAD_STATUSES.map(s => ({ status: s, count: leads.filter(l => l.status === s).length }));
  const byAgent = ["nikitha", "aman"].map(id => ({
    agent: TEAM[id],
    total: leads.filter(l => l.assignedTo === id).length,
    booked: leads.filter(l => l.assignedTo === id && l.status === "Booked").length,
    active: leads.filter(l => l.assignedTo === id && !["Booked", "Lost"].includes(l.status)).length,
    overdue: leads.filter(l => l.assignedTo === id && l.isOverdue).length,
  }));

  const kpis = [
    { label: "Total Leads", value: total, icon: "👥", color: "#1d4ed8" },
    { label: "Booked", value: booked, icon: "✅", color: "#15803d" },
    { label: "Pipeline Value", value: `₹${(pipelineValue / 1000).toFixed(0)}K`, icon: "💰", color: "#c2410c" },
    { label: "Revenue", value: `₹${(bookedValue / 1000).toFixed(0)}K`, icon: "🏆", color: "#7c3aed" },
    { label: "Overdue", value: overdue, icon: "⚠️", color: "#b91c1c" },
  ];

  return (
    <div>
      <RotationBanner leaveData={leaveData} onLeaveChange={onLeaveChange} />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 22 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, fontFamily: "'DM Serif Display', serif", marginTop: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Pipeline */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 14, fontFamily: "'DM Serif Display', serif" }}>Pipeline by Stage</div>
          {byStatus.map(({ status, count }) => {
            const c = STATUS_COLORS[status];
            const pct = total ? (count / total) * 100 : 0;
            return (
              <div key={status} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <StatusBadge status={status} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: c.dot, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Agent Performance */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 14, fontFamily: "'DM Serif Display', serif" }}>Agent Performance</div>
          {byAgent.map(({ agent, total: t, booked: b, active: a, overdue: o }) => (
            <div key={agent.id} style={{ padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar initials={agent.initials} color={agent.color} size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{agent.name}</div>
                  {leaveData[agent.id] && <span style={{ fontSize: 11, color: "#b91c1c", background: "#fee2e2", padding: "1px 6px", borderRadius: 10 }}>On Leave</span>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {[["Total", t, "#1d4ed8"], ["Active", a, "#c2410c"], ["Booked", b, "#15803d"], ["Overdue", o, "#b91c1c"]].map(([label, val, color]) => (
                  <div key={label} style={{ textAlign: "center", background: "#f8fafc", borderRadius: 8, padding: "6px 4px" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Source breakdown */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: "#64748b", marginBottom: 8 }}>Leads by Source</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LEAD_SOURCES.map(source => {
                const count = leads.filter(l => l.source === source).length;
                if (!count) return null;
                return <span key={source} style={{ ...SOURCE_COLORS[source], fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: SOURCE_COLORS[source]?.bg }}>{source}: {count}</span>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LEADS TABLE ─────────────────────────────────────────────────────────────

function LeadsTable({ leads, onSelectLead, onAddLead, currentUser, allLeads }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");
  const [showGmail, setShowGmail] = useState(false);
  const [localLeads, setLocalLeads] = useState(leads);

  useEffect(() => { setLocalLeads(leads); }, [leads]);

  const filtered = useMemo(() => {
    let r = localLeads;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.destination?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") r = r.filter(l => l.status === statusFilter);
    if (sourceFilter !== "All") r = r.filter(l => l.source === sourceFilter);
    if (agentFilter !== "All") r = r.filter(l => l.assignedTo === agentFilter);
    return r;
  }, [localLeads, search, statusFilter, sourceFilter, agentFilter]);

  function handleGmailImport(importedLeads) {
    const today = new Date().toISOString().split("T")[0];
    const newLeads = importedLeads.map(l => ({
      id: "L" + Date.now() + Math.random(),
      name: l.name, phone: l.phone, email: l.email,
      source: "Google Ads", status: "New",
      assignedTo: getRotationAgent(today),
      destination: l.destination || "", packageType: "",
      travelDates: "", paxCount: 2, budget: 0,
      createdAt: new Date().toISOString(),
      lastContact: "", nextFollowUp: "",
      daysInPipeline: 0, isOverdue: false,
      notes: `Imported from Gmail. Campaign: ${l.campaign || ""}`,
      followUpLog: [], reminders: [],
    }));
    onAddLead(newLeads);
    setShowGmail(false);
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, destination..."
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#475569", background: "#f8fafc" }}>
          <option value="All">All Statuses</option>
          {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#475569", background: "#f8fafc" }}>
          <option value="All">All Sources</option>
          {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        {currentUser === "owner" && (
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#475569", background: "#f8fafc" }}>
            <option value="All">All Agents</option>
            <option value="nikitha">Nikitha</option>
            <option value="aman">Aman</option>
          </select>
        )}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <Btn variant="secondary" onClick={() => setShowGmail(true)}>📧 Import from Gmail</Btn>
          <Btn onClick={() => onSelectLead("new")}>+ Add Lead</Btn>
        </div>
      </div>

      {/* Gmail Modal */}
      {showGmail && (
        <Modal title="Import Leads from Gmail" onClose={() => setShowGmail(false)} width={560}>
          <GmailImportPanel onImport={handleGmailImport} />
        </Modal>
      )}

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Lead", "Source", "Destination", "Budget", "Status", "Agent", "Next Follow-up", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 13 }}>No leads found.</td></tr>
              )}
              {filtered.map((lead, i) => {
                const agent = TEAM[lead.assignedTo];
                return (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                    onClick={() => onSelectLead(lead)}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{lead.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{lead.phone}</div>
                      {lead.isOverdue && <span style={{ fontSize: 10, color: "#b91c1c", background: "#fee2e2", padding: "1px 5px", borderRadius: 6, marginTop: 2, display: "inline-block" }}>Overdue</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}><SourceBadge source={lead.source} /></td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#0f172a" }}>{lead.destination}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{lead.packageType}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0f172a" }}>₹{Number(lead.budget).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 14px" }}><StatusBadge status={lead.status} /></td>
                    <td style={{ padding: "12px 14px" }}>
                      {agent && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar initials={agent.initials} color={agent.color} size={24} />
                        <span style={{ fontSize: 12, color: "#475569" }}>{agent.name}</span>
                      </div>}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: lead.isOverdue ? "#b91c1c" : "#64748b" }}>
                      {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                          style={{ padding: "4px 8px", borderRadius: 6, background: "#dcfce7", color: "#15803d", fontSize: 12, textDecoration: "none" }}>WA</a>
                        <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                          style={{ padding: "4px 8px", borderRadius: 6, background: "#fff7ed", color: "#c2410c", fontSize: 12, textDecoration: "none" }}>📞</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
          <span>Showing {filtered.length} of {localLeads.length} leads</span>
          <span>{localLeads.filter(l => l.isOverdue).length} overdue</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function ReifyCRM() {
  const [currentUser, setCurrentUser] = useState("owner");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [leaveData, setLeaveData] = useState({});

  const visibleLeads = currentUser === "owner"
    ? leads
    : leads.filter(l => l.assignedTo === currentUser);

  function handleLeaveChange(agentId, onLeave) {
    setLeaveData(prev => ({ ...prev, [agentId]: onLeave ? true : undefined }));
  }

  function handleSelectLead(lead) {
    if (lead === "new") { setShowAddLead(true); return; }
    setSelectedLead(lead);
  }

  function handleUpdateLead(updated) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelectedLead(updated);
  }

  function handleCreateLead(data) {
    const newLead = {
      ...data,
      id: "L" + Date.now(),
      createdAt: new Date().toISOString(),
      lastContact: "",
      nextFollowUp: "",
      daysInPipeline: 0,
      isOverdue: false,
      followUpLog: [],
      reminders: [],
    };
    setLeads(prev => [newLead, ...prev]);
    setShowAddLead(false);
  }

  function handleAddLeads(newLeads) {
    setLeads(prev => [...newLeads, ...prev]);
  }

  const sidebarItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard", showFor: ["owner"] },
    { id: "leads", icon: "👥", label: "My Leads", showFor: ["nikitha", "aman"] },
    { id: "allleads", icon: "📋", label: "All Leads", showFor: ["owner"] },
  ];

  const overdueCount = visibleLeads.filter(l => l.isOverdue).length;
  const pendingReminders = leads.flatMap(l => l.reminders.filter(r => !r.isCompleted)).length;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", height: "100vh", background: "#f8fafc", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: 220, background: "#0f172a", display: "flex", flexDirection: "column",
        height: "100vh", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1a6b4a, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✈️</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", color: "#f8fafc", fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Reify Travels</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>CRM Dashboard</div>
            </div>
          </div>
        </div>

        {/* User switcher */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Viewing As</div>
          {Object.values(TEAM).map(u => (
            <button key={u.id} onClick={() => { setCurrentUser(u.id); setActiveTab(u.id === "owner" ? "dashboard" : "leads"); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
              borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 4,
              background: currentUser === u.id ? "#1e293b" : "transparent",
              transition: "background 0.15s",
            }}>
              <Avatar initials={u.initials} color={u.color} size={24} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: currentUser === u.id ? "#f8fafc" : "#94a3b8" }}>{u.name}</div>
                <div style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>{u.role}</div>
              </div>
              {currentUser === u.id && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: u.color }} />}
            </button>
          ))}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {[
            { id: "dashboard", icon: "📊", label: "Dashboard", roles: ["owner"] },
            { id: "allleads", icon: "📋", label: "All Leads", roles: ["owner"], badge: leads.length },
            { id: "leads", icon: "👤", label: "My Leads", roles: ["nikitha", "aman"], badge: visibleLeads.length },
            { id: "overdue", icon: "⚠️", label: "Overdue", roles: ["owner", "nikitha", "aman"], badge: overdueCount },
          ].filter(item => item.roles.includes(currentUser)).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2,
              background: activeTab === item.id ? "#1e293b" : "transparent",
              transition: "background 0.15s",
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: activeTab === item.id ? "#f8fafc" : "#64748b", flex: 1, textAlign: "left" }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: activeTab === item.id ? "#1a6b4a" : "#1e293b", color: activeTab === item.id ? "#fff" : "#64748b", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Reminders notice */}
        {pendingReminders > 0 && (
          <div style={{ margin: "0 10px 10px", padding: "10px 12px", background: "#fef9c3", borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>🔔 {pendingReminders} pending reminder{pendingReminders !== 1 ? "s" : ""}</div>
          </div>
        )}

        {/* Bottom user */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar initials={TEAM[currentUser].initials} color={TEAM[currentUser].color} size={28} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc" }}>{TEAM[currentUser].name}</div>
              <div style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>{TEAM[currentUser].role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column" }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#0f172a" }}>
              {activeTab === "dashboard" && "Owner Dashboard"}
              {activeTab === "allleads" && "All Leads"}
              {activeTab === "leads" && "My Leads"}
              {activeTab === "overdue" && "Overdue Follow-ups"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" · "}{TEAM[currentUser].name}
            </p>
          </div>
          {(activeTab === "allleads" || activeTab === "leads") && (
            <Btn onClick={() => setShowAddLead(true)}>+ Add Lead Manually</Btn>
          )}
        </div>

        {/* Content */}
        {activeTab === "dashboard" && (
          <OwnerDashboard leads={leads} leaveData={leaveData} onLeaveChange={handleLeaveChange} />
        )}
        {(activeTab === "allleads" || activeTab === "leads") && (
          <LeadsTable
            leads={visibleLeads}
            onSelectLead={handleSelectLead}
            onAddLead={handleAddLeads}
            currentUser={currentUser}
            allLeads={leads}
          />
        )}
        {activeTab === "overdue" && (
          <LeadsTable
            leads={visibleLeads.filter(l => l.isOverdue)}
            onSelectLead={handleSelectLead}
            onAddLead={handleAddLeads}
            currentUser={currentUser}
            allLeads={leads}
          />
        )}
      </main>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
          currentUser={currentUser}
        />
      )}

      {/* Add Lead Modal */}
      {showAddLead && (
        <Modal title="Add New Lead" onClose={() => setShowAddLead(false)} width={640}>
          <LeadForm
            lead={null}
            onSave={handleCreateLead}
            onCancel={() => setShowAddLead(false)}
            currentUser={currentUser}
          />
        </Modal>
      )}
    </div>
  );
}