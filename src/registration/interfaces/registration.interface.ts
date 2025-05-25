import { Flagship } from "src/flagship/interfaces/flagship.interface";
import { Rating } from "src/Rating/interfaces/rating.interface";
import { User } from "src/user/interfaces/user.interface";

export class Registration {
  readonly _id: string;
  readonly flagshipId: string | Flagship;
  readonly userId: string;
  readonly user: string | User;
  readonly flagship: string | Flagship;
  readonly paymentId?: string;
  readonly isPaid?: boolean;
  readonly joiningFromCity?: string;
  readonly tier?: string;
  readonly bedPreference?: string;
  readonly roomSharing?: string;
  readonly groupMembers?: string[];
  readonly expectations?: string;
  readonly tripType?: string;
  readonly price: number;
  readonly amountDue: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  ratingId?: string | Rating;
}
