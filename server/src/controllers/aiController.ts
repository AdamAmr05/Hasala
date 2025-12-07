import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AuthRequest } from '../middleware/authMiddleware';
import { FinancialContextService } from '../services/financialContextService';

export const generateInfographic = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: 'User context is required.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is not configured.' });
        }

        // 1. Get RAW Data (No system instruction text)
        const contextData = await FinancialContextService.buildFinancialContextData(req.user);

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        // 2. Wrap data in a VISUAL prompt
        const prompt = `
      Create a visually stunning, vertically vivid minimalist infographic summarizing this financial data.
      Make it look like a high-end fintech dashboard summary (like Apple Card or Revolut).
      Focus on the "Health Status" and "Top Spending" and "Projections".
      Use a dark mode aesthetic with neon accents (green for good, red/orange for warning).
      Do not include text that is too small. Keep it bold and punchy.
      
      DATA CONTEXT:
      ${JSON.stringify(contextData, null, 2)}
    `;

        // 3. Call Gemini 2.5 Flash Image
        const model = 'gemini-2.5-flash-image';

        console.log(`[InfoGen] Generating infographic with model: ${model}`);

        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
                // Note: No responseMimeType needed. The image model returns image data in inline parts automatically.
            });

            if (!response || !response.candidates || !response.candidates[0]?.content?.parts?.[0]?.inlineData) {
                // Fallback logging
                console.warn("[InfoGen] No inline data in response", JSON.stringify(response, null, 2));

                // If text was returned instead (model refused), send specific error
                if (response.text) {
                    console.warn("[InfoGen] Model returned text instead of image:", response.text);
                }
                return res.status(500).json({ message: 'Failed to generate visual. Model might be busy or refused context.' });
            }

            const generatedPart = response.candidates?.[0]?.content?.parts?.[0];

            if (generatedPart?.inlineData) {
                const mimeType = generatedPart.inlineData.mimeType;
                const data = generatedPart.inlineData.data;
                console.log('[InfoGen] Successfully generated image');
                return res.json({ image: `data:${mimeType};base64,${data}` });
            } else {
                return res.status(500).json({ message: 'No image data received.' });
            }

        } catch (apiError: any) {
            console.error('[InfoGen] GoogleGenAI API Error:', apiError);

            // Special handling for 404 on model
            if (apiError.message?.includes('404') || apiError.message?.includes('not found')) {
                return res.status(500).json({ message: `Model '${model}' not found. Check availability or API key permissions.` });
            }

            // Return the specific error to the client for debugging
            return res.status(500).json({
                message: `Generation Failed: ${apiError.message || apiError.toString()}`,
                details: apiError
            });
        }

    } catch (error: any) {
        console.error('InfoGen Error:', error);
        return res.status(500).json({ message: `Internal Error: ${error.message}` });
    }
};
