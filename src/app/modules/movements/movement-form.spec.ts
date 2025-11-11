import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MovementService, Movement } from '../../core/services/movement.service';
import { HttpClient } from '@angular/common/http';

interface Merchant {
  id: number;
  name: string;
}

@Component({
  selector: 'app-movement-form',
  templateUrl: './movement-form.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe]
})
export class MovementFormComponent implements OnInit {
  movementForm: FormGroup;
  total = 0;
  loading = false;
  successMessage = '';
  errorMessage = '';

  merchants: Merchant[] = [];
  movements: Movement[] = [];

  // Tipos de animales y vehículos
  ganadoTypes = ['Vacuno', 'Ovino', 'Caprino', 'Porcino'];
  vehicleTypes = ['Camión', 'Camioneta', 'Remolque'];

  constructor(
    private fb: FormBuilder,
    private movementService: MovementService,
    private http: HttpClient
  ) {
    this.movementForm = this.fb.group({
      merchant_id: [null], // ahora es opcional
      truck_id: [null],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadMerchants();
    this.loadMovements();
  }

  get items() {
    return this.movementForm.get('items') as FormArray;
  }

  addItem(category: string = 'ganado') {
    const item = this.fb.group({
      category: [category, Validators.required],
      type: ['', Validators.required],
      breed: [''],
      note: [''],
      qty_in: [1, [Validators.required, Validators.min(1)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0]
    });
    this.items.push(item);
    this.updateTotal();
  }

  removeItem(i: number) {
    this.items.removeAt(i);
    this.updateTotal();
  }

  updateSubtotal(i: number) {
    const item = this.items.at(i);
    const qty = item.get('qty_in')?.value || 0;
    const price = item.get('unit_price')?.value || 0;
    item.get('subtotal')?.setValue(qty * price);
    this.updateTotal();
  }

  updateTotal() {
    this.total = this.items.controls.reduce(
      (sum, item) => sum + (item.get('subtotal')?.value || 0),
      0
    );
  }

  submit() {
    if (this.movementForm.invalid || this.items.length === 0) {
      this.errorMessage = 'Por favor completa todos los campos requeridos y agrega al menos un ítem.';
      this.successMessage = '';
      return;
    }

    this.loading = true;

    const payload: Movement = {
      ...this.movementForm.value,
      total: this.total,
      date: new Date().toISOString()
    };

    this.movementService.createMovement(payload).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Ingreso registrado con éxito.';
        this.errorMessage = '';
        this.resetForm();
        this.loadMovements();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al registrar movimiento:', err);
        this.errorMessage = 'Ocurrió un error al registrar el ingreso.';
        this.successMessage = '';
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.movementForm.reset();
    this.items.clear();
    this.total = 0;
  }

  loadMerchants() {
    this.http.get<Merchant[]>('http://localhost:3000/api/merchants').subscribe({
      next: (data) => (this.merchants = data),
      error: (err) => console.error('Error al cargar merchants:', err)
    });
  }

  loadMovements() {
    this.movementService.getMovements().subscribe({
      next: (data) => (this.movements = data.map(m => ({ ...m, expanded: false }))),
      error: (err) => console.error('Error al cargar movimientos:', err)
    });
  }

  toggleExpanded(m: Movement) {
    m.expanded = !m.expanded;
  }

  getMerchantName(id?: number): string {
    if (!id) return 'Sin asignar';
    const merchant = this.merchants.find(m => m.id === id);
    return merchant ? merchant.name : 'Desconocido';
  }
}