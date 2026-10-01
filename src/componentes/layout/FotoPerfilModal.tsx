import { useState } from 'react';
import { Button, Modal, SelectorImagen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import authService, { urlFotoPerfil } from '../../services/authService';
import { getApiErrorMessage } from '../../services/api';

interface FotoPerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FotoPerfilModal({ isOpen, onClose }: FotoPerfilModalProps) {
  const { user, actualizarUsuario } = useAuth();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [quitada, setQuitada] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => {
    setArchivo(null);
    setQuitada(false);
    setError(null);
    onClose();
  };

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      if (archivo) {
        actualizarUsuario(await authService.subirFotoPerfil(archivo));
      } else if (quitada && user?.foto) {
        actualizarUsuario(await authService.eliminarFotoPerfil());
      }
      cerrar();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar la foto de perfil.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={cerrar}
      title="Foto de perfil"
      description="Se muestra en la barra superior junto a tu nombre."
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" type="button" onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={guardar}
            disabled={guardando || (!archivo && !quitada)}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <SelectorImagen
        forma="circulo"
        urlActual={urlFotoPerfil(user)}
        archivo={archivo}
        quitada={quitada}
        onSeleccionar={(seleccionado) => {
          setArchivo(seleccionado);
          setQuitada(false);
        }}
        onQuitar={() => {
          setArchivo(null);
          setQuitada(true);
        }}
      />
      {error && <p className="mt-3 text-[11px] font-semibold text-rose-600">{error}</p>}
    </Modal>
  );
}
