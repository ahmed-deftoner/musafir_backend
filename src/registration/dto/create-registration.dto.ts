import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateRegistrationDto {
    @IsMongoId()
    @IsNotEmpty()
    flagshipId: string;

    @IsMongoId()
    @IsOptional()
    userId: string;

    @IsMongoId()
    @IsOptional()
    paymentId?: string; 
   
    @IsString()
    @IsOptional()
    joiningFromCity: string;

    @IsString()
    @IsOptional()
    tier: string;

    @IsString()
    @IsOptional()
    bedPreference: string;

    @IsString()
    @IsOptional()
    roomSharing: string;

    @IsString()
    @IsOptional()
    groupMembers: string[];

    @IsString()
    @IsOptional()
    expectations: string;

    @IsString()
    @IsOptional()
    tripType: string;

    @IsNumber()
    @IsOptional()
    price: number;

    @IsNumber()
    @IsOptional()
    amountDue: number = 0;

    @IsBoolean()
    isPaid: boolean = false;
}
