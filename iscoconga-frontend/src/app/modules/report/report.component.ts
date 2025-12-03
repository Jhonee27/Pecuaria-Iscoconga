import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ReportService, DashboardStats } from '../../core/services/report.service';

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule] // solo esto
})
export class ReportComponent implements OnInit {
    isLoading = true;
    hasError = false;
    isGeneratingReport = false;

    chartPeriod: 'day' | 'week' = 'day';
    dateRange: { desde?: string; hasta?: string } = {};
    stats: DashboardStats = { totalMerchants: 0, totalMovements: 0, todayIncome: 0, monthlyIncome: 0 };
    lastUpdate: Date = new Date();

    constructor(private reportService: ReportService) { }

    ngOnInit(): void {
        this.reloadAll();
    }

    reloadAll() {
        this.isLoading = true;
        this.hasError = false;

        this.reportService.getDashboardStats().subscribe({
            next: (res) => {
                this.stats = res;
                this.lastUpdate = new Date();
                this.isLoading = false;
            },
            error: () => {
                this.hasError = true;
                this.isLoading = false;
            }
        });
    }

    setQuickFilter(period: 'today' | 'week' | 'month') {
        const today = new Date();
        if (period === 'today') {
            this.dateRange.desde = this.formatDate(today);
            this.dateRange.hasta = this.formatDate(today);
        } else if (period === 'week') {
            const start = new Date(today);
            start.setDate(today.getDate() - 7);
            this.dateRange.desde = this.formatDate(start);
            this.dateRange.hasta = this.formatDate(today);
        } else if (period === 'month') {
            const start = new Date(today);
            start.setMonth(today.getMonth() - 1);
            this.dateRange.desde = this.formatDate(start);
            this.dateRange.hasta = this.formatDate(today);
        }
    }

    applyFilters() {
        this.reloadAll();
    }

    clearFilters() {
        this.dateRange = {};
        this.reloadAll();
    }

    setChartPeriod(period: 'day' | 'week') {
        this.chartPeriod = period;
    }

    quickDownload(format: 'excel' | 'csv') {
        if (format === 'excel') {
            this.generateExcelReport();
        } else {
            this.generateCSVReport();
        }
    }

    generateExcelReport() {
        this.isGeneratingReport = true;
        console.log('Generando Excel con rango:', this.dateRange);

        this.reportService.generateExcelReport(this.dateRange.desde, this.dateRange.hasta).subscribe({
            next: (blob) => {
                this.downloadFile(blob, 'Reporte_Estadisticas.xlsx');
                this.isGeneratingReport = false;
                this.showNotification('✅ Reporte Excel generado exitosamente', 'success');
            },
            error: (err) => {
                console.error('Error generating Excel report:', err);
                this.isGeneratingReport = false;
                this.showNotification('❌ Error al generar el reporte Excel', 'error');
            }
        });
    }

    generateCSVReport() {
        this.isGeneratingReport = true;
        console.log('Generando CSV con rango:', this.dateRange);

        this.reportService.generateCSVReport(this.dateRange.desde, this.dateRange.hasta).subscribe({
            next: (blob) => {
                this.downloadFile(blob, 'Reporte_Estadisticas.csv');
                this.isGeneratingReport = false;
                this.showNotification('✅ Reporte CSV generado exitosamente', 'success');
            },
            error: (err) => {
                console.error('Error generating CSV report:', err);
                this.isGeneratingReport = false;
                this.showNotification('❌ Error al generar el reporte CSV', 'error');
            }
        });
    }

    private downloadFile(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename.split('.')[0]}_${this.getFormattedDateForFile()}.${filename.split('.')[1]}`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    private showNotification(message: string, type: 'success' | 'error') {
        if (type === 'success') {
            console.log('✅ SUCCESS:', message);
            alert(message);
        } else {
            console.error('❌ ERROR:', message);
            alert(message);
        }
    }

    private getFormattedDateForFile(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}`;
    }

    getLastUpdateFormatted(): string {
        return this.lastUpdate.toLocaleTimeString();
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
