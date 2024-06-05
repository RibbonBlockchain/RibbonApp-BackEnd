import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateVaultBody {
  @IsString()
  @IsNotEmpty()
  vaultName: string;
}

export class ClaimPointBody {
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class SwapPointBody {
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
