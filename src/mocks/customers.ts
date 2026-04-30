import type { Customer } from '../types/pos';

export const finalCustomer: Customer = {
  id: null,
  rut: null,
  name: 'Consumidor final',
  creditEnabled: false,
  creditLimit: 0,
  availableCredit: 0,
};

export const mockCustomers: Customer[] = [
  {
    id: 'C001',
    rut: '76.123.456-7',
    name: 'Constructora Los Robles SpA',
    phone: '+56912345678',
    email: 'contacto@losrobles.cl',
    creditEnabled: true,
    creditLimit: 1500000,
    availableCredit: 850000,
  },
  {
    id: 'C002',
    rut: '12.345.678-9',
    name: 'Juan Perez',
    phone: '+56987654321',
    email: 'juan@email.cl',
    creditEnabled: false,
    creditLimit: 0,
    availableCredit: 0,
  },
];
