import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export class Test {
  static upper(value: string): boolean {
    return /[A-Z]/.test(value);
  }
}

export function HasUpperCase(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'hasUpperCase',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return Test.upper(value ?? '');
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least one uppercase letter (A-Z)`;
        },
      },
    });
  };
}
