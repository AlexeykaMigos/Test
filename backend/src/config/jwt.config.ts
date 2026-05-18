import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_SECRET', 'orderflow-super-secret-key-change-in-production'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
    issuer: 'orderflow',
    audience: 'orderflow-users',
  },
});

export const getJwtRefreshConfig = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_REFRESH_SECRET', 'orderflow-refresh-secret-change-in-production'),
  expiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
});
