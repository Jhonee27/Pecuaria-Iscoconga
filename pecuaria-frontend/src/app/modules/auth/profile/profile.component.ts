import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { FormatDatePipe } from '../../../shared/pipes/format-date.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormatDatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
// Asegúrate de que esta línea esté presente y sea la última del archivo:
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  getRoleDisplayName(): string {
    return this.currentUser?.role === 'admin' ? 'Administrador' : 'Personal';
  }
}