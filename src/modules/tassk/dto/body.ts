import { Type } from 'class-transformer';
import { QuestionTypeMap, TQuestionType } from '@/modules/drizzle/schema';
import { IsInt, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsIn, IsString, IsOptional } from 'class-validator';

export class AddTasskBody {
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsNumber()
  reward: number;

  @IsArray()
  @Type(() => QuestionPayload)
  @ValidateNested({ each: true })
  questions: QuestionPayload[];
}

class QuestionPayload {
  @IsNotEmpty()
  @IsIn(QuestionTypeMap)
  type: TQuestionType;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsOptional()
  @Type(() => OptionPayload)
  @ValidateNested({ each: true })
  options: OptionPayload[];
}

class OptionPayload {
  @IsInt()
  @IsNotEmpty()
  point: number;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateTasskCategoryBody {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;
}

export class RateTasskBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  surveyId: number;
}
