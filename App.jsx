import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExploracionCamara from './ExploracionCamara';
import AsistenteIA from './AsistenteIA';
import NuevoPlatilloCamara from './NuevoPlatilloCamara';

const CLAVE_FAVORITOS = '@restaurante-el-sabor:favoritos';
const CLAVE_PLATOS_NUEVOS = '@restaurante-el-sabor:platos-nuevos';
const CLAVE_CARRITO = '@restaurante-el-sabor:carrito';

// Catálogo fijo: precios de ejemplo en pesos colombianos (COP).
const platos = [
  { id: 1, nombre: 'Bofe con papa y guacamole', descripcion: 'Bofe dorado, papa salada y guacamole preparado en casa.', precio: '$ 30.000' },
  { id: 2, nombre: 'Chorizo a la parrilla', descripcion: 'Chorizo artesanal asado, servido con limón y arepa.', precio: '$ 18.000' },
  { id: 3, nombre: 'Empanadas de carne', descripcion: 'Tres empanadas crocantes de carne con ají de la casa.', precio: '$ 16.000' },
  { id: 4, nombre: 'Provoleta', descripcion: 'Queso provolone a la parrilla con orégano y tomate.', precio: '$ 28.000' },
  { id: 5, nombre: 'Parrillada mixta', descripcion: 'Selección de carnes, chorizo y acompañamientos para compartir.', precio: '$ 72.000' },
  { id: 6, nombre: 'Vino de la casa', descripcion: 'Copa de vino tinto o blanco de la casa.', precio: '$ 20.000' },
  { id: 7, nombre: 'Mollejas a la parrilla', descripcion: 'Mollejas doradas a fuego lento con limón.', precio: '$ 35.000' },
  { id: 8, nombre: 'Morcilla', descripcion: 'Morcilla asada, acompañada de papa criolla.', precio: '$ 18.000' },
  { id: 9, nombre: 'Chinchulines', descripcion: 'Chinchulines crocantes preparados a la parrilla.', precio: '$ 24.000' },
  { id: 10, nombre: 'Riñones al vino', descripcion: 'Riñones cocinados lentamente en salsa de vino.', precio: '$ 32.000' },
  { id: 11, nombre: 'Punta de anca', descripcion: 'Corte de res a la parrilla con papa y ensalada.', precio: '$ 48.000' },
  { id: 12, nombre: 'Churrasco', descripcion: 'Corte de res asado, servido con papas y ensalada fresca.', precio: '$ 45.000' },
  { id: 13, nombre: 'Lomo al trapo', descripcion: 'Lomo de res asado lentamente y acompañado de papa.', precio: '$ 58.000' },
  { id: 14, nombre: 'Costillas BBQ', descripcion: 'Costillas de cerdo con salsa BBQ y papas rústicas.', precio: '$ 42.000' },
  { id: 15, nombre: 'Pollo a la parrilla', descripcion: 'Pechuga de pollo asada con arroz y ensalada.', precio: '$ 34.000' },
  { id: 16, nombre: 'Trucha al limón', descripcion: 'Trucha a la plancha con limón, papa y ensalada.', precio: '$ 40.000' },
  { id: 17, nombre: 'Ceviche de camarón', descripcion: 'Camarones marinados con limón, cebolla y cilantro.', precio: '$ 36.000' },
  { id: 18, nombre: 'Paella de la casa', descripcion: 'Arroz preparado con mariscos, pollo y vegetales.', precio: '$ 52.000' },
  { id: 19, nombre: 'Ajiaco', descripcion: 'Sopa bogotana de pollo, papas y mazorca con guarniciones.', precio: '$ 29.000' },
  { id: 20, nombre: 'Bandeja paisa', descripcion: 'Fríjoles, arroz, carne, chicharrón, huevo, arepa y aguacate.', precio: '$ 38.000' },
];

export default function App() {
  const { width } = useWindowDimensions();
  const resumenCompacto = width < 600;
  const pestanasCompactas = width < 900;
  const [pestana, setPestana] = React.useState('menu');
  const [favoritos, setFavoritos] = useState([]);
  const [favoritosListos, setFavoritosListos] = useState(false);
  const [estadoFavoritos, setEstadoFavoritos] = useState('Cargando favoritos...');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [guardandoId, setGuardandoId] = useState(null);
  const [platosNuevos, setPlatosNuevos] = useState([]);
  const [carrito, setCarrito] = useState({});
  const [datosLocalesListos, setDatosLocalesListos] = useState(false);
  const catalogo = [...platosNuevos, ...platos];
  const cantidadCarrito = Object.values(carrito).reduce((total, cantidad) => total + cantidad, 0);
  const definicionesPestanas = [
    { id: 'menu', texto: 'Menú' },
    { id: 'sensores', texto: 'Sensores' },
    { id: 'nuevo', texto: 'Nuevo plato' },
    { id: 'carrito', texto: `Carrito (${cantidadCarrito})` },
    { id: 'asistente', texto: 'Asistente' },
  ];

  let platosVisibles = catalogo;
  if (soloFavoritos) {
    platosVisibles = catalogo.filter((plato) => favoritos.includes(plato.id));
  } else {
    platosVisibles = catalogo;
  }

  let etiquetaFiltroFavoritos = '';
  let nombreAccionFiltro = '';
  let pistaAccionFiltro = '';
  if (soloFavoritos) {
    etiquetaFiltroFavoritos = 'Ver menú completo';
    nombreAccionFiltro = 'Mostrar el menú completo';
    pistaAccionFiltro = 'Vuelve a mostrar todos los platos del menú';
  } else {
    etiquetaFiltroFavoritos = `Ver favoritos (${favoritos.length})`;
    nombreAccionFiltro = `Ver los ${favoritos.length} platos favoritos`;
    pistaAccionFiltro = 'Filtra el menú para ver solo los platos guardados';
  }

  useEffect(() => {
    let activo = true;
    async function recuperarDatosLocales() {
      try {
        const [platosGuardados, carritoGuardado] = await Promise.all([
          AsyncStorage.getItem(CLAVE_PLATOS_NUEVOS),
          AsyncStorage.getItem(CLAVE_CARRITO),
        ]);
        const menuLocal = platosGuardados ? JSON.parse(platosGuardados) : [];
        const carritoLocal = carritoGuardado ? JSON.parse(carritoGuardado) : {};
        if (!Array.isArray(menuLocal) || !carritoLocal || typeof carritoLocal !== 'object') {
          throw new Error('Datos locales con formato inválido');
        }
        if (activo) {
          setPlatosNuevos(menuLocal);
          setCarrito(carritoLocal);
        }
      } catch (error) {
        if (activo) setEstadoFavoritos('No se pudieron recuperar algunos datos locales.');
      } finally {
        if (activo) setDatosLocalesListos(true);
      }
    }
    recuperarDatosLocales();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!datosLocalesListos) return;
    AsyncStorage.setItem(CLAVE_PLATOS_NUEVOS, JSON.stringify(platosNuevos)).catch(() => {
      setEstadoFavoritos('No se pudo guardar el menú local.');
    });
    AsyncStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)).catch(() => {
      setEstadoFavoritos('No se pudo guardar el carrito.');
    });
  }, [datosLocalesListos, platosNuevos, carrito]);

  useEffect(() => {
    let activo = true;

    async function recuperarFavoritos() {
      try {
        const guardados = await AsyncStorage.getItem(CLAVE_FAVORITOS);
        const lista = guardados ? JSON.parse(guardados) : [];
        if (!Array.isArray(lista)) throw new Error('Formato de favoritos inválido');

        if (activo) {
          setFavoritos(lista);
          setEstadoFavoritos(lista.length
            ? 'Favoritos recuperados de este dispositivo.'
            : 'Aún no tienes platos favoritos.');
        }
      } catch (error) {
        if (activo) setEstadoFavoritos('No se pudieron recuperar los favoritos.');
      } finally {
        if (activo) setFavoritosListos(true);
      }
    }

    recuperarFavoritos();
    return () => { activo = false; };
  }, []);

  async function alternarFavorito(id) {
    if (guardandoId !== null) return;
    setGuardandoId(id);
    let nuevaLista = [];
    let quitarDeFavoritos = false;
    if (favoritos.includes(id)) {
      nuevaLista = favoritos.filter((favoritoId) => favoritoId !== id);
      quitarDeFavoritos = true;
    } else {
      nuevaLista = [...favoritos, id];
    }
    const plato = catalogo.find((elemento) => elemento.id === id);

    try {
      await AsyncStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(nuevaLista));
      setFavoritos(nuevaLista);
      if (quitarDeFavoritos) {
        setEstadoFavoritos(`${plato?.nombre ?? 'Plato'} se quitó de favoritos.`);
      } else {
        setEstadoFavoritos(`${plato?.nombre ?? 'Plato'} se guardó en favoritos.`);
      }
    } catch (error) {
      setEstadoFavoritos('No se pudo guardar. Revisa el almacenamiento del dispositivo.');
    } finally {
      setGuardandoId(null);
    }
  }

  async function eliminarFavoritos() {
    if (guardandoId !== null) return;
    try {
      setGuardandoId('todos');
      await AsyncStorage.removeItem(CLAVE_FAVORITOS);
      setFavoritos([]);
      setEstadoFavoritos('Favoritos eliminados de este dispositivo.');
    } catch (error) {
      setEstadoFavoritos('No se pudieron eliminar los favoritos.');
    } finally {
      setGuardandoId(null);
    }
  }

  async function guardarPlatoNuevo(datos) {
    if (!datosLocalesListos) throw new Error('El menú local todavía se está cargando.');
    const nuevoPlato = { ...datos, id: `plato-${Date.now()}` };
    const nuevaLista = [nuevoPlato, ...platosNuevos];
    await AsyncStorage.setItem(CLAVE_PLATOS_NUEVOS, JSON.stringify(nuevaLista));
    setPlatosNuevos(nuevaLista);
    setEstadoFavoritos(`${nuevoPlato.nombre} se agregó al menú local.`);
  }

  function agregarAlCarrito(id, cambio = 1) {
    if (!datosLocalesListos) {
      setEstadoFavoritos('Espera a que se cargue el carrito local.');
      return;
    }
    setCarrito((actual) => {
      const nuevaCantidad = (actual[id] || 0) + cambio;
      const siguiente = { ...actual };
      if (nuevaCantidad <= 0) delete siguiente[id];
      else siguiente[id] = nuevaCantidad;
      return siguiente;
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>🍽️ Restaurante El Sabor</Text>
        <Text style={styles.subtitulo}>Menú · {catalogo.length} platos</Text>
      </View>

      <View style={[styles.pestanas, pestanasCompactas && styles.pestanasCompactas]}>
        {definicionesPestanas.map((elemento) => (
          <Pressable
            key={elemento.id}
            accessibilityRole="tab"
            accessibilityLabel={elemento.texto}
            accessibilityState={{ selected: pestana === elemento.id }}
            hitSlop={6}
            style={[styles.pestana, pestanasCompactas && styles.pestanaCompacta, pestana === elemento.id && styles.pestanaActiva]}
            onPress={() => setPestana(elemento.id)}
          >
            <Text style={[styles.textoPestana, pestana === elemento.id && styles.textoPestanaActivo]}>{elemento.texto}</Text>
          </Pressable>
        ))}
      </View>

      {pestana === 'menu' && <View style={[styles.resumenFavoritos, resumenCompacto && styles.resumenFavoritosCompacto]}>
        <View style={styles.textoResumenFavoritos}>
          <Text style={styles.tituloFavoritos}>★ Favoritos: {favoritos.length}</Text>
          <Text style={styles.estadoFavoritos} accessibilityLiveRegion="polite">{estadoFavoritos}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nombreAccionFiltro}
          accessibilityHint={pistaAccionFiltro}
          accessibilityState={{ selected: soloFavoritos, disabled: !favoritosListos || guardandoId !== null }}
          hitSlop={8}
          disabled={!favoritosListos || guardandoId !== null}
          onPress={() => setSoloFavoritos((actual) => !actual)}
          style={[styles.botonVerFavoritos, (!favoritosListos || guardandoId !== null) && styles.botonDeshabilitado]}
        >
          <Text style={styles.textoVerFavoritos}>{etiquetaFiltroFavoritos}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar todos los platos favoritos"
          accessibilityHint="Elimina de este dispositivo todos los platos guardados"
          hitSlop={8}
          disabled={!favoritosListos || favoritos.length === 0 || guardandoId !== null}
          onPress={eliminarFavoritos}
          style={[styles.botonEliminarFavoritos, (!favoritosListos || favoritos.length === 0 || guardandoId !== null) && styles.botonDeshabilitado]}
        >
          <Text style={styles.textoEliminarFavoritos}>{guardandoId === 'todos' ? 'Borrando...' : 'Borrar todos'}</Text>
        </Pressable>
      </View>}

      {pestana === 'menu' && <PantallaAdaptativa items={platosVisibles} totalProductos={catalogo.length} soloFavoritos={soloFavoritos} favoritos={favoritos} favoritosListos={favoritosListos} guardandoId={guardandoId} carrito={carrito} onAgregarCarrito={agregarAlCarrito} onMostrarTodos={() => setSoloFavoritos(false)} onAlternarFavorito={alternarFavorito} />}
      {pestana === 'sensores' && <PantallaSensores />}
      {pestana === 'nuevo' && <NuevoPlatilloCamara onCerrar={() => setPestana('menu')} onGuardar={guardarPlatoNuevo} />}
      {pestana === 'carrito' && <PantallaCarrito productos={catalogo} carrito={carrito} onCambiarCantidad={agregarAlCarrito} />}
      {pestana === 'asistente' && <AsistenteIA productos={catalogo} />}
    </View>
  );
}

// Catálogo único: FlatList optimizado y columnas adaptadas al ancho disponible.
function PantallaAdaptativa({ items, totalProductos, soloFavoritos, favoritos, favoritosListos, guardandoId, carrito, onAgregarCarrito, onMostrarTodos, onAlternarFavorito }) {
  const { width } = useWindowDimensions();
  const esTableta = width >= 600;
  const esPantallaGrande = width >= 900;

  let columnas = 1;
  if (esPantallaGrande) {
    columnas = 3;
  } else if (esTableta) {
    columnas = 2;
  }

  let tipoDispositivo = 'Teléfono';
  if (esPantallaGrande) {
    tipoDispositivo = 'Pantalla grande';
  } else if (esTableta) {
    tipoDispositivo = 'Tableta';
  } else {
    tipoDispositivo = 'Teléfono';
  }

  let contenidoVacio = null;
  if (soloFavoritos) {
    contenidoVacio = <ListaFavoritosVacia onMostrarTodos={onMostrarTodos} />;
  } else {
    contenidoVacio = null;
  }

  return (
    <View style={styles.pantallaAdaptativa}>
      <View style={[styles.resumen, esTableta && styles.resumenGrande]}>
        <Text style={styles.tituloResumen}>Resumen del catálogo</Text>
        <Text style={styles.datoResumen}>Platos: {totalProductos}</Text>
        {soloFavoritos && <Text style={styles.datoResumen}>Favoritos mostrados: {items.length}</Text>}
        <Text style={styles.datoResumen}>Dispositivo: {tipoDispositivo}</Text>
        <Text style={styles.datoResumen}>Columnas: {columnas}</Text>
      </View>

      <FlatList
        style={styles.lista}
        data={items}
        numColumns={columnas}
        key={columnas}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={12}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listaContenido}
        ListEmptyComponent={contenidoVacio}
        columnWrapperStyle={columnas > 1 ? styles.fila : undefined}
        renderItem={({ item, index }) => (
          <Tarjeta
            plato={item}
            etiqueta="Menú"
            colorBorde={index % 2 === 0 ? '#00B894' : '#0984E3'}
            adaptativa={columnas > 1}
            optimizada
            esFavorito={favoritos.includes(item.id)}
            favoritosListos={favoritosListos}
            guardandoId={guardandoId}
            cantidadCarrito={carrito[item.id] || 0}
            onAgregarCarrito={onAgregarCarrito}
            onAlternarFavorito={onAlternarFavorito}
          />
        )}
      />
    </View>
  );
}

function ListaFavoritosVacia({ onMostrarTodos }) {
  return (
    <View style={styles.vacioFavoritos}>
      <Text style={styles.tituloVacioFavoritos}>Todavía no guardaste favoritos</Text>
      <Text style={styles.textoVacioFavoritos}>Explora el menú y pulsa “Marcar favorito” en los platos que quieras conservar.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al menú completo"
        accessibilityHint="Muestra todos los platos para que puedas guardar favoritos"
        hitSlop={8}
        onPress={onMostrarTodos}
        style={styles.botonVacioFavoritos}
      >
        <Text style={styles.textoBotonVacioFavoritos}>Volver al menú</Text>
      </Pressable>
    </View>
  );
}

function PantallaSensores() {
  const ultimoDatoRef = useRef(null);
  const ultimoAvisoMeseroRef = useRef(0);
  const [mensajeMesero, setMensajeMesero] = useState('El llamado se registra solo en esta pantalla.');
  const [datos, setDatos] = useState({ x: 0, y: 0, z: 0 });
  const [simulados, setSimulados] = useState({ x: 0, y: 0, z: 1 });
  const [modo, setModo] = useState('simulacion');
  const [sensorActivo, setSensorActivo] = useState(false);
  const [estado, setEstado] = useState('Simulación: sin sensor físico');
  const [mostrarCamara, setMostrarCamara] = useState(false);

  useEffect(() => {
    if (mostrarCamara) {
      setEstado('Sensor detenido: cámara activa.');
      return undefined;
    }

    if (modo !== 'real') {
      setEstado('Simulación: sin sensor físico');
      return undefined;
    }

    if (!sensorActivo) {
      setEstado('Sensor pausado. Puedes activarlo o continuar con simulación.');
      return undefined;
    }

    let cancelado = false;
    let subscription;

    async function iniciarSensor() {
      ultimoDatoRef.current = null;
      setEstado('Comprobando sensor y permiso...');
      setDatos({ x: 0, y: 0, z: 0 });

      try {
        // En esta práctica, la web usa simulación explícita.
        if (Platform.OS === 'web') {
          setEstado('En esta práctica web se usa simulación. Prueba el sensor en Expo Go.');
          return;
        }

        const permiso = await Accelerometer.requestPermissionsAsync();
        if (cancelado) return;
        if (!permiso.granted) {
          setEstado('Permiso denegado. Puedes continuar con simulación.');
          return;
        }

        const disponible = await Accelerometer.isAvailableAsync();
        if (cancelado) return;
        if (!disponible) {
          setEstado('Acelerómetro no disponible. Usa simulación.');
          return;
        }

        Accelerometer.setUpdateInterval(100);
        setEstado('Esperando la primera lectura...');
        subscription = Accelerometer.addListener((lectura) => {
          if (cancelado) return;
          setDatos({ x: lectura.x, y: lectura.y, z: lectura.z });
          const anterior = ultimoDatoRef.current;
          if (anterior) {
            const cambio = Math.sqrt(
              (lectura.x - anterior.x) ** 2 +
              (lectura.y - anterior.y) ** 2 +
              (lectura.z - anterior.z) ** 2
            );
            const ahora = Date.now();
            if (cambio > 1.35 && ahora - ultimoAvisoMeseroRef.current > 10000) {
              ultimoAvisoMeseroRef.current = ahora;
              setMensajeMesero('Movimiento detectado: llamado local registrado. Avisa al personal; la app no envía una notificación al restaurante.');
            }
          }
          ultimoDatoRef.current = { x: lectura.x, y: lectura.y, z: lectura.z };
          setEstado('Sensor activo');
        });
      } catch (error) {
        if (!cancelado) {
          setEstado('No se pudo iniciar el sensor. Revisa el dispositivo o usa simulación.');
        }
      }
    }

    iniciarSensor();
    return () => {
      cancelado = true;
      subscription?.remove();
    };
  }, [modo, sensorActivo, mostrarCamara]);

  const lectura = modo === 'simulacion' ? simulados : datos;
  const hayLectura = modo === 'simulacion' || estado === 'Sensor activo';

  // Mejora propia: guía visual de tres zonas para mantener el teléfono
  // aproximadamente nivelado al consultar una receta en el restaurante.
  // Es un umbral didáctico; no representa una medición calibrada.
  let zonaActiva = 'centro';
  let posicion = 'Bien: teléfono centrado';
  let consejo = 'Puedes seguir consultando la receta.';
  if (lectura.x > 0.5) {
    zonaActiva = 'derecha';
    posicion = 'Inclinado hacia la derecha';
    consejo = 'Ajusta suavemente el teléfono hacia el centro.';
  } else if (lectura.x < -0.5) {
    zonaActiva = 'izquierda';
    posicion = 'Inclinado hacia la izquierda';
    consejo = 'Ajusta suavemente el teléfono hacia el centro.';
  }

  function activarModoReal() {
    setModo('real');
    setSensorActivo(true);
  }

  function activarSimulacion() {
    setSensorActivo(false);
    setModo('simulacion');
  }

  if (mostrarCamara) {
    return <ExploracionCamara onCerrar={() => setMostrarCamara(false)} />;
  }

  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelSensor}>
      <View style={styles.tarjetaMesero}>
        <Text style={styles.nombre}>Llamar al mesero</Text>
        <Text style={styles.mensajeMesero} accessibilityLiveRegion="polite">{mensajeMesero}</Text>
        <Text style={styles.aviso}>En teléfono, activa el sensor y agita suavemente para registrar un llamado. En web puedes probar el botón manual. Es una demostración local; no avisa a un mesero real.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Registrar llamado manual al mesero" style={styles.botonMesero} onPress={() => setMensajeMesero('Llamado manual registrado en esta pantalla. Avisa al personal; no se envió una notificación externa.')}>
          <Text style={styles.textoControl}>Llamar manualmente</Text>
        </Pressable>
        {modo === 'simulacion' && <Pressable accessibilityRole="button" style={styles.boton} onPress={() => setMensajeMesero('Movimiento simulado: llamado local registrado. No se envió una notificación externa.')}><Text style={styles.textoControl}>Simular movimiento y llamado</Text></Pressable>}
      </View>
      <Pressable style={styles.boton} onPress={() => setMostrarCamara(true)}>

        <Text style={styles.textoControl}>Explorar cámara</Text>
      </Pressable>
      <Text style={styles.tituloResumen}>Mi app siente el movimiento</Text>
      <Text style={styles.aviso}>
        Necesidad: consultar una receta manteniendo el teléfono aproximadamente nivelado. El acelerómetro lee el eje X y la pantalla indica hacia qué lado corregir. En web esta práctica utiliza simulación.
      </Text>

      <View style={styles.controlesSensor}>
        <Pressable style={styles.boton} onPress={activarModoReal}>
          <Text style={styles.textoControl}>Usar sensor real</Text>
        </Pressable>
        <Pressable style={styles.boton} onPress={activarSimulacion}>
          <Text style={styles.textoControl}>Usar simulación</Text>
        </Pressable>
      </View>

      {modo === 'real' && (
        <Pressable
          style={[styles.boton, styles.botonControlSensor]}
          onPress={() => setSensorActivo((activo) => !activo)}
        >
          <Text style={styles.textoControl}>
            {sensorActivo ? 'Pausar sensor' : 'Activar sensor'}
          </Text>
        </Pressable>
      )}

      <Text style={styles.estadoSensor}>{estado}</Text>
      <Text style={styles.origen}>Origen: {modo === 'real' ? 'Sensor físico' : 'SIMULADO'}</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.nombre}>Lecturas del acelerómetro (g)</Text>
        <Text style={styles.lectura}>X: {hayLectura ? lectura.x.toFixed(2) : '--'}</Text>
        <Text style={styles.lectura}>Y: {hayLectura ? lectura.y.toFixed(2) : '--'}</Text>
        <Text style={styles.lectura}>Z: {hayLectura ? lectura.z.toFixed(2) : '--'}</Text>
        <View style={[
          styles.mensajeInclinacion,
          hayLectura && zonaActiva === 'centro' && styles.mensajeCentro,
          hayLectura && zonaActiva !== 'centro' && styles.mensajeInclinado,
        ]}>
          <Text style={styles.mensajeInclinacionTitulo}>
            {hayLectura ? posicion : 'Esperando datos del sensor'}
          </Text>
          {hayLectura && <Text style={styles.mensajeInclinacionTexto}>{consejo}</Text>}
        </View>
      </View>

      {hayLectura && (
        <View style={styles.nivel}>
          <Text style={styles.etiquetaNivel}>Izquierda</Text>
          <View style={[
            styles.zonaNivel,
            zonaActiva === 'izquierda' && styles.zonaNivelActiva,
            zonaActiva === 'izquierda' && styles.zonaNivelAlerta,
          ]} />
          <View style={[
            styles.zonaNivel,
            styles.zonaNivelCentro,
            zonaActiva === 'centro' && styles.zonaNivelActiva,
          ]} />
          <View style={[
            styles.zonaNivel,
            zonaActiva === 'derecha' && styles.zonaNivelActiva,
            zonaActiva === 'derecha' && styles.zonaNivelAlerta,
          ]} />
          <Text style={styles.etiquetaNivel}>Derecha</Text>
        </View>
      )}

      {modo === 'simulacion' && (
        <View style={styles.controlesSensor}>
          <Pressable style={styles.boton} onPress={() => setSimulados({ x: -0.8, y: 0, z: 1 })}>
            <Text style={styles.textoControl}>Simular izquierda</Text>
          </Pressable>
          <Pressable style={styles.boton} onPress={() => setSimulados({ x: 0, y: 0, z: 1 })}>
            <Text style={styles.textoControl}>Centrar</Text>
          </Pressable>
          <Pressable style={styles.boton} onPress={() => setSimulados({ x: 0.8, y: 0, z: 1 })}>
            <Text style={styles.textoControl}>Simular derecha</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.aviso}>
        Umbral didáctico: X mayor que 0.5 indica derecha y X menor que -0.5 indica izquierda.
        La gravedad afecta la lectura; no es un nivel calibrado.
      </Text>
    </ScrollView>
  );
}


function PantallaCarrito({ productos, carrito, onCambiarCantidad }) {
  const seleccionados = productos.filter((producto) => carrito[producto.id] > 0);
  const total = seleccionados.reduce((suma, producto) => suma + parseInt(String(producto.precio).replace(/[^0-9]/g, ''), 10) * carrito[producto.id], 0);
  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelSensor}>
      <Text style={styles.tituloResumen}>Tu carrito</Text>
      <Text style={styles.aviso}>Selección local de platos. Esta versión no procesa pagos ni envía pedidos.</Text>
      {seleccionados.length === 0 ? (
        <View style={styles.vacioFavoritos}><Text style={styles.tituloVacioFavoritos}>El carrito está vacío</Text><Text style={styles.textoVacioFavoritos}>Vuelve al menú y agrega platos con el botón “Agregar al carrito”.</Text></View>
      ) : seleccionados.map((producto) => (
        <View key={producto.id} style={styles.itemCarrito}>
          <View style={styles.textoItemCarrito}><Text style={styles.nombre}>{producto.nombre}</Text><Text style={styles.descripcion}>{producto.precio} cada uno</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Quitar una unidad de ${producto.nombre}`} style={styles.controlCantidad} onPress={() => onCambiarCantidad(producto.id, -1)}><Text style={styles.controlCantidadTexto}>−</Text></Pressable>
          <Text style={styles.cantidadTexto}>{carrito[producto.id]}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Agregar una unidad de ${producto.nombre}`} style={styles.controlCantidad} onPress={() => onCambiarCantidad(producto.id, 1)}><Text style={styles.controlCantidadTexto}>+</Text></Pressable>
        </View>
      ))}
      <View style={styles.totalCarrito}><Text style={styles.nombre}>Total estimado</Text><Text style={styles.precio}>${total.toLocaleString('es-CO')}</Text></View>
    </ScrollView>
  );
}

function Tarjeta({
  plato,
  etiqueta,
  colorBorde,
  adaptativa = false,
  optimizada = false,
  esFavorito = false,
  favoritosListos = false,
  guardandoId = null,
  cantidadCarrito = 0,
  onAgregarCarrito,
  onAlternarFavorito,
}) {
  let textoAccionFavorito = '';
  let etiquetaAccesibleFavorito = '';
  if (guardandoId === plato.id) {
    textoAccionFavorito = 'Guardando...';
  } else if (esFavorito) {
    textoAccionFavorito = '★ Favorito guardado';
  } else {
    textoAccionFavorito = '☆ Marcar favorito';
  }

  if (esFavorito) {
    etiquetaAccesibleFavorito = `Quitar ${plato.nombre} de favoritos`;
  } else {
    etiquetaAccesibleFavorito = `Guardar ${plato.nombre} en favoritos`;
  }

  return (
    <View
      style={[
        styles.tarjeta,
        { borderLeftColor: colorBorde },
        adaptativa && styles.tarjetaAdaptativa,
      ]}
    >
      {plato.fotoUri ? <Image source={{ uri: plato.fotoUri }} style={styles.fotoPlato} resizeMode="cover" /> : null}
      <View style={styles.filaTitulo}>
        <Text style={styles.nombre} numberOfLines={2}>{plato.nombre}</Text>
        <View style={[styles.badge, optimizada && styles.badgeOptimizada]}>
          <Text style={styles.badgeTexto}>{etiqueta}</Text>
        </View>
      </View>
      <Text style={styles.descripcion} numberOfLines={2}>{plato.descripcion}</Text>
      <Text style={styles.precio}>{plato.precio}</Text>
      {onAgregarCarrito && (
        <Pressable accessibilityRole="button" accessibilityLabel={`Agregar ${plato.nombre} al carrito`} hitSlop={6} onPress={() => onAgregarCarrito(plato.id, 1)} style={styles.botonCarrito}>
          <Text style={styles.textoBotonCarrito}>{cantidadCarrito > 0 ? `Agregar otra unidad · ${cantidadCarrito} en carrito` : 'Agregar al carrito'}</Text>
        </Pressable>
      )}
      {onAlternarFavorito && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={etiquetaAccesibleFavorito}
          accessibilityHint={esFavorito ? 'Quita este plato de la lista de favoritos guardados' : 'Guarda este plato en tu lista de favoritos'}
          accessibilityState={{ selected: esFavorito, disabled: !favoritosListos || guardandoId !== null }}
          hitSlop={8}
          disabled={!favoritosListos || guardandoId !== null}
          onPress={() => onAlternarFavorito(plato.id)}
          style={[styles.botonFavorito, esFavorito && styles.botonFavoritoActivo, (!favoritosListos || guardandoId !== null) && styles.botonDeshabilitado]}
        >
          <Text style={[styles.textoBotonFavorito, esFavorito && styles.textoBotonFavoritoActivo]}>
            {textoAccionFavorito}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  encabezado: {
    backgroundColor: '#1E1E2E',
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 5,
  },
  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitulo: {
    fontSize: 15,
    color: '#C4C4D6',
    marginTop: 6,
  },
  pestanas: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  pestanasCompactas: {
    flexWrap: 'wrap',
  },
  pestana: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 5,
    backgroundColor: '#E0E0E8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pestanaCompacta: { flexBasis: '46%', flexGrow: 1, flexShrink: 0 },
  botonAsistente: { minHeight: 44, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#E0EDF3' },
  textoBotonAsistente: { color: '#15334E', fontWeight: '700' },
  pestanaActiva: {
    backgroundColor: '#E63946',
    elevation: 3,
  },
  textoPestana: {
    color: '#454552',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textoPestanaActivo: {
    color: '#FFFFFF',
  },
  lista: {
    flex: 1,
  },
  listaContenido: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  pantallaAdaptativa: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resumen: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    gap: 5,
    elevation: 2,
  },
  resumenGrande: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 12,
  },
  tituloResumen: {
    color: '#1E1E2E',
    fontWeight: 'bold',
    fontSize: 17,
    marginRight: 8,
  },
  datoResumen: {
    color: '#55596B',
    fontSize: 14,
  },
  tarjeta: {
    marginTop: 12,
    marginHorizontal: 4,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 6,
    elevation: 2,
  },
  tarjetaAdaptativa: {
    flex: 1,
    minWidth: 0,
  },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  nombre: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E2E',
  },
  descripcion: {
    color: '#7A7A8C',
    marginTop: 6,
    fontSize: 13,
  },
  precio: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 9,
    color: '#E63946',
  },
  resumenFavoritos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  resumenFavoritosCompacto: { alignItems: 'stretch' },
  textoResumenFavoritos: { flex: 1, minWidth: 150, paddingRight: 8 },
  tituloFavoritos: { color: '#1E1E2E', fontWeight: '700' },
  estadoFavoritos: { color: '#55596B', fontSize: 12, marginTop: 3 },
  botonVerFavoritos: { minHeight: 44, justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#E8F2FF' },
  textoVerFavoritos: { color: '#0759A5', fontWeight: '700', fontSize: 12 },
  botonEliminarFavoritos: { minHeight: 44, justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FDE2E4' },
  textoEliminarFavoritos: { color: '#B42332', fontWeight: '700', fontSize: 12 },
  botonFavorito: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FDE2E4' },
  botonFavoritoActivo: { backgroundColor: '#E63946' },
  fotoPlato: { width: '100%', height: 130, borderRadius: 10, marginBottom: 10 },
  botonCarrito: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#E8F2FF' },
  textoBotonCarrito: { color: '#0759A5', fontWeight: '700', fontSize: 12 },
  tarjetaMesero: { padding: 14, borderRadius: 12, backgroundColor: '#FFFFFF', gap: 9 },
  mensajeMesero: { color: '#15334E', fontWeight: '700', lineHeight: 20 },
  botonMesero: { minHeight: 46, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: '#F77F00' },
  itemCarrito: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginTop: 10, borderRadius: 12, backgroundColor: '#FFFFFF' },
  textoItemCarrito: { flex: 1, minWidth: 0 },
  controlCantidad: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#FDE2E4' },
  controlCantidadTexto: { fontSize: 22, color: '#8B2630', fontWeight: '800' },
  cantidadTexto: { minWidth: 20, textAlign: 'center', fontWeight: '800', color: '#1E1E2E' },
  totalCarrito: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: '#FFFFFF' },
  textoBotonFavorito: { color: '#8B2630', fontWeight: '700', fontSize: 12 },
  textoBotonFavoritoActivo: { color: '#FFFFFF' },
  botonDeshabilitado: { opacity: 0.5 },
  vacioFavoritos: { marginTop: 12, marginHorizontal: 4, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 14, alignItems: 'flex-start', gap: 8, elevation: 2 },
  tituloVacioFavoritos: { color: '#1E1E2E', fontSize: 17, fontWeight: '700' },
  textoVacioFavoritos: { color: '#55596B', lineHeight: 21 },
  botonVacioFavoritos: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, marginTop: 4, borderRadius: 8, backgroundColor: '#E63946' },
  textoBotonVacioFavoritos: { color: '#FFFFFF', fontWeight: '700' },
  badge: {
    backgroundColor: '#E63946',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeOptimizada: {
    backgroundColor: '#0984E3',
  },
  badgeTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fila: {
    gap: 8,
  },
  // Estilos compartidos por la pantalla de sensores, con la paleta del restaurante.
  boton: { paddingVertical: 12, paddingHorizontal: 14, margin: 4, borderRadius: 10, backgroundColor: '#FDE2E4' },
  textoControl: { color: '#1E1E2E', fontWeight: '700' },
  tituloResumen: { color: '#1E1E2E', fontWeight: 'bold', fontSize: 19, marginBottom: 8 },
  controlesSensor: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  botonControlSensor: { alignSelf: 'flex-start', backgroundColor: '#F77F00' },
  estadoSensor: { marginVertical: 10, color: '#1E1E2E', fontWeight: '600' },
  origen: { color: '#55596B', marginBottom: 4 },
  lectura: { color: '#55596B', marginTop: 4, fontSize: 16 },
  panelSensor: { padding: 16, paddingBottom: 32 },
  mensajeInclinacion: { marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: '#FFF1D6' },
  mensajeCentro: { backgroundColor: '#DDF5E8' },
  mensajeInclinado: { backgroundColor: '#FDE2E4' },
  mensajeInclinacionTitulo: { color: '#1E1E2E', fontWeight: '700' },
  mensajeInclinacionTexto: { color: '#55596B', marginTop: 4 },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16, padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF' },
  etiquetaNivel: { color: '#55596B', fontSize: 12 },
  zonaNivel: { flex: 1, height: 18, borderRadius: 9, backgroundColor: '#E5E5EC' },
  zonaNivelCentro: { backgroundColor: '#DDF5E8' },
  zonaNivelActiva: { backgroundColor: '#00B894' },
  zonaNivelAlerta: { backgroundColor: '#E63946' },
});





