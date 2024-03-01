import { ValidationError } from 'class-validator';
import { ValidationPipeOptions } from '@nestjs/common/pipes';
import { BadRequestException } from '@nestjs/common/exceptions';

export default () => ({
  port: parseInt(process.env.PORT || '5000', 10) || 3000,

  database: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/ribbon',

  validationPipeOptions: {
    whitelist: true,
    transform: true,
    validateCustomDecorators: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors: ValidationError[]) => {
      return new BadRequestException(errors[0]?.constraints?.[Object.keys(errors[0].constraints)[0]]);
    },
  } as ValidationPipeOptions,
});
