#!/usr/bin/env python

# Pretty print an RDF file (JSON-LD or TTL) using a serialized canonical format.  
#
# This script runs on Python 3 and rdflib.  You will need to install both since
# rdflib is not a default package.  You can find it here:
#    https://github.com/RDFLib/rdflib
#
# RDFlib uses the sphinx documentation tool - you will need to build it if you want
# details on it.  This is a helpful starter on Sphinx: 
#    http://www.sphinx-doc.org/en/stable/tutorial.html

from rdflib import Graph
import argparse
import sys

# Parse command line arguments
def getArgs(): 
    parser = argparse.ArgumentParser(description="Pretty print a JSON-LD or Turtle RDF as canonical Turtle")

    # positional args
    parser.add_argument("file", help="path to file to print")

    # optional args (help is already preset - don't need here)
    parser.add_argument("-c", "--chcs", help="apply chcs prefixes on turtle files",
                        action="store_true")

    return parser.parse_args()


# Loads JSON-LD and Turtle files into an RDF graph.
def getData(filepath, chcs): 
    if filepath.endswith('.jsonld'):
	return Graph().parse(filepath, format='json-ld')

    if filepath.endswith('.ttl'):
        if chcs:
            return Graph().parse(data="""PREFIX : <http://hokukahu.com/schema/chcss#>
                PREFIX chcss: <http://hokukahu.com/schema/chcss#>
                PREFIX cpt: <http://hokukahu.com/schema/cpt#>
                PREFIX fms: <http://datasets.caregraf.org/fms/>
                PREFIX hptc: <http://hokukahu.com/schema/hptc#>
                PREFIX icd9cm: <http://hokukahu.com/schema/icd9cm#>
                PREFIX loinc: <http://hokukahu.com/schema/loinc#>
                PREFIX ndc: <http://hokukahu.com/schema/ndc#>
                PREFIX nddf: <http://hokukahu.com/schema/nddf#>
                PREFIX npi: <http://hokukahu.com/schema/npi#>
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX xml: <http://www.w3.org/XML/1998/namespace>
                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                """, format='turtle').parse(filepath, format='turtle')
        else:
            return Graph().parse(filepath, format='turtle')

    sys.exit('Expected a .jsonld or a .ttl file');

# Main 
args = getArgs();
print "\n",getData(args.file, args.chcs).serialize(format='turtle') 
