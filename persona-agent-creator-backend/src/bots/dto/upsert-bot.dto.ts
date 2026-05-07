import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsNumber, IsOptional, IsString, IsUrl, Max, Min, MinLength, ValidateNested } from 'class-validator';

class PersonaDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  profession!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}

class ServiceDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsString()
  @MinLength(2)
  category!: string;
}

export class UpsertBotDto {
  @ValidateNested()
  @Type(() => PersonaDto)
  persona!: PersonaDto;

  @ValidateNested()
  @Type(() => ServiceDto)
  service!: ServiceDto;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature!: number;

  @IsString()
  @MinLength(20)
  prompt!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['google-calendar', 'wikipedia', 'weather'], { each: true })
  mcpServers!: Array<'google-calendar' | 'wikipedia' | 'weather'>;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  ragUrls?: string[];
}
