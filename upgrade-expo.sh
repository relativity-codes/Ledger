#!/bin/bash

set -e



echo "Upgrading Expo SDK to latest..."
npm install expo@latest

echo "Upgrading all dependencies to match the installed SDK version..."
npx expo install --fix

echo "Running expo-doctor to check for common problems..."
npx expo-doctor

echo "Cleaning Gradle cache..."
cd android
./gradlew clean
cd ..



echo "Removing node_modules, package-lock.json, and npm cache..."
rm -rf node_modules package-lock.json
npm cache clean --force


echo "Removing .gradle cache..."
rm -rf ~/.gradle/caches/


echo "Installing dependencies..."
npm install

echo "If you use prebuild/Continuous Native Generation, consider deleting android and ios directories and regenerating them with 'npx expo prebuild' or 'npx expo run:android/ios'."
echo "Always check the Expo SDK changelog for breaking changes and follow any extra instructions."

echo "Upgrade complete! Review changes, test your app, and resolve any breaking changes as needed."
read -p "Press enter to exit..."