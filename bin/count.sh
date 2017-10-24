#!/bin/bash

# Given a mongodb database, get a count of the total number of chcs mongodb collection attributes in the specified collections.
# This script relies on the mongodb-schema package to perform the attribute statistics gathering
#    https://www.npmjs.com/package/mongodb-schema
#
# It also relies on the bash jq utility to parse the generated JSON; this tool is available for both Linux and Mac systems,
# but may require installation.

DEFAULT_COLOR='\033[0m'
RED_FONT='\033[1;31m'

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MONGODB_SCHEMA="${CWD}/../node_modules/mongodb-schema/bin/mongodb-schema"
echo "MONGODB_SCHEMA: ${MONGODB_SCHEMA}"

function help() {
    echo ""
    echo "NAME"
    echo "  mongodb-schema.sh"
    echo ""
    echo "SYNOPSIS"
    echo " mongodb-schema.sh <mongo hostname or IP address> <database name> <mongo collection list file>"
    echo "                   [-h | --help]"
    echo "                   [-o | --output]"
    echo "                   [-p | --port]"
    echo ""
    echo "DESCRIPTION"
    echo "  Given a mongo DB host, a database name, and a file with the list of collections to analyze,"
    echo "  this tool counts of the total number of mongodb attributes in the specified collections."
    echo ""
    echo "  The mongo collection file should be a list of comma separated collection names."
    echo ""
    echo "OPTIONS"
    echo "  -o, --output file to which mongo collection statistics should be written."
    echo "               If no output file is specified, the file /tmp/mongodb-stats will be used."
    echo "  -p, --port   mongodb port"
    echo "               If no port is provided, the default 27017 mongo db port will be used."
    echo ""
}

function usage() {
  echo "usage: mongodb-schema.sh <mongo hostname or IP address> <database name> <mongo collection list file>"
  echo "                         [-h | --help]"
  echo "                         [-o | --output]"
  echo "                         [-p | --port]"
}

function check_required_arg() {
  REQ_ARG=$1
  ERRMSG=$2

  if [[ -z $REQ_ARG ]]; then
    echo -e "${RED_FONT}${ERRMSG}" >&2
    echo -e "${DEFAULT_COLOR}"
    usage;
  fi
}

function error_exit() {
    MESSAGE=$1
    echo -e "${RED_FONT}ERROR: ${MESSAGE}" >&2
    echo -e "${DEFAULT_COLOR}"
    usage
    exit 1
}

if [ "$#" -lt 3 ]; then
    case $1 in
       "-h"|"--help" ) help; exit 0;;
       *) echo -e "${RED_FONT}Expected a mongo host and collection" >&2; 
          echo -e "${DEFAULT_COLOR}"; 
          usage; 
          exit 1;;
  esac
fi

while [[ $# -gt 0 ]]; do
  opt="$1"
  shift;

  case "$opt" in
    "-h"|"--help"   ) help; exit 0;;
    "-o"|"--output" ) OUTPUT_FILE="$1"; shift;;
    "-p"|"--port"   ) PORT="$1"; shift;;
    "-*"            ) error_exit "Unknown command line argument $opt $1!";;
    *               ) if [[ -z $HOST ]]; then 
                         HOST="$opt"

                         if [[ "$1" == -*  ]]; then 
                             error_exit "Expected a database name!"
                         fi
                         DB_NAME="$1"
                         shift 

                         if [[ "$1" == -*  ]]; then 
                             error_exit "Expected a collection list file name!"
                         fi
                         COLLECTION_FILE="$1"
                         shift
                     else 
                         error_exit "Unexpected command line argument $opt $1!"
                     fi;;
      esac
done

check_required_arg "${HOST}" "Mongo DB host name or IP address is required!"
check_required_arg "${DB_NAME}" "Mongo DB database name is required!"
check_required_arg "${COLLECTION_FILE}" "Mongo DB collection list file is required!"

echo HOST=${HOST}
echo DB NAME=${DB_NAME}
echo COLLECTION FILE=${COLLECTION_FILE}

OUTPUT_FILE=${OUTPUT_FILE:-/tmp/mongodb-stats}
echo "OUTPUT FILE: $OUTPUT_FILE"

PORT=${PORT:-27017}
echo "Port: $PORT"

# Read the collectionNames list, split it by commas
TOTAL=0;
cat ${COLLECTION_FILE} | sed -n 1'p' | tr ',' '\n' | while read COLLECTION; do
  
    echo ""
    echo "Processing collection ${COLLECTION}"
    echo "${MONGODB_SCHEMA} 10.255.241.50:27017 chcs-NC.${COLLECTION} --stats true --values false  --number 1000 > ${OUTPUT_FILE}"
    `${MONGODB_SCHEMA} 10.255.241.50:27017 chcs-NC.${COLLECTION} --stats true --values false --number 1000 > ${OUTPUT_FILE}`
    NUM_FIELDS=`cat ${OUTPUT_FILE} | jq ".fields | length"`
    TOTAL=$((TOTAL + NUM_FIELDS))
    echo ""
    echo "TOTAL: ${TOTAL}"

    echo "Completed processing collection ${COLLECTION}"
done

