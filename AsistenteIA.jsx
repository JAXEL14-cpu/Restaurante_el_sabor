import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { clasificar } from './modeloIA';

const INTENCIONES = [
  { id: 'nombre', etiqueta: 'Nombre' },
  { id: 'precio', etiqueta: 'Precio' },
  { id: 'descripcion', etiqueta: 'Descripción' },
];

export default function AsistenteIA({ productos = [] }) {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [eleccionManual, setEleccionManual] = useState(false);
  const [indice, setIndice] = useState(0);
  const { width } = useWindowDimensions();
  const producto = productos.length ? productos[indice % productos.length] : null;

  function responder(intencion, manual = false, puntuacion = null) {
    if (!producto) {
      setRespuesta('No hay platos disponibles en el catálogo.');
      setEleccionManual(false);
      return;
    }
    const valor = producto[intencion];
    const dato = valor === undefined || valor === null || String(valor).trim() === ''
      ? 'Dato no registrado en el catálogo.'
      : String(valor);
    const detalle = manual ? 'Intención elegida manualmente' : `Intención: ${intencion}`;
    const similitud = puntuacion === null ? '' : ` · Similitud didáctica: ${puntuacion.toFixed(2)}`;
    setRespuesta(`${detalle}${similitud}.\nDato del catálogo: ${dato}`);
    setEleccionManual(false);
  }

  function consultar() {
    setEleccionManual(false);
    if (!pregunta.trim()) {
      setRespuesta('Escribe una pregunta antes de consultar.');
      return;
    }
    if (!producto) {
      setRespuesta('No hay productos disponibles en los datos recibidos.');
      return;
    }
    const resultado = clasificar(pregunta);
    if (!resultado.intencion) {
      setRespuesta('La pregunta puede referirse a varias cosas. Elige qué dato quieres consultar:');
      setEleccionManual(true);
      return;
    }
    responder(resultado.intencion, false, resultado.puntuacion);
  }

  return (
    <ScrollView style={s.pantalla} contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
      <Text style={s.titulo}>Asistente del catálogo</Text>
      <Text style={s.texto}>Clasificador local de vecino más cercano. Reconoce nombre, precio o descripción; no es un chatbot y puede equivocarse.</Text>
      <View style={s.productoBox}>
        <Text style={s.label}>Plato seleccionado</Text>
        <Text style={s.producto}>{producto?.nombre ?? 'Sin platos'}</Text>
        {producto?.fotoUri ? <Text style={s.texto}>Este plato incluye una foto capturada.</Text> : null}
      </View>
      <Pressable accessibilityRole="button" style={s.botonSecundario} disabled={productos.length < 2} onPress={() => { setIndice((i) => (i + 1) % productos.length); setRespuesta(''); setEleccionManual(false); }}>
        <Text style={s.botonSecundarioTexto}>Siguiente plato</Text>
      </Pressable>
      <Text style={s.label}>Pregunta por su nombre, precio o descripción</Text>
      <View style={[s.formulario, width >= 700 && s.formularioAmplio]}>
        <TextInput
          value={pregunta}
          onChangeText={(value) => { setPregunta(value); setRespuesta(''); setEleccionManual(false); }}
          placeholder="Ejemplo: ¿cuánto cuesta?"
          accessibilityLabel="Pregunta sobre el plato seleccionado"
          style={[s.entrada, width >= 700 && s.entradaAmplia]}
          multiline
        />
        <Pressable accessibilityRole="button" style={s.boton} onPress={consultar}>
          <Text style={s.botonTexto}>Consultar</Text>
        </Pressable>
      </View>
      {eleccionManual && (
        <View style={s.opciones}>
          {INTENCIONES.map((opcion) => (
            <Pressable key={opcion.id} accessibilityRole="button" style={s.opcion} onPress={() => responder(opcion.id, true)}>
              <Text style={s.opcionTexto}>{opcion.etiqueta}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={s.resultado} accessibilityLiveRegion="polite">{respuesta || 'Aquí aparecerá el resultado.'}</Text>
      <Text style={s.aviso}>La similitud no es una probabilidad de certeza. La respuesta procede de los datos del plato seleccionado.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, minHeight: 0 },
  contenido: { padding: 16, paddingBottom: 32, gap: 12 },
  titulo: { fontSize: 23, fontWeight: '800', color: '#F2E6C9' },
  texto: { color: '#C7A978', lineHeight: 20 },
  productoBox: { padding: 14, borderRadius: 12, backgroundColor: '#38220E', borderWidth: 1, borderColor: '#805600' },
  label: { color: '#F3B900', fontWeight: '800' },
  producto: { fontSize: 17, fontWeight: '700', marginTop: 4, color: '#F2E6C9' },
  formulario: { gap: 10 },
  formularioAmplio: { flexDirection: 'row', alignItems: 'center' },
  entrada: { minHeight: 54, borderWidth: 1, borderColor: '#805600', borderRadius: 10, padding: 12, backgroundColor: '#F2E6C9', fontSize: 16 },
  entradaAmplia: { flex: 1, minWidth: 0 },
  boton: { minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#8A6500' },
  botonTexto: { color: '#F2E6C9', fontWeight: '800' },
  botonSecundario: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: '#493016' },
  botonSecundarioTexto: { color: '#F3B900', fontWeight: '700' },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { minHeight: 44, minWidth: 95, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 9, backgroundColor: '#493016' },
  opcionTexto: { color: '#E8D5B1', fontWeight: '700' },
  resultado: { padding: 14, borderRadius: 10, backgroundColor: '#493016', fontSize: 16, lineHeight: 23, color: '#F2E6C9' },
  aviso: { fontSize: 12, color: '#C7A978', lineHeight: 18 },
});


