import { GoogleGenAI, Type, FunctionDeclaration, Content, Schema } from "@google/genai";
import { Transaction, Category, TransactionType, ChatResponse, ToolCall, ChatMessage, ChatSender } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * SHARED SCHEMA DEFINITION
 * This ensures that Voice, Text, and Chat all use the EXACT same strict validation rules.
 * We are using Gemini's "Structured Outputs" capability here to enforce the Enums.
 */
const TRANSACTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    amount: { 
      type: Type.NUMBER, 
      description: 'The numerical amount in EGP' 
    },
    description: { 
      type: Type.STRING, 
      description: 'Brief description of what was bought or earned' 
    },
    category: { 
      type: Type.STRING, 
      // Strictly enforce your specific categories
      enum: ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Education", "Income", "Other"],
      description: 'The category of the transaction'
    },
    type: { 
      type: Type.STRING, 
      enum: ["EXPENSE", "INCOME"], 
      description: 'Transaction type' 
    }
  },
  required: ['amount', 'description', 'category', 'type']
};

/**
 * 1. ACTION TOOL: Modifies State
 * Uses the shared schema to ensure the AI only calls this with valid data.
 */
const addTransactionTool: FunctionDeclaration = {
  name: 'addTransaction',
  description: 'Add a new financial transaction (expense or income) to the database.',
  parameters: TRANSACTION_SCHEMA // <--- Passing the strict schema here
};

/**
 * 2. VIEW TOOLS: Renders UI (Client-Side Only)
 */
const renderSpendingChartTool: FunctionDeclaration = {
  name: 'renderSpendingChart',
  description: 'Display a bar chart visualizing the user\'s spending trends over the last week.',
  parameters: { type: Type.OBJECT, properties: {} } // No args needed for now
};

const renderRecentTransactionsTool: FunctionDeclaration = {
  name: 'renderRecentTransactions',
  description: 'Display a list of the most recent transactions.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const renderBudgetOverviewTool: FunctionDeclaration = {
  name: 'renderBudgetOverview',
  description: 'Display a card showing the remaining budget and progress.',
  parameters: { type: Type.OBJECT, properties: {} }
};

/**
 * System prompt construction
 */
const getSystemInstruction = (transactions: Transaction[]) => {
  const recent = transactions.slice(0, 15).map(t => 
    `${t.date.split('T')[0]}: ${t.description} (${t.amount} EGP) - ${t.category}`
  ).join('\n');
  
  const totalSpent = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  return `
    You are Hasala AI, a financial assistant for an Egyptian university student.
    
    CONTEXT:
    Total Spent: ${totalSpent} EGP.
    Recent Transactions:
    ${recent}
    
    INSTRUCTIONS:
    1. **Persona**: Friendly, helpful, uses occasional Egyptian context/slang (like "Ahlan", "Tamam").
    2. **Visualizing**: If the user asks about patterns, history, or budget, DO NOT describe it in text. CALL THE APPROPRIATE VIEW TOOL (e.g., renderSpendingChart).
    3. **Actions**: If the user wants to add a transaction, CALL the addTransaction tool.
    4. **Memory**: Use the conversation history to understand follow-up questions.
  `;
};

/**
 * Send a message to the chat model with context and tools
 */
export const sendChatMessage = async (
  message: string, 
  history: ChatMessage[], 
  transactions: Transaction[]
): Promise<ChatResponse> => {
  try {
    // Convert ChatMessage[] to Gemini Content[] format for context
    const contents: Content[] = history.map(msg => ({
      role: msg.sender === ChatSender.USER ? 'user' : 'model',
      parts: [{ text: msg.text }] 
    }));

    // Append the new message to the history
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(transactions),
        tools: [{ 
          functionDeclarations: [
            addTransactionTool, 
            renderSpendingChartTool, 
            renderRecentTransactionsTool, 
            renderBudgetOverviewTool
          ] 
        }],
      }
    });

    const text = response.text || "";
    
    // Map Gemini function calls to our ToolCall interface
    const toolCalls: ToolCall[] = response.functionCalls?.map(fc => ({
      name: fc.name,
      args: fc.args
    })) || [];

    return {
      text: text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: "Ma3lesh (Sorry), I'm having trouble connecting right now." };
  }
};

/**
 * Parses unstructured text input into a structured Transaction object using Gemini Structured Outputs.
 */
export const parseTransactionFromInput = async (input: string): Promise<Partial<Transaction>> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Extract transaction details from: "${input}". Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSACTION_SCHEMA, // <--- Using the exact same strict schema
      }
    });
    
    // Because we used responseSchema, response.text is guaranteed to be valid JSON matching our type
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Parsing error:", error);
    throw new Error("Could not understand transaction.");
  }
};

/**
 * Processes raw audio data into a structured Transaction object using Gemini Structured Outputs.
 */
export const processVoiceTransaction = async (base64Audio: string): Promise<Partial<Transaction>> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/wav", data: base64Audio } },
          { text: "Extract transaction details (amount, description, category, type) as JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSACTION_SCHEMA, // <--- Using the exact same strict schema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Voice error:", error);
    throw new Error("Could not process voice input.");
  }
};
