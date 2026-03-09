const fs = require('fs');
let code = fs.readFileSync('src/components/Terminal.js', 'utf8');

code = code.replace(
  "const [search, setSearch] = useState('');",
  "const [search, setSearch] = useState('');\n  const [cemsOnly, setCemsOnly] = useState(false);"
);

code = code.replace(
  "if (minConf > 1) d = d.filter(f => f.cf >= minConf);",
  "if (minConf > 1) d = d.filter(f => f.cf >= minConf);\n    if (cemsOnly) d = d.filter(f => f.m.includes('CEMS') || f.m.includes('Tier 4'));"
);

code = code.replace(
  "search, sortCol, sortDir]);",
  "search, sortCol, sortDir, cemsOnly]);"
);

code = code.replace(
  "<FilterSelect label=\"Min Confidence\"",
  `<label className="flex items-center gap-2 mb-4 p-2 bg-[#1a1800] border border-[#ff8c00]/30 cursor-pointer hover:bg-[#2a2800] transition-colors">
        <input type="checkbox" checked={cemsOnly} onChange={e => setCemsOnly(e.target.checked)} className="accent-[#ff8c00]" />
        <span className="text-[10px] text-[#ff8c00] font-bold uppercase tracking-wider">Reality Toggle: CEMS Only</span>
      </label>
      <FilterSelect label="Min Confidence"`
);

fs.writeFileSync('src/components/Terminal.js', code);
