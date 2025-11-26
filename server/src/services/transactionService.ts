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

export const TransactionService = {
    /**
     * Creates a single transaction.
     */
    createTransaction: async (data: CreateTransactionData): Promise<ITransaction> => {
        return await Transaction.create({
            user: data.user,
            amount: data.amount,
            description: data.description,
            category: data.category,
            type: data.type,
            date: data.date || new Date(),
            isRecurring: data.isRecurring || false,
            relatedPerson: data.relatedPerson,
        });
    },

    /**
     * Creates multiple transactions in bulk.
     */
    createTransactionsBulk: async (dataList: CreateTransactionData[]): Promise<ITransaction[]> => {
        const transactions = dataList.map(data => ({
            user: data.user,
            amount: data.amount,
            description: data.description,
            category: data.category,
            type: data.type,
            date: data.date || new Date(),
            isRecurring: data.isRecurring || false,
            relatedPerson: data.relatedPerson,
        }));

        return (await Transaction.insertMany(transactions)) as unknown as ITransaction[];
    }
};
