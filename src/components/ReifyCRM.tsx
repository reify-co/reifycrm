'use client';
import { useEffect, useState, useMemo, type ClipboardEvent } from "react";
import { createWorker } from "tesseract.js";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  navy:"#0d2d3a", navyMid:"#12404f", navyLight:"#1a3a4a",
  teal:"#1a7a8a", tealPale:"#e0f4f7", accent:"#c8e8ed",
  bg:"#f0f7f9", border:"#cce4ea", muted:"#5a7d88", faint:"#e8f4f7",
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TEAM: Record<string,any> = {
  owner:   {id:"owner",  name:"You (Owner)",initials:"YO",role:"owner", color:T.teal},
  nikitha: {id:"nikitha",name:"Nikitha",    initials:"NK",role:"agent", color:"#b45309"},
  aman:    {id:"aman",   name:"Aman",       initials:"AM",role:"agent", color:"#1d4ed8"},
};
const DEFAULT_LEAD_AGENT_IDS = ["nikitha","aman"];
const EMAIL_TO_USER: Record<string,string> = {
  "owner@reifytravels.com":"owner",
  "nikitha@reifytravels.com":"nikitha",
  "aman@reifytravels.com":"aman",
};

const LANDING_PAGES = ["Northeast India","Meghalaya","Arunachal Pradesh","Goa","Kerala","Rajasthan","Kashmir","Leh Ladakh","Himachal Pradesh","Andaman & Nicobar","Others"];
const DESTINATIONS  = ["Northeast India","Meghalaya","Arunachal Pradesh","Goa","Kerala","Rajasthan","Himachal Pradesh","Uttarakhand","Kashmir","Andaman & Nicobar","Leh Ladakh","Karnataka","Tamil Nadu","Maharashtra","Madhya Pradesh","Gujarat"];
const PACKAGE_TYPES = ["Honeymoon","Family Tour","Group Tour","Solo Trip","Adventure","Pilgrimage","Corporate/MICE","Weekend Getaway"];
const LEAD_STATUSES = ["New","Contacted","Interested","Proposal Sent","Negotiating","Booked","Lost"];
const LEAD_SOURCES  = ["Ads-Email","Ads-WhatsApp","Ads-Call","Ref","Repeat","Email","Others"];
const FOLLOWUP_TYPES    = ["Call","WhatsApp","Email","Meeting","Video Call"];
const FOLLOWUP_OUTCOMES = ["Reached","No Answer","Callback Requested","Sent Info","Meeting Scheduled","Not Interested","Converted"];
const HEAT_TAGS  = ["🔥 Hot","🌤 Warm","❄️ Cold"];
const BUDGET_TAGS= ["💚 Budget","💛 Mid","🔴 Premium"];
const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_META: Record<string,any> = {
  "New":          {bg:"#dbeafe",text:"#1e40af",dot:"#3b82f6",col:"#eff6ff"},
  "Contacted":    {bg:"#e0f4f7",text:"#0d2d3a",dot:"#1a7a8a",col:"#f0fafb"},
  "Interested":   {bg:"#fef9c3",text:"#92400e",dot:"#eab308",col:"#fefce8"},
  "Proposal Sent":{bg:"#f3e8ff",text:"#6b21a8",dot:"#a855f7",col:"#faf5ff"},
  "Negotiating":  {bg:"#fff7ed",text:"#c2410c",dot:"#f97316",col:"#fff7ed"},
  "Booked":       {bg:"#dcfce7",text:"#15803d",dot:"#22c55e",col:"#f0fdf4"},
  "Lost":         {bg:"#fee2e2",text:"#b91c1c",dot:"#ef4444",col:"#fff5f5"},
};
const SOURCE_COLORS: Record<string,any> = {
  "Ads-Email":   {bg:"#dbeafe",text:"#1e40af"},
  "Ads-WhatsApp":{bg:"#dcfce7",text:"#15803d"},
  "Ads-Call":    {bg:"#fff7ed",text:"#c2410c"},
  "Ref":         {bg:"#f0fdf4",text:"#166534"},
  "Repeat":      {bg:"#fef9c3",text:"#92400e"},
  "Email":       {bg:"#f3e8ff",text:"#6b21a8"},
  "Others":      {bg:"#f1f5f9",text:"#475569"},
};

// WhatsApp proposal follow-up templates
const WA_TEMPLATES = [
  {
    id:"t1", label:"Initial Response",
    text:(name:string,dest:string)=>`Hi ${name}! 👋 Thank you for your enquiry about *${dest}* with Reify Travels. We'd love to help plan your trip! Could you share a bit more about what you're looking for? We'll put together a personalised itinerary for you. 🌿`,
  },
  {
    id:"t2", label:"Proposal Sent Follow-up",
    text:(name:string,dest:string)=>`Hi ${name}! Hope you're doing well. 😊 Just checking in on the *${dest}* proposal we shared. Did you get a chance to go through it? Happy to answer any questions or customise the itinerary further. Let us know! — Reify Travels`,
  },
  {
    id:"t3", label:"Second Follow-up",
    text:(name:string,dest:string)=>`Hi ${name}! 🙏 We wanted to follow up once more on your *${dest}* trip enquiry. Dates are filling up fast for the season — would you like us to check availability and hold a slot for you? — Reify Travels`,
  },
  {
    id:"t4", label:"Gentle Nudge",
    text:(name:string,dest:string)=>`Hi ${name}! Just a gentle reminder about your *${dest}* travel plan with us. We're here whenever you're ready to move forward. Feel free to call or WhatsApp us anytime. 😊 — Reify Travels`,
  },
  {
    id:"t5", label:"Booking Confirmation",
    text:(name:string,dest:string)=>`Hi ${name}! 🎉 Wonderful news — your *${dest}* trip is confirmed with Reify Travels! We'll share the full itinerary and payment details shortly. Looking forward to making your trip unforgettable! ✈️`,
  },
];

const AVAILABILITY_OPTIONS = ["Available","Half day","On leave","Paused"];

function isUnavailable(agentId:string, date:Date, availability:Record<string,string|boolean>={}) {
  const status=availability[agentId];
  if(status===true || status==="On leave" || status==="Paused") return true;
  if(status==="Half day" && date.getHours()>=14) return true;
  return false;
}

function getRotationAgent(dateStr:string, availability:Record<string,string|boolean>={}, leadAgentIds:string[]=DEFAULT_LEAD_AGENT_IDS) {
  const date = new Date(dateStr);
  const available=leadAgentIds.filter(id=>!isUnavailable(id,date,availability));
  const pool=available.length?available:leadAgentIds;
  if(pool.length===0) return "owner";
  const day = Math.floor(date.getTime()/86400000);
  return pool[day % pool.length];
}

function dateKey(date:Date) {
  return date.toISOString().split("T")[0];
}

function getDailyLeadOwner(date:Date, dailyRoster:Record<string,any>={}, availability:Record<string,string|boolean>={}, leadAgentIds:string[]=DEFAULT_LEAD_AGENT_IDS) {
  const key=dateKey(date);
  return dailyRoster[key]?.assignedTo || getRotationAgent(date.toISOString(),availability,leadAgentIds);
}

function parseOcrDate(raw:string) {
  const clean=raw.trim().replace(/[.,]/g,"");
  const match=clean.match(/(\d{1,2})[-/\s]([A-Za-z]{3,}|\d{1,2})[-/\s](\d{2,4})/);
  if(!match) return clean;
  const months:any={jan:"Jan",feb:"Feb",mar:"Mar",apr:"Apr",may:"May",jun:"Jun",jul:"Jul",aug:"Aug",sep:"Sep",sept:"Sep",oct:"Oct",nov:"Nov",dec:"Dec"};
  const numericMonths:any={"1":"Jan","01":"Jan","2":"Feb","02":"Feb","3":"Mar","03":"Mar","4":"Apr","04":"Apr","5":"May","05":"May","6":"Jun","06":"Jun","7":"Jul","07":"Jul","8":"Aug","08":"Aug","9":"Sep","09":"Sep","10":"Oct","11":"Nov","12":"Dec"};
  const dd=match[1].padStart(2,"0");
  const mm=/^\d+$/.test(match[2])?numericMonths[match[2]]:months[match[2].slice(0,3).toLowerCase()]||"";
  const yyyy=match[3].length===2?`20${match[3]}`:match[3];
  return mm?`${dd}-${mm}-${yyyy}`:clean;
}

function parseTravelEnquiryOcr(text:string) {
  const cleaned=text.replace(/\r/g,"\n").replace(/[|]/g," ").replace(/\s+/g," ").trim();
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const getField=(label:string)=>{
    const same=cleaned.match(new RegExp(`${label}\\s+([^]+?)(?=\\s+(Source|Name|Phone|Email|Pax|Trip\\s*Date|Days|Message|GCLID|Sent from)\\s+|$)`,"i"));
    if(same?.[1]) return same[1].trim();
    const idx=lines.findIndex(l=>new RegExp(`^${label}$|^${label}\\b`,"i").test(l));
    if(idx>=0) {
      const rest=lines[idx].replace(new RegExp(`^${label}\\b[:\\s-]*`,"i"),"").trim();
      return rest || lines[idx+1] || "";
    }
    return "";
  };
  const getTripDate=()=>{
    const direct=getField("Trip\\s*Date");
    if(direct) return direct;
    const split=cleaned.match(/Trip\s+Date\s+(\d{1,2}[-/\s](?:[A-Za-z]{3,}|\d{1,2})[-/\s]\d{2,4})/i);
    if(split?.[1]) return split[1];
    const idx=lines.findIndex(l=>/^Trip$/i.test(l));
    if(idx>=0 && /^Date$/i.test(lines[idx+1]||"")) return lines[idx+2] || "";
    return cleaned.match(/\b\d{1,2}[-/](?:[A-Za-z]{3,}|\d{1,2})[-/]\d{2,4}\b/)?.[0] || "";
  };
  const source=getField("Source");
  const phone=(getField("Phone").match(/\+?\d[\d\s-]{7,}\d/)?.[0] || cleaned.match(/\b\d{9,13}\b/)?.[0] || "").replace(/\s|-/g,"");
  const email=getField("Email").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const gclidStart=lines.findIndex(l=>/^GCLID\b/i.test(l));
  const gclid=gclidStart>=0
    ? lines.slice(gclidStart).join(" ").replace(/^GCLID\b[:\s-]*/i,"").replace(/Sent from.*$/i,"").trim()
    : getField("GCLID");
  return {
    name:getField("Name"),
    phone,
    email,
    source:"Ads-Email",
    landingPage:(source.split("-")[0]||source).trim(),
    paxCount:Number(getField("Pax").match(/\d+/)?.[0]||1),
    tripDate:parseOcrDate(getTripDate()),
    days:Number(getField("Days").match(/\d+/)?.[0]||0),
    message:getField("Message").replace(/^[-–—]+$/,""),
    gclid,
    notes:"Imported from pasted screenshot.",
  };
}

function normalizePhone(value="") {
  return String(value).replace(/\D/g,"").replace(/^91(?=\d{10}$)/,"");
}

function normalizeEmail(value="") {
  return String(value).trim().toLowerCase();
}

function normalizeName(value="") {
  return String(value).trim().toLowerCase().replace(/\s+/g," ");
}

function markPossibleDuplicates(incoming:any[], existing:any[]) {
  return incoming.map(lead=>{
    const phone=normalizePhone(lead.phone);
    const email=normalizeEmail(lead.email);
    const name=normalizeName(lead.name);
    const match=existing.find(existingLead=>{
      const existingPhone=normalizePhone(existingLead.phone);
      const existingEmail=normalizeEmail(existingLead.email);
      const existingName=normalizeName(existingLead.name);
      return (
        (lead.gmailMessageId && existingLead.gmailMessageId===lead.gmailMessageId) ||
        (phone && existingPhone && phone===existingPhone) ||
        (email && existingEmail && email===existingEmail) ||
        (name && existingName && name===existingName)
      );
    });
    if(!match) return lead;
    const duplicateReason=
      email && normalizeEmail(match.email)===email ? "same email" :
      phone && normalizePhone(match.phone)===phone ? "same phone" :
      lead.gmailMessageId && match.gmailMessageId===lead.gmailMessageId ? "same Gmail message" :
      "same name";
    return {...lead,possibleDuplicate:true,duplicateReason};
  });
}

function parseLeadDate(value:string) {
  if(!value) return null;
  const iso=new Date(value);
  if(!Number.isNaN(iso.getTime())) return iso;
  const match=String(value).match(/(\d{1,2})[-/\s]([A-Za-z]{3,}|\d{1,2})[-/\s](\d{2,4})/);
  if(!match) return null;
  const monthMap:any={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,sept:8,oct:9,nov:10,dec:11};
  const month=/^\d+$/.test(match[2])?Number(match[2])-1:monthMap[match[2].slice(0,3).toLowerCase()];
  const year=Number(match[3].length===2?`20${match[3]}`:match[3]);
  if(month===undefined || Number.isNaN(year)) return null;
  return new Date(year,month,Number(match[1]));
}

function formatLeadDate(value:string) {
  const date=parseLeadDate(value);
  return date?date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"";
}

function getLeadEndDate(start:string, days:any) {
  const date=parseLeadDate(start);
  const count=Number(days||0);
  if(!date || !count) return "";
  const end=new Date(date);
  end.setDate(end.getDate()+Math.max(count-1,0));
  return end.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}

function dateInputValue(value:string) {
  const date=parseLeadDate(value);
  if(!date) return "";
  const yyyy=date.getFullYear();
  const mm=String(date.getMonth()+1).padStart(2,"0");
  const dd=String(date.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function getLeadState(lead:any) {
  return lead.state || lead.destinationState || lead.region || "";
}

function primaryTag(tags:any[] = []) {
  return tags?.[0] || "";
}

function TablePill({children,tone="default"}:any) {
  const tones:any={
    default:{bg:"#eef7f8",color:T.muted,border:"#e4f0f2"},
    source:{bg:"#eef2fb",color:"#50637d",border:"#e6edf8"},
    days:{bg:"#edf7f5",color:"#4f847c",border:"#e4f0ed"},
    status:{bg:"#edf8f0",color:"#4d8b55",border:"#dff0e3"},
  };
  const t=tones[tone]||tones.default;
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:26,padding:"4px 10px",borderRadius:6,background:t.bg,color:t.color,border:`1px solid ${t.border}`,fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>;
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const INITIAL_LEADS: any[] = [];

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function ReifyLogo() {
  return (
    <div style={{width:40,height:40,borderRadius:"50%",background:T.navyMid,border:"2px solid rgba(200,232,237,0.45)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <span style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:T.accent,lineHeight:1}}>R</span>
    </div>
  );
}
function Avatar({initials,color,size=32}:any) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,flexShrink:0,border:`1.5px solid ${color}44`,fontFamily:"monospace"}}>{initials}</div>;
}
function StatusBadge({status}:any) {
  const c=STATUS_META[status]||STATUS_META["New"];
  return <span style={{background:c.bg,color:c.text,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:c.dot,display:"inline-block"}}/>{status}</span>;
}
function SourceBadge({source}:any) {
  const c=SOURCE_COLORS[source]||{bg:"#f1f5f9",text:"#475569"};
  return <span style={{background:c.bg,color:c.text,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20}}>{source}</span>;
}
function Btn({children,onClick,variant="primary",small=false,style={},disabled=false}:any) {
  const vs:any={primary:{background:T.navy,color:"#fff",border:"none"},secondary:{background:T.faint,color:T.navy,border:`1.5px solid ${T.border}`},danger:{background:"#fee2e2",color:"#b91c1c",border:"1.5px solid #fca5a5"},ghost:{background:"none",color:T.muted,border:`1px solid ${T.border}`},green:{background:"#15803d",color:"#fff",border:"none"}};
  return <button onClick={onClick} disabled={disabled} style={{...vs[variant],borderRadius:8,padding:small?"5px 12px":"8px 16px",fontSize:small?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?0.5:1,fontFamily:"inherit",...style}}>{children}</button>;
}
function Modal({title,onClose,children,width=580}:any) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(13,45,58,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"92vh",overflow:"auto",boxShadow:"0 24px 80px rgba(13,45,58,0.22)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 0"}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:T.navy,fontFamily:"Georgia,serif"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.muted}}>×</button>
        </div>
        <div style={{padding:"16px 24px 24px"}}>{children}</div>
      </div>
    </div>
  );
}
function Inp({label,value,onChange,type="text",options,required,placeholder,fullWidth,hint}:any) {
  const base:any={width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,fontSize:13,color:T.navy,background:T.faint,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  return (
    <div style={{marginBottom:14,gridColumn:fullWidth?"1/-1":undefined}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:T.muted,marginBottom:5}}>{label}{required&&<span style={{color:"#ef4444"}}>*</span>}</label>}
      {options?<select value={value} onChange={e=>onChange(e.target.value)} style={base}><option value="">Select...</option>{options.map((o:string)=><option key={o} value={o}>{o}</option>)}</select>
      :type==="textarea"?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...base,resize:"vertical"}}/>
      :<input type={type} value={value} onChange={(e:any)=>onChange(e.target.value)} placeholder={placeholder} style={base}/>}
      {hint&&<div style={{fontSize:11,color:T.muted,marginTop:4}}>{hint}</div>}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({onAdd,onImport}:any) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",textAlign:"center"}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:T.tealPale,border:`2px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:20}}>✈️</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:T.navy,marginBottom:8}}>No leads yet</div>
      <div style={{fontSize:14,color:T.muted,maxWidth:340,lineHeight:1.7,marginBottom:28}}>Add your first lead manually for a WhatsApp or call enquiry, or import from Gmail for email leads.</div>
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={onAdd}>+ Add Lead Manually</Btn>
        <Btn variant="secondary" onClick={onImport}>📧 Import from Gmail</Btn>
      </div>
    </div>
  );
}

// ─── LEAD TAGS ────────────────────────────────────────────────────────────────
function TagPicker({tags,onChange}:any) {
  const heat   = HEAT_TAGS.find(t=>tags?.includes(t))||"";
  const budget = BUDGET_TAGS.find(t=>tags?.includes(t))||"";
  const month  = MONTHS.find(m=>tags?.some((t:string)=>t.includes(m)))||"";

  function setTag(group:string[],val:string) {
    const rest=(tags||[]).filter((t:string)=>!group.includes(t));
    onChange(val?[...rest,val]:rest);
  }

  return (
    <div style={{marginBottom:14,gridColumn:"1/-1"}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:T.muted,marginBottom:8}}>Lead Tags</label>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {/* Heat */}
        <div style={{display:"flex",gap:4}}>
          {HEAT_TAGS.map(t=>(
            <button key={t} onClick={()=>setTag(HEAT_TAGS,heat===t?"":t)} style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${heat===t?T.teal:T.border}`,background:heat===t?T.tealPale:"#fff",fontSize:12,cursor:"pointer",color:heat===t?T.navy:T.muted,fontWeight:heat===t?700:400}}>{t}</button>
          ))}
        </div>
        <div style={{width:1,background:T.border}}/>
        {/* Budget */}
        <div style={{display:"flex",gap:4}}>
          {BUDGET_TAGS.map(t=>(
            <button key={t} onClick={()=>setTag(BUDGET_TAGS,budget===t?"":t)} style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${budget===t?T.teal:T.border}`,background:budget===t?T.tealPale:"#fff",fontSize:12,cursor:"pointer",color:budget===t?T.navy:T.muted,fontWeight:budget===t?700:400}}>{t}</button>
          ))}
        </div>
        <div style={{width:1,background:T.border}}/>
        {/* Travel Month */}
        <select value={month} onChange={e=>setTag(MONTHS.map(m=>`📅 ${m}`),e.target.value?`📅 ${e.target.value}`:"")} style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${month?T.teal:T.border}`,background:month?T.tealPale:"#fff",fontSize:12,color:month?T.navy:T.muted,outline:"none",cursor:"pointer"}}>
          <option value="">📅 Travel Month</option>
          {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── WHATSAPP TEMPLATES ───────────────────────────────────────────────────────
function WATemplates({lead,onClose}:any) {
  const [copied,setCopied]=useState("");
  const phone=lead.phone?.replace(/\D/g,"");

  function copy(text:string,id:string) {
    navigator.clipboard.writeText(text).then(()=>{setCopied(id);setTimeout(()=>setCopied(""),2000);});
  }

  return (
    <div>
      <p style={{margin:"0 0 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>
        Templates for <strong style={{color:T.navy}}>{lead.name}</strong> · {lead.destination||lead.landingPage}
      </p>
      {WA_TEMPLATES.map(t=>{
        const msg=t.text(lead.name,lead.destination||lead.landingPage||"your destination");
        return (
          <div key={t.id} style={{border:`1.5px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:10,background:T.faint}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{t.label}</span>
              <div style={{display:"flex",gap:6}}>
                <Btn small variant="ghost" onClick={()=>copy(msg,t.id)}>{copied===t.id?"✓ Copied":"Copy"}</Btn>
                <a href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener"
                  style={{padding:"5px 12px",borderRadius:8,background:"#dcfce7",color:"#15803d",fontSize:12,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                  💬 Open WA
                </a>
              </div>
            </div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{msg}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LEAD FORM ────────────────────────────────────────────────────────────────
function LeadForm({lead,onSave,onCancel,currentUser,leaveData={},dailyRoster={},team=TEAM,leadAgentIds=DEFAULT_LEAD_AGENT_IDS}:any) {
  const isNew=!lead?.id;
  const today=new Date().toISOString();
  const suggestedAgent=getDailyLeadOwner(new Date(today),dailyRoster,leaveData,leadAgentIds);
  const [f,setF]=useState({
    name:lead?.name||"", phone:lead?.phone||"", email:lead?.email||"",
    source:lead?.source||"Ads-Email", status:lead?.status||"New",
    assignedTo:lead?.assignedTo||suggestedAgent,
    landingPage:lead?.landingPage||"", destination:lead?.destination||"",
    state:lead?.state||lead?.destinationState||lead?.region||"",
    packageType:lead?.packageType||"", tripDate:dateInputValue(lead?.tripDate||""),
    days:lead?.days||"", paxCount:lead?.paxCount||2, budget:lead?.budget||"",
    message:lead?.message||"", specialRequests:lead?.specialRequests||"",
    notes:lead?.notes||"", gclid:lead?.gclid||"",
    tags:lead?.tags||[],
  });
  const s=(k:string)=>(v:any)=>setF(p=>({...p,[k]:v}));
  const submit=()=>{
    if(!f.name||!f.phone) return alert("Name and phone are required.");
    if(!f.assignedTo) return alert("Please choose a team member for this lead.");
    onSave({...lead,...f,paxCount:Number(f.paxCount),budget:Number(f.budget),days:Number(f.days)});
  };

  return (
    <div>
      {/* Section: Contact */}
      <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>Contact Info</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <Inp label="Full Name" value={f.name} onChange={s("name")} required/>
        <Inp label="Phone" value={f.phone} onChange={s("phone")} required/>
        <Inp label="Email" value={f.email} onChange={s("email")} type="email"/>
        <Inp label="Source" value={f.source} onChange={s("source")} options={LEAD_SOURCES}/>
      </div>

      {/* Section: Enquiry */}
      <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${T.border}`,marginTop:4}}>Enquiry Details</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <Inp label="Landing Page / Campaign" value={f.landingPage} onChange={s("landingPage")} options={LANDING_PAGES}/>
        <Inp label="Destination" value={f.destination} onChange={s("destination")} options={DESTINATIONS}/>
        <Inp label="State" value={f.state} onChange={s("state")} placeholder="e.g. Meghalaya"/>
        <Inp label="Trip Date" value={f.tripDate} onChange={s("tripDate")} type="date"/>
        <Inp label="No. of Days" value={f.days} onChange={s("days")} type="number" placeholder="e.g. 5"/>
        <Inp label="No. of Pax" value={f.paxCount} onChange={s("paxCount")} type="number"/>
        <Inp label="Package Type" value={f.packageType} onChange={s("packageType")} options={PACKAGE_TYPES}/>
        <Inp label="Budget (₹)" value={f.budget} onChange={s("budget")} type="number" placeholder="e.g. 45000" fullWidth/>
      </div>
      <Inp label="Message from Enquiry" value={f.message} onChange={s("message")} type="textarea" placeholder="What the client wrote in their enquiry form..."/>

      {/* Section: CRM */}
      <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${T.border}`,marginTop:4}}>CRM</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <Inp label="Status" value={f.status} onChange={s("status")} options={LEAD_STATUSES}/>
        {currentUser==="owner"&&<Inp label="Assign To" value={f.assignedTo} onChange={s("assignedTo")} options={leadAgentIds}/>}
      </div>
      <TagPicker tags={f.tags} onChange={s("tags")}/>
      <Inp label="Special Requests" value={f.specialRequests} onChange={s("specialRequests")} type="textarea"/>
      <Inp label="Internal Notes" value={f.notes} onChange={s("notes")} type="textarea"/>
      <Inp label="GCLID (auto from email)" value={f.gclid} onChange={s("gclid")} hint="Leave blank if not from Google Ads email"/>

      {isNew&&(
        <div style={{padding:"10px 12px",background:T.tealPale,borderRadius:8,fontSize:12,color:T.navy,marginBottom:14}}>
          Today's roster owner: <strong>{team[suggestedAgent]?.name || suggestedAgent}</strong>. You can still change the assignee for this specific lead before saving.
        </div>
      )}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={submit}>{isNew?"Create Lead":"Save Changes"}</Btn>
      </div>
    </div>
  );
}

// ─── FOLLOW-UP TAB ────────────────────────────────────────────────────────────
function FollowUpTab({lead,onUpdate}:any) {
  const [open,setOpen]=useState(false);
  const [f,setF]=useState({type:"Call",notes:"",outcome:"Reached",duration:"",reminderPreset:"",reminderDate:"",reminderTime:"11:00",reminderNote:""});
  const s=(k:string)=>(v:any)=>setF(p=>({...p,[k]:v}));
  const icons:any={Call:"📞",WhatsApp:"💬",Email:"📧",Meeting:"🤝","Video Call":"🎥"};
  const pending=(lead.reminders||[]).filter((r:any)=>!r.isCompleted);
  function presetDate(preset:string) {
    if(!preset) return "";
    const d=new Date();
    if(preset==="Tomorrow") d.setDate(d.getDate()+1);
    if(preset==="After 2 days") d.setDate(d.getDate()+2);
    if(preset==="After 7 days") d.setDate(d.getDate()+7);
    return d.toISOString().split("T")[0];
  }
  const add=()=>{
    const reminderDate=f.reminderPreset==="Custom"?f.reminderDate:presetDate(f.reminderPreset);
    const reminderNote=f.reminderNote || f.notes || "Follow up with customer";
    const log={id:"f"+Date.now(),date:new Date().toISOString(),type:f.type,notes:f.notes,outcome:f.outcome,duration:f.duration,agentId:lead.assignedTo,reminderDate,reminderTime:f.reminderTime,reminderNote:reminderDate?reminderNote:""};
    const reminder=reminderDate?{id:"r"+Date.now(),dueDate:reminderDate,dueTime:f.reminderTime,note:reminderNote,isCompleted:false,sourceFollowUpId:log.id}:null;
    onUpdate({...lead,followUpLog:[log,...lead.followUpLog],reminders:reminder?[reminder,...(lead.reminders||[])]:lead.reminders,lastContact:new Date().toISOString()});
    setOpen(false);setF({type:"Call",notes:"",outcome:"Reached",duration:"",reminderPreset:"",reminderDate:"",reminderTime:"11:00",reminderNote:""});
  };
  const toggleReminder=(id:string)=>onUpdate({...lead,reminders:(lead.reminders||[]).map((r:any)=>r.id===id?{...r,isCompleted:!r.isCompleted}:r)});
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontWeight:700,color:T.navy,fontSize:14}}>Follow-up & Reminders ({lead.followUpLog.length})</span>
        <Btn small onClick={()=>setOpen(!open)}>+ Log Interaction</Btn>
      </div>
      {open&&(
        <div style={{background:T.faint,border:`1.5px solid ${T.border}`,borderRadius:10,padding:14,marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Inp label="Type" value={f.type} onChange={s("type")} options={FOLLOWUP_TYPES}/>
            <Inp label="Outcome" value={f.outcome} onChange={s("outcome")} options={FOLLOWUP_OUTCOMES}/>
            <Inp label="Duration" value={f.duration} onChange={s("duration")} placeholder="e.g. 15 min"/>
          </div>
          <Inp label="Notes" value={f.notes} onChange={s("notes")} type="textarea"/>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:2}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Next reminder from this follow-up</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
              <Inp label="Remind me" value={f.reminderPreset} onChange={s("reminderPreset")} options={["Today","Tomorrow","After 2 days","After 7 days","Custom"]}/>
              <Inp label="Time" value={f.reminderTime} onChange={s("reminderTime")} type="time"/>
              {f.reminderPreset==="Custom"&&<Inp label="Custom Date" value={f.reminderDate} onChange={s("reminderDate")} type="date"/>}
            </div>
            <Inp label="Reminder Note" value={f.reminderNote} onChange={s("reminderNote")} placeholder="e.g. Call for quote decision"/>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" small onClick={()=>setOpen(false)}>Cancel</Btn>
            <Btn small onClick={add}>Save</Btn>
          </div>
        </div>
      )}
      {pending.length>0&&(
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#78350f",marginBottom:8}}>Pending Reminders</div>
          {pending.map((r:any)=>(
            <label key={r.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderTop:`1px solid #fde68a`,fontSize:13,color:T.navy}}>
              <input type="checkbox" checked={r.isCompleted} onChange={()=>toggleReminder(r.id)} style={{marginTop:2}}/>
              <span><strong>{r.note}</strong><br/><span style={{fontSize:11,color:"#92400e"}}>{r.dueDate} at {r.dueTime}</span></span>
            </label>
          ))}
        </div>
      )}
      {lead.followUpLog.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8",fontSize:13}}>No follow-up logs yet.</div>}
      {lead.followUpLog.map((log:any)=>(
        <div key={log.id} style={{borderLeft:`3px solid ${T.teal}55`,paddingLeft:14,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span>{icons[log.type]||"📝"}</span>
              <span style={{fontWeight:700,fontSize:13,color:T.navy}}>{log.type}</span>
              {log.duration&&<span style={{fontSize:11,color:"#94a3b8"}}>· {log.duration}</span>}
            </div>
            <span style={{fontSize:11,color:"#94a3b8"}}>{new Date(log.date).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
          </div>
          <div style={{fontSize:12,color:T.muted,marginTop:6,lineHeight:1.6}}>{log.notes}</div>
          {log.reminderDate&&<div style={{fontSize:11,color:"#92400e",marginTop:5}}>Reminder set: {log.reminderNote} on {log.reminderDate} at {log.reminderTime}</div>}
          <div style={{marginTop:6}}>
            <span style={{fontSize:11,fontWeight:600,background:T.faint,color:T.muted,padding:"2px 8px",borderRadius:20}}>{log.outcome}</span>
            <span style={{fontSize:11,color:"#94a3b8",marginLeft:8}}>by {TEAM[log.agentId]?.name||log.agentId}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── REMINDERS TAB ────────────────────────────────────────────────────────────
function FollowUpLedger({lead,onUpdate}:any) {
  const today=new Date().toISOString().split("T")[0];
  const [f,setF]=useState({type:"Call",date:today,notes:"",reminderPreset:"",reminderDate:"",reminderTime:"11:00"});
  const pending=(lead.reminders||[]).filter((r:any)=>!r.isCompleted);
  const types=["Call","WhatsApp","Email","Other"];
  const s=(k:string)=>(v:any)=>setF(p=>({...p,[k]:v}));
  const input:any={width:"100%",padding:"8px 10px",borderRadius:8,border:`1.5px solid ${T.border}`,fontSize:13,color:T.navy,background:T.faint,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const th:any={textAlign:"left",padding:"8px 10px",fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",background:T.faint,borderBottom:`1px solid ${T.border}`};
  const td:any={padding:"9px 10px",borderBottom:`1px solid ${T.faint}`,verticalAlign:"top",fontSize:13,color:T.navy};
  function presetDate(preset:string) {
    const d=new Date();
    if(!preset) return "";
    if(preset==="Today") return d.toISOString().split("T")[0];
    if(preset==="Tomorrow") d.setDate(d.getDate()+1);
    if(preset==="After 2 days") d.setDate(d.getDate()+2);
    if(preset==="After 7 days") d.setDate(d.getDate()+7);
    return d.toISOString().split("T")[0];
  }
  function add() {
    if(!f.notes.trim()) return alert("Please write follow-up notes.");
    const reminderDate=f.reminderPreset==="Custom"?f.reminderDate:presetDate(f.reminderPreset);
    const logDate=new Date(`${f.date || today}T${new Date().toTimeString().slice(0,8)}`).toISOString();
    const log={id:"f"+Date.now(),date:logDate,type:f.type,notes:f.notes,agentId:lead.assignedTo,reminderDate,reminderTime:f.reminderTime,reminderNote:reminderDate?f.notes:""};
    const reminder=reminderDate?{id:"r"+Date.now(),dueDate:reminderDate,dueTime:f.reminderTime,note:f.notes,isCompleted:false,sourceFollowUpId:log.id}:null;
    onUpdate({...lead,followUpLog:[log,...(lead.followUpLog||[])],reminders:reminder?[reminder,...(lead.reminders||[])]:lead.reminders,lastContact:new Date().toISOString()});
    setF({type:"Call",date:today,notes:"",reminderPreset:"",reminderDate:"",reminderTime:"11:00"});
  }
  const toggleReminder=(id:string)=>onUpdate({...lead,reminders:(lead.reminders||[]).map((r:any)=>r.id===id?{...r,isCompleted:!r.isCompleted}:r)});
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontWeight:700,color:T.navy,fontSize:14}}>Follow-up Log ({lead.followUpLog?.length||0})</span>
        {pending.length>0&&<span style={{fontSize:12,fontWeight:700,color:"#92400e",background:"#fef3c7",padding:"4px 9px",borderRadius:999}}>{pending.length} reminder{pending.length!==1?"s":""} pending</span>}
      </div>
      <div style={{overflowX:"auto",border:`1px solid ${T.border}`,borderRadius:10,background:"#fff"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
          <thead>
            <tr>
              <th style={{...th,width:120}}>Type</th>
              <th style={{...th,width:130}}>Date</th>
              <th style={th}>Notes</th>
              <th style={{...th,width:260}}>Reminder</th>
              <th style={{...th,width:80}}></th>
            </tr>
          </thead>
          <tbody>
            <tr style={{background:"#fbfdfe"}}>
              <td style={td}><select value={f.type} onChange={e=>s("type")(e.target.value)} style={input}>{types.map(o=><option key={o} value={o}>{o}</option>)}</select></td>
              <td style={td}><input type="date" value={f.date} onChange={e=>s("date")(e.target.value)} style={input}/></td>
              <td style={td}><textarea value={f.notes} onChange={e=>s("notes")(e.target.value)} rows={2} placeholder="Spoken, quote given, call after 2 days..." style={{...input,resize:"vertical"}}/></td>
              <td style={td}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 86px",gap:6}}>
                  <select value={f.reminderPreset} onChange={e=>s("reminderPreset")(e.target.value)} style={input}>
                    <option value="">No reminder</option>
                    {["Today","Tomorrow","After 2 days","After 7 days","Custom"].map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                  <input type="time" value={f.reminderTime} onChange={e=>s("reminderTime")(e.target.value)} style={input}/>
                </div>
                {f.reminderPreset==="Custom"&&<input type="date" value={f.reminderDate} onChange={e=>s("reminderDate")(e.target.value)} style={{...input,marginTop:6}}/>}
              </td>
              <td style={td}><Btn small onClick={add}>Save</Btn></td>
            </tr>
            {(lead.followUpLog||[]).length===0&&<tr><td colSpan={5} style={{padding:22,textAlign:"center",color:"#94a3b8",fontSize:13}}>No follow-up logs yet.</td></tr>}
            {(lead.followUpLog||[]).map((log:any)=>(
              <tr key={log.id}>
                <td style={td}><TablePill>{log.type||"Other"}</TablePill></td>
                <td style={td}>{new Date(log.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
                <td style={{...td,lineHeight:1.5}}>{log.notes}</td>
                <td style={td}>{log.reminderDate?<span style={{fontSize:12,color:"#92400e",fontWeight:700}}>{log.reminderDate} at {log.reminderTime}</span>:"-"}</td>
                <td style={td}>{log.agentId&&<span style={{fontSize:11,color:T.muted}}>{TEAM[log.agentId]?.initials||log.agentId}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pending.length>0&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
          {pending.map((r:any)=>(
            <label key={r.id} style={{display:"inline-flex",gap:7,alignItems:"center",padding:"6px 9px",borderRadius:999,background:"#fffbeb",border:"1px solid #fde68a",fontSize:12,color:"#78350f"}}>
              <input type="checkbox" checked={r.isCompleted} onChange={()=>toggleReminder(r.id)}/>
              {r.dueDate} {r.dueTime}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function RemindersTab({lead,onUpdate}:any) {
  const [open,setOpen]=useState(false);
  const [f,setF]=useState({dueDate:"",dueTime:"09:00",note:""});
  const s=(k:string)=>(v:any)=>setF(p=>({...p,[k]:v}));
  const add=()=>{onUpdate({...lead,reminders:[...lead.reminders,{id:"r"+Date.now(),...f,isCompleted:false}]});setOpen(false);setF({dueDate:"",dueTime:"09:00",note:""});};
  const toggle=(id:string)=>onUpdate({...lead,reminders:lead.reminders.map((r:any)=>r.id===id?{...r,isCompleted:!r.isCompleted}:r)});
  const pending=lead.reminders.filter((r:any)=>!r.isCompleted);
  const done=lead.reminders.filter((r:any)=>r.isCompleted);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontWeight:700,color:T.navy,fontSize:14}}>Reminders ({pending.length} pending)</span>
        <Btn small onClick={()=>setOpen(!open)}>+ Add Reminder</Btn>
      </div>
      {open&&(
        <div style={{background:T.faint,border:`1.5px solid ${T.border}`,borderRadius:10,padding:14,marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Inp label="Due Date" value={f.dueDate} onChange={s("dueDate")} type="date"/>
            <Inp label="Due Time" value={f.dueTime} onChange={s("dueTime")} type="time"/>
          </div>
          <Inp label="Note" value={f.note} onChange={s("note")} type="textarea"/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" small onClick={()=>setOpen(false)}>Cancel</Btn>
            <Btn small onClick={add}>Save</Btn>
          </div>
        </div>
      )}
      {lead.reminders.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8",fontSize:13}}>No reminders set.</div>}
      {[...pending,...done].map((r:any)=>(
        <div key={r.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",border:`1.5px solid ${r.isCompleted?T.border:"#fde68a"}`,borderRadius:10,marginBottom:8,background:r.isCompleted?"#fff":"#fefce8",opacity:r.isCompleted?0.55:1}}>
          <input type="checkbox" checked={r.isCompleted} onChange={()=>toggle(r.id)} style={{marginTop:2}}/>
          <div>
            <div style={{fontSize:13,color:T.navy,fontWeight:600,textDecoration:r.isCompleted?"line-through":"none"}}>{r.note}</div>
            <div style={{fontSize:11,color:"#92400e",marginTop:4}}>📅 {r.dueDate} at {r.dueTime}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LEAD DRAWER ──────────────────────────────────────────────────────────────
function LeadDrawer({lead,onClose,onUpdate,currentUser,onWA,team=TEAM,leadAgentIds=DEFAULT_LEAD_AGENT_IDS}:any) {
  const [tab,setTab]=useState("info");
  const agent=team[lead.assignedTo];
  const tabs=[{id:"info",label:"Lead Info"},{id:"followup",label:`Follow-ups (${lead.followUpLog.length})`},{id:"reminders",label:`Reminders (${lead.reminders.filter((r:any)=>!r.isCompleted).length})`}];
  const handoverTo=leadAgentIds.find((id:string)=>id!==lead.assignedTo) || lead.assignedTo;
  function requestHandover() {
    const note=window.prompt(`Handover this lead to ${team[handoverTo]?.name || handoverTo}. Add a short note for context:`,`Please take this lead while I am unavailable.`);
    if(note===null) return;
    onUpdate({...lead,assignedTo:handoverTo,handover:{from:lead.assignedTo,to:handoverTo,note:note||"Temporary handover requested.",reason:"Temporary takeover",createdAt:new Date().toISOString(),temporary:true}});
  }
  return (
    <div style={{position:"fixed",inset:0,zIndex:900,display:"flex"}} onClick={onClose}>
      <div style={{flex:1}}/>
      <div style={{width:580,background:"#fff",height:"100vh",overflowY:"auto",boxShadow:"-8px 0 40px rgba(13,45,58,0.14)",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:T.navy}}>{lead.name}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>{lead.phone} · {lead.email}</div>
            </div>
            <button onClick={onClose} style={{background:T.faint,border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:T.muted,fontSize:16}}>✕</button>
          </div>
          {/* Tags */}
          {lead.tags?.length>0&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
              {lead.tags.map((t:string)=><span key={t} style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:T.tealPale,color:T.navy,border:`1px solid ${T.border}`}}>{t}</span>)}
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <StatusBadge status={lead.status}/>
            <SourceBadge source={lead.source}/>
            {lead.landingPage&&<span style={{fontSize:11,color:T.muted,background:T.faint,padding:"2px 8px",borderRadius:20}}>📍 {lead.landingPage}</span>}
            {lead.handover&&<span style={{fontSize:11,color:"#92400e",background:"#fef3c7",padding:"2px 8px",borderRadius:20}}>Handover from {team[lead.handover.from]?.name}</span>}
            {agent&&<div style={{display:"flex",alignItems:"center",gap:5,marginLeft:"auto"}}><Avatar initials={agent.initials} color={agent.color} size={24}/><span style={{fontSize:12,color:T.muted}}>{agent.name}</span></div>}
          </div>
          {/* Quick stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:12}}>
            {[["Budget",lead.budget?`₹${Number(lead.budget).toLocaleString("en-IN")}`:"—"],["Pax",`${lead.paxCount||"—"}`],["Days",lead.days?`${lead.days}d`:"—"],["Trip",lead.tripDate?new Date(lead.tripDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"}):"—"]].map(([l,v])=>(
              <div key={l} style={{background:T.faint,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{v}</div>
                <div style={{fontSize:10,color:T.muted}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Actions */}
          <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
            <Btn small variant="green" onClick={()=>onWA(lead)}>💬 WA Templates</Btn>
            <a href={`tel:${lead.phone}`} style={{padding:"5px 12px",borderRadius:8,background:"#fff7ed",color:"#c2410c",fontSize:12,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>📞 Call</a>
            {currentUser==="owner"&&(
              <Btn small variant="ghost" onClick={()=>onUpdate({...lead,assignedTo:lead.assignedTo==="nikitha"?"aman":"nikitha"})}>
                → Pass to {lead.assignedTo==="nikitha"?"Aman":"Nikitha"}
              </Btn>
            )}
            <Btn small variant="ghost" onClick={requestHandover}>
              Hand over to {team[handoverTo]?.name || handoverTo}
            </Btn>
          </div>
          {lead.handover&&(
            <div style={{marginTop:10,padding:"9px 11px",borderRadius:8,background:"#fffbeb",border:"1px solid #fde68a",fontSize:12,color:"#78350f",lineHeight:1.5}}>
              Temporary handover from <strong>{team[lead.handover.from]?.name}</strong> to <strong>{team[lead.handover.to]?.name}</strong>: {lead.handover.note}
            </div>
          )}
        </div>
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 24px"}}>
          {tabs.map((t:any)=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"12px 0",marginRight:24,background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?T.teal:"transparent"}`,color:tab===t.id?T.teal:T.muted,fontWeight:tab===t.id?700:500,fontSize:13,cursor:"pointer"}}>{t.label}</button>)}
        </div>
        <div style={{padding:"20px 24px",flex:1}}>
          {tab==="info"      &&<LeadForm lead={lead} onSave={onUpdate} onCancel={onClose} currentUser={currentUser} team={team} leadAgentIds={leadAgentIds}/>}
          {tab==="followup"  &&<FollowUpTab lead={lead} onUpdate={onUpdate}/>}
          {tab==="reminders" &&<RemindersTab lead={lead} onUpdate={onUpdate}/>}
        </div>
      </div>
    </div>
  );
}

// ─── KANBAN VIEW ──────────────────────────────────────────────────────────────
function LeadWorkspace({lead,onBack,onUpdate,onDelete,currentUser,onWA,team=TEAM,leadAgentIds=DEFAULT_LEAD_AGENT_IDS}:any) {
  const [editing,setEditing]=useState(false);
  const agent=team[lead.assignedTo];
  const pendingReminders=(lead.reminders||[]).filter((r:any)=>!r.isCompleted);
  const handoverTo=leadAgentIds.find((id:string)=>id!==lead.assignedTo) || lead.assignedTo;
  const field=(label:string,value:any,wide=false)=>(
    <div style={{padding:"7px 0",borderBottom:`1px solid ${T.border}`,gridColumn:wide?"1/-1":undefined}}>
      <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{label}</div>
      <div style={{fontSize:13,color:T.navy,fontWeight:600,lineHeight:1.35,wordBreak:"break-word"}}>{value || "-"}</div>
    </div>
  );
  const section=(title:string,children:any,action?:any)=>(
    <section style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:14,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:8}}>
        <h2 style={{margin:0,fontSize:14,color:T.navy,textTransform:"uppercase",letterSpacing:"0.06em"}}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
  function saveLead(updated:any) {
    onUpdate(updated);
    setEditing(false);
  }
  function requestHandover() {
    const note=window.prompt(`Handover this lead to ${team[handoverTo]?.name || handoverTo}. Add a short note for context:`,`Please take this lead while I am unavailable.`);
    if(note===null) return;
    onUpdate({...lead,assignedTo:handoverTo,handover:{from:lead.assignedTo,to:handoverTo,note:note||"Temporary handover requested.",reason:"Temporary takeover",createdAt:new Date().toISOString(),temporary:true}});
  }
  function deleteCurrentLead() {
    if(window.confirm(`Delete lead for ${lead.name}? This will remove it from the CRM list.`)) onDelete(lead.id);
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:18}}>
        <div>
          <Btn variant="ghost" small onClick={onBack} style={{marginBottom:12}}>Back to leads</Btn>
          <h1 style={{margin:0,fontFamily:"Georgia,serif",fontSize:30,color:T.navy}}>{lead.name}</h1>
          <p style={{margin:"6px 0 0",fontSize:13,color:T.muted}}>{lead.phone || "-"} {lead.email?`- ${lead.email}`:""}</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <Btn variant="green" onClick={()=>onWA(lead)}>WhatsApp Templates</Btn>
          <a href={`tel:${lead.phone}`} style={{padding:"8px 16px",borderRadius:8,background:"#fff7ed",color:"#c2410c",fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Call</a>
          {currentUser==="owner"&&<Btn variant="danger" onClick={deleteCurrentLead}>Delete</Btn>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        {[
          ["Lead",<div key="lead"><strong>{lead.name}</strong><br/><span style={{fontSize:12,color:T.muted}}>{lead.phone||"-"}</span></div>],
          ["Destination",lead.destination||lead.landingPage||"-"],
          ["Pax",lead.paxCount||"-"],
          ["Travel",lead.days?`${lead.days} Days`:"-"],
          ["Start",formatLeadDate(lead.tripDate)||"-"],
          ["End",getLeadEndDate(lead.tripDate,lead.days)||"-"],
        ].map(([label,value]:any)=>(
          <div key={label} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",minHeight:70}}>
            <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{label}</div>
            <div style={{fontSize:14,color:T.navy,fontWeight:600}}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 330px",gap:16,alignItems:"start"}}>
        <div>
          {section("Follow-up Log",<FollowUpLedger lead={lead} onUpdate={onUpdate}/>)}

          {section("Lead Pass / Handover",
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
                {field("Current Owner",agent?.name||lead.assignedTo)}
                {field("Suggested Handover To",team[handoverTo]?.name || handoverTo)}
              </div>
              {lead.handover&&(
                <div style={{marginTop:12,padding:"12px 14px",borderRadius:10,background:"#fffbeb",border:"1px solid #fde68a",fontSize:13,color:"#78350f",lineHeight:1.6}}>
                  Temporary handover from <strong>{team[lead.handover.from]?.name || lead.handover.from}</strong> to <strong>{team[lead.handover.to]?.name || lead.handover.to}</strong>: {lead.handover.note}
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                {currentUser==="owner"&&(
                  <Btn variant="secondary" onClick={()=>onUpdate({...lead,assignedTo:lead.assignedTo==="nikitha"?"aman":"nikitha"})}>
                    Pass to {lead.assignedTo==="nikitha"?"Aman":"Nikitha"}
                  </Btn>
                )}
                <Btn variant="ghost" onClick={requestHandover}>Request Temporary Handover</Btn>
              </div>
            </div>
          )}

          {section("Lead Info", editing
            ? <LeadForm lead={lead} onSave={saveLead} onCancel={()=>setEditing(false)} currentUser={currentUser} team={team} leadAgentIds={leadAgentIds}/>
            : <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(150px,1fr))",gap:"0 18px"}}>
                {field("Full Name",lead.name)}
                {field("Phone",lead.phone)}
                {field("Email",lead.email)}
                {field("No. of Pax",lead.paxCount)}
                {field("Destination",lead.destination||lead.landingPage)}
                {field("No. of Days",lead.days)}
                {field("Start Date",formatLeadDate(lead.tripDate))}
                {field("End Date",getLeadEndDate(lead.tripDate,lead.days))}
                {field("State",getLeadState(lead))}
              </div>,
            !editing&&<Btn small variant="secondary" onClick={()=>setEditing(true)}>Edit Lead Info</Btn>
          )}

          {section("Enquiry Details",
            <details>
              <summary style={{cursor:"pointer",fontSize:13,fontWeight:700,color:T.teal,marginBottom:8}}>Show enquiry email details</summary>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(150px,1fr))",gap:"0 18px"}}>
              {field("Source",lead.source)}
              {field("Landing Page / Campaign",lead.landingPage)}
              {field("Package Type",lead.packageType)}
              {field("Budget",lead.budget?`Rs ${Number(lead.budget).toLocaleString("en-IN")}`:"")}
              {field("Message from Enquiry",lead.message,true)}
              {field("Special Requests",lead.specialRequests,true)}
              {field("Internal Notes",lead.notes,true)}
              {field("GCLID",lead.gclid,true)}
              </div>
            </details>
          )}

        </div>

        <aside style={{position:"sticky",top:0}}>
          <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:18,marginBottom:14}}>
            <h2 style={{margin:"0 0 14px",fontSize:14,color:T.navy,textTransform:"uppercase",letterSpacing:"0.06em"}}>Controls</h2>
            <Inp label="Status" value={lead.status||"New"} onChange={(status:string)=>onUpdate({...lead,status})} options={LEAD_STATUSES}/>
            <Inp label="Assigned Agent" value={lead.assignedTo} onChange={(assignedTo:string)=>onUpdate({...lead,assignedTo})} options={leadAgentIds}/>
            <TagDropdowns tags={lead.tags||[]} onChange={(tags:any)=>onUpdate({...lead,tags})}/>
            <div style={{display:"grid",gap:8,marginTop:4}}>
              <Btn onClick={()=>onWA(lead)}>Open WhatsApp Templates</Btn>
              <Btn variant="secondary" onClick={requestHandover}>Lead Pass / Handover</Btn>
              <a href={`tel:${lead.phone}`} style={{padding:"8px 16px",borderRadius:8,background:"#fff7ed",color:"#c2410c",fontSize:13,fontWeight:600,textDecoration:"none",textAlign:"center"}}>Call Customer</a>
              {currentUser==="owner"&&<Btn variant="danger" onClick={deleteCurrentLead}>Delete Lead</Btn>}
            </div>
          </div>

          <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:18}}>
            <h2 style={{margin:"0 0 12px",fontSize:14,color:T.navy,textTransform:"uppercase",letterSpacing:"0.06em"}}>Next Action</h2>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>
              {pendingReminders.length
                ? `${pendingReminders[0].note} on ${pendingReminders[0].dueDate} at ${pendingReminders[0].dueTime}`
                : "No pending reminder set."}
            </div>
            <div style={{marginTop:12,fontSize:12,color:T.muted}}>
              Last contact: {lead.lastContact?new Date(lead.lastContact).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"-"}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TagDropdowns({tags,onChange}:any) {
  const heat=HEAT_TAGS.find(t=>tags?.includes(t))||"";
  const budget=BUDGET_TAGS.find(t=>tags?.includes(t))||"";
  const month=MONTHS.find(m=>tags?.some((t:string)=>t.includes(m)))||"";
  function setTag(group:string[],val:string) {
    const rest=(tags||[]).filter((t:string)=>!group.includes(t));
    onChange(val?[...rest,val]:rest);
  }
  return (
    <div style={{display:"grid",gap:10,marginBottom:14}}>
      <Inp label="Lead Heat" value={heat} onChange={(v:string)=>setTag(HEAT_TAGS,v)} options={HEAT_TAGS}/>
      <Inp label="Budget Tag" value={budget} onChange={(v:string)=>setTag(BUDGET_TAGS,v)} options={BUDGET_TAGS}/>
      <Inp label="Travel Month" value={month} onChange={(v:string)=>setTag(MONTHS.map(m=>`📅 ${m}`),v?`📅 ${v}`:"")} options={MONTHS}/>
    </div>
  );
}

function KanbanView({leads,onSelectLead}:any) {
  return (
    <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:16,alignItems:"flex-start"}}>
      {LEAD_STATUSES.map(status=>{
        const col=leads.filter((l:any)=>l.status===status);
        const m=STATUS_META[status];
        const val=col.reduce((s:number,l:any)=>s+Number(l.budget),0);
        return (
          <div key={status} style={{minWidth:210,maxWidth:230,flexShrink:0,opacity:status==="Lost"?0.7:1}}>
            <div style={{background:m.col,border:`1.5px solid ${m.bg}`,borderRadius:"12px 12px 0 0",padding:"10px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,fontSize:13,color:m.text}}>{status}</span>
                <span style={{background:m.bg,color:m.text,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10}}>{col.length}</span>
              </div>
              {val>0&&<div style={{fontSize:11,color:m.text,opacity:0.65,marginTop:3}}>₹{(val/1000).toFixed(0)}K</div>}
            </div>
            <div style={{background:"#f5f9fa",border:`1.5px solid ${m.bg}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:8,minHeight:80}}>
              {col.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:12}}>Empty</div>}
              {col.map((lead:any)=>{
                const agent=TEAM[lead.assignedTo];
                return (
                  <div key={lead.id} onClick={()=>onSelectLead(lead)}
                    style={{background:"#fff",borderRadius:10,padding:"10px 12px",marginBottom:8,border:`1.5px solid ${T.border}`,cursor:"pointer",boxShadow:"0 1px 4px rgba(13,45,58,0.07)",transition:"all 0.15s"}}
                    onMouseEnter={e=>{(e.currentTarget as any).style.boxShadow="0 4px 16px rgba(13,45,58,0.13)";(e.currentTarget as any).style.borderColor=m.dot;}}
                    onMouseLeave={e=>{(e.currentTarget as any).style.boxShadow="0 1px 4px rgba(13,45,58,0.07)";(e.currentTarget as any).style.borderColor=T.border;}}>
                    {lead.isOverdue&&<div style={{fontSize:10,color:"#b91c1c",background:"#fee2e2",padding:"1px 6px",borderRadius:6,marginBottom:6,display:"inline-block",fontWeight:600}}>⚠ Overdue</div>}
                    <div style={{fontWeight:700,fontSize:13,color:T.navy}}>{lead.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>📍 {lead.destination||lead.landingPage||"—"}</div>
                    {lead.tags?.length>0&&<div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:5}}>{lead.tags.slice(0,2).map((t:string)=><span key={t} style={{fontSize:10,background:T.tealPale,color:T.navy,padding:"1px 6px",borderRadius:10}}>{t}</span>)}</div>}
                    <div style={{fontSize:12,fontWeight:700,color:T.teal,marginTop:5}}>₹{Number(lead.budget||0).toLocaleString("en-IN")}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                      <SourceBadge source={lead.source}/>
                      {agent&&<Avatar initials={agent.initials} color={agent.color} size={22}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ROTATION BANNER ──────────────────────────────────────────────────────────
function RotationBanner({leads,leaveData,onLeaveChange,dailyRoster,onRosterChange,currentUser,team=TEAM,leadAgentIds=DEFAULT_LEAD_AGENT_IDS}:any) {
  const today=new Date();
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const schedule=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()+i);const key=dateKey(d);const autoAgentId=getRotationAgent(d.toISOString(),leaveData,leadAgentIds);return{date:d,key,day:d.getDay(),autoAgentId,agentId:getDailyLeadOwner(d,dailyRoster,leaveData,leadAgentIds),override:dailyRoster[key],isToday:i===0};});
  const nextAgentId=getDailyLeadOwner(today,dailyRoster,leaveData,leadAgentIds);
  const nextAgent=team[nextAgentId];
  const weekStart=new Date(today);
  weekStart.setDate(today.getDate()-today.getDay());
  weekStart.setHours(0,0,0,0);
  const balance=leadAgentIds.map((id:string)=>({
    id,
    agent:team[id],
    count:leads.filter((l:any)=>l.assignedTo===id&&new Date(l.createdAt)>=weekStart).length,
    active:leads.filter((l:any)=>l.assignedTo===id&&!["Booked","Lost"].includes(l.status)).length,
    available:!isUnavailable(id,today,leaveData),
  }));
  return (
    <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:14}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:T.navy}}>Lead Assignment Control</div>
          <div style={{fontSize:12,color:T.muted,marginTop:3}}>Owner-controlled daily roster for lead receivers</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",background:T.faint}}>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Next New Lead</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Avatar initials={nextAgent.initials} color={nextAgent.color} size={34}/>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:T.navy,fontFamily:"Georgia,serif"}}>{nextAgent.name}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>
                New leads follow today's roster
              </div>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {balance.map(({id,agent,count,active,available})=>(
            <div key={id} style={{border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",background:available?"#fff":"#fff5f5"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <Avatar initials={agent.initials} color={agent.color} size={24}/>
                <div style={{fontSize:12,fontWeight:800,color:T.navy}}>{agent.name}</div>
              </div>
              <div style={{fontSize:11,color:T.muted}}>{count} this week</div>
              <div style={{fontSize:11,color:T.muted}}>{active} active leads</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontWeight:700,fontSize:13,color:T.navy}}>Availability Controls</span>
        <div style={{display:"flex",gap:6}}>
          {leadAgentIds.map((id:string)=>{const a=team[id];const status=typeof leaveData[id]==="string"?leaveData[id]:"Available";
            return <label key={id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:8,border:`1.5px solid ${status==="Available"?T.border:"#fca5a5"}`,background:status==="Available"?T.faint:"#fff5f5",fontSize:12,color:T.navy}}>
              <Avatar initials={a.initials} color={a.color} size={20}/>
              <span style={{fontWeight:700}}>{a.name}</span>
              <select value={status} onChange={e=>onLeaveChange(id,e.target.value)} style={{border:"none",background:"transparent",fontSize:12,color:status==="Available"?T.muted:"#b91c1c",outline:"none",cursor:"pointer"}}>
                {AVAILABILITY_OPTIONS.map(opt=><option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>;
          })}
        </div>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto"}}>
        {schedule.map(({date,key,day,autoAgentId,agentId,override,isToday})=>{const a=team[agentId];const auto=team[autoAgentId];
          return <div key={key} style={{minWidth:154,padding:"10px",borderRadius:10,border:`1.5px solid ${isToday?a.color:T.border}`,background:isToday?a.color+"10":T.faint,flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:isToday?a.color:T.muted,fontWeight:isToday?800:600}}>{days[day]}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{date.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</div>
              </div>
              {override&&<span style={{fontSize:10,color:"#92400e",background:"#fef3c7",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Override</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <Avatar initials={a.initials} color={a.color} size={24}/>
              <div>
                <div style={{fontSize:12,fontWeight:800,color:a.color}}>{a.name}</div>
                <div style={{fontSize:10,color:T.muted}}>Auto: {auto.name}</div>
              </div>
            </div>
            <select value={agentId} onChange={e=>onRosterChange(key,e.target.value,currentUser)} style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:7,background:"#fff",padding:"5px 6px",fontSize:12,color:T.navy,outline:"none"}}>
              {leadAgentIds.map((id:string)=><option key={id} value={id}>{team[id]?.name || id} takes leads</option>)}
            </select>
            {override&&(
              <div style={{fontSize:10,color:T.muted,marginTop:6,lineHeight:1.35}}>
                Changed by {team[override.changedBy]?.name || override.changedBy}
              </div>
            )}
          </div>;
        })}
      </div>
    </div>
  );
}

// ─── OWNER DASHBOARD ──────────────────────────────────────────────────────────
function OwnerDashboard({leads,leaveData,onLeaveChange,onSelectLead,dailyRoster,onRosterChange,currentUser,team=TEAM,leadAgentIds=DEFAULT_LEAD_AGENT_IDS}:any) {
  const total  =leads.length;
  const booked =leads.filter((l:any)=>l.status==="Booked").length;
  const overdue=leads.filter((l:any)=>l.isOverdue).length;
  const pipeVal=leads.filter((l:any)=>!["Booked","Lost"].includes(l.status)).reduce((s:number,l:any)=>s+Number(l.budget),0);
  const revenue=leads.filter((l:any)=>l.status==="Booked").reduce((s:number,l:any)=>s+Number(l.budget),0);
  const byStatus=LEAD_STATUSES.map(s=>({status:s,count:leads.filter((l:any)=>l.status===s).length,val:leads.filter((l:any)=>l.status===s).reduce((a:number,l:any)=>a+Number(l.budget),0)}));
  const handovers=leads.filter((l:any)=>l.handover);

  // Today's follow-ups
  const todayStr=new Date().toISOString().split("T")[0];
  const todayFU=leads.filter((l:any)=>l.nextFollowUp&&l.nextFollowUp.startsWith(todayStr));

  const kpis=[
    {label:"Total Leads",value:total,           color:T.navy},
    {label:"Booked",     value:booked,           color:"#15803d"},
    {label:"Pipeline",   value:`₹${(pipeVal/1000).toFixed(0)}K`,color:T.teal},
    {label:"Revenue",    value:`₹${(revenue/1000).toFixed(0)}K`,color:"#7c3aed"},
    {label:"Overdue",    value:overdue,           color:"#b91c1c"},
  ];

  return (
    <div>
      <RotationBanner leads={leads} leaveData={leaveData} onLeaveChange={onLeaveChange} dailyRoster={dailyRoster} onRosterChange={onRosterChange} currentUser={currentUser} team={team} leadAgentIds={leadAgentIds}/>

      {handovers.length>0&&(
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:"#78350f",marginBottom:8}}>Pending Handovers</div>
          {handovers.slice(0,3).map((lead:any)=>(
            <div key={lead.id} onClick={()=>onSelectLead(lead)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid #fde68a",cursor:"pointer"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,flex:1}}>{lead.name}</div>
              <div style={{fontSize:12,color:"#78350f"}}>{team[lead.handover.from]?.name} to {team[lead.handover.to]?.name}</div>
              <div style={{fontSize:11,color:T.muted,maxWidth:260,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.handover.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:26,fontWeight:800,color:k.color,fontFamily:"Georgia,serif",lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline — single row */}
      <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Pipeline Overview</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
          {byStatus.map(({status,count,val})=>{
            const m=STATUS_META[status];
            return (
              <div key={status} style={{padding:"12px 10px",borderRadius:10,background:m.col,border:`1px solid ${m.bg}`,textAlign:"center"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:m.dot,margin:"0 auto 6px"}}/>
                <div style={{fontSize:22,fontWeight:800,color:m.text,fontFamily:"Georgia,serif",lineHeight:1}}>{count}</div>
                <div style={{fontSize:10,fontWeight:700,color:m.text,marginTop:4,opacity:0.8}}>{status}</div>
                {val>0&&<div style={{fontSize:10,color:m.text,opacity:0.5,marginTop:3}}>₹{(val/1000).toFixed(0)}K</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Follow-ups */}
      <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>
          Today's Follow-ups {todayFU.length>0&&<span style={{background:"#fee2e2",color:"#b91c1c",padding:"2px 8px",borderRadius:10,marginLeft:8}}>{todayFU.length}</span>}
        </div>
        {todayFU.length===0?(
          <div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>No follow-ups scheduled for today 🎉</div>
        ):(
          todayFU.map((lead:any)=>{
            const agent=TEAM[lead.assignedTo];
            return (
              <div key={lead.id} onClick={()=>onSelectLead(lead)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",border:`1.5px solid ${T.border}`,borderRadius:10,marginBottom:8,cursor:"pointer",transition:"background 0.1s"}}
                onMouseEnter={e=>(e.currentTarget as any).style.background=T.faint}
                onMouseLeave={e=>(e.currentTarget as any).style.background=""}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.navy}}>{lead.name}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{lead.destination||lead.landingPage} · {lead.source}</div>
                </div>
                <StatusBadge status={lead.status}/>
                {agent&&<Avatar initials={agent.initials} color={agent.color} size={26}/>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── TEAM PAGE ────────────────────────────────────────────────────────────────
function TeamPage({leads,leaveData,onLeaveChange,team=TEAM,leadAgentIds=DEFAULT_LEAD_AGENT_IDS}:any) {
  const byAgent=leadAgentIds.map((id:string)=>({
    agent:team[id],
    total:  leads.filter((l:any)=>l.assignedTo===id).length,
    new:    leads.filter((l:any)=>l.assignedTo===id&&l.status==="New").length,
    active: leads.filter((l:any)=>l.assignedTo===id&&!["Booked","Lost"].includes(l.status)).length,
    booked: leads.filter((l:any)=>l.assignedTo===id&&l.status==="Booked").length,
    lost:   leads.filter((l:any)=>l.assignedTo===id&&l.status==="Lost").length,
    overdue:leads.filter((l:any)=>l.assignedTo===id&&l.isOverdue).length,
    revenue:leads.filter((l:any)=>l.assignedTo===id&&l.status==="Booked").reduce((s:number,l:any)=>s+Number(l.budget),0),
    pipeline:leads.filter((l:any)=>l.assignedTo===id&&!["Booked","Lost"].includes(l.status)).reduce((s:number,l:any)=>s+Number(l.budget),0),
    sources:LEAD_SOURCES.map(src=>({src,cnt:leads.filter((l:any)=>l.assignedTo===id&&l.source===src).length})).filter(x=>x.cnt>0),
    statuses:LEAD_STATUSES.map(s=>({s,cnt:leads.filter((l:any)=>l.assignedTo===id&&l.status===s).length})),
  }));

  const sourceTotal=(src:string)=>leads.filter((l:any)=>l.source===src).length;

  return (
    <div>
      {/* Agent cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {byAgent.map(({agent,total,new:n,active,booked,lost,overdue,revenue,pipeline,sources,statuses})=>(
          <div key={agent.id} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 22px"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <Avatar initials={agent.initials} color={agent.color} size={44}/>
                <div>
                  <div style={{fontWeight:700,fontSize:17,color:T.navy,fontFamily:"Georgia,serif"}}>{agent.name}</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:2}}>{total} total leads</div>
                </div>
              </div>
              <button onClick={()=>onLeaveChange(agent.id,!leaveData[agent.id])} style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${leaveData[agent.id]?"#fca5a5":T.border}`,background:leaveData[agent.id]?"#fee2e2":T.faint,cursor:"pointer",fontSize:12,color:leaveData[agent.id]?"#b91c1c":T.muted,fontWeight:600}}>
                {leaveData[agent.id]?"🏥 On Leave":"✓ Available"}
              </button>
            </div>
            {/* Stats grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {[["Active",active,T.teal],["Booked",booked,"#15803d"],["Lost",lost,"#b91c1c"],["Overdue",overdue,"#f97316"]].map(([lbl,val,col])=>(
                <div key={String(lbl)} style={{textAlign:"center",background:T.faint,borderRadius:10,padding:"10px 6px"}}>
                  <div style={{fontSize:22,fontWeight:800,color:String(col),fontFamily:"Georgia,serif"}}>{val}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:3}}>{lbl}</div>
                </div>
              ))}
            </div>
            {/* Revenue */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:11,color:"#15803d",fontWeight:700,marginBottom:4}}>REVENUE</div>
                <div style={{fontSize:18,fontWeight:800,color:"#15803d",fontFamily:"Georgia,serif"}}>₹{(revenue/1000).toFixed(0)}K</div>
              </div>
              <div style={{background:T.tealPale,border:`1px solid ${T.accent}`,borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:11,color:T.teal,fontWeight:700,marginBottom:4}}>PIPELINE</div>
                <div style={{fontSize:18,fontWeight:800,color:T.teal,fontFamily:"Georgia,serif"}}>₹{(pipeline/1000).toFixed(0)}K</div>
              </div>
            </div>
            {/* Pipeline mini */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>By Stage</div>
              <div style={{display:"flex",gap:4}}>
                {statuses.filter(x=>x.cnt>0).map(({s,cnt})=>{
                  const m=STATUS_META[s];
                  return <div key={s} style={{flex:cnt,minWidth:28,padding:"6px 4px",background:m.col,borderRadius:6,textAlign:"center",border:`1px solid ${m.bg}`}}>
                    <div style={{fontSize:13,fontWeight:800,color:m.text}}>{cnt}</div>
                    <div style={{fontSize:9,color:m.text,opacity:0.7,marginTop:1}}>{s.split(" ")[0]}</div>
                  </div>;
                })}
              </div>
            </div>
            {/* Sources */}
            {sources.length>0&&(
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Lead Sources</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {sources.map(({src,cnt}:any)=>(
                    <span key={src} style={{...SOURCE_COLORS[src],fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:SOURCE_COLORS[src]?.bg}}>{src}: {cnt}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall source breakdown */}
      <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Overall Lead Sources</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
          {LEAD_SOURCES.map(src=>{
            const cnt=sourceTotal(src);
            const c=SOURCE_COLORS[src];
            return (
              <div key={src} style={{textAlign:"center",padding:"12px 8px",borderRadius:10,background:c.bg,border:`1px solid ${c.bg}`}}>
                <div style={{fontSize:22,fontWeight:800,color:c.text,fontFamily:"Georgia,serif"}}>{cnt}</div>
                <div style={{fontSize:10,fontWeight:700,color:c.text,marginTop:4,opacity:0.8}}>{src}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── GMAIL IMPORT ─────────────────────────────────────────────────────────────
function TeamSettingsPage({team,setTeam,leadAgentIds,setLeadAgentIds}:any) {
  const [form,setForm]=useState({name:"",initials:"",color:"#1a7a8a"});
  const leadAgents=leadAgentIds.map((id:string)=>team[id]).filter(Boolean);
  function addMember() {
    const name=form.name.trim();
    if(!name) return alert("Please enter a team member name.");
    const id=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || `agent-${Date.now()}`;
    if(team[id]) return alert("This team member already exists.");
    const initials=(form.initials || name.split(" ").map((part:string)=>part[0]).join("")).slice(0,2).toUpperCase();
    setTeam((prev:any)=>({...prev,[id]:{id,name,initials,role:"agent",color:form.color,canReceiveLeads:true}}));
    setLeadAgentIds((prev:string[])=>[...prev,id]);
    setForm({name:"",initials:"",color:"#1a7a8a"});
  }
  function toggleLeadReceiver(id:string) {
    setLeadAgentIds((prev:string[])=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  }
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px"}}>
          <div style={{fontWeight:800,color:T.navy,fontSize:15,marginBottom:4}}>Owner Access</div>
          <div style={{fontSize:12,color:T.muted,lineHeight:1.6,marginBottom:12}}>Owner is admin-only and will not receive new leads in the roster. Owner can still open, edit, and work on any team lead when required.</div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:T.faint}}>
            <Avatar initials={team.owner.initials} color={team.owner.color} size={32}/>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:T.navy}}>{team.owner.name}</div>
              <div style={{fontSize:11,color:T.muted}}>Admin only · Not in lead rotation</div>
            </div>
          </div>
        </div>
        <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px"}}>
          <div style={{fontWeight:800,color:T.navy,fontSize:15,marginBottom:12}}>Add Team Member</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 90px 58px",gap:8,alignItems:"end"}}>
            <Inp label="Name" value={form.name} onChange={(v:string)=>setForm(p=>({...p,name:v}))} placeholder="e.g. Rahul"/>
            <Inp label="Initials" value={form.initials} onChange={(v:string)=>setForm(p=>({...p,initials:v.toUpperCase().slice(0,2)}))} placeholder="RK"/>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:T.muted,marginBottom:5}}>Color</label>
              <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} style={{width:"100%",height:36,border:`1px solid ${T.border}`,borderRadius:8,background:"#fff"}}/>
            </div>
          </div>
          <Btn onClick={addMember}>Add to Team</Btn>
        </div>
      </div>
      <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px"}}>
        <div style={{fontWeight:800,color:T.navy,fontSize:15,marginBottom:4}}>Lead Receivers</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Only active lead receivers appear in the daily roster and new lead assignment.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(180px,1fr))",gap:10}}>
          {Object.values(team).filter((m:any)=>m.role==="agent").map((m:any)=> {
            const active=leadAgentIds.includes(m.id);
            return (
              <div key={m.id} style={{border:`1px solid ${active?T.accent:T.border}`,borderRadius:10,padding:"12px",background:active?T.tealPale:"#fff"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <Avatar initials={m.initials} color={m.color} size={32}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:T.navy}}>{m.name}</div>
                    <div style={{fontSize:11,color:T.muted}}>{active?"Receives leads":"Paused from roster"}</div>
                  </div>
                </div>
                <Btn small variant={active?"secondary":"primary"} onClick={()=>toggleLeadReceiver(m.id)}>{active?"Pause Receiver":"Enable Receiver"}</Btn>
              </div>
            );
          })}
        </div>
        <div style={{fontSize:12,color:T.muted,marginTop:12}}>Current roster order: {leadAgents.map((m:any)=>m.name).join(" -> ") || "No active lead receivers"}</div>
      </div>
    </div>
  );
}

function LeadInboxPage({onImport,onManualAdd,existingLeads=[]}:any) {
  const [tab,setTab]=useState<"email"|"screenshot"|"manual">("email");
  const [screenshotData,setScreenshotData]=useState<any>(null);
  const [screenshotPreview,setScreenshotPreview]=useState("");
  const [screenshotFile,setScreenshotFile]=useState<File|null>(null);
  const [extracting,setExtracting]=useState(false);
  const [ocrText,setOcrText]=useState("");
  const [manual,setManual]=useState({name:"",phone:"",email:"",source:"WhatsApp",landingPage:"",paxCount:2,tripDate:"",days:"",message:""});
  function loadScreenshotFile(file:File) {
    if(!file.type.startsWith("image/")) return alert("Please paste or upload an image file.");
    setScreenshotPreview(URL.createObjectURL(file));
    setScreenshotFile(file);
    setScreenshotData(null);
    setOcrText("");
  }
  function handleScreenshotPaste(e:ClipboardEvent<HTMLDivElement>) {
    const file=Array.from(e.clipboardData.items).find(item=>item.type.startsWith("image/"))?.getAsFile();
    if(file) {
      e.preventDefault();
      loadScreenshotFile(file);
    }
  }
  async function extractScreenshotLead() {
    if(!screenshotFile) return alert("Paste or upload a screenshot first.");
    setExtracting(true);
    try {
      const worker=await createWorker("eng");
      const result=await worker.recognize(screenshotFile);
      await worker.terminate();
      const text=result.data.text || "";
      setOcrText(text);
      setScreenshotData(parseTravelEnquiryOcr(text));
    } catch (err) {
      console.error(err);
      alert("Could not read this screenshot. Please try a clearer image or enter the lead manually.");
    } finally {
      setExtracting(false);
    }
  }
  function addManualLead() {
    if(!manual.name || !manual.phone) return alert("Name and phone are required.");
    onManualAdd({...manual,paxCount:Number(manual.paxCount||1),days:Number(manual.days||0)});
    setManual({name:"",phone:"",email:"",source:"WhatsApp",landingPage:"",paxCount:2,tripDate:"",days:"",message:""});
  }
  const tabButton=(id:any,label:string)=>(
    <button onClick={()=>setTab(id)} style={{padding:"9px 14px",border:"none",borderBottom:`2px solid ${tab===id?T.teal:"transparent"}`,background:"transparent",fontSize:13,fontWeight:tab===id?800:600,color:tab===id?T.teal:T.muted,cursor:"pointer"}}>
      {label}
    </button>
  );
  return (
    <div>
      <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 16px"}}>
          {tabButton("email","Today's Email Leads")}
          {tabButton("screenshot","Screenshot Import")}
          {tabButton("manual","Manual Entry")}
        </div>
        <div style={{padding:"18px 20px"}}>
          {tab==="email"&&(
            <div>
              <div style={{fontSize:13,color:T.muted,lineHeight:1.6,marginBottom:14}}>
                For now this safely simulates Gmail import. When hosted, this section will read/copy enquiry emails from Gmail without stopping your email flow.
              </div>
              <GmailImportPanel onImport={onImport} existingLeads={existingLeads}/>
            </div>
          )}
          {tab==="screenshot"&&(
            <div>
              <div style={{fontSize:13,color:T.muted,lineHeight:1.6,marginBottom:14}}>
                Paste/upload a lead screenshot here. In the online version, OCR/AI will extract the fields; this prototype shows the review step before saving.
              </div>
              <div onPaste={handleScreenshotPaste} tabIndex={0} style={{border:`1.5px dashed ${T.border}`,borderRadius:12,padding:"22px",textAlign:"center",background:T.faint,marginBottom:14,outline:"none"}}>
                <div style={{fontSize:14,fontWeight:800,color:T.navy,marginBottom:6}}>Screenshot capture area</div>
                <div style={{fontSize:12,color:T.muted,marginBottom:12}}>Click here and press Ctrl+V to paste a screenshot, or upload an image.</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e=>{const file=e.target.files?.[0]; if(file) loadScreenshotFile(file);}}
                  style={{fontSize:12,marginBottom:12}}
                />
                {screenshotPreview&&(
                  <div style={{margin:"12px auto",maxWidth:420,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
                    <img src={screenshotPreview} alt="Pasted lead screenshot preview" style={{display:"block",width:"100%",maxHeight:260,objectFit:"contain"}}/>
                  </div>
                )}
                <Btn onClick={extractScreenshotLead} disabled={extracting || !screenshotPreview}>
                  {extracting?"Reading screenshot...":"Extract from screenshot"}
                </Btn>
              </div>
              {ocrText&&(
                <details style={{marginBottom:14,fontSize:12,color:T.muted}}>
                  <summary style={{cursor:"pointer",fontWeight:700,color:T.navy}}>View OCR text</summary>
                  <pre style={{whiteSpace:"pre-wrap",background:T.faint,border:`1px solid ${T.border}`,borderRadius:8,padding:10,maxHeight:160,overflow:"auto"}}>{ocrText}</pre>
                </details>
              )}
              {screenshotData&&(
                <div style={{border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",background:"#fff"}}>
                  <div style={{fontWeight:800,color:T.navy,marginBottom:10}}>Review Extracted Lead</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"0 14px"}}>
                    {["name","phone","email","landingPage","paxCount","tripDate","days","message","gclid"].map(k=>(
                      <Inp key={k} label={k==="gclid"?"GCLID":k==="landingPage"?"Destination":k==="tripDate"?"Trip Date":k} value={screenshotData[k]||""} onChange={(v:any)=>setScreenshotData((p:any)=>({...p,[k]:v}))} fullWidth={k==="gclid"}/>
                    ))}
                  </div>
                  <Btn onClick={()=>{onImport([screenshotData]);setScreenshotData(null);setScreenshotPreview("");}}>Add Screenshot Lead</Btn>
                </div>
              )}
            </div>
          )}
          {tab==="manual"&&(
            <div>
              <div style={{fontSize:13,color:T.muted,lineHeight:1.6,marginBottom:14}}>Use this for WhatsApp, phone call, and reference leads.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"0 14px"}}>
                <Inp label="Name" value={manual.name} onChange={(v:string)=>setManual(p=>({...p,name:v}))} required/>
                <Inp label="Phone" value={manual.phone} onChange={(v:string)=>setManual(p=>({...p,phone:v}))} required/>
                <Inp label="Email" value={manual.email} onChange={(v:string)=>setManual(p=>({...p,email:v}))}/>
                <Inp label="Source" value={manual.source} onChange={(v:string)=>setManual(p=>({...p,source:v}))} options={["WhatsApp","Phone Call","Referral","Email","Ads-Email"]}/>
                <Inp label="Landing Page / Destination" value={manual.landingPage} onChange={(v:string)=>setManual(p=>({...p,landingPage:v}))}/>
                <Inp label="Pax" value={manual.paxCount} onChange={(v:any)=>setManual(p=>({...p,paxCount:v}))} type="number"/>
                <Inp label="Trip Date" value={manual.tripDate} onChange={(v:string)=>setManual(p=>({...p,tripDate:v}))} type="date"/>
                <Inp label="Days" value={manual.days} onChange={(v:string)=>setManual(p=>({...p,days:v}))} type="number"/>
              </div>
              <Inp label="Message / Requirement" value={manual.message} onChange={(v:string)=>setManual(p=>({...p,message:v}))} type="textarea"/>
              <Btn onClick={addManualLead}>Add Manual Lead</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GmailImportPanel({onImport,existingLeads=[]}:any) {
  const [status,setStatus]=useState<"idle"|"searching"|"done"|"error">("idle");
  const [found,setFound]=useState<any[]>([]);
  const [sel,setSel]=useState(new Set<string>());
  const [error,setError]=useState("");
  const [importedMsg,setImportedMsg]=useState("");
  const [autoSync,setAutoSync]=useState(false);
  const [lastChecked,setLastChecked]=useState("");
  const [importDate,setImportDate]=useState(new Date().toISOString().split("T")[0]);

  function dateKeyForLead(value:string) {
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-CA");
  }

  function freshLeads(leads:any[]) {
    const importedGmailIds=new Set(existingLeads.map((l:any)=>l.gmailMessageId).filter(Boolean));
    const marked=markPossibleDuplicates(leads || [], existingLeads);
    return marked.filter((l:any)=>dateKeyForLead(l.receivedAt)===importDate && !importedGmailIds.has(l.gmailMessageId));
  }

  async function run() {
    setStatus("searching");
    setError("");
    try {
      const res=await fetch("/api/gmail/search",{cache:"no-store"});
      const data=await res.json().catch(()=>({}));
      if(!res.ok || !data.ok) throw new Error(data.error || "Could not connect to Gmail.");
      const leads=freshLeads(data.leads || []);
      setFound(leads);
      setSel(new Set(leads.filter((l:any)=>!l.possibleDuplicate).map((l:any)=>l.id)));
      setLastChecked(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
      setStatus("done");
    } catch(err:any) {
      setError(err?.message || "Could not connect to Gmail.");
      setStatus("error");
    }
  }

  useEffect(()=>{
    if(!autoSync) return;
    const timer=window.setInterval(async()=>{
      try {
        const res=await fetch("/api/gmail/search",{cache:"no-store"});
        const data=await res.json();
        if(res.ok && data.ok && data.leads?.length) {
          const leads=freshLeads(data.leads).filter((l:any)=>!l.possibleDuplicate);
          if(leads.length) onImport(leads);
          setLastChecked(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
        }
      } catch {}
    },60000);
    return ()=>window.clearInterval(timer);
  },[autoSync,onImport,existingLeads]);

  const toggle=(id:string)=>setSel(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  function importSelected() {
    const selected=found.filter(l=>sel.has(l.id));
    if(selected.length===0) return;
    onImport(selected);
    setImportedMsg(`Imported ${selected.length} lead${selected.length!==1?"s":""}.`);
    setFound(prev=>prev.filter(l=>!sel.has(l.id)));
    setSel(new Set());
  }

  return (
    <div>
      <p style={{margin:"0 0 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>
        Connects to <strong>reifyqueries@gmail.com</strong> and fetches "New Travel Enquiry" emails from your landing pages - Northeast India, Meghalaya & Arunachal Pradesh.
      </p>

      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <label style={{fontSize:12,fontWeight:700,color:T.muted}}>Import date</label>
        <input type="date" value={importDate} onChange={e=>setImportDate(e.target.value)} style={{padding:"8px 10px",borderRadius:8,border:`1.5px solid ${T.border}`,background:T.faint,color:T.navy,fontSize:13}}/>
        <span style={{fontSize:12,color:T.muted}}>Only emails received on this date will be shown.</span>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 14px",background:autoSync?"#dcfce7":T.faint,borderRadius:10,border:`1px solid ${autoSync?"#86efac":T.border}`}}>
        <Btn small variant={autoSync?"secondary":"primary"} onClick={()=>setAutoSync(v=>!v)}>{autoSync?"Stop Auto Sync":"Start Auto Sync"}</Btn>
        <span style={{fontSize:12,color:autoSync?"#15803d":T.muted}}>
          {autoSync?`Checking Gmail every 60 seconds${lastChecked?` - last checked ${lastChecked}`:""}`:"Use this while the team is working in the CRM."}
        </span>
      </div>

      {status==="idle"&&<Btn onClick={run}>Connect Gmail & Search</Btn>}
      {status==="done"&&<Btn variant="secondary" onClick={run} style={{marginBottom:12}}>Refresh Gmail Search</Btn>}
      {status==="searching"&&<div style={{padding:"12px 16px",background:T.tealPale,borderRadius:10,fontSize:13,color:T.navy}}>Searching Gmail for new enquiry emails...</div>}
      {status==="error"&&(
        <div style={{padding:"12px 14px",background:"#fee2e2",borderRadius:10,fontSize:13,color:"#b91c1c",marginBottom:12}}>
          {error}
          <Btn small variant="secondary" style={{marginLeft:10}} onClick={run}>Retry</Btn>
        </div>
      )}
      {importedMsg&&(
        <div style={{padding:"10px 12px",background:"#dcfce7",border:"1px solid #86efac",borderRadius:10,fontSize:13,color:"#15803d",marginBottom:12,fontWeight:700}}>
          {importedMsg}
        </div>
      )}
      {status==="done"&&found.map(l=>(
        <div key={l.id} onClick={()=>toggle(l.id)} style={{border:`1.5px solid ${sel.has(l.id)?T.teal:T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8,background:sel.has(l.id)?T.faint:"#fff",cursor:"pointer"}}>
          <div style={{display:"flex",gap:10}}>
            <input type="checkbox" checked={sel.has(l.id)} onChange={()=>toggle(l.id)} style={{marginTop:2}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{fontWeight:700,fontSize:14,color:T.navy}}>{l.name}</div>
                <span style={{fontSize:11,color:"#94a3b8"}}>{new Date(l.receivedAt).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
              </div>
              {l.possibleDuplicate&&(
                <div style={{display:"inline-block",marginTop:5,fontSize:11,fontWeight:700,color:"#92400e",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,padding:"2px 8px"}}>
                  Possible duplicate - {l.duplicateReason}
                </div>
              )}
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>{l.phone} - {l.email}</div>
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                <span style={{fontSize:11,fontWeight:600,background:"#dbeafe",color:"#1e40af",padding:"2px 8px",borderRadius:20}}>{l.landingPage}</span>
                <span style={{fontSize:11,color:T.muted}}>{l.paxCount} pax</span>
                <span style={{fontSize:11,color:T.muted}}>{l.tripDate}</span>
                <span style={{fontSize:11,color:T.muted}}>{l.days} days</span>
              </div>
              {l.message&&<div style={{fontSize:12,color:T.muted,marginTop:6,fontStyle:"italic"}}>"{l.message}"</div>}
            </div>
          </div>
        </div>
      ))}
      {status==="done"&&found.length>0&&(
        <div style={{display:"flex",gap:8,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
          <Btn onClick={importSelected} disabled={sel.size===0}>Import {sel.size} Lead{sel.size!==1?"s":""}</Btn>
          <Btn variant="secondary" onClick={()=>{setStatus("idle");setFound([]);}}>Reset</Btn>
          {found.some((l:any)=>l.possibleDuplicate)&&<span style={{fontSize:12,color:T.muted}}>Duplicate warnings are informational. You can still import corrected leads.</span>}
        </div>
      )}
      {status==="done"&&found.length===0&&(
        <div style={{padding:"18px",textAlign:"center",color:T.muted,fontSize:13}}>
          No enquiry emails found for the selected import date, or all matching leads are already imported.
        </div>
      )}
      <div style={{marginTop:16,padding:"12px 14px",background:"#fefce8",border:"1px solid #fde68a",borderRadius:10,fontSize:12,color:"#78350f"}}>
        <strong style={{color:"#92400e"}}>Gmail setup:</strong> Vercel must have GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and GMAIL_TARGET_EMAIL.
      </div>
    </div>
  );
}

// --- LEADS TABLE -------------------------------------------------------------
function LeadsTable({leads,onSelectLead,onAddLeads,onDeleteLead,currentUser,team=TEAM,leadAgentIds=DEFAULT_LEAD_AGENT_IDS}:any) {
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("All");
  const [sourceF,setSourceF]=useState("All");
  const [agentF,setAgentF]=useState("All");
  const [view,setView]=useState<"table"|"kanban">("table");
  const [gmail,setGmail]=useState(false);

  const filtered=useMemo(()=>{
    let r=leads;
    if(search){const q=search.toLowerCase();r=r.filter((l:any)=>l.name.toLowerCase().includes(q)||l.phone?.includes(q)||l.destination?.toLowerCase().includes(q)||l.landingPage?.toLowerCase().includes(q)||l.email?.toLowerCase().includes(q));}
    if(statusF!=="All")r=r.filter((l:any)=>l.status===statusF);
    if(sourceF!=="All")r=r.filter((l:any)=>l.source===sourceF);
    if(agentF!=="All")r=r.filter((l:any)=>l.assignedTo===agentF);
    return [...r].sort((a:any,b:any)=>new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime());
  },[leads,search,statusF,sourceF,agentF]);

  function leadDateKey(lead:any) {
    const date=new Date(lead.createdAt || lead.receivedAt || Date.now());
    return Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleDateString("en-CA");
  }

  function leadDateLabel(key:string) {
    if(key==="unknown") return "Date not available";
    const date=new Date(`${key}T00:00:00`);
    const today=new Date(); today.setHours(0,0,0,0);
    const yesterday=new Date(today); yesterday.setDate(today.getDate()-1);
    if(date.getTime()===today.getTime()) return `Today - ${date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`;
    if(date.getTime()===yesterday.getTime()) return `Yesterday - ${date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`;
    return date.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
  }

  const grouped=useMemo(()=>{
    const groups:Record<string,any[]>={};
    filtered.forEach((lead:any)=>{
      const key=leadDateKey(lead);
      groups[key]=groups[key]||[];
      groups[key].push(lead);
    });
    return Object.entries(groups).sort(([a],[b])=>b.localeCompare(a));
  },[filtered]);

  function importGmail(importedLeads:any[]) {
    const today=new Date().toISOString().split("T")[0];
    onAddLeads(importedLeads.map(l=>({
      id:"L"+Date.now()+Math.random(),
      name:l.name,phone:l.phone,email:l.email,
      source:"Ads-Email",status:"New",
      assignedTo:getRotationAgent(today,{},leadAgentIds),
      landingPage:l.landingPage,destination:l.landingPage,
      packageType:"",tripDate:l.tripDate,days:l.days,
      paxCount:l.paxCount,budget:0,
      message:l.message,gclid:l.gclid,
      createdAt:new Date().toISOString(),lastContact:"",nextFollowUp:"",
      daysInPipeline:0,isOverdue:false,tags:[],
      notes:`Imported from Gmail. Landing page: ${l.landingPage}`,
      followUpLog:[],reminders:[],
    })));
    setGmail(false);
  }

  const ss:any={padding:"8px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,fontSize:12,color:T.muted,background:T.faint,outline:"none"};

  if(leads.length===0) return <EmptyState onAdd={()=>onSelectLead("new")} onImport={()=>setGmail(true)}/>;

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, destination…" style={{...ss,width:"100%",paddingLeft:32,boxSizing:"border-box"}}/>
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)} style={ss}><option value="All">All Statuses</option>{LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
        <select value={sourceF} onChange={e=>setSourceF(e.target.value)} style={ss}><option value="All">All Sources</option>{LEAD_SOURCES.map(s=><option key={s}>{s}</option>)}</select>
        {currentUser==="owner"&&<select value={agentF} onChange={e=>setAgentF(e.target.value)} style={ss}><option value="All">All Agents</option>{leadAgentIds.map((id:string)=><option key={id} value={id}>{team[id]?.name || id}</option>)}</select>}
        <div style={{display:"flex",border:`1.5px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
          {(["table","kanban"] as const).map(m=><button key={m} onClick={()=>setView(m)} style={{padding:"7px 14px",background:view===m?T.navy:"transparent",color:view===m?"#fff":T.muted,border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>{m==="table"?"☰ Table":"⬛ Kanban"}</button>)}
        </div>
        <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
          <Btn variant="secondary" onClick={()=>setGmail(true)}>📧 Import Gmail</Btn>
          <Btn onClick={()=>onSelectLead("new")}>+ Add Lead</Btn>
        </div>
      </div>

      {gmail&&<Modal title="Import Leads from Gmail" onClose={()=>setGmail(false)}><GmailImportPanel onImport={importGmail} existingLeads={leads}/></Modal>}
      {view==="kanban"&&<KanbanView leads={filtered} onSelectLead={onSelectLead}/>}

      {view==="table"&&(
        <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:T.faint,borderBottom:`1px solid ${T.border}`}}>
                  {["Source","Agent","Lead","Pax","Destination","Days","Start Date","End Date","State","Status","Tag",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={12} style={{textAlign:"center",padding:"40px",color:"#94a3b8",fontSize:13}}>No leads match your filters.</td></tr>}
                {grouped.flatMap(([dateKey,items])=>{
                  const counts=leadAgentIds.map((id:string)=>({id,name:team[id]?.name||id,count:items.filter((l:any)=>l.assignedTo===id).length}));
                  const booked=items.filter((l:any)=>l.status==="Booked").length;
                  return [
                    <tr key={`date-${dateKey}`} style={{background:"#f8fcfd"}}>
                      <td colSpan={12} style={{padding:"12px 14px",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <span style={{fontSize:14,fontWeight:900,color:T.navy}}>{leadDateLabel(dateKey)}</span>
                          <TablePill>{items.length} Lead{items.length!==1?"s":""}</TablePill>
                          {counts.map(c=><span key={c.id} style={{fontSize:11,fontWeight:700,color:T.muted,background:"#fff",border:`1px solid ${T.border}`,padding:"3px 8px",borderRadius:999}}>{c.name}: {c.count}</span>)}
                          {booked>0&&<span style={{fontSize:11,fontWeight:700,color:"#15803d",background:"#dcfce7",padding:"3px 8px",borderRadius:999}}>Booked: {booked}</span>}
                        </div>
                      </td>
                    </tr>,
                    ...items.map((lead:any)=>{const agent=team[lead.assignedTo]; const tag=primaryTag(lead.tags); const state=getLeadState(lead);
                      return <tr key={lead.id} style={{borderBottom:`1px solid ${T.faint}`,cursor:"pointer"}}
                    onMouseEnter={e=>(e.currentTarget as any).style.background=T.faint}
                    onMouseLeave={e=>(e.currentTarget as any).style.background=""}
                    onClick={()=>onSelectLead(lead)}>
                    <td style={{padding:"12px"}}><TablePill tone="source">{lead.source||"—"}</TablePill></td>
                    <td style={{padding:"12px"}}>
                      {agent&&<div title={agent.name} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:34,height:28,borderRadius:999,background:"#fff",color:T.muted,border:`1.5px solid ${T.border}`,fontSize:13,fontWeight:800}}>{agent.initials}</div>}
                    </td>
                    <td style={{padding:"12px",minWidth:170}}>
                      <div style={{fontWeight:700,color:T.navy}}>{lead.name}</div>
                      <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{lead.phone}</div>
                      {lead.isOverdue&&<span style={{fontSize:10,color:"#b91c1c",background:"#fee2e2",padding:"1px 5px",borderRadius:6,marginTop:2,display:"inline-block"}}>Overdue</span>}
                      {lead.handover&&<span style={{fontSize:10,color:"#92400e",background:"#fef3c7",padding:"1px 5px",borderRadius:6,marginTop:2,marginLeft:4,display:"inline-block"}}>Handover</span>}
                    </td>
                    <td style={{padding:"12px",fontWeight:700,color:T.navy}}>{lead.paxCount||"—"}</td>
                    <td style={{padding:"12px",color:T.navy,fontSize:12,minWidth:130}}>{lead.destination||lead.landingPage||"—"}</td>
                    <td style={{padding:"12px"}}><TablePill tone="days">{lead.days?`${lead.days} Days`:"—"}</TablePill></td>
                    <td style={{padding:"12px"}}><TablePill>{formatLeadDate(lead.tripDate)||"—"}</TablePill></td>
                    <td style={{padding:"12px"}}><TablePill>{getLeadEndDate(lead.tripDate,lead.days)||"—"}</TablePill></td>
                    <td style={{padding:"12px",fontSize:12,color:T.muted}}>{state||"—"}</td>
                    <td style={{padding:"12px"}}><TablePill tone="status">{lead.status||"—"}</TablePill></td>
                    <td style={{padding:"12px"}}>
                      {tag?<span style={{fontSize:10,background:T.tealPale,color:T.navy,padding:"2px 7px",borderRadius:10,whiteSpace:"nowrap",fontWeight:700}}>{tag}</span>:<span style={{fontSize:12,color:"#94a3b8"}}>—</span>}
                    </td>
                    <td style={{padding:"12px"}}>
                      <div style={{display:"flex",gap:4}}>
                        <a href={`https://wa.me/${lead.phone?.replace(/\D/g,"")}`} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{padding:"4px 8px",borderRadius:6,background:"#dcfce7",color:"#15803d",fontSize:12,textDecoration:"none"}}>WA</a>
                        <a href={`tel:${lead.phone}`} onClick={e=>e.stopPropagation()} style={{padding:"4px 8px",borderRadius:6,background:"#fff7ed",color:"#c2410c",fontSize:12,textDecoration:"none"}}>📞</a>
                        {currentUser==="owner"&&<button onClick={e=>{e.stopPropagation(); if(confirm(`Delete lead ${lead.name}?`)) onDeleteLead(lead.id);}} style={{padding:"4px 8px",borderRadius:6,background:"#fee2e2",color:"#b91c1c",fontSize:12,border:"none",cursor:"pointer"}}>Del</button>}
                      </div>
                    </td>
                  </tr>;
                    })
                  ];
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:"10px 14px",borderTop:`1px solid ${T.faint}`,fontSize:12,color:T.muted,display:"flex",justifyContent:"space-between"}}>
            <span>Showing {filtered.length} of {leads.length} leads</span>
            <span>{leads.filter((l:any)=>l.isOverdue).length} overdue · {leads.filter((l:any)=>l.status==="Booked").length} booked</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ReifyCRM() {
  const [user,setUser]             =useState("owner");
  const [signedInUser,setSignedInUser]=useState("owner");
  const [authReady,setAuthReady]   =useState(false);
  const [tab,setTab]               =useState("dashboard");
  const [leads,setLeads]           =useState(INITIAL_LEADS);
  const [leadsLoaded,setLeadsLoaded]=useState(false);
  const [selected,setSelected]     =useState<any>(null);
  const [showAdd,setShowAdd]       =useState(false);
  const [team,setTeam]             =useState<Record<string,any>>(TEAM);
  const [leadAgentIds,setLeadAgentIds]=useState<string[]>(DEFAULT_LEAD_AGENT_IDS);
  const [leaveData,setLeaveData]   =useState<Record<string,string>>({});
  const [dailyRoster,setDailyRoster]=useState<Record<string,any>>({});
  const [waLead,setWaLead]         =useState<any>(null);

  useEffect(()=>{
    let cancelled=false;
    async function loadSignedInUser() {
      try {
        const supabase=createSupabaseClient();
        const {data}=await supabase.auth.getUser();
        const email=(data.user?.email || "").toLowerCase();
        const mapped=EMAIL_TO_USER[email] || "owner";
        if(!cancelled) {
          setSignedInUser(mapped);
          setUser(mapped);
          setTab(mapped==="owner"?"dashboard":"leads");
        }
      } catch {
        if(!cancelled) {
          setSignedInUser("owner");
          setUser("owner");
        }
      } finally {
        if(!cancelled) setAuthReady(true);
      }
    }
    loadSignedInUser();
    return ()=>{cancelled=true;};
  },[]);

  useEffect(()=>{
    let cancelled=false;
    try {
      const saved=window.localStorage.getItem("reifycrm_leads");
      if(saved) setLeads(JSON.parse(saved));
    } catch {}
    async function loadSharedLeads() {
      try {
        const savedRaw=window.localStorage.getItem("reifycrm_leads");
        const localLeads=savedRaw?JSON.parse(savedRaw):[];
        const res=await fetch("/api/leads",{cache:"no-store"});
        const data=await res.json().catch(()=>({}));
        if(!cancelled && res.ok && data.ok) {
          setLeads(data.leads || []);
          if((data.leads || []).length===0 && localLeads.length) {
            void fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leads:localLeads})});
          }
        }
      } catch {}
      if(!cancelled) setLeadsLoaded(true);
    }
    loadSharedLeads();
    return ()=>{cancelled=true;};
  },[]);

  useEffect(()=>{
    if(!leadsLoaded) return;
    try {
      window.localStorage.setItem("reifycrm_leads",JSON.stringify(leads));
    } catch {}
  },[leads,leadsLoaded]);

  const visible=user==="owner"?leads:leads.filter((l:any)=>l.assignedTo===user);
  const leaveChange=(id:string,status:string|boolean)=>setLeaveData(p=>({...p,[id]:status===true?"On leave":status===false||status==="Available"?undefined as any:String(status)}));
  const rosterChange=(day:string,assignedTo:string,changedBy:string)=>setDailyRoster(p=>({...p,[day]:{assignedTo,changedBy,changedAt:new Date().toISOString()}}));
  const selectLead=(l:any)=>{if(l==="new"){setShowAdd(true);return;}setSelected(l);};
  const signOut=async()=>{
    try {
      const supabase=createSupabaseClient();
      await supabase.auth.signOut();
      window.localStorage.removeItem("reifycrm_leads");
    } catch {}
    window.location.href="/login";
  };
  const persistLead=(lead:any)=>void fetch("/api/leads",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({lead})});
  const persistLeads=(newLeads:any[])=>void fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leads:newLeads})});
  const updateLead=(u:any)=>{setLeads(p=>p.map(l=>l.id===u.id?u:l));setSelected(u);persistLead(u);};
  const deleteLead=(id:string)=>{setLeads(p=>p.filter(l=>l.id!==id)); void fetch(`/api/leads?id=${encodeURIComponent(id)}`,{method:"DELETE"}); if(selected?.id===id) setSelected(null);};
  const createLead=(d:any)=>{const lead={...d,id:"L"+Date.now(),createdAt:new Date().toISOString(),lastContact:"",nextFollowUp:"",daysInPipeline:0,isOverdue:false,followUpLog:[],reminders:[]};setLeads(p=>[lead,...p]);persistLead(lead);setShowAdd(false);};
  const addLeads=(nl:any[])=>{setLeads(p=>[...nl,...p]);persistLeads(nl);};
  const buildIncomingLead=(l:any)=>({
    id:"L"+Date.now()+Math.random(),
    name:l.name,
    phone:l.phone,
    email:l.email||"",
    source:l.source||"Ads-Email",
    status:"New",
    assignedTo:getDailyLeadOwner(new Date(),dailyRoster,leaveData,leadAgentIds),
    landingPage:l.landingPage||l.destination||"",
    destination:l.destination||l.landingPage||"",
    packageType:l.packageType||"",
    tripDate:dateInputValue(l.tripDate||""),
    days:Number(l.days||0),
    paxCount:Number(l.paxCount||1),
    budget:Number(l.budget||0),
      message:l.message||"",
      gclid:l.gclid||"",
      gmailMessageId:l.gmailMessageId||"",
    createdAt:new Date().toISOString(),
    lastContact:"",
    nextFollowUp:"",
    daysInPipeline:0,
    isOverdue:false,
    tags:[],
    notes:l.notes||`Imported from ${l.source||"Lead Inbox"}.`,
    followUpLog:[],
    reminders:[],
  });
  const importIncomingLeads=(incoming:any[])=>{const built=incoming.map(buildIncomingLead);setLeads(p=>[...built,...p]);persistLeads(built);};
  const addIncomingLead=(incoming:any)=>importIncomingLeads([incoming]);

  const overdueCount=visible.filter((l:any)=>l.isOverdue).length;
  const pendingCount=leads.flatMap((l:any)=>l.reminders.filter((r:any)=>!r.isCompleted)).length;

  const nav=[
    {id:"dashboard",icon:"📊",label:"Dashboard",  roles:["owner"]},
    {id:"inbox",    icon:"IN",label:"Lead Inbox",  roles:["owner",...leadAgentIds], badge:0},
    {id:"team",     icon:"👥",label:"Team",        roles:["owner"],          badge:0},
    {id:"settings", icon:"⚙",label:"Team Settings",roles:["owner"],          badge:0},
    {id:"allleads", icon:"📋",label:"All Leads",   roles:["owner"],          badge:leads.length},
    {id:"leads",    icon:"👤",label:"My Leads",    roles:leadAgentIds, badge:visible.length},
    {id:"overdue",  icon:"⚠️",label:"Overdue",     roles:["owner",...leadAgentIds],badge:overdueCount},
  ].filter(n=>n.roles.includes(user));

  if(!authReady) {
    return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,color:T.navy,fontFamily:"'Segoe UI',sans-serif",fontWeight:700}}>Loading CRM...</div>;
  }

  return (
    <div style={{fontFamily:"'Segoe UI',sans-serif",display:"flex",height:"100vh",background:T.bg,overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-thumb{background:#cce4ea;border-radius:2px;}`}</style>

      {/* ── Sidebar ── */}
      <aside style={{width:230,background:T.navy,display:"flex",flexDirection:"column",height:"100vh",flexShrink:0}}>
        <div style={{padding:"20px 18px 16px",borderBottom:`1px solid ${T.navyMid}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <ReifyLogo/>
            <div>
              <div style={{color:T.accent,fontSize:15,fontWeight:700,lineHeight:1.2,fontFamily:"Georgia,serif"}}>Reify Travels</div>
              <div style={{fontSize:10,color:"#3d6a7a",marginTop:1,letterSpacing:"0.06em",textTransform:"uppercase"}}>CRM Dashboard</div>
            </div>
          </div>
        </div>

        {/* User switcher */}
        <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.navyMid}`}}>
          <div style={{fontSize:10,color:"#2d5060",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{signedInUser==="owner"?"Viewing As":"Signed In"}</div>
          {(signedInUser==="owner"?Object.values(team):[team[signedInUser]]).filter(Boolean).map((u:any)=>(
            <button key={u.id} onClick={()=>{if(signedInUser==="owner"){setUser(u.id);setTab(u.id==="owner"?"dashboard":"leads");}}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:"none",cursor:signedInUser==="owner"?"pointer":"default",marginBottom:4,background:user===u.id?T.navyMid:"transparent",transition:"background 0.15s"}}>
              <Avatar initials={u.initials} color={user===u.id?u.color:"#3d6070"} size={24}/>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:12,fontWeight:700,color:user===u.id?T.accent:"#4a8090"}}>{u.name}</div>
                <div style={{fontSize:10,color:"#2d5060",textTransform:"capitalize"}}>{u.role}</div>
              </div>
              {user===u.id&&<span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:u.color}}/>}
            </button>
          ))}
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"12px 10px"}}>
          {nav.map((item:any)=>(
            <button key={item.id} onClick={()=>setTab(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,background:tab===item.id?T.navyMid:"transparent",transition:"background 0.15s"}}>
              <span style={{fontSize:15}}>{item.icon}</span>
              <span style={{fontSize:13,fontWeight:600,color:tab===item.id?T.accent:"#4a8090",flex:1,textAlign:"left"}}>{item.label}</span>
              {item.badge>0&&<span style={{background:tab===item.id?T.teal:T.navyMid,color:tab===item.id?"#fff":"#4a8090",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:10}}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        {pendingCount>0&&(
          <div style={{margin:"0 10px 10px",padding:"10px 12px",background:"rgba(26,122,138,0.15)",borderRadius:10,border:`1px solid ${T.teal}44`}}>
            <div style={{fontSize:11,fontWeight:700,color:T.accent}}>🔔 {pendingCount} pending reminder{pendingCount!==1?"s":""}</div>
          </div>
        )}

        <div style={{padding:"12px 14px",borderTop:`1px solid ${T.navyMid}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Avatar initials={team[user].initials} color={team[user].color} size={28}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:T.accent}}>{team[user].name}</div>
              <div style={{fontSize:10,color:"#2d5060",textTransform:"capitalize"}}>{team[user].role}</div>
            </div>
          </div>
          <button onClick={signOut} style={{width:"100%",marginTop:10,padding:"8px 10px",borderRadius:8,border:`1px solid ${T.navyMid}`,background:"transparent",color:"#7fb7c5",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{flex:1,overflow:"auto",padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <h1 style={{margin:0,fontFamily:"Georgia,serif",fontSize:26,color:T.navy}}>
              {tab==="dashboard"&&"Owner Dashboard"}
              {tab==="inbox"&&"Lead Inbox"}
              {tab==="team"&&"Team Performance"}
              {tab==="settings"&&"Team Settings"}
              {tab==="allleads"&&"All Leads"}
              {tab==="leads"&&"My Leads"}
              {tab==="overdue"&&"Overdue Follow-ups"}
            </h1>
            <p style={{margin:"4px 0 0",fontSize:13,color:T.muted}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · {team[user].name}</p>
          </div>
          {(tab==="allleads"||tab==="leads")&&<Btn onClick={()=>setShowAdd(true)}>+ Add Lead Manually</Btn>}
        </div>

        {tab==="dashboard"&&<OwnerDashboard leads={leads} leaveData={leaveData} onLeaveChange={leaveChange} onSelectLead={selectLead} dailyRoster={dailyRoster} onRosterChange={rosterChange} currentUser={user} team={team} leadAgentIds={leadAgentIds}/>}
        {tab==="inbox"&&<LeadInboxPage onImport={importIncomingLeads} onManualAdd={addIncomingLead} existingLeads={leads}/>}
        {tab==="team"     &&<TeamPage leads={leads} leaveData={leaveData} onLeaveChange={leaveChange} team={team} leadAgentIds={leadAgentIds}/>}
        {tab==="settings" &&<TeamSettingsPage team={team} setTeam={setTeam} leadAgentIds={leadAgentIds} setLeadAgentIds={setLeadAgentIds}/>}
        {(tab==="allleads"||tab==="leads")&&<LeadsTable leads={visible} onSelectLead={selectLead} onAddLeads={addLeads} onDeleteLead={deleteLead} currentUser={user} team={team} leadAgentIds={leadAgentIds}/>}
        {tab==="overdue"  &&<LeadsTable leads={visible.filter((l:any)=>l.isOverdue)} onSelectLead={selectLead} onAddLeads={addLeads} onDeleteLead={deleteLead} currentUser={user} team={team} leadAgentIds={leadAgentIds}/>}
      </main>

      {selected&&(
        <div style={{position:"fixed",inset:0,zIndex:900,background:T.bg,overflow:"auto",padding:24}}>
          <LeadWorkspace lead={selected} onBack={()=>setSelected(null)} onUpdate={updateLead} onDelete={deleteLead} currentUser={user} onWA={(l:any)=>setWaLead(l)} team={team} leadAgentIds={leadAgentIds}/>
        </div>
      )}
      {showAdd&&<Modal title="Add New Lead" onClose={()=>setShowAdd(false)} width={660}><LeadForm lead={null} onSave={createLead} onCancel={()=>setShowAdd(false)} currentUser={user} leaveData={leaveData} dailyRoster={dailyRoster} team={team} leadAgentIds={leadAgentIds}/></Modal>}
      {waLead&&<Modal title="WhatsApp Templates" onClose={()=>setWaLead(null)} width={560}><WATemplates lead={waLead} onClose={()=>setWaLead(null)}/></Modal>}
    </div>
  );
}
