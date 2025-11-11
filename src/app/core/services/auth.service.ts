import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, retry } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id?: number;
  email: string;
  role: 'admin' | 'personal';
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  success: boolean;
  user?: User;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Tiempo de expiración del token (en segundos)
  private readonly TOKEN_EXPIRY_BUFFER = 300; // 5 minutos antes de expirar

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.setAuthData(response);
        }),
        catchError(this.handleError('login'))
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    // Opcional: Notificar al backend sobre el logout
    this.http.post(`${this.apiUrl}/logout`, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(error => {
        // Si falla el logout en el backend, igual limpiar localmente
        console.warn('Error en logout del backend:', error);
        return throwError(() => error);
      })
    ).subscribe();

    this.clearAuthData();
  }

  /**
   * Cambiar contraseña con manejo mejorado de errores
   */
  changePassword(changePasswordData: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    const endpoints = [
      `${this.apiUrl}/change-password`,
      `${this.apiUrl}/update-password`,
      `${this.apiUrl}/password`,
      `${environment.apiUrl}/users/change-password`
    ];

    const tryEndpoint = (endpoint: string): Observable<ChangePasswordResponse> => {
      console.log(`🔍 Probando endpoint: ${endpoint}`);
      return this.http.post<ChangePasswordResponse>(
        endpoint, 
        changePasswordData,
        { headers: this.getAuthHeaders() }
      ).pipe(
        retry(1), // Reintentar una vez en caso de error de red
        catchError(error => {
          console.log(`❌ Endpoint falló: ${endpoint}`, error.status);
          return throwError(() => error);
        })
      );
    };

    // Probar endpoints secuencialmente
    return tryEndpoint(endpoints[0]).pipe(
      catchError(() => tryEndpoint(endpoints[1])),
      catchError(() => tryEndpoint(endpoints[2])),
      catchError(() => tryEndpoint(endpoints[3])),
      catchError(this.handleError('changePassword')),
      tap(response => {
        // Actualizar usuario local si viene en la respuesta
        if (response.user) {
          this.updateCurrentUser(response.user);
        }
      })
    );
  }

  /**
   * Verificar si el token está próximo a expirar
   */
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convertir a milisegundos
      const currentTime = Date.now();
      
      return (expiryTime - currentTime) < (this.TOKEN_EXPIRY_BUFFER * 1000);
    } catch {
      return true; // Si hay error al parsear, considerar como expirado
    }
  }

  /**
   * Refrescar token (si tu backend lo soporta)
   */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        this.setAuthData(response);
      }),
      catchError(error => {
        // Si el refresh falla, hacer logout
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar autenticación
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Verificar expiración del token
    if (this.isTokenExpiringSoon()) {
      console.warn('Token próximo a expirar');
      return false;
    }

    return !!this.getCurrentUser();
  }

  /**
   * Verificar rol
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  /**
   * Obtener token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtener información del token (para debug)
   */
  getTokenInfo(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.email,
        role: payload.role,
        exp: new Date(payload.exp * 1000),
        iat: new Date(payload.iat * 1000)
      };
    } catch {
      return null;
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  private setAuthData(response: LoginResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Opcional: Guardar timestamp de expiración
    if (response.expiresIn) {
      const expiryTime = Date.now() + (response.expiresIn * 1000);
      localStorage.setItem('token_expiry', expiryTime.toString());
    }
    
    this.currentUserSubject.next(response.user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expiry');
    this.currentUserSubject.next(null);
  }

  private updateCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      this.currentUserSubject.next(user);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`❌ Error en ${operation}:`, error);

      const apiError: ApiError = {
        message: this.getErrorMessage(error),
        status: error.status,
        timestamp: new Date().toISOString(),
        details: error.error
      };

      // Logout automático en ciertos errores
      if (error.status === 401 || error.status === 403) {
        console.warn('Error de autenticación, limpiando datos...');
        this.clearAuthData();
      }

      return throwError(() => apiError);
    };
  }

  /**
   * Obtener mensaje de error amigable
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      return `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 0:
          return 'No se puede conectar al servidor. Verifica tu conexión a internet.';
        case 400:
          return error.error?.message || 'Solicitud inválida.';
        case 401:
          return 'No autorizado. Tu sesión ha expirado.';
        case 403:
          return 'Acceso denegado. No tienes permisos para esta acción.';
        case 404:
          return 'El recurso solicitado no existe.';
        case 409:
          return 'Conflicto: El recurso ya existe.';
        case 422:
          return 'Datos de entrada inválidos.';
        case 429:
          return 'Demasiadas solicitudes. Intenta más tarde.';
        case 500:
          return 'Error interno del servidor. Contacta al administrador.';
        case 503:
          return 'Servicio no disponible. Intenta más tarde.';
        default:
          return error.error?.message || `Error inesperado: ${error.status}`;
      }
    }
  }
}