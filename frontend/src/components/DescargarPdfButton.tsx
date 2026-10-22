import { useState } from 'react';

import { authorizedFetch } from '../lib/api';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';

interface DescargarPdfButtonProps {
  facturaId: number;
  numero: string;
}

/**
 * Un enlace normal no sirve: la API exige el token en la cabecera Authorization,
 * y el navegador no la añade al navegar a una URL. Por eso se descarga con
 * fetch y se entrega el resultado al navegador como un fichero.
 */
export function DescargarPdfButton({ facturaId, numero }: DescargarPdfButtonProps) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setDescargando(true);
    setError(null);
    try {
      const respuesta = await authorizedFetch(`/api/facturas/${facturaId}/pdf`);
      if (!respuesta.ok) throw new Error(String(respuesta.status));

      const url = URL.createObjectURL(await respuesta.blob());
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `${numero}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar la factura');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <>
      <Button variante="secondary" cargando={descargando} onClick={() => void descargar()}>
        Descargar PDF
      </Button>
      {error && <Alert>{error}</Alert>}
    </>
  );
}
