'use client';

import { useState, useMemo } from 'react';
import { FACILITIES } from '@/data/facilities';

const TOTAL_COUNT = FACILITIES.length;
const TOTAL_EMISSIONS = FACILITIES.reduce((s, f) => s + f.e, 0);
const SECTORS = [...new Set(FACILITIES.map(f => f.s))].sort();
const PARAMS = [...new Set(FACILITIES.flatMap(f => f.cp))].sort();
const METHODS = [...new Set(FACILITIES.map(f => f.m))].sort();
const DATA_SOURCES = ['GHGRP', 'RECLAIM', 'MRR'];

const fmt = (n) => n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
const fmtFull = (n) => Number(n).toLocaleString();

function ConfidenceDots({ level }) {
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
  return (
    <span className="inline-block px-1.5 py-0 text-[9.5px] border mr-1 mb-0.5" style={{ borderColor: color, color }}>
      {children}
    </span>
  );
}

function SourceTag({ source }) {
  const colors = { GHGRP: '#3b82f6', RECLAIM: '#a855f7', MRR: '#22c55e' };
  return <Tag color={colors[source] || '#555'}>{source}</Tag>;
}

function ParamTag({ param }) {
  return <Tag color={param === 'CO2' ? '#ff8c00' : '#666'}>{param}</Tag>;
}

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

  const filtered = useMemo(() => {
    let d = [...FACILITIES];
    if (sector !== 'ALL') d = d.filter(f => f.s === sector);
    if (param !== 'ALL') d = d.filter(f => f.cp.includes(param));
    if (method !== 'ALL') d = d.filter(f => f.m === method);
    if (source !== 'ALL') d = d.filter(f => f.ds.includes(source));
    if (minConf > 1) d = d.filter(f => f.cf >= minConf);
    if (search) {
      const q = search.toUpperCase();
      d = d.filter(f =>
        f.n.toUpperCase().includes(q) ||
        f.c.toUpperCase().includes(q) ||
        f.co.toUpperCase().includes(q) ||
        f.s.toUpperCase().includes(q)
      );
    }
    d.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'n': av = a.n; bv = b.n; break;
        case 'e': av = a.e; bv = b.e; break;
        case 'cf': av = a.cf; bv = b.cf; break;
        case 's': av = a.s; bv = b.s; break;
        case 'c': av = a.c; bv = b.c; break;
        default: av = a.e; bv = b.e;
      }
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return d;
  }, [sector, param, method, source, minConf, search, sortCol, sortDir]);

  const stats = useMemo(() => ({
    count: filtered.length,
    emissions: filtered.reduce((s, f) => s + f.e, 0),
    withCO2: filtered.filter(f => f.cp.includes('CO2')).length,
    conf2: filtered.filter(f => f.cf >= 2).length,
    conf3: filtered.filter(f => f.cf >= 3).length,
    sectors: Object.entries(filtered.reduce((acc, f) => { acc[f.s] = (acc[f.s]||0) + 1; return acc; }, {}))
      .sort((a,b) => b[1]-a[1]),
  }), [filtered]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const arrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const exportCSV = () => {
    const h = ['Name','Sector','City','County','NAICS','Total CO2e (MT)','GHG Method','CEMS Params','Regulatory Programs','Confidence','Data Sources','GHGRP ID','SCAQMD ID','Unit Total','Unit CEMS','Unit Calc','CEMS CO2','Calc CO2','Pct CEMS'];
    const rows = filtered.map(f => [
      f.n, f.s, f.c, f.co, f.na, f.e, f.m,
      f.cp.join(';'), f.rp.join(';'), f.cf, f.ds.join(';'),
      f.id||'', f.sid||'', f.ut||'', f.uc||'', f.uk||'', f.ec||'', f.ek||'', f.pc||''
    ]);
    const csv = [h, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ca_cems_facilities.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const sel = selected !== null ? filtered[selected] : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#111] border-b border-term-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-term-accent font-bold text-[13px] tracking-wider">CA CEMS FACILITY DATABASE</span>
          <span className="text-[9px] text-term-dim bg-[#1a1a1a] border border-term-border2 px-2 py-0.5">v2.0</span>
          <span className="text-[9px] text-term-dim bg-[#1a1a1a] border border-term-border2 px-2 py-0.5 hidden md:inline">
            EPA GHGRP 2023 · CARB MRR 2024 · SCAQMD RECLAIM 2025
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-term-muted hidden sm:inline">
            {TOTAL_COUNT} FACILITIES · {fmt(TOTAL_EMISSIONS)} MT CO2e
          </span>
          <button onClick={exportCSV}
            className="text-[10px] text-term-accent bg-[#1a1a1a] border border-term-border2 px-3 py-1 tracking-wider uppercase hover:bg-[#222] transition-colors cursor-pointer">
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="flex flex-1 min-h-0">
        {/* ─── SIDEBAR ─── */}
        <div className="w-[220px] min-w-[220px] bg-term-surface border-r border-term-border p-2 overflow-y-auto hidden lg:block">
          <div className="mb-3">
            <label className="text-[9px] text-term-dim uppercase tracking-widest mb-1 block">Search</label>
            <input
              className="w-full bg-[#111] text-term-text border border-term-border2 px-2 py-1 outline-none focus:border-term-accent transition-colors"
              placeholder="Name, city, county..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {[
            ['Sector', sector, setSector, SECTORS],
            ['CEMS Parameter', param, setParam, PARAMS],
            ['GHG Method', method, setMethod, METHODS],
            ['Data Source', source, setSource, DATA_SOURCES],
          ].map(([label, val, setVal, opts]) => (
            <div className="mb-3" key={label}>
              <label className="text-[9px] text-term-dim uppercase tracking-widest mb-1 block">{label}</label>
              <select
                className="w-full bg-[#111] text-term-text border border-term-border2 px-2 py-1 outline-none cursor-pointer focus:border-term-accent transition-colors"
                value={val}
                onChange={e => setVal(e.target.value)}
              >
                <option value="ALL">All</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div className="mb-3">
            <label className="text-[9px] text-term-dim uppercase tracking-widest mb-1 block">Min Confidence</label>
            <select
              className="w-full bg-[#111] text-term-text border border-term-border2 px-2 py-1 outline-none cursor-pointer focus:border-term-accent transition-colors"
              value={minConf}
              onChange={e => setMinConf(Number(e.target.value))}
            >
              <option value={1}>1+ (All)</option>
              <option value={2}>2+ (Multi-source)</option>
              <option value={3}>3 (Highest)</option>
            </select>
          </div>

          {/* Sidebar stats */}
          <div className="mt-4 pt-3 border-t border-term-border">
            <div className="text-[8px] text-term-muted uppercase tracking-[1.5px] mb-2">Query Results</div>
            {[
              ['Showing', stats.count],
              ['Emissions', fmtFull(stats.emissions) + ' MT'],
              ['w/ CO2 CEMS', stats.withCO2],
              ['Conf ≥2', stats.conf2],
              ['Conf ≥3', stats.conf3],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between mb-1">
                <span className="text-term-dim text-[10px]">{k}</span>
                <span className="text-term-accent text-[10px] font-semibold">{v}</span>
              </div>
            ))}
          </div>

          {/* Sector breakdown */}
          <div className="mt-4 pt-3 border-t border-term-border">
            <div className="text-[8px] text-term-muted uppercase tracking-[1.5px] mb-2">By Sector</div>
            {stats.sectors.slice(0, 12).map(([s, c]) => (
              <div key={s} className="flex justify-between mb-0.5 cursor-pointer hover:bg-[#141410] px-1 -mx-1 transition-colors"
                   onClick={() => setSector(sector === s ? 'ALL' : s)}>
                <span className="text-[10px] text-term-dim truncate max-w-[150px]"
                      style={{ color: sector === s ? '#ff8c00' : undefined }}>{s}</span>
                <span className="text-[10px] text-term-accent font-semibold">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── TABLE ─── */}
        <div className="flex-1 overflow-auto min-w-0">
          {/* Mobile search */}
          <div className="lg:hidden p-2 border-b border-term-border bg-term-surface">
            <input
              className="w-full bg-[#111] text-term-text border border-term-border2 px-2 py-1 outline-none text-[11px]"
              placeholder="Search facilities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <table className="w-full">
            <thead>
              <tr>
                {[
                  ['cf', 'CONF', 'w-[60px]'],
                  ['n', 'FACILITY', 'min-w-[200px]'],
                  ['s', 'SECTOR', 'min-w-[120px]'],
                  ['c', 'LOCATION', 'min-w-[140px] hidden xl:table-cell'],
                  ['e', 'CO2e (MT)', 'w-[110px] text-right'],
                  ['m_', 'GHG METHOD', 'w-[160px] hidden 2xl:table-cell'],
                  ['cp_', 'CEMS PARAMS', 'w-[150px] hidden xl:table-cell'],
                  ['ds_', 'SOURCES', 'w-[130px]'],
                ].map(([col, label, cls]) => (
                  <th key={col}
                    onClick={() => !col.endsWith('_') && handleSort(col)}
                    className={`sticky top-0 z-10 bg-[#0f0f0f] text-term-accent font-semibold text-[10px] uppercase tracking-wider px-2 py-1.5 border-b border-term-border2 text-left whitespace-nowrap ${cls} ${!col.endsWith('_') ? 'cursor-pointer hover:text-white select-none' : ''}`}
                  >
                    {label}{!col.endsWith('_') ? arrow(col) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr
                  key={`${f.n}-${i}`}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className={`cursor-pointer transition-colors ${
                    selected === i ? 'bg-[#1a1800]' : i % 2 === 0 ? 'bg-term-bg' : 'bg-[#0c0c0c]'
                  } hover:bg-[#141410]`}
                >
                  <td className="px-2 py-1 border-b border-[#141414]">
                    <ConfidenceDots level={f.cf} />
                  </td>
                  <td className="px-2 py-1 border-b border-[#141414] text-term-bright font-medium truncate max-w-[280px]">
                    {f.n}
                  </td>
                  <td className="px-2 py-1 border-b border-[#141414] text-term-dim">
                    {f.s}
                  </td>
                  <td className="px-2 py-1 border-b border-[#141414] text-term-dim hidden xl:table-cell">
                    {[f.c, f.co].filter(Boolean).join(', ')}
                  </td>
                  <td className={`px-2 py-1 border-b border-[#141414] text-right ${
                    f.e > 1000000 ? 'text-term-accent font-bold' : f.e > 100000 ? 'text-term-text' : 'text-term-dim'
                  }`}>
                    {f.e > 0 ? fmtFull(f.e) : '—'}
                  </td>
                  <td className={`px-2 py-1 border-b border-[#141414] hidden 2xl:table-cell ${
                    f.m.includes('Tier 4') || f.m.includes('CEMS') ? 'text-term-green' :
                    f.m.includes('Mixed') ? 'text-yellow-500' :
                    f.m.includes('Calculation') ? 'text-term-red' : 'text-term-muted'
                  }`}>
                    {f.m}
                  </td>
                  <td className="px-2 py-1 border-b border-[#141414] hidden xl:table-cell">
                    {f.cp.map(p => <ParamTag key={p} param={p} />)}
                  </td>
                  <td className="px-2 py-1 border-b border-[#141414]">
                    {f.ds.map(d => <SourceTag key={d} source={d} />)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-term-muted py-12">No facilities match current filters</div>
          )}
        </div>

        {/* ─── DETAIL PANEL ─── */}
        {sel && (
          <div className="w-[360px] min-w-[360px] bg-term-surface border-l border-term-border2 p-4 overflow-y-auto hidden md:block">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-3 text-term-dim hover:text-term-text bg-transparent border-none cursor-pointer text-sm font-mono"
            >
              ✕
            </button>

            <div className="text-term-accent font-bold text-[13px] mb-1 pr-6 leading-tight">{sel.n}</div>
            <div className="text-term-dim text-[10px] mb-4">{[sel.c, sel.co].filter(Boolean).join(', ')}</div>

            {/* IDs */}
            <Section title="Identifiers">
              {sel.id && <Row label="GHGRP ID" value={sel.id} />}
              {sel.sid && <Row label="SCAQMD ID" value={sel.sid} />}
              {sel.na && sel.na !== 'nan' && sel.na !== '' && <Row label="NAICS" value={sel.na} />}
              {sel.lat && <Row label="Coordinates" value={`${sel.lat.toFixed(4)}, ${sel.lng.toFixed(4)}`} />}
            </Section>

            {/* Emissions */}
            <Section title="Emissions (Annual)">
              <div className="text-term-accent text-[18px] font-bold mb-2">
                {sel.e > 0 ? fmtFull(sel.e) + ' MT CO2e' : 'Not reported to GHGRP'}
              </div>
              {sel.ut !== null && sel.ut !== undefined && (
                <>
                  <Row label="Combustion units" value={`${sel.uc || 0} CEMS / ${sel.ut} total`} />
                  {sel.ec !== null && <Row label="CO2 via CEMS" value={`${fmtFull(sel.ec)} MT (${sel.pc}%)`} />}
                  {sel.ek !== null && sel.ek > 0 && <Row label="CO2 via calculation" value={`${fmtFull(sel.ek)} MT`} />}
                  {sel.ch4 > 0 && <Row label="CH4" value={`${fmtFull(sel.ch4)} MT CO2e`} />}
                  {sel.n2o > 0 && <Row label="N2O" value={`${fmtFull(sel.n2o)} MT CO2e`} />}
                </>
              )}
            </Section>

            {/* GHG Method */}
            <Section title="GHG Reporting Method">
              <div className={`font-semibold ${
                sel.m.includes('Tier 4') || sel.m.includes('CEMS') ? 'text-term-green' :
                sel.m.includes('Mixed') ? 'text-yellow-500' :
                sel.m.includes('Calculation') ? 'text-term-red' : 'text-term-muted'
              }`}>
                {sel.m}
              </div>
            </Section>

            {/* CEMS Params */}
            <Section title="CEMS Parameters Monitored">
              <div className="flex flex-wrap gap-1">
                {sel.cp.map(p => <ParamTag key={p} param={p} />)}
              </div>
            </Section>

            {/* Regulatory */}
            <Section title="Regulatory Programs">
              {sel.rp.map(r => (
                <div key={r} className="text-term-dim text-[11px]">• {r}</div>
              ))}
            </Section>

            {/* Confidence */}
            <Section title="Confidence Score">
              <div className="flex items-center gap-2">
                <ConfidenceDots level={sel.cf} />
                <span className="text-term-dim text-[11px]">{sel.cf}/3 — {sel.ds.join(' + ')}</span>
              </div>
            </Section>

            {/* Unit Types */}
            {sel.uty && sel.uty.length > 0 && (
              <Section title="Unit Types">
                {sel.uty.map((u, i) => (
                  <div key={i} className="text-term-dim text-[10px]">{u}</div>
                ))}
              </Section>
            )}

            {/* GHGRP Subparts */}
            {sel.sp && sel.sp !== 'nan' && sel.sp !== '' && (
              <Section title="GHGRP Subparts">
                <span className="text-term-dim">{sel.sp}</span>
              </Section>
            )}

            {/* Links */}
            <Section title="Public Records">
              {sel.id && (
                <a href={`https://ghgdata.epa.gov/ghgp/service/facilityDetail?id=${sel.id}&dataYear=2023`}
                   target="_blank" rel="noopener noreferrer"
                   className="block text-term-blue text-[11px] hover:underline mb-1">
                  → EPA FLIGHT Facility Detail
                </a>
              )}
              {sel.im && (
                <a href="https://ww2.arb.ca.gov/mrr-data" target="_blank" rel="noopener noreferrer"
                   className="block text-term-green text-[11px] hover:underline mb-1">
                  → CARB MRR Data
                </a>
              )}
              {sel.ir && (
                <a href="https://www.aqmd.gov/home/programs/business/about-reclaim/reclaim-facility-nox-emissions"
                   target="_blank" rel="noopener noreferrer"
                   className="block text-term-purple text-[11px] hover:underline mb-1">
                  → SCAQMD RECLAIM Data
                </a>
              )}
              {sel.sid && (
                <a href={`https://www.aqmd.gov/nav/find/facility-information-detail`}
                   target="_blank" rel="noopener noreferrer"
                   className="block text-term-purple text-[11px] hover:underline mb-1">
                  → SCAQMD F.I.N.D. (ID: {sel.sid})
                </a>
              )}
            </Section>
          </div>
        )}
      </div>

      {/* ═══ BOTTOM BAR ═══ */}
      <div className="flex items-center gap-4 px-3 py-1 bg-[#111] border-t border-term-border text-[10.5px] shrink-0">
        <span><span className="text-term-dim">SHOWING </span><span className="text-term-accent font-bold">{stats.count}</span><span className="text-term-dim"> OF {TOTAL_COUNT}</span></span>
        <span className="hidden sm:inline"><span className="text-term-dim">CO2e: </span><span className="text-term-accent font-bold">{fmt(stats.emissions)}</span><span className="text-term-dim"> MT</span></span>
        <span className="hidden md:inline"><span className="text-term-dim">CO2 CEMS: </span><span className="text-term-accent font-bold">{stats.withCO2}</span></span>
        <span className="hidden md:inline"><span className="text-term-dim">MULTI-SRC: </span><span className="text-term-accent font-bold">{stats.conf2}</span></span>
        <span className="ml-auto text-[#333] hidden lg:inline">
          DATA: EPA GHGRP 2023 · CARB MRR 2024 · SCAQMD RECLAIM 2025
        </span>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <div className="text-[9px] text-term-muted uppercase tracking-widest mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="mb-0.5">
      <span className="text-term-dim text-[10.5px]">{label}: </span>
      <span className="text-term-text text-[10.5px]">{value}</span>
    </div>
  );
}
