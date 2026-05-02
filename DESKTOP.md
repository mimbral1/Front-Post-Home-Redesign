# POS Mimbral escritorio

## Generar app

```bash
npm run desktop:dist
```

## Archivos generados

Los entregables quedan en `release/`:

- `POS Mimbral Setup 1.0.0.exe`: instalador de Windows.
- `POS Mimbral-1.0.0-win.zip`: version comprimida para distribuir.
- `win-unpacked/POS Mimbral.exe`: ejecutable sin instalador para prueba local.

## Probar local

```bash
npm run desktop:pack
```

Luego abrir:

```txt
release/win-unpacked/POS Mimbral.exe
```

Para abrirla desde npm:

```bash
npm run desktop
```

## Notas

- La app funciona localmente con los datos mock actuales.
- El estado de caja/turno/ventas queda persistido en el almacenamiento local de Electron.
- El instalador no esta firmado digitalmente, por lo que Windows puede mostrar una advertencia de SmartScreen.
