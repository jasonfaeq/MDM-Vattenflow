import { z } from "zod";

// Schema for request insights
export const RequestInsightsSchema = z.object({
  summary: z.string(),
  trends: z.array(
    z.object({
      trend: z.string(),
      description: z.string(),
      recommendation: z.string().optional(),
    })
  ),
  requestCategorization: z.object({
    byType: z.array(
      z.object({
        type: z.string(),
        count: z.number(),
        percentage: z.number(),
      })
    ),
    byRegion: z.array(
      z.object({
        region: z.string(),
        count: z.number(),
        percentage: z.number(),
      })
    ),
    byStatus: z.array(
      z.object({
        status: z.string(),
        count: z.number(),
        percentage: z.number(),
      })
    ),
  }),
  actionableInsights: z.array(z.string()),
});

export type RequestInsights = z.infer<typeof RequestInsightsSchema>;

export async function analyzeRequestsWithGemini(
  requestsData: any[]
): Promise<RequestInsights> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not set");
  }

  // Prepare the request data (don't send too much data to avoid token limits)
  const compactRequestsData = requestsData.map((req) => ({
    id: req.id,
    requestType: req.requestType,
    region: req.region,
    status: req.status,
    createdAt: req.createdAt
      ? new Date(req.createdAt.toDate()).toISOString()
      : null,
    updatedAt: req.updatedAt
      ? new Date(req.updatedAt.toDate()).toISOString()
      : null,
  }));

  const prompt = `
    You are an AI assistant specialized in analyzing business data and providing insightful analysis.
    
    I'll provide you with data about Master Data Management (MDM) requests at Vattenfall Wind BU.
    
    Analyze the provided request data and generate insights in the following JSON schema structure:
    
    {
      "summary": "A concise summary of the overall request data analysis",
      "trends": [
        {
          "trend": "Brief trend name",
          "description": "Detailed explanation of the trend",
          "recommendation": "Recommendation based on this trend (optional)"
        }
      ],
      "requestCategorization": {
        "byType": [
          {
            "type": "Request type name",
            "count": number,
            "percentage": number
          }
        ],
        "byRegion": [
          {
            "region": "Region name",
            "count": number,
            "percentage": number
          }
        ],
        "byStatus": [
          {
            "status": "Status name",
            "count": number,
            "percentage": number
          }
        ]
      },
      "actionableInsights": [
        "Actionable insight 1",
        "Actionable insight 2"
      ]
    }
    
    Here is the request data: ${JSON.stringify(compactRequestsData)}
    
    Important: Return only valid JSON that matches the schema above, with no explanation before or after.
  `;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
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
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    const result = await response.json();

    if (
      !result.candidates ||
      !result.candidates[0]?.content?.parts?.[0]?.text
    ) {
      throw new Error("Invalid response from Gemini API");
    }

    // Extract the text from the response
    const text = result.candidates[0].content.parts[0].text;

    // Extract the JSON part from the response text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response");
    }

    // Parse the JSON
    const parsedData = JSON.parse(jsonMatch[0]);

    // Validate the response against our schema
    const validatedData = RequestInsightsSchema.parse(parsedData);

    return validatedData;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
