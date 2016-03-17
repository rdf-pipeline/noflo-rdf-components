# Clears and sets a metadata graph that
# describes the patient data graphs present in the database.
#
# For each patient data graph such as
# <urn:test:MedicationDispense:1000008> 
# it adds the following metadata to meta:graphs :
#
#   <urn:test:MedicationDispense:1000008> a meta:Graph ;
#       meta:patientId "1000008" ;
#       meta:fhirResourceType fhir:MedicationDispense .

PREFIX meta: <urn:meta#>
PREFIX graphPrefix: <urn:test:>

PREFIX fhir: <http://hl7.org/fhir/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

clear silent graph <{{{graph}}}> ;

insert {
  graph <{{{graph}}}> {
    ?g a meta:Graph ;
       meta:patientId ?patientId ;
       meta:fhirResourceType ?resourceType .
  }
}
where {
# select ?g ?gUri ?resourcePatientId ?resource ?patientId ?fhirPrefix ?resourceType {
  { select distinct ?g {
      graph ?g { ?s ?p ?v . }
    }}
  # ?graphPrefix = "urn:test:"
  bind( str( graphPrefix: ) as ?graphPrefix ) .
  # ?gUri = "urn:test:MedicationDispense:1000008"
  bind( str(?g) as ?gUri ) .
  # ?patientResource = "MedicationDispense:1000008"
  bind( strafter( ?gUri, ?graphPrefix ) as ?resourcePatientId ) .
  # ?resource = "MedicationDispense"
  bind( strbefore( ?resourcePatientId, ":" ) as ?resource ) .
  # ?patientId = "1000008"
  bind( strafter( ?resourcePatientId, ":" ) as ?patientId ) .
  filter( ?patientId != "" && ?resource != "" ) .
  # ?fhirPrefix = "http://hl7.org/fhir/"
  bind( str( fhir: ) as ?fhirPrefix ) .
  # ?resourceType = fhir:MedicationDispense
  bind( uri(concat( ?fhirPrefix, ?resource )) as ?resourceType ) .
}


