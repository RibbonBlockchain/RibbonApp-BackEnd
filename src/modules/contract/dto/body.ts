import { IsNotEmpty, IsNumber, IsNumberString, IsString } from 'class-validator';

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

export class BaseClaimBody {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class GetTransactionsBody {
  @IsString()
  @IsNotEmpty()
  address: string;
}
