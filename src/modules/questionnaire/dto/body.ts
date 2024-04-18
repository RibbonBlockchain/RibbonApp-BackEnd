import { Type } from 'class-transformer';
import { QuestionTypeMap, TQuestionType } from '@/modules/drizzle/schema';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class RateQuestionnaireBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  activityId: number;
}

class AddQuestionsPayload {
  @IsNotEmpty()
  @IsIn(QuestionTypeMap)
  type: TQuestionType;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  question: string;
}

export class AddQuestionsBody {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddQuestionsPayload)
  data: AddQuestionsPayload[];
}
