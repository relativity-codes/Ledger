# Project Analysis & Suggestions: Ledger

## 1. Current State vs. Engineering Requirements

### 1.1 Scaffolding Analysis
The current project in `/Ledger` is a bare Expo template (SDK 54). While it provides a clean starting point, it lacks the infrastructure required by the **Engineering Design Document (v3.0)**.

**Gaps Identified:**
- **Dependencies**: Missing core AI libraries (`react-native-litert-lm`, `react-native-vosk`, `react-native-fast-tflite`) and database drivers (`expo-sqlite`).
- **Permissions**: `app.json` lacks necessary Android permissions for Camera, Microphone (Audio), and SMS.
- **Folder Structure**: Currently flat. Needs a modular `src/` directory to manage services, hooks, and UI components.
- **Native Modules**: The project will require a **Development Build** since AI libraries like `react-native-litert-lm` and `Vosk` contain native code not present in Expo Go.

### 1.2 Engineering Document Analysis
The document is highly comprehensive and well-architected for an offline-first multimodal app. However, I suggest the following technical refinements:

## 2. Key Suggestions & Adjustments

### 2.1 Technical Stack Adjustments
- **Expo SDK Version**: The document mentions SDK 52, but the scaffold is SDK 54. I recommend staying on SDK 54 as it includes improved support for the New Architecture (Fabric/TurboModules), which is beneficial for the high-performance AI inference required.
- **State Management**: Add **Zustand** for lightweight, performant state management. It's ideal for tracking model download progress and ledger state without the boilerplate of Redux.
- **Navigation**: Implement **Expo Router**. Since this is a multimodal app with specific "modes" (Voice, Camera, SMS List), a file-based routing system will keep the UI logic organized.

### 2.2 Infrastructure & DevOps
- **Model Delivery**: The Gemma 4 model (2.58 GB) is too large for the binary. 
    - **Adjustment**: Implement a dedicated `ModelManager` service that handles download, verification (checksum), and loading. Use `expo-file-system` for background downloads.
- **Memory Safety**: 1.5GB RAM is a tight budget for Gemma 4. 
    - **Adjustment**: Implement an aggressive memory management strategy that unloads the model when the app is backgrounded or when high-memory UI components (like the Camera) are active.

### 2.3 Data Layer Refinement
- **Schema Evolution**: Use `expo-sqlite` migrations. The "append-only" event source is excellent for integrity, but we should also ensure a `transactions` view is indexed for the "Ledger Dashboard" to avoid re-calculating everything on every mount.
- **Encryption**: Since this is financial data, suggest using **SQLCipher** (via `expo-sqlite/next`) for at-rest encryption.

### 2.4 UI/UX Enhancements
- **Accessibility**: informal workers may prefer audio-visual cues over text.
    - **Suggestion**: Use the `react-native-piper` (TTS) not just for results, but for interface guidance (e.g., "Tap the microphone to speak").
- **Haptic Feedback**: Use `expo-haptics` to confirm transaction entries, providing physical feedback for a more reliable "offline" feel.

## 3. Proposed Implementation Roadmap

1.  **Phase 1: Infrastructure Setup**
    - Configure `app.json` with permissions and native module plugins.
    - Setup `src/` folder structure (services, components, hooks, stores).
    - Install and link core dependencies.
2.  **Phase 2: Service Layer Development**
    - Implement `DatabaseService` (SQLite + Migrations).
    - Implement `ModelManager` (Download/Load logic for Gemma & Vosk).
    - Implement `AIOrchestrator` (Input Routing & Inference logic).
3.  **Phase 3: Core UI Development**
    - Dashboard (Balance + Recent Transactions).
    - Voice Entry Screen.
    - Camera/Receipt Capture Screen.
4.  **Phase 4: Integration & Optimization**
    - End-to-end flow testing (Voice -> Gemma -> SQLite).
    - Memory and battery profiling.

---
**Next Action:** I am ready to begin the implementation of **Phase 1** once you approve this direction.
