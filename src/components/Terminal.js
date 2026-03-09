'use client';

import { useState, useMemo, useRef } from 'react';
import { FACILITIES } from '@/data/facilities';

const TOTAL_COUNT = FACILITIES.length;
const TOTAL_EMISSIONS = FACILITIES.reduce((s, f) => s + f.e, 0);
const SECTORS = [...new Set(FACILITIES.map(f => f.s))].sort();
const PARAMS = [...new Set(FACILITIES.flatMap(f => f.cp))].sort();
const METHODS = [...new Set(FACILITIES.map(f => f.m))].sort();
const DATA_SOURCES = ['GHGRP', 'RECLAIM', 'MRR'];

const fmt = (n) => n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
const fmtFull = (n) => Number(n).toLocaleString();

function ConfDots({ level }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3].map(l => (
        <span key={l} className="inline-block w-2 h-2 rounded-full" style={{
          background: level >= l ? (level >= 3 ? '#22c55e' : level >= 2 ? '#ff8c00' : '#555') : '#1a1a1a',
          border: '1px solid #2a2a2a'
        }} />
      ))}
    </span>
  );
}

function Tag({ children, color = '#555' }) {
  return <span className="inline-block px-1.5 py-0 text-[9.5px] border mr-1 mb-0.5" style={{ borderColor: color, color }}>{children}</span>;
}
function SourceTag({ source }) {
  const c = { GHGRP: '#3b82f6', RECLAIM: '#a855f7', MRR: '#22c55e', USER: '#ff8c00' };
  return <Tag color={c[source] || '#555'}>{source}</Tag>;
}
function ParamTag({ param }) {
  return <Tag color={param === 'CO2' ? '#ff8c00' : '#666'}>{param}</Tag>;
}
function Section({ title, children }) {
  return <div className="mb-3"><div className="text-[9px] text-[#666] uppercase tracking-widest mb-1.5">{title}</div>{children}</div>;
}
function Row({ label, value }) {
  return <div className="mb-0.5"><span className="text-[#666] text-[10.5px]">{label}: </span><span className="text-[#c8c8c8] text-[10.5px]">{value}</span></div>;
}
function MethodBadge({ method }) {
  const cls = method.includes('Tier 4') || method.includes('CEMS') ? 'text-[#22c55e]' :
    method.includes('Mixed') ? 'text-yellow-500' :
    method.includes('Calculation') ? 'text-[#ef4444]' : 'text-[#555]';
  return <span className={cls}>{method}</span>;
}
function FilterSelect({ label, value, onChange, options, allLabel = 'All' }) {
  return (
    <div className="mb-3">
      <label className="text-[9px] text-[#666] uppercase tracking-widest mb-1 block">{label}</label>
      <select className="w-full bg-[#111] text-[#c8c8c8] border border-[#2a2a2a] px-2 py-1.5 outline-none cursor-pointer focus:border-[#ff8c00] transition-colors text-[11px]"
        value={value} onChange={e => onChange(e.target.value)}>
        <option value="ALL">{allLabel}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const UPLOAD_FIELDS = [
  { key: 'facility_name', label: 'Facility Name', required: true, hint: 'Legal name' },
  { key: 'ghgrp_id', label: 'GHGRP Facility ID', required: false, hint: 'EPA 7-digit ID' },
  { key: 'scaqmd_id', label: 'SCAQMD Facility ID', required: false, hint: '6-digit RECLAIM ID' },
  { key: 'arb_id', label: 'CARB ARB ID', required: false, hint: 'MRR identifier' },
  { key: 'sector', label: 'Industry Sector', required: true, hint: 'e.g. Petroleum Refining, Cement' },
  { key: 'city', label: 'City', required: true, hint: '' },
  { key: 'county', label: 'County', required: true, hint: '' },
  { key: 'latitude', label: 'Latitude', required: false, hint: 'Decimal degrees' },
  { key: 'longitude', label: 'Longitude', required: false, hint: 'Decimal degrees' },
  { key: 'naics', label: 'NAICS Code', required: true, hint: '6-digit' },
  { key: 'total_co2e_mt', label: 'Total CO2e (MT/yr)', required: true, hint: 'Annual metric tons' },
  { key: 'ghg_method', label: 'GHG Reporting Method', required: true, hint: 'Tier 1-4 or Mixed' },
  { key: 'cems_params', label: 'CEMS Parameters', required: true, hint: 'Semicolon-separated: NOx;SOx;CO2' },
  { key: 'regulatory_programs', label: 'Regulatory Programs', required: true, hint: 'Semicolon-separated' },
  { key: 'unit_total', label: 'Total Combustion Units', required: false, hint: '' },
  { key: 'unit_cems', label: 'Units with CEMS', required: false, hint: '' },
  { key: 'unit_calc', label: 'Units with Calculation', required: false, hint: '' },
];

export default function Terminal() {
  const [sector, setSector] = useState('ALL');
  const [param, setParam] = useState('ALL');
  const [method, setMethod] = useState('ALL');
  const [source, setSource] = useState('ALL');
  const [minConf, setMinConf] = useState(1);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('e');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [uploadData, setUploadData] = useState([]);
  const fileRef = useRef(null);

  const allFacilities = useMemo(() => {
    const uploaded = uploadData.map(u => ({ ...u, ds: ['USER'], cf: 0, gcf: false, ir: false, im: false }));
    return [...FACILITIES, ...uploaded];
  }, [uploadData]);

  const filtered = useMemo(() => {
    let d = [...allFacilities];
    if (sector !== 'ALL') d = d.filter(f => f.s === sector);
    if (param !== 'ALL') d = d.filter(f => f.cp.includes(param));
    if (method !== 'ALL') d = d.filter(f => f.m === method);
    if (source !== 'ALL') d = d.filter(f => f.ds.includes(source));
    if (minConf > 1) d = d.filter(f => f.cf >= minConf);
    if (search) {
      const q = search.toUpperCase();
      d = d.filter(f => f.n.toUpperCase().includes(q) || f.c.toUpperCase().includes(q) || f.co.toUpperCase().includes(q) || f.s.toUpperCase().includes(q));
    }
    d.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'n': av = a.n; bv = b.n; break;
        case 'e': av = a.e; bv = b.e; break;
        case 'cf': av = a.cf; bv = b.cf; break;
        case 's': av = a.s; bv = b.s; break;
        default: av = a.e; bv = b.e;
      }
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return d;
  }, [allFacilities, sector, param, method, source, minConf, search, sortCol, sortDir]);

  const stats = useMemo(() => ({
    count: filtered.length,
    emissions: filtered.reduce((s, f) => s + f.e, 0),
    withCO2: filtered.filter(f => f.cp.includes('CO2')).length,
    conf2: filtered.filter(f => f.cf >= 2).length,
    sectors: Object.entries(filtered.reduce((acc, f) => { acc[f.s] = (acc[f.s]||0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]),
  }), [filtered]);

  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const arrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';

  const exportCSV = () => {
    const h = ['Name','Sector','City','County','NAICS','Total CO2e (MT)','GHG Method','CEMS Params','Regulatory Programs','Confidence','Data Sources','GHGRP ID','SCAQMD ID'];
    const rows = filtered.map(f => [f.n, f.s, f.c, f.co, f.na, f.e, f.m, f.cp.join(';'), f.rp.join(';'), f.cf, f.ds.join(';'), f.id||'', f.sid||'']);
    const csv = [h, ...rows].map(r => r.map(v => '"'+v+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ca_cems_facilities.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
        const row = {}; headers.forEach((h, j) => { row[h] = vals[j] || ''; });
        records.push({
          id: row.ghgrp_id ? Number(row.ghgrp_id) : null, sid: row.scaqmd_id || row.arb_id || '',
          n: row.facility_name || row.name || 'Unknown', c: row.city || '', co: row.county || '',
          lat: row.latitude ? Number(row.latitude) : null, lng: row.longitude ? Number(row.longitude) : null,
          na: row.naics || '', s: row.sector || 'Unknown', sp: '',
          e: Number(row.total_co2e_mt || 0), m: row.ghg_method || 'Unknown',
          ut: row.unit_total ? Number(row.unit_total) : null, uc: row.unit_cems ? Number(row.unit_cems) : null,
          uk: row.unit_calc ? Number(row.unit_calc) : null, ec: null, ek: null, pc: null, ch4: null, n2o: null,
          cp: (row.cems_params || '').split(';').map(s => s.trim()).filter(Boolean),
          rp: (row.regulatory_programs || '').split(';').map(s => s.trim()).filter(Boolean), uty: [],
        });
      }
      setUploadData(records); setActiveTab('data');
    };
    reader.readAsText(file); if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = UPLOAD_FIELDS.map(f => f.key);
    const example = ['Acme Cement Plant','','123456','','Cement','Riverside','Riverside','33.9533','-117.3962','327310','850000','Tier 4 (CEMS)','NOx;SOx;CO2;Opacity','GHGRP Tier 4;SCAQMD RECLAIM','5','3','2'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cems_upload_template.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const sel = selected !== null ? filtered[selected] : null;

  const filtersContent = (
    <>
      <div className="mb-3">
        <label className="text-[9px] text-[#666] uppercase tracking-widest mb-1 block">Search</label>
        <input className="w-full bg-[#111] text-[#c8c8c8] border border-[#2a2a2a] px-2 py-1.5 outline-none focus:border-[#ff8c00] transition-colors text-[11px]"
          placeholder="Name, city, county..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <FilterSelect label="Sector" value={sector} onChange={setSector} options={SECTORS} />
      <FilterSelect label="CEMS Parameter" value={param} onChange={setParam} options={PARAMS} />
      <FilterSelect label="GHG Method" value={method} onChange={setMethod} options={METHODS} />
      <FilterSelect label="Data Source" value={source} onChange={setSource} options={DATA_SOURCES} />
      <FilterSelect label="Min Confidence" value={String(minConf)} onChange={v => setMinConf(Number(v))} options={['1','2','3']} allLabel="1+ (All)" />
      <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
        <div className="text-[8px] text-[#444] uppercase tracking-[1.5px] mb-2">Query Results</div>
        {[['Showing', stats.count], ['Emissions', fmtFull(stats.emissions)+' MT'], ['w/ CO2 CEMS', stats.withCO2], ['Conf \u22652', stats.conf2]].map(([k,v]) => (
          <div key={k} className="flex justify-between mb-1"><span className="text-[#666] text-[10px]">{k}</span><span className="text-[#ff8c00] text-[10px] font-semibold">{v}</span></div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
        <div className="text-[8px] text-[#444] uppercase tracking-[1.5px] mb-2">By Sector</div>
        {stats.sectors.slice(0,10).map(([s, c]) => (
          <div key={s} className="flex justify-between mb-0.5 cursor-pointer hover:bg-[#141410] px-1 -mx-1 transition-colors"
               onClick={() => { setSector(sector === s ? 'ALL' : s); setMobileFilters(false); }}>
            <span className="text-[10px] truncate max-w-[150px]" style={{ color: sector === s ? '#ff8c00' : '#666' }}>{s}</span>
            <span className="text-[10px] text-[#ff8c00] font-semibold">{c}</span>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#111] border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileFilters(!mobileFilters)} className="lg:hidden text-[#ff8c00] bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 text-[11px] cursor-pointer">{mobileFilters ? '\u2715' : '\u2630'}</button>
          <span className="text-[#ff8c00] font-bold text-[12px] sm:text-[13px] tracking-wider">CA CEMS DB</span>
          <span className="text-[9px] text-[#666] bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 hidden sm:inline">v2.0</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {[['data','DATA'],['upload','\u2191 UPLOAD'],['info','INFO']].map(([tab, label]) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSelected(null); }}
              className={`text-[9px] sm:text-[10px] border px-2 sm:px-3 py-1 tracking-wider uppercase cursor-pointer transition-colors ${activeTab === tab ? 'text-[#ff8c00] border-[#ff8c00] bg-[#1a1800]' : 'text-[#666] border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222]'}`}>
              {label}
            </button>
          ))}
          <button onClick={exportCSV} className="text-[9px] sm:text-[10px] text-[#ff8c00] bg-[#1a1a1a] border border-[#2a2a2a] px-2 sm:px-3 py-1 tracking-wider uppercase hover:bg-[#222] transition-colors cursor-pointer hidden sm:inline">CSV \u2193</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Desktop sidebar */}
        <div className="w-[220px] min-w-[220px] bg-[#0d0d0d] border-r border-[#1a1a1a] p-2 overflow-y-auto hidden lg:block">{filtersContent}</div>

        {/* Mobile filters overlay */}
        {mobileFilters && (
          <div className="absolute inset-0 z-30 lg:hidden flex">
            <div className="w-[280px] max-w-[80vw] bg-[#0d0d0d] border-r border-[#2a2a2a] p-3 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-[#ff8c00] font-bold uppercase tracking-wider">Filters</span>
                <button onClick={() => setMobileFilters(false)} className="text-[#666] text-sm cursor-pointer bg-transparent border-none">{'\u2715'}</button>
              </div>
              {filtersContent}
              <button onClick={() => setMobileFilters(false)} className="w-full mt-4 text-[11px] text-[#0a0a0a] bg-[#ff8c00] py-2 font-bold uppercase tracking-wider cursor-pointer border-none">
                Apply ({stats.count} results)
              </button>
            </div>
            <div className="flex-1 bg-black/60" onClick={() => setMobileFilters(false)} />
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <>
            <div className="flex-1 overflow-auto min-w-0">
              <table className="w-full">
                <thead>
                  <tr>
                    {[['cf','CONF','w-[50px]',true],['n','FACILITY','min-w-[160px]',true],['s','SECTOR','min-w-[100px] hidden sm:table-cell',true],['e','CO2e (MT)','w-[100px] text-right',true],['m_','METHOD','w-[140px] hidden xl:table-cell',false],['cp_','CEMS','w-[130px] hidden lg:table-cell',false],['ds_','SRC','w-[100px] hidden sm:table-cell',false]].map(([col,label,cls,sortable]) => (
                      <th key={col} onClick={() => sortable && handleSort(col)}
                        className={`sticky top-0 z-10 bg-[#0f0f0f] text-[#ff8c00] font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-1.5 border-b border-[#2a2a2a] text-left whitespace-nowrap ${cls} ${sortable ? 'cursor-pointer hover:text-white select-none' : ''}`}>
                        {label}{sortable ? arrow(col) : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => (
                    <tr key={`${f.n}-${i}`} onClick={() => setSelected(selected === i ? null : i)}
                      className={`cursor-pointer transition-colors ${selected === i ? 'bg-[#1a1800]' : i%2===0 ? 'bg-[#0a0a0a]' : 'bg-[#0c0c0c]'} hover:bg-[#141410]`}>
                      <td className="px-2 py-1 border-b border-[#141414]"><ConfDots level={f.cf} /></td>
                      <td className="px-2 py-1 border-b border-[#141414] text-[#e0e0e0] font-medium truncate max-w-[200px] sm:max-w-[280px] text-[10.5px] sm:text-[11.5px]">{f.n}</td>
                      <td className="px-2 py-1 border-b border-[#141414] text-[#666] hidden sm:table-cell text-[11px]">{f.s}</td>
                      <td className={`px-2 py-1 border-b border-[#141414] text-right text-[11px] ${f.e > 1e6 ? 'text-[#ff8c00] font-bold' : f.e > 1e5 ? 'text-[#c8c8c8]' : 'text-[#666]'}`}>{f.e > 0 ? fmtFull(f.e) : '\u2014'}</td>
                      <td className="px-2 py-1 border-b border-[#141414] hidden xl:table-cell text-[11px]"><MethodBadge method={f.m} /></td>
                      <td className="px-2 py-1 border-b border-[#141414] hidden lg:table-cell">{f.cp.map(p => <ParamTag key={p} param={p} />)}</td>
                      <td className="px-2 py-1 border-b border-[#141414] hidden sm:table-cell">{f.ds.map(d => <SourceTag key={d} source={d} />)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center text-[#555] py-12">No facilities match filters</div>}
            </div>

            {/* Detail panel */}
            {sel && (
              <div className="w-full sm:w-[340px] sm:min-w-[340px] bg-[#0d0d0d] border-l border-[#2a2a2a] p-4 overflow-y-auto absolute sm:relative inset-0 sm:inset-auto z-20">
                <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-[#666] hover:text-[#c8c8c8] bg-transparent border-none cursor-pointer text-sm">{'\u2715'}</button>
                <div className="text-[#ff8c00] font-bold text-[13px] mb-1 pr-6 leading-tight">{sel.n}</div>
                <div className="text-[#666] text-[10px] mb-4">{[sel.c, sel.co].filter(Boolean).join(', ')}</div>
                <Section title="Identifiers">
                  {sel.id && <Row label="GHGRP ID" value={sel.id} />}
                  {sel.sid && <Row label="SCAQMD ID" value={sel.sid} />}
                  {sel.na && sel.na !== 'nan' && sel.na !== '' && <Row label="NAICS" value={sel.na} />}
                  {sel.lat && <Row label="Coords" value={`${sel.lat.toFixed(4)}, ${sel.lng.toFixed(4)}`} />}
                </Section>
                <Section title="Emissions (Annual)">
                  <div className="text-[#ff8c00] text-[18px] font-bold mb-2">{sel.e > 0 ? fmtFull(sel.e) + ' MT CO2e' : 'Not reported to GHGRP'}</div>
                  {sel.ut != null && (<>
                    <Row label="Combustion units" value={`${sel.uc||0} CEMS / ${sel.ut} total`} />
                    {sel.ec != null && <Row label="CO2 via CEMS" value={`${fmtFull(sel.ec)} MT (${sel.pc}%)`} />}
                    {sel.ek != null && sel.ek > 0 && <Row label="CO2 via calc" value={`${fmtFull(sel.ek)} MT`} />}
                    {sel.ch4 > 0 && <Row label="CH4" value={`${fmtFull(sel.ch4)} MT CO2e`} />}
                    {sel.n2o > 0 && <Row label="N2O" value={`${fmtFull(sel.n2o)} MT CO2e`} />}
                  </>)}
                </Section>
                <Section title="GHG Method"><div className="font-semibold"><MethodBadge method={sel.m} /></div></Section>
                <Section title="CEMS Parameters"><div className="flex flex-wrap gap-1">{sel.cp.map(p => <ParamTag key={p} param={p} />)}</div></Section>
                <Section title="Regulatory Programs">{sel.rp.map(r => <div key={r} className="text-[#666] text-[11px]">{'\u2022'} {r}</div>)}</Section>
                <Section title="Confidence"><div className="flex items-center gap-2"><ConfDots level={sel.cf} /><span className="text-[#666] text-[11px]">{sel.cf}/3 {'\u2014'} {sel.ds.join(' + ')}</span></div></Section>
                {sel.uty && sel.uty.length > 0 && <Section title="Unit Types">{sel.uty.map((u,i) => <div key={i} className="text-[#666] text-[10px]">{u}</div>)}</Section>}
                {sel.sp && sel.sp !== 'nan' && sel.sp !== '' && <Section title="GHGRP Subparts"><span className="text-[#666]">{sel.sp}</span></Section>}
                <Section title="Public Records">
                  {sel.id && <a href={`https://ghgdata.epa.gov/flight/details/${sel.id}/2023/E`} target="_blank" rel="noopener noreferrer" className="block text-[#3b82f6] text-[11px] hover:underline mb-1">{'\u2192'} EPA FLIGHT Facility Detail</a>}
                  {sel.im && <a href="https://ww2.arb.ca.gov/mrr-data" target="_blank" rel="noopener noreferrer" className="block text-[#22c55e] text-[11px] hover:underline mb-1">{'\u2192'} CARB MRR Data</a>}
                  {sel.ir && <a href="https://www.aqmd.gov/home/programs/business/about-reclaim/reclaim-facility-nox-emissions" target="_blank" rel="noopener noreferrer" className="block text-[#a855f7] text-[11px] hover:underline mb-1">{'\u2192'} SCAQMD RECLAIM Data</a>}
                </Section>
              </div>
            )}
          </>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl">
            <h2 className="text-[#ff8c00] font-bold text-[15px] tracking-wider uppercase mb-1">Upload Facility Data</h2>
            <p className="text-[#666] text-[11px] mb-6 leading-relaxed">Add your own CEMS facility data. Upload a CSV matching the schema below. Data appears alongside the public dataset and can be exported together.</p>
            <div className="flex flex-wrap gap-3 mb-8">
              <button onClick={downloadTemplate} className="text-[10px] text-[#ff8c00] bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 tracking-wider uppercase hover:bg-[#222] transition-colors cursor-pointer">{'\u2193'} Download Template</button>
              <label className="text-[10px] text-[#0a0a0a] bg-[#ff8c00] border border-[#ff8c00] px-4 py-2 tracking-wider uppercase hover:bg-[#e07800] transition-colors cursor-pointer">
                {'\u2191'} Upload CSV<input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" />
              </label>
              {uploadData.length > 0 && <span className="text-[#22c55e] text-[11px] self-center">{'\u2713'} {uploadData.length} facilities loaded</span>}
            </div>
            <div className="border border-[#1a1a1a] bg-[#0d0d0d]">
              <div className="px-4 py-2 border-b border-[#1a1a1a] text-[10px] text-[#ff8c00] font-bold uppercase tracking-wider">Required CSV Schema</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]"><thead><tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-4 py-1.5 text-[9px] text-[#ff8c00] uppercase tracking-wider">Field</th>
                  <th className="text-left px-4 py-1.5 text-[9px] text-[#ff8c00] uppercase tracking-wider w-[50px]">Req</th>
                  <th className="text-left px-4 py-1.5 text-[9px] text-[#ff8c00] uppercase tracking-wider">Description</th>
                </tr></thead><tbody>
                  {UPLOAD_FIELDS.map(f => (
                    <tr key={f.key} className="border-b border-[#111] hover:bg-[#111]">
                      <td className="px-4 py-1.5 text-[#c8c8c8] font-medium">{f.key}</td>
                      <td className="px-4 py-1.5">{f.required ? <span className="text-[#ff8c00]">{'\u25CF'}</span> : <span className="text-[#333]">{'\u25CB'}</span>}</td>
                      <td className="px-4 py-1.5 text-[#666]">{f.label}{f.hint ? ` \u2014 ${f.hint}` : ''}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            </div>
            <div className="mt-6 p-4 border border-[#1a1a1a] bg-[#0d0d0d]">
              <div className="text-[10px] text-[#ff8c00] font-bold uppercase tracking-wider mb-2">Data Sources Aggregated</div>
              <p className="text-[#666] text-[11px] leading-relaxed mb-3">This schema unifies fields across three federal and state datasets.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[['EPA GHGRP','#3b82f6','GHGRP ID, subparts, Tier methodology, unit-level CEMS/calc breakdown'],['SCAQMD RECLAIM','#a855f7','SCAQMD ID, NOx/SOx CEMS confirmation, allocation data'],['CARB MRR','#22c55e','ARB ID, verification status, Cap-and-Trade coverage']].map(([n,color,desc]) => (
                  <div key={n} className="p-3 border border-[#1a1a1a]"><div className="text-[10px] font-bold mb-1" style={{color}}>{n}</div><div className="text-[#555] text-[10px] leading-relaxed">{desc}</div></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl">
            <h2 className="text-[#ff8c00] font-bold text-[15px] tracking-wider uppercase mb-1">About This Database</h2>
            <p className="text-[#888] text-[11px] mb-6 leading-relaxed">The first cross-referenced database of California industrial facilities operating Continuous Emissions Monitoring Systems (CEMS), built from three independent public data sources.</p>

            <div className="border border-[#1a1a1a] bg-[#0d0d0d] mb-6">
              <div className="px-4 py-2 border-b border-[#1a1a1a] text-[10px] text-[#ff8c00] font-bold uppercase tracking-wider">Methodology</div>
              <div className="p-4 text-[11px] text-[#888] leading-relaxed space-y-3">
                <p>Facilities identified by cross-referencing three public datasets. Each receives a <span className="text-[#ff8c00]">confidence score (1{'\u2013'}3)</span> based on independent source confirmations.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                  {[['Layer 1: EPA GHGRP','#3b82f6','32 CA facilities','Unit-level data identifies Tier 4 (CEMS) vs Tier 1-3 (calculation). Facility-level CEMS flag provides confirmation.'],
                    ['Layer 2: SCAQMD RECLAIM','#a855f7','214 facilities','276 PDFs parsed for names/IDs. All RECLAIM major sources required to operate NOx CEMS and report daily.'],
                    ['Layer 3: CARB MRR','#22c55e','55 cross-matched','CA threshold 10K MT CO2e (lower than federal 25K). Third-party verified. Cap-and-Trade coverage.']
                  ].map(([title,color,count,desc]) => (
                    <div key={title} className="p-3 border border-[#1a1a1a]">
                      <div className="text-[10px] font-bold mb-0.5" style={{color}}>{title}</div>
                      <div className="text-[#ff8c00] text-[10px] mb-2">{count}</div>
                      <div className="text-[#555] text-[10px] leading-relaxed">{desc}</div>
                    </div>
                  ))}
                </div>
                <p>Deduplicated via name matching and IDs. Sectors classified by NAICS + name heuristics, then manually reviewed.</p>
              </div>
            </div>

            <div className="border border-[#1a1a1a] bg-[#0d0d0d] mb-6">
              <div className="px-4 py-2 border-b border-[#1a1a1a] text-[10px] text-[#ff8c00] font-bold uppercase tracking-wider">Data Sources</div>
              <div className="p-4 space-y-2">
                {[['EPA GHGRP Data Sets','https://www.epa.gov/ghgreporting/data-sets'],['EPA FLIGHT','https://ghgdata.epa.gov/ghgp/main.do'],['CARB MRR Reported Emissions','https://ww2.arb.ca.gov/mrr-data'],['CARB Pollution Mapping Tool','https://ww2.arb.ca.gov/resources/carb-pollution-mapping-tool'],['SCAQMD RECLAIM NOx Emissions','https://www.aqmd.gov/home/programs/business/about-reclaim/reclaim-facility-nox-emissions'],['SCAQMD F.I.N.D.','https://www.aqmd.gov/nav/find/facility-information-detail']].map(([l,u]) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block text-[#3b82f6] text-[11px] hover:underline">{'\u2192'} {l}</a>
                ))}
              </div>
            </div>

            <div className="border border-[#1a1a1a] bg-[#0d0d0d] mb-6">
              <div className="px-4 py-2 border-b border-[#1a1a1a] text-[10px] text-[#ff8c00] font-bold uppercase tracking-wider">Summary</div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[[TOTAL_COUNT,'Facilities'],[fmt(TOTAL_EMISSIONS),'MT CO2e'],[SECTORS.length,'Sectors'],['3','Data Layers']].map(([v,l]) => (
                  <div key={l} className="text-center"><div className="text-[#ff8c00] text-[20px] font-bold">{v}</div><div className="text-[#555] text-[9px] uppercase tracking-wider">{l}</div></div>
                ))}
              </div>
            </div>

            <div className="border border-[#ff8c00]/30 bg-[#1a1800] p-4 mb-6">
              <div className="text-[10px] text-[#ff8c00] font-bold uppercase tracking-wider mb-2">Feedback &amp; Corrections</div>
              <p className="text-[#888] text-[11px] leading-relaxed mb-3">Found a misclassified facility? Know of a CEMS installation we missed? Have data from another air district?</p>
              <div className="flex flex-wrap gap-3">
                <a href="https://github.com/dexdogs/ca-cems-terminal/issues" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#c8c8c8] bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 tracking-wider uppercase hover:bg-[#222] transition-colors inline-block">{'\u2192'} GitHub Issues</a>
                <a href="https://www.linkedin.com/company/dexdogs" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#c8c8c8] bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 tracking-wider uppercase hover:bg-[#222] transition-colors inline-block">{'\u2192'} LinkedIn</a>
              </div>
            </div>

            <div className="text-[10px] text-[#333] leading-relaxed">
              Built by <a href="https://dexdogs.com" target="_blank" rel="noopener noreferrer" className="text-[#555] hover:text-[#888]">dexdogs</a>. Public data sources. March 2025.
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div className="flex items-center gap-2 sm:gap-4 px-3 py-1 bg-[#111] border-t border-[#1a1a1a] text-[10px] shrink-0">
        <span><span className="text-[#666]">SHOW </span><span className="text-[#ff8c00] font-bold">{stats.count}</span><span className="text-[#666]">/{TOTAL_COUNT}</span></span>
        <span className="hidden sm:inline"><span className="text-[#666]">CO2e: </span><span className="text-[#ff8c00] font-bold">{fmt(stats.emissions)}</span></span>
        <span className="hidden md:inline"><span className="text-[#666]">CO2 CEMS: </span><span className="text-[#ff8c00] font-bold">{stats.withCO2}</span></span>
        {uploadData.length > 0 && <span className="hidden sm:inline"><span className="text-[#666]">USER: </span><span className="text-[#22c55e] font-bold">{uploadData.length}</span></span>}
        <span className="ml-auto text-[#222] hidden lg:inline">EPA GHGRP 2023 {'\u00B7'} CARB MRR 2024 {'\u00B7'} SCAQMD RECLAIM 2025</span>
      </div>
    </div>
  );
}
