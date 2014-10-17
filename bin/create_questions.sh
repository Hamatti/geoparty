#!/bin/bash

# Creates a subset of Jeopardy questions for a show number given as parameter
cat fullset.json | jq "[.[] | select(.show_number == \"$1\")]" > $1.json
mv $1.json ../questionsets/
