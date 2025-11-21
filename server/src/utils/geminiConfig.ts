import { Type, FunctionDeclaration, Schema } from '@google/genai';
import { Category, TransactionType } from '../models/Transaction';

export const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-latest';

export const TRANSACTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    amount: {
      type: Type.NUMBER,
      description: 'The numerical amount in EGP',
    },
    description: {
      type: Type.STRING,
      description: 'Brief description of what was bought or earned',
    },
    category: {
      type: Type.STRING,
      enum: Object.values(Category),
      description: 'The category of the transaction. Use "Giving" when the user supports someone financially (e.g. family, friends, charity). Do NOT use for buying gifts.',
    },
    type: {
      type: Type.STRING,
      enum: Object.values(TransactionType),
      description: 'Transaction type',
    },
    relatedPerson: {
      type: Type.STRING,
      description: 'The name of the person involved in the transaction (e.g., who received money or gave money). Use the canonical name if it matches an existing person.',
    },
  },
  required: ['amount', 'description', 'category', 'type'],
};

export const addTransactionTool: FunctionDeclaration = {
  name: 'addTransaction',
  description: 'Add a new financial transaction (expense or income) to the database.',
  parameters: TRANSACTION_SCHEMA,
};

export const renderSpendingChartTool: FunctionDeclaration = {
  name: 'renderSpendingChart',
  description: 'Display a bar chart visualizing the user’s spending trends over the last week.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderRecentTransactionsTool: FunctionDeclaration = {
  name: 'renderRecentTransactions',
  description: 'Display a list of the most recent transactions.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderBudgetOverviewTool: FunctionDeclaration = {
  name: 'renderBudgetOverview',
  description: 'Display a card showing the remaining budget and progress.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      totalSpent: { type: Type.NUMBER, description: 'Total amount spent this month' },
      totalIncome: { type: Type.NUMBER, description: 'Total income this month' },
      budget: { type: Type.NUMBER, description: 'The user defined budget goal' },
    },
  },
};

export const renderCategoryBreakdownTool: FunctionDeclaration = {
  name: 'renderCategoryBreakdown',
  description: 'Display a donut chart showing spending breakdown by category.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      categories: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.NUMBER },
          },
        },
        description: 'List of categories and their total spending',
      },
    },
  },
};

export const renderMonthlyProjectionTool: FunctionDeclaration = {
  name: 'renderMonthlyProjection',
  description: 'Display a projection of end-of-month balance based on current spending habits.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      totalSpent: { type: Type.NUMBER, description: 'Total amount spent this month' },
      budget: { type: Type.NUMBER, description: 'The user defined budget goal' },
    },
  },
};

export const renderPeopleBreakdownTool: FunctionDeclaration = {
  name: 'renderPeopleBreakdown',
  description: 'Display a visual breakdown of money given to specific people.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      people: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.NUMBER },
          },
        },
        description: 'List of people and total amount given',
      },
    },
  },
};

export const renderIncomeOverviewTool: FunctionDeclaration = {
  name: 'renderIncomeOverview',
  description: 'Display a visual breakdown of income sources.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      incomeSources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.NUMBER },
          },
        },
        description: 'List of income sources and their total amount',
      },
      totalIncome: { type: Type.NUMBER, description: 'Total income amount' },
    },
  },
};

