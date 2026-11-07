import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ExploracionCamara({ onCerrar }) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [frontal, setFrontal] = useState(false);
  const [error, setError] = useState('');
  const [solicitando, setSolicitando] = useState(false);

  async function solicitar() {
    setError('');
    setSolicitando(true);
    try {
      await pedirPermiso();
    } catch {
      setError('No se pudo solicitar el permiso. Puedes cerrar esta función.');
    } finally {
      setSolicitando(false);
    }
  }

  return (
    <ScrollView style={s.panel} contentContainerStyle={{ paddingBottom: 24 }}>
      <Pressable style={s.boton} onPress={onCerrar}>
        <Text>Volver a Sensores</Text>
      </Pressable>

      <Text style={s.titulo}>Exploración de cámara</Text>
      <Text>
        Solo vista previa. Este ejemplo no toma ni guarda fotos y no pide micrófono.
      </Text>

      {!permiso ? (
        <Text>Comprobando permiso...</Text>
      ) : !permiso.granted ? (
        <View>
          <Text>{permiso.status === 'denied' ? 'Permiso denegado.' : 'Permiso pendiente.'}</Text>
          <Text>Usamos la cámara para mostrar una vista previa.</Text>
          {permiso.canAskAgain ? (
            <Pressable style={s.boton} disabled={solicitando} onPress={solicitar}>
              <Text>{solicitando ? 'Solicitando...' : 'Permitir cámara'}</Text>
            </Pressable>
          ) : (
            <Text>
              Si quieres habilitarla, revisa los permisos de Expo Go o de tu app en Ajustes.
            </Text>
          )}
          <Text>Puedes volver y continuar la práctica sin cámara.</Text>
        </View>
      ) : !error ? (
        <View>
          <Text>Permiso concedido</Text>
          <CameraView
            style={s.camara}
            facing={frontal ? 'front' : 'back'}
            onMountError={() => setError('No se pudo abrir la cámara. Cierra y revisa otra app que la use.')}
          />
          <Pressable style={s.boton} onPress={() => setFrontal((anterior) => !anterior)}>
            <Text>Cambiar cámara</Text>
          </Pressable>
        </View>
      ) : null}

      {!!error && <Text>{error}</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  panel: { flex: 1, padding: 16, minHeight: 0 },
  titulo: { fontSize: 22, fontWeight: '700', marginVertical: 12 },
  boton: { padding: 12, marginVertical: 8, backgroundColor: '#493016', borderRadius: 8 },
  camara: { height: 260, marginTop: 12 },
});

