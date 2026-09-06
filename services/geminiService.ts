
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable not set. Please set your API key for the app to function.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "YOUR_API_KEY_HERE",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateText = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
        });

        if (!response.candidates || response.candidates.length === 0) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked for text generation due to: ${response.promptFeedback.blockReason}`);
            }
        }

        return response.text;
    } catch (error) {
        console.error("Error generating text:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to generate text from API.");
    }
};

interface ViralPostResult {
    text: string;
    imageUrl: string;
}

export const generateViralPost = async (postText: string, image?: File): Promise<ViralPostResult> => {
    const model = 'gemini-3.1-flash-lite-image';
    
    const prompt = `আপনি একজন বিশ্বসেরা ভাইরাল কনটেন্ট ক্রিয়েটর। আপনার কাজ হলো একটি ট্রেন্ডিং ফেসবুক পোস্টকে বিশ্লেষণ করে, সেটিকে সম্পূর্ণ নতুন আঙ্গিকে লেখা এবং পোস্টের সাথে মানানসই একটি আকর্ষণীয়, নতুন ও কপিরাইট-মুক্ত ছবি তৈরি করা।

**নির্দেশনাবলী:**
1.  **লেখা পুনর্লিখন:** প্রদত্ত পোস্টের মূল ভাব এবং আবেগকে ঠিক রেখে, এটিকে আরও আকর্ষণীয় এবং শেয়ারযোগ্য করে সম্পূর্ণ নতুনভাবে লিখুন। নতুন হুক, নতুন শব্দ এবং নতুন বিন্যাস ব্যবহার করুন।
2.  **ছবি তৈরি:** লেখার নতুন আঙ্গিকের সাথে মিল রেখে একটি সুন্দর, হাই-কোয়ালিটি এবং বাস্তবসম্মত ছবি তৈরি করুন। ছবিটি যেন পোস্টের বিষয়বস্তুকে দৃশ্যমান করে তোলে।
${image ? '3. **অনুপ্রেরণা:** ব্যবহারকারী একটি ছবি দিয়েছেন। এই ছবিটি থেকে অনুপ্রেরণা নিন, কিন্তু হুবহু নকল না করে একটি সম্পূর্ণ নতুন ও ইউনিক ছবি তৈরি করুন।' : ''}

আউটপুট হিসেবে প্রথমে পুনর্লিখিত পোস্টের লেখাটি দিন, এবং এরপর ছবিটি দিন। কোনো অতিরিক্ত ব্যাখ্যা বা ভূমিকা দেবেন না।

**ট্রেন্ডিং পোস্ট:**
---
${postText}
---`;
    
    const parts: any[] = [{ text: prompt }];
    if (image) {
        parts.push(await fileToGenerativePart(image));
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
    });

    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
        console.error("Invalid response structure from API for viral post:", JSON.stringify(response, null, 2));
        if (response.promptFeedback?.blockReason) {
            throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`);
        }
        throw new Error("API returned an invalid or empty response for viral post.");
    }


    let generatedText = '';
    let generatedImageUrl = '';

    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
            generatedText += part.text;
        } else if (part.inlineData) {
            generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    if (response.text && !generatedText) {
        generatedText = response.text;
    }

    if (!generatedText || !generatedImageUrl) {
        console.error("API Response:", response);
        throw new Error("API did not return both text and image as expected.");
    }

    return { text: generatedText.trim(), imageUrl: generatedImageUrl };
};


export const generateAdStrategy = async (prompt: string, image?: File): Promise<string> => {
    try {
        const modelName = image ? 'gemini-3.1-flash-lite-image' : 'gemini-3.5-flash';
        let contents;

        if (image) {
            const imagePart = await fileToGenerativePart(image);
            contents = { parts: [{ text: prompt }, imagePart] };
        } else {
            contents = prompt;
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
        });

        if (!response.candidates || response.candidates.length === 0) {
             if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked for ad strategy due to: ${response.promptFeedback.blockReason}`);
            }
        }

        return response.text;
    } catch (error) {
        console.error("Error generating ad strategy:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to generate ad strategy from API.");
    }
};

export const generateImageFromText = async (prompt: string, aspectRatio: '1:1' | '9:16' | '16:9' | '4:3' | '3:4' = '1:1'): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                },
            },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            console.error("Invalid response structure from API:", JSON.stringify(response, null, 2));
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`);
            }
            throw new Error("API returned an invalid or empty response.");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        const textResponse = response.text;
        if (textResponse) console.warn("API returned text instead of an image:", textResponse);
        throw new Error("No image found in API response.");
    } catch (error) {
        console.error("Error generating image from text:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to generate image from API.");
    }
};

export const generateSpeech = async (prompt: string, voice: 'Kore' | 'Puck'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
            },
          },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            console.error("Invalid audio response:", JSON.stringify(response, null, 2));
            if(response.promptFeedback?.blockReason) {
                 throw new Error(`Speech generation blocked: ${response.promptFeedback.blockReason}`);
            }
            throw new Error("No audio data in response.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to generate speech from API.");
    }
};


export const generateImageFromTextAndImage = async (prompt: string, image: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(image);
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: [imagePart, { text: prompt }] },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            console.error("Invalid response structure from API:", JSON.stringify(response, null, 2));
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`);
            }
            throw new Error("API returned an invalid or empty response.");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        const textResponse = response.text;
        if (textResponse) console.warn("API returned text instead of an image:", textResponse);
        throw new Error("No image found in API response.");
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to generate image from API.");
    }
};

export const generateImageFromImagesAndText = async (prompt: string, images: File[]): Promise<string> => {
    try {
        const imageParts = await Promise.all(images.map(fileToGenerativePart));
        const textPart = { text: prompt };
        const parts = [...imageParts, textPart];

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: parts },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            console.error("Invalid response structure from API:", JSON.stringify(response, null, 2));
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`);
            }
            throw new Error("API returned an invalid or empty response.");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        const textResponse = response.text;
        if (textResponse) console.warn("API returned text instead of an image:", textResponse);
        throw new Error("No image found in API response.");

    } catch (error) {
        console.error("Error generating image from multiple inputs:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to generate image from API.");
    }
};

export const removeWatermark = async (image: File, mask: File): Promise<string> => {
    const prompt = `You are an expert photo editor specializing in inpainting. Given an original image and a corresponding mask image, your task is to intelligently and seamlessly remove the parts of the original image that are indicated by the white areas in the mask. You must fill in the removed areas so they blend perfectly with the surrounding content, preserving textures, lighting, and shadows. The final output must be only the edited, clean image, with no additional text or explanation.`;
    
    try {
        const imagePart = await fileToGenerativePart(image);
        const maskPart = await fileToGenerativePart(mask);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: [{ text: prompt }, imagePart, maskPart] },
        });

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
            console.error("Invalid response structure from API:", JSON.stringify(response, null, 2));
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`);
            }
            throw new Error("API returned an invalid or empty response.");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        const textResponse = response.text;
        if (textResponse) console.warn("API returned text instead of an image:", textResponse);
        throw new Error("No image found in API response.");
    } catch (error) {
        console.error("Error removing watermark:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to remove watermark from API.");
    }
};