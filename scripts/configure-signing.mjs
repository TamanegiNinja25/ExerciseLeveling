#!/usr/bin/env node
/**
 * Optional release signing for CI.
 *
 * After `expo prebuild`, Android release builds are signed with the template's
 * public debug keystore. If ANDROID_KEYSTORE_PATH and its passwords are set,
 * this script adds a real `release` signingConfig to android/app/build.gradle.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const { ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD } = process.env;
const gradlePath = 'android/app/build.gradle';

if (!ANDROID_KEYSTORE_PATH || !existsSync(ANDROID_KEYSTORE_PATH)) {
  console.log('No release keystore provided: release APK will use the debug keystore.');
  process.exit(0);
}

let gradle = readFileSync(gradlePath, 'utf8');
const release = `
        release {
            storeFile file(${JSON.stringify(ANDROID_KEYSTORE_PATH)})
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }`;

if (!ANDROID_KEYSTORE_PASSWORD || !ANDROID_KEY_ALIAS || !ANDROID_KEY_PASSWORD) {
  console.error('Keystore found but ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS / ANDROID_KEY_PASSWORD are missing.');
  process.exit(1);
}

gradle = gradle.replace(/signingConfigs \{\n/, (m) => `${m}${release.slice(1)}\n`);
gradle = gradle.replace(
  /(release \{\s*\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/,
  '$1signingConfig signingConfigs.release',
);
if (!gradle.includes('signingConfig signingConfigs.release')) {
  console.error('Could not patch build.gradle: template layout changed.');
  process.exit(1);
}
writeFileSync(gradlePath, gradle);
console.log('Release signing configured.');
