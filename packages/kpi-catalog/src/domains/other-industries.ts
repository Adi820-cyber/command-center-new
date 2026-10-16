import type { DomainSource } from "../types.ts";

export const telecom: DomainSource = {
  domain: "telecom",
  title: "Telecom and internet providers",
  industries: ["telecom"],
  sources: ["https://www.klipfolio.com/kpis/telecom", "https://www.forentrepreneurs.com/pt-br/saas-metrics-2-definitions"],
  measures: `
subscribers_start | Subscribers at start | count | Active subscribers at the start of the period.
subscribers_end | Subscribers at end | count | Active subscribers at the end of the period.
subscribers_new | Gross subscriber additions | count | New subscribers connected.
subscribers_disconnected | Subscribers disconnected | count | Subscribers who left.
calls_attempted | Call attempts | count | Calls attempted on the network.
calls_dropped | Dropped calls | count | Calls cut off before the user ended them.
`,
  kpis: `
TEL-001 | Average revenue per user | revenue / ((subscribers_start + subscribers_end) / 2) | higher | Revenue for each average subscriber.
TEL-002 | Subscriber churn rate | pct(subscribers_disconnected, subscribers_start) | lower | Subscribers who left.
TEL-003 | Net subscriber additions | subscribers_new - subscribers_disconnected | higher | New subscribers less those who left.
TEL-004 | Gross subscriber additions | subscribers_new | higher | New subscribers connected.
TEL-005 | Dropped call rate | pct(calls_dropped, calls_attempted) | lower | Calls cut off before the user ended them.
TEL-006 | Cost per gross addition | sales_and_marketing_spend / subscribers_new | lower | Sales and marketing cost for each new subscriber.
TEL-007 | Subscriber growth | pct(subscribers_end - subscribers_start, subscribers_start) | higher | Change in subscribers over the period.
`,
};

export const nonprofit: DomainSource = {
  domain: "nonprofit",
  title: "Non-profit organisations",
  industries: ["nonprofit"],
  sources: ["https://www.clearpointstrategy.com/blog/keyperformance-indicators-in-education"],
  measures: `
donations_received | Donations received | currency | Donations and grants received.
donor_count | Donors | count | Distinct donors in the period.
donors_prior | Donors in the previous period | count | Donors who gave in the previous period.
donors_retained | Donors retained | count | Previous donors who gave again.
program_expenses | Program expenses | currency | Spending on the mission.
fundraising_expenses | Fundraising expenses | currency | Spending on raising funds.
admin_expenses | Administrative expenses | currency | Management and general costs.
beneficiaries_served | Beneficiaries served | count | People who received help.
volunteers | Volunteers | count | Active volunteers.
volunteer_hours | Volunteer hours | hours | Hours given by volunteers.
`,
  kpis: `
NGO-001 | Program expense ratio | pct(program_expenses, program_expenses + fundraising_expenses + admin_expenses) | higher | Spending that went to the mission.
NGO-002 | Fundraising efficiency | donations_received / fundraising_expenses | higher | Donations raised for each unit spent on fundraising.
NGO-003 | Donor retention rate | pct(donors_retained, donors_prior) | higher | Previous donors who gave again.
NGO-004 | Cost per beneficiary | program_expenses / beneficiaries_served | lower | Program spending for each person helped.
NGO-005 | Average donation | donations_received / donor_count | higher | Average amount given by each donor.
NGO-006 | Administrative cost ratio | pct(admin_expenses, program_expenses + fundraising_expenses + admin_expenses) | lower | Spending on management and general costs.
NGO-007 | Volunteer hours per volunteer | volunteer_hours / volunteers | higher | Average hours given by each volunteer.
NGO-008 | Beneficiaries served | beneficiaries_served | higher | People who received help.
NGO-009 | Donation growth vs previous period | pct(donations_received - donations_received@prev, donations_received@prev) | higher | Change in donations against the previous period.
`,
};

export const energy: DomainSource = {
  domain: "energy",
  title: "Energy and utilities",
  industries: ["energy"],
  sources: ["https://www.cleverence.com/articles/for-business/productivity-metrics-manufacturing-4827/"],
  measures: `
units_generated_kwh | Energy generated | kwh | Electricity generated.
capacity_kwh_available | Generation capacity available | kwh | Electricity the plant could have generated.
units_input_kwh | Energy input to network | kwh | Electricity put into the distribution network.
units_billed_kwh | Energy billed | kwh | Electricity billed to customers.
billed_amount | Amount billed | currency | Value of bills raised.
collected_amount | Amount collected | currency | Value of bills paid.
outage_minutes_total | Customer outage minutes | minutes | Sum of minutes each customer was without supply.
customers_served | Customers served | count | Customers connected to the network.
supply_interruptions | Customer interruptions | count | Customer supply interruptions.
`,
  kpis: `
ENR-001 | Plant load factor | pct(units_generated_kwh, capacity_kwh_available) | higher | Generation compared with capacity.
ENR-002 | Distribution loss | pct(units_input_kwh - units_billed_kwh, units_input_kwh) | lower | Electricity put into the network that was not billed.
ENR-003 | Billing efficiency | pct(units_billed_kwh, units_input_kwh) | higher | Electricity put into the network that was billed.
ENR-004 | Collection efficiency | pct(collected_amount, billed_amount) | higher | Bills that were paid.
ENR-005 | Average interruption duration per customer | outage_minutes_total / customers_served | lower | Average minutes each customer was without supply.
ENR-006 | Average interruptions per customer | supply_interruptions / customers_served | lower | Average supply interruptions for each customer.
ENR-007 | Generation cost per kilowatt-hour | cogs / units_generated_kwh | lower | Direct cost of each kilowatt-hour generated.
`,
};

export const agriculture: DomainSource = {
  domain: "agriculture",
  title: "Agriculture",
  industries: ["agriculture"],
  sources: ["https://www.cleverence.com/articles/for-business/productivity-metrics-manufacturing-4827/"],
  measures: `
area_cultivated_acres | Area cultivated | acres | Land under cultivation.
harvest_kg | Harvest | kg | Crop harvested.
crop_loss_kg | Post-harvest loss | kg | Harvested crop lost to spoilage or damage.
`,
  kpis: `
AGR-001 | Yield per acre | harvest_kg / area_cultivated_acres | higher | Crop harvested from each acre.
AGR-002 | Post-harvest loss rate | pct(crop_loss_kg, harvest_kg) | lower | Harvested crop lost to spoilage or damage.
AGR-003 | Cost per acre | cogs / area_cultivated_acres | lower | Direct cost of cultivating each acre.
AGR-004 | Revenue per acre | revenue / area_cultivated_acres | higher | Revenue earned from each acre.
AGR-005 | Revenue per kilogram harvested | revenue / harvest_kg | higher | Revenue earned for each kilogram of crop.
`,
};
