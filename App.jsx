import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AsistenteIA from './AsistenteIA';
import NuevoPlatilloCamara from './NuevoPlatilloCamara';

const CLAVE_FAVORITOS = '@restaurante-el-sabor:favoritos';
const CLAVE_PLATOS_NUEVOS = '@restaurante-el-sabor:platos-nuevos';
const CLAVE_CARRITO = '@restaurante-el-sabor:carrito';
const CLAVE_FOTOS_PLATOS = '@restaurante-el-sabor:fotos-platos';
const CLAVE_PEDIDOS = '@restaurante-el-sabor:pedidos';

// Datos ficticios para la maqueta. Reemplazarlos antes de publicar el sitio.
const datosRestaurante = {
  direccion: 'Carrera 50 # 48-20, Ciudad Córdoba, Cali (dirección ficticia de ejemplo)',
  telefono: '300 000 0000 (número ficticio; no llamar)',
  horario: 'Lunes a domingo, 12:00 m. a 10:00 p. m. (horario de ejemplo)',
};
const categoriasMenu = ['Todos', 'Entradas', 'Platos fuertes', 'Bebidas', 'Nuevos'];

function normalizarBusqueda(valor) {
  return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Catálogo fijo: precios de ejemplo en pesos colombianos (COP).
const platos = [
  { id: 1, categoria: 'Entradas', nombre: 'Bofe con papa y guacamole', descripcion: 'Bofe dorado, papa salada y guacamole preparado en casa.', precio: '$ 30.000', foto: require('./img/menu/bofe-con-papa.jpg') },
  { id: 2, categoria: 'Entradas', nombre: 'Chorizo a la parrilla', descripcion: 'Chorizo artesanal asado, servido con limón y arepa.', precio: '$ 18.000', foto: require('./img/menu/chorizo-a-la-parrilla.jpg') },
  { id: 3, categoria: 'Entradas', nombre: 'Empanadas de carne', descripcion: 'Tres empanadas crocantes de carne con ají de la casa.', precio: '$ 16.000', foto: require('./img/menu/empanadas-de-carne.jpg') },
  { id: 4, categoria: 'Entradas', nombre: 'Provoleta', descripcion: 'Queso provolone a la parrilla con orégano y tomate.', precio: '$ 28.000' },
  { id: 5, categoria: 'Platos fuertes', nombre: 'Parrillada mixta', descripcion: 'Selección de carnes, chorizo y acompañamientos para compartir.', precio: '$ 72.000', foto: require('./img/menu/parrillada-mixta.jpg') },
  { id: 6, categoria: 'Bebidas', nombre: 'Vino de la casa', descripcion: 'Copa de vino tinto o blanco de la casa.', precio: '$ 20.000', foto: require('./img/menu/vino-de-la-casa.jpg') },
  { id: 7, categoria: 'Entradas', nombre: 'Mollejas a la parrilla', descripcion: 'Mollejas doradas a fuego lento con limón.', precio: '$ 35.000', foto: require('./img/menu/mollejas-a-la-parrilla.jpg') },
  { id: 8, categoria: 'Entradas', nombre: 'Morcilla', descripcion: 'Morcilla asada, acompañada de papa criolla.', precio: '$ 18.000', foto: require('./img/menu/morcilla.jpg') },
  { id: 9, categoria: 'Entradas', nombre: 'Chinchulines', descripcion: 'Chinchulines crocantes preparados a la parrilla.', precio: '$ 24.000', foto: require('./img/menu/chinchulines.jpg') },
  { id: 10, categoria: 'Platos fuertes', nombre: 'Riñones al vino', descripcion: 'Riñones cocinados lentamente en salsa de vino.', precio: '$ 32.000', foto: require('./img/menu/rinones-al-vino.jpg') },
  { id: 11, categoria: 'Platos fuertes', nombre: 'Punta de anca', descripcion: 'Corte de res a la parrilla con papa y ensalada.', precio: '$ 48.000', foto: require('./img/menu/punta-de-anca.jpg') },
  { id: 12, categoria: 'Platos fuertes', nombre: 'Churrasco', descripcion: 'Corte de res asado, servido con papas y ensalada fresca.', precio: '$ 45.000', foto: require('./img/menu/churrasco.jpg') },
  { id: 13, categoria: 'Platos fuertes', nombre: 'Lomo al trapo', descripcion: 'Lomo de res asado lentamente y acompañado de papa.', precio: '$ 58.000', foto: require('./img/menu/lomo-al-trapo.jpg') },
  { id: 14, categoria: 'Platos fuertes', nombre: 'Costillas BBQ', descripcion: 'Costillas de cerdo con salsa BBQ y papas rústicas.', precio: '$ 42.000', foto: require('./img/menu/costillas-bbq.jpg') },
  { id: 15, categoria: 'Platos fuertes', nombre: 'Pollo a la parrilla', descripcion: 'Pechuga de pollo asada con arroz y ensalada.', precio: '$ 34.000', foto: require('./img/menu/pollo-a-la-parrilla.jpg') },
  { id: 16, categoria: 'Platos fuertes', nombre: 'Trucha al limón', descripcion: 'Trucha a la plancha con limón, papa y ensalada.', precio: '$ 40.000', foto: require('./img/menu/trucha-al-limon.jpg') },
  { id: 17, categoria: 'Entradas', nombre: 'Ceviche de camarón', descripcion: 'Camarones marinados con limón, cebolla y cilantro.', precio: '$ 36.000', foto: require('./img/menu/ceviche-de-camaron.jpg') },
  { id: 18, categoria: 'Platos fuertes', nombre: 'Paella de la casa', descripcion: 'Arroz preparado con mariscos, pollo y vegetales.', precio: '$ 52.000', foto: require('./img/menu/paella-de-la-casa.jpg') },
  { id: 19, categoria: 'Platos fuertes', nombre: 'Ajiaco', descripcion: 'Sopa bogotana de pollo, papas y mazorca con guarniciones.', precio: '$ 29.000', foto: require('./img/menu/ajiaco.jpg') },
  { id: 20, categoria: 'Platos fuertes', nombre: 'Bandeja paisa', descripcion: 'Fríjoles, arroz, carne, chicharrón, huevo, arepa y aguacate.', precio: '$ 38.000', foto: require('./img/menu/bandeja-paisa.jpg') },
];

export default function App() {
  const { width } = useWindowDimensions();
  const resumenCompacto = width < 600;
  const pestanasCompactas = width < 900;
  const [pestana, setPestana] = React.useState('inicio');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [favoritos, setFavoritos] = useState([]);
  const [favoritosListos, setFavoritosListos] = useState(false);
  const [estadoFavoritos, setEstadoFavoritos] = useState('Cargando favoritos...');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [busquedaMenu, setBusquedaMenu] = useState('');
  const [categoriaMenu, setCategoriaMenu] = useState('Todos');
  const [guardandoId, setGuardandoId] = useState(null);
  const [platosNuevos, setPlatosNuevos] = useState([]);
  const [imagenesPlatos, setImagenesPlatos] = useState({});
  const [carrito, setCarrito] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [datosLocalesListos, setDatosLocalesListos] = useState(false);
  const catalogo = [...platosNuevos.map((plato) => ({ ...plato, categoria: plato.categoria || 'Nuevos' })), ...platos];
  const cantidadCarrito = Object.values(carrito).reduce((total, cantidad) => total + cantidad, 0);
  const escalaIconoCarrito = useRef(new Animated.Value(1)).current;
  const cantidadCarritoAnterior = useRef(0);
  const animacionCarritoLista = useRef(false);
  const definicionesPestanas = [
    { id: 'inicio', texto: 'Inicio' },
    { id: 'menu', texto: 'Menú' },
    { id: 'sensores', texto: 'Sensores' },
    { id: 'nuevo', texto: 'Nuevo plato' },
    { id: 'carrito', texto: 'Carrito' },
    { id: 'pedidos', texto: 'Pedidos' },
    { id: 'asistente', texto: 'Asistente' },
    { id: 'contacto', texto: 'Contacto' },
  ];

  const textoBusqueda = normalizarBusqueda(busquedaMenu.trim());
  const platosVisibles = catalogo.filter((plato) => {
    const coincideFavorito = !soloFavoritos || favoritos.includes(plato.id);
    const coincideCategoria = categoriaMenu === 'Todos' || plato.categoria === categoriaMenu;
    const textoPlato = normalizarBusqueda(`${plato.nombre} ${plato.descripcion} ${plato.precio}`);
    const coincideBusqueda = !textoBusqueda || textoPlato.includes(textoBusqueda);
    return coincideFavorito && coincideCategoria && coincideBusqueda;
  });

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
        const [platosGuardados, carritoGuardado, fotosGuardadas, pedidosGuardados] = await Promise.all([
          AsyncStorage.getItem(CLAVE_PLATOS_NUEVOS),
          AsyncStorage.getItem(CLAVE_CARRITO),
          AsyncStorage.getItem(CLAVE_FOTOS_PLATOS),
          AsyncStorage.getItem(CLAVE_PEDIDOS),
        ]);
        const menuLocal = platosGuardados ? JSON.parse(platosGuardados) : [];
        const carritoLocal = carritoGuardado ? JSON.parse(carritoGuardado) : {};
        const fotosLocales = fotosGuardadas ? JSON.parse(fotosGuardadas) : {};
        const pedidosLocales = pedidosGuardados ? JSON.parse(pedidosGuardados) : [];
        if (!Array.isArray(menuLocal) || !carritoLocal || typeof carritoLocal !== 'object' || !fotosLocales || typeof fotosLocales !== 'object' || Array.isArray(fotosLocales) || !Array.isArray(pedidosLocales)) {
          throw new Error('Datos locales con formato inválido');
        }
        if (activo) {
          setPlatosNuevos(menuLocal);
          setCarrito(carritoLocal);
          setImagenesPlatos(fotosLocales);
          setPedidos(pedidosLocales);
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
    AsyncStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos)).catch(() => {
      setEstadoFavoritos('No se pudo guardar el historial de pedidos.');
    });
  }, [datosLocalesListos, platosNuevos, carrito, pedidos]);

  function confirmarPedidoLocal(pedido) {
    setPedidos((actuales) => [pedido, ...actuales]);
    setCarrito({});
  }

  useEffect(() => {
    if (!datosLocalesListos) return;
    if (animacionCarritoLista.current && cantidadCarrito > cantidadCarritoAnterior.current) {
      const usarDriverNativo = Platform.OS !== 'web';
      Animated.sequence([
        Animated.timing(escalaIconoCarrito, { toValue: 1.3, duration: 130, useNativeDriver: usarDriverNativo }),
        Animated.spring(escalaIconoCarrito, { toValue: 1, useNativeDriver: usarDriverNativo, friction: 4 }),
      ]).start();
    }
    cantidadCarritoAnterior.current = cantidadCarrito;
    animacionCarritoLista.current = true;
  }, [cantidadCarrito, datosLocalesListos, escalaIconoCarrito]);

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
      <View style={styles.barraSuperior}>
        <Pressable accessibilityRole="button" accessibilityLabel={menuAbierto ? 'Cerrar navegación' : 'Abrir navegación'} style={styles.botonMenu} onPress={() => setMenuAbierto((abierto) => !abierto)}>
          <Text style={styles.iconoMenu}>{menuAbierto ? '×' : '☰'}</Text>
        </Pressable>
        {width < 600 && <Text numberOfLines={1} style={styles.marcaMovil}>RESTAURANTE <Text style={styles.marcaDorada}>EL SABOR</Text></Text>}
        {cantidadCarrito > 0 && (
          <Animated.View style={{ marginLeft: 'auto', transform: [{ scale: escalaIconoCarrito }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir carrito, ${cantidadCarrito} productos`}
              hitSlop={8}
              style={styles.botonCarritoSuperior}
              onPress={() => { setPestana('carrito'); setMenuAbierto(false); }}
            >
              <Text style={styles.iconoCarritoSuperior}>🛒</Text>
              <View style={styles.contadorCarritoSuperior}>
                <Text style={styles.textoContadorCarrito}>{cantidadCarrito > 99 ? '99+' : cantidadCarrito}</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {menuAbierto && <View style={styles.capaMenu}>
        <Pressable style={styles.fondoMenu} accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setMenuAbierto(false)} />
        <View style={styles.panelMenu}>
          <Text style={styles.logoMenu}>RESTAURANTE <Text style={styles.marcaDorada}>EL SABOR</Text></Text>
          {definicionesPestanas.map((elemento) => (
            <Pressable key={elemento.id} accessibilityRole="button" accessibilityLabel={elemento.id === 'carrito' ? `Carrito, ${cantidadCarrito} productos` : elemento.texto} style={[styles.itemMenu, pestana === elemento.id && styles.itemMenuActivo]} onPress={() => { setPestana(elemento.id); setMenuAbierto(false); }}>
              <View style={styles.itemMenuContenido}>
                <Text style={[styles.itemMenuTexto, pestana === elemento.id && styles.itemMenuTextoActivo]}>{elemento.id === 'inicio' ? '⌂' : elemento.id === 'menu' ? '♨' : elemento.id === 'sensores' ? '⌁' : elemento.id === 'nuevo' ? '+' : elemento.id === 'carrito' ? (cantidadCarrito > 0 ? '🛒' : '') : elemento.id === 'pedidos' ? '▤' : elemento.id === 'asistente' ? '✦' : '☎'}  {elemento.texto}</Text>
                {elemento.id === 'carrito' && cantidadCarrito > 0 && (
                  <View style={styles.contadorCarrito}>
                    <Text style={styles.textoContadorCarrito}>{cantidadCarrito > 99 ? '99+' : cantidadCarrito}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>}

      {pestana === 'inicio' && <PantallaInicio cantidad={catalogo.length} onExplorar={() => setPestana('menu')} />}

      {pestana !== 'inicio' && pestana !== 'contacto' && <View style={styles.tituloSeccion}><Text style={styles.tituloSeccionTexto}>{pestana === 'menu' ? 'Nuestro menú' : pestana === 'sensores' ? 'Experiencia' : pestana === 'nuevo' ? 'Nuevo platillo' : pestana === 'carrito' ? 'Tu pedido' : pestana === 'pedidos' ? 'Mis pedidos' : 'Asistente'}</Text></View>}

      {pestana === 'menu' && <View style={styles.filtrosMenu}>
        <TextInput
          value={busquedaMenu}
          onChangeText={setBusquedaMenu}
          placeholder="Buscar plato o ingrediente..."
          placeholderTextColor="#8C7049"
          accessibilityLabel="Buscar en el menú"
          returnKeyType="search"
          style={styles.campoBusqueda}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriasMenu}>
          {categoriasMenu.map((categoria) => (
            <Pressable
              key={categoria}
              accessibilityRole="button"
              accessibilityState={{ selected: categoriaMenu === categoria }}
              onPress={() => setCategoriaMenu(categoria)}
              style={[styles.chipCategoria, categoriaMenu === categoria && styles.chipCategoriaActivo]}
            >
              <Text style={[styles.textoChipCategoria, categoriaMenu === categoria && styles.textoChipCategoriaActivo]}>{categoria}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.notaAlergenos}>Las descripciones resumen algunos ingredientes. Alérgenos y disponibilidad deben confirmarse con el personal antes de ordenar.</Text>
      </View>}

      {pestana === 'menu' && favoritos.length > 0 && <View style={[styles.resumenFavoritos, resumenCompacto && styles.resumenFavoritosCompacto]}>
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

      {pestana === 'menu' && <PantallaAdaptativa items={platosVisibles} totalProductos={catalogo.length} soloFavoritos={soloFavoritos} favoritos={favoritos} favoritosListos={favoritosListos} guardandoId={guardandoId} carrito={carrito} imagenesPlatos={imagenesPlatos} onAgregarCarrito={agregarAlCarrito} onLimpiarFiltros={() => { setBusquedaMenu(''); setCategoriaMenu('Todos'); setSoloFavoritos(false); }} onAlternarFavorito={alternarFavorito} />}
      {pestana === 'sensores' && <PantallaSensores />}
      {pestana === 'nuevo' && <NuevoPlatilloCamara onCerrar={() => setPestana('menu')} onGuardar={guardarPlatoNuevo} />}
      {pestana === 'carrito' && <PantallaCarrito productos={catalogo} carrito={carrito} onCambiarCantidad={agregarAlCarrito} onConfirmarPedido={confirmarPedidoLocal} onVolverMenu={() => setPestana('menu')} />}
      {pestana === 'pedidos' && <PantallaPedidos pedidos={pedidos} onVolverMenu={() => setPestana('menu')} />}
      {pestana === 'asistente' && <AsistenteIA productos={catalogo} />}
      {pestana === 'contacto' && <PantallaContacto />}

    </View>
  );
}

function PantallaInicio({ cantidad, onExplorar }) {
  const { width } = useWindowDimensions();
  let tamanoTitulo = 34;
  if (width >= 900) tamanoTitulo = 60;
  else if (width >= 600) tamanoTitulo = 46;
  return <View style={styles.portada}>
    <Text style={[styles.tituloPortada, { fontSize: tamanoTitulo }]}>RESTAURANTE <Text style={styles.ampersand}>EL SABOR</Text></Text>
    <View style={styles.adornito}><View style={styles.lineaAdorno} /><Text style={styles.hoja}>❧</Text><View style={styles.lineaAdorno} /></View>
    <Text style={styles.subtituloPortada}>Tradición, sabor y calidad en cada plato</Text>
    <Pressable accessibilityRole="button" style={styles.botonExplorar} onPress={onExplorar}><Text style={styles.textoBotonExplorar}>EXPLORAR MENÚ  <Text style={styles.flechaDorada}>➜</Text></Text></Pressable>
    <Text style={styles.detallePortada}>{cantidad} preparaciones de nuestra cocina</Text>
  </View>;
}

function PantallaContacto() {
  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelContacto}>
      <Text style={styles.tituloSeccionTexto}>Visítanos</Text>
      <Text style={styles.aviso}>Aquí encontrarás cómo comunicarte con Restaurante El Sabor y consultar sus horarios.</Text>
      <View style={styles.tarjetaContacto}>
        <Text style={styles.tituloContacto}>📍 Dirección</Text>
        <Text style={styles.datoContacto}>{datosRestaurante.direccion}</Text>
      </View>
      <View style={styles.tarjetaContacto}>
        <Text style={styles.tituloContacto}>☎ Teléfono / WhatsApp</Text>
        <Text style={styles.datoContacto}>{datosRestaurante.telefono}</Text>
      </View>
      <View style={styles.tarjetaContacto}>
        <Text style={styles.tituloContacto}>◷ Horario de atención</Text>
        <Text style={styles.datoContacto}>{datosRestaurante.horario}</Text>
      </View>
      <View style={styles.avisoDatosDemo}>
        <Text style={styles.avisoDatosDemoTexto}>Estos datos son ficticios para la demostración. Confirma la dirección, el teléfono y el horario reales antes de publicar.</Text>
      </View>
    </ScrollView>
  );
}

function PantallaPedidos({ pedidos, onVolverMenu }) {
  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelSensor}>
      <Text style={styles.aviso}>Historial guardado en este dispositivo. Los pedidos son demostrativos y no llegan al restaurante.</Text>
      {pedidos.length === 0 ? (
        <View style={styles.vacioFavoritos}>
          <Text style={styles.tituloVacioFavoritos}>Aún no hay pedidos</Text>
          <Text style={styles.textoVacioFavoritos}>Cuando confirmes un pedido de demostración, aparecerá aquí.</Text>
          <Pressable accessibilityRole="button" onPress={onVolverMenu} style={styles.botonVacioFavoritos}><Text style={styles.textoBotonVacioFavoritos}>Explorar menú</Text></Pressable>
        </View>
      ) : pedidos.map((pedido) => (
        <View key={pedido.codigo} style={styles.tarjetaPedido}>
          <Text style={styles.tituloPedido}>Pedido #{pedido.codigo}</Text>
          <Text style={styles.textoPedido}>{pedido.nombre} · {pedido.tipo === 'mesa' ? `Mesa ${pedido.mesa}` : 'Para llevar'}</Text>
          <Text style={styles.estadoPedido}>Estado: {pedido.estado || 'Recibido (demostración)'}</Text>
          {(pedido.productos || []).map((producto, indice) => <Text key={`${pedido.codigo}-${indice}`} style={styles.textoPedido}>{producto.cantidad} × {producto.nombre} · {producto.precio}</Text>)}
          <Text style={styles.totalConfirmacionPedido}>Total estimado: ${Number(pedido.total || 0).toLocaleString('es-CO')}</Text>
          <Text style={styles.notaAlergenos}>Pago: {pedido.metodoPago || 'No seleccionado'} (sin cobro real)</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Catálogo único: FlatList optimizado y columnas adaptadas al ancho disponible.
function PantallaAdaptativa({ items, totalProductos, soloFavoritos, favoritos, favoritosListos, guardandoId, carrito, imagenesPlatos, onAgregarCarrito, onLimpiarFiltros, onAlternarFavorito }) {
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
  if (items.length === 0 && soloFavoritos && favoritos.length === 0) {
    contenidoVacio = <ListaFavoritosVacia onMostrarTodos={onLimpiarFiltros} />;
  } else if (items.length === 0) {
    contenidoVacio = <ListaMenuVacia onLimpiarFiltros={onLimpiarFiltros} />;
  }

  return (
    <View style={styles.pantallaAdaptativa}>
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
        ListFooterComponent={(
          <View style={[styles.resumen, styles.resumenFooter, esTableta && styles.resumenGrande]}>
            <Text style={styles.tituloResumen}>Resumen del catálogo</Text>
            <Text style={styles.datoResumen}>Platos: {totalProductos}</Text>
            <Text style={styles.datoResumen}>Resultados: {items.length}</Text>
            {soloFavoritos && <Text style={styles.datoResumen}>Favoritos mostrados: {items.length}</Text>}
            <Text style={styles.datoResumen}>Dispositivo: {tipoDispositivo}</Text>
            <Text style={styles.datoResumen}>Columnas: {columnas}</Text>
          </View>
        )}
        columnWrapperStyle={columnas > 1 ? styles.fila : undefined}
        renderItem={({ item, index }) => (
          <Tarjeta
            plato={item}
            etiqueta={item.categoria || 'Nuevo'}
            colorBorde={index % 2 === 0 ? '#68845A' : '#6D4C1B'}
            adaptativa={columnas > 1}
            optimizada
            esFavorito={favoritos.includes(item.id)}
            favoritosListos={favoritosListos}
            guardandoId={guardandoId}
            cantidadCarrito={carrito[item.id] || 0}
            fotoUri={imagenesPlatos[item.id] || item.fotoUri}
            onAgregarCarrito={onAgregarCarrito}
            onAlternarFavorito={onAlternarFavorito}
          />
        )}
      />
    </View>
  );
}

function ListaMenuVacia({ onLimpiarFiltros }) {
  return (
    <View style={styles.vacioFavoritos}>
      <Text style={styles.tituloVacioFavoritos}>No encontramos platos</Text>
      <Text style={styles.textoVacioFavoritos}>Prueba con otra búsqueda o selecciona otra categoría.</Text>
      <Pressable accessibilityRole="button" onPress={onLimpiarFiltros} style={styles.botonVacioFavoritos}>
        <Text style={styles.textoBotonVacioFavoritos}>Limpiar filtros</Text>
      </Pressable>
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
  const ultimoAvisoMeseroRef = useRef(0);
  const orientacionHorizontalDesdeRef = useRef(null);
  const puedeLlamarPorGiroRef = useRef(false);
  const llamadoEnHorizontalRef = useRef(false);
  const [mensajeMesero, setMensajeMesero] = useState('El llamado se registra solo en esta pantalla.');
  const [llamadoVisible, setLlamadoVisible] = useState(false);
  const [datos, setDatos] = useState({ x: 0, y: 0, z: 0 });
  const [simulados, setSimulados] = useState({ x: 0, y: 0, z: 1 });
  const [modo, setModo] = useState('simulacion');
  const [sensorActivo, setSensorActivo] = useState(false);
  const [estado, setEstado] = useState('Simulación: sin sensor físico');

  function registrarLlamado(mensaje) {
    ultimoAvisoMeseroRef.current = Date.now();
    setMensajeMesero(mensaje);
    setLlamadoVisible(true);
  }

  useEffect(() => {
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
      orientacionHorizontalDesdeRef.current = null;
      puedeLlamarPorGiroRef.current = false;
      llamadoEnHorizontalRef.current = false;
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
          const ahora = Date.now();
          const estaVertical = Math.abs(lectura.y) >= 0.7 && Math.abs(lectura.x) <= 0.55 && Math.abs(lectura.z) <= 0.65;
          const estaHorizontal = Math.abs(lectura.x) >= 0.7 && Math.abs(lectura.y) <= 0.55 && Math.abs(lectura.z) <= 0.65;

          if (estaVertical) {
            // El teléfono debe empezar vertical; regresar a vertical rearma el gesto.
            puedeLlamarPorGiroRef.current = true;
            orientacionHorizontalDesdeRef.current = null;
            llamadoEnHorizontalRef.current = false;
          } else if (estaHorizontal && puedeLlamarPorGiroRef.current) {
            if (orientacionHorizontalDesdeRef.current === null) {
              orientacionHorizontalDesdeRef.current = ahora;
            } else if (!llamadoEnHorizontalRef.current && ahora - orientacionHorizontalDesdeRef.current >= 600) {
              llamadoEnHorizontalRef.current = true;
              if (ahora - ultimoAvisoMeseroRef.current >= 10000) {
                registrarLlamado('Giro a posición horizontal: llamado registrado en la aplicación. Avisa al personal; no se envió una notificación al restaurante.');
              }
            }
          } else {
            orientacionHorizontalDesdeRef.current = null;
          }
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
  }, [modo, sensorActivo]);

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
    orientacionHorizontalDesdeRef.current = null;
    puedeLlamarPorGiroRef.current = false;
    llamadoEnHorizontalRef.current = false;
  }

  function simularGiroHorizontal() {
    setSimulados({ x: 0.85, y: 0.1, z: 0.1 });
    registrarLlamado('Giro horizontal simulado: llamado registrado en la aplicación. No se envió una notificación al restaurante.');
  }

  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelSensor}>
      <Text style={styles.tituloResumen}>Mi app siente el movimiento</Text>
      <Text style={styles.aviso}>
        El acelerómetro alimenta esta pantalla: el eje X muestra la inclinación lateral y, al girar el teléfono de vertical a horizontal, registra el llamado al mesero. En web se usa simulación.
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

      <View style={styles.tarjetaMesero}>
        <Text style={styles.nombre}>Llamar al mesero con movimiento</Text>
        <Text style={styles.aviso}>Activa el sensor, sostén el teléfono vertical y gíralo a horizontal durante medio segundo. El llamado usa las mismas lecturas que ves arriba. Regresa a vertical y espera 10 segundos para repetirlo.</Text>
        {llamadoVisible ? (
          <View style={styles.confirmacionMesero} accessibilityLiveRegion="polite">
            <Text style={styles.iconoConfirmacionMesero}>🔔</Text>
            <View style={styles.textoConfirmacionMesero}>
              <Text style={styles.tituloConfirmacionMesero}>Llamado registrado</Text>
              <Text style={styles.mensajeMesero}>{mensajeMesero}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.mensajeMesero} accessibilityLiveRegion="polite">{mensajeMesero}</Text>
        )}
        {modo === 'simulacion' && (
          <Pressable accessibilityRole="button" accessibilityLabel="Simular giro horizontal para llamar al mesero" style={styles.botonMesero} onPress={simularGiroHorizontal}>
            <Text style={styles.textoControl}>Simular giro horizontal</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Registrar un llamado manual al mesero" style={styles.boton} onPress={() => registrarLlamado('Llamado manual registrado en esta pantalla. Avisa al personal; no se envió una notificación externa.')}>
          <Text style={styles.textoControl}>Llamar manualmente</Text>
        </Pressable>
      </View>

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


function PantallaCarrito({ productos, carrito, onCambiarCantidad, onConfirmarPedido, onVolverMenu }) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [numeroMesa, setNumeroMesa] = useState('');
  const [tipoPedido, setTipoPedido] = useState('mesa');
  const [metodoPago, setMetodoPago] = useState('en caja');
  const [notaPedido, setNotaPedido] = useState('');
  const [errorPedido, setErrorPedido] = useState('');
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const { width } = useWindowDimensions();
  const seleccionados = productos.filter((producto) => carrito[producto.id] > 0);
  const total = seleccionados.reduce((suma, producto) => suma + parseInt(String(producto.precio).replace(/[^0-9]/g, ''), 10) * carrito[producto.id], 0);

  function confirmarPedido() {
    if (seleccionados.length === 0) {
      setErrorPedido('Agrega al menos un plato antes de confirmar el pedido.');
      return;
    }
    if (!nombreCliente.trim()) {
      setErrorPedido('Escribe el nombre de quien realiza el pedido.');
      return;
    }
    if (tipoPedido === 'mesa' && !numeroMesa.trim()) {
      setErrorPedido('Indica el número de mesa para el servicio en el restaurante.');
      return;
    }

    const nuevoPedido = {
      codigo: String(Date.now()).slice(-6),
      nombre: nombreCliente.trim(),
      tipo: tipoPedido,
      mesa: tipoPedido === 'mesa' ? numeroMesa.trim() : '',
      metodoPago,
      nota: notaPedido.trim(),
      estado: 'Recibido (demostración)',
      fecha: new Date().toISOString(),
      productos: seleccionados.map((producto) => ({
        nombre: producto.nombre,
        cantidad: carrito[producto.id],
        precio: producto.precio,
      })),
      total,
    };
    setPedidoConfirmado(nuevoPedido);
    setErrorPedido('');
    onConfirmarPedido(nuevoPedido);
  }

  if (pedidoConfirmado) {
    return (
      <ScrollView style={styles.lista} contentContainerStyle={styles.panelSensor}>
        <View style={styles.confirmacionPedido}>
          <Text style={styles.iconoConfirmacionPedido}>🍽️</Text>
          <Text style={styles.tituloConfirmacionPedido}>Pedido confirmado en esta pantalla</Text>
          <Text style={styles.textoConfirmacionPedido}>Número de pedido: #{pedidoConfirmado.codigo}</Text>
          <Text style={styles.textoConfirmacionPedido}>Nombre: {pedidoConfirmado.nombre}</Text>
          <Text style={styles.textoConfirmacionPedido}>{pedidoConfirmado.tipo === 'mesa' ? `Servicio en mesa ${pedidoConfirmado.mesa}` : 'Pedido para llevar'}</Text>
          <Text style={styles.textoConfirmacionPedido}>Pago elegido: {pedidoConfirmado.metodoPago} (demostración)</Text>
          {!!pedidoConfirmado.nota && <Text style={styles.textoConfirmacionPedido}>Nota: {pedidoConfirmado.nota}</Text>}
          <View style={styles.lineaConfirmacionPedido} />
          {pedidoConfirmado.productos.map((producto, indice) => (
            <Text key={`${producto.nombre}-${indice}`} style={styles.textoConfirmacionPedido}>
              {producto.cantidad} × {producto.nombre} · {producto.precio}
            </Text>
          ))}
          <Text style={styles.totalConfirmacionPedido}>Total estimado: ${pedidoConfirmado.total.toLocaleString('es-CO')}</Text>
          <Text style={styles.aviso}>Demostración: el pedido no se envía al restaurante y no se realiza ningún cobro.</Text>
          <Pressable accessibilityRole="button" onPress={onVolverMenu} style={styles.botonPagar}>
            <Text style={styles.textoBotonPagar}>Volver al menú</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelSensor} keyboardShouldPersistTaps="handled">
      <Text style={styles.tituloResumen}>Tu carrito</Text>
      <Text style={styles.aviso}>Revisa los platos, elige cómo recibir el pedido y confirma. Esta demostración no cobra ni envía pedidos al restaurante.</Text>
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
      {seleccionados.length > 0 && <View style={styles.formularioPedido}>
        <Text style={styles.tituloFormularioPedido}>Datos para el pedido</Text>
        <Text style={styles.labelFormularioPedido}>Nombre</Text>
        <TextInput
          value={nombreCliente}
          onChangeText={(texto) => { setNombreCliente(texto); setErrorPedido(''); }}
          placeholder="Nombre de quien ordena"
          placeholderTextColor="#8C7049"
          accessibilityLabel="Nombre de quien realiza el pedido"
          style={styles.entradaPedido}
          maxLength={60}
        />
        <Text style={styles.labelFormularioPedido}>¿Cómo recibirás tu pedido?</Text>
        <View style={[styles.opcionesPedido, width >= 650 && styles.opcionesPedidoAmplias]}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: tipoPedido === 'mesa' }} onPress={() => { setTipoPedido('mesa'); setErrorPedido(''); }} style={[styles.opcionPedido, tipoPedido === 'mesa' && styles.opcionPedidoActiva]}>
            <Text style={[styles.textoOpcionPedido, tipoPedido === 'mesa' && styles.textoOpcionPedidoActivo]}>En una mesa</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: tipoPedido === 'llevar' }} onPress={() => { setTipoPedido('llevar'); setErrorPedido(''); }} style={[styles.opcionPedido, tipoPedido === 'llevar' && styles.opcionPedidoActiva]}>
            <Text style={[styles.textoOpcionPedido, tipoPedido === 'llevar' && styles.textoOpcionPedidoActivo]}>Para llevar</Text>
          </Pressable>
        </View>
        {tipoPedido === 'mesa' && <>
          <Text style={styles.labelFormularioPedido}>Número de mesa</Text>
          <TextInput
            value={numeroMesa}
            onChangeText={(texto) => { setNumeroMesa(texto.replace(/[^0-9]/g, '')); setErrorPedido(''); }}
            placeholder="Ejemplo: 4"
            placeholderTextColor="#8C7049"
            accessibilityLabel="Número de mesa"
            keyboardType="numeric"
            style={styles.entradaPedido}
            maxLength={3}
          />
        </>}
        <Text style={styles.labelFormularioPedido}>Forma de pago (solo demostración)</Text>
        <View style={[styles.opcionesPedido, width >= 650 && styles.opcionesPedidoAmplias]}>
          {['en caja', 'al recibir'].map((opcion) => (
            <Pressable key={opcion} accessibilityRole="button" accessibilityState={{ selected: metodoPago === opcion }} onPress={() => setMetodoPago(opcion)} style={[styles.opcionPedido, metodoPago === opcion && styles.opcionPedidoActiva]}>
              <Text style={[styles.textoOpcionPedido, metodoPago === opcion && styles.textoOpcionPedidoActivo]}>{opcion === 'en caja' ? 'Pagar en caja' : 'Pagar al recibir'}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.labelFormularioPedido}>Nota para cocina (opcional)</Text>
        <TextInput value={notaPedido} onChangeText={setNotaPedido} placeholder="Ej.: sin salsa" placeholderTextColor="#8C7049" accessibilityLabel="Nota opcional para el pedido" style={styles.entradaPedido} maxLength={160} />
        {!!errorPedido && <Text accessibilityLiveRegion="polite" style={styles.errorPedido}>{errorPedido}</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel={`Confirmar pedido de ${total.toLocaleString('es-CO')} pesos, demostración`} onPress={confirmarPedido} style={styles.botonPagar}>
          <Text style={styles.textoBotonPagar}>Confirmar pedido (demostración)</Text>
        </Pressable>
      </View>}
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
  fotoUri,
  onAgregarCarrito,
  onAlternarFavorito,
}) {
  const imagenVisible = fotoUri || plato.fotoUri || plato.foto;
  const fuenteImagen = typeof imagenVisible === 'string'
    ? { uri: imagenVisible }
    : imagenVisible;
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
      {imagenVisible
        ? <Image source={fuenteImagen} style={styles.fotoPlato} resizeMode="cover" />
        : <View style={styles.fotoPendiente}><Text style={styles.textoFotoPendiente}>Imagen de {plato.nombre} pendiente</Text></View>}
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
  barraSuperior: { height: 76, paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#251309', zIndex: 3 },
  botonMenu: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#805600', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D190B' },
  botonCarritoSuperior: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#805600', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D190B' },
  iconoCarritoSuperior: { fontSize: 22 },
  contadorCarritoSuperior: { position: 'absolute', top: -4, right: -4, minWidth: 21, height: 21, paddingHorizontal: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3B900', borderWidth: 1, borderColor: '#241207' },
  iconoMenu: { color: '#F3B900', fontSize: 22, fontWeight: '700' },
  marcaMovil: { flexShrink: 1, color: '#F2E6C9', fontFamily: 'serif', fontWeight: '700', fontSize: 20 },
  marcaDorada: { color: '#F3B900' },
  capaMenu: { ...StyleSheet.absoluteFillObject, zIndex: 20, flexDirection: 'row' },
  fondoMenu: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.58)' },
  panelMenu: { width: 300, maxWidth: '82%', height: '100%', paddingTop: 26, paddingHorizontal: 22, backgroundColor: '#241207', borderRightWidth: 1, borderColor: '#50320D', elevation: 12 },
  logoMenu: { color: '#F2E6C9', fontFamily: 'serif', fontSize: 19, fontWeight: '700', marginBottom: 28, paddingHorizontal: 8 },
  itemMenu: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 14, marginBottom: 7, borderRadius: 12 },
  itemMenuContenido: { flex: 1, justifyContent: 'center', position: 'relative' },
  itemMenuActivo: { backgroundColor: '#38220E', borderLeftWidth: 2, borderLeftColor: '#F3B900' },
  itemMenuTexto: { color: '#D8BD91', fontSize: 15, fontWeight: '600' },
  itemMenuTextoActivo: { color: '#F3B900' },
  contadorCarrito: { position: 'absolute', top: -8, right: 0, minWidth: 21, height: 21, paddingHorizontal: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3B900', borderWidth: 1, borderColor: '#241207' },
  textoContadorCarrito: { color: '#241207', fontSize: 11, fontWeight: '800' },
  portada: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#28160C' },
  tituloPortada: { color: '#F2E6C9', fontFamily: 'serif', fontSize: 60, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  ampersand: { color: '#F3B900', fontStyle: 'italic' },
  adornito: { flexDirection: 'row', alignItems: 'center', gap: 14, width: 360, maxWidth: '80%', marginTop: 14 },
  lineaAdorno: { flex: 1, height: 1, backgroundColor: '#63400F' },
  hoja: { color: '#55A95B', fontSize: 19 },
  subtituloPortada: { marginTop: 28, color: '#C7A978', fontSize: 16, letterSpacing: 2, textAlign: 'center' },
  botonExplorar: { marginTop: 48, minHeight: 56, minWidth: 250, paddingHorizontal: 28, borderRadius: 30, borderWidth: 1, borderColor: '#B98600', alignItems: 'center', justifyContent: 'center', backgroundColor: '#301B0D' },
  textoBotonExplorar: { color: '#F2E6C9', fontWeight: '800', letterSpacing: 1 },
  flechaDorada: { color: '#F3B900', fontSize: 18 },
  detallePortada: { color: '#8C7049', fontSize: 12, marginTop: 22 },
  tituloSeccion: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 8, backgroundColor: '#28160C' },
  tituloSeccionTexto: { color: '#F2E6C9', fontFamily: 'serif', fontSize: 25, fontWeight: '700' },
  panelContacto: { flex: 1, padding: 24, gap: 14, backgroundColor: '#28160C' },
  tarjetaContacto: { padding: 16, gap: 6, borderRadius: 12, backgroundColor: '#38220E', borderWidth: 1, borderColor: '#63400F' },
  tituloContacto: { color: '#F3B900', fontSize: 15, fontWeight: '800' },
  datoContacto: { color: '#F2E6C9', fontSize: 16 },
  avisoDatosDemo: { padding: 14, borderRadius: 10, backgroundColor: '#493016', borderWidth: 1, borderColor: '#805600' },
  avisoDatosDemoTexto: { color: '#F2E6C9', lineHeight: 21 },
  tarjetaPedido: { padding: 16, marginTop: 12, gap: 7, borderRadius: 12, backgroundColor: '#38220E', borderWidth: 1, borderColor: '#63400F' },
  tituloPedido: { color: '#F3B900', fontSize: 18, fontWeight: '800' },
  textoPedido: { color: '#E8D5B1', lineHeight: 20 },
  estadoPedido: { color: '#B7D5A4', fontWeight: '800', marginVertical: 3 },
  notaContacto: { color: '#C7A978', lineHeight: 20, marginTop: 4 },
  container: {
    flex: 1,
    backgroundColor: '#28160C',
  },
  encabezado: {
    backgroundColor: '#251309',
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
    color: '#F2E6C9',
  },
  subtitulo: {
    fontSize: 15,
    color: '#C7A978',
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
    backgroundColor: '#38220E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pestanaCompacta: { flexBasis: '46%', flexGrow: 1, flexShrink: 0 },
  botonAsistente: { minHeight: 44, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#E0EDF3' },
  textoBotonAsistente: { color: '#15334E', fontWeight: '700' },
  pestanaActiva: {
    backgroundColor: '#8A6500',
    elevation: 3,
  },
  textoPestana: {
    color: '#D8BD91',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textoPestanaActivo: {
    color: '#38220E',
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
    backgroundColor: '#38220E',
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    gap: 5,
    elevation: 2,
  },
  resumenFooter: { marginTop: 18, marginBottom: 28 },
  resumenGrande: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 12,
  },
  tituloResumen: {
    color: '#F2E6C9',
    fontWeight: 'bold',
    fontSize: 17,
    marginRight: 8,
  },
  datoResumen: {
    color: '#C7A978',
    fontSize: 14,
  },
  tarjeta: {
    marginTop: 12,
    marginHorizontal: 4,
    padding: 15,
    backgroundColor: '#38220E',
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
    color: '#F2E6C9',
  },
  descripcion: {
    color: '#C7A978',
    marginTop: 6,
    fontSize: 13,
  },
  precio: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 9,
    color: '#F3B900',
  },
  filtrosMenu: { marginHorizontal: 16, marginBottom: 8, padding: 12, gap: 10, borderRadius: 12, backgroundColor: '#38220E' },
  campoBusqueda: { minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: '#805600', borderRadius: 9, backgroundColor: '#241207', color: '#F2E6C9', fontSize: 16 },
  categoriasMenu: { gap: 8, paddingRight: 4 },
  chipCategoria: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#805600', backgroundColor: '#2D190B' },
  chipCategoriaActivo: { backgroundColor: '#F3B900', borderColor: '#F3B900' },
  textoChipCategoria: { color: '#E8D5B1', fontWeight: '700', fontSize: 13 },
  textoChipCategoriaActivo: { color: '#241207' },
  notaAlergenos: { color: '#C7A978', fontSize: 12, lineHeight: 18 },
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
    backgroundColor: '#38220E',
    elevation: 1,
  },
  resumenFavoritosCompacto: { alignItems: 'stretch' },
  textoResumenFavoritos: { flex: 1, minWidth: 150, paddingRight: 8 },
  tituloFavoritos: { color: '#F2E6C9', fontWeight: '700' },
  estadoFavoritos: { color: '#C7A978', fontSize: 12, marginTop: 3 },
  botonVerFavoritos: { minHeight: 44, justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#493016' },
  textoVerFavoritos: { color: '#F3B900', fontWeight: '700', fontSize: 12 },
  botonEliminarFavoritos: { minHeight: 44, justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#493016' },
  textoEliminarFavoritos: { color: '#E8D5B1', fontWeight: '700', fontSize: 12 },
  botonFavorito: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#493016' },
  botonFavoritoActivo: { backgroundColor: '#8A6500' },
  fotoPlato: { width: '100%', height: 130, borderRadius: 10, marginBottom: 10 },
  fotoPendiente: { width: '100%', height: 90, marginBottom: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#493016', borderWidth: 1, borderColor: '#63400F' },
  textoFotoPendiente: { color: '#C7A978', fontSize: 12, textAlign: 'center' },
  botonCarrito: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#493016' },
  textoBotonCarrito: { color: '#F3B900', fontWeight: '700', fontSize: 12 },
  tarjetaMesero: { padding: 14, borderRadius: 12, backgroundColor: '#38220E', gap: 9 },
  confirmacionMesero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, backgroundColor: '#435138', borderWidth: 1, borderColor: '#68845A' },
  iconoConfirmacionMesero: { fontSize: 32 },
  textoConfirmacionMesero: { flex: 1, minWidth: 0, gap: 4 },
  tituloConfirmacionMesero: { color: '#F2E6C9', fontSize: 16, fontWeight: '800' },
  mensajeMesero: { color: '#F2E6C9', fontWeight: '700', lineHeight: 20 },
  aviso: { color: '#C7A978', lineHeight: 21, marginVertical: 6 },
  telefonoContacto: { color: '#F3B900', fontSize: 17, fontWeight: '700', marginTop: 12 },
  botonMesero: { minHeight: 46, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: '#8A6500' },
  itemCarrito: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginTop: 10, borderRadius: 12, backgroundColor: '#38220E' },
  formularioPedido: { marginTop: 16, padding: 16, gap: 10, borderRadius: 12, backgroundColor: '#38220E', borderWidth: 1, borderColor: '#63400F' },
  tituloFormularioPedido: { color: '#F2E6C9', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  labelFormularioPedido: { color: '#F3B900', fontWeight: '700', marginTop: 4 },
  entradaPedido: { minHeight: 48, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: '#805600', backgroundColor: '#F2E6C9', color: '#241207', fontSize: 16 },
  opcionesPedido: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcionesPedidoAmplias: { flexWrap: 'nowrap' },
  opcionPedido: { flex: 1, minWidth: 120, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: '#805600', backgroundColor: '#2D190B' },
  opcionPedidoActiva: { backgroundColor: '#F3B900', borderColor: '#F3B900' },
  textoOpcionPedido: { color: '#E8D5B1', fontWeight: '700' },
  textoOpcionPedidoActivo: { color: '#241207' },
  errorPedido: { color: '#FFD3C7', padding: 10, backgroundColor: '#6D3022', borderRadius: 8, lineHeight: 20 },
  confirmacionPedido: { padding: 18, gap: 10, borderRadius: 14, backgroundColor: '#38220E', borderWidth: 1, borderColor: '#68845A' },
  iconoConfirmacionPedido: { fontSize: 38, textAlign: 'center' },
  tituloConfirmacionPedido: { color: '#F2E6C9', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  textoConfirmacionPedido: { color: '#E8D5B1', lineHeight: 21 },
  lineaConfirmacionPedido: { height: 1, backgroundColor: '#805600', marginVertical: 4 },
  totalConfirmacionPedido: { color: '#F3B900', fontSize: 18, fontWeight: '800', marginTop: 4 },
  textoItemCarrito: { flex: 1, minWidth: 0 },
  controlCantidad: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#493016' },
  controlCantidadTexto: { fontSize: 22, color: '#E8D5B1', fontWeight: '800' },
  cantidadTexto: { minWidth: 20, textAlign: 'center', fontWeight: '800', color: '#F2E6C9' },
  totalCarrito: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: '#38220E' },
  botonPagar: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#8A6500' },
  botonPagarDeshabilitado: { opacity: 0.5 },
  textoBotonPagar: { color: '#F2E6C9', fontWeight: '800' },
  estadoPago: { marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: '#493016', color: '#F2E6C9', lineHeight: 21 },
  textoBotonFavorito: { color: '#E8D5B1', fontWeight: '700', fontSize: 12 },
  textoBotonFavoritoActivo: { color: '#38220E' },
  botonDeshabilitado: { opacity: 0.5 },
  vacioFavoritos: { marginTop: 12, marginHorizontal: 4, padding: 20, backgroundColor: '#38220E', borderRadius: 14, alignItems: 'flex-start', gap: 8, elevation: 2 },
  tituloVacioFavoritos: { color: '#F2E6C9', fontSize: 17, fontWeight: '700' },
  textoVacioFavoritos: { color: '#C7A978', lineHeight: 21 },
  botonVacioFavoritos: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, marginTop: 4, borderRadius: 8, backgroundColor: '#8A6500' },
  textoBotonVacioFavoritos: { color: '#38220E', fontWeight: '700' },
  badge: {
    backgroundColor: '#8A6500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeOptimizada: {
    backgroundColor: '#6D4C1B',
  },
  badgeTexto: {
    color: '#38220E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fila: {
    gap: 8,
  },
  // Estilos compartidos por la pantalla de sensores, con la paleta del restaurante.
  boton: { paddingVertical: 12, paddingHorizontal: 14, margin: 4, borderRadius: 10, backgroundColor: '#493016' },
  textoControl: { color: '#F2E6C9', fontWeight: '700' },
  tituloResumen: { color: '#F2E6C9', fontWeight: 'bold', fontSize: 19, marginBottom: 8 },
  controlesSensor: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  botonControlSensor: { alignSelf: 'flex-start', backgroundColor: '#8A6500' },
  estadoSensor: { marginVertical: 10, color: '#F2E6C9', fontWeight: '600' },
  origen: { color: '#C7A978', marginBottom: 4 },
  lectura: { color: '#C7A978', marginTop: 4, fontSize: 16 },
  panelSensor: { padding: 16, paddingBottom: 32 },
  mensajeInclinacion: { marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: '#63400F' },
  mensajeCentro: { backgroundColor: '#435138' },
  mensajeInclinado: { backgroundColor: '#493016' },
  mensajeInclinacionTitulo: { color: '#F2E6C9', fontWeight: '700' },
  mensajeInclinacionTexto: { color: '#C7A978', marginTop: 4 },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16, padding: 12, borderRadius: 12, backgroundColor: '#38220E' },
  etiquetaNivel: { color: '#C7A978', fontSize: 12 },
  zonaNivel: { flex: 1, height: 18, borderRadius: 9, backgroundColor: '#60482C' },
  zonaNivelCentro: { backgroundColor: '#435138' },
  zonaNivelActiva: { backgroundColor: '#68845A' },
  zonaNivelAlerta: { backgroundColor: '#8A6500' },
});







