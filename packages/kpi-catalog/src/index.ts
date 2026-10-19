import { buildCatalog } from "./build.ts";
import { customer } from "./domains/customer.ts";
import { diagnostics } from "./domains/diagnostics.ts";
import { finance } from "./domains/finance.ts";
import { healthcare } from "./domains/healthcare.ts";
import { hr } from "./domains/hr.ts";
import { itEngineering } from "./domains/it-engineering.ts";
import { manufacturing } from "./domains/manufacturing.ts";
import { marketing } from "./domains/marketing.ts";
import { operations } from "./domains/operations.ts";
import { qualitySafety } from "./domains/quality-safety.ts";
import { retail } from "./domains/retail.ts";
import { saas } from "./domains/saas.ts";
import { sales } from "./domains/sales.ts";
import { supplyChain } from "./domains/supply-chain.ts";
import { banking } from "./domains/banking.ts";
import { education } from "./domains/education.ts";
import { hospitality } from "./domains/hospitality.ts";
import { insurance } from "./domains/insurance.ts";
import { logistics } from "./domains/logistics.ts";
import { professionalServices } from "./domains/professional-services.ts";
import { realEstate } from "./domains/real-estate.ts";
import { agriculture, energy, nonprofit, telecom } from "./domains/other-industries.ts";
import { digitalAgency } from "./domains/digital-agency.ts";
import type { DomainSource } from "./types.ts";

export * from "./types.ts";
export { buildCatalog } from "./build.ts";
export { TEMPLATES } from "./templates.ts";

/** Every domain, in display order. */
export const DOMAINS: readonly DomainSource[] = [
  finance,
  sales,
  marketing,
  customer,
  hr,
  operations,
  supplyChain,
  itEngineering,
  qualitySafety,
  healthcare,
  diagnostics,
  retail,
  manufacturing,
  saas,
  banking,
  education,
  hospitality,
  insurance,
  logistics,
  professionalServices,
  realEstate,
  telecom,
  nonprofit,
  energy,
  agriculture,
  ...digitalAgency,
];

export const CATALOG = buildCatalog(DOMAINS);
