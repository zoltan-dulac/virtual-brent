#!/bin/bash

NOUNS=`cat brent.dat | tr '[A-Z]' '[a-z]' | wordpos get -n  |  grep -v "^#"  | egrep -v "^([0-9]+|[a-zA-Z]{1,2}|are)$" | tr '[A-Z]' '[a-z]' | sort -u`

(
  echo "var nounIndex = {"
  for i in $NOUNS
  do
    echo -n "'$i': ["
    grep -wni $i brent.dat | awk -F":" '{print $1}' | tr '
  ' ','
    echo "],"
  done
  echo "}"
) > js/nounIndex.js