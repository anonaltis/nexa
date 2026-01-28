# Frontend Integration Guide: AI Lab Assistant

Yeh guide aapko batayegi ki naye **AI Chat V3 API** ko apne React frontend ke sath kaise connect karna hai.

## 1. API Endpoint
Naya endpoint ab ready hai:
- **URL:** `http://localhost:8000/v3/chat/message`
- **Method:** `POST`
- **Authentication:** Bearer Token (Existing login system)

## 2. Request Format (Jo Aapko Bhejna Hai)
Jab user koi message type kare, to backend ko yeh JSON bhejein:

```json
{
  "content": "Mera 10k resistor kaam nahi kar raha, LED jal nahi rahi",
  "message_type": "debug", // Optional: 'general', 'debug', 'planning'
  "session_id": "current-session-id"
}
```

## 3. Response Handling (Jo Backend Se Aayega)
AI ab ek **Structured JSON** bhejega. Isko sunder tarike se dikhana hai.

### Backend Response Example:
```json
{
  "id": "msg-123",
  "role": "assistant",
  "content": "...", // Markdown text
  "metadata": {
    "type": "debug",
    "structured_response": {
      "circuit_analysis": { ... },
      "fault_diagnosis": {
        "root_cause": "Resistance too high",
        "explanation": "10kΩ resistor limits current to 0.3mA..."
      },
      "solution": {
        "immediate_fix": "Replace 10kΩ with 220Ω",
        "steps": ["Step 1...", "Step 2..."]
      }
    }
  }
}
```

## 4. UI Components to Build

### A. AI Message Bubble (Smart Card)
Agar `metadata.structured_response` available hai, to sirf text mat dikhao. Ek **Card** banao:

1.  **Alert Box (Red/Yellow):** `fault_diagnosis.root_cause` ke liye.
    *   *Title:* "Problem Detected"
    *   *Body:* "Resistance too high"
2.  **Solution List (Green):** `solution.steps` ke liye.
    *   Checklist banao jo user tick kar sake.
3.  **Explanation (Blue/Info):** `fault_diagnosis.explanation` ke liye.

### B. "Thinking" Indicator
Jab backend **Google Gemini** ko call kar raha hota hai aur **Formula Caclulate** kar raha hota hai, to user ko wait karna padta hai.
*   **Action:** Ek chhota sa `Loader` ya text dikhayein: *"Analyzing Circuit Logic..."* ya *"Calculating Ohm's Law..."*.

## 5. Learning Mode Integration
AI ab response ke sath **Interview Questions** bhi bhej sakta hai (`learning_notes` section mein).
*   **Feature:** Chat ke neeche ek "Take Quiz" button de sakte hain jo in questions ko popup mein dikhaye.

## 6. Example Code (API Service)

```javascript
// services/chatService.js

export const sendMessageV3 = async (content, sessionId) => {
  const response = await fetch('http://localhost:8000/v3/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      content,
      session_id: sessionId
    })
  });
  
  return response.json();
};
```

---
**Note:** Agar aapko testing karni hai, to pehle **Backend Server Restart** karein (`uvicorn api.main:app --reload`).
