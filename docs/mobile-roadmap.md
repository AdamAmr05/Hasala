# Hasala Mobile Roadmap (iOS First)

## 📱 Executive Summary
**Goal:** Port the Hasala web experience to a premium, native iOS application.
**Strategy:** "Logic Lift & Shift, UI Rewrite."
**Target:** iOS App Store (iPhone).
**Estimated Timeline:** 2-3 Weeks for MVP.

---

## 🛠 Tech Stack Selection (The "Premium" Stack)
We will use the modern **Expo** ecosystem to ensure rapid development and easy native access.

| Component | Web (Current) | Mobile (Target) | Why? |
| :--- | :--- | :--- | :--- |
| **Framework** | Vite + React | **Expo (Managed)** | Industry standard, handles native build tools for you. |
| **Routing** | React Router | **Expo Router** | File-based routing (like Next.js), deep linking out of the box. |
| **Styling** | Tailwind CSS | **NativeWind (v4)** | Allows using `className="..."` with Tailwind classes in RN. |
| **Animations** | Framer Motion | **Moti (+ Reanimated)** | Drop-in replacement for Framer Motion API. |
| **Blur/Glass** | CSS `backdrop-filter` | **Expo Blur** | Native iOS blur (looks better than web). |
| **Charts** | Recharts | **Victory Native XL** (or Skia) | High-performance, touch-interactive charts. |
| **Audio** | Web Audio API | **Expo AV** | Native audio recording and playback. |
| **Storage** | LocalStorage | **MMKV** | Fastest key-value storage for mobile. |

---

## 📦 Codebase Inventory

### ✅ Keep (Copy-Paste)
1.  **Backend (`server/`)**: 100% Reusable. No changes needed.
2.  **Types (`client/types.ts`)**: 100% Reusable.
3.  **API Layer (`client/services/api.ts`)**: 95% Reusable.
    *   *Change:* `baseURL` must point to your computer's IP (e.g., `http://192.168.1.5:5000`) or a deployed URL, not `localhost`.
4.  **Hooks (`client/hooks/`)**: 90% Reusable.
    *   *Change:* Remove any `window` or `document` references.
5.  **State Logic**: Any `useState`, `useEffect`, `useQuery` logic is identical.

### ⚠️ Rewrite (The Work)
1.  **JSX Structure**:
    *   `<div>` ➔ `<View>`
    *   `<p>`/`<h1>` ➔ `<Text>`
    *   `<button>` ➔ `<Pressable>`
    *   `<input>` ➔ `<TextInput>`
2.  **Audio Recording**:
    *   `MediaRecorder` API does not exist in RN.
    *   Must rewrite `SmartInputSheet` to use `Expo.Audio.Recording`.
3.  **Charts**:
    *   `Recharts` relies on SVG/DOM. It will crash RN.
    *   Must rewrite `StatsOverview` and `ActivityFeed` charts using **Victory Native**.

---

## 🗺️ Migration Phases

### Phase 1: Foundation (Days 1-2)
- [ ] Initialize Expo project: `npx create-expo-app@latest`.
- [ ] Install **NativeWind** and configure `tailwind.config.js`.
- [ ] Install **Cairo Font** (load via `expo-font`).
- [ ] Set up **Expo Router** structure (`app/` directory).
- [ ] Port `api.ts` and `types.ts` to the new project.
- [ ] **Goal:** A blank app with your font and Tailwind working.

### Phase 2: Core UI Components (Days 3-5)
- [ ] **`TabBar`**: Re-implement using `<BlurView>` and Moti animations. This is the anchor of your app.
- [ ] **`CoinStack`**: Re-build using Moti.
    *   *Note:* Spring animations work *better* on native.
- [ ] **`SmartInputSheet`**:
    *   Use `@gorhom/bottom-sheet` (the gold standard for RN sheets).
    *   Implement `Expo AV` for voice recording.
- [ ] **Goal:** The main navigation and the "Add Transaction" flow are visible.

### Phase 3: Feature Porting (Days 6-10)
- [ ] **Dashboard**:
    *   Port `Dashboard.tsx`.
    *   Replace Recharts with Victory Native.
- [ ] **Chat**:
    *   Port `ChatInterface.tsx`.
    *   Use `KeyboardAvoidingView` (critical for mobile chat).
    *   Use `FlashList` (Shopify) for high-performance message lists.
- [ ] **Groups**:
    *   Port `GroupView.tsx`.
    *   Native share sheet for "Invite Code" (`Share.share()`).

### Phase 4: Native Polish (Days 11-12)
- [ ] **Haptics**: Add `expo-haptics` to every button press and coin drop.
- [ ] **Safe Area**: Ensure UI doesn't clip behind the notch (`react-native-safe-area-context`).
- [ ] **Splash Screen**: Add a premium branded splash screen.

---

## 🍎 Apple App Store Compliance (The Rules)

Since you are targeting iOS, you **must** follow these strict rules to avoid rejection:

### 1. Account Deletion (CRITICAL)
*   **Rule:** If users can create an account, they must be able to delete it **inside the app**.
*   **Action:** Add a "Delete Account" button in Settings that calls your API to wipe their data.

### 2. Login / Auth
*   **Rule:** If you offer Google/Facebook login, you **MUST** offer "Sign in with Apple".
*   **Action:** Since you currently use custom auth (email/pass), you are safe. If you add social login later, prioritize Apple.

### 3. User Generated Content (Chat)
*   **Rule:** Apps with AI chat must have a way to "Report" or "Filter" offensive content.
*   **Action:** Add a strict system prompt to Gemini: "Do not generate NSFW or illegal content." (You already have this implicitly, but make it explicit).

### 4. Permissions
*   **Rule:** You must explain *why* you need permissions in the `Info.plist`.
*   **Action:**
    *   **Microphone:** "Hasala needs microphone access to log transactions via voice."
    *   **FaceID:** "Hasala uses FaceID to secure your financial data."

### 5. Design (HIG)
*   **Rule:** Buttons must be at least 44x44pt (touch target).
*   **Action:** Ensure your `Pressable` areas are large enough, even if the icon is small.

---

## 📝 Specific Codebase Notes for Migration

### 1. The "Glass" Effect
In `client/index.css`, you have:
```css
.glass { @apply bg-white/75 backdrop-blur-xl ... }
```
In React Native, you cannot use CSS blur. You will use:
```tsx
import { BlurView } from 'expo-blur';

<BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
<View style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
  {/* Content */}
</View>
```
*Note:* This looks **stunning** on iOS.

### 2. The "Coin Stack" Animation
You currently use `framer-motion`'s `layoutId`.
In Moti, this is `from` and `animate`.
```tsx
<MotiView
  from={{ translateY: -50, opacity: 0 }}
  animate={{ translateY: 0, opacity: 1 }}
  transition={{ type: 'spring', damping: 15 }}
/>
```
It is almost identical logic, just different props.

### 3. Charts
Your `StatsOverview` uses Recharts.
For Mobile, **Victory Native XL** is recommended.
*   It uses Skia (C++ graphics engine).
*   It runs at 120fps.
*   It supports "Press and Drag" to see values (tooltip replacement).

## 🚀 Next Steps
1.  **Approve this roadmap.**
2.  I will generate the `npx create-expo-app` command and initial file structure.
3.  We start porting `api.ts` and the `TabBar`.
