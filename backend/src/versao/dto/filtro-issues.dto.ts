import { IsNotEmpty, IsString } from 'class-validator';

export class FiltroIssuesDto {
  @IsString()
  @IsNotEmpty()
  milestone!: string;
}
