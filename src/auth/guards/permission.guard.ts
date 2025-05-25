import {
    Injectable,
    Inject,
    CanActivate,
    ExecutionContext,
    HttpException,
    Logger,
    HttpStatus,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  
  @Injectable()
  export class PermissionGuard implements CanActivate {
    private readonly logger = new Logger('PermissionsGuard');
    constructor(
      private reflector: Reflector,
    ) {}
  
    public async canActivate(context: ExecutionContext): Promise<boolean> {
      const permissions = this.reflector.get<string[]>(
        'permission',
        context.getHandler(),
      );
  
      if (!permissions || !permissions.length) {
        return true;
      }
      const request = context.switchToHttp().getRequest();
      if (!request?.tokenData?.user) {
        throw new HttpException(
          {
            message: 'User is not authorized to access this service',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      const userPermissions = request?.tokenData?.user?.roleData?.permissions;
  
      if (!userPermissions) {
        throw new HttpException(
          {
            message: 'permission denied',
            data: null,
            errors: "Don't have permission to access this route",
          },
          HttpStatus.FORBIDDEN,
        );
      }
  
      const hasPermissions = permissions.every((permission) => {
        const matchedIndex = userPermissions.findIndex(
          (upm) => upm.name == permission.split('.')[0],
        );
        if (matchedIndex === -1) return false;
  
        const macthedPermssion = userPermissions[matchedIndex]?.types?.includes(
          permission.split('.')[1],
        );
        if (!macthedPermssion) return false;
        return true;
      });
  
      if (!hasPermissions) {
        throw new HttpException(
          {
            message: 'permission denied',
            data: null,
            errors: "Don't have permission to access this route",
          },
          HttpStatus.FORBIDDEN,
        );
      }
  
      return true;
    }
  }