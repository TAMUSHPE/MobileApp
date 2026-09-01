# Dev container for the Firebase Emulator Suite (Firestore + Auth).
#
# This image does NOT build or run the Expo app. Metro and the native runtime stay
# on the host; only the backend the app talks to lives in here. See docker-compose.yml.
#
# No secrets are baked in and no real credentials are ever needed: the emulators
# ignore API keys and accept unauthenticated admin access from inside the network.
FROM node:20-slim

# The Firestore emulator is a Java program; the Emulator UI and Auth emulator are not.
# curl is used by the compose healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jre-headless curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# firebase-tools runs the emulators. firebase-admin is only used by the seed script,
# which talks to the emulators over the *_EMULATOR_HOST variables and so needs no
# service-account key.
RUN npm install -g firebase-tools@13 firebase-admin@12

# Global installs are not on Node's default resolution path for a script run out of
# /workspace, so seed.js can `require("firebase-admin")`.
ENV NODE_PATH=/usr/local/lib/node_modules

# Pre-download the emulator JARs at build time. Without this, every `docker compose up`
# on a fresh container re-downloads them, because the cache lives in $HOME and would be
# thrown away with the container.
RUN firebase setup:emulators:firestore \
    && firebase setup:emulators:ui

WORKDIR /workspace

# 4000 Emulator UI · 4400 hub · 4500 logging · 8080 Firestore · 9099 Auth
EXPOSE 4000 4400 4500 8080 9099
