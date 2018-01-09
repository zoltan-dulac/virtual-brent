#!/bin/bash

NOUNS=`cat brent.dat | tr '[A-Z]' '[a-z]' | wordpos get -n  |  grep -v "^#"  | egrep -v "^([0-9]+|[a-zA-Z]{1,2}|are)$" | tr '[A-Z]' '[a-z]' | sort -u`

(
  echo "var nounIndex = {"
  for i in $NOUNS
  do
    echo -n "'$i': ["
    grep -wni $i brent.dat | awk -F":" '{printf("%d,", $1 - 1);}' 
    echo "],"
  done
  echo "}"
) > js/nounIndex.js