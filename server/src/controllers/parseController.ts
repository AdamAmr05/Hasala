import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { MODEL_NAME, TRANSACTION_SCHEMA } from '../utils/geminiConfig';

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const parseResponse = (responseText?: string) => {
  if (!responseText) {
    throw new Error('Empty response from Gemini.');
  }
  return JSON.parse(responseText);
};

export const parseTransactionText = async (req: Request, res: Response) => {
  try {
    const { input } = req.body || {};

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return res.status(400).json({ message: 'Input text is required.' });
    }

    const ai = getClient();

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Extract transaction details from: "${input}". Return JSON only.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: TRANSACTION_SCHEMA,
      },
    });

    return res.json(parseResponse(response.text));
  } catch (error) {
    console.error('Parse text error:', error);
    const message = error instanceof Error ? error.message : 'Could not parse transaction input.';
    return res.status(500).json({ message: 'Could not parse transaction input.', error: message });
  }
};

export const parseTransactionVoice = async (req: Request, res: Response) => {
  try {
    const { audio } = req.body || {};

    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ message: 'Audio data is required.' });
    }

    const ai = getClient();

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: audio } },
          { text: 'Extract transaction details (amount, description, category, type) as JSON.' },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: TRANSACTION_SCHEMA,
      },
    });

    return res.json(parseResponse(response.text));
  } catch (error) {
    console.error('Parse voice error:', error);
    const message = error instanceof Error ? error.message : 'Could not process voice input.';
    return res.status(500).json({ message: 'Could not process voice input.', error: message });
  }
};

