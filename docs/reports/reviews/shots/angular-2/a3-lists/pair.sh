#!/bin/bash
# pair.sh <name> <path> <selector> <index> <steps...>: probe both galleries and diff
E=docs/reports/reviews/shots/angular-2/a3-lists/open
mkdir -p $E
name=$1; shift
node docs/reports/reviews/shots/angular-2/a3-lists/probe.mjs http://localhost:5301 "$@" > $E/$name.react.txt 2>&1
node docs/reports/reviews/shots/angular-2/a3-lists/probe.mjs http://localhost:5302 "$@" > $E/$name.angular.txt 2>&1
diff $E/$name.react.txt $E/$name.angular.txt > $E/$name.diff
echo "$name: $(wc -l < $E/$name.diff) diff lines"
