# KPI catalog, templates and formulas

The catalog is the set of ready-made KPIs every organization can start from. It lives in `packages/kpi-catalog` as readable text, is checked by tests, and is loaded into the database by a generated SQL file.

## What is in it

- **623 KPIs** in 32 domains: finance, sales, marketing, customers and support, HR, operations, supply chain, IT and engineering, quality and safety, and industry sets for hospitals, diagnostic labs, retail and e-commerce, manufacturing, software, professional services, banking, insurance, hotels, education, logistics, real estate and construction, telecom, non-profit, energy and agriculture, plus seven for digital marketing agencies (revenue and profitability, clients and retention, growth, delivery, quality, operations, and clients' social results).
- **554 measures**: the inputs the KPIs use. One measure is shared by every KPI that needs it, so a CSV never asks for the same figure twice.
- **21 templates.** Twenty have 9 roles each (a few more for specialist roles): executive, operations, finance, commercial, people, unit manager, data contributor, data reviewer, and an industry specialist where one makes sense. The "Digital marketing agency" template has its own leadership roles (CEO, CTO, account manager, operations) plus the two data roles; the account manager and operations roles do not see margins. A role lists the KPIs its holders see. The data-contributor role sees none and can only upload. The data-reviewer role approves.

## Read this before relying on a definition

Every KPI is a **standard definition**, checked against public sources (each KPI lists the pages). Definitions vary between companies: whether churn uses opening customers or an average, whether DSO uses credit sales or all sales, which costs belong in acquisition cost. None of this has been reviewed by a domain expert for your business. The catalog shows the formula beside every KPI so an owner can read it and decide. Treat the catalog as a strong starting point, not as audited truth.

Targets are deliberately not included. Benchmarks differ by company, size and market. Each owner sets their own.

## The formula language

A formula is a small arithmetic expression. It is data, never code, so a customer can write one safely.

| You write | It means |
|---|---|
| `a + b`, `a - b`, `a * b`, `a / b`, brackets | arithmetic |
| `pct(a, b)` | a ÷ b × 100 |
| `min(a, b)`, `max(a, b)`, `abs(a)` | smallest, largest, absolute value |
| `revenue@prev` | the same input in the previous period |
| `revenue@yoy` | the same input in the same period last year |
| `period_days` | days in the reporting period |

Rules the system enforces:

- **Exact arithmetic.** No floating-point drift; results are rounded once, to ten decimals.
- **Missing is never zero.** If an input was not reported, the result is "missing" and names what is needed. A zero denominator gives "not applicable".
- **Units are checked.** Adding currency to a count is refused. A KPI's unit is worked out from its formula, so `revenue / tests` is currency per item.
- **Whole-organization KPIs.** A KPI marked `top` is calculated only for the unit without a parent (for example an agency's gross margin after payroll, or revenue against the monthly target), so clients or branches beneath it never show it as waiting for the top-level input.
- **Parents add up their children.** A parent unit uses its own figure if it has one, otherwise the sum of the units beneath it. Ratios are calculated from the summed inputs, never by averaging children's ratios.
- **Periods.** "Previous" for a whole calendar month is the previous calendar month; for any other span it is the same number of days earlier. When an earlier period is approved later, results that compare against it are recalculated.

## Adding or changing a KPI

Edit the text in `packages/kpi-catalog/src/domains/*.ts`. One measure per line, then one KPI per line:

```
revenue | Revenue | currency | Net revenue recognised in the period.
FIN-003 | Gross margin | pct(revenue - cogs, revenue) | higher | Share of revenue left after the direct cost of delivery.
AGY-002 | Agency gross margin | pct(revenue - payroll_cost - vendor_cost, revenue) | higher | Revenue left after payroll and vendor bills. | top
```

A measure line may end in `| no-rollup` (a parent never adds it up from its children). A KPI line may end in `| top` (measured for the whole organization only).

Then:

```powershell
npm run test --workspace=@orbit/kpi-catalog       # checks every formula, input and unit
npm run seed:sql --workspace=@orbit/kpi-catalog   # regenerates database/catalog-seed.sql
```

The tests fail with a list of every problem at once: an unknown input, a unit that does not make sense, a duplicate id, a measure nothing uses, a template naming a KPI that does not exist, or a seed file that is out of date. KPI ids are never reused. To retire a KPI, remove it from templates and leave the id unused.

Load the new seed into the database as described in [saas-runbook.md](saas-runbook.md) section 2a.

## Templates

Templates are assembled in `packages/kpi-catalog/src/templates.ts` from KPI ids. Applying a template copies its measures, active KPI definitions, roles and view grants into the new organization. After that the organization owns its copy: it can add catalog KPIs (as drafts the owner activates), write its own, and set targets.

## Limits of the formula language

It cannot express: averages across many past periods, rolling twelve months, cumulative totals, conditional logic (`if`), or weighted roll-ups. Many real KPIs do not need those, but some do. They would need new operations in `packages/contracts/src/formula.ts` and in the calculation engine, each added with tests, rather than arbitrary code.
