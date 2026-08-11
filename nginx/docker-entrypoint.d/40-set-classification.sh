#!/bin/sh
set -eu

: "${CLASSIFICATION:=UNAVAILABLE}"
: "${CLASSIFICATION_LABEL:=}"

printf '%s\n%s\n' \
    "${CLASSIFICATION}" \
    "${CLASSIFICATION_LABEL}" \
    > /usr/share/nginx/html/banner/banner-classification
