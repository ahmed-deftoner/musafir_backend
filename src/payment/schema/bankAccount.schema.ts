import { Schema } from 'mongoose';

export const BankAccountSchema = new Schema({
  bankName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  IBAN: {
    type: String,
    required: true,
  },
});
