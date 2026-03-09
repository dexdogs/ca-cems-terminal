const fs = require('fs');
let code = fs.readFileSync('src/components/Terminal.js', 'utf8');

code = code.replace(/CSV \\u2193/g, 'CSV EXPORT');
code = code.replace(/first cross-referenced/g, 'cross-referenced');
code = code.replace(/March 2025/g, '2026');

fs.writeFileSync('src/components/Terminal.js', code);
