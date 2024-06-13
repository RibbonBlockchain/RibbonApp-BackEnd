import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CreateVaultBody {
  @IsString()
  @IsNotEmpty()
  vaultName: string;
}

export class ClaimPointBody {
  @IsNotEmpty()
  @IsNumberString()
  amount: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class SwapPointBody {
  @IsNotEmpty()
  @IsNumberString()
  amount: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class WithdrawPointBody {
  @IsNotEmpty()
  @IsNumberString()
  amount: string;
}
