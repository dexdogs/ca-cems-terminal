const fs = require('fs');
let code = fs.readFileSync('src/components/Terminal.js', 'utf8');

code = code.replace(/\}\)\)\.filter\(f => f\.e > 0\);/g, '}));');
code = code.replace(/import \{ Treemap, ResponsiveContainer \} from 'recharts';/, "import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';");
code = code.replace(/const treeData = useMemo[\s\S]*?const stats = useMemo/, `const treeData = useMemo(() => Object.values(filtered.reduce((acc, f) => {
    if (!acc[f.s]) acc[f.s] = { name: f.s, children: [] };
    acc[f.s].children.push({ name: f.n, size: Math.max(f.e, 5000), actual: f.e, cf: f.cf });
    return acc;
  }, {})), [filtered]);

  const CustomNode = ({ x, y, width, height, name, cf, depth }) => (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={depth===1 ? '#111' : cf===3 ? '#22c55e' : cf===2 ? '#ff8c00' : '#444'} stroke="#000" />
      {width > 40 && height > 20 && depth === 2 && <text x={x+4} y={y+14} fill="#fff" fontSize={9}>{name.substring(0,12)}</text>}
    </g>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      if (d.depth === 1) return <div className="bg-[#000] border border-[#ff8c00] p-1 text-[11px] text-[#ff8c00]">{d.name}</div>;
      return (
        <div className="bg-[#000] border border-[#333] p-2 text-[10px] z-50">
          <div className="text-[#ff8c00] font-bold">{d.name}</div>
          <div className="text-[#ccc]">{d.actual > 0 ? Number(d.actual).toLocaleString() + ' MT' : 'Not Reported'}</div>
        </div>
      );
    }
    return null;
  };
  const stats = useMemo`);

code = code.replace(/<ResponsiveContainer[\s\S]*?<\/ResponsiveContainer>/, `<ResponsiveContainer width="100%" height="90%">
      <Treemap data={treeData} dataKey="size" content={<CustomNode />} onClick={(e) => {
          if (e && e.name && e.depth === 2) {
            const idx = filtered.findIndex(f => f.n === e.name);
            if (idx !== -1) { setSelected(idx); setActiveTab('data'); }
          }
        }}>
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>`);

fs.writeFileSync('src/components/Terminal.js', code);
