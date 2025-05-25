import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsNumber, IsDate } from 'class-validator';

export class CreatePaymentDTO {
    @IsDate()
    @IsOptional()
    paymentDate: string;

    @IsMongoId()
    @IsNotEmpty()
    userId: string; 
    
    @IsMongoId()
    @IsNotEmpty()
    flagshipId: string; 

    @IsMongoId()
    @IsNotEmpty()
    registrationId: string; 
   
    @IsNumber()
    @IsOptional()
    discount: string;

    @IsNumber()
    @IsOptional()
    amount: string;
}