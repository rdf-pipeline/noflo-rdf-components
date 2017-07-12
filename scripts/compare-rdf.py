#!/usr/bin/env python

# Compare two RDF files (JSON-LD and/or TTL) using a canonical format.  
# Returns error code 0 if they match, 1 if they don't. 
#    usage: compare-rdf.py [-h] [-c] [-v] file1 file2
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
    parser = argparse.ArgumentParser(description="Compare two RDF files.  Files may be any mix of turtle or JSON-LD")

    # positional args
    parser.add_argument("file1", help="path to file to compare with second file")
    parser.add_argument("file2", help="path to file to compare with first file")

    # optional args (help is already preset - don't need here)
    parser.add_argument("-c", "--cmumps", help="apply cmumps prefixes on turtle files",
                        action="store_true")
    parser.add_argument("-v", "--verbose", help="print detailed processing messages",
                        action="store_true")

    return parser.parse_args()


# Loads JSON-LD and Turtle files into an RDF graph.
def getData(filepath, cmumps): 
    if filepath.endswith('.jsonld'):
	return Graph().parse(filepath, format='json-ld')

    if filepath.endswith('.ttl'):
        if cmumps:
            return Graph().parse(data="""PREFIX : <http://hokukahu.com/schema/cmumpss#>
                PREFIX cmumpss: <http://hokukahu.com/schema/cmumpss#>
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

# Process command line arguments
args = getArgs();
if args.verbose:
    print "Comparing files:", args.file1, "&", args.file2;

# Load file data into a graph and serialize it to turtle
ttl1 = getData(args.file1, args.cmumps).serialize(format='turtle') 
if args.verbose:
    print "File 1:\n",ttl1,"\n"

ttl2 = getData(args.file2, args.cmumps).serialize(format='turtle')
if args.verbose:
    print "File2:\n",ttl2,"\n"

# Compare the serialized turtle 
if ttl1 == ttl2: 
    print 'RDF in',args.file1,'&',args.file2,'matches!'
    sys.exit(0)

sys.exit('RDF in',args.file1,'&',args.file2,'does NOT match!');
