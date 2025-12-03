import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { DashboardService } from '../../core/services/dashboard.service';
import { of } from 'rxjs';

// Mock CORRECTO del servicio
class MockDashboardService {
  getDashboardStats() {
    return of({
      totalMerchants: 10,
      totalMovements: 5,
      todayIncome: 150.5,
      monthlyIncome: 2030.75
    });
  }
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule, CommonModule],
      providers: [
        { provide: DashboardService, useClass: MockDashboardService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // =================================================
  //  TEST 1: Crear el componente
  // =================================================
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =================================================
  //  TEST 2: Render del título principal
  // =================================================
  it('should render main title', () => {
    const h1 = fixture.debugElement.query(By.css('h1'))?.nativeElement;
    expect(h1?.textContent).toContain('Dashboard de IscoConga');
  });

  // =================================================
  //  TEST 3: Mostrar loader cuando loading = true
  // =================================================
  it('should show loading spinner when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('.spinner-border'));
    expect(spinner).toBeTruthy();
  });

  // =================================================
  //  TEST 4: No mostrar stats cuando loading = true
  // =================================================
  it('should not show stats while loading', () => {
    component.loading = true;
    fixture.detectChanges();

    const stats = fixture.debugElement.query(By.css('.stat-card'));
    expect(stats).toBeFalsy();
  });

  // =================================================
  //  TEST 5: Mostrar mensaje de error
  // =================================================
  it('should show error message', () => {
    component.errorMessage = 'Error al cargar datos';
    fixture.detectChanges();

    const error = fixture.debugElement.query(By.css('.alert-danger'))?.nativeElement;
    expect(error.textContent).toContain('Error al cargar datos');
  });

  // =================================================
  //  TEST 6: Renderizar estadísticas (4 cards)
  // =================================================
  it('should render 4 stat cards', () => {
    component.loading = false;
    component.errorMessage = '';
    component.stats = {
      totalMerchants: 10,
      totalMovements: 5,
      todayIncome: 150.5,
      monthlyIncome: 2030.75
    };

    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.stat-card'));
    expect(cards.length).toBe(4);
  });

  // =================================================
  //  TEST 7: Renderizar acciones rápidas (2 cards)
  // =================================================
  it('should render action cards', () => {
    component.loading = false;
    component.errorMessage = '';

    fixture.detectChanges();

    const actions = fixture.debugElement.queryAll(By.css('.action-card'));
    expect(actions.length).toBe(2);
  });
});
