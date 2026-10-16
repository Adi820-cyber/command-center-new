import type { DomainSource } from "../types.ts";

export const marketing: DomainSource = {
  domain: "marketing",
  title: "Marketing",
  industries: ["*"],
  sources: [
    "https://amasty.com/blog/ecommerce-kpis/",
    "https://razorpay.com/learn/19-must-know-e-commerce-metrics/",
    "https://www.promodo.com/blog/kpis-in-ecommerce",
  ],
  measures: `
marketing_spend | Marketing spend | currency | Total marketing spend in the period.
sales_and_marketing_spend | Sales and marketing spend | currency | Sales and marketing cost, used to work out acquisition cost.
advertising_spend | Advertising spend | currency | Paid advertising spend.
ad_revenue | Revenue from advertising | currency | Revenue attributed to paid advertising.
impressions | Ad impressions | count | Times ads were shown.
clicks | Ad clicks | count | Clicks on ads.
website_sessions | Website sessions | count | Visits to the website.
website_visitors | Unique website visitors | count | Distinct people who visited.
new_visitors | New website visitors | count | Visitors seen for the first time.
bounced_sessions | Bounced sessions | count | Visits that left after one page.
organic_sessions | Organic search sessions | count | Visits from unpaid search results.
mql | Marketing-qualified leads | count | Leads marketing judged ready for sales.
sql_leads | Sales-qualified leads | count | Leads sales accepted as worth pursuing.
new_customers | New customers acquired | count | Customers won in the period.
emails_delivered | Emails delivered | count | Emails that reached an inbox.
emails_opened | Emails opened | count | Emails that were opened.
email_clicks | Email clicks | count | Clicks on links in emails.
email_unsubscribes | Email unsubscribes | count | People who unsubscribed.
social_engagements | Social media engagements | count | Likes, comments, shares and clicks.
social_reach | Social media reach | count | People who saw social posts.
followers | Social media followers | count | Followers at period end.
event_spend | Event spend | currency | Cost of events and trade shows.
event_leads | Event leads | count | Leads captured at events.
content_pieces | Content pieces published | count | Articles, videos and guides published.
content_leads | Leads from content | count | Leads that came from published content.
webinar_registrations | Webinar registrations | count | People who registered for webinars.
webinar_attendees | Webinar attendees | count | People who attended webinars.
carts_created | Carts created | count | Online shopping carts started.
web_orders | Web orders | count | Orders completed online.
repeat_customers | Repeat customers | count | Customers who bought more than once.
`,
  kpis: `
MKT-001 | Customer acquisition cost | sales_and_marketing_spend / new_customers | lower | Sales and marketing cost to win each new customer.
MKT-002 | Marketing spend ratio | pct(marketing_spend, revenue) | lower | Marketing spend as a share of revenue.
MKT-003 | Return on ad spend | ad_revenue / advertising_spend | higher | Revenue earned for each unit spent on advertising.
MKT-004 | Advertising return on investment | pct(ad_revenue - advertising_spend, advertising_spend) | higher | Profit from advertising as a share of its cost.
MKT-005 | Cost per click | advertising_spend / clicks | lower | Advertising cost of each click.
MKT-006 | Click-through rate | pct(clicks, impressions) | higher | Share of ad impressions that were clicked.
MKT-007 | Cost per thousand impressions | advertising_spend / impressions * 1000 | lower | Advertising cost for every thousand ad views.
MKT-008 | Cost per lead | marketing_spend / leads_generated | lower | Marketing cost of each lead.
MKT-009 | Website conversion rate | pct(leads_generated, website_sessions) | higher | Website visits that produced a lead.
MKT-010 | Bounce rate | pct(bounced_sessions, website_sessions) | lower | Visits that left after one page.
MKT-011 | New visitor share | pct(new_visitors, website_visitors) | neutral | Visitors who were new to the site.
MKT-012 | Lead to marketing-qualified rate | pct(mql, leads_generated) | higher | Leads judged ready for sales.
MKT-013 | Marketing to sales-qualified rate | pct(sql_leads, mql) | higher | Marketing-qualified leads that sales accepted.
MKT-014 | Email open rate | pct(emails_opened, emails_delivered) | higher | Delivered emails that were opened.
MKT-015 | Email click rate | pct(email_clicks, emails_delivered) | higher | Delivered emails with a click.
MKT-016 | Email click-to-open rate | pct(email_clicks, emails_opened) | higher | Opened emails with a click.
MKT-017 | Email unsubscribe rate | pct(email_unsubscribes, emails_delivered) | lower | Delivered emails that led to an unsubscribe.
MKT-018 | Social engagement rate | pct(social_engagements, social_reach) | higher | Social reach that engaged with posts.
MKT-019 | Follower growth vs previous period | pct(followers - followers@prev, followers@prev) | higher | Change in followers against the previous period.
MKT-020 | Organic traffic share | pct(organic_sessions, website_sessions) | higher | Visits from unpaid search.
MKT-021 | Event cost per lead | event_spend / event_leads | lower | Event cost for each lead captured.
MKT-022 | Leads per content piece | content_leads / content_pieces | higher | Leads from each piece of content published.
MKT-023 | Webinar attendance rate | pct(webinar_attendees, webinar_registrations) | higher | Registrants who attended.
MKT-024 | Cart abandonment rate | pct(carts_created - web_orders, carts_created) | lower | Carts started but not completed.
MKT-025 | E-commerce conversion rate | pct(web_orders, website_sessions) | higher | Website visits that ended in an order.
MKT-026 | Repeat purchase rate | pct(repeat_customers, customers_active) | higher | Customers who bought more than once.
MKT-027 | Paid cost per new customer | advertising_spend / new_customers | lower | Advertising cost for each new customer.
MKT-028 | Website sessions | website_sessions | higher | Visits to the website.
MKT-029 | Leads generated | leads_generated | higher | New leads captured.
MKT-030 | New customers acquired | new_customers | higher | Customers won in the period.
MKT-031 | Website session growth vs previous period | pct(website_sessions - website_sessions@prev, website_sessions@prev) | higher | Change in visits against the previous period.
MKT-032 | Lead growth vs previous period | pct(leads_generated - leads_generated@prev, leads_generated@prev) | higher | Change in leads against the previous period.
MKT-033 | Advertising share of marketing spend | pct(advertising_spend, marketing_spend) | neutral | Share of marketing spend that went to ads.
`,
};
