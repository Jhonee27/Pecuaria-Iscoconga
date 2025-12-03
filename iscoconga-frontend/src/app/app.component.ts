import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class AppComponent implements OnInit {
  appName = environment.appName;
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    
    // Escuchar cambios en el usuario
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }
}