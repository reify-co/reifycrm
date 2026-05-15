'use client';

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "reify_itinerary_v1";

const T = {
  navy: "#0d2d3a",
  teal: "#1a7a8a",
  bg: "#f0f7f9",
  border: "#cce4ea",
  muted: "#5a7d88",
  faint: "#e8f4f7",
};

function parseLeadDate(value: any) {
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

function toDateInput(value: any) {
  const date = parseLeadDate(value);
  if (!date) return "";
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: any) {
  if (!dateValue || !days) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + Math.max(Number(days || 0) - 1, 0));
  return date.toISOString().slice(0, 10);
}

function crmLeadToBuilderLead(lead: any) {
  const startDate = toDateInput(lead.tripDate);
  const quoteValue = Number(lead.quoteSentValue || lead.budget || 0);
  const paxCount = Number(lead.paxCount || 0);
  return {
    id: `crm-${lead.id}`,
    crmLeadId: lead.id,
    source: lead.source || "CRM",
    referredBy: "",
    status: lead.status === "Booked" ? "Confirmed" : lead.status === "Lost" ? "Cancelled" : "New",
    temperature: lead.tags?.some((tag: string) => String(tag).toLowerCase().includes("hot")) ? "hot" : "warm",
    gender: "",
    displayName: lead.name || "",
    mobile: lead.phone || "",
    email: lead.email || "",
    state: lead.state || lead.customerState || "",
    destination: lead.destination || lead.landingPage || "",
    days: Number(lead.days || 0),
    startDate,
    endDate: addDays(startDate, lead.days),
    adults: paxCount || 2,
    children: 0,
    childAges: "",
    packageCost: quoteValue,
    remarks: lead.message || lead.notes || "",
    createdAt: lead.createdAt || new Date().toISOString(),
    updatedAt: lead.updatedAt || new Date().toISOString(),
    itinerary: {
      stage: "Review",
      costMode: "Total Package",
      costAmount: quoteValue,
      paxAdults: paxCount || 2,
      paxChildren: 0,
      paxChildAges: "",
      destinationOverride: lead.destination || lead.landingPage || "",
    },
  };
}

function seedBuilderLead(lead: any) {
  if (typeof window === "undefined" || !lead?.id) return;
  const incoming = crmLeadToBuilderLead(lead);
  let state: any = {};
  try {
    state = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    state = {};
  }

  const leads = Array.isArray(state.leads) ? state.leads : [];
  const existing = leads.find((item: any) => item.id === incoming.id);
  const preservedItinerary = existing?.itinerary || incoming.itinerary;
  const merged = {
    ...incoming,
    ...(existing || {}),
    source: incoming.source,
    displayName: incoming.displayName,
    mobile: incoming.mobile,
    email: incoming.email,
    state: incoming.state || existing?.state || "",
    destination: incoming.destination,
    days: incoming.days,
    startDate: incoming.startDate,
    endDate: incoming.endDate,
    adults: incoming.adults,
    packageCost: incoming.packageCost,
    itinerary: {
      ...incoming.itinerary,
      ...preservedItinerary,
      destinationOverride: preservedItinerary?.destinationOverride || incoming.itinerary.destinationOverride,
      costAmount: Number(preservedItinerary?.costAmount ?? incoming.itinerary.costAmount),
    },
  };

  const nextLeads = [merged, ...leads.filter((item: any) => item.id !== incoming.id)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    leads: nextLeads,
    selectedLeadId: incoming.id,
  }));
}

export default function ItineraryBuilder({ lead }: any) {
  const [ready, setReady] = useState(false);
  const builderLeadId = useMemo(() => lead?.id ? `crm-${lead.id}` : "", [lead?.id]);
  const src = builderLeadId
    ? `/itinerary-builder/reify-itinerary-builder.html?embedded=1&leadId=${encodeURIComponent(builderLeadId)}`
    : "";

  useEffect(() => {
    seedBuilderLead(lead);
    setReady(true);
  }, [lead]);

  if (!lead?.id) {
    return (
      <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
        Select a lead before opening the itinerary builder.
      </section>
    );
  }

  return (
    <section style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, color: T.navy, fontFamily: "Georgia,serif" }}>Itinerary Builder</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.muted }}>
            Opened for {lead.name}. Itinerary changes are saved in this browser's builder workspace.
          </p>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          style={{ borderRadius: 8, padding: "8px 12px", background: T.faint, border: `1px solid ${T.border}`, color: T.navy, textDecoration: "none", fontSize: 12, fontWeight: 800 }}
        >
          Open full screen
        </a>
      </div>
      {ready ? (
        <iframe
          key={builderLeadId}
          title={`Itinerary Builder - ${lead.name || "Lead"}`}
          src={src}
          style={{ width: "100%", height: "calc(100vh - 190px)", minHeight: 760, border: "none", borderRadius: 10, background: T.bg }}
        />
      ) : (
        <div style={{ minHeight: 360, display: "grid", placeItems: "center", color: T.muted }}>Preparing itinerary workspace...</div>
      )}
    </section>
  );
}
