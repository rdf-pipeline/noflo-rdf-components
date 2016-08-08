# File:  clear-and-set-mgraph.ru
# If you make changes to this query, please check them into
# github under noflo-rdf-components/sparql/fhir
###########################################################
#
# Clear and set mGraph: , which is a metadata graph that 
# describes the patient data graphs present in the database.
#
# For each patient data graph such as
# <urn:local:MedicationDispense:1000008> 
# it adds the following metadata to mGraph: :
#
#   <urn:local:MedicationDispense:1000008> a meta:Graph ;
#       meta:patientId "1000008" ;
#       meta:fhirResourceType fhir:MedicationDispense .

PREFIX meta: <urn:meta#>
PREFIX mGraph: <urn:local:mGraph>
PREFIX graphPrefix: <urn:local:>

PREFIX fhir: <http://hl7.org/fhir/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

clear silent graph mGraph: ;

insert {
  graph mGraph: {
    ?g a meta:Graph ;
       meta:patientId ?patientId ;
       meta:fhirResourceType ?resourceType .
  }
}
where {
# select ?g ?gUri ?translatorResourcePatientId ?resourcePatientId ?resource ?patientId ?fhirPrefix ?resourceType {
  { select distinct ?g {
      graph ?g { ?s ?p ?v . }
    }}
  # ?graphPrefix = "urn:local:"
  bind( str( graphPrefix: ) as ?graphPrefix ) .
  # ?gUri = "urn:local:rdf-components%2Ftranslate-demographics-cmumps2fhir:Patient:2-000007"
  bind( str(?g) as ?gUri ) .
  # ?translatorResourcePatientId = "rdf-components%2Ftranslate-demographics-cmumps2fhir:Patient:2-000007"
  bind( strafter( ?gUri, ?graphPrefix ) as ?translatorResourcePatientId ) .
  # ?patientResource = "urn:local:rdf-components%2Ftranslate-demographics-cmumps2fhir:Patient:2-000007"
  bind( strafter( ?translatorResourcePatientId, ":" ) as ?resourcePatientId ) .
  # ?resource = "Patient"
  bind( strbefore( ?resourcePatientId, ":" ) as ?resource ) .
  # ?patientId = "2-000007"
  bind( strafter( ?resourcePatientId, ":" ) as ?patientId ) .
  filter( ?patientId != "" && ?resource != "" ) .
  # ?fhirPrefix = "http://hl7.org/fhir/"
  bind( str( fhir: ) as ?fhirPrefix ) .
  # ?resourceType = fhir:Patient
  bind( uri(concat( ?fhirPrefix, ?resource )) as ?resourceType ) .
}


