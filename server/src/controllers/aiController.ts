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

        const timezone = req.body?.timezone || 'UTC';
        const month = typeof req.body?.month === 'number' ? req.body.month : Number.parseInt(req.body?.month, 10);
        const year = typeof req.body?.year === 'number' ? req.body.year : Number.parseInt(req.body?.year, 10);

        // 1. Get RAW Data (No system instruction text)
        const contextData = await FinancialContextService.buildFinancialContextData(req.user, {
            month: Number.isFinite(month) ? month : undefined,
            year: Number.isFinite(year) ? year : undefined,
            timezone,
        });

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        // 2. Wrap data in a VISUAL prompt
        const prompt = `
      Create a clean, minimalist FINANCIAL INFOGRAPHIC in landscape 16:9.
      Style: high-end fintech dashboard (Apple Card/Revolut). Elegant, calm, and readable.
      Color: light, warm off-white background with subtle gradients; rich but soft accents (teal/coral/indigo), no neon, no glow.
      Layout: 3–4 panels in a grid, plenty of whitespace, consistent typography.
      Content focus: Health Status, Top Spending, Projections.
      Charts only (no photos/illustrations). Use clear labels and bold, readable text.
      Avoid clutter and tiny text.

      DATA CONTEXT:
      ${JSON.stringify(contextData, null, 2)}
    `;

        // 3. Call Gemini 3 Pro Image (Preview)
        const model = 'gemini-3-pro-image-preview';

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
                config: {
                    responseModalities: ['IMAGE'],
                    imageConfig: {
                        aspectRatio: '16:9',
                        imageSize: '2K',
                    },
                },
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
