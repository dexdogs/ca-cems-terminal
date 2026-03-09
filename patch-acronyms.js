const fs = require('fs');
let code = fs.readFileSync('src/components/Terminal.js', 'utf8');

const reps = [
  [/>CA CEMS DB</g, '>California Continuous Emissions Monitoring Systems Database<'],
  [/'CEMS Parameter'/g, "'Continuous Emissions Monitoring Systems Parameter'"],
  [/'GHG Method'/g, "'Greenhouse Gas Method'"],
  [/'CONF',/g, "'Confidence',"],
  [/'CO2e \\(MT\\)',/g, "'Carbon Dioxide Equivalent (Metric Tons)',"],
  [/'CEMS',/g, "'Continuous Emissions Monitoring Systems',"],
  [/'SRC',/g, "'Source',"],
  [/>CO2 CEMS: </g, '>CO2 Continuous Emissions Monitoring Systems: <'],
  [/>CO2e: </g, '>Carbon Dioxide Equivalent: <'],
  [/>Reality Toggle: CEMS Only</g, '>Reality Toggle: Continuous Emissions Monitoring Systems Only<'],
  [/'GHGRP ID'/g, "'Greenhouse Gas Reporting Program (GHGRP) ID'"],
  [/'SCAQMD ID'/g, "'South Coast Air Quality Management District (SCAQMD) ID'"],
  [/'CO2 via CEMS'/g, "'CO2 via Continuous Emissions Monitoring Systems'"],
  [/'CEMS Parameters'/g, "'Continuous Emissions Monitoring Systems Parameters'"],
  [/>EPA GHGRP</g, '>Environmental Protection Agency (EPA) Greenhouse Gas Reporting Program (GHGRP)<'],
  [/>SCAQMD RECLAIM</g, '>South Coast Air Quality Management District (SCAQMD) RECLAIM<'],
  [/>CARB MRR</g, '>California Air Resources Board (CARB) Mandatory Reporting Regulation (MRR)<'],
  [/Layer 1: EPA GHGRP/g, 'Layer 1: Environmental Protection Agency (EPA) Greenhouse Gas Reporting Program (GHGRP)'],
  [/Layer 2: SCAQMD RECLAIM/g, 'Layer 2: South Coast Air Quality Management District (SCAQMD) RECLAIM'],
  [/Layer 3: CARB MRR/g, 'Layer 3: California Air Resources Board (CARB) Mandatory Reporting Regulation (MRR)'],
  [/EPA GHGRP 2023 · CARB MRR 2024 · SCAQMD RECLAIM 2025/g, 'Environmental Protection Agency (EPA) GHGRP 2023 · California Air Resources Board (CARB) MRR 2024 · South Coast Air Quality Management District (SCAQMD) RECLAIM 2025']
];

reps.forEach(([reg, rep]) => { code = code.replace(reg, rep); });
fs.writeFileSync('src/components/Terminal.js', code);
