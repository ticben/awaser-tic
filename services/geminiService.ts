
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Searches for suitable urban sites for AR deployment using Google Maps grounding.
export async function searchDeploymentSites(query: string, location?: { lat: number; lng: number }) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 5 suitable urban landmarks or public spaces in Riyadh for this project: "${query}". Provide their titles and location context for AR museum anchors.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: location ? {
              latitude: location.lat,
              longitude: location.lng
            } : undefined
          }
        }
      },
    });
    return {
      locations: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error searching deployment sites:", error);
    return { locations: [] };
  }
}

// Reimagine a site using image editing (Image-to-Image Flux)
export async function generateArtworkVariant(base64Image: string, prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Artistically reimagine this urban scene as a digital museum installation. Theme: ${prompt}. Maintain the architectural silhouette but transform textures into digital art, light structures, or futuristic materials. Output the final high-quality image.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating artwork variant:", error);
    return null;
  }
}

export async function planExperienceJourney(theme: string, startLocation: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a structured "Experience Journey" of exactly 8 points of interest in Riyadh based on the theme: "${theme}". 
      Starting location: "${startLocation}".
      Perform deep reasoning on the cultural connections between these sites.
      For each point, provide a title, a brief description, and coordinate metadata.
      Output in JSON format only.`,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
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

// Gemini as Assistant: Curates content for curator-selected points.
export async function enhanceJourneyPoints(theme: string, points: any[]) {
  try {
    const pointNames = points.map(p => p.title).join(", ");
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a digital museum curator's assistant. The curator has selected these sites for an exhibition theme: "${theme}".
      Sites: ${pointNames}.
      For each site, provide:
      1. A rich historical and artistic description.
      2. A "Spatial Narrative Insight" (how it connects to the theme).
      3. A "Digital Layer Vision" (what kind of AR art should be anchored there).
      Output as a JSON array corresponding to the sites provided.`,
      config: {
        thinkingConfig: { thinkingBudget: 12000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              narrativeInsight: { type: Type.STRING },
              digitalVision: { type: Type.STRING }
            },
            required: ["description", "narrativeInsight", "digitalVision"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error enhancing points:", error);
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

// Added missing function to provide cultural insights for a site and artwork.
export async function getCulturalInsights(siteName: string, artworkTitle: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a deep cultural and historical insight connecting the site "${siteName}" with the digital artwork titled "${artworkTitle}". 
      Discuss how the digital layer enhances the physical history. One short, poetic paragraph.`,
    });
    return response.text;
  } catch (error) {
    // Fixed: Corrected console error logging from unused expression
    console.error("Error getting cultural insights:", error);
    return "This installation bridges the gap between historical architecture and the digital frontier.";
  }
}

// Added missing function to generate a historical video reimagining (Time Warp) using Veo.
export async function generateHistoricalReimagining(base64Image: string, landmarkName: string) {
  try {
    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await veoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A cinematic historical reconstruction of ${landmarkName} in Riyadh during its original era. High quality, realistic textures, bustling atmosphere.`,
      image: {
        imageBytes: base64Image,
        mimeType: 'image/jpeg',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await veoAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    return downloadLink ? `${downloadLink}&key=${process.env.API_KEY}` : null;
  } catch (error) {
    console.error("Error generating historical reimagining:", error);
    return null;
  }
}

// Added missing function to generate a cultural quiz for a specific site.
export async function generateSiteQuiz(siteName: string, artworkTitle: string, artworkDesc: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a 3-question cultural quiz about "${siteName}" and the artwork "${artworkTitle}" (${artworkDesc}). 
      Ensure questions reflect historical and artistic context. Return as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER, description: "0-based index of the correct option" },
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
