import type { PosState } from '../types/pos';

export const mockPosState: PosState = {
  cashRegisterOpen: true,
  shiftOpen: true,
  cashRegisterId: 'CAJA-01',
  shiftId: 'SHIFT-2026-001',
  cashierName: 'Maria Gonzalez',
  storeName: 'Mimbral San Javier',
  terminalName: 'POS 01',
  shiftOpenedAt: new Date().toISOString(),
  openingFloat: 100000,
  shiftSalesTotal: 0,
  shiftCashTotal: 0,
  lastShiftClose: null,
};
