//#################### allergies ###################
module.exports = {
  "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
  "@graph": [
    {
      "_id": "8810-000007",
      "name-8810": {
        "id": "2-000007", // redundant info, see ‘type’ below
        "label": "BUNNY,BUGS"  // @dbooth: labels are passed along unchanged
      },
      "label": "BUNNY,BUGS",
      "type": "chcss:8810",
      "drug_allergy-8810": [
        {
          "allergy_selection-8810_03": {
            "id": "8254_01-999004", // @dbooth: remap to a fhir coding system, source is “chcs” coding system
            // note: fhir allows multiple coding systems, we need to choose, prob “SNOMED CT”
            "label": "NKDA"
          },
          "comment-8810_03": "Reaction(s): Unknown",
          "type": "chcss:8810_03",
          "id": "8810_03-1_000007",
          "label": "NKDA"
        }, // line 33 next
      ],
    },
//  ]
//}

//#################### appointments ###################
//{
//  "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
//  "@graph": [
    { 
      "_id": "44_2-6780505",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "10",
      "clinic-44_2": {
        "id": "44-1105",
        "label": "IMMUNIZATION 0000"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-488",
        "label": "ROUT$"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-616",
        "label": "FBIJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-11111",
        "label": "DUCK,DONALD"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointment_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    },
    { 
      "_id": "44_2-6781209",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "15",
      "clinic-44_2": {
        "id": "44-163",
        "label": "MED. ASSESSMENT_MOT 0000"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-493",
        "label": "EST"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-55555",
        "label": "MOUSE,MICKEY"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointment_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    },
    { 
      "_id": "44_2-6784842",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "20",
      "clinic-44_2": {
        "id": "44-164",
        "label": "AUDIOLOGY XANADU HC 0000"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-488",
        "label": "ROUT$"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-429",
        "label": "BHDJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-2222",
        "label": "SAILOR,POPEYE"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointment_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    },
    {    
      "_id": "44_2-6785172",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "20",
      "clinic-44_2": {
        "id": "44-171",
        "label": "OPTOMETRY XANADU HC 0000"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-497",
        "label": "GRP"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-424",
        "label": "BHCJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-33333",
        "label": "BIRD,TWEETY"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointment_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    },
    { 
      "_id": "44_2-6787995",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "10",
      "clinic-44_2": {
        "id": "44-000000",
        "label": "WELLNESS CLINIC (MALE)"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-488",
        "label": "ROUT$"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-988",
        "label": "FBBJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-55555",
        "label": "MOUSE,MICKEY"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointment_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    },
    { 
      "_id": "44_2-6789037",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "10",
      "clinic-44_2": {
        "id": "44-1105",
        "label": "IMMUNIZATION 0000"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-488",
        "label": "ROUT$"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-616",
        "label": "FBIJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-55555",
        "label": "MOUSE,MICKEY"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointment_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    },
    { 
      "_id": "44_2-6806973",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "10",
      "clinic-44_2": {
        "id": "44-1105",
        "label": "IMMUNIZATION 0000"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-488",
        "label": "ROUT$"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-616",
        "label": "FBIJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-37077",
        "label": "FLINTSTONE,FRED"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointment_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    },
    { 
      "_id": "44_2-6871860",
      "date_appointment_made-44_2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "name-44_2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "duration-44_2": "10",
      "clinic-44_2": {
        "id": "44-1105",
        "label": "IMMUNIZATION 0000"
      },
      "label": "BUNNY,BUGS",
      "appointment_type-44_2": {
        "id": "44_5-488",
        "label": "ROUT$"
      },
      "appointment_date_time-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "injury_accident_related-44_2": true,
      "checkedin-44_2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient_status-44_2": {
        "id": "chcss:44_2_8_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "meprs_code-44_2": {
        "id": "8119-616",
        "label": "FBIJ"
      },
      "patient_category-44_2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "appt_division-44_2": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "provider-44_2": {
        "id": "6-36515",
        "label": "PIG,PORKY"
      },
      "walkin-44_2": {
        "id": "chcss:44_2_20_E-WALK_IN",
        "label": "WALK_IN"
      },
      "type": "chcss:44_2",
      "workload_type-44_2": {
        "id": "chcss:44_2_74_E-NON_COUNT",
        "label": "NON_COUNT"
      },
      "appointent_status-44_2": {
        "id": "8514-5",
        "label": "WALK-IN"
      }
    }, // next line 571
//  ]
//}
// TODO mike@carif.io: each context here is just a convenience, right?
//#################### context ###################
// {
//    "@context": {
//        "loinc": "http://hokukahu.com/schema/loinc#",
//        "hptc": "http://hokukahu.com/schema/hptc#",
//        "cpt": "http://hokukahu.com/schema/cpt#",
//        "ndc": "http://hokukahu.com/schema/ndc#",
//        "icd9cm": "http://hokukahu.com/schema/icd9cm#",
//        "npi": "http://hokukahu.com/schema/npi#",
//        "nddf": "http://hokukahu.com/schema/nddf#",
//        "@vocab": "http://hokukahu.com/schema/chcss#",
//        "chcss": "http://hokukahu.com/schema/chcss#",
//        "@base": "http://hokukahu.com/systems/chcs-1/",
//        "_id": "@id",
//        "id": "@id",
//        "type": "@type",
//        "list": "@list",
//        "value": "@value",
//        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
//        "label": {
//            "@id": "rdfs:label"
//        },
//        "owl": "http://www.w3.org/2002/07/owl#",
//        "fms": "http://datasets.caregraf.org/fms/",
//        "sameAs": {
//            "@id": "owl:sameAs",
//            "@type": "@id"
//        },
//        "sameAsLabel": {
//            "@id": "fms:sameAsLabel"
//        }
//    }
// }

// #################### demographics ###################
//{
//   "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
//  "@graph": [
    {
      "_id": "2-000007",
      "fmp-2": {
        "id": "8110-20",
        "label": "20"
      },
      "registration_type-2": {
        "id": "chcss:2_8002_E-MINI",
        "label": "MINI"
      },
      "branch_of_service_last-2": {
        "id": "23-4",
        "label": "NAVY"
      },
      "outpatient_record_location-2": {
        "id": "44-100",
        "label": "XANADU HEALTH CLINIC"
      },
      "deers_address_updated-2": true,
      "geo_loc_of_ship_unit-2": {
        "id": "5-17",
        "label": "MYSTATE"
      },
      "patient_ssn-2": "777777777",
      "label": "BUNNY,BUGS",
      "dob-2": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "deers_uic-2": {
        "id": "8111-50428",
        "label": "S CRU TRCOM GTLK"
      },
      "type": "chcss:2",
      "user_altering_patient_record-2": [
        {
          "division_modified_at-2_4": {
            "id": "40_8-4",
            "label": "XANADU HC 0000"
          },
          "label": "DUCK,DONALD",
          "user_altering_patient_record-2_4": {
            "id": "3-11111",
            "label": "DUCK,DONALD"
          },
          "modified_date_time-2_4": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "type": "chcss:2_4",
          "id": "2_4-1_000007"
        }
      ],
      "military_grade_rank-2": {
        "id": "8104-97",
        "label": "SEAMAN"
      },
      "fmp_ssn-2": "20/777777777",
      "patient_category-2": {
        "id": "8156-4149",
        "label": "USN AD RECRUIT"
      },
      "date_entered_into_file-2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "organ_donor_date-2": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "medical_record_type-2": [
        {
          "type-2_03": {
            "id": "8125-1",
            "label": "OUTPATIENT"
          },
          "type": "chcss:2_03",
          "id": "2_03-1_000007",
          "record_room-2_03": {
            "id": "44-100",
            "label": "XANADU HEALTH CLINIC"
          },
          "label": "OUTPATIENT"
        }
      ],
      "registration_comment-2": "fake text",
      "who_entered_patient-2": {
        "id": "3-75573",
        "label": "DUCK,DONALD"
      },
      "name-2": "VALJEAN,JEAN X",
      "ssn-2": "777777777",
      "dod_id_-2": "7777777770",
      "registration_incomplete-2": {
        "id": "chcss:2__0991_E-REGISTRATION_IS_COMPLETE",
        "label": "REGISTRATION_IS_COMPLETE"
      },
      "sex-2": {
        "id": "chcss:2__02_E-MALE",
        "label": "MALE"
      },
      "active_duty-2": true,
      "unit_ship_id-2": {
        "id": "8111-11111",
        "label": "ROCKNROLL"
      },
      "sponsor_name-2": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "organ_donor-2": {
        "id": "chcss:2_9001_01_E-UNDECIDED",
        "label": "UNDECIDED"
      }
    }, // next line 699
//   ]
// }
// mgc: skill all b/c empty
//#################### encounters ###################
// {
//  "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
//  "@graph": []
// }

// #################### labs ###################
// {
//  "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
 // "@graph": [
    {
      "_id": "63-000007",
      "micro_conversion_flag-63": {
        "id": "chcss:63__03_E-Micro_result_converted_for_4_41",
        "label": "Micro_result_converted_for_4_41"
      },
      "label": "BUNNY,BUGS",
      "clinical_chemistry-63": [
        {
          "date_time_specimen_taken-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "login_date_time-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "performing_lab_disclosures-63_04": [
            {
              "id": "63_832-1_9999999.111111_000007",
              "disclosure_id-63_832": "1",
              "type": "chcss:63_832",
              "disclosure_text-63_832": "fake text",
              "label": "1"
            }
          ],
          "origin_of_result-63_04": {
            "id": "chcss:63_04__24_E-PERFORMING_LABORATORY",
            "label": "PERFORMING_LABORATORY"
          },
          "collection_sample-63_04": {
            "id": "62-319",
            "label": "HIV TUBE"
          },
          "lab_work_element-63_04": {
            "id": "44-4246",
            "label": "MAD HATTER LAB"
          },
          "specimen-63_04": {
            "id": "61-72",
            "label": "SERUM"
          },
          "result-63_04": [
            {
              "enter_person-11_07": {
                "id": "3-7777",
                "label": "PANTHER,PINK"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-4220",
                "label": "HIV-1 AB"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-666666",
                "label": "KITTY,HELLO"
              },
              "sensitive_result-11_07": "Negative",
              "performing_lab_disclosure-11_07": "1",
              "label": "@",
              "initial_viewer-11_07": {
                "id": "3-111",
                "label": "POOH,WINNIE"
              },
              "result-11_07": "@",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-11111111",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-222",
                "label": "POOH,WINNIE"
              },
              "type": "chcss:11_07",
              "id": "1_07-4220_9999999.111111_0001007",
              "lab_method-11_07": {
                "id": "8710-2972",
                "label": "HIV INTEROPERABILITY (01JAN90)"
              }
            }
          ],
          "requesting_location-63_04": {
            "id": "44-163",
            "label": "MED. ASSESSMENT_MOT 0000"
          },
          "hcp-63_04": {
            "id": "6-485",
            "label": "POOH,WINNIE"
          },
          "accession-63_04": "fake text",
          "lab_archive_date-63_04": {
            "type": "xsd:date",
            "value": "1990-01-01"
          },
          "label": "1990-01-01T00:00:00Z",
          "type": "chcss:63_04",
          "id": "63_04-9999999.111111_000007"
        },
        {
          "date_time_specimen_taken-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "login_date_time-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "collection_sample-63_04": {
            "id": "62-166",
            "label": "URINE"
          },
          "lab_work_element-63_04": {
            "id": "44-944",
            "label": "LABORATORY BMC 0000"
          },
          "specimen-63_04": {
            "id": "61-71",
            "label": "VOIDED URINE"
          },
          "result-63_04": [
            {
              "enter_person-11_07": {
                "id": "3-88888",
                "label": "BEAR,YOGI"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-3429",
                "label": "INPROCESSING CHLAMYDIA SCREEN"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-88888",
                "label": "BEAR,YOGI"
              },
              "label": "N",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "N",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-13553736",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-3429_9999999.111111_000007",
              "lab_method-11_07": {
                "id": "8710-1426",
                "label": "INPROCESSING CHLAMYDIA SCREEN"
              }
            }
          ],
          "requesting_location-63_04": {
            "id": "44-163",
            "label": "MED. ASSESSMENT_MOT 0000"
          },
          "hcp-63_04": {
            "id": "6-485",
            "label": "POOH,WINNIE"
          },
          "accession-63_04": "fake text",
          "lab_archive_date-63_04": {
            "type": "xsd:date",
            "value": "1990-01-01"
          },
          "label": "1990-01-01T00:00:00Z",
          "type": "chcss:63_04",
          "id": "63_04-9999999.111111_000007"
        },
        {
          "date_time_specimen_taken-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "login_date_time-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "collection_sample-63_04": {
            "id": "62-324",
            "label": "MARBLE-BLOOD"
          },
          "lab_work_element-63_04": {
            "id": "44-13",
            "label": "LABORATORY 200H"
          },
          "specimen-63_04": {
            "id": "61-72",
            "label": "SERUM"
          },
          "result-63_04": [
            {
              "enter_person-11_07": {
                "id": "3-22222",
                "label": "DUCK,DONALD"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-111",
                "label": "GLUCOSE"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-22222",
                "label": "DUCK,DONALD"
              },
              "label": "102",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "102",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-33333333",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-175_9999999.111111_000007",
              "lab_method-11_07": {
                "id": "8710-2222",
                "label": "GLUCOSE (01JAN90)"
              }
            }
          ],
          "requesting_location-63_04": {
            "id": "44-163",
            "label": "MED. ASSESSMENT_MOT 0000"
          },
          "hcp-63_04": {
            "id": "6-485",
            "label": "POOH,WINNIE"
          },
          "accession-63_04": "fake text",
          "lab_archive_date-63_04": {
            "type": "xsd:date",
            "value": "1990-01-01"
          },
          "label": "1990-01-01T00:00:00Z",
          "type": "chcss:63_04",
          "id": "63_04-9999999.836398_000007"
        },
        {
          "date_time_specimen_taken-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "login_date_time-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "collection_sample-63_04": {
            "id": "62-222",
            "label": "MARBLE-BLOOD"
          },
          "lab_work_element-63_04": {
            "id": "44-666",
            "label": "LABORATORY BMC 0000"
          },
          "specimen-63_04": {
            "id": "61-72",
            "label": "SERUM"
          },
          "result-63_04": [
            {
              "enter_person-11_07": {
                "id": "3-88888",
                "label": "BEAR,YOGI"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-3618",
                "label": "INPROCESSING VARICELLA AB"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-88888",
                "label": "BEAR,YOGI"
              },
              "label": "I",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "I",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-13553734",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-3618_9999999.836399_000007",
              "lab_method-11_07": {
                "id": "8710-1594",
                "label": "INP VARICELLA AB"
              }
            }
          ],
          "requesting_location-63_04": {
            "id": "44-163",
            "label": "MED. ASSESSMENT_MOT 0000"
          },
          "hcp-63_04": {
            "id": "6-485",
            "label": "POOH,WINNIE"
          },
          "accession-63_04": "fake text",
          "lab_archive_date-63_04": {
            "type": "xsd:date",
            "value": "1990-01-01"
          },
          "label": "1990-01-01T00:00:00Z",
          "type": "chcss:63_04",
          "id": "63_04-9999999.836399_000007"
        },
        {
          "date_time_specimen_taken-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "login_date_time-63_04": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "collection_sample-63_04": {
            "id": "62-3",
            "label": "BLOOD"
          },
          "lab_work_element-63_04": {
            "id": "44-966",
            "label": "LABORATORY BMC 0000"
          },
          "specimen-63_04": {
            "id": "61-70",
            "label": "BLOOD"
          },
          "result-63_04[a][b][c]": [
            {
              "enter_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-3428",
                "label": "INPROCESSING SICKLE CELL TEST"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "label": "N",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "N",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-13553735",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-3428_9999999.1111_000007",
              "lab_method-11_07": {
                "id": "8710-1425",
                "label": "INPROCESSING SICKLE CELL TEST"
              }
            },
            {
              "enter_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-3475",
                "label": "INPROCESSING RPR"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "label": "N",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "N",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-13553735",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-3475_9999999.1111_000007",
              "lab_method-11_07": {
                "id": "8710-1468",
                "label": "INPROCESSING RPR"
              }
            },
            {
              "enter_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-3484",
                "label": "INPROCESSING G6PD"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "label": "N",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "N",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-13553735",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-3484_9999999.1111_000007",
              "lab_method-11_07": {
                "id": "8710-1474",
                "label": "INPROCESSING G6PD"
              }
            },
            {
              "enter_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-4102",
                "label": "INPROCESSING ABO"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "label": "AB",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "AB",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-13553735",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-4102_9999999.1111_000007",
              "lab_method-11_07": {
                "id": "8710-2036",
                "label": "INPROCESSING ABO ONLY"
              }
            },
            {
              "enter_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "initial_viewer_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "test-11_07": {
                "id": "60-4103",
                "label": "INPROCESSING RH"
              },
              "rnr_action-11_07": {
                "id": "chcss:11_07__18_E-INITIALED",
                "label": "INITIALED"
              },
              "certify_person-11_07": {
                "id": "3-55555",
                "label": "MOUSE,MICKEY"
              },
              "label": "POS",
              "initial_viewer-11_07": {
                "id": "3-333333",
                "label": "BUNNY,BUGS"
              },
              "result-11_07": "POS",
              "certify_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "order_task-11_07": {
                "id": "107-13553735",
                "label": "1990-01-01T00:00:00Z"
              },
              "enter_date_time-11_07": {
                "type": "xsd:dateTime",
                "value": "1990-01-01T00:00:00"
              },
              "rnr_hcp-11_07": {
                "id": "6-33333",
                "label": "BUNNY,BUGS"
              },
              "type": "chcss:11_07",
              "id": "11_07-4103_9999999.1111_000007",
              "lab_method-11_07": {
                "id": "8710-2037",
                "label": "INPROCESSING RH"
              }
            }
          ],
          "requesting_location-63_04": {
            "id": "44-163",
            "label": "MED. ASSESSMENT_MOT 0000"
          },
          "hcp-63_04": {
            "id": "6-485",
            "label": "POOH,WINNIE"
          },
          "accession-63_04": "fake text",
          "lab_archive_date-63_04": {
            "type": "xsd:date",
            "value": "1990-01-01"
          },
          "label": "1990-01-01T00:00:00Z",
          "type": "chcss:63_04",
          "id": "63_04-9999999.1111_000007"
        }
      ],
      "patient-63": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "type": "chcss:63"
    }, // next line 1422
//  ]
//}

//#################### medsinp ###################
//{
//  "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
//  "@graph": [
    {
      "_id": "55-000007",
      "name-55": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "type": "chcss:55",
      "label": "BUNNY,BUGS"
    }, // next line 1438
//   ]
// }

// #################### medsop ###################
// {
//   "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
//  "@graph": [
    {
      "_id": "52-5915650",
      "comments-52": "NONE",
      "date_time_received_from_oe-52": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "meprs_code-52": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "logged_by-52": {
        "id": "3-55555",
        "label": "MOUSE,MICKEY"
      },
      "order_date_time-52": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "fill_dates-52": [
        {
          "qty-52_01": "60",
          "fill_cost_flag-52_01": {
            "id": "chcss:52_01_16_E-PDTS",
            "label": "PDTS"
          },
          "outpatient_site-52_01": {
            "id": "59_2-3",
            "label": "USS LADY GAGA (0000)"
          },
          "oib_suspense-52_01": {
            "id": "chcss:52_01_1_02_E-Added_to_the_Suspense_file",
            "label": "Added_to_the_Suspense_file"
          },
          "mtf_division-52_01": {
            "id": "40_8-4",
            "label": "XANADU HC 0000"
          },
          "id": "52_01-1_5915650",
          "action-52_01": {
            "id": "chcss:52_01_7_E-ORIGINAL_FILL",
            "label": "ORIGINAL_FILL"
          },
          "label": "1990-01-01T00:00:00Z",
          "suspense-52_01": {
            "id": "chcss:52_01_10_E-SUSPENSE_WARNING_LABELS",
            "label": "SUSPENSE_WARNING_LABELS"
          },
          "fill_cost-52_01": "2.77",
          "pdts_collection-52_01": {
            "id": "8216-1111111",
            "label": "1111111"
          },
          "workload_counted-52_01": {
            "id": "chcss:52_01_14_E-YES__WORKLOAD_WAS_COUNTED",
            "label": "YES__WORKLOAD_WAS_COUNTED"
          },
          "logged_by-52_01": {
            "id": "3-55555",
            "label": "MOUSE,MICKEY"
          },
          "type": "chcss:52_01",
          "meprs_code-52_01": {
            "id": "8119-490",
            "label": "BHFJ"
          },
          "pdts_date_filled-52_01": {
            "type": "xsd:date",
            "value": "1990-01-01"
          },
          "oib_ascii_disposition-52_01": {
            "id": "chcss:52_01_1_03_E-Not_billable",
            "label": "Not_billable"
          },
          "pdts_pharmacy_number-52_01": "1471200",
          "fill_number-52_01": "1",
          "pdts_fill_cost-52_01": "2.77",
          "fill_dates-52_01": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "pdts_sent-52_01": {
            "id": "chcss:52_01_2_01_E-Message_Sent_to_PDTS",
            "label": "Message_Sent_to_PDTS"
          }
        }
      ],
      "refills-52": "0",
      "days_supply-52": "30",
      "status-52": {
        "id": "chcss:52__11_E-DISCONTINUED",
        "label": "DISCONTINUED"
      },
      "label": "R2222222",
      "sig-52": "T1 TAB PO BID TAT #60",
      "pdts_prescription_number-52": "2420043",
      "provider-52": {
        "id": "6-77777",
        "label": "SAILOR,POPEYE"
      },
      "type": "chcss:52",
      "mtf_division-52": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "refills_remaining-52": "0",
      "login_date-52": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "order_entry_number-52": "051101-00181",
      "drug-52": {
        "sameAs": "nddf:cdc008879",
        "sameAsLabel": "PENICILLIN VK 250 MG TABLET",
        "id": "50-907",
        "label": "D-PENICILLIN VK 250MG TAB ($0.00)"
      },
      "refill_control-52": "0",
      "expiration_date-52": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "outpatient_site-52": {
        "id": "59_2-3",
        "label": "USS LADY GAGA (0000)"
      },
      "child_resistant_cont-52": true,
      "order_pointer-52": {
        "id": "101-12323465",
        "label": "051101-00181"
      },
      "patient-52": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "activity_log-52": [
        {
          "activity_log-52_00": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "type": "chcss:52_00",
          "remarks-52_00": "fake text",
          "label": "1990-01-01T00:00:00Z",
          "reason_code-52_00": {
            "id": "52_3-100",
            "label": "MODIFIED"
          },
          "logged_by-52_00": {
            "id": "3-8888",
            "label": "BIRD,TWEETY"
          },
          "pharmacy_site-52_00": {
            "id": "59_2-12",
            "label": "LADY GAGA PHARMACY"
          },
          "user_comments-52_00": "fake text",
          "id": "52_00-1_5915650"
        }
      ],
      "fill_expiration-52": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "rx_-52": "R2222222",
      "qty-52": "60"
    },
    {
      "_id": "52-5916846",
      "last_fill_date-52": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "comments-52": "NONE",
      "parent_prescription-52": {
        "id": "52-5915650",
        "label": "R2222222"
      },
      "last_dispensing_pharmacy-52": {
        "id": "59_2-12",
        "label": "LADY GAGA PHARMACY"
      },
      "days_supply-52": "30",
      "meprs_code-52": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "logged_by-52": {
        "id": "3-8888",
        "label": "BIRD,TWEETY"
      },
      "fill_dates-52": [
        {
          "qty-52_01": "60",
          "fill_cost_flag-52_01": {
            "id": "chcss:52_01_16_E-PDTS",
            "label": "PDTS"
          },
          "outpatient_site-52_01": {
            "id": "59_2-12",
            "label": "LADY GAGA PHARMACY"
          },
          "oib_suspense-52_01": {
            "id": "chcss:52_01_1_02_E-Added_to_the_Suspense_file",
            "label": "Added_to_the_Suspense_file"
          },
          "mtf_division-52_01": {
            "id": "40_8-4",
            "label": "XANADU HC 0000"
          },
          "id": "52_01-1_5916846",
          "action-52_01": {
            "id": "chcss:52_01_7_E-ORIGINAL_FILL",
            "label": "ORIGINAL_FILL"
          },
          "label": "1990-01-01T00:00:00Z",
          "suspense-52_01": {
            "id": "chcss:52_01_10_E-PRINTED_WARNING_LABELS",
            "label": "PRINTED_WARNING_LABELS"
          },
          "fill_cost-52_01": "2.77",
          "pdts_collection-52_01": {
            "id": "8216-6954238",
            "label": "6954238"
          },
          "workload_counted-52_01": {
            "id": "chcss:52_01_14_E-YES__WORKLOAD_WAS_COUNTED",
            "label": "YES__WORKLOAD_WAS_COUNTED"
          },
          "logged_by-52_01": {
            "id": "3-8888",
            "label": "BIRD,TWEETY"
          },
          "type": "chcss:52_01",
          "meprs_code-52_01": {
            "id": "8119-490",
            "label": "BHFJ"
          },
          "pdts_date_filled-52_01": {
            "type": "xsd:date",
            "value": "1990-01-01"
          },
          "pdts_pharmacy_number-52_01": "1471212",
          "label_print_date_time-52_01": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "fill_number-52_01": "1",
          "pdts_fill_cost-52_01": "2.77",
          "message_type_51-52_01": {
            "id": "chcss:52_01_2_11_E-BILLING",
            "label": "BILLING"
          },
          "fill_dates-52_01": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "pdts_sent-52_01": {
            "id": "chcss:52_01_2_01_E-Message_Sent_to_PDTS",
            "label": "Message_Sent_to_PDTS"
          },
          "ncpdp_version_number-52_01": {
            "id": "chcss:52_01_2_1_E-5_1",
            "label": "5_1"
          }
        }
      ],
      "refills-52": "0",
      "expanded_sig-52": "TAKE ONE TABLET BY MOUTH~TWICE A DAY TILL ALL TAKEN~~",
      "status-52": {
        "id": "chcss:52__11_E-EXPIRED",
        "label": "EXPIRED"
      },
      "last_label_print_date-52": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "pharmacy_originated-52": true,
      "label": "B0000000",
      "sig-52": "T1 TAB PO BID TAT ",
      "pdts_prescription_number-52": "2421225",
      "provider-52": {
        "id": "6-77777",
        "label": "SAILOR,POPEYE"
      },
      "type": "chcss:52",
      "mtf_division-52": {
        "id": "40_8-4",
        "label": "XANADU HC 0000"
      },
      "refills_remaining-52": "0",
      "login_date-52": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "order_entry_number-52": "051101-03213",
      "drug-52": {
        "sameAs": "nddf:cdc008879",
        "sameAsLabel": "PENICILLIN VK 250 MG TABLET",
        "id": "50-907",
        "label": "D-PENICILLIN VK 250MG TAB ($0.00)"
      },
      "refill_control-52": "0",
      "expiration_date-52": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "outpatient_site-52": {
        "id": "59_2-12",
        "label": "LADY GAGA PHARMACY"
      },
      "child_resistant_cont-52": true,
      "order_pointer-52": {
        "id": "101-12326497",
        "label": "051101-03213"
      },
      "label_width-52": "27",
      "patient-52": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "activity_log-52": [
        {
          "activity_log-52_00": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "type": "chcss:52_00",
          "remarks-52_00": "",
          "label": "1990-01-01T00:00:00Z",
          "reason_code-52_00": {
            "id": "52_3-211",
            "label": "TRANSMIT"
          },
          "logged_by-52_00": {
            "id": "3-8888",
            "label": "BIRD,TWEETY"
          },
          "pharmacy_site-52_00": {
            "id": "59_2-12",
            "label": "LADY GAGA PHARMACY"
          },
          "associated_fill_number-52_00": "1",
          "user_comments-52_00": "fake text",
          "id": "52_00-1_5916846"
        },
        {
          "activity_log-52_00": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "type": "chcss:52_00",
          "remarks-52_00": "fake text",
          "label": "1990-01-01T00:00:00Z",
          "reason_code-52_00": {
            "id": "52_3-100",
            "label": "MODIFIED"
          },
          "logged_by-52_00": {
            "id": "3-8888",
            "label": "BIRD,TWEETY"
          },
          "pharmacy_site-52_00": {
            "id": "59_2-12",
            "label": "LADY GAGA PHARMACY"
          },
          "user_comments-52_00": "fake text",
          "id": "52_00-2_5916846"
        },
        {
          "remarks-52_00": "",
          "activity_log-52_00": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "label": "1990-01-01T00:00:00Z",
          "reason_code-52_00": {
            "id": "52_3-215",
            "label": "COMPLETE"
          },
          "logged_by-52_00": {
            "id": "3-8888",
            "label": "BIRD,TWEETY"
          },
          "pharmacy_site-52_00": {
            "id": "59_2-10",
            "label": "LADY GAGA PHARMACY"
          },
          "associated_fill_number-52_00": "1",
          "type": "chcss:52_00",
          "id": "52_00-3_5916846"
        }
      ],
      "fill_expiration-52": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "rx_-52": "B0000000",
      "qty-52": "60"
    }, // next line 1845
//  ]
// }

// #################### orders ###################
// {
//  "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
//  "@graph": [
    {
      "_id": "101-12317623",
      "lab_processing_priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "nurse_sig-101": {
        "id": "6-11111",
        "label": "DUCK,DONALD"
      },
      "earliest_task_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "collection_method-101": {
        "id": "chcss:101_110_03_E-WARD_CLINIC_COLLECT___DELIVER",
        "label": "WARD_CLINIC_COLLECT___DELIVER"
      },
      "collection_sample-101": {
        "id": "62-324",
        "label": "MARBLE-BLOOD"
      },
      "date_time_of_collection-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "nurse_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "label": "051028-04099",
      "meprs_code-101": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "unexpanded_times-101": "NOW",
      "activity-101": {
        "id": "chcss:101_2_01_E-INACTIVE",
        "label": "INACTIVE"
      },
      "nonmodifiable-101": {
        "id": "chcss:101_3_02_E-NONMODIFIABLE",
        "label": "NONMODIFIABLE"
      },
      "user_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "origin_of_order-101": {
        "id": "chcss:101_1_15_E-VERBAL",
        "label": "VERBAL"
      },
      "inactive_status-101": {
        "id": "chcss:101_2_03_E-RESULTED",
        "label": "RESULTED"
      },
      "order_type-101": {
        "id": "102-4",
        "label": "LAB"
      },
      "type": "chcss:101",
      "user_sig-101": {
        "id": "3-11111",
        "label": "DUCK,DONALD"
      },
      "stop_expiration_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient-101": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "order_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "ordering_hcp-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      },
      "patient_location-101": {
        "id": "44-163",
        "label": "MED. ASSESSMENT_MOT 0000"
      },
      "resulted_task_flag-101": {
        "id": "chcss:101_161_E-1",
        "label": "1"
      },
      "lab_test-101": {
        "id": "60-175",
        "label": "GLUCOSE"
      },
      "schedule_type-101": {
        "id": "chcss:101_5_06_E-NOW",
        "label": "NOW"
      },
      "priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "display_text-101": " GLUCOSE~WARD/CLINIC COLLECT~MARBLE-BLOOD~MARBLE  on 01 JAN 1990@0000",
      "batch_id_number-101": "051028-02294",
      "in_outpatient-101": {
        "id": "chcss:101__04_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "start_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "hcp_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "administration_times-101": "1636",
      "id_number-101": "051028-04099",
      "hcp_sig-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      }
    },
    {
      "_id": "101-12317624",
      "lab_processing_priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "nurse_sig-101": {
        "id": "6-11111",
        "label": "DUCK,DONALD"
      },
      "earliest_task_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "collection_method-101": {
        "id": "chcss:101_110_03_E-WARD_CLINIC_COLLECT___DELIVER",
        "label": "WARD_CLINIC_COLLECT___DELIVER"
      },
      "collection_sample-101": {
        "id": "62-324",
        "label": "MARBLE-BLOOD"
      },
      "date_time_of_collection-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "nurse_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "label": "051028-04100",
      "meprs_code-101": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "unexpanded_times-101": "NOW",
      "activity-101": {
        "id": "chcss:101_2_01_E-INACTIVE",
        "label": "INACTIVE"
      },
      "nonmodifiable-101": {
        "id": "chcss:101_3_02_E-NONMODIFIABLE",
        "label": "NONMODIFIABLE"
      },
      "user_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "origin_of_order-101": {
        "id": "chcss:101_1_15_E-VERBAL",
        "label": "VERBAL"
      },
      "inactive_status-101": {
        "id": "chcss:101_2_03_E-RESULTED",
        "label": "RESULTED"
      },
      "order_type-101": {
        "id": "102-4",
        "label": "LAB"
      },
      "type": "chcss:101",
      "user_sig-101": {
        "id": "3-11111",
        "label": "DUCK,DONALD"
      },
      "stop_expiration_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient-101": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "order_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "ordering_hcp-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      },
      "patient_location-101": {
        "id": "44-163",
        "label": "MED. ASSESSMENT_MOT 0000"
      },
      "resulted_task_flag-101": {
        "id": "chcss:101_161_E-1",
        "label": "1"
      },
      "lab_test-101": {
        "id": "60-3618",
        "label": "INPROCESSING VARICELLA AB"
      },
      "schedule_type-101": {
        "id": "chcss:101_5_06_E-NOW",
        "label": "NOW"
      },
      "priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "display_text-101": " INPROCESSING VARICELLA AB~WARD/CLINIC COLLECT~MARBLE-BLOOD~MARBLE  on 01 Jan 1990@0000",
      "batch_id_number-101": "051028-02294",
      "in_outpatient-101": {
        "id": "chcss:101__04_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "start_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "hcp_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "administration_times-101": "1636",
      "id_number-101": "051028-04100",
      "hcp_sig-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      }
    },
    {
      "_id": "101-12317625",
      "lab_processing_priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "nurse_sig-101": {
        "id": "6-11111",
        "label": "DUCK,DONALD"
      },
      "earliest_task_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "collection_method-101": {
        "id": "chcss:101_110_03_E-WARD_CLINIC_COLLECT___DELIVER",
        "label": "WARD_CLINIC_COLLECT___DELIVER"
      },
      "collection_sample-101": {
        "id": "62-3",
        "label": "BLOOD"
      },
      "date_time_of_collection-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "nurse_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "label": "051028-04101",
      "meprs_code-101": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "unexpanded_times-101": "NOW",
      "activity-101": {
        "id": "chcss:101_2_01_E-INACTIVE",
        "label": "INACTIVE"
      },
      "nonmodifiable-101": {
        "id": "chcss:101_3_02_E-NONMODIFIABLE",
        "label": "NONMODIFIABLE"
      },
      "user_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "origin_of_order-101": {
        "id": "chcss:101_1_15_E-VERBAL",
        "label": "VERBAL"
      },
      "inactive_status-101": {
        "id": "chcss:101_2_03_E-RESULTED",
        "label": "RESULTED"
      },
      "order_type-101": {
        "id": "102-4",
        "label": "LAB"
      },
      "type": "chcss:101",
      "user_sig-101": {
        "id": "3-11111",
        "label": "DUCK,DONALD"
      },
      "stop_expiration_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient-101": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "order_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "ordering_hcp-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      },
      "patient_location-101": {
        "id": "44-163",
        "label": "MED. ASSESSMENT_MOT 0000"
      },
      "resulted_task_flag-101": {
        "id": "chcss:101_161_E-1",
        "label": "1"
      },
      "lab_test-101": {
        "id": "60-5289",
        "label": "0000 INPROCESSING PANEL01JAN90"
      },
      "schedule_type-101": {
        "id": "chcss:101_5_06_E-NOW",
        "label": "NOW"
      },
      "priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "display_text-101": " 0000 INPROCESSING PANEL01JAN90~WARD/CLINIC COLLECT & DELIVER~BLOOD~LAV  on 01 Jan 1990@0000",
      "batch_id_number-101": "051028-02294",
      "in_outpatient-101": {
        "id": "chcss:101__04_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "start_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "hcp_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "administration_times-101": "1636",
      "id_number-101": "051028-04101",
      "hcp_sig-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      }
    },
    {
      "_id": "101-12317626",
      "lab_processing_priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "nurse_sig-101": {
        "id": "6-11111",
        "label": "DUCK,DONALD"
      },
      "earliest_task_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "collection_method-101": {
        "id": "chcss:101_110_03_E-WARD_CLINIC_COLLECT___DELIVER",
        "label": "WARD_CLINIC_COLLECT___DELIVER"
      },
      "collection_sample-101": {
        "id": "62-166",
        "label": "URINE"
      },
      "date_time_of_collection-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "nurse_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "label": "051028-04102",
      "meprs_code-101": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "unexpanded_times-101": "NOW",
      "activity-101": {
        "id": "chcss:101_2_01_E-INACTIVE",
        "label": "INACTIVE"
      },
      "nonmodifiable-101": {
        "id": "chcss:101_3_02_E-NONMODIFIABLE",
        "label": "NONMODIFIABLE"
      },
      "user_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "origin_of_order-101": {
        "id": "chcss:101_1_15_E-VERBAL",
        "label": "VERBAL"
      },
      "inactive_status-101": {
        "id": "chcss:101_2_03_E-RESULTED",
        "label": "RESULTED"
      },
      "order_type-101": {
        "id": "102-4",
        "label": "LAB"
      },
      "type": "chcss:101",
      "user_sig-101": {
        "id": "3-11111",
        "label": "DUCK,DONALD"
      },
      "stop_expiration_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient-101": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "order_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "ordering_hcp-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      },
      "patient_location-101": {
        "id": "44-163",
        "label": "MED. ASSESSMENT_MOT 0000"
      },
      "resulted_task_flag-101": {
        "id": "chcss:101_161_E-1",
        "label": "1"
      },
      "lab_test-101": {
        "id": "60-3429",
        "label": "INPROCESSING CHLAMYDIA SCREEN"
      },
      "schedule_type-101": {
        "id": "chcss:101_5_06_E-NOW",
        "label": "NOW"
      },
      "priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "display_text-101": " INPROCESSING CHLAMYDIA SCREEN~WARD/CLINIC COLLECT~URINE  on 01 Jan 1990@0000",
      "batch_id_number-101": "051028-02294",
      "in_outpatient-101": {
        "id": "chcss:101__04_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "start_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "hcp_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "administration_times-101": "0000",
      "id_number-101": "900101-04102",
      "hcp_sig-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      }
    },
    {
      "_id": "101-12317627",
      "lab_processing_priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "nurse_sig-101": {
        "id": "6-11111",
        "label": "DUCK,DONALD"
      },
      "earliest_task_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "collection_method-101": {
        "id": "chcss:101_110_03_E-WARD_CLINIC_COLLECT___DELIVER",
        "label": "WARD_CLINIC_COLLECT___DELIVER"
      },
      "collection_sample-101": {
        "id": "62-319",
        "label": "HIV TUBE"
      },
      "date_time_of_collection-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "nurse_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "label": "051028-04103",
      "meprs_code-101": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "unexpanded_times-101": "NOW",
      "activity-101": {
        "id": "chcss:101_2_01_E-INACTIVE",
        "label": "INACTIVE"
      },
      "nonmodifiable-101": {
        "id": "chcss:101_3_02_E-NONMODIFIABLE",
        "label": "NONMODIFIABLE"
      },
      "user_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "origin_of_order-101": {
        "id": "chcss:101_1_15_E-VERBAL",
        "label": "VERBAL"
      },
      "inactive_status-101": {
        "id": "chcss:101_2_03_E-RESULTED",
        "label": "RESULTED"
      },
      "order_type-101": {
        "id": "102-4",
        "label": "LAB"
      },
      "type": "chcss:101",
      "order_required_data-101": [
        {
          "display_order-101_11": "1",
          "order_required_data-101_11": {
            "id": "103_2-10",
            "label": "HIV SPECIMEN SOURCE"
          },
          "label": "HIV SPECIMEN SOURCE",
          "user_response-101_11": "8",
          "type": "chcss:101_11",
          "id": "101_11-10_12317627"
        }
      ],
      "user_sig-101": {
        "id": "3-11111",
        "label": "DUCK,DONALD"
      },
      "stop_expiration_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "patient-101": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "order_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "ordering_hcp-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      },
      "patient_location-101": {
        "id": "44-163",
        "label": "MED. ASSESSMENT_MOT 0000"
      },
      "resulted_task_flag-101": {
        "id": "chcss:101_161_E-1",
        "label": "1"
      },
      "lab_test-101": {
        "id": "60-4220",
        "label": "HIV-1 AB"
      },
      "schedule_type-101": {
        "id": "chcss:101_5_06_E-NOW",
        "label": "NOW"
      },
      "priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "display_text-101": " HIV-1 AB~WARD/CLINIC COLLECT~HIV TUBE~HIV TUBE  on 01 Jan 1990@0000",
      "batch_id_number-101": "051028-02294",
      "in_outpatient-101": {
        "id": "chcss:101__04_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "start_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "hcp_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "administration_times-101": "1636",
      "id_number-101": "051028-04103",
      "hcp_sig-101": {
        "id": "6-111",
        "label": "POOH,WINNIE"
      }
    },
    {
      "_id": "101-12323465",
      "dispensing_pharmacy-101": {
        "id": "59_2-3",
        "label": "USS LADY GAGA (0000)"
      },
      "earliest_task_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "outpat_med_order_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "order_modified-101": {
        "id": "chcss:101_3_01_E-ORDER_MODIFIED",
        "label": "ORDER_MODIFIED"
      },
      "drug_unit-101": "EA",
      "origin_of_order-101": {
        "id": "chcss:101_1_15_E-HANDWRITTEN",
        "label": "HANDWRITTEN"
      },
      "meprs_code-101": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "days_supply-101": "30",
      "activity-101": {
        "id": "chcss:101_2_01_E-INACTIVE",
        "label": "INACTIVE"
      },
      "outpat_med_expiration_date-101": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "resulted_task_flag-101": {
        "id": "chcss:101_161_E-1",
        "label": "1"
      },
      "user_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "label": "051101-00181",
      "inactive_status-101": {
        "id": "chcss:101_2_03_E-DISCONTINUED",
        "label": "DISCONTINUED"
      },
      "status_change-101": [
        {
          "comment-101_05": "0000",
          "change-101_05": {
            "id": "112-12",
            "label": "PHR_MODIFY"
          },
          "user-101_05": {
            "id": "3-8888",
            "label": "BIRD,TWEETY"
          },
          "status_change-101_05": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "label": "1990-01-01T00:00:00Z",
          "type": "chcss:101_05",
          "id": "101_05-1_12323465"
        }
      ],
      "order_type-101": {
        "id": "102-9",
        "label": "RX"
      },
      "quantity-101": "60",
      "type": "chcss:101",
      "_refills-101": "0",
      "user_sig-101": {
        "id": "3-20004",
        "label": "MOUSE,MICKEY"
      },
      "stop_expiration_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "pdts_prescription_number-101": "2420043",
      "patient-101": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "qa_event_date-101": [
        {
          "justification_authorizing-101_03": "fake text",
          "qa_event_date-101_03": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "label": "1990-01-01T00:00:00Z",
          "warning_message-101_03": "fake text",
          "type": "chcss:101_03",
          "id": "101_03-1_12323465",
          "qa_event_type-101_03": {
            "id": "102_1-30",
            "label": "PDTS-STATUS"
          }
        },
        {
          "justification_authorizing-101_03": "fake text",
          "qa_event_date-101_03": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "label": "1990-01-01T00:00:00Z",
          "warning_message-101_03": "fake text",
          "type": "chcss:101_03",
          "id": "101_03-2_12323465",
          "qa_event_type-101_03": {
            "id": "102_1-30",
            "label": "PDTS-STATUS"
          }
        }
      ],
      "order_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "medication_profile-101": {
        "id": "8810_3-4602341",
        "label": "PENICILLIN VK 250MG TAB ($0.00)--PO 250M"
      },
      "ordering_hcp-101": {
        "id": "6-77777",
        "label": "SAILOR,POPEYE"
      },
      "pdts_date_filled-101": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "patient_location-101": {
        "id": "44-163",
        "label": "MED. ASSESSMENT_MOT 0000"
      },
      "expanded_sig-101": "TAKE ONE TABLET BY MOUTH TWICE A DAY TILL ALL TAKEN ",
      "inpatient_sig-101": "T1 TAB PO BID TAT #60",
      "child_resistant_container-101": true,
      "priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "medication-101": {
        "sameAs": "nddf:cdc008879",
        "sameAsLabel": "PENICILLIN VK 250 MG TABLET",
        "id": "50-907",
        "label": "D-PENICILLIN VK 250MG TAB ($0.00)"
      },
      "pdts_collection-101": {
        "id": "8216-1111111",
        "label": "1111111"
      },
      "pdts_fill_cost-101": "2.77",
      "display_text-101": " PENICILLIN VK 250MG TAB ($0.00)--PO 250M~T1 TAB PO BID TAT RF0 #60 DS30  on 01 Jan 1990@0000",
      "batch_id_number-101": "051101-00178",
      "in_outpatient-101": {
        "id": "chcss:101__04_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "start_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "hcp_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "id_number-101": "051101-00181",
      "pdts_pharmacy_number-101": "1471200",
      "hcp_sig-101": {
        "id": "6-77777",
        "label": "SAILOR,POPEYE"
      }
    },
    {
      "_id": "101-12326497",
      "dispensing_pharmacy-101": {
        "id": "59_2-12",
        "label": "LADY GAGA PHARMACY"
      },
      "earliest_task_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "parent-101": {
        "id": "101-12323465",
        "label": "051101-00181"
      },
      "outpat_med_order_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "label": "051101-03213",
      "meprs_code-101": {
        "id": "8119-490",
        "label": "BHFJ"
      },
      "days_supply-101": "30",
      "activity-101": {
        "id": "chcss:101_2_01_E-INACTIVE",
        "label": "INACTIVE"
      },
      "outpat_med_expiration_date-101": {
        "type": "xsd:date",
        "value": "1990-01-01"
      },
      "inpatient_sig-101": "T1 TAB PO BID TAT ",
      "user_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "origin_of_order-101": {
        "id": "chcss:101_1_15_E-PHARMACY",
        "label": "PHARMACY"
      },
      "inactive_status-101": {
        "id": "chcss:101_2_03_E-DISCONTINUED",
        "label": "DISCONTINUED"
      },
      "status_change-101": [
        {
          "authorizing_hcp-101_05": {
            "id": "6-77777",
            "label": "SAILOR,POPEYE"
          },
          "change-101_05": {
            "id": "112-6",
            "label": "DISCONTINUED due to Expiration"
          },
          "user-101_05": {
            "id": "3-8888",
            "label": "BIRD,TWEETY"
          },
          "status_change-101_05": {
            "type": "xsd:dateTime",
            "value": "1990-01-01T00:00:00"
          },
          "label": "1990-01-01T00:00:00Z",
          "type": "chcss:101_05",
          "id": "101_05-1_12326497"
        }
      ],
      "order_type-101": {
        "id": "102-9",
        "label": "RX"
      },
      "type": "chcss:101",
      "_refills-101": "0",
      "user_sig-101": {
        "id": "3-8888",
        "label": "BIRD,TWEETY"
      },
      "stop_expiration_date-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "child_resistant_container-101": true,
      "patient-101": {
        "id": "2-000007",
        "label": "BUNNY,BUGS"
      },
      "order_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "medication_profile-101": {
        "id": "8810_3-4602779",
        "label": "PENICILLIN VK 250MG TAB ($0.00)--PO 250M"
      },
      "ordering_hcp-101": {
        "id": "6-77777",
        "label": "SAILOR,POPEYE"
      },
      "patient_location-101": {
        "id": "44-1009",
        "label": "COURAGE (WHITE) 0000"
      },
      "quantity-101": "60",
      "priority-101": {
        "id": "102_3-9",
        "label": "ROUTINE"
      },
      "medication-101": {
        "sameAs": "nddf:cdc008879",
        "sameAsLabel": "PENICILLIN VK 250 MG TABLET",
        "id": "50-907",
        "label": "D-PENICILLIN VK 250MG TAB ($0.00)"
      },
      "display_text-101": " PENICILLIN VK 250MG TAB ($0.00)--PO 250M~T1 TAB PO BID TAT RF0 #60 DS30  on 01 Jan 1990@0000",
      "resulted_task_flag-101": {
        "id": "chcss:101_161_E-1",
        "label": "1"
      },
      "in_outpatient-101": {
        "id": "chcss:101__04_E-OUTPATIENT",
        "label": "OUTPATIENT"
      },
      "start_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "hcp_sig_date_time-101": {
        "type": "xsd:dateTime",
        "value": "1990-01-01T00:00:00"
      },
      "id_number-101": "051101-03213",
      "hcp_sig-101": {
        "id": "6-77777",
        "label": "SAILOR,POPEYE"
      }
    }
  ]
 }

// skip entire, no contents 
// #################### radiology ###################
//{
//  "@context": "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-pipeline/master/data/fake_chcs/context.json",
//  "@graph": []
// }
