import './globals.css';

export const metadata = {
  title: 'CA CEMS FACILITY DATABASE',
  description: 'California Industrial Continuous Emissions Monitoring Facility Database — Cross-referenced from EPA GHGRP, CARB MRR, and SCAQMD RECLAIM',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="scanlines">{children}</body>
    </html>
  );
}
