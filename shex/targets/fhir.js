/** patchIdentifierLinks - n3-api-specific execution of this SPARQL:
PREFIX fhir: <http://hl7.org/fhir/>
DELETE { ?patch fhir:link <tag:eric@w3.org,2016:PatchMe> }
INSERT { ?patch fhir:link ?link }
 WHERE {
  ?patch fhir:link <tag:eric@w3.org,2016:PatchMe> .
  ?referrer ?p0 ?patch .
  ?referrer a ?t .
  ?patch fhir:Identifier.value ?idValue .
  ?idValue <http://hl7.org/fhir/value> ?idValueValue .
  BIND(substr(str(?t), 21) AS ?fhirtype)
  BIND(IRI(concat("urn:local:fhir:", ?fhirtype, ?idValueValue)) AS ?link) 
}
example input: {
<urn:local:fhir:DiagnosticOrder/5678> a fhir:DiagnosticOrder ;
    fhir:DiagnosticOrder.specimen [ fhir:reference [ a fhir:Specimen ;
        fhir:Specimen.subject [ fhir:reference [ a fhir:Patient ;
            fhir:Patient.identifier [ a fhir:Identifier ;
                fhir:Identifier.system [ fhir:value "urn:local:fhir:Patient:" ] ;
                fhir:Identifier.value [ fhir:value "1234" ] ;
                fhir:link <tag:eric@w3.org,2016:PatchMe> ] ] ] ] ] ; # <-- from
    fhir:DiagnosticOrder.subject [ fhir:reference [ a fhir:Patient ;
        fhir:Patient.identifier [ a fhir:Identifier ;
            fhir:Identifier.system [ fhir:value "urn:local:fhir:Patient:" ] ;
            fhir:Identifier.value [ fhir:value "1234" ] ;
            fhir:link <tag:eric@w3.org,2016:PatchMe> ] ] ] .         # <-- from
}
example output: {
<urn:local:fhir:DiagnosticOrder/5678> a fhir:DiagnosticOrder;
    prov:wasDerivedFrom <http://a.example/path/5678>;
    fhir:DiagnosticOrder.specimen [ fhir:reference [ a fhir:Specimen ;
        fhir:Specimen.subject [ fhir:reference [ a fhir:Patient ;
        fhir:Patient.identifier [ a fhir:Identifier ;
            fhir:Identifier.system [ fhir:value "urn:local:fhir:Patient:" ] ;
            fhir:Identifier.value [ fhir:value "1234" ] ;
            fhir:link <urn:local:fhir:Patient/1234> ] ] ] ] ] ;      # <-- to
    fhir:DiagnosticOrder.subject [ fhir:reference [ a fhir:Patient ;
        fhir:Patient.identifier [ a fhir:Identifier ;
            fhir:Identifier.system [ fhir:value "urn:local:fhir:Patient:" ] ;
            fhir:Identifier.value [ fhir:value "1234" ] ;
            fhir:link <urn:local:fhir:Patient/1234> ] ] ] .          # <-- to
}
*/
var RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var PATCH_ME = "tag:eric@w3.org,2016:PatchMe";
var CreateRootBase = "urn:local:fhir:";
var N3 = require("n3");
var N3Util = N3.Util;
function patchIdentifierLinks (graph) {
    graph.find(null, "http://hl7.org/fhir/link", PATCH_ME).forEach(function (patchArc) {
        graph.find(null, null, patchArc.subject).forEach(function (referrerArc) {
            graph.find(referrerArc.subject, RDF_TYPE, null).forEach(function (referrerTypeArc) {
	        graph.find(patchArc.subject, "http://hl7.org/fhir/Identifier.value", null).forEach(function (idValueArc) {

	            graph.find(idValueArc.object, 
                               "http://hl7.org/fhir/value", null).forEach(function (idValueValueArc) {
	                graph.removeTriple(patchArc);
	                patchArc.object = CreateRootBase + 
                                          referrerTypeArc.object.substr("http://hl7.org/fhir/".length) + 
                                          "/" + N3Util.getLiteralValue(idValueValueArc.object);
	                graph.addTriple(patchArc);
	            });

	        });
            });
        });
    });
}

var myStaticBindings = { 
  "http://hokukahu.com/map/subject.idsystem":       "\"urn:local:fhir:Patient:\"",
  "http://hokukahu.com/map/order.idsystem":         "\"urn:local:fhir:DiagnosticOrder\"",
  "http://hokukahu.com/map/specimen.codesystem":    "\"urn:local:fhir:Specimen/\"",
  "http://hokukahu.com/map/container.codesystem":   "\"urn:local:fhir:Container/\"",
  "http://hokukahu.com/map/Observation.codesystem": "\"urn:local:fhir:Observation/\"",
};

module.exports = { targetFixup: patchIdentifierLinks, staticBindings: myStaticBindings };
