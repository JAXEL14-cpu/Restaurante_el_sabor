import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function NuevoPlatilloCamara({ onCerrar, onGuardar }) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [fotoUri, setFotoUri] = useState('');
  const [cameraLista, setCameraLista] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const camara = useRef(null);

  async function capturar() {
    if (!cameraLista || !camara.current) {
      setMensaje('La cámara todavía se está preparando.');
      return;
    }
    try {
      const foto = await camara.current.takePictureAsync({ quality: 0.35, base64: true });
      const uri = foto?.base64 ? `data:image/jpeg;base64,${foto.base64}` : foto?.uri;
      if (!uri) throw new Error('La cámara no devolvió una imagen.');
      setFotoUri(uri);
      setMensaje('Foto lista. Completa los datos y guarda el plato.');
    } catch (error) {
      setMensaje('No se pudo tomar la foto. Comprueba el permiso y vuelve a intentarlo.');
    }
  }

  async function guardar() {
    const nombreLimpio = nombre.trim();
    const valor = Number(precio.replace(/[^0-9]/g, ''));
    if (!nombreLimpio || !descripcion.trim() || !valor) {
      setMensaje('Completa nombre, descripción y un precio mayor que cero.');
      return;
    }
    if (!fotoUri) {
      setMensaje('Toma una foto del plato antes de guardarlo.');
      return;
    }
    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombreLimpio,
        descripcion: descripcion.trim(),
        precio: `$${valor.toLocaleString('es-CO')}`,
        fotoUri,
      });
      setMensaje('Plato agregado al menú de este dispositivo.');
    } catch (error) {
      setMensaje('No se pudo guardar el plato. Revisa el almacenamiento disponible.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={s.pantalla} contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={onCerrar} style={s.secundario}><Text style={s.secundarioTexto}>Volver al menú</Text></Pressable>
      <Text style={s.titulo}>Agregar plato con cámara</Text>
      <Text style={s.aviso}>La foto y los datos se guardan localmente en este dispositivo. No se envían a un servidor.</Text>

      {!permiso ? <Text>Comprobando permiso de cámara...</Text> : !permiso.granted ? (
        <View style={s.box}>
          <Text>Se necesita permiso para tomar una foto del plato.</Text>
          {permiso.canAskAgain ? (
            <Pressable accessibilityRole="button" onPress={pedirPermiso} style={s.boton}><Text style={s.botonTexto}>Permitir cámara</Text></Pressable>
          ) : <Text>Activa el permiso de cámara desde los ajustes de la aplicación.</Text>}
        </View>
      ) : fotoUri ? (
        <View style={s.box}>
          <Image source={{ uri: fotoUri }} style={s.foto} resizeMode="cover" />
          <Pressable accessibilityRole="button" onPress={() => { setFotoUri(''); setCameraLista(false); }} style={s.secundario}><Text style={s.secundarioTexto}>Tomar otra foto</Text></Pressable>
        </View>
      ) : (
        <View style={s.box}>
          <CameraView ref={camara} style={s.camara} facing="back" onCameraReady={() => setCameraLista(true)} onMountError={() => setMensaje('No se pudo abrir la cámara en este dispositivo o navegador.')} />
          <Pressable accessibilityRole="button" disabled={!cameraLista} onPress={capturar} style={[s.boton, !cameraLista && s.deshabilitado]}><Text style={s.botonTexto}>Tomar foto del plato</Text></Pressable>
        </View>
      )}

      <TextInput value={nombre} onChangeText={setNombre} placeholder="Nombre del plato" accessibilityLabel="Nombre del plato" style={s.entrada} />
      <TextInput value={descripcion} onChangeText={setDescripcion} placeholder="Descripción" accessibilityLabel="Descripción del plato" style={[s.entrada, s.multilinea]} multiline />
      <TextInput value={precio} onChangeText={setPrecio} placeholder="Precio en pesos (solo números)" accessibilityLabel="Precio del plato en pesos" keyboardType="numeric" style={s.entrada} />
      <Pressable accessibilityRole="button" disabled={guardando} onPress={guardar} style={[s.boton, guardando && s.deshabilitado]}><Text style={s.botonTexto}>{guardando ? 'Guardando...' : 'Guardar plato'}</Text></Pressable>
      {!!mensaje && <Text accessibilityLiveRegion="polite" style={s.mensaje}>{mensaje}</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, minHeight: 0 }, contenido: { padding: 16, paddingBottom: 32, gap: 12 },
  titulo: { fontSize: 23, fontWeight: '800', color: '#F2E6C9' }, aviso: { color: '#C7A978', lineHeight: 19 },
  box: { padding: 12, borderRadius: 12, backgroundColor: '#F2E6C9', gap: 10 }, camara: { width: '100%', height: 260, borderRadius: 10 }, foto: { width: '100%', height: 220, borderRadius: 10 },
  entrada: { minHeight: 48, padding: 12, backgroundColor: '#F2E6C9', borderColor: '#805600', borderWidth: 1, borderRadius: 9, fontSize: 16 }, multilinea: { minHeight: 90, textAlignVertical: 'top' },
  boton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 9, backgroundColor: '#8A6500' }, botonTexto: { color: '#F2E6C9', fontWeight: '800' },
  secundario: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: '#493016' }, secundarioTexto: { color: '#F3B900', fontWeight: '700' },
  deshabilitado: { opacity: 0.5 }, mensaje: { color: '#F2E6C9', fontWeight: '700', lineHeight: 20 },
});

