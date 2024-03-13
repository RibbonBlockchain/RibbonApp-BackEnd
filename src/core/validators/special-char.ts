import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export class Test {
  static special(value: string): boolean {
    return /[!#$%&'()*+,-./:;<=>?@[\]^_{|}~]/.test(value);
  }
}

export function HasSpecialCharacter(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      name: 'hasSpecialCharacter',
      validator: {
        validate(value: any) {
          return Test.special(value ?? '');
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least a special character`;
        },
      },
    });
  };
}
