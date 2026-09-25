import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but never throws — requests without a valid token
 * simply get req.user = undefined.  Use this for endpoints that are
 * accessible to both authenticated users and anonymous guests.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Override: swallow errors so the request always proceeds
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest<TUser = any>(_err: any, user: TUser): TUser {
    return user ?? (null as unknown as TUser);
  }
}
