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

export const MULTI_TRANSACTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      description: 'Array of transactions extracted from the input',
      items: TRANSACTION_SCHEMA,
    },
  },
  required: ['transactions'],
};

export const addTransactionTool: FunctionDeclaration = {
  name: 'addTransaction',
  description: 'Add one or more financial transactions (expense or income) to the database.',
  parameters: MULTI_TRANSACTION_SCHEMA,
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
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderCategoryBreakdownTool: FunctionDeclaration = {
  name: 'renderCategoryBreakdown',
  description: 'Display a donut chart showing spending breakdown by category.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderMonthlyProjectionTool: FunctionDeclaration = {
  name: 'renderMonthlyProjection',
  description: 'Display a projection of end-of-month balance based on current spending habits.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderPeopleBreakdownTool: FunctionDeclaration = {
  name: 'renderPeopleBreakdown',
  description: 'Display a visual breakdown of money given to specific people.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderIncomeOverviewTool: FunctionDeclaration = {
  name: 'renderIncomeOverview',
  description: 'Display a visual breakdown of income sources.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderRecurringExpensesTool: FunctionDeclaration = {
  name: 'renderRecurringExpenses',
  description: 'Display a list of active recurring expenses (subscriptions, bills).',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const renderSavingsOverviewTool: FunctionDeclaration = {
  name: 'renderSavingsOverview',
  description: 'Display a visual summary of the user’s savings goals, total saved, and progress.',
  parameters: { type: Type.OBJECT, properties: {} },
};

