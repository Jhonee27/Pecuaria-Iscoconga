import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, User, ChangePasswordRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>
              <i class="bi bi-gear me-2"></i>
              Configuración
            </h1>
            <div class="d-flex gap-2">
              <a routerLink="/profile" class="btn btn-outline-primary">
                <i class="bi bi-person me-1"></i> Mi Perfil
              </a>
              <a routerLink="/dashboard" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-1"></i> Dashboard
              </a>
            </div>
          </div>

          <!-- Cambio de Email -->
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">
              <h5 class="card-title mb-0">
                <i class="bi bi-envelope me-2"></i>
                Cambiar Email
              </h5>
            </div>
            <div class="card-body">
              <form [formGroup]="emailForm" (ngSubmit)="onChangeEmail()">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="newEmail" class="form-label">Nuevo Email</label>
                      <input type="email" id="newEmail" class="form-control"
                             formControlName="newEmail"
                             placeholder="nuevo@ejemplo.com"
                             [class.is-invalid]="emailForm.get('newEmail')?.invalid && emailForm.get('newEmail')?.touched">
                      <div class="invalid-feedback" *ngIf="emailForm.get('newEmail')?.errors?.['required']">
                        El email es requerido
                      </div>
                      <div class="invalid-feedback" *ngIf="emailForm.get('newEmail')?.errors?.['email']">
                        Ingresa un email válido
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="confirmEmail" class="form-label">Confirmar Email</label>
                      <input type="email" id="confirmEmail" class="form-control"
                             formControlName="confirmEmail"
                             placeholder="confirma@ejemplo.com"
                             [class.is-invalid]="emailForm.get('confirmEmail')?.invalid && emailForm.get('confirmEmail')?.touched">
                      <div class="invalid-feedback" *ngIf="emailForm.get('confirmEmail')?.errors?.['required']">
                        Confirma tu nuevo email
                      </div>
                      <div class="invalid-feedback" *ngIf="emailForm.hasError('emailMismatch') && emailForm.get('confirmEmail')?.touched">
                        Los emails no coinciden
                      </div>
                    </div>
                  </div>
                </div>

                <div class="alert alert-info">
                  <i class="bi bi-info-circle me-2"></i>
                  <strong>Importante:</strong> Al cambiar tu email, deberás verificar la nueva dirección.
                </div>

                <button type="submit" class="btn btn-primary" 
                        [disabled]="emailForm.invalid || emailLoading">
                  <span *ngIf="!emailLoading">
                    <i class="bi bi-envelope-check me-1"></i>
                    Cambiar Email
                  </span>
                  <span *ngIf="emailLoading">
                    <div class="spinner-border spinner-border-sm me-1" role="status"></div>
                    Procesando...
                  </span>
                </button>
              </form>
            </div>
          </div>

          <!-- Cambio de Contraseña -->
          <div class="card">
            <div class="card-header bg-warning text-dark">
              <h5 class="card-title mb-0">
                <i class="bi bi-shield-lock me-2"></i>
                Cambiar Contraseña
              </h5>
            </div>
            <div class="card-body">
              <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="currentPassword" class="form-label">Contraseña Actual</label>
                      <input type="password" id="currentPassword" class="form-control"
                             formControlName="currentPassword"
                             placeholder="Ingresa tu contraseña actual"
                             [class.is-invalid]="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched">
                      <div class="invalid-feedback" *ngIf="passwordForm.get('currentPassword')?.errors?.['required']">
                        La contraseña actual es requerida
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="newPassword" class="form-label">Nueva Contraseña</label>
                      <input type="password" id="newPassword" class="form-control"
                             formControlName="newPassword"
                             placeholder="Mínimo 6 caracteres"
                             [class.is-invalid]="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched">
                      <div class="invalid-feedback" *ngIf="passwordForm.get('newPassword')?.errors?.['required']">
                        La nueva contraseña es requerida
                      </div>
                      <div class="invalid-feedback" *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">
                        Mínimo 6 caracteres
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
                      <input type="password" id="confirmPassword" class="form-control"
                             formControlName="confirmPassword"
                             placeholder="Repite la nueva contraseña"
                             [class.is-invalid]="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched">
                      <div class="invalid-feedback" *ngIf="passwordForm.get('confirmPassword')?.errors?.['required']">
                        Confirma tu nueva contraseña
                      </div>
                      <div class="invalid-feedback" *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched">
                        Las contraseñas no coinciden
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Información de debug (temporal) -->
                <div class="alert alert-info" *ngIf="debugInfo">
                  <h6>🔍 Información de Debug:</h6>
                  <pre class="mb-0 small">{{ debugInfo }}</pre>
                </div>

                <!-- Mensajes de estado -->
                <div class="alert alert-success" *ngIf="successMessage">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-check-circle me-2"></i>
                    <span>{{ successMessage }}</span>
                  </div>
                </div>

                <div class="alert alert-danger" *ngIf="errorMessage">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <span>{{ errorMessage }}</span>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-warning" 
                          [disabled]="passwordForm.invalid || passwordLoading">
                    <span *ngIf="!passwordLoading">
                      <i class="bi bi-key me-1"></i>
                      Cambiar Contraseña
                    </span>
                    <span *ngIf="passwordLoading">
                      <div class="spinner-border spinner-border-sm me-1" role="status"></div>
                      Cambiando contraseña...
                    </span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" 
                          (click)="resetForms()">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Limpiar Todo
                  </button>
                  <button type="button" class="btn btn-outline-info" 
                          (click)="toggleDebug()">
                    <i class="bi bi-bug me-1"></i>
                    Debug
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =======================
   VARIABLES Y MIXINS
======================= */
$primary-color: #1b3eda;
$primary-dark: #152fa5;
$secondary-color: #6c757d;
$warning-color: #ffc107;
$warning-dark: #e0a800;
$success-color: #198754;
$danger-color: #dc3545;
$info-color: #0dcaf0;
$border-radius: 16px;
$transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
$shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
$shadow-hover: 0 12px 35px rgba(0, 0, 0, 0.15);

/* =======================
   ANIMACIONES
======================= */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* =======================
   CONTENEDOR PRINCIPAL
======================= */
.container {
  animation: fadeInUp 0.6s ease-out;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 1.5rem 0.5rem;
  }
}

/* =======================
   HEADER MEJORADO
======================= */
.d-flex.justify-content-between {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f1f3f4;
  animation: slideIn 0.5s ease-out;

  h1 {
    font-weight: 800;
    font-size: 2.5rem;
    color: #1b1f3b;
    margin: 0;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #1b1f3b, #2d3748);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .bi-gear {
      font-size: 2.2rem;
      background: linear-gradient(135deg, $primary-color, #6610f2);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: spin 4s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  }

  .d-flex.gap-2 {
    .btn {
      border-radius: 12px;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      transition: $transition;
      border: 2px solid;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.5s;
      }

      &:hover::before {
        left: 100%;
      }

      &.btn-outline-primary {
        border-color: $primary-color;
        color: $primary-color;

        &:hover {
          background: linear-gradient(135deg, $primary-color, $primary-dark);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba($primary-color, 0.3);
        }
      }

      &.btn-outline-secondary {
        border-color: $secondary-color;
        color: $secondary-color;

        &:hover {
          background: $secondary-color;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba($secondary-color, 0.3);
        }
      }
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;

    h1 {
      font-size: 2rem;
    }

    .d-flex.gap-2 {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}

/* =======================
   TARJETAS MEJORADAS
======================= */
.card {
  border: none;
  border-radius: $border-radius;
  box-shadow: $shadow;
  transition: $transition;
  margin-bottom: 2rem;
  overflow: hidden;
  background: #fff;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, $primary-color, #6610f2);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: $shadow-hover;

    &::before {
      opacity: 1;
    }
  }

  /* Header de tarjetas */
  .card-header {
    border: none;
    padding: 1.5rem 2rem;
    position: relative;
    overflow: hidden;

    &.bg-primary {
      background: linear-gradient(135deg, $primary-color, $primary-dark) !important;
      
      &::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 100px;
        height: 200%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transform: rotate(25deg);
        animation: shine 3s infinite;
      }
    }

    &.bg-warning {
      background: linear-gradient(135deg, $warning-color, $warning-dark) !important;
      color: #000 !important;
    }

    .card-title {
      font-weight: 700;
      font-size: 1.3rem;
      margin: 0;
      display: flex;
      align-items: center;
      position: relative;
      z-index: 2;

      .bi {
        font-size: 1.4rem;
        margin-right: 0.75rem;
      }
    }
  }

  /* Body de tarjetas */
  .card-body {
    padding: 2rem;
    background: #fff;

    @media (max-width: 768px) {
      padding: 1.5rem;
    }
  }

  @keyframes shine {
    0%, 100% { transform: translateX(-100%) rotate(25deg); }
    50% { transform: translateX(100%) rotate(25deg); }
  }
}

/* =======================
   FORMULARIOS MEJORADOS
======================= */
form {
  .row {
    margin-bottom: 1.5rem;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .mb-3 {
    margin-bottom: 1.5rem !important;

    &:last-child {
      margin-bottom: 0 !important;
    }
  }

  .form-label {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
    display: flex;
    align-items: center;

    &::after {
      content: '*';
      color: $danger-color;
      margin-left: 0.25rem;
      opacity: 0.8;
    }
  }

  .form-control {
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    transition: $transition;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
      transform: translateY(-2px);
    }

    &::placeholder {
      color: #a0aec0;
      font-weight: 400;
    }

    &.is-invalid {
      border-color: $danger-color;
      background-image: none;
      
      &:focus {
        box-shadow: 0 0 0 3px rgba($danger-color, 0.1);
      }
    }
  }

  .invalid-feedback {
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    
    &::before {
      content: '⚠️';
      margin-right: 0.5rem;
      font-size: 0.8rem;
    }
  }
}

/* =======================
   ALERTAS MEJORADAS
======================= */
.alert {
  border-radius: 12px;
  border: none;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: slideIn 0.4s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background: currentColor;
    opacity: 0.3;
  }

  &.alert-info {
    background: linear-gradient(135deg, #dbeafe, #e0f2fe);
    color: #1e40af;
    border-left: 4px solid $info-color;
  }

  &.alert-success {
    background: linear-gradient(135deg, #d1fae5, #dcfce7);
    color: #065f46;
    border-left: 4px solid $success-color;
  }

  &.alert-danger {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #991b1b;
    border-left: 4px solid $danger-color;
  }

  .d-flex.align-items-center {
    .bi {
      font-size: 1.2rem;
      margin-right: 0.75rem;
    }
  }

  pre {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    padding: 1rem;
    margin: 0.5rem 0 0 0;
    font-size: 0.8rem;
    overflow-x: auto;
  }
}

/* =======================
   BOTONES MEJORADOS
======================= */
.btn {
  border-radius: 12px;
  font-weight: 600;
  padding: 0.875rem 1.75rem;
  transition: $transition;
  border: none;
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s;
  }

  &:hover::before {
    left: 100%;
  }

  &:disabled {
    opacity: 0.6;
    transform: none !important;
    box-shadow: none !important;
    
    &::before {
      display: none;
    }
  }

  /* Variantes de botón */
  &.btn-primary {
    background: linear-gradient(135deg, $primary-color, $primary-dark);
    
    &:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba($primary-color, 0.4);
    }
  }

  &.btn-warning {
    background: linear-gradient(135deg, $warning-color, $warning-dark);
    color: #000;
    
    &:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba($warning-color, 0.4);
    }
  }

  &.btn-outline-secondary {
    border: 2px solid $secondary-color;
    color: $secondary-color;
    background: transparent;
    
    &:hover:not(:disabled) {
      background: $secondary-color;
      color: white;
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba($secondary-color, 0.3);
    }
  }

  &.btn-outline-info {
    border: 2px solid $info-color;
    color: $info-color;
    background: transparent;
    
    &:hover:not(:disabled) {
      background: $info-color;
      color: white;
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba($info-color, 0.3);
    }
  }

  /* Spinner en botones */
  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
    border-width: 2px;
  }
}

/* =======================
   GRUPOS DE BOTONES
======================= */
.d-flex.gap-2 {
  gap: 1rem !important;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    flex-direction: column;
    
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
}

/* =======================
   RESPONSIVIDAD
======================= */
@media (max-width: 768px) {
  .col-md-8 {
    padding: 0 0.5rem;
  }

  .card .card-body {
    padding: 1.5rem;
  }

  .row {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    
    .col-md-6 {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }

  .d-flex.gap-2 {
    gap: 0.75rem !important;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .container {
    padding: 1rem 0.25rem;
  }

  .card {
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }

  .alert {
    padding: 1rem 1.25rem;
    margin: 1rem 0;
  }

  form .form-control {
    padding: 0.75rem 0.875rem;
  }
}

/* =======================
   UTILIDADES ADICIONALES
======================= */
.small {
  font-size: 0.875rem;
}

.mb-0 {
  margin-bottom: 0 !important;
}

.text-dark {
  color: #2d3748 !important;
}

/* Efectos de hover para desktop */
@media (hover: hover) {
  .card:hover ~ .card {
    opacity: 0.8;
    transform: translateY(-4px);
  }
}
  `]
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  emailForm: FormGroup;
  passwordForm: FormGroup;
  emailLoading = false;
  passwordLoading = false;
  successMessage = '';
  errorMessage = '';
  debugInfo: string = '';
  showDebug: boolean = false;

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.emailForm = this.formBuilder.group({
      newEmail: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]]
    }, { validators: this.emailMatchValidator });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  // Validador para coincidencia de emails
  emailMatchValidator(form: FormGroup) {
    const newEmail = form.get('newEmail')?.value;
    const confirmEmail = form.get('confirmEmail')?.value;
    
    if (newEmail && confirmEmail && newEmail !== confirmEmail) {
      return { emailMismatch: true };
    }
    return null;
  }

  // Validador para coincidencia de contraseñas
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  toggleDebug(): void {
    this.showDebug = !this.showDebug;
    if (!this.showDebug) {
      this.debugInfo = '';
    }
  }

  onChangeEmail(): void {
    if (this.emailForm.valid) {
      this.emailLoading = true;
      // Aquí iría la llamada al backend para cambiar el email
      setTimeout(() => {
        this.emailLoading = false;
        this.successMessage = 'Se ha enviado un email de verificación a tu nueva dirección';
        this.emailForm.reset();
      }, 2000);
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.passwordLoading = true;
      this.successMessage = '';
      this.errorMessage = '';
      this.debugInfo = '';

      const changePasswordData: ChangePasswordRequest = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };

      // Información de debug
      if (this.showDebug) {
        this.debugInfo = `🔍 Datos enviados:\n${JSON.stringify(changePasswordData, null, 2)}\n\n` +
                        `🔍 Token disponible: ${this.authService.getToken() ? 'SÍ' : 'NO'}\n` +
                        `🔍 Usuario actual: ${this.currentUser?.email}`;
      }

      console.log('🔍 Intentando cambiar contraseña...', changePasswordData);

      // LLAMADA REAL AL BACKEND CON MEJOR MANEJO DE ERRORES
      this.authService.changePassword(changePasswordData).subscribe({
        next: (response) => {
          console.log('✅ Éxito:', response);
          this.passwordLoading = false;
          this.successMessage = response.message || 'Contraseña cambiada exitosamente';
          this.passwordForm.reset();
          this.debugInfo = '';
        },
        error: (error) => {
          console.error('❌ Error completo:', error);
          
          this.passwordLoading = false;
          
          // Información detallada del error para debug
          if (this.showDebug) {
            this.debugInfo += `\n\n❌ Error del servidor:\n` +
                            `Status: ${error.status}\n` +
                            `Message: ${error.message}\n` +
                            `Error: ${JSON.stringify(error.error, null, 2)}`;
          }

          // Manejo específico de errores
          if (error.status === 404) {
            this.errorMessage = 'El servicio de cambio de contraseña no está disponible. El endpoint no existe.';
          } else if (error.status === 401) {
            this.errorMessage = 'Contraseña actual incorrecta o token inválido.';
          } else if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Datos inválidos enviados al servidor.';
          } else if (error.status === 500) {
            this.errorMessage = 'Error interno del servidor. Contacta al administrador.';
          } else if (error.status === 0) {
            this.errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
          } else {
            this.errorMessage = error.error?.message || 'Error desconocido al cambiar la contraseña.';
          }
        }
      });
    } else {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForms(): void {
    this.emailForm.reset();
    this.passwordForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.debugInfo = '';
  }
}