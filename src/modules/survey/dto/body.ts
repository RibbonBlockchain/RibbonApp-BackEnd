import { Type } from 'class-transformer';
import { QuestionTypeMap, TQuestionType } from '@/modules/drizzle/schema';
import { IsInt, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsIn, IsString, IsOptional } from 'class-validator';

export class AddSurveyBody {
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

export class CreateSurveyCategoryBody {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;
}

export class RateSurveyBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  surveyId: number;
}

export class SesData {
  @IsNotEmpty()
  @IsNumber()
  optionId: number;

  @IsNotEmpty()
  @IsNumber()
  point: number;
}

export class UpdateSes {
  @IsArray()
  data: SesData[];
}
