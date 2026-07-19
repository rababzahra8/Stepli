# Stepli GPT planner contract

Stepli sends GPT a privacy-filtered UI model, the persistent goal, and up to five concise memory entries. It never sends screenshots, typed input values, password fields, or the full accessibility tree.

## Request context supplied to the model

```json
{
  "goal": "Order a pizza from Foodpanda",
  "currentUi": {
    "app": "Foodpanda",
    "appPackage": "com.global.foodpanda.android",
    "screenText": ["Restaurants", "Search", "Offers"],
    "buttons": ["Search", "Offers", "Cart"],
    "inputs": [],
    "scrollable": true,
    "elements": [
      {"kind": "button", "label": "Search", "clickable": true, "editable": false, "scrollable": false}
    ]
  },
  "recentGuidance": []
}
```

## Required structured response

```json
{
  "screen": "Restaurant list",
  "confidence": 0.94,
  "explanation": "You are viewing nearby restaurants.",
  "nextAction": "Tap a restaurant that offers pizza.",
  "reason": "Selecting a restaurant is the next step toward the goal.",
  "isGoalComplete": false,
  "target": {"text": null, "resourceId": null}
}
```

For an unexpected screen, the same schema supports recovery without any Foodpanda-specific code:

```json
{
  "screen": "Offers",
  "confidence": 0.91,
  "explanation": "This offers page is unrelated to ordering a pizza.",
  "nextAction": "Press Back to return to the restaurant list.",
  "reason": "The visible options do not advance the active goal.",
  "isGoalComplete": false,
  "target": null
}
```

The request is built in `PlannerPromptBuilder`, and `GuidanceResponseParser` accepts only the JSON result. The UI displays and speaks only `explanation` and `nextAction`.
