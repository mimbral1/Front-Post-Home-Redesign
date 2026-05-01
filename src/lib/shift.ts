import type { PosState, ShiftCloseSummary } from '../types/pos';

export function expectedShiftCash(posState: PosState) {
  return (posState.openingFloat ?? 0) + (posState.shiftCashTotal ?? 0);
}

export function openShiftState(posState: PosState, openingFloat: number): PosState {
  return {
    ...posState,
    cashRegisterOpen: true,
    shiftOpen: true,
    shiftId: `SHIFT-${Date.now().toString().slice(-6)}`,
    shiftOpenedAt: new Date().toISOString(),
    openingFloat,
    shiftSalesTotal: 0,
    shiftCashTotal: 0,
    lastShiftClose: null,
  };
}

export function addPaidSaleToShift(posState: PosState, saleTotal: number, paidInCash: boolean): PosState {
  return {
    ...posState,
    shiftSalesTotal: (posState.shiftSalesTotal ?? 0) + saleTotal,
    shiftCashTotal: paidInCash ? (posState.shiftCashTotal ?? 0) + saleTotal : posState.shiftCashTotal ?? 0,
  };
}

export function closeShiftState(
  posState: PosState,
  declaredCash: number,
  observation?: string,
  supervisorUser?: string
): PosState {
  const expectedCash = expectedShiftCash(posState);
  const summary: ShiftCloseSummary = {
    shiftId: posState.shiftId ?? `SHIFT-${Date.now().toString().slice(-6)}`,
    terminalName: posState.terminalName,
    cashierName: posState.cashierName,
    storeName: posState.storeName,
    openedAt: posState.shiftOpenedAt ?? null,
    closedAt: new Date().toISOString(),
    openingFloat: posState.openingFloat ?? 0,
    salesTotal: posState.shiftSalesTotal ?? 0,
    expectedCash,
    declaredCash,
    difference: declaredCash - expectedCash,
    observation,
    supervisorUser,
  };

  return {
    ...posState,
    cashRegisterOpen: false,
    shiftOpen: false,
    shiftId: null,
    shiftOpenedAt: null,
    openingFloat: 0,
    shiftSalesTotal: 0,
    shiftCashTotal: 0,
    lastShiftClose: summary,
  };
}
