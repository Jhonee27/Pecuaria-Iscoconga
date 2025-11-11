import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.getCurrentUser();
    const allowedRoles = route.data['roles'] as string[];

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (!allowedRoles || allowedRoles.includes(user.role)) {
      return true;
    }

    // Redirigir a una página de no autorizado si no tiene permisos
    this.router.navigate(['/unauthorized']);
    return false;
  }
}