'use client';

const T = {
  navy: "#0d2d3a",
  teal: "#1a7a8a",
  bg: "#f0f7f9",
  border: "#cce4ea",
  muted: "#5a7d88",
  faint: "#e8f4f7",
  itineraryTeal: "#1a2e2a",
  amber: "#c4834a",
  sage: "#8A9A84",
  paper: "#faf8f4",
};

function parseLeadDate(value: string) {
  if (!value) return null;
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) return iso;
  const match = String(value).match(/(\d{1,2})[-/\s]([A-Za-z]{3,}|\d{1,2})[-/\s](\d{2,4})/);
  if (!match) return null;
  const monthMap: any = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
  const month = /^\d+$/.test(match[2]) ? Number(match[2]) - 1 : monthMap[match[2].slice(0, 3).toLowerCase()];
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  if (month === undefined || Number.isNaN(year)) return null;
  return new Date(year, month, Number(match[1]));
}

function formatLeadDate(value: string) {
  const date = parseLeadDate(value);
  return date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
}

function getLeadEndDate(start: string, days: any) {
  const date = parseLeadDate(start);
  const count = Number(days || 0);
  if (!date || !count) return "";
  const end = new Date(date);
  end.setDate(end.getDate() + Math.max(count - 1, 0));
  return end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getDefaultItinerary(lead: any = {}) {
  return {
    stage: "Review",
    costMode: "Total Package",
    costAmount: Number(lead.budget || 0),
    note: "Availability of the mentioned hotels and services will be checked and confirmed at the time of booking only.",
    introCost: {},
    route: {},
    cab: {},
    overview: {},
    dayWise: {},
    hotels: {},
    inclusions: {},
    goodToKnow: {},
    invoice: {},
  };
}

function mergeItinerary(lead: any) {
  return { ...getDefaultItinerary(lead), ...(lead.itinerary || {}) };
}

function paxLabel(lead: any) {
  const pax = Number(lead.paxCount || 0);
  return pax ? `${String(pax).padStart(2, "0")} Traveller${pax === 1 ? "" : "s"}` : "Travellers to be confirmed";
}

function outputDays(lead: any) {
  const days = Math.max(Number(lead.days || 1), 1);
  const start = parseLeadDate(lead.tripDate) || new Date();
  const destination = lead.destination || lead.landingPage || "Northeast India";
  const mid = destination === "Meghalaya" ? "Shillong" : destination;
  return Array.from({ length: Math.min(days, 5) }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const isLast = index === Math.min(days, 5) - 1;
    return {
      day: index + 1,
      date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      weekday: date.toLocaleDateString("en-IN", { weekday: "long" }),
      route: index === 0 ? `Arrival to ${mid}` : isLast ? `${mid} to Drop` : `Explore ${mid}`,
      stay: isLast ? "Departure" : mid,
      sights: isLast ? [] : ["Scenic route", "Local sightseeing"],
      drop: isLast,
    };
  });
}

function Btn({ children, onClick, variant = "primary" }: any) {
  const style = variant === "secondary"
    ? { background: T.faint, color: T.navy, border: `1.5px solid ${T.border}` }
    : { background: T.navy, color: "#fff", border: "none" };
  return <button onClick={onClick} style={{ ...style, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", options }: any) {
  const base: any = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 13, color: T.navy, background: T.faint, outline: "none", fontFamily: "inherit" };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 5 }}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={base}>
          {options.map((option: string) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...base, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={base} />
      )}
    </div>
  );
}

export default function ItineraryBuilder({ lead, onUpdate }: any) {
  const itinerary = mergeItinerary(lead);
  const destination = lead.destination || lead.landingPage || "Northeast India";
  const perPerson = lead.paxCount ? Math.round(Number(itinerary.costAmount || 0) / Number(lead.paxCount || 1)) : Number(itinerary.costAmount || 0);
  const previewDays = outputDays(lead);
  const setItinerary = (patch: any) => onUpdate({ ...lead, itinerary: { ...itinerary, ...patch } });
  const setStage = (stage: string) => setItinerary({
    stage,
    note: stage === "Payment"
      ? "Availability for the package has been checked. Confirmation is subject to booking and receipt of payment."
      : "Availability of the mentioned hotels and services will be checked and confirmed at the time of booking only.",
  });
  const field = (label: string, value: any) => (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, lineHeight: 1.35 }}>{value || "-"}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 390px", gap: 18, alignItems: "start" }}>
      <div>
        <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, color: T.navy, fontFamily: "Georgia,serif" }}>Itinerary Builder</h2>
              <p style={{ margin: "5px 0 0", fontSize: 13, color: T.muted }}>Connected to this CRM lead. Route, hotel, cab and day-wise controls come next.</p>
            </div>
            <Btn variant="secondary" onClick={() => window.print()}>Print Preview</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(140px,1fr))", gap: "0 18px", marginBottom: 10 }}>
            {field("Customer", lead.name)}
            {field("Phone", lead.phone)}
            {field("Destination", destination)}
            {field("Pax", paxLabel(lead))}
            {field("Start Date", formatLeadDate(lead.tripDate))}
            {field("End Date", getLeadEndDate(lead.tripDate, lead.days))}
            {field("Days", lead.days ? `${lead.days} Days` : "-")}
            {field("CRM Budget", lead.budget ? `Rs ${Number(lead.budget).toLocaleString("en-IN")}` : "-")}
          </div>
        </section>

        <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 15, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>Intro + Cost</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(150px,1fr))", gap: "0 14px" }}>
            <Input label="Itinerary Stage" value={itinerary.stage} onChange={setStage} options={["Review", "Payment"]} />
            <Input label="Cost Mode" value={itinerary.costMode} onChange={(costMode: string) => setItinerary({ costMode })} options={["Total Package", "Per Person", "Per Family"]} />
            <Input label="Cost Amount" value={itinerary.costAmount} onChange={(costAmount: any) => setItinerary({ costAmount: Number(costAmount || 0) })} type="number" />
          </div>
          <Input label="Note Message" value={itinerary.note} onChange={(note: string) => setItinerary({ note })} type="textarea" />
        </section>

        <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 15, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>Module Roadmap</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(160px,1fr))", gap: 10 }}>
            {["About the Trip", "Cab Details", "Itinerary Overview", "Day Wise Plan", "Hotel Details", "Inclusions & Exclusions", "Good to Know", "Invoice"].map((name, index) => (
              <div key={name} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 13px", background: index < 2 ? T.faint : "#fff" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: T.navy }}>{name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 5, lineHeight: 1.45 }}>{index < 2 ? "Next build target" : "Reserved in itinerary data model"}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside style={{ position: "sticky", top: 0 }}>
        <div style={{ width: 390, maxWidth: "100%", background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 45px rgba(13,45,58,0.12)" }}>
          <div style={{ minHeight: 390, padding: 22, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(180deg,rgba(13,45,58,0.20),rgba(13,45,58,0.92)),url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80') center/cover" }}>
            <img src="/assets/images/app_logo.png" alt="Reify Travels" style={{ width: 82, height: 52, objectFit: "contain", alignSelf: "flex-end", filter: "drop-shadow(0 5px 14px rgba(0,0,0,0.25))" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, marginBottom: 10 }}>Crafted just for you</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 38, fontWeight: 800, lineHeight: 1 }}>{lead.name || "Dear Guest"}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 34, fontStyle: "italic", lineHeight: 1.05, color: "#d6e0cf", marginTop: 18 }}>Your trip to<br />{destination}<br />is ready</div>
              <div style={{ fontSize: 13, marginTop: 16, opacity: 0.88 }}>{lead.days || 0} days - {paxLabel(lead)}</div>
            </div>
          </div>
          <div style={{ padding: 20, borderBottom: "1px solid #e0dbd3" }}>
            <h2 style={{ margin: "0 0 10px", fontFamily: "Georgia,serif", fontSize: 28, color: T.itineraryTeal }}>Welcome</h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#51615d", lineHeight: 1.7 }}>We have shaped this journey around comfort, route flow, local experiences and enough breathing room between travel days.</p>
            <div style={{ background: "#fff", border: "1px solid #e0dbd3", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6f7773", textTransform: "uppercase", letterSpacing: "0.06em" }}>{itinerary.costMode}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 36, fontWeight: 800, color: T.itineraryTeal, lineHeight: 1.1 }}>Rs {Number(itinerary.costAmount || 0).toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 12, color: "#6f7773", marginTop: 4 }}>Approx. Rs {perPerson.toLocaleString("en-IN")} per traveller</div>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "#6f7773", lineHeight: 1.55 }}>{itinerary.note}</p>
          </div>
          <div style={{ padding: 20 }}>
            <h2 style={{ margin: "0 0 14px", fontFamily: "Georgia,serif", fontSize: 25, color: T.itineraryTeal }}>A quick overview of your <em style={{ color: T.amber }}>{destination}</em> trip</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {previewDays.map((day: any) => (
                <div key={day.day} style={{ borderRadius: 8, padding: 14, color: "#fff", background: `linear-gradient(145deg,rgba(255,255,255,0.24),rgba(255,255,255,0) 30%), ${day.drop ? "#7a8a74" : T.sage}`, boxShadow: "0 14px 28px rgba(26,46,42,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", fontSize: 12, fontWeight: 800 }}>
                    <span style={{ borderRight: "1px solid rgba(255,255,255,0.42)", paddingRight: 10, textTransform: "uppercase" }}>{day.date}</span>
                    <span>{day.weekday} - Day {day.day}</span>
                  </div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 23, fontWeight: 800, margin: "10px 0" }}>{day.route}</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {day.sights.map((sight: string) => <span key={sight} style={{ borderRadius: 999, padding: "5px 8px", fontSize: 11, fontWeight: 800, background: "rgba(255,255,255,0.22)" }}>{sight}</span>)}
                    <span style={{ borderRadius: 999, padding: "5px 8px", fontSize: 11, fontWeight: 800, background: "rgba(26,46,42,0.30)" }}>{day.drop ? "Drop" : "Stay"} - {day.stay}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
