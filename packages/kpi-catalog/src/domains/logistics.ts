import type { DomainSource } from "../types.ts";

export const logistics: DomainSource = {
  domain: "logistics",
  title: "Logistics and transport",
  industries: ["logistics"],
  sources: [
    "https://www.boxhero.io/blog/12-supply-chain-kpis/",
    "https://www.shopify.com/blog/supply-chain-kpi",
    "https://dclcorp.com/blog/supply-chain/ecommerce-supply-chain-formulas/",
  ],
  measures: `
shipments | Shipments dispatched | count | Shipments sent out in the period.
shipments_on_time | Shipments delivered on time | count | Shipments delivered by the promised time.
first_attempt_deliveries | Delivered on first attempt | count | Shipments delivered at the first visit.
shipments_damaged | Damaged shipments | count | Shipments delivered damaged.
vehicles | Fleet vehicles | count | Vehicles in the fleet.
vehicle_available_hours | Vehicle available hours | hours | Hours vehicles could have been working.
vehicle_running_hours | Vehicle running hours | hours | Hours vehicles were working.
distance_km | Distance travelled | km | Total kilometres driven.
loaded_km | Loaded distance | km | Kilometres driven with a load.
fuel_cost | Fuel cost | currency | Cost of fuel.
fuel_litres | Fuel used | litres | Litres of fuel consumed.
vehicle_maintenance_cost | Vehicle maintenance cost | currency | Servicing and repair cost for vehicles.
capacity_tonnes | Capacity available | tonnes | Load capacity on trips made.
load_tonnes | Load carried | tonnes | Weight actually carried.
drivers | Drivers | count | Drivers employed.
driver_exits | Drivers who left | count | Drivers who resigned or were let go.
trips | Trips completed | count | Trips finished.
trips_off_route | Trips off planned route | count | Trips that left the planned route.
turnaround_hours_total | Total vehicle turnaround time | hours | Sum of hours vehicles spent at loading and unloading points.
delivery_stops | Delivery stops | count | Customer stops made.
transport_cost | Transport cost | currency | Total cost of moving goods.
accidents | Vehicle accidents | count | Accidents involving fleet vehicles.
`,
  kpis: `
LOG-001 | On-time delivery rate | pct(shipments_on_time, shipments) | higher | Shipments delivered by the promised time.
LOG-002 | First-attempt delivery rate | pct(first_attempt_deliveries, shipments) | higher | Shipments delivered at the first visit.
LOG-003 | Shipment damage rate | pct(shipments_damaged, shipments) | lower | Shipments delivered damaged.
LOG-004 | Vehicle utilisation | pct(vehicle_running_hours, vehicle_available_hours) | higher | Available vehicle hours that were used.
LOG-005 | Empty running share | pct(distance_km - loaded_km, distance_km) | lower | Kilometres driven without a load.
LOG-006 | Load factor | pct(load_tonnes, capacity_tonnes) | higher | Capacity that was filled.
LOG-007 | Fuel efficiency | distance_km / fuel_litres | higher | Kilometres per litre of fuel.
LOG-008 | Fuel cost per kilometre | fuel_cost / distance_km | lower | Fuel cost for each kilometre.
LOG-009 | Transport cost per kilometre | transport_cost / distance_km | lower | Total cost for each kilometre.
LOG-010 | Cost per shipment | transport_cost / shipments | lower | Transport cost for each shipment.
LOG-011 | Cost per tonne carried | transport_cost / load_tonnes | lower | Transport cost for each tonne carried.
LOG-012 | Maintenance cost per vehicle | vehicle_maintenance_cost / vehicles | lower | Servicing and repair cost for each vehicle.
LOG-013 | Trips per vehicle | trips / vehicles | higher | Trips completed by each vehicle.
LOG-014 | Driver turnover | pct(driver_exits, drivers) | lower | Drivers who left.
LOG-015 | Accidents per million kilometres | accidents * 1000000 / distance_km | lower | Accident frequency relative to distance.
LOG-016 | Average vehicle turnaround time | turnaround_hours_total / trips | lower | Average hours a vehicle spends at each loading point.
LOG-017 | Route adherence | pct(trips - trips_off_route, trips) | higher | Trips that stayed on the planned route.
LOG-018 | Stops per running hour | delivery_stops / vehicle_running_hours | higher | Customer stops made each hour vehicles ran.
LOG-019 | Revenue per vehicle | revenue / vehicles | higher | Revenue for each vehicle in the fleet.
LOG-020 | Revenue per kilometre | revenue / distance_km | higher | Revenue for each kilometre driven.
LOG-021 | Shipments dispatched | shipments | higher | Shipments sent out in the period.
LOG-022 | Distance per vehicle | distance_km / vehicles | neutral | Kilometres driven by each vehicle.
`,
};
