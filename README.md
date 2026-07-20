# Stepli

> A gentle, bilingual Android guide that helps people complete a task in an unfamiliar app—one tap at a time, while they remain in control.

**Suggested submission category:** Accessibility & Inclusion (or the closest matching category in the challenge form).

Stepli is an Android accessibility companion designed for people who feel less confident using everyday digital services. Its first built-in tutorial guides a person through ordering food with Foodpanda in English or Urdu. Rather than taking over the task, Stepli opens the chosen app, displays a small movable instruction card over it, highlights the next relevant control when it can find it, and lets the person confirm each step themselves. People can also create reusable guides for other installed apps.

## The idea

Many apps assume that everyone is comfortable with search, checkout, addresses, delivery options, and payment screens. Stepli turns a potentially intimidating flow into calm, plain-language guidance. The user chooses a language, grants only the permissions required for visual guidance, then follows a short sequence of instructions at their own pace.

The prototype focuses on a practical first use case: ordering food through Foodpanda. The tutorial covers location setup, search, selecting a restaurant and dish, cart review, address, delivery, payment, and the final order review.

### The story behind Stepli

The idea came from seeing an older family member ask younger relatives to order food, book a ride, and complete other everyday phone tasks. The need is not about intelligence; it is about digital confidence. Stepli is intended to make those moments less dependent on a nearby family member and help people complete the next task independently.

### Version 1: the original LLM idea - planned for the future

The first version of the idea was an LLM-powered screen analyser and assistant. It would understand the current app screen and generate context-aware, conversational guidance instead of relying on a fixed sequence of instructions.

I did not continue with this first version because the required GPT-5.6 API access was not available to me on the free tier. This LLM-based version was therefore not built into the submitted project. I plan to return to it in the future when suitable API access is available.

### Version 2: the current master build

Rather than stop the project, I created a second version in the `master` branch: curated, hard-coded, bilingual dialogues for a known Foodpanda flow, supported by Android accessibility hints and a floating guidance card. This is the implementation included in this repository and demonstrated for the challenge.

The current version is still useful: it gives people calm, one-step-at-a-time guidance, optional highlights, and manual control for a real task today. The tutorial is data-driven, so it is also a foundation for adding more supported apps and workflows when the LLM-powered analyser is revisited.

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
| AI direction | Version 1's GPT-5.6 LLM screen analyser is planned for the future; it is not included in the current Version 2 master build because the required API access was unavailable on the free tier |
| Build tooling | Node.js, npm, Metro, Gradle, Android Studio / Android SDK |
| Testing and quality | Jest and ESLint |

The product experience lives in `App.tsx`. The Foodpanda steps are intentionally data-driven in `src/data/foodpandaSteps.ts`, and user-created guide data uses the same model. The Android overlay and accessibility implementation is in `android/app/src/main/java/com/stepli/app/`.

## Requirements

This demo is supported on **Android only**. The repository contains the standard React Native iOS project files, but there is no iOS equivalent of Android's overlay/accessibility implementation.

- Node.js **22.11 or newer** (`package.json` requirement)
- Java Development Kit (JDK) **17**
- Android Studio with Android SDK Platform/API **36**, Build Tools 36, and an Android emulator or physical Android device (Android 7.0/API 24 or later)
- A connected device/emulator with the Foodpanda app installed and an active Foodpanda account for the full end-to-end demo
- Internet access for npm dependencies, Android build dependencies, and Foodpanda

For the most representative test, use a physical Android device. An emulator can run Stepli, but may not provide a usable Foodpanda experience in every region.

## Setup and run

```sh
git clone git@github.com:rababzahra8/Stepli.git
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

If Android Studio reports missing SDK components, install API 36 and Build Tools 36 through **SDK Manager**, then run the command again. You can also open the `android/` folder in Android Studio and run the `app` configuration.

### First-run permissions

Stepli needs two Android permissions for the guide to work:

1. In Stepli, tap **Allow overlay** and enable **Display over other apps** for Stepli.
2. Tap **Open accessibility settings**, choose **Stepli screen guidance**, and enable it.
3. Return to Stepli; both permission indicators should show a check mark.
4. Select a language, finish onboarding, and tap **Order food with Foodpanda**.

Android presents the accessibility-service settings separately from the app because this service can read the visible screen of the app selected by an active guide. The service is deliberately read-only: Stepli does not call Android actions to tap, type, scroll, or submit anything on the user's behalf.

### Demo data

No external seed data or backend is required for the submitted demo. The Foodpanda tutorial is bundled with the app in [`src/data/foodpandaSteps.ts`](src/data/foodpandaSteps.ts), with English and Urdu copy in `src/strings/`.

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

## How Codex and GPT-5.6 accelerated this project

Stepli was built with Codex using GPT-5.6 as a hands-on development partner. Codex accelerated both the product design and implementation work by helping the team:

- turn the inclusion problem into a focused, testable first use case: an English/Urdu, step-by-step Foodpanda guide;
- turn the original LLM screen-analyser concept into a useful Version 2 build after the necessary GPT-5.6 API access was unavailable on the free tier;
- design the React Native screen flow for language selection, permission education, onboarding, home, settings, and completion;
- build the Android bridge between the TypeScript app and Kotlin code;
- implement the native overlay card and highlight ring while preserving touch access to the app underneath;
- implement a constrained, read-only accessibility service that observes Foodpanda and emits step-progress events without automating actions;
- structure tutorial content as localized, reusable data instead of hard-coding it into each screen; and
- iterate on permissions copy and safety constraints so that the product clearly communicates user control.

The key product decision was to preserve the mission - teaching rather than automating - while changing the implementation from Version 1's planned LLM screen analyser to a Version 2 build that could be developed and tested with the available access. GPT-5.6 and Codex helped explore that tradeoff, shape the native-module boundary, and turn the AI-first idea into the current privacy-conscious prototype. The runtime LLM screen analyser remains a future direction, not a claim of the submitted build.

## Submission details

- **Repository:** https://github.com/rababzahra8/Stepli
- **Category:** Accessibility & Inclusion (select the closest available official category)
- **Project description:** Stepli is a bilingual Android accessibility companion that guides users through Foodpanda ordering with an overlay card and optional visual highlights, while the user performs every action themselves.
- **Demo video:** Record and add a public YouTube link before submitting. Keep it under three minutes and show: language selection, the two permission steps, the Foodpanda guide in action, and a short explanation of the Codex/GPT-5.6 workflow above.
- **Codex feedback session ID:** In the Codex session where the majority of the core functionality was built, run `/feedback` and paste the resulting session ID into the challenge submission form: `<!-- PASTE_CODEX_FEEDBACK_SESSION_ID_HERE -->`.

Before making the repository public, add an appropriate open-source license and ensure that no credentials, API keys, personal test data, or private `.env` values are committed.

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
