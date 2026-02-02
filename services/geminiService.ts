
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateSiteQuiz(siteName: string, artworkTitle: string, description: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 3-question multiple-choice quiz about the following cultural site and artwork for a virtual museum app:
      Site: ${siteName}
      Artwork: ${artworkTitle}
      Description: ${description}
      
      The questions should be educational and engaging. Provide the output in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return null;
  }
}

export async function getCulturalInsights(siteName: string, artworkTitle: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional museum curator for Awasser s4. 
      The visitor is currently at ${siteName} looking at a virtual AR artwork titled "${artworkTitle}".
      Provide a concise (2-3 sentences) cultural mediation that connects the historical context of the site with the contemporary digital artwork.`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching insights:", error);
    return "The fusion of this historical site and digital art invites us to reflect on the continuity of our culture through modern technology.";
  }
}

export async function planExperienceJourney(theme: string, startLocation: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a structured "Experience Journey" of exactly 8 points of interest in Riyadh based on the theme: "${theme}". 
      Starting location: "${startLocation}".
      For each point, provide a title, a brief description, and coordinate metadata.
      Output in JSON format only.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            points: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  location: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER }
                    }
                  },
                  narrativeInsight: { type: Type.STRING }
                },
                required: ["id", "title", "description", "location", "narrativeInsight"]
              }
            }
          },
          required: ["theme", "points"]
        }
      }
    });
    const result = JSON.parse(response.text);
    if (result && typeof result === 'object') {
      result.groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    }
    return result;
  } catch (error) {
    console.error("Error planning journey:", error);
    return null;
  }
}

export async function getSiteSuitability(siteName: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the urban site "${siteName}" for its suitability as a permanent AR (Augmented Reality) museum anchor. 
      Discuss lighting conditions (natural vs urban), foot traffic, and historical significance. 
      Keep it professional and concise (3-4 bullet points).`,
    });
    return response.text;
  } catch (error) {
    return "This site offers a rich historical backdrop suitable for high-fidelity spatial anchoring.";
  }
}

export async function askMuseumGuide(question: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${context}\n\nVisitor Question: ${question}`,
    });
    return response.text;
  } catch (error) {
    return "I'm having trouble connecting right now.";
  }
}

export async function generateNarrationAudio(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Narrate: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return null;
  }
}

export async function searchDeploymentSites(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 3 sites for: ${query}.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });
    return {
      text: response.text,
      locations: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return { text: "No maps data.", locations: [] };
  }
}

export async function identifyLandmarkFromImage(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `You are an AI spatial recognition engine for Riyadh Urban Museum.
          Analyze this camera frame. If you recognize a landmark in Riyadh (like Masmak Fort, Kingdom Centre, Faisaliyah, Diriyah, etc.), identify it.
          Provide the name, a brief historical fact, and suggest a digital art 'theme' that would complement this location.
          Return a JSON object.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recognized: { type: Type.BOOLEAN },
            landmark: { type: Type.STRING },
            history: { type: Type.STRING },
            suggestedTheme: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["recognized"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Landmark recognition error:", error);
    return { recognized: false };
  }
}
