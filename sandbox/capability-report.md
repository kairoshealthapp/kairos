# Epic FHIR R4 Sandbox — Capability Report

Generated: 2026-05-03T15:04:23.185Z
Sandbox base: https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
Client ID: a85de553-5013-47e8-9f3b-f3c797176f81
JWKS URL probe: HTTP 200 (1 keys)
Auth status: OK (token len=1052, scope=system/AllergyIntolerance.read system/CarePlan.read system/Condition.read system/Coverage.read system/DiagnosticReport.read system/DocumentReference.read system/DocumentReference.write system/Encounter.read system/Immunization.read system/MedicationRequest.read system/Observation.read system/Patient.read system/Procedure.read system/ServiceRequest.read, expires_in=3600s)
Working test patient: erXuFYUfucBZaryVksYEcMg3

## CapabilityStatement Summary

| Resource | Interactions | Search params (sample) |
|---|---|---|
| Account | read, search-type | _count, _id |
| AdverseEvent | read, search-type | _count, _id, actuality, category, date, event, location, recorder, +7 more |
| AllergyIntolerance | create, read, search-type | _count, _id, asserter, category, clinical-status, code, criticality, date, +10 more |
| Appointment | read, search-type | _count, _id, actor, appointment-type, based-on, date, identifier, location, +12 more |
| Binary | read, search-type | _count, _id |
| BodyStructure | create, read, search-type, update | _count, _id, identifier, location, morphology, patient, subject |
| CarePlan | read, search-type | _count, _id, activity-code, activity-date, activity-reference, based-on, care-team, category, +13 more |
| CareTeam | read, search-type | _count, _id, category, date, encounter, identifier, participant, patient, +2 more |
| Claim | read, search-type | _count, _id |
| Communication | create, read, search-type | _count, _id, based-on, category, encounter, identifier, instantiates-canonical, medium, +8 more |
| ConceptMap | create, read | — |
| Condition | create, read, search-type | _count, _id, abatement-date, abatement-string, asserter, body-site, category, clinical-status, +13 more |
| Consent | read, search-type | _count, _id, action, actor, category, consentor, data, date, +10 more |
| Contract | read, search-type | _count, _id |
| Coverage | read, search-type | _count, _id, beneficiary, class-type, class-value, dependent, identifier, patient, +5 more |
| Device | read, search-type | _count, _id, device-name, identifier, location, manufacturer, model, organization, +5 more |
| DeviceRequest | read, search-type | _count, _id, authored-on, based-on, code, device, encounter, event-date, +11 more |
| DeviceUseStatement | read, search-type | _count, _id, device, identifier, patient, subject |
| DiagnosticReport | read, search-type, update | _count, _id, based-on, category, code, conclusion, date, encounter, +10 more |
| DocumentReference | create, read, search-type, update | _count, _id, _lastupdated, authenticator, author, category, contenttype, custodian, +19 more |
| Encounter | read, search-type | _count, _id, account, appointment, based-on, class, date, diagnosis, +17 more |
| Endpoint | read, search-type | _count, _id |
| EpisodeOfCare | read, search-type | _count, _id, care-manager, condition, date, identifier, incoming-referral, organization, +3 more |
| ExplanationOfBenefit | read, search-type | _count, _id, billable-period-start, care-team, claim, coverage, created, detail-udi, +16 more |
| FamilyMemberHistory | read, search-type | _count, _id, code, date, identifier, instantiates-canonical, patient, relationship, +2 more |
| Flag | read, search-type | _count, _id, author, category, date, encounter, identifier, patient, +2 more |
| Goal | read, search-type | _count, _id, achievement-status, category, identifier, lifecycle-status, patient, start-date, +2 more |
| Group | read, search-type | _count, _id |
| ImagingStudy | read, search-type | _count, _id, basedon, bodysite, dicom-class, encounter, endpoint, identifier, +11 more |
| Immunization | read, search-type | _count, _id, date, identifier, location, lot-number, manufacturer, patient, +10 more |
| ImmunizationRecommendation | read, search-type | _count, _id, date, identifier, information, patient, status, support, +2 more |
| List | read, search-type | _count, _id, code, date, empty-reason, encounter, identifier, item, +6 more |
| Location | read, search-type | _count, _id, address, address-city, address-country, address-postalcode, address-state, address-use, +8 more |
| Measure | read, search-type | _count, _id |
| MeasureReport | read, search-type | _count, _id, _lastupdated, date, epic-group-id, evaluated-resource, identifier, measure, +5 more |
| Media | read, search-type | _count, _id |
| Medication | read, search-type | _count, _id |
| MedicationAdministration | read, search-type | _count, _id, code, context, device, effective-time, identifier, medication, +7 more |
| MedicationDispense | read, search-type | _count, _id, category, code, context, destination, identifier, medication, +10 more |
| MedicationRequest | read, search-type | _count, _id, authoredon, category, code, date, encounter, identifier, +10 more |
| NutritionOrder | read, search-type | _count, _id, additive, datetime, encounter, formula, identifier, instantiates-canonical, +5 more |
| Observation | create, read, search-type, update | _count, _id, based-on, category, code, combo-code, combo-data-absent-reason, combo-value-concept, +22 more |
| Organization | read, search-type | _count, _id |
| Patient | create, read, search-type | _count, _id, active, address, address-city, address-country, address-postalcode, address-state, +22 more |
| Practitioner | read, search-type | _count, _id, active, address, address-city, address-country, address-postalcode, address-state, +11 more |
| PractitionerRole | read, search-type | _count, _id, active, date, email, endpoint, identifier, location, +7 more |
| Procedure | create, read, search-type, update | _count, _id, based-on, category, code, date, encounter, identifier, +9 more |
| Provenance | read | — |
| Questionnaire | read, search-type | _count, _id |
| QuestionnaireResponse | create, read, search-type | _count, _id, author, authored, based-on, encounter, identifier, part-of, +5 more |
| RelatedPerson | read, search-type | _count, _id |
| RequestGroup | read, search-type | _count, _id |
| ResearchStudy | read, search-type | _count, _id, category, date, focus, identifier, keyword, location, +7 more |
| ResearchSubject | read, search-type | _count, _id, date, identifier, patient, status, study |
| ServiceRequest | create, read, search-type, update | _count, _id, authored, based-on, body-site, category, code, encounter, +15 more |
| Specimen | read, search-type | _count, _id |
| Substance | read, search-type | _count, _id |
| Task | read, search-type, update | _count, _id, authored-on, based-on, business-status, code, encounter, focus, +13 more |
| ValueSet | read | — |

## CONFIRMED CAPABILITIES (200/201)
| Kind | Operation | Status | Notes |
|---|---|---|---|
| READ | Patient read by id | 200 | OK |
| READ | Patient read by id | 200 | OK |
| READ | Patient read by id | 200 | OK |
| READ | Patient search | 200 | entries=0 |
| READ | Condition search | 200 | entries=5 |
| READ | MedicationRequest search | 200 | entries=1 |
| READ | DiagnosticReport search | 200 | entries=5 |
| READ | DocumentReference search | 200 | entries=5 |
| READ | ServiceRequest search | 200 | entries=5 |
| READ | AllergyIntolerance search | 200 | entries=1 |
| READ | Encounter search | 200 | entries=5 |
| READ | Procedure search | 200 | entries=2 |
| READ | Coverage search | 200 | entries=0 |

## BLOCKED CAPABILITIES (401/403 — auth/scope required)
| Kind | Operation | Status | Notes |
|---|---|---|---|
| READ | Communication search | 403 |  |
| READ | CareTeam search | 403 |  |
| READ | Practitioner search | 403 |  |
| READ | PractitionerRole search | 403 |  |
| READ | Organization search | 403 |  |
| READ | Location search | 403 |  |
| READ | Binary search | 403 |  |
| WRITE | Communication (MyChart message) | 403 |  |
| WRITE | ServiceRequest (referral) | 403 |  |

## NOT AVAILABLE (400/404/422)
| Kind | Operation | Status | Notes |
|---|---|---|---|
| READ | Patient read by id | 404 | Invalid FHIR ID provided |
| READ | Observation search | 400 | Must have either code or category. |
| READ | CarePlan search | 400 | This resource requires a category for searching. Use 38717003 for longitudinal, 734163000 for encounter, 736271009 for outpatient, 736353004 for inpatient, 738906000 for dental, 736378000 for oncology |
| WRITE | DocumentReference (clinical note) | 400 | Valid encounter required |

## UNKNOWN (other status / network errors)
| Kind | Operation | Status | Notes |
|---|---|---|---|
| WRITE | MedicationRequest (med order) | 405 |  |
| WRITE | Encounter (Anticoag-Warfarin Visit type 1001) | 405 |  |
| WRITE | Communication PATCH (mark done) | skipped | requires existing message id |

## Raw run log
```

========================================================================
STEP 1: AUTH CHECK
========================================================================
JWKS probe https://auth.firekraker.net/.well-known/jwks.json -> HTTP 200 (1 keys)
Found private key: C:\Users\kents\kairos\sandbox\private-key.pem
Token endpoint -> HTTP 200
  OK (token len=1052, scope=system/AllergyIntolerance.read system/CarePlan.read system/Condition.read system/Coverage.read system/DiagnosticReport.read system/DocumentReference.read system/DocumentReference.write system/Encounter.read system/Immunization.read system/MedicationRequest.read system/Observation.read system/Patient.read system/Procedure.read system/ServiceRequest.read, expires_in=3600s)

========================================================================
STEP 2: CapabilityStatement (no auth required)
========================================================================
GET https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/metadata
  -> HTTP 200
  fhirVersion: 4.0.1
  software:    Epic February 2026

CapabilityStatement lists 59 resource types.
Top-level interactions per resource (first 25):
  Account                      read, search-type
  AdverseEvent                 read, search-type
  AllergyIntolerance           create, read, search-type
  Appointment                  read, search-type
  Binary                       read, search-type
  BodyStructure                create, read, search-type, update
  CarePlan                     read, search-type
  CareTeam                     read, search-type
  Claim                        read, search-type
  Communication                create, read, search-type
  ConceptMap                   create, read
  Condition                    create, read, search-type
  Consent                      read, search-type
  Contract                     read, search-type
  Coverage                     read, search-type
  Device                       read, search-type
  DeviceRequest                read, search-type
  DeviceUseStatement           read, search-type
  DiagnosticReport             read, search-type, update
  DocumentReference            create, read, search-type, update
  Encounter                    read, search-type
  Endpoint                     read, search-type
  EpisodeOfCare                read, search-type
  ExplanationOfBenefit         read, search-type
  FamilyMemberHistory          read, search-type
  ... and 34 more

========================================================================
STEP 3: READ TESTS
========================================================================
Trying test patients by direct read:
  Tbt3KuCY0B5PSrJvCu2j-PlK.aiHdq1rKTY6pBFfBs8 -> HTTP 404
  erXuFYUfucBZaryVksYEcMg3                 -> HTTP 200
    name: Camila Maria Lopez
  eq081-VQEgP8drUUqCWzHfw3                 -> HTTP 200
    name: Derrick Lin
  eAB3mDIBBcyUKviyzrxsnAw3                 -> HTTP 200
    name: Desiree Caroline Lambridge

Using patient context: erXuFYUfucBZaryVksYEcMg3
  Patient                HTTP 200  entries=0  [resourceType,issue]  
  Condition              HTTP 200  entries=5  [resourceType,id,clinicalStatus,verificationStatus,category,severity,code,subject]  
  MedicationRequest      HTTP 200  entries=1  [resourceType,id,identifier,status,intent,category,medicationReference,subject]  
  Observation            HTTP 400      — Must have either code or category.
  DiagnosticReport       HTTP 200  entries=5  [resourceType,id,identifier,basedOn,status,category,code,subject]  
  DocumentReference      HTTP 200  entries=5  [resourceType,id,extension,identifier,status,docStatus,type,category]  
  Communication          HTTP 403      
  ServiceRequest         HTTP 200  entries=5  [resourceType,id,identifier,status,intent,category,code,quantityQuantity]  
  AllergyIntolerance     HTTP 200  entries=1  [resourceType,id,clinicalStatus,verificationStatus,code,patient]  
  Encounter              HTTP 200  entries=5  [resourceType,id,identifier,status,class,type,serviceType,subject]  
  Procedure              HTTP 200  entries=2  [resourceType,id,identifier,basedOn,status,category,code,subject]  
  CarePlan               HTTP 400      — This resource requires a category for searching. Use 38717003 for longitudinal, 734163000 for encounter, 736271009 for o
  CareTeam               HTTP 403      
  Coverage               HTTP 200  entries=0  [resourceType,issue]  
  Practitioner           HTTP 403      
  PractitionerRole       HTTP 403      
  Organization           HTTP 403      
  Location               HTTP 403      
  Binary                 HTTP 403      

========================================================================
STEP 4: WRITE TESTS
========================================================================
  DocumentReference (clinical note)              HTTP 400  — Valid encounter required
  Communication (MyChart message)                HTTP 403  
  MedicationRequest (med order)                  HTTP 405  
  ServiceRequest (referral)                      HTTP 403  
  Encounter (Anticoag-Warfarin Visit type 1001)  HTTP 405  
  Communication PATCH (status change) — skipped: needs existing message id

========================================================================
STEP 5: WRITING REPORT
========================================================================
```