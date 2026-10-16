import type { DomainSource } from "../types.ts";

export const realEstate: DomainSource = {
  domain: "real_estate",
  title: "Real estate and construction",
  industries: ["real_estate", "construction"],
  sources: [
    "https://blog.falcony.io/en/10-most-common-kpis-in-commercial-real-estate",
    "https://utopiamanagement.com/2021/03/8-essential-real-estate-kpis-for-property-investment",
    "https://www.fathomhq.com/blog/10-essential-kpis-every-real-estate-finance-leader-should-know",
    "https://showdigs.com/property-managers/property-management-key-performance-indicators",
  ],
  measures: `
leasable_area_sqft | Leasable area | sqft | Area available to let.
occupied_area_sqft | Occupied area | sqft | Area currently let.
rental_income | Rental income | currency | Rent earned in the period.
other_property_income | Other property income | currency | Parking, fees and other income from the property.
property_operating_expenses | Property operating expenses | currency | Running cost of the property, excluding debt service and capital works.
property_value | Property value | currency | Current market value of the property.
rent_due | Rent due | currency | Rent invoiced for the period.
rent_collected | Rent collected | currency | Rent actually received.
leases_expiring | Leases expiring | count | Leases reaching their end.
leases_renewed | Leases renewed | count | Expiring leases that were renewed.
tenants_total | Tenants | count | Tenants at period end.
tenants_moved_out | Tenants moved out | count | Tenants who left in the period.
maintenance_requests | Maintenance requests | count | Repair requests from tenants.
maintenance_requests_on_time | Maintenance requests closed on time | count | Requests closed inside the target time.
units_for_sale | Units available for sale | count | Units on the market.
units_sold_property | Units sold | count | Units sold in the period.
site_visits | Site visits | count | Prospective buyers who visited.
planned_value | Planned value | currency | Budgeted cost of work scheduled to date.
earned_value | Earned value | currency | Budgeted cost of work actually completed to date.
actual_cost | Actual cost | currency | Cost actually incurred to date.
rework_cost | Rework cost | currency | Cost of redoing work.
change_order_value | Change order value | currency | Value of approved changes to the contract.
contract_value | Contract value | currency | Original contract value.
`,
  kpis: `
RES-001 | Occupancy rate | pct(occupied_area_sqft, leasable_area_sqft) | higher | Leasable area that is let.
RES-002 | Vacancy rate | pct(leasable_area_sqft - occupied_area_sqft, leasable_area_sqft) | lower | Leasable area that is empty.
RES-003 | Net operating income | rental_income + other_property_income - property_operating_expenses | higher | Property income less operating costs.
RES-004 | Net operating income margin | pct(rental_income + other_property_income - property_operating_expenses, rental_income + other_property_income) | higher | Share of property income left after operating costs.
RES-005 | Net operating income yield | pct(rental_income + other_property_income - property_operating_expenses, property_value) | higher | Net operating income for the period relative to property value.
RES-006 | Operating expense ratio | pct(property_operating_expenses, rental_income + other_property_income) | lower | Operating cost as a share of property income.
RES-007 | Rent collection rate | pct(rent_collected, rent_due) | higher | Rent invoiced that was received.
RES-008 | Lease renewal rate | pct(leases_renewed, leases_expiring) | higher | Expiring leases that were renewed.
RES-009 | Tenant turnover rate | pct(tenants_moved_out, tenants_total) | lower | Tenants who left.
RES-010 | Rent per occupied square foot | rental_income / occupied_area_sqft | higher | Rent earned for each occupied square foot.
RES-011 | Maintenance on-time closure | pct(maintenance_requests_on_time, maintenance_requests) | higher | Requests closed inside the target time.
RES-012 | Sales absorption rate | pct(units_sold_property, units_for_sale) | higher | Units on the market that were sold.
RES-013 | Site visit conversion | pct(units_sold_property, site_visits) | higher | Site visits that ended in a sale.
RES-014 | Cost variance | earned_value - actual_cost | higher | Earned value less actual cost; negative is over budget.
RES-015 | Schedule variance | earned_value - planned_value | higher | Earned value less planned value; negative is behind schedule.
RES-016 | Cost performance index | earned_value / actual_cost | higher | Value earned for each unit spent; below 1 is over budget.
RES-017 | Schedule performance index | earned_value / planned_value | higher | Work done compared with plan; below 1 is behind schedule.
RES-018 | Rework cost ratio | pct(rework_cost, actual_cost) | lower | Cost of redoing work as a share of total cost.
RES-019 | Change order ratio | pct(change_order_value, contract_value) | lower | Change orders as a share of the original contract.
RES-020 | Percent complete by value | pct(earned_value, contract_value) | higher | Contract value earned to date.
RES-021 | Rental income | rental_income | higher | Rent earned in the period.
`,
};
