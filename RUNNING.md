# Running the Ledger Project

Because this app uses high-performance on-device AI (`Gemma 4`, `Vosk`, `VisionCamera`), it **cannot be run in Expo Go**. You must use a **Development Build**.

## Prerequisites

- **Android Studio** installed with SDK 34+.
- **Node.js** 20+ and **npm** 10+.
- A physical **Android Device** (recommended) or a high-performance Emulator (with at least 4GB RAM allocated).

## Setup Instructions

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Prebuild the Native Project**:
   This generates the `android` folder with all native AI libraries linked.
   ```bash
   npx expo prebuild --platform android
   ```

3. **Run the Development Build**:
   Connect your Android device via USB (with Debugging enabled) and run:
   ```bash
   npx expo run:android
   ```
   *Note: The first build may take 5-10 minutes as it compiles the native C++ AI engines.*

## First Launch Steps

1. **Setup AI**:
   Upon launching, the app will detect that models are missing. Tap the **"Setup AI (2.6GB)"** button on the dashboard.
   - This will download the **Gemma 4** and **Vosk** models to your device's internal storage.
   - Ensure you are on a stable Wi-Fi connection.

2. **Grant Permissions**:
   The app will request permissions for:
   - **Microphone**: For Voice Entry.
   - **Camera**: For Receipt Scanning.
   - **SMS**: For Clipboard auto-detection.

## Common Troubleshooting

- **Build Fails**: Run `npx expo install --check` to ensure all library versions are compatible with your SDK.
- **Model Download Fails**: Ensure your device has at least **4GB of free storage**.
- **App Crashes on Inference**: Low-end devices may struggle with the 2B model. Try closing other background apps.
