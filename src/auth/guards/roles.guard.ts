import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;
    console.log(requiredRoles, 'requiredRoles');
    
    const request = context.switchToHttp().getRequest();
    // request.user = {roles: ['admin']}
    const user = request.user;
    console.log(request.user, 'request.user');
    if (!user) {
      throw new ForbiddenException('User not found in request. JWT validation might have failed.');
    }

    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
