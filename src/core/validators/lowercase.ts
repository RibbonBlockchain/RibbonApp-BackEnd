import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export class Test {
  static lower(value: string): boolean {
    return /[a-z]/.test(value);
  }
}

export function HasLowerCase(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'hasLowerCase',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return Test.lower(value ?? '');
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least one lowercase letter (a-z)`;
        },
      },
    });
  };
}
