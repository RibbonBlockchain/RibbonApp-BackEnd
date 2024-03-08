import { ROLES } from '@/core/constants';
import { SetMetadata } from '@nestjs/common';
import { TRole } from '@/modules/drizzle/schema';

export const Roles = (...roles: TRole[]) => SetMetadata(ROLES, roles);
