import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaz que define los datos estadísticos del dashboard
export interface DashboardStats {
  totalMerchants: number;
  totalMovements: number;
  todayIncome: number;
  monthlyIncome: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas generales para el dashboard.
   * Endpoint esperado: GET /reports/dashboard-stats
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard-stats`).pipe(
      catchError(error => {
        console.error('Error al obtener las estadísticas del dashboard:', error);
        return throwError(() => new Error('No se pudieron cargar las estadísticas.'));
      })
    );
  }
}
