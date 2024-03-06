import * as Dto from './dto';
import { Twilio } from 'twilio';
import { go } from '@/core/utils';
import { TWILIO } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class TwilioService {
  private readonly TWILIO_PHONE_NUMBER = this.config.getOrThrow('TWILIO_PHONE_NUMBER');

  constructor(
    private readonly config: ConfigService,
    @Inject(TWILIO) private readonly client: Twilio,
  ) {}

  async sendVerificationCode(code: string, to: string): Promise<Dto.TSendVerificationCode> {
    const from = this.TWILIO_PHONE_NUMBER;
    const body = `Your Ribbon App verification code is: ${code}`;
    const res = await this.createMessage({ to, from, body });
    return res?.status;
  }

  private async createMessage(payload: Dto.TSendSMS) {
    const [data, error] = await go(() => this.client.messages.create(payload));
    if (data) return data;
    return this.handleError(error);
  }

  private handleError(error: any): any {
    throw new InternalServerErrorException({
      cause: error.response.data,
      message: RESPONSE.SERVER_ERROR,
      technicalMessage: error.response.data.message,
    });
  }
}
