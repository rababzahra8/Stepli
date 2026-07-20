# Stepli

> A gentle, bilingual Android guide that helps people complete a task in an unfamiliar app—one tap at a time, while they remain in control.

**Suggested submission category:** Accessibility & Inclusion (or the closest matching category in the challenge form).

Stepli is an Android accessibility companion designed for people who feel less confident using everyday digital services. It includes bilingual guides for Foodpanda, Instagram, WhatsApp, and YouTube, and its data-driven guide model can support many more apps and tasks. Rather than taking over a task, Stepli opens the chosen app, displays a small movable instruction card over it, highlights the next relevant control when it can find it, and lets the person confirm each step themselves. People can also create reusable guides for other installed apps.

## The idea

Many apps assume that everyone is comfortable with search, checkout, addresses, delivery options, and payment screens. Stepli turns a potentially intimidating flow into calm, plain-language guidance. The user chooses a language, grants only the permissions required for visual guidance, then follows a short sequence of instructions at their own pace.

Foodpanda ordering is one practical use case: its guide covers location setup, search, selecting a restaurant and dish, cart review, address, delivery, payment, and final order review. The current guide library also includes Instagram posting and Stories, WhatsApp messaging, and YouTube search.

## Setup and run

```sh
git clone <your-repository-url>
cd Stepli
npm ci
```

Start Metro in one terminal:

```sh
npm start
```

In a second terminal, with an Android device connected or an emulator running:

```sh
npm run android
```

### First-run permissions

1. In Stepli, tap **Allow overlay** and enable **Display over other apps** for Stepli.
2. Tap **Open accessibility settings**, choose **Stepli screen guidance**, and enable it.
3. Return to Stepli; both permission indicators should show a check mark.
4. Select a language, finish onboarding, and tap **Order food with Foodpanda**.

The accessibility service is read-only: Stepli does not tap, type, scroll, or submit anything on the user's behalf.

### Debug APK security check

When installing a locally built debug APK on a physical phone, Google Play Protect may ask to scan the app or show a warning because it was not installed from the Play Store. Prefer scanning the app first. If it blocks your own test build, temporarily turn off scanning on that test device:

1. Open the **Google Play Store**.
2. Tap your profile picture, then **Play Protect** → **Settings**.
3. Turn off **Scan apps with Play Protect**.
4. Install the debug APK, then turn scanning back on immediately afterwards.

This is only for local development testing. Keep Play Protect enabled for normal use and for any app you did not build yourself. [Google's Play Protect instructions](https://support.google.com/accounts/answer/9924802) explain the same setting.

### The story behind Stepli

I built Stepli after seeing my mother, and other older family members, ask younger relatives to order food, book a ride, send a message, or complete other everyday phone tasks. The need is not about intelligence; it is about digital confidence. Stepli is intended to make those moments less dependent on a nearby family member and help people complete the next task independently.

### Version 1: the original LLM idea - planned for the future

The first version of the idea was an LLM-powered screen analyser and assistant. It would understand the current app screen and generate context-aware, conversational guidance instead of relying on a fixed sequence of instructions.

I could not continue with the LLM-powered or agent-based version because I did not have access to the required OpenAI API keys. Rather than give up on Stepli, I built the current manual, data-driven guide system instead. The GPT-5.6-powered idea is still in progress, but it is **not included in this submission**: the submitted app does not call GPT-5.6 or any other runtime LLM. I plan to return to it later with suitable API access, privacy safeguards, and user consent.

### The submitted build

The `master` branch contains the submitted implementation: curated, data-driven bilingual guides, supported by Android accessibility hints and a floating guidance card. It currently includes Foodpanda, Instagram, WhatsApp, and YouTube workflows, and it can be extended with as many additional guides as needed.

The current version gives people calm, one-step-at-a-time guidance, optional highlights, and manual control for real tasks today. Its guide model is data-driven, so I can add more apps and workflows without changing the core guidance experience.

### Future direction

With appropriate production API access, privacy safeguards, and user consent, Stepli can return to its original dynamic screen-understanding approach. That would make it possible to guide people through more services - including booking rides, shopping and paying bills, government services, and hospital appointments - without writing a completely separate fixed flow for every screen. Future expansion also includes more languages, trusted family/community-created guides, and support for additional everyday apps.

### What Stepli does—and does not do

- Guides the user in English or Urdu.
- Opens a tutorial's selected app and shows a movable, non-blocking instruction card above it.
- Reads only the selected app's accessibility tree while a guide is active, to locate the next suggested UI element and draw a highlight ring around it.
- Narrates each instruction on Android when Voice guidance is enabled, with a replay button.
- Lets a person close the navigator completely at any time; this removes the card, bubble, highlight, active guide, and speech.
- Lets the user manually confirm a step when Foodpanda's interface differs from the expected screen.
- Never taps, types, selects a payment method, or places an order for the user.
- Does not store screenshots, typed text, coordinates, or accessibility-tree dumps.

## How it works

1. The user selects English or Urdu and completes Stepli's short onboarding.
2. The app asks for Android's **Display over other apps** permission so its guidance card can appear above another app.
3. The user enables the **Stepli screen guidance** accessibility service. The service observes only the package selected by the currently active tutorial.
4. Selecting **Order food with Foodpanda** launches Foodpanda and starts the built-in, data-driven tutorial.
5. Stepli observes the allowed accessibility events, looks for lightweight text, content-description, or resource-ID hints, and highlights a likely next control. The user makes every actual interaction.
6. When a step is clicked or manually confirmed, Stepli shows the next instruction. A completion screen celebrates the user's independent success.

## Technology used

| Area | Technology |
| --- | --- |
| Mobile UI | React Native 0.86, React 19, TypeScript |
| Navigation | React Navigation native stack |
| Android integration | Kotlin, Android AccessibilityService, WindowManager overlay, React Native native module bridge |
| Data and localization | TypeScript tutorial data, English and Urdu string files, Android SharedPreferences for language/onboarding/voice state; optional Supabase/Postgres for shared user guides |
| AI direction | A GPT-5.6 screen-analysis concept is future work only. It is still in progress and is not included in this submitted build; the app makes no runtime LLM calls. |
| Build tooling | Node.js, npm, Metro, Gradle, Android Studio / Android SDK |
| Testing and quality | Jest and ESLint |

The product experience lives in `App.tsx`. The built-in guides are intentionally data-driven in `src/data/`, and user-created guide data uses the same model. The Android overlay and accessibility implementation is in `android/app/src/main/java/com/stepli/app/`.

## Requirements

This demo is supported on **Android only**. The repository contains the standard React Native iOS project files, but there is no iOS equivalent of Android's overlay/accessibility implementation.

- Node.js **22.11 or newer** (`package.json` requirement)
- Java Development Kit (JDK) **17**
- Android Studio with Android SDK Platform/API **36**, Build Tools 36, and an Android emulator or physical Android device (Android 7.0/API 24 or later)
- A connected device/emulator with the Foodpanda app installed and an active Foodpanda account for the full end-to-end demo
- Internet access for npm dependencies, Android build dependencies, and Foodpanda

For the most representative test, use a physical Android device. An emulator can run Stepli, but may not provide a usable Foodpanda experience in every region.

### Demo data

No external seed data or backend is required for the submitted demo. The built-in guides are bundled in [`src/data/`](src/data/), including Foodpanda, Instagram, WhatsApp, and YouTube guides, with English and Urdu copy in `src/strings/`.

Foodpanda may change labels, screen order, or availability by country and app version. Each card has a manual confirmation button so the guide remains usable when an optional location or promotional screen is skipped or a matching UI label changes.

### Optional: user-authored guides with Supabase Postgres

The built-in Foodpanda guide works without a backend. To let signed-in people create, save, and share guides for other apps:

1. Create a Supabase project and enable Email/Password authentication. To use Google too, enable the Google provider in Supabase Auth and add its Google OAuth Web client ID and client secret there.
2. Apply the SQL files in [`supabase/migrations/`](supabase/migrations/) in timestamp order through its SQL editor or migration workflow.
3. In Google Cloud, create an Android OAuth client for package `com.stepli.app` and add the SHA-1 certificate fingerprints for every signing key you use (debug, release, and Play App Signing where applicable). Create or use a separate OAuth client of type **Web application** for Supabase.
4. Copy `.env.example` to a local ignored `.env`, and set `STEPLI_SUPABASE_URL` plus `STEPLI_SUPABASE_ANON_KEY` to the project URL and **publishable/anon** key. Set `STEPLI_GOOGLE_WEB_CLIENT_ID` to the Web application client ID to show the **Continue with Google** button. Never include the Google client secret in the app or `.env`.
5. Rebuild the Android app. Open **Add more** on Home, create an account or sign in, then create a guide and its ordered steps.

The app never connects directly to PostgreSQL. Supabase Auth plus Row Level Security lets owners manage and read their private guides, and lets signed-in users read intentionally published guides from other people. Visitors without an account cannot read community guides. Do not put a Postgres password or a Supabase service-role key in `.env` or the mobile app. For a public production community, add an approval/moderation workflow before exposing newly submitted guides.

## Verify the project

```sh
npm test
npm run lint
cd android && ./gradlew :app:compileDebugKotlin
```

For a functional check, run the Android app, grant both permissions, and step through the Foodpanda tutorial. Verify that the guidance card remains visible above Foodpanda, the highlight does not block tapping, and the user can complete or manually advance each step.

## Privacy and safety design

Stepli is deliberately designed as assistance, not automation:

- The accessibility service checks each event against the target package of the active tutorial, rather than reading every installed app continuously.
- The overlay renderer uses a non-touchable highlight layer, so the user—not Stepli—interacts with the guided app.
- It uses window, content, click, and scroll events only while a guide is active, so highlights can keep up with dynamic screens.
- It relies on lightweight matchers rather than storing a screen recording, screenshots, keyboard input, or a full accessibility-tree history.
- The final decision to place an order and any payment action always remains with the user.

## How Codex helped

Codex helped turn Stepli from a React Native starter project into a working Android prototype. It implemented the English/Urdu language flow, permission education, Foodpanda launch detection, and the Kotlin bridge between the TypeScript app, overlay, and read-only accessibility service. It also helped shape the Supabase flow for user-created and reusable guides.

It also improved the real-device experience by making the highlight touch-through, keeping the guide behind the keyboard, adding a movable and expandable assistant bubble, and ensuring the overlay disappears outside Foodpanda. Codex helped test and install the app on a physical Android phone through ADB, then added the supplied robot branding as the app icon, launch artwork, in-app logo, and assistant bubble using the sage `#A8C3A0` background.

The current guidance is still data-driven rather than AI-generated: it reads Foodpanda's accessible UI information to locate and highlight expected controls, while beginner-friendly instructions are curated in advance. Dynamic AI screen understanding remains future work.

## Project structure

```text
App.tsx                                      React Native product flow
src/data/foodpandaSteps.ts                   Built-in Foodpanda tutorial data
src/models/tutorial.ts                        Shared built-in/community tutorial model
src/services/TutorialRepository.ts            Supabase REST/Auth client for user-authored guides
src/strings/en.ts / src/strings/ur.ts         Localized guidance copy
src/native/StepliOverlay.ts                   TypeScript native-module interface
android/app/src/main/java/com/stepli/app/     Kotlin overlay and accessibility code
android/app/src/main/AndroidManifest.xml      Android permissions and service scope
supabase/migrations/                          Secure Postgres schema and RLS policies
```
