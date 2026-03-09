const fs = require('fs');
let code = fs.readFileSync('src/components/Terminal.js', 'utf8');

code = code.replace(
  "import { useState, useMemo, useRef } from 'react';",
  "import { useState, useMemo, useRef } from 'react';\nimport { Treemap, ResponsiveContainer } from 'recharts';"
);

code = code.replace(
  "[['data','DATA'],['upload','\\u2191 UPLOAD'],['info','INFO']]",
  "[['data','DATA'],['viz','TREEMAP'],['upload','\\u2191 UPLOAD'],['info','INFO']]"
);

code = code.replace(
  "const stats = useMemo",
  `const treeData = useMemo(() => Object.values(filtered.reduce((acc, f) => {
    if (!acc[f.s]) acc[f.s] = { name: f.s, children: [] };
    acc[f.s].children.push({ name: f.n, size: f.e, cf: f.cf });
    return acc;
  }, {})), [filtered]);
  
  const CustomNode = ({ x, y, width, height, name, cf, depth }) => (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={depth===1 ? '#111' : cf===3 ? '#22c55e' : cf===2 ? '#ff8c00' : '#444'} stroke="#000" />
      {width > 40 && height > 20 && depth === 2 && <text x={x+4} y={y+14} fill="#fff" fontSize={9}>{name.substring(0,12)}</text>}
    </g>
  );
  const stats = useMemo`
);

code = code.replace(
  "{/* UPLOAD TAB */}",
  `{/* VIZ TAB */}\n{activeTab === 'viz' && (
    <div className="flex-1 p-4"><h2 className="text-[#ff8c00] text-[12px] uppercase mb-2">Emissions Treemap (Green=CEMS, Orange=Tier 1-3)</h2>
    <ResponsiveContainer width="100%" height="90%"><Treemap data={treeData} dataKey="size" content={<CustomNode />} /></ResponsiveContainer></div>
  )}\n{/* UPLOAD TAB */}`
);

fs.writeFileSync('src/components/Terminal.js', code);
