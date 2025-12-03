import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces
export interface DashboardStats {
  totalMerchants: number;
  totalMovements: number;
  todayIncome: number;
  monthlyIncome: number;
}

export interface ProfitStats {
  ingresos: number;
  gastos: number;
  neto: number;
}

export interface SpeciesStats {
  species: string;
  total: number;
}

export interface VehicleStats {
  vehicle_type: string;
  count: number;
}

export interface ExportParams {
  desde?: string;
  hasta?: string;
  format?: 'csv' | 'xlsx' | 'pdf';
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  // ======================
  // DASHBOARD
  // ======================

  /** Obtiene las estadísticas del dashboard */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard-stats`);
  }

  // ======================
  // GANANCIAS
  // ======================

  /** Obtiene ganancias por rango de fechas */
  getProfitStats(desde?: string, hasta?: string): Observable<ProfitStats> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<ProfitStats>(`${this.apiUrl}/ganancias`, { params });
  }

  // ======================
  // REPORTES SIMPLES
  // ======================

  getDailyReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/daily`);
  }

  getMonthlyReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/monthly`);
  }

  getYearlyReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/yearly`);
  }

  // ======================
  // INGRESOS POR CATEGORÍA
  // ======================

  /** Ingresos por especie */
  getIncomeBySpecies(desde?: string, hasta?: string): Observable<SpeciesStats[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<SpeciesStats[]>(`${this.apiUrl}/por_especie`, { params });
  }

  /** Ingresos por tipo de vehículo */
  getIncomeByVehicle(desde?: string, hasta?: string): Observable<VehicleStats[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<VehicleStats[]>(`${this.apiUrl}/por_vehiculo`, { params });
  }

  // ======================
  // EXPORTACIONES
  // ======================

  /** Genera reporte PDF */
  generatePDFReport(desde?: string, hasta?: string): Observable<Blob> {
    let params = new HttpParams().set('format', 'pdf');
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /** Genera reporte en Excel */
  generateExcelReport(desde?: string, hasta?: string): Observable<Blob> {
    let params = new HttpParams().set('format', 'xlsx');
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /** Genera reporte en CSV */
  generateCSVReport(desde?: string, hasta?: string): Observable<Blob> {
    let params = new HttpParams().set('format', 'csv');
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
