const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'android/**',
      'ios/**',
      'artifacts/**',
      'dist/**',
      'dist-android/**',
      '.android-toolchain/**',
      '.expo/**',
      '.expo-scaffold/**',
      '.gradle-local/**',
      '.maven-local/**',
      'node_modules/**',
    ],
  },
]);
