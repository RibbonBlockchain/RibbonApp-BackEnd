import { Roles } from './role.decorator';
import { TRole } from '@/modules/drizzle/schema';
import { AuthGuard } from '@/modules/auth/guard/auth.guard';
import { RoleGuard } from '@/modules/auth/guard/role.guard';
import { CanActivate, UseGuards, applyDecorators } from '@nestjs/common';

type TAuth = { roles?: TRole[] };

const initial = { roles: [] };

export const Auth = ({ roles = [] }: TAuth = initial) => {
  const guards: (Function | CanActivate)[] = [AuthGuard];
  const decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[] = [];

  if (roles.length) {
    guards.push(RoleGuard);
    decorators.push(Roles(...roles));
  }

  return applyDecorators(...decorators, UseGuards(...guards));
};
