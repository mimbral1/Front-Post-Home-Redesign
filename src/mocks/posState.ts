import type { PosState } from '../types/pos';

export const mockPosState: PosState = {
  cashRegisterOpen: true,
  shiftOpen: false,
  cashRegisterId: 'CAJA-01',
  shiftId: null,
  cashierName: 'Maria Gonzalez',
  storeName: 'Mimbral San Javier',
  terminalName: 'POS 01',
  shiftOpenedAt: null,
  openingFloat: 0,
  shiftSalesTotal: 0,
  shiftCashTotal: 0,
  lastShiftClose: null,
};
