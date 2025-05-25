import { User } from 'src/user/interfaces/user.interface';
import { Flagship } from './flagship.interface';
import { Payment } from 'src/payment/interface/payment.interface';

export class Registration {
  flagship: Flagship;
  user: User;
  payment: Payment;
  status: 'pending' | 'accepted' | 'rejected';
  comment: string;
}
