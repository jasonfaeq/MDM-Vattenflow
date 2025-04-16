import { Request, Comment, RequestStatus } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Service to handle AI responses to user comments
 */
export const AIService = {
  /**
   * Generate an AI response to a user comment
   */
  generateCommentResponse: async (
    request: Request,
    userComment: Comment
  ): Promise<string> => {
    try {
      // Create a prompt that provides context about the request and the user's comment
      const prompt = `
        You are an AI assistant for the MDM (Master Data Management) team at Vattenfall Wind BU. 
        Your task is to provide helpful responses to user comments on data requests.

        Request details:
        - Type: ${request.requestType}
        - Region: ${request.region}
        - Status: ${request.status}
        - Created: ${
          request.createdAt?.toDate
            ? request.createdAt.toDate().toISOString()
            : "unknown"
        }

        User's comment: "${userComment.text}"
        
        Please provide a helpful, concise response addressing the user's comment or question. 
        Keep your answer professional and focused on guiding the user through the request process.
        Don't include any explanations about being an AI - just respond as a helpful MDM team member.
        Limit your response to 2-3 sentences maximum.
      `;

      // Make API call to Gemini
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Extract the response text
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text?.trim();

      if (!aiResponse) {
        throw new Error("No response generated");
      }

      return aiResponse;
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "I couldn't process your request right now. A team member will respond to your comment shortly.";
    }
  },

  /**
   * Check if the system settings allow AI responses
   */
  isAiResponseEnabled: async (): Promise<boolean> => {
    try {
      const settingsDoc = await getDoc(doc(db, "system", "settings"));

      if (!settingsDoc.exists()) {
        return false;
      }

      const data = settingsDoc.data();
      return data?.requestSettings?.enableAiReplies === true;
    } catch (error) {
      console.error("Error checking AI response settings:", error);
      return false;
    }
  },

  /**
   * Generate an AI response to an internal team comment
   */
  generateInternalCommentResponse: async (
    request: Request,
    internalComment: Comment
  ): Promise<string> => {
    try {
      // Create a prompt that provides context about the request and the internal comment
      const prompt = `
        You are an AI assistant for the MDM (Master Data Management) team at Vattenfall Wind BU. 
        Your task is to provide helpful responses to internal team comments and suggest next steps or actions.

        Request details:
        - Type: ${request.requestType}
        - Region: ${request.region}
        - Status: ${request.status}
        - Created: ${
          request.createdAt?.toDate
            ? request.createdAt.toDate().toISOString()
            : "unknown"
        }
        - Requester: ${request.requesterEmail}

        Internal team member's comment: "${internalComment.text}"
        
        Please provide a helpful response addressing the internal comment or question. 
        Include suggestions for next steps or actions if appropriate.
        If there are potential issues or considerations, highlight them.
        Format your response professionally to help the MDM team member.
        Keep your response fairly concise (3-4 sentences).
      `;

      // Make API call to Gemini
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Extract the response text
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text?.trim();

      if (!aiResponse) {
        throw new Error("No response generated");
      }

      return aiResponse;
    } catch (error) {
      console.error("Error generating AI internal response:", error);
      return "Unable to analyze this request at the moment. Please proceed based on your own assessment.";
    }
  },

  /**
   * Analyze a request and determine if the status should be updated automatically
   * Returns new status if change recommended, null otherwise
   */
  analyzeRequestForStatusUpdate: async (
    request: Request
  ): Promise<{ status: RequestStatus | null; reason: string } | null> => {
    try {
      // Create a prompt that asks the AI to analyze the request and determine if the status should be updated
      const prompt = `
        You are an AI assistant for the MDM (Master Data Management) team at Vattenfall Wind BU.
        Your task is to analyze a request and determine if its status should be updated automatically.

        Request details:
        - Type: ${request.requestType}
        - Region: ${request.region}
        - Current Status: ${request.status}
        - Created: ${
          request.createdAt?.toDate
            ? request.createdAt.toDate().toISOString()
            : "unknown"
        }
        - Submitted Data: ${JSON.stringify(request.submittedData)}

        User Comments:
        ${request.comments
          .map((c) => `- ${c.userName}: "${c.text}"`)
          .join("\n")}

        Internal Comments:
        ${request.internalComments
          .map((c) => `- ${c.userName}: "${c.text}"`)
          .join("\n")}

        Status History:
        ${request.history
          .map(
            (h) =>
              `- ${h.status} (by ${h.changedByUserName}) at ${h.timestamp
                .toDate()
                .toISOString()}`
          )
          .join("\n")}

        Available status values: "Submitted", "InProgress", "PendingInfo", "ForwardedToSD", "Completed", "Rejected"

        Based on the information above, analyze if this request should have its status updated. 
        Respond in JSON format only with these fields:
        - shouldUpdate: true/false (should the status be updated?)
        - newStatus: one of the available status values or null if no update needed
        - reason: brief explanation of why the status should or should not be updated
        
        For example: {"shouldUpdate": true, "newStatus": "Completed", "reason": "All required information provided and task appears done"}
        Or: {"shouldUpdate": false, "newStatus": null, "reason": "Current status is appropriate given request state"}
      `;

      // Make API call to Gemini
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Extract the response text
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text?.trim();

      if (!aiResponse) {
        throw new Error("No response generated");
      }

      // Parse the JSON response
      const jsonStart = aiResponse.indexOf("{");
      const jsonEnd = aiResponse.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format");
      }

      const jsonText = aiResponse.substring(jsonStart, jsonEnd + 1);
      const result = JSON.parse(jsonText);

      if (result.shouldUpdate && result.newStatus) {
        return {
          status: result.newStatus as RequestStatus,
          reason: result.reason || "AI recommended status update",
        };
      }

      return null;
    } catch (error) {
      console.error("Error analyzing request for status update:", error);
      return null;
    }
  },

  /**
   * Check if the system settings allow AI internal responses
   */
  isAiInternalResponseEnabled: async (): Promise<boolean> => {
    try {
      const settingsDoc = await getDoc(doc(db, "system", "settings"));

      if (!settingsDoc.exists()) {
        return false;
      }

      const data = settingsDoc.data();
      return data?.requestSettings?.enableAiInternalReplies === true;
    } catch (error) {
      console.error("Error checking AI internal response settings:", error);
      return false;
    }
  },

  /**
   * Check if the system settings allow AI task completion
   */
  isAiTaskCompletionEnabled: async (): Promise<boolean> => {
    try {
      const settingsDoc = await getDoc(doc(db, "system", "settings"));

      if (!settingsDoc.exists()) {
        return false;
      }

      const data = settingsDoc.data();
      return data?.requestSettings?.enableAiTaskCompletion === true;
    } catch (error) {
      console.error("Error checking AI task completion settings:", error);
      return false;
    }
  },
};
