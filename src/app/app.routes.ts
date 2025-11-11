import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // 🔐 Autenticación
  { 
    path: 'login', 
    loadComponent: () => import('./modules/auth/login/login.component')
      .then(m => m.LoginComponent)
  },

  // 🧭 Dashboard principal
  { 
    path: 'dashboard', 
    loadComponent: () => import('./modules/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },

  // 👥 Comerciantes
  { 
    path: 'merchants', 
    loadComponent: () => import('./modules/merchants/merchant-list.component')
      .then(m => m.MerchantListComponent),
    canActivate: [AuthGuard]
  },

  // 🚚 Movimientos
  { 
    path: 'movements', 
    loadComponent: () => import('./modules/movements/movement-form.component')
      .then(m => m.MovementFormComponent),
    canActivate: [AuthGuard]
  },

  // 👤 Perfil de usuario
  { 
    path: 'profile', 
    loadComponent: () => import('./modules/auth/profile/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },

  // ⚙️ Configuración
  { 
    path: 'settings', 
    loadComponent: () => import('./modules/auth/settings/settings.component')
      .then(m => m.SettingsComponent),
    canActivate: [AuthGuard]
  },

  // 👑 Gestión de usuarios (solo admin)
  { 
    path: 'admin/users',
    loadComponent: () => import('./modules/admin/user-management.component')
      .then(m => m.UserManagementComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },

  // 📊 Estadísticas (solo admin)
  { 
    path: 'statistics', 
    loadComponent: () => import('./modules/report/report.component')
      .then(m => m.StatisticsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },

  // 🚫 Acceso no autorizado
  { 
    path: 'unauthorized', 
    loadComponent: () => import('./modules/auth/unauthorized.component')
      .then(m => m.UnauthorizedComponent)
  },

  // 🔁 Redirección por defecto
  { path: '**', redirectTo: '/login' }
];
