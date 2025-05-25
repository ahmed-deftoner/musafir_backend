import { Flagship } from "src/flagship/interfaces/flagship.interface";
import { Registration } from "src/registration/interfaces/registration.interface";
import { User } from "src/user/interfaces/user.interface";

export class Rating{
  readonly _id: string;
  readonly registrationId: string | Registration;
  readonly flagshipId: string | Flagship;
  readonly userId: string | User;
  readonly rating: number;
  readonly review: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
