import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";


export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsString()
  @IsNotEmpty()
  travellerType: string;

  @IsString()
  @IsNotEmpty()
  experience: string;

  @IsNumber()
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  likeAboutTrip: string;

  @IsString()
  @IsOptional()
  improvements: string;

  @IsNumber()
  @IsOptional()
  teamResponseRating: number;

  @IsString()
  @IsOptional()
  talkedTo: string;

  @IsString()
  @IsOptional()
  enjoyableActivities: string;

  @IsString()
  @IsOptional()
  leastEnjoyableActivities: string;

  @IsString()
  @IsOptional()
  whistleblowing: string;

  @IsString()
  @IsOptional()
  contactInfo: string;
}