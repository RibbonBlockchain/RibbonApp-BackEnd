import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export class Test {
  static number(value: string): boolean {
    return /[0-9]/.test(value);
  }
}

export function HasNumber(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'hasNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return Test.number(value ?? '');
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least a numberic value (0-9)`;
        },
      },
    });
  };
}
