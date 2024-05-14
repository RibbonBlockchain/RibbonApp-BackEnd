import { Type } from 'class-transformer';
import { QuestionTypeMap, QuestionnaireStatusMap, TQuestionType, TQuestionnaireStatus } from '@/modules/drizzle/schema';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class RateQuestionnaireBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  questionnaireId: number;
}

export class UpdateQuestionnaireStatusBody {
  @IsNotEmpty()
  @IsIn(QuestionnaireStatusMap)
  status: TQuestionnaireStatus;

  @IsInt()
  @IsNotEmpty()
  id: number;
}

class OptionPayload {
  @IsInt()
  @IsOptional()
  id: number;

  @IsInt()
  @IsNotEmpty()
  point: number;

  @IsString()
  @IsNotEmpty()
  value: string;
}

class QuestionPayload {
  @IsInt()
  @IsOptional()
  id: number;

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
  @IsOptional()
  categoryId: number;

  @IsString()
  @IsOptional()
  category: string;

  @IsNumber()
  reward: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @Type(() => QuestionPayload)
  @ValidateNested({ each: true })
  questions: QuestionPayload[];
}

export class CreateQuestionnaireCategoryBody {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;
}

export class UpdateQuestionnaireBody {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsOptional()
  categoryId: number;

  @IsNumber()
  reward: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @Type(() => QuestionPayload)
  @ValidateNested({ each: true })
  questions: QuestionPayload[];
}

export class UpdateSesData {
  @IsNotEmpty()
  @IsNumber()
  optionId: number;

  @IsNotEmpty()
  @IsNumber()
  point: number;
}
