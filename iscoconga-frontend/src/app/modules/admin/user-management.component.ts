// src/app/modules/admin/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, CreateUserRequest, UpdateUserRequest } from '../../core/services/user.service';
import { AuthService, User } from '../../core/services/auth.service';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormatDatePipe],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  currentUser: User | null = null;
  userForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  isEditing = false;
  editingUserId: number | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.isAdmin()) this.loadUsers();
  }

  private createUserForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      role: ['', Validators.required]
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        // Ya no se necesita mapear, la fecha viene como string desde el backend
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar la lista de usuarios';
        this.loading = false;
      }
    });
  }

  getAdminCount(): number {
    return this.users.filter(user => user.role === 'admin').length;
  }

  getPersonalCount(): number {
    return this.users.filter(user => user.role === 'personal').length;
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.successMessage = '';
      this.errorMessage = '';
      if (this.isEditing && this.editingUserId) this.updateUser();
      else this.createUser();
    } else this.markAllFieldsAsTouched();
  }

  private updateUser(): void {
    const updateData: UpdateUserRequest = {
      email: this.userForm.get('email')?.value,
      role: this.userForm.get('role')?.value
    };
    const newPassword = this.userForm.get('password')?.value;
    if (newPassword && newPassword.length >= 6) updateData.password = newPassword;

    this.userService.updateUser(this.editingUserId!, updateData).subscribe({
      next: (updatedUser) => this.handleSuccess(`Usuario ${updatedUser.email} actualizado exitosamente`),
      error: (error) => this.handleError(error, 'actualizar')
    });
  }

  private createUser(): void {
    const userData: CreateUserRequest = {
      email: this.userForm.get('email')?.value,
      password: this.userForm.get('password')?.value,
      role: this.userForm.get('role')?.value
    };

    this.userService.createUser(userData).subscribe({
      next: (newUser) => this.handleSuccess(`Usuario ${newUser.email} creado exitosamente`),
      error: (error) => this.handleError(error, 'crear')
    });
  }

  private handleSuccess(message: string): void {
    this.loading = false;
    this.successMessage = message;
    this.resetForm();
    this.loadUsers();
  }

  private handleError(error: any, action: string): void {
    this.loading = false;
    this.errorMessage = error.error?.message || `Error al ${action} el usuario`;
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => this.userForm.get(key)?.markAsTouched());
  }

  onEditUser(user: User): void {
    this.isEditing = true;
    this.editingUserId = user.id!;
    this.userForm.patchValue({ email: user.email, role: user.role, password: '' });
    this.successMessage = `Editando usuario: ${user.email}`;
    this.errorMessage = '';
  }

  onDeleteUser(user: User): void {
    if (confirm(`¿Eliminar al usuario "${user.email}"? Esta acción no se puede deshacer.`)) {
      this.userService.deleteUser(user.id!).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.successMessage = `Usuario "${user.email}" eliminado exitosamente`;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar el usuario';
        }
      });
    }
  }

  resetForm(): void {
    this.userForm.reset();
    this.isEditing = false;
    this.editingUserId = null;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
