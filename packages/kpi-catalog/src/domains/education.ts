import type { DomainSource } from "../types.ts";

export const education: DomainSource = {
  domain: "education",
  title: "Schools and higher education",
  industries: ["education"],
  sources: [
    "https://insightsoftware.com/blog/27-of-the-best-university-kpis-and-metric-examples-for-reporting/",
    "https://cascade.app/blog/higher-education-kpis",
    "https://www.clearpointstrategy.com/blog/keyperformance-indicators-in-education",
    "https://www.psu.edu.sa/psu/articles/2020/08/12/new-ncaaa-institutional-kpis-eng-v2019_1597230744.pdf",
  ],
  measures: `
students_enrolled | Students enrolled | count | Students enrolled at period end.
students_start_cohort | Students at start of cohort year | count | Students in the cohort at the start of the year.
students_continuing | Students continuing | count | Cohort students who continued into the next year.
cohort_entrants | Cohort entrants | count | Students who started a programme together.
cohort_graduated | Cohort graduates | count | Entrants who graduated within the standard time.
teachers | Teaching staff | count | Full-time-equivalent teaching staff.
education_operating_expenditure | Operating expenditure | currency | Total operating cost of the institution.
applications_received_students | Admission applications | count | Applications received.
offers_students | Offers made | count | Admission offers extended.
admissions_enrolled | Students enrolled after offer | count | Applicants who accepted and enrolled.
graduates_total | Graduates | count | Students who completed their programme.
graduates_placed | Graduates placed | count | Graduates who found a job or further study.
placement_salary_total | Total placement salary | currency | Sum of starting salaries of placed graduates.
classes_scheduled | Classes scheduled | count | Classes on the timetable.
classes_held | Classes held | count | Classes that took place.
attendance_days_possible | Student days possible | days | Days students could have attended.
attendance_days_present | Student days present | days | Days students attended.
students_examined | Students examined | count | Students who sat the examination.
students_passed | Students passed | count | Students who passed.
students_dropped | Students who dropped out | count | Students who left without finishing.
students_transferred_out | Students transferred out | count | Students who moved to another institution.
faculty_phd | Faculty with doctorates | count | Teaching staff holding a doctorate.
publications | Research publications | count | Published research outputs.
fees_billed | Fees billed | currency | Tuition and other fees invoiced.
fees_collected | Fees collected | currency | Fees received.
scholarship_value | Scholarships awarded | currency | Fee waivers and scholarships granted.
classroom_hours_used | Classroom hours used | hours | Hours rooms were in use.
classroom_hours_available | Classroom hours available | hours | Hours rooms could be used.
`,
  kpis: `
EDU-001 | Student to teacher ratio | students_enrolled / teachers | neutral | Students for each teacher.
EDU-002 | Cost per student | education_operating_expenditure / students_enrolled | lower | Operating cost for each student.
EDU-003 | Revenue per student | revenue / students_enrolled | higher | Revenue for each student.
EDU-004 | Student retention rate | pct(students_continuing, students_start_cohort) | higher | Cohort students who continued.
EDU-005 | Graduation rate | pct(cohort_graduated, cohort_entrants) | higher | Entrants who graduated within the standard time.
EDU-006 | Dropout rate | pct(students_dropped, students_enrolled) | lower | Students who left without finishing.
EDU-007 | Transfer-out rate | pct(students_transferred_out, students_enrolled) | lower | Students who moved to another institution.
EDU-008 | Offer rate | pct(offers_students, applications_received_students) | neutral | Applications that received an offer.
EDU-009 | Offer acceptance rate | pct(admissions_enrolled, offers_students) | higher | Offers that led to enrolment.
EDU-010 | Application to enrolment rate | pct(admissions_enrolled, applications_received_students) | higher | Applications that ended in enrolment.
EDU-011 | Enrolment growth vs previous period | pct(students_enrolled - students_enrolled@prev, students_enrolled@prev) | higher | Change in enrolment against the previous period.
EDU-012 | Placement rate | pct(graduates_placed, graduates_total) | higher | Graduates who found a job or further study.
EDU-013 | Average placement salary | placement_salary_total / graduates_placed | higher | Average starting salary of placed graduates.
EDU-014 | Class delivery rate | pct(classes_held, classes_scheduled) | higher | Scheduled classes that took place.
EDU-015 | Student attendance rate | pct(attendance_days_present, attendance_days_possible) | higher | Days students attended.
EDU-016 | Pass rate | pct(students_passed, students_examined) | higher | Students who passed.
EDU-017 | Faculty with doctorates | pct(faculty_phd, teachers) | higher | Teaching staff holding a doctorate.
EDU-018 | Publications per teacher | publications / teachers | higher | Research outputs for each teaching staff member.
EDU-019 | Fee collection rate | pct(fees_collected, fees_billed) | higher | Fees billed that were collected.
EDU-020 | Fees outstanding | fees_billed - fees_collected | lower | Fees billed but not yet collected.
EDU-021 | Scholarship share | pct(scholarship_value, fees_billed) | neutral | Fees waived through scholarships.
EDU-022 | Classroom utilisation | pct(classroom_hours_used, classroom_hours_available) | higher | Available classroom hours that were used.
EDU-023 | Students enrolled | students_enrolled | higher | Students enrolled at period end.
`,
};
