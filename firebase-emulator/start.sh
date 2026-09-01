#!/bin/sh
# Entrypoint for the `emulators` service in docker-compose.yml.
#
# This lives in a script rather than inline in the compose file on purpose: a YAML
# folded scalar (`command: >`) does NOT fold lines that are indented deeper than the
# first one, so a multi-line `sh -c "firebase emulators:start ..."` silently splits
# into separate commands and every flag after the first line is lost.
set -e

DATA_DIR=./firebase-emulator/data

# Firebase treats a missing --import directory as a fatal error, so the flag can only
# be passed once an export actually exists. On a clean checkout it must be omitted.
if [ -f "$DATA_DIR/firebase-export-metadata.json" ]; then
    echo "==> importing saved emulator state from $DATA_DIR"
    set -- --import="$DATA_DIR"
else
    echo "==> no saved state found; starting with an empty database"
    set --
fi

# --only keeps this minimal and, importantly, stops Firebase from starting the
# functions/pubsub/storage emulators declared in firebase.json. The functions source
# directory is not mounted into this container at all. The Emulator UI starts
# regardless of --only.
exec firebase emulators:start \
    --project tamushpemobileapp \
    --only firestore,auth \
    --export-on-exit="$DATA_DIR" \
    "$@"
