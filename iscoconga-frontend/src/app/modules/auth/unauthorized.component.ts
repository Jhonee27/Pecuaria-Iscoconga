import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <div class="card border-danger">
            <div class="card-body py-5">
              <i class="bi bi-shield-exclamation display-1 text-danger"></i>
              <h1 class="mt-4 text-danger">Acceso No Autorizado</h1>
              <p class="lead">No tienes permisos para acceder a esta página.</p>
              <p class="text-muted">Contacta al administrador si necesitas acceso.</p>
              
              <div class="mt-4">
                <a routerLink="/dashboard" class="btn btn-primary me-2">
                  <i class="bi bi-speedometer2 me-1"></i> Volver al Dashboard
                </a>
                <button class="btn btn-outline-secondary" (click)="goBack()">
                  <i class="bi bi-arrow-left me-1"></i> Volver Atrás
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
  `]
})
export class UnauthorizedComponent {
  goBack(): void {
    window.history.back();
  }
}