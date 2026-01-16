import { IsNotEmpty, IsString } from "class-validator";

export class ForgotPasswordDto {
    @IsString()
    @IsNotEmpty()
    username: string; // or email, depending on your UX
}