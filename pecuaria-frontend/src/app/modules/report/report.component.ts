import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ReportService, 
  DashboardStats, 
  ProfitStats, 
  SpeciesStats, 
  VehicleStats 
} from '../../core/services/report.service';
import { saveAs } from 'file-saver';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class StatisticsComponent implements OnInit {
  // Estadísticas principales
  stats: DashboardStats = {
    totalMerchants: 0,
    totalMovements: 0,
    todayIncome: 0,
    monthlyIncome: 0
  };

  // Estadísticas de ganancias
  profitStats: ProfitStats = {
    ingresos: 0,
    gastos: 0,
    neto: 0
  };

  // Estadísticas por especie
  speciesStats: SpeciesStats[] = [];
  
  // Estadísticas por vehículo
  vehicleStats: VehicleStats[] = [];

  // Filtros
  dateRange = {
    desde: '',
    hasta: ''
  };

  // Estados
  isLoading = true;
  hasError = false;
  isGeneratingReport = false;

  // === Configuración de gráficos ===

  // Gráfico de ingresos principales
  incomeChartLabels: string[] = ['Hoy', 'Mensual'];
  incomeChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.incomeChartLabels,
    datasets: [
      {
        data: [0, 0],
        label: 'Ingresos (S/)',
        backgroundColor: ['#3b82f6', '#10b981'],
        borderColor: ['#1e40af', '#047857'],
        borderWidth: 2
      }
    ]
  };
  incomeChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Comparación de Ingresos', font: { size: 16, weight: 'bold' } }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => 'S/ ' + value.toLocaleString() }
      }
    }
  };
  incomeChartType: ChartConfiguration<'bar'>['type'] = 'bar';

  // Gráfico de ganancias
  profitChartLabels: string[] = ['Ingresos', 'Gastos', 'Neto'];
  profitChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.profitChartLabels,
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
        hoverBackgroundColor: ['#059669', '#dc2626', '#2563eb']
      }
    ]
  };
  profitChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (context) => `${context.label}: S/ ${context.parsed.toLocaleString()}` } }
    }
  };
  profitChartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';

  // Gráfico por especie
  speciesChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
          '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899'
        ]
      }
    ]
  };
  speciesChartOptions: ChartOptions<'pie'> = { responsive: true, plugins: { legend: { position: 'right' } } };
  speciesChartType: ChartConfiguration<'pie'>['type'] = 'pie';

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadProfitStats();
    this.loadSpeciesStats();
    this.loadVehicleStats();
  }

  /** Carga las estadísticas del dashboard */
  loadDashboardStats(): void {
    this.isLoading = true;
    this.reportService.getDashboardStats().subscribe({
      next: (res: DashboardStats) => {
        this.stats = res;
        this.incomeChartData.datasets[0].data = [res.todayIncome || 0, res.monthlyIncome || 0];
        this.isLoading = false;
      },
      error: (err: any) => { console.error(err); this.hasError = true; this.isLoading = false; }
    });
  }

  /** Carga estadísticas de ganancias */
  loadProfitStats(desde?: string, hasta?: string): void {
    this.reportService.getProfitStats(desde, hasta).subscribe({
      next: (res: ProfitStats) => { this.profitStats = res; this.profitChartData.datasets[0].data = [res.ingresos || 0, res.gastos || 0, res.neto || 0]; },
      error: (err: any) => console.error(err)
    });
  }

  /** Carga estadísticas por especie */
  loadSpeciesStats(desde?: string, hasta?: string): void {
    this.reportService.getIncomeBySpecies(desde, hasta).subscribe({
      next: (res: SpeciesStats[]) => {
        this.speciesStats = res;
        this.speciesChartData.labels = res.map(item => item.species);
        this.speciesChartData.datasets[0].data = res.map(item => item.total);
      },
      error: (err: any) => console.error(err)
    });
  }

  /** Carga estadísticas por vehículo */
  loadVehicleStats(desde?: string, hasta?: string): void {
    this.reportService.getIncomeByVehicle(desde, hasta).subscribe({
      next: (res: VehicleStats[]) => this.vehicleStats = res,
      error: (err: any) => console.error(err)
    });
  }

  /** Filtros de fecha */
  applyFilters(): void {
    this.loadProfitStats(this.dateRange.desde, this.dateRange.hasta);
    this.loadSpeciesStats(this.dateRange.desde, this.dateRange.hasta);
    this.loadVehicleStats(this.dateRange.desde, this.dateRange.hasta);
  }

  clearFilters(): void {
    this.dateRange = { desde: '', hasta: '' };
    this.loadProfitStats();
    this.loadSpeciesStats();
    this.loadVehicleStats();
  }

  /** Generar reporte Excel */
  generateExcelReport(): void {
    this.isGeneratingReport = true;
    this.reportService.generateExcelReport(this.dateRange.desde, this.dateRange.hasta).subscribe({
      next: (blob: Blob) => { saveAs(blob, `reporte-completo-${new Date().toISOString().split('T')[0]}.xlsx`); this.isGeneratingReport = false; },
      error: (err) => { console.error(err); alert('Error al generar Excel'); this.isGeneratingReport = false; }
    });
  }

  /** Generar reporte CSV */
  generateCSVReport(): void {
    this.isGeneratingReport = true;
    this.reportService.generateCSVReport(this.dateRange.desde, this.dateRange.hasta).subscribe({
      next: (blob: Blob) => { saveAs(blob, `reporte-completo-${new Date().toISOString().split('T')[0]}.csv`); this.isGeneratingReport = false; },
      error: (err) => { console.error(err); alert('Error al generar CSV'); this.isGeneratingReport = false; }
    });
  }

  reloadAll(): void {
    this.isLoading = true; this.hasError = false;
    this.loadDashboardStats(); this.loadProfitStats(); this.loadSpeciesStats(); this.loadVehicleStats();
  }
}
