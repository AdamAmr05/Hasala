import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { MODEL_NAME, MULTI_TRANSACTION_SCHEMA } from '../utils/geminiConfig';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/authMiddleware';

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

const getExistingPeople = async (userId: string) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: startOfMonth },
    relatedPerson: { $exists: true, $ne: null },
  }).select('relatedPerson');

  const people = new Set(transactions.map((t) => t.relatedPerson).filter(Boolean));
  return Array.from(people);
};

export const parseTransactionText = async (req: AuthRequest, res: Response) => {
  try {
    const { input } = req.body || {};

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return res.status(400).json({ message: 'Input text is required.' });
    }

    const ai = getClient();
    const existingPeople = req.user ? await getExistingPeople(req.user._id.toString()) : [];
    const peopleContext = existingPeople.length > 0
      ? `Existing people this month: ${existingPeople.join(', ')}. Match names if possible.`
      : '';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [{ text: `Extract ALL transactions from: "${input}". ${peopleContext} Return JSON only.` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: MULTI_TRANSACTION_SCHEMA,
      },
    });

    return res.json(parseResponse(response.text));
  } catch (error) {
    console.error('Parse text error:', error);
    const message = error instanceof Error ? error.message : 'Could not parse transaction input.';
    return res.status(500).json({ message: 'Could not parse transaction input.', error: message });
  }
};

export const parseTransactionVoice = async (req: AuthRequest, res: Response) => {
  console.log('--- VOICE PARSE REQUEST RECEIVED ---');
  try {
    const { audio } = req.body || {};

    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ message: 'Audio data is required.' });
    }

    const ai = getClient();
    const existingPeople = req.user ? await getExistingPeople(req.user._id.toString()) : [];
    const peopleContext = existingPeople.length > 0
      ? `Existing people this month: ${existingPeople.join(', ')}. Match names if possible.`
      : '';

    let retries = 3;
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const contents = [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'audio/webm', data: audio.split(',')[1] || audio } },
              { text: `Extract ALL transactions (amount, description, category, type, relatedPerson) as JSON. Default to EGP currency if not specified. ${peopleContext}` },
            ],
          },
        ];

        const config = {
          responseMimeType: 'application/json',
          responseSchema: MULTI_TRANSACTION_SCHEMA,
        };

        console.log('--- VOICE INPUT CONTEXT ---');
        // Don't log the full base64 audio data, it's too huge
        console.log('Text Prompt:', contents[0].parts[1].text);
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('---------------------------');

        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents,
          config,
        });

        console.log('--- VOICE PARSE RESPONSE ---');
        console.log(response.text);
        if (response.usageMetadata) {
          console.log('--- VOICE TOKEN USAGE ---');
          console.log('Total Tokens:', response.usageMetadata.totalTokenCount);
        }
        console.log('----------------------------');

        return res.json(parseResponse(response.text));
      } catch (error: any) {
        // If it's the last attempt, or if it's not a retryable error, throw it
        const isRetryable = error?.status === 503 || error?.status === 429 || error?.message?.includes('overloaded');

        if (attempt === 3 || !isRetryable) {
          throw error;
        }

        console.log(`Gemini overloaded, retrying... (Attempt ${attempt}/3)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff: 1s, 2s
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Parse voice error:', error);
    const message = error instanceof Error ? error.message : 'Could not process voice input.';
    return res.status(500).json({ message: 'Could not process voice input.', error: message });
  }
};

