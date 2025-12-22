import { GoogleGenAI } from "@google/genai";

// Helper to check for API key
const getAIClient = () => {
  const apiKey = process.env.API_KEY; 
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateText = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const ai = getAIClient();

  // 1. REAL API CALL (if key exists)
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-latest',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      return response.text || "I processed that, but generated no text.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having trouble connecting to the SimpleData AI Core. Please check the API Key configuration.";
    }
  }

  // 2. SOPHISTICATED SIMULATION (Fallback for demo)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate Weekly Report Generation
      if (prompt.toLowerCase().includes("report")) {
        resolve(`## Weekly Status Report
**Author:** User
**Date:** ${new Date().toLocaleDateString()}

### 🚀 Key Achievements
*   **Data Lake Migration:** Successfully completed historical data ingestion (Phase 1).
*   **Team Coordination:** Resolved blocking issues with client API access.

### ⚠️ Blockers & Risks
*   Waiting on VPN credentials for the Mining Co project.
*   Need clarification on "Sales Dashboard" requirements from stakeholders.

### 📅 Plan for Next Week
1.  Begin transformation logic for Data Lake.
2.  Finalize UI mockups for Dashboard V2.
3.  Conduct code review for Predictive Maintenance module.`);
      } 
      // Simulate Email
      else if (prompt.toLowerCase().includes("email")) {
        resolve(`Subject: Update on Project Milestones

Dear Team,

I wanted to share a quick update regarding our progress. We have successfully hit our targets for the current sprint.

Key highlights:
- Backend integration is 90% complete.
- Client feedback has been addressed.

Let's discuss the next steps in our Monday sync.

Best regards,
[Name]`);
      } 
      // General Chat
      else {
        resolve(`I am the SimpleData AI Simulator. 
        
Since no API Key was detected, I am running in demo mode. 
I can help you visualize how this portal works. In a production environment, I would use the Gemini 2.5 Flash model to analyze your:
- ${prompt.length} character query
- Database schemas
- Code repositories
- Team availability

Try asking me to "Generate a report" to see the markdown formatting capabilities.`);
      }
    }, 1000);
  });
};

export const streamChat = async function* (prompt: string) {
    // Placeholder for stream implementation if needed later
    yield "Stream functionality ready.";
}
