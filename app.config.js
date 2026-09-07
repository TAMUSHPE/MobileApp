module.exports = ({ config }) => {
  // Deliberately NOT the same key as GOOGLE_PLACES_API_KEY. This one is consumed by the Maps SDK
  // for Android, which sends X-Android-Package / X-Android-Cert headers, so it can carry an
  // "Android apps" restriction (package com.tamu.shpe + the release and debug SHA-1s) and is
  // useless to anyone who extracts it from the APK.
  // The Places and Geocoding calls in src/helpers/geolocationUtils.ts are plain fetches against the
  // web service, send no such headers, and would be rejected by that restriction — hence two keys.
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    // The EAS variable is stored with SECRET visibility, so it resolves only on the build worker,
    // never on a developer machine. The Android manifest is written during prebuild on that worker,
    // so a local config evaluation (versionCode/runtimeVersion resolution for eas build, plus
    // expo start, eas update, eas env:list) has no need for the key — only a real build does.
    if (process.env.EAS_BUILD) {
      throw new Error(
        'Missing GOOGLE_MAPS_API_KEY on the EAS build worker. Add it to this build profile\'s ' +
          'environment (it is the Android-app-restricted Maps SDK key, separate from GOOGLE_PLACES_API_KEY).'
      );
    }
    console.warn(
      '[app.config] GOOGLE_MAPS_API_KEY not set — Android maps will not render in a local build. ' +
        'Set it in .env if you are running expo prebuild / run:android.'
    );
    return config;
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
