import type { DomainSource } from "../types.ts";

export const hospitality: DomainSource = {
  domain: "hospitality",
  title: "Hotels and hospitality",
  industries: ["hospitality"],
  sources: [
    "https://www.hotel-online.com/news/the-top-10-key-hotel-kpi-formulas",
    "https://blog.hotelogix.com/measure-hotels-performance-with-revpar-formula/",
    "https://pricepoint.co/blog/revpar-and-beyond-essential-formulas-for-hoteliers",
  ],
  measures: `
rooms_available | Room-nights available | count | Rooms available to sell multiplied by nights in the period.
rooms_sold | Room-nights sold | count | Room-nights occupied by paying guests.
room_revenue | Room revenue | currency | Revenue from room sales.
total_hotel_revenue | Total hotel revenue | currency | Rooms, food, beverage, spa and other revenue.
gross_operating_profit | Gross operating profit | currency | Revenue less operating expenses, before fixed charges.
fb_revenue | Food and beverage revenue | currency | Revenue from restaurants, bars and banquets.
food_cost | Food and beverage cost | currency | Cost of food and beverage sold.
guest_survey_responses | Guest survey responses | count | Guests who answered the satisfaction survey.
guest_survey_satisfied | Satisfied guests | count | Survey responses that were satisfied.
bookings_made | Reservations made | count | Bookings received.
bookings_cancelled | Reservations cancelled | count | Bookings cancelled before arrival.
no_shows | No-shows | count | Guests who booked and did not arrive.
direct_bookings | Direct bookings | count | Bookings made without an agent or online travel site.
ota_commission | Online travel agent commission | currency | Commission paid to booking platforms.
guests_checked_in | Guests checked in | count | Guests who arrived in the period.
repeat_guests | Repeat guests | count | Arriving guests who have stayed before.
housekeeping_minutes_total | Total housekeeping time | minutes | Minutes spent cleaning rooms.
rooms_cleaned | Rooms cleaned | count | Rooms cleaned.
`,
  kpis: `
HOS-001 | Occupancy rate | pct(rooms_sold, rooms_available) | higher | Room-nights sold compared with room-nights available.
HOS-002 | Average daily rate | room_revenue / rooms_sold | higher | Average room revenue for each room-night sold.
HOS-003 | Revenue per available room | room_revenue / rooms_available | higher | Room revenue for each room-night available.
HOS-004 | Gross operating profit per available room | gross_operating_profit / rooms_available | higher | Gross operating profit for each room-night available.
HOS-005 | Total revenue per available room | total_hotel_revenue / rooms_available | higher | All revenue for each room-night available.
HOS-006 | Gross operating profit margin | pct(gross_operating_profit, total_hotel_revenue) | higher | Gross operating profit as a share of revenue.
HOS-007 | Room revenue share | pct(room_revenue, total_hotel_revenue) | neutral | Revenue that came from rooms.
HOS-008 | Food and beverage revenue per room sold | fb_revenue / rooms_sold | higher | Food and beverage revenue for each room-night sold.
HOS-009 | Food and beverage cost ratio | pct(food_cost, fb_revenue) | lower | Food and beverage cost as a share of its revenue.
HOS-010 | Labor cost ratio | pct(payroll_cost, total_hotel_revenue) | lower | Payroll as a share of hotel revenue.
HOS-011 | Guest satisfaction | pct(guest_survey_satisfied, guest_survey_responses) | higher | Survey responses that were satisfied.
HOS-012 | Cancellation rate | pct(bookings_cancelled, bookings_made) | lower | Bookings cancelled before arrival.
HOS-013 | No-show rate | pct(no_shows, bookings_made) | lower | Bookings where the guest did not arrive.
HOS-014 | Direct booking share | pct(direct_bookings, bookings_made) | higher | Bookings made without an intermediary.
HOS-015 | Online travel agent commission ratio | pct(ota_commission, room_revenue) | lower | Booking-platform commission as a share of room revenue.
HOS-016 | Repeat guest rate | pct(repeat_guests, guests_checked_in) | higher | Arriving guests who have stayed before.
HOS-017 | Housekeeping minutes per room | housekeeping_minutes_total / rooms_cleaned | lower | Average minutes to clean a room.
HOS-018 | Revenue per guest | total_hotel_revenue / guests_checked_in | higher | Total revenue for each guest.
HOS-019 | Room-nights sold | rooms_sold | higher | Room-nights occupied by paying guests.
HOS-020 | Room revenue | room_revenue | higher | Revenue from room sales.
HOS-021 | Revenue per available room growth | pct(room_revenue / rooms_available - room_revenue@prev / rooms_available@prev, room_revenue@prev / rooms_available@prev) | higher | Change in revenue per available room against the previous period.
HOS-022 | Guests checked in | guests_checked_in | higher | Guests who arrived in the period.
`,
};
