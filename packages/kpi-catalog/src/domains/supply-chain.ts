import type { DomainSource } from "../types.ts";

export const supplyChain: DomainSource = {
  domain: "supply_chain",
  title: "Supply chain and procurement",
  industries: ["*"],
  sources: [
    "https://dclcorp.com/blog/supply-chain/ecommerce-supply-chain-formulas/",
    "https://www.boxhero.io/blog/12-supply-chain-kpis/",
    "https://www.shopify.com/blog/supply-chain-kpi",
  ],
  measures: `
orders_shipped | Orders shipped | count | Customer orders shipped in the period.
orders_shipped_complete | Orders shipped complete | count | Orders shipped with every line in full.
orders_on_time_in_full | Orders on time and in full | count | Orders shipped on time and complete.
perfect_orders | Perfect orders | count | Orders on time, complete, undamaged and correctly documented.
order_lines_total | Order lines ordered | count | Lines on customer orders.
order_lines_filled | Order lines filled | count | Lines shipped in full.
stockout_skus | Products out of stock | count | Active products with no stock at period end.
skus_total | Active products | count | Products on sale at period end.
avg_inventory_value | Average inventory value | currency | Average value of stock held during the period.
inventory_carrying_cost | Inventory carrying cost | currency | Storage, insurance, handling and capital cost of stock.
forecast_abs_error | Total absolute forecast error | units | Sum of the gaps between forecast and actual demand.
forecast_actual_demand | Actual demand | units | Units customers actually demanded.
supplier_deliveries | Supplier deliveries | count | Deliveries received from suppliers.
supplier_deliveries_on_time | Supplier deliveries on time | count | Deliveries received by the promised date.
supplier_units_received | Units received from suppliers | units | Units delivered by suppliers.
supplier_defective_units | Defective units from suppliers | units | Delivered units rejected for quality.
purchase_orders | Purchase orders raised | count | Purchase orders issued to suppliers.
po_cycle_days_total | Total purchase order cycle time | days | Sum of days from requisition to order across purchase orders.
procurement_spend | Procurement spend | currency | Total spend with suppliers.
spend_under_contract | Spend under contract | currency | Spend covered by a negotiated contract.
procurement_savings | Procurement savings | currency | Savings against the previous price or budget.
freight_cost | Freight cost | currency | Cost of moving goods.
units_shipped | Units shipped | units | Units sent to customers.
orders_damaged | Damaged orders | count | Orders that arrived damaged.
orders_returned | Orders returned | count | Orders sent back by customers.
receipts | Goods receipts | count | Deliveries put into stock.
dock_to_stock_hours_total | Total dock-to-stock time | hours | Sum of hours from arrival to available stock.
warehouse_capacity_pallets | Warehouse pallet capacity | count | Pallet positions available.
warehouse_pallets_used | Pallet positions used | count | Pallet positions occupied.
picks_total | Picks made | count | Items picked from shelves.
picks_correct | Picks made correctly | count | Items picked correctly.
lines_picked | Order lines picked | count | Order lines picked by warehouse staff.
warehouse_labor_hours | Warehouse labor hours | hours | Hours worked by warehouse staff.
`,
  kpis: `
SCM-001 | On-time in-full rate | pct(orders_on_time_in_full, orders_shipped) | higher | Orders shipped on time and complete.
SCM-002 | Perfect order rate | pct(perfect_orders, orders_shipped) | higher | Orders with no error of any kind.
SCM-003 | Order fill rate | pct(orders_shipped_complete, orders_shipped) | higher | Orders shipped complete.
SCM-004 | Line fill rate | pct(order_lines_filled, order_lines_total) | higher | Order lines shipped in full.
SCM-005 | Inventory turnover | cogs / avg_inventory_value | higher | Times the stock is sold and replaced in the period.
SCM-006 | Days of inventory | avg_inventory_value / cogs * period_days | lower | Days of sales the stock covers.
SCM-007 | Stockout rate | pct(stockout_skus, skus_total) | lower | Products with no stock.
SCM-008 | Inventory carrying cost rate | pct(inventory_carrying_cost, avg_inventory_value) | lower | Cost of holding stock as a share of its value.
SCM-009 | Forecast accuracy | pct(forecast_actual_demand - forecast_abs_error, forecast_actual_demand) | higher | How close forecasts came to actual demand.
SCM-010 | Forecast error | pct(forecast_abs_error, forecast_actual_demand) | lower | Gap between forecast and actual demand.
SCM-011 | Supplier on-time delivery rate | pct(supplier_deliveries_on_time, supplier_deliveries) | higher | Supplier deliveries that arrived on time.
SCM-012 | Supplier defect rate | pct(supplier_defective_units, supplier_units_received) | lower | Delivered units rejected for quality.
SCM-013 | Purchase order cycle time | po_cycle_days_total / purchase_orders | lower | Average days from requisition to order.
SCM-014 | Spend under contract | pct(spend_under_contract, procurement_spend) | higher | Spend covered by a negotiated contract.
SCM-015 | Procurement savings rate | pct(procurement_savings, procurement_spend) | higher | Savings as a share of spend.
SCM-016 | Procurement spend | procurement_spend | neutral | Total spend with suppliers.
SCM-017 | Freight cost per unit | freight_cost / units_shipped | lower | Freight cost for each unit shipped.
SCM-018 | Freight cost ratio | pct(freight_cost, revenue) | lower | Freight cost as a share of revenue.
SCM-019 | Order damage rate | pct(orders_damaged, orders_shipped) | lower | Orders that arrived damaged.
SCM-020 | Order return rate | pct(orders_returned, orders_shipped) | lower | Orders sent back by customers.
SCM-021 | Dock-to-stock time | dock_to_stock_hours_total / receipts | lower | Average hours from arrival to available stock.
SCM-022 | Warehouse space utilisation | pct(warehouse_pallets_used, warehouse_capacity_pallets) | neutral | Pallet positions in use.
SCM-023 | Pick accuracy | pct(picks_correct, picks_total) | higher | Items picked correctly.
SCM-024 | Lines picked per labor hour | lines_picked / warehouse_labor_hours | higher | Warehouse picking productivity.
SCM-025 | Average inventory value | avg_inventory_value | neutral | Average value of stock held.
SCM-026 | Orders shipped | orders_shipped | higher | Customer orders shipped.
SCM-027 | Purchase orders raised | purchase_orders | neutral | Purchase orders issued to suppliers.
SCM-028 | Freight cost | freight_cost | lower | Cost of moving goods.
`,
};
