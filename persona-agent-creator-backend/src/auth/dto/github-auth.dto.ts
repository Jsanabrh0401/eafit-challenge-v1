import { IsString, MinLength } from 'class-validator';

export class GithubAuthDto {
  @IsString()
  @MinLength(8)
  code!: string;
}
