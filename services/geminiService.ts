
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize with a default key for non-premium tasks, 
// though per-call initialization is preferred for some models.
const aiDefault = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Searches for suitable urban sites globally using Google Maps grounding.
export async function searchDeploymentSites(query: string, city: string, location?: { lat: number; lng: number }) {
  try {
    const response = await aiDefault.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find 5 suitable urban landmarks or public spaces in ${city} for this project: "${query}". Provide their titles and location context for digital museum anchors.`,
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

// Gemini as Assistant: Curates content for curator-selected points globally.
export async function enhanceJourneyPoints(theme: string, city: string, points: any[]) {
  try {
    const pointNames = points.map(p => p.title).join(", ");
    const response = await aiDefault.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a professional digital museum curator's assistant. The curator is designing an exhibition in ${city} with the theme: "${theme}".
      Sites: ${pointNames}.
      For each site, provide:
      1. A rich historical and artistic description.
      2. A "Spatial Narrative Insight" (connection to theme).
      3. A "Digital Layer Vision" (AR/3D/Audio suggestion).
      4. Recommendation for display mode (AR, Studio, or Hybrid).
      Output as a JSON array corresponding to the sites provided.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              narrativeInsight: { type: Type.STRING },
              digitalVision: { type: Type.STRING },
              recommendedMode: { type: Type.STRING, enum: ["ar", "studio", "hybrid", "text"] }
            },
            required: ["description", "narrativeInsight", "digitalVision", "recommendedMode"]
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

export async function generateNarrationAudio(text: string) {
  try {
    const response = await aiDefault.models.generateContent({
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

export async function askMuseumGuide(question: string, context: string) {
  try {
    const response = await aiDefault.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${context}\n\nVisitor Question: ${question}`,
    });
    return response.text;
  } catch (error) {
    return "I'm having trouble connecting right now.";
  }
}

export async function getCulturalInsights(siteName: string, artworkTitle: string) {
  try {
    const response = await aiDefault.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a deep cultural and historical insight connecting the site "${siteName}" with the digital artwork titled "${artworkTitle}". 
      Discuss how the digital layer enhances the physical history. One short, poetic paragraph.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting cultural insights:", error);
    return "This installation bridges the gap between historical architecture and the digital frontier.";
  }
}

export async function generateSiteQuiz(siteName: string, artworkTitle: string, artworkDesc: string) {
  try {
    const response = await aiDefault.models.generateContent({
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
              correctAnswer: { type: Type.INTEGER },
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

// Fix: Implemented missing identifyLandmarkFromImage
export async function identifyLandmarkFromImage(base64: string) {
  try {
    const response = await aiDefault.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: 'image/jpeg' } },
          { text: "Identify this landmark. If it is a known urban or historical site, provide its name, a brief history, and a suggested digital art theme for a museum installation. Return as JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recognized: { type: Type.BOOLEAN },
            landmark: { type: Type.STRING },
            history: { type: Type.STRING },
            suggestedTheme: { type: Type.STRING }
          },
          required: ["recognized", "landmark", "history", "suggestedTheme"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Landmark identification failed:", error);
    return { recognized: false };
  }
}

// Fix: Implemented missing generateHistoricalReimagining using Veo
export async function generateHistoricalReimagining(base64: string, landmark: string) {
  // Re-initialize to ensure it uses the latest API key from the user selection dialog
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `A cinematic historical reconstruction of ${landmark} in its original glorious era, showing bustling life and ancient architecture.`,
    image: {
      imageBytes: base64,
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
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
}

// Fix: Implemented missing generateArtworkVariant using Gemini Flash Image
export async function generateArtworkVariant(base64: string, theme: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: 'image/jpeg' } },
        { text: `Reimagine this scene as a high-fidelity digital art installation with the theme: "${theme}". Abstract, futuristic, and museum-quality.` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
