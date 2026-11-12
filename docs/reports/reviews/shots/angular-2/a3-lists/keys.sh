#!/bin/bash
# keys.sh <scenario> [query]: trace both galleries and diff
E=docs/reports/reviews/shots/angular-2/a3-lists/keys
q=${2:-style=studio}; tag=$1-$(echo $q | tr '&=' '__')
node docs/reports/reviews/shots/angular-2/a3-lists/keys.mjs http://localhost:5301 $1 "$q" > $E/$tag.react.txt 2>&1
node docs/reports/reviews/shots/angular-2/a3-lists/keys.mjs http://localhost:5302 $1 "$q" > $E/$tag.angular.txt 2>&1
diff $E/$tag.react.txt $E/$tag.angular.txt > $E/$tag.diff
echo "$tag: $(wc -l < $E/$tag.diff)"
