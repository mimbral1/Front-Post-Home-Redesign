# POS Home Redesign

Frontend independiente para rediseñar el Home operativo del POS Mimbral.

## Objetivo

Mostrar una sola acción principal según el estado real de operación:

- caja cerrada
- caja abierta sin turno
- turno activo sin venta
- venta en curso

## Stack

- React
- Vite
- TypeScript

## Estructura

```txt
src/
  components/pos/
  lib/
  mocks/
  pages/
  services/
  types/
```

## Ejecutar

```txt
npm install
npm run dev
```

## Estado mock inicial

El estado mock vive en:

- `src/mocks/posState.ts`

## Componentes principales

- `src/pages/Home.tsx`
- `src/components/pos/PosHomeStatePanel.tsx`
- `src/components/pos/PrimaryActionCard.tsx`
- `src/components/pos/OperationalStepIndicator.tsx`
- `src/components/pos/SecondaryActionsMenu.tsx`


subido