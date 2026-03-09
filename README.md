# CA CEMS Facility Database

A Bloomberg terminal-style explorer for California's industrial Continuous Emissions Monitoring System (CEMS) facilities.

**226 facilities** cross-referenced across three public data layers:
- **EPA GHGRP** (2023) — Greenhouse Gas Reporting Program, unit-level methodology tiers
- **CARB MRR** (2024) — California Mandatory Reporting of GHG Emissions
- **SCAQMD RECLAIM** (2025) — Regional Clean Air Incentives Market facility NOx emissions

## Data Sources

| Source | What it tells us | Facilities matched |
|--------|-----------------|-------------------|
| EPA GHGRP | GHG emissions, reporting methodology (Tier 1-4/CEMS), subpart classification | 32 CA industrial facilities |
| CARB MRR | CA-specific GHG data, third-party verification status, Cap-and-Trade coverage | 55 facilities |
| SCAQMD RECLAIM | Confirmed NOx CEMS operators (RECLAIM requires CEMS for major sources) | 214 facilities |

Each facility gets a **confidence score** (1-3) based on how many independent sources confirm CEMS presence.

## Dataset Schema

Each facility record contains:

| Field | Description |
|-------|------------|
| `n` | Facility name |
| `s` | Industry sector |
| `e` | Total CO2e emissions (metric tons, annual) |
| `m` | GHG reporting method (Tier 4/CEMS, Mixed, Tier 1-3, Unknown) |
| `cp` | CEMS parameters monitored (NOx, SOx, CO2, CO, Opacity) |
| `rp` | Regulatory programs (GHGRP Tier 4, SCAQMD RECLAIM, CARB MRR, 40 CFR 60/63 subparts) |
| `cf` | Confidence score (1-3) |
| `ds` | Confirming data sources |
| `ut/uc/uk` | Unit counts: total, CEMS, calculation |
| `ec/ek/pc` | CO2 via CEMS / via calculation / percent via CEMS |

## License

Dataset derived from public U.S. EPA and California state government sources.
