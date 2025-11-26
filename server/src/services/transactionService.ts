import mongoose, { HydratedDocument } from 'mongoose';
import Transaction, { ITransaction, Category, TransactionType } from '../models/Transaction';

interface CreateTransactionData {
    user: string;
    amount: number;
    description: string;
    category: Category;
    type: TransactionType;
    date?: Date | string;
    isRecurring?: boolean;
    relatedPerson?: string;
}

const mapTransactionData = (data: CreateTransactionData) => ({
    user: data.user,
    amount: data.amount,
    description: data.description,
    category: data.category,
    type: data.type,
    date: data.date || new Date(),
    isRecurring: data.isRecurring || false,
    relatedPerson: data.relatedPerson,
});

export const TransactionService = {
    /**
     * Creates a single transaction.
     */
    createTransaction: async (data: CreateTransactionData): Promise<ITransaction> => {
        return await Transaction.create(mapTransactionData(data));
    },

    /**
     * Creates multiple transactions in bulk.
     */
    createTransactionsBulk: async (dataList: CreateTransactionData[]): Promise<HydratedDocument<ITransaction>[]> => {
        return (await Transaction.insertMany(dataList.map(mapTransactionData))) as unknown as HydratedDocument<ITransaction>[];
    }
};
