export class Feedback {
  readonly _id: string;
  readonly travellerType: string;
  readonly experience: string;
  readonly rating: number;
  readonly likeAboutTrip: string;
  readonly improvements: string;
  readonly teamResponseRating?: number;
  readonly talkedTo?: string;
  readonly enjoyableActivities?: string;
  readonly leastEnjoyableActivities?: string;
  readonly whistleblowing?: string;
  readonly contactInfo?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}