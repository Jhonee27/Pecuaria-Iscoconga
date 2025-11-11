import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  format?: 'csv' | 'xlsx';
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:3000/api/reports'; // Ajusta según tu puerto

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas del dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard-stats`);
  }

  /**
   * Obtiene ganancias por rango de fechas
   */
  getProfitStats(desde?: string, hasta?: string): Observable<ProfitStats> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    
    return this.http.get<ProfitStats>(`${this.apiUrl}/ganancias`, { params });
  }

  /**
   * Reporte diario
   */
  getDailyReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/daily`);
  }

  /**
   * Reporte mensual
   */
  getMonthlyReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/monthly`);
  }

  /**
   * Reporte anual
   */
  getYearlyReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/yearly`);
  }

  /**
   * Ingresos por especie
   */
  getIncomeBySpecies(desde?: string, hasta?: string): Observable<SpeciesStats[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    
    return this.http.get<SpeciesStats[]>(`${this.apiUrl}/por_especie`, { params });
  }

  /**
   * Ingresos por tipo de vehículo
   */
  getIncomeByVehicle(desde?: string, hasta?: string): Observable<VehicleStats[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    
    return this.http.get<VehicleStats[]>(`${this.apiUrl}/por_vehiculo`, { params });
  }

  /**
   * Genera reporte en PDF usando el endpoint de exportación
   */
  generatePDFReport(desde?: string, hasta?: string): Observable<Blob> {
    let params = new HttpParams().set('format', 'xlsx');
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Genera reporte en Excel
   */
  generateExcelReport(desde?: string, hasta?: string): Observable<Blob> {
    let params = new HttpParams().set('format', 'xlsx');
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Genera reporte en CSV
   */
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