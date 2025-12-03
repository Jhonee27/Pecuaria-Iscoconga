import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators, FormControl } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MovementService, Movement } from '../../core/services/movement.service';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MerchantService } from '../../core/services/merchant.service';

interface Merchant {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  lastname?: string;
  dni?: string;
  phone?: string;
}

@Component({
  selector: 'app-movement-form',
  templateUrl: './movement-form.component.html',
  styleUrls: ['./movement-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    DecimalPipe,
    FormsModule
  ]
})
export class MovementFormComponent implements OnInit {
  movementForm: FormGroup;
  total = 0;
  loading = false;
  successMessage = '';
  errorMessage = '';

  merchants: Merchant[] = [];
  filteredMerchants: Merchant[] = [];
  selectedMerchant: Merchant | null = null;
  showMerchantDropdown = false;
  
  merchantSearchControl = new FormControl('');

  movements: Movement[] = [];

  showForm = false;
  message = '';
  newMerchant = { firstName: '', lastName: '', dni: '', phone: '' };
  editingMerchantId: number | null = null;
  savingMerchant = false;

  // Tipos de ítems según categoría
  ganadoTypes = ['Bovino', 'Ovino', 'Porcino', 'Equino'];
  vehicleTypes = ['Camión', 'Camioneta', 'Tráiler'];

  constructor(
    private fb: FormBuilder,
    private movementService: MovementService,
    private merchantService: MerchantService,
    private http: HttpClient
  ) {
    this.movementForm = this.fb.group({
      merchant_id: [null],
      truck_id: [null],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadMerchants();
    this.loadMovements();
    
    // Configurar búsqueda en tiempo real
    this.merchantSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.filterMerchants(value || '');
        // Pre-llenar datos del nuevo comerciante si no hay resultados
        if (value && this.filteredMerchants.length === 0) {
          this.prefillNewMerchantData(value);
        }
      });
  }

  get items() {
    return this.movementForm.get('items') as FormArray;
  }

  loadMerchants() {
    this.http.get<any[]>('http://localhost:3000/api/merchants').subscribe({
      next: (data) => {
        this.merchants = data.map(m => this.normalizeMerchant(m));
        
        // Seleccionar automáticamente el comerciante con ID 1
        this.selectDefaultMerchant();
      },
      error: (err: any) => {
        console.error('Error al cargar comerciantes:', err);
        // Intentar seleccionar el default incluso si hay error
        this.selectDefaultMerchant();
      }
    });
  }

  selectDefaultMerchant() {
    // Buscar el comerciante con ID 1
    const defaultMerchant = this.merchants.find(m => m.id === 1);
    
    if (defaultMerchant) {
      this.selectMerchant(defaultMerchant);
      console.log('Comerciante por defecto seleccionado:', defaultMerchant);
    } else {
      console.warn('No se encontró el comerciante con ID 1');
      
      // Si no existe el comerciante con ID 1, seleccionar el primero disponible
      if (this.merchants.length > 0) {
        this.selectMerchant(this.merchants[0]);
        console.log('Se seleccionó el primer comerciante disponible:', this.merchants[0]);
      } else {
        console.warn('No hay comerciantes disponibles');
      }
    }
  }

  filterMerchants(searchTerm: string) {
    if (!searchTerm) {
      this.filteredMerchants = [];
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    this.filteredMerchants = this.merchants.filter(merchant => {
      // Buscar por nombre completo
      const fullName = (merchant.name || 
                       `${merchant.firstName || ''} ${merchant.lastName || ''}`).toLowerCase();
      
      // Buscar por DNI
      const dni = merchant.dni ? merchant.dni.toLowerCase() : '';
      
      return fullName.includes(term) || dni.includes(term);
    });
  }

  prefillNewMerchantData(searchTerm: string) {
    // Intentar extraer nombre y apellido del término de búsqueda
    const parts = searchTerm.trim().split(' ');
    if (parts.length >= 2) {
      this.newMerchant.firstName = parts.slice(0, -1).join(' ');
      this.newMerchant.lastName = parts[parts.length - 1];
    } else {
      this.newMerchant.firstName = searchTerm;
      this.newMerchant.lastName = '';
    }
    
    // Si el término de búsqueda parece ser un DNI, usarlo
    if (/^\d{8}$/.test(searchTerm)) {
      this.newMerchant.dni = searchTerm;
    }
  }

  // Mostrar/ocultar formulario
  toggleForm(): void {
    this.showForm = !this.showForm;
    this.showMerchantDropdown = false;
    if (!this.editingMerchantId && this.showForm) {
      this.resetFormFields();
    }
  }

  // Guardar un nuevo comerciante
  saveMerchant(): void {
    if (!this.newMerchant.firstName || !this.newMerchant.lastName || !this.newMerchant.dni) {
      this.message = 'Nombre, Apellido y DNI son obligatorios.';
      return;
    }

    this.savingMerchant = true;
    this.message = '';

    // Usar el MerchantService para crear el comerciante
    this.merchantService.addMerchant(this.newMerchant).subscribe({
      next: (createdMerchant: any) => {
        this.savingMerchant = false;
        
        // Normalizar el nuevo comerciante
        const normalizedMerchant = this.normalizeMerchant(createdMerchant);
        
        // Agregar a la lista local
        this.merchants.push(normalizedMerchant);
        
        // Seleccionar automáticamente el nuevo comerciante
        this.selectMerchant(normalizedMerchant);
        
        // Cerrar formulario
        this.toggleForm();
        
        this.successMessage = 'Comerciante agregado exitosamente y seleccionado.';
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err: any) => {
        this.savingMerchant = false;
        console.error('Error al crear comerciante:', err);
        this.message = err.error?.message || 'Error al crear el comerciante. Verifique que el DNI no esté duplicado.';
      }
    });
  }

  // Reiniciar campos del formulario
  private resetFormFields(): void {
    this.newMerchant = { firstName: '', lastName: '', dni: '', phone: '' };
    this.editingMerchantId = null;
  }

  selectMerchant(merchant: Merchant) {
    this.selectedMerchant = merchant;
    this.movementForm.patchValue({ merchant_id: merchant.id });
    this.merchantSearchControl.setValue('');
    this.showMerchantDropdown = false;
    this.showForm = false;
  }

  clearMerchant() {
    this.selectedMerchant = null;
    this.movementForm.patchValue({ merchant_id: null });
  }

  onMerchantBlur() {
    // Pequeño retraso para permitir la selección antes de ocultar
    setTimeout(() => {
      this.showMerchantDropdown = false;
    }, 200);
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
    if (this.movementForm.invalid || this.items.length === 0 || !this.selectedMerchant) {
      this.errorMessage = 'Por favor completa todos los campos requeridos, selecciona un comerciante y agrega al menos un ítem.';
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
      error: (err: any) => {
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
    // Al resetear, volver a seleccionar el comerciante por defecto
    this.selectDefaultMerchant();
    this.merchantSearchControl.setValue('');
    this.showForm = false;
    this.resetFormFields();
  }

  normalizeMerchant(m: any): Merchant {
    const normalized = { ...m } as any;

    // Si backend ya trae un nombre completo, lo usamos
    if (normalized.name && !normalized.firstName && !normalized.lastName) {
      const parts = (normalized.name as string).trim().split(' ');
      normalized.firstName = parts.slice(0, parts.length - 1).join(' ') || parts[0];
      normalized.lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    }

    // Soportar snake_case o campos alternativos
    if (!normalized.firstName && normalized.first_name) normalized.firstName = normalized.first_name;
    if (!normalized.lastName && normalized.last_name) normalized.lastName = normalized.last_name;
    if (!normalized.lastName && normalized.lastname) normalized.lastName = normalized.lastname;

    // Si no existe name, crearla a partir de first/last
    if (!normalized.name) {
      if (normalized.firstName || normalized.lastName) {
        normalized.name = `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim();
      } else {
        normalized.name = normalized.dni ? `DNI ${normalized.dni}` : `Comerciante ${normalized.id}`;
      }
    }

    return normalized as Merchant;
  }

  loadMovements() {
    this.movementService.getMovements().subscribe({
      next: (data) => (this.movements = data.map(m => ({ ...m, expanded: false }))),
      error: (err: any) => console.error('Error al cargar movimientos:', err)
    });
  }

  toggleExpanded(m: Movement) {
    m.expanded = !m.expanded;
  }

  getMerchantName(id?: number): string {
    const merchant = this.merchants.find(m => m.id === id);
    if (!merchant) return 'Sin asignar';

    if (merchant.name && merchant.name.trim()) return merchant.name;
    const fn = merchant.firstName || merchant.first_name || '';
    const ln = merchant.lastName || merchant.last_name || merchant.lastname || '';
    const combined = `${fn} ${ln}`.trim();
    if (combined) return combined;
    if (merchant.dni) return `DNI ${merchant.dni}`;
    return `Comerciante ${merchant.id}`;
  }
}