import * as Argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArgonService {
  constructor(private readonly config: ConfigService) {}

  async hash(plain: string): Promise<string> {
    const options: any = this.config.get('argon2')!;
    return (await Argon2.hash(plain, options)).toString();
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    if (!plain || !hash) return false;

    const options: any = this.config.get('argon2')!;
    return await Argon2.verify(hash, plain, options);
  }
}
