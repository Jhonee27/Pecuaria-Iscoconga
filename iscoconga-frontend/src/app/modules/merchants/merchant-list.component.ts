import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MerchantService } from '../../core/services/merchant.service';

@Component({
  selector: 'app-merchant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './merchant-list.component.html',
  styleUrls: ['./merchant-list.component.scss']
})
export class MerchantListComponent implements OnInit {
  merchants: any[] = [];
  showForm = false;
  loading = false;
  message = '';
  newMerchant = { firstName: '', lastName: '', dni: '', phone: '' };
  editingMerchantId: number | null = null;

  constructor(private merchantService: MerchantService) {}

  ngOnInit(): void {
    this.loadMerchants();
  }

  // Mostrar/ocultar formulario
  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.editingMerchantId && this.showForm) {
      this.resetFormFields();
    }
  }

  // Cargar comerciantes desde el backend
  loadMerchants(): void {
    this.loading = true;
    this.merchantService.getMerchants().subscribe({
      next: (data) => {
        this.merchants = data;
        this.loading = false;
      },
      error: () => {
        this.message = 'Error al cargar comerciantes.';
        this.loading = false;
      }
    });
  }

  // Guardar un nuevo comerciante o actualizar uno existente
  saveMerchant(): void {
    if (!this.newMerchant.firstName || !this.newMerchant.lastName || !this.newMerchant.dni) {
      this.message = 'Nombre, Apellido y DNI son obligatorios.';
      return;
    }

    if (this.editingMerchantId) {
      this.updateMerchant();
    } else {
      this.merchantService.addMerchant(this.newMerchant).subscribe({
        next: () => {
          this.message = 'Comerciante agregado correctamente.';
          this.resetFormFields();
          this.loadMerchants();
        },
        error: (err) => {
          this.message = err.error?.message || 'Error al agregar comerciante.';
        }
      });
    }
  }

  // Preparar formulario para editar un comerciante
  editMerchant(merchant: any): void {
    this.editingMerchantId = merchant.id;
    this.newMerchant = { ...merchant };
    this.showForm = true;
  }

  // Actualizar comerciante existente
  updateMerchant(): void {
    this.merchantService.updateMerchant(this.editingMerchantId!, this.newMerchant).subscribe({
      next: () => {
        this.message = 'Comerciante actualizado correctamente.';
        this.resetFormFields();
        this.loadMerchants();
      },
      error: (err) => {
        this.message = err.error?.message || 'Error al actualizar comerciante.';
      }
    });
  }

  // Eliminar comerciante
  deleteMerchant(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este comerciante?')) return;

    this.merchantService.deleteMerchant(id).subscribe({
      next: () => {
        this.message = 'Comerciante eliminado correctamente.';
        this.loadMerchants();
      },
      error: (err) => {
        this.message = err.error?.message || 'Error al eliminar comerciante.';
      }
    });
  }

  // Reiniciar campos del formulario
  private resetFormFields(): void {
    this.newMerchant = { firstName: '', lastName: '', dni: '', phone: '' };
    this.editingMerchantId = null;
  }
}
