import { useState } from 'react';

type PreventaInputProps = {
  disabled?: boolean;
  onPreventaSubmit: (preventaId: string) => void;
};

export function PreventaInput({ disabled = false, onPreventaSubmit }: PreventaInputProps) {
  const [preventaId, setPreventaId] = useState('');

  const submit = () => {
    const value = preventaId.trim();
    if (!value) return;
    onPreventaSubmit(value);
    setPreventaId('');
  };

  return (
    <label className="preventa-input">
      <span>Preventa</span>
      <input
        value={preventaId}
        disabled={disabled}
        placeholder="Escanear ID preventa"
        onChange={(event) => setPreventaId(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        }}
      />
      <button type="button" disabled={disabled} onClick={submit}>
        Cargar
      </button>
    </label>
  );
}
