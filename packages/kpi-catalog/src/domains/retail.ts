import type { DomainSource } from "../types.ts";

export const retail: DomainSource = {
  domain: "retail",
  title: "Retail and e-commerce",
  industries: ["retail", "ecommerce"],
  sources: [
    "https://archerpoint.com/the-top-eight-kpis-retailers-should-be-tracking-with-formulas/",
    "https://qoblex.com/blog/essential-retail-kpis-complete-guide-to-measuring-store-performance-in-2025/",
    "https://tgg-accounting.com/wp-content/uploads/2021/12/TGG_Retail-KPIs.pdf",
  ],
  measures: `
footfall | Store visitors | count | People who entered the stores.
transactions | Sales transactions | count | Completed sales at the till or online.
units_sold | Units sold | units | Items sold.
units_received | Units received | units | Items received into stock.
beginning_inventory_units | Opening stock units | units | Items in stock at the start of the period.
inventory_units_end | Closing stock units | units | Items in stock at the end of the period.
units_returned | Units returned | units | Items customers brought back.
store_area_sqft | Selling area | sqft | Selling floor space.
store_employees | Store employees | count | Full-time-equivalent store staff.
markdown_value | Markdown value | currency | Value taken off prices to clear stock.
shrinkage_value | Stock loss | currency | Value lost to theft, damage and errors.
loyalty_sales | Sales to loyalty members | currency | Revenue from loyalty programme members.
online_sales | Online sales | currency | Revenue from the online channel.
revenue_comparable | Revenue from comparable stores | currency | Revenue from stores open in both periods.
`,
  kpis: `
RTL-001 | Sell-through rate | pct(units_sold, units_received) | higher | Units sold compared with units received.
RTL-002 | Sell-through on opening and received stock | pct(units_sold, beginning_inventory_units + units_received) | higher | Units sold compared with all stock available to sell.
RTL-003 | Average transaction value | revenue / transactions | higher | Average revenue per sale.
RTL-004 | Units per transaction | units_sold / transactions | higher | Average items in each sale.
RTL-005 | Footfall conversion rate | pct(transactions, footfall) | higher | Visitors who bought something.
RTL-006 | Store visitors | footfall | higher | People who entered the stores.
RTL-007 | Sales transactions | transactions | higher | Completed sales.
RTL-008 | Revenue per visitor | revenue / footfall | higher | Revenue for each visitor.
RTL-009 | Sales per square foot | revenue / store_area_sqft | higher | Revenue for each square foot of selling space.
RTL-010 | Gross margin per square foot | (revenue - cogs) / store_area_sqft | higher | Gross profit for each square foot of selling space.
RTL-011 | Sales per employee | revenue / store_employees | higher | Revenue for each store employee.
RTL-012 | Gross margin return on inventory | (revenue - cogs) / avg_inventory_value | higher | Gross profit earned for each unit of stock held.
RTL-013 | Gross margin per transaction | (revenue - cogs) / transactions | higher | Gross profit on each sale.
RTL-014 | Shrinkage rate | pct(shrinkage_value, revenue) | lower | Stock loss as a share of revenue.
RTL-015 | Markdown rate | pct(markdown_value, revenue + markdown_value) | lower | Share of potential sales given up in markdowns.
RTL-016 | Return rate | pct(units_returned, units_sold) | lower | Items brought back by customers.
RTL-017 | Like-for-like sales growth | pct(revenue_comparable - revenue_comparable@yoy, revenue_comparable@yoy) | higher | Sales growth in stores open in both years.
RTL-018 | Loyalty sales share | pct(loyalty_sales, revenue) | higher | Revenue from loyalty members.
RTL-019 | Online sales share | pct(online_sales, revenue) | neutral | Revenue from the online channel.
RTL-020 | Stock cover in days | inventory_units_end / units_sold * period_days | neutral | Days the closing stock would last at the current sales pace.
RTL-021 | Average selling price | revenue / units_sold | neutral | Average revenue per unit sold.
RTL-022 | Visitor growth vs previous period | pct(footfall - footfall@prev, footfall@prev) | higher | Change in store visitors against the previous period.
RTL-023 | Online sales growth vs previous period | pct(online_sales - online_sales@prev, online_sales@prev) | higher | Change in online sales against the previous period.
`,
};
