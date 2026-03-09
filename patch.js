const fs = require('fs');
let code = fs.readFileSync('src/components/Terminal.js', 'utf8');
code = code.replace(
  /const allFacilities = useMemo\(\(\) => \{[\s\S]*?\}, \[uploadData\]\);/,
  `const allFacilities = useMemo(() => {
    const clean = FACILITIES.map(f => ({
      ...f,
      n: f.n.replace('CALI FORNIA', 'CALIFORNIA'),
      cf: (f.rp||[]).join().includes('Tier 4') ? 3 : (f.ds||[]).length > 1 ? 2 : 1
    })).filter(f => f.e > 0);
    return [...clean, ...uploadData.map(u => ({ ...u, ds: ['USER'], cf: 0 }))];
  }, [uploadData]);`
);
fs.writeFileSync('src/components/Terminal.js', code);
