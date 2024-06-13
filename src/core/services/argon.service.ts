import * as Argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArgonService {
  constructor(private readonly config: ConfigService) {}

  async hash(plain: string): Promise<string> {
    const secret = this.config.getOrThrow('PASSWORD_HASHING_SECRET')!;
    return (await Argon2.hash(plain, { secret: Buffer.from(secret) })).toString();
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    if (!plain || !hash) return false;
    const secret = this.config.getOrThrow('PASSWORD_HASHING_SECRET')!;
    return await Argon2.verify(hash, plain, { secret: Buffer.from(secret) });
  }
}
