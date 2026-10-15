import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  peligroso?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  peligroso = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  return (
    <Modal titulo={titulo} onCerrar={onCancelar}>
      <p className="text-sm text-slate-600">{mensaje}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variante="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button
          variante={peligroso ? 'danger' : 'primary'}
          cargando={cargando}
          onClick={onConfirmar}
        >
          {textoConfirmar}
        </Button>
      </div>
    </Modal>
  );
}
