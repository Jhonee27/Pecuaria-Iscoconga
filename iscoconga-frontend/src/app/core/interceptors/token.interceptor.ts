import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('🔐 Interceptor - Token:', token ? 'Presente' : 'No presente');
  console.log('🔐 Interceptor - URL:', req.url);

  if (token && req.url.includes('/api/')) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('🔐 Interceptor - Headers agregados');
    return next(authReq);
  }

  console.log('🔐 Interceptor - Sin token, request normal');
  return next(req);
};