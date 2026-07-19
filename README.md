# Stepli — phase 1 goal-based guidance

Stepli is a read-only Android accessibility assistant. A person sets a goal, opens the app they want help with, and Stepli continually turns the visible accessibility UI into a single safe next instruction. It does not tap, type, navigate, or complete transactions for the person.

## Architecture

```
User goal (persistent SharedPreferences state)
  -> AccessibilityService
  -> AccessibilityScreenParser
  -> ScreenModel (text, controls, inputs, lists, scrollability)
  -> GuidanceEngine
     -> GptPlanner, or RuleBasedPlanner fallback
  -> GuidancePlan
  -> read-only overlay highlight + TextToSpeech
```

Key Android modules are organised under:

- `accessibility/` — event intake and safe rendering
- `parser/` — reusable accessibility-tree to `ScreenModel` conversion
- `models/` — UI, goal, memory, and guidance contracts
- `planner/` — shared planner interface, local recovery planner, and coordinator
- `ai/` — GPT-5.6 JSON prompt builder, HTTP client, and JSON parser
- `repository/` — persistent goal, planner mode, voice preference, and concise session memory
- `speech/` — explanation plus next-action TextToSpeech only

The accessibility service has no package filter. Foodpanda remains merely an optional quick-start card; no Foodpanda screen names, element matchers, dialogue sequence, or automatic step advancement are used for planning.

## Planner modes

`Local and private` is the default. It uses only visible generic relevance signals, can identify a goal-related control, and recovers with Back when a new screen is less relevant than the previous screen.

`GPT-5.6` sends the compact, filtered screen model and recent guidance summaries to an OpenAI-compatible Responses endpoint. If remote planning is unavailable, Stepli automatically uses the local planner so guidance remains usable offline.

For local development, add a newly-created key to the ignored [`.env`](.env) file. The checked-in [`.env.example`](.env.example) shows the expected format:

```properties
STEPLI_OPENAI_API_KEY=your_development_key
STEPLI_AI_ENDPOINT=https://api.openai.com/v1/responses
STEPLI_AI_MODEL=gpt-5.6
```

`.env` is read only while Gradle builds the Android app. It is convenient for your own debug build but the resulting APK still contains the key, so do not distribute it. For a production app, set `STEPLI_AI_ENDPOINT` to an authenticated server-side gateway instead of shipping an API key in the APK.

See [the GPT planner contract](docs/gpt-planner-prompt.md) for the exact structured request and response.

## Privacy boundaries

- The parser excludes all editable field contents and password fields before creating a screen model.
- Memory stores short screen and instruction summaries, not raw accessibility trees.
- GPT requests use HTTPS and are sent only when GPT mode is selected and configured.
- The service never calls `performAction`.

## Verify

```sh
npx tsc --noEmit
npm test -- --runInBand
cd android && ./gradlew :app:testDebugUnitTest :app:compileDebugKotlin
```
