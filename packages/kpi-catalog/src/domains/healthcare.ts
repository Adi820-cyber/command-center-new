import type { DomainSource } from "../types.ts";

export const healthcare: DomainSource = {
  domain: "healthcare",
  title: "Hospitals and clinics",
  industries: ["healthcare"],
  sources: [
    "https://tgg-accounting.com/wp-content/uploads/2021/12/TGG_Health-Care-KPIs.pdf",
    "https://www.assessteam.com/hospital-kpis/",
    "https://sharpsheets.io/blog/medical-clinics-kpis-metrics",
    "https://arkenea.com/blog/healthcare-kpi/",
  ],
  measures: `
available_bed_days | Available bed-days | days | Staffed beds multiplied by days in the period.
inpatient_days | Inpatient days | days | Bed-days occupied by admitted patients.
admissions | Admissions | count | Patients admitted.
discharges | Discharges | count | Patients discharged, including deaths.
admissions_from_opd | Admissions from outpatient visits | count | Admissions that began as an outpatient visit.
readmissions_30d | Readmissions within 30 days | count | Patients readmitted within 30 days of discharge.
deaths_inpatient | Inpatient deaths | count | Deaths of admitted patients.
opd_visits | Outpatient visits | count | Outpatient consultations.
ed_visits | Emergency visits | count | Emergency department attendances.
ed_wait_minutes_total | Total emergency waiting time | minutes | Sum of minutes from arrival to first clinician across emergency visits.
ed_left_without_seen | Left emergency without being seen | count | Emergency patients who left before treatment.
opd_wait_minutes_total | Total outpatient waiting time | minutes | Sum of minutes patients waited for their consultation.
appointments_scheduled | Appointments scheduled | count | Booked outpatient appointments.
appointments_missed | Appointments missed | count | Booked appointments where the patient did not attend.
surgeries_scheduled | Surgeries scheduled | count | Operations planned.
surgeries_cancelled | Surgeries cancelled | count | Planned operations that were cancelled.
surgeries_performed | Surgeries performed | count | Operations carried out.
ot_hours_used | Operating theatre hours used | hours | Hours theatres were in use.
ot_hours_available | Operating theatre hours available | hours | Hours theatres were staffed and available.
hai_cases | Hospital-acquired infections | count | Infections acquired during the stay.
icu_bed_days_used | ICU bed-days used | days | ICU bed-days occupied.
icu_bed_days_available | ICU bed-days available | days | ICU bed-days staffed and available.
patient_survey_responses | Patient survey responses | count | Patients who answered the experience survey.
patient_survey_satisfied | Satisfied patients | count | Survey responses that were satisfied.
doctors | Doctors | count | Full-time-equivalent doctors.
nurses | Nurses | count | Full-time-equivalent nurses.
claims_submitted | Insurance claims submitted | count | Claims sent to insurers or payers.
claims_denied | Insurance claims denied | count | Claims rejected by payers.
medication_errors | Medication errors | count | Wrong drug, dose, route or time events.
medication_doses | Medication doses administered | count | All doses given.
discharges_before_noon | Discharges before noon | count | Patients discharged before midday.
deliveries | Deliveries | count | Births at the facility.
caesarean_deliveries | Caesarean deliveries | count | Births by caesarean section.
inpatient_revenue | Inpatient revenue | currency | Revenue from admitted patients.
outpatient_revenue | Outpatient revenue | currency | Revenue from outpatient care.
`,
  kpis: `
HLT-001 | Bed occupancy rate | pct(inpatient_days, available_bed_days) | higher | Share of available bed-days that were occupied.
HLT-002 | Average length of stay | inpatient_days / discharges | lower | Average days a patient stays.
HLT-003 | Bed turnover | discharges / (available_bed_days / period_days) | higher | Patients discharged per available bed.
HLT-004 | Readmission rate | pct(readmissions_30d, discharges) | lower | Patients readmitted within 30 days.
HLT-005 | Inpatient mortality rate | pct(deaths_inpatient, discharges) | lower | Inpatient deaths as a share of discharges.
HLT-006 | Admissions | admissions | neutral | Patients admitted.
HLT-007 | Discharges | discharges | neutral | Patients discharged.
HLT-008 | Outpatient visits | opd_visits | higher | Outpatient consultations.
HLT-009 | Emergency visits | ed_visits | neutral | Emergency attendances.
HLT-010 | Average emergency wait | ed_wait_minutes_total / ed_visits | lower | Average minutes from arrival to first clinician.
HLT-011 | Left without being seen rate | pct(ed_left_without_seen, ed_visits) | lower | Emergency patients who left untreated.
HLT-012 | Average outpatient wait | opd_wait_minutes_total / opd_visits | lower | Average minutes waiting for a consultation.
HLT-013 | Appointment no-show rate | pct(appointments_missed, appointments_scheduled) | lower | Booked appointments that were missed.
HLT-014 | Surgery cancellation rate | pct(surgeries_cancelled, surgeries_scheduled) | lower | Planned operations that were cancelled.
HLT-015 | Surgeries performed | surgeries_performed | higher | Operations carried out.
HLT-016 | Operating theatre utilisation | pct(ot_hours_used, ot_hours_available) | higher | Available theatre hours that were used.
HLT-017 | Hospital-acquired infections per 1,000 patient days | hai_cases * 1000 / inpatient_days | lower | Infections acquired in hospital, relative to patient days.
HLT-018 | ICU occupancy | pct(icu_bed_days_used, icu_bed_days_available) | neutral | ICU bed-days that were occupied.
HLT-019 | Patient satisfaction | pct(patient_survey_satisfied, patient_survey_responses) | higher | Survey responses that were satisfied.
HLT-020 | Patient days per doctor | inpatient_days / doctors | neutral | Inpatient days for each doctor.
HLT-021 | Patient days per nurse | inpatient_days / nurses | neutral | Inpatient days for each nurse.
HLT-022 | Claim denial rate | pct(claims_denied, claims_submitted) | lower | Claims rejected by payers.
HLT-023 | Medication errors per 1,000 doses | medication_errors * 1000 / medication_doses | lower | Medication errors relative to doses given.
HLT-024 | Early discharge rate | pct(discharges_before_noon, discharges) | higher | Patients discharged before midday.
HLT-025 | Caesarean rate | pct(caesarean_deliveries, deliveries) | neutral | Births by caesarean section.
HLT-026 | Outpatient to inpatient conversion | pct(admissions_from_opd, opd_visits) | neutral | Outpatient visits that led to admission.
HLT-027 | Average revenue per occupied bed day | revenue / inpatient_days | higher | Revenue for each occupied bed-day.
HLT-028 | Cost per patient day | (cogs + operating_expenses) / inpatient_days | lower | Total cost for each occupied bed-day.
HLT-029 | Inpatient revenue share | pct(inpatient_revenue, revenue) | neutral | Revenue from admitted patients.
HLT-030 | Outpatient revenue share | pct(outpatient_revenue, revenue) | neutral | Revenue from outpatient care.
HLT-031 | Revenue per outpatient visit | outpatient_revenue / opd_visits | higher | Revenue earned for each outpatient visit.
HLT-032 | Admission growth vs previous period | pct(admissions - admissions@prev, admissions@prev) | higher | Change in admissions against the previous period.
HLT-033 | Outpatient visit growth vs previous period | pct(opd_visits - opd_visits@prev, opd_visits@prev) | higher | Change in outpatient visits against the previous period.
HLT-034 | Occupancy change vs previous period | pct(inpatient_days - inpatient_days@prev, inpatient_days@prev) | higher | Change in occupied bed-days against the previous period.
HLT-035 | Inpatient days | inpatient_days | higher | Bed-days occupied by admitted patients.
HLT-036 | Revenue per bed | revenue / (available_bed_days / period_days) | higher | Revenue for each available bed.
`,
};
