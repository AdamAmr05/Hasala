import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum Category {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  BILLS = 'Bills',
  EDUCATION = 'Education',
  INCOME = 'Income',
  SALARY = 'Salary',
  GIVING = 'Giving',
  HOUSING = 'Housing',
  OTHER = 'Other',
}

export interface ITransaction extends Document {
  user: mongoose.Schema.Types.ObjectId;
  amount: number;
  description: string;
  category: Category;
  type: TransactionType;
  date: Date;
  isRecurring: boolean;
  relatedPerson?: string;
}

const TransactionSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: String,
    enum: Object.values(Category),
    required: [true, 'Please add a category'],
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: [true, 'Please add a type'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  relatedPerson: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;

