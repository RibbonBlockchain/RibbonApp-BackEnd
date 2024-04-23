import { Type } from 'class-transformer';
import { QuestionTypeMap, TQuestionType } from '@/modules/drizzle/schema';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class RateQuestionnaireBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  activityId: number;
}

class OptionPayload {
  @IsInt()
  @IsNotEmpty()
  point: number;

  @IsString()
  @IsNotEmpty()
  value: string;
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

export class AddQuestionnaireBody {
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
