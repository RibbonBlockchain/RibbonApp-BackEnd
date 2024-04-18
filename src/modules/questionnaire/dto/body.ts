import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class RateQuestionnaireBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  activityId: number;
}

export class AddQuestionnaire {
  @IsString()
  type: any;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  question: string;
}
