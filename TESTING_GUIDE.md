# ElectroLab AI — Frontend Testing Guide

## Quick Start

```bash
# Terminal 1 — Backend
cd backend
uvicorn api.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173/test-lab** in your browser.

---

## Test Lab UI

The `/test-lab` page is a built-in frontend test runner that hits every v3
backend endpoint. It shows:

- Request payload sent
- Full JSON response received
- Function that Gemini called (if any)
- Confidence level badge
- Physics verification badges
- Reasoning chain steps
- Warnings / safety alerts
- Pass/fail status with response time

### Controls

| Button | What it does |
|--------|-------------|
| **Run All Tests** | Runs every test sequentially across all 5 sections |
| **Run Section** | Runs all tests in one section |
| **Run** (per test) | Runs a single test |
| **Details** | Expands request + response JSON for inspection |
| **Reset** | Clears all results |

---

## Test Sections & What Each Test Verifies

### 1. Chat + Function Calling (7 tests)

These hit `POST /v3/chat/message`. Gemini receives the message along with
10 function declarations and decides whether to call a backend function
or reply with plain text.

| # | Test | Expected Behavior |
|---|------|-------------------|
| 1.1 | **LED Debug** | Gemini calls `analyze_circuit`. Response contains `function_called`, `reasoning_steps`, physics validation. Should identify that 10kΩ gives only 0.5mA (need 10-20mA). |
| 1.2 | **Concept Question** | Gemini replies with plain text. `function_called` should be `null`. No physics validation needed. |
| 1.3 | **Project Planning** | Gemini calls `generate_project_plan`. Response should include component suggestions, skill-appropriate recommendations. |
| 1.4 | **Safety Query** | Gemini calls `fetch_lab_rule`. Response should include grounding rules from the knowledge base YAML files. |
| 1.5 | **Calculation Request** | Gemini calls `calculate_component_value`. Response should include formula steps, nearest standard resistor value. |
| 1.6 | **Datasheet Request** | Gemini calls `fetch_datasheet`. Response should include ESP32 GPIO specs (40mA max). |
| 1.7 | **Viva Questions** | Gemini calls `generate_learning_summary`. Response should include Q&A pairs tailored to difficulty level. |

#### What to verify in the response:

```
response.function_called    → Name of function Gemini chose (or null)
response.reasoning_steps    → Array of reasoning chain steps
response.confidence         → "low" | "medium" | "high"
response.verified_by        → ["Ohm's Law", ...] (if validation ran)
response.warnings           → Safety/limit warnings (if any)
response.response           → The actual text Gemini generated
```

---

### 2. Circuit Analysis + Validation (3 tests)

These hit `POST /v3/chat/analyze`. This endpoint **always** runs validation
(unlike `/message` where Gemini decides).

| # | Test | Expected Behavior |
|---|------|-------------------|
| 2.1 | **LED Circuit Analysis** | Detects insufficient current (0.5mA with 10kΩ). `validation_status` should flag the issue. `verified_by` should include "Ohm's Law". |
| 2.2 | **Voltage Divider Analysis** | Calculates Vout = 2.5V (not the claimed 3.3V). Should detect measurement error. |
| 2.3 | **Power Supply Circuit** | Detects thermal concern: P = (12-5) × 1 = 7W. Should recommend heatsink. |

#### What to verify:

```
response.validation_status  → "valid" | "warning" | "error"
response.physics_analysis   → { checks: [...], calculations: {...} }
response.verified_by        → Physics laws used
response.solution_steps     → Actionable fix steps
response.root_cause         → Why it failed
response.learning_tip       → Viva-friendly tip
response.confidence         → Should be "high" when validated
```

---

### 3. Verified Calculations (4 tests)

These hit `POST /v3/chat/calculate`. Direct backend calculations — no
Gemini involved. Pure physics.

| # | Test | Expected Result |
|---|------|-----------------|
| 3.1 | **LED Resistor** | R = (5 - 1.8) / 0.015 = 213.3Ω → nearest standard 220Ω |
| 3.2 | **Voltage Divider** | Vout = 5 × 4700/(10000+4700) = 1.599V |
| 3.3 | **Power Dissipation** | P = 5² / 220 = 0.1136W = 113.6mW |
| 3.4 | **RC Cutoff Frequency** | fc = 1/(2π × 10000 × 100nF) = 159.15Hz |

#### What to verify:

```
response.formula            → The formula used
response.steps              → Step-by-step calculation
response.result             → Numeric answer
response.unit               → Unit (Ω, V, Hz, etc.)
response.nearest_standard_value → Nearest E24 value (for resistors)
response.validation         → "valid" | "error"
response.warnings           → Power rating warnings etc.
```

---

### 4. Datasheet / RAG (5 tests)

These hit `POST /v3/chat/datasheet`. Retrieves data from YAML knowledge
base files — no Gemini, no external API.

| # | Test | Expected Result |
|---|------|-----------------|
| 4.1 | **ESP32 Full** | Returns max_ratings (gpio_current: 40mA), pinout, application_notes |
| 4.2 | **Arduino Pinout** | Returns digital/analog/PWM/I2C/SPI pin mapping |
| 4.3 | **LM7805 Ratings** | Returns max input 35V, max output 1.5A, dropout 2V |
| 4.4 | **LED General** | Returns forward voltage by color, typical current ranges |
| 4.5 | **Unknown Component** | Returns `found: false` with helpful fallback message |

#### What to verify:

```
response.found              → true/false
response.component          → Component name queried
response.source             → "ElectroLab Knowledge Base" or "General Electronics Knowledge"
response.data               → Actual specs object
```

---

### 5. Adaptive Learning (5 tests)

These hit `POST /v3/chat/learn` and `GET /v3/chat/profile/{user_id}`.

| # | Test | Expected Result |
|---|------|-----------------|
| 5.1 | **Viva – LED Beginner** | Returns 3+ questions with answers, study tips |
| 5.2 | **Viva – RC Filter Advanced** | Returns harder questions (transfer function, Bode plot) |
| 5.3 | **Concept Summary** | Returns key_points, formulas, related_topics |
| 5.4 | **Practice Problems** | Returns problem types and sample problems |
| 5.5 | **User Profile** | Returns skill_level, topics_explored, recommended_difficulty |

#### What to verify:

```
// For learning content:
response.content.questions  → Array of {q, a} objects
response.content.study_tips → Array of tips
response.skill_level        → Matches requested level

// For profile:
response.skill_level        → Current skill level
response.recommended_difficulty → "easy" | "medium" | "hard"
response.common_mistakes    → Past mistake patterns
```

---

## Manual Chat Tests

Open **http://localhost:5173/chat** and type these messages one by one.
Observe the AI response behavior.

### Test M1: LED Debug Flow
```
My red LED connected to 5V with a 10k resistor isn't lighting up. What's wrong?
```
**Expected:** AI explains the current is too low (0.5mA), recommends ~220Ω,
shows calculation steps.

### Test M2: Follow-up Context
```
What if I use 330 ohm instead?
```
**Expected:** AI remembers the LED circuit context, recalculates with 330Ω,
confirms the current is ~9.7mA (acceptable).

### Test M3: Component Query
```
What is the maximum current I can draw from an ESP32 GPIO pin?
```
**Expected:** AI answers 40mA with source reference.

### Test M4: Project Planning
```
I want to build a line-following robot using Arduino Nano and IR sensors
```
**Expected:** AI suggests components, gives block diagram approach,
considers skill level.

### Test M5: Safety Awareness
```
Can I connect 12V directly to an ESP32?
```
**Expected:** AI warns that ESP32 max is 3.6V, explains the risk, and
suggests using a voltage regulator or level shifter.

### Test M6: Calculation
```
What resistor do I need for a blue LED at 15mA from a 3.3V supply?
```
**Expected:** R = (3.3 - 3.2) / 0.015 = 6.67Ω → nearest 6.8Ω.
Warns that the margin is very small.

### Test M7: Viva Preparation
```
Generate viva questions about RC filters for an intermediate student
```
**Expected:** Questions about cutoff frequency formula, time constant,
-3dB meaning, phase shift.

### Test M8: Multi-media Debug (Image/Video)
```
[Upload a photo of your breadboard circuit or describe it]
Here is my circuit on breadboard. The LED is connected to pin 13 of Arduino
with a 220 ohm resistor but it's flickering.
```
**Expected:** AI asks follow-up questions about the wiring, power source,
code, and suggests debug steps.

---

## Hackathon Demo Script

### Setup
1. Backend running on port 8000
2. Frontend running on port 5173
3. Browser open at `/test-lab`

### Demo Flow (5 minutes)

**Minute 1 — The Hook**
> "Every engineering student has faced this: your circuit doesn't work,
> and you don't know why."

Open `/chat`. Type: *"My LED with 10k resistor isn't lighting up from 5V"*

**Minute 2 — Show the Intelligence**
Point out in the response:
- "See? It called `analyze_circuit()` — it didn't just guess."
- "It calculated: I = 0.5mA. That's why the LED is dim."
- Show the confidence badge: "HIGH — because physics verified it."

**Minute 3 — Verified Calculations**
Switch to `/test-lab`. Run the **LED Resistor Calculation** test.
- Show the formula, steps, nearest standard value.
- "This isn't ChatGPT guessing. This is Ohm's Law running on our backend."

**Minute 4 — Knowledge Base**
Run the **ESP32 Datasheet** test.
- Show the pinout, max ratings.
- "We built a light RAG system — datasheets stored locally, no hallucination."

**Minute 5 — Adaptive Learning**
Run the **Viva Questions** test.
- Show beginner vs advanced questions.
- "The system adapts to the student's level and tracks their mistakes."

### Closing Line
> "This is not a chatbot. This is an AI lab instructor that calculates,
> validates, remembers, and teaches."

---

## Architecture Being Tested

```
Frontend (/test-lab)
    │
    ├─ POST /v3/chat/message ──→ Gemini + Function Calling ──→ Backend Functions
    ├─ POST /v3/chat/analyze ──→ Gemini + Mandatory Validation
    ├─ POST /v3/chat/calculate ─→ Direct Physics Calculations
    ├─ POST /v3/chat/datasheet ─→ YAML Knowledge Base (RAG)
    ├─ POST /v3/chat/learn ─────→ Adaptive Learning Content
    └─ GET  /v3/chat/profile ───→ User Learning Profile
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `GEMINI_API_KEY not configured` | Set `GEMINI_API_KEY` in backend `.env` file |
| `Connection refused` on tests | Make sure backend is running on port 8000 |
| Chat tests return 500 | Check backend logs for Gemini API errors |
| Calculate tests fail | These don't need Gemini — check Python imports |
| Datasheet returns empty | Check `backend/knowledge_base/datasheets/` has YAML files |
| CORS errors | Backend CORS allows `localhost:5173` — check `api/main.py` |

---

## Files Involved

| Layer | File | Purpose |
|-------|------|---------|
| Frontend | `src/pages/AITestLab.tsx` | Test runner UI |
| Frontend | `src/App.tsx` | Route `/test-lab` |
| Backend | `api/chat_v3.py` | All v3 endpoints |
| Backend | `services/gemini_function_calling.py` | Gemini integration |
| Backend | `services/function_executor.py` | Function routing |
| Backend | `functions/declarations.py` | 10 function schemas |
| Backend | `functions/circuit_functions.py` | Circuit analysis |
| Backend | `functions/knowledge_functions.py` | RAG retrieval |
| Backend | `functions/learning_functions.py` | Adaptive learning |
| Backend | `services/validation_service.py` | Physics validation |
| Backend | `knowledge_base/datasheets/` | Component specs YAML |
| Backend | `knowledge_base/lab_rules/` | Safety rules YAML |
| Backend | `knowledge_base/common_mistakes/` | Error patterns YAML |
