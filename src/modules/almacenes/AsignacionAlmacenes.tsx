import { useState, useEffect } from "react";
import { URL_API } from "../../constants/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import useGetCobradores from "../../hooks/useGetCobradores";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { USERS_COLLECTION, CONFIG_COLLECTION } from "../../constants/collections";
import Navigation from "../../components/Navigation";

interface Usuario {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  camionetaAsignada?: number;
}

interface AlmacenAPI {
  ALMACEN_ID: number;
  ALMACEN: string;
  EXISTENCIAS: number;
}

interface AlmacenResponse {
  error: string;
  body: AlmacenAPI[];
}

interface Almacen {
  id: number;
  nombre: string;
  existencias: number;
  capacidad?: number;
  usuariosAsignados: Usuario[];
  esExcluido?: boolean;
}

const AsignacionAlmacenes = () => {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [almacenesExcluidos, setAlmacenesExcluidos] = useState<number[]>([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlmacen, setSelectedAlmacen] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showExcludedSection, setShowExcludedSection] = useState(false);
  const [modoEdicionExcluidos, setModoEdicionExcluidos] = useState(false);
  const { cobradores, isLoading: loadingCobradores } = useGetCobradores();

  useEffect(() => {
    const loadData = async () => {
      await fetchExcludedAlmacenes();
      if (!loadingCobradores) {
        await fetchAlmacenes();
      }
    };
    loadData();
  }, [loadingCobradores]);


  const fetchExcludedAlmacenes = async () => {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, "almacenes_excluidos");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAlmacenesExcluidos(data.excluidos || []);
      } else {
        // Si no existe, crear con valores por defecto
        await setDoc(docRef, { excluidos: [19] }); // 19 es ALMACEN GENERAL por defecto
        setAlmacenesExcluidos([19]);
      }
    } catch (error) {
      console.error("Error al cargar almacenes excluidos:", error);
      setAlmacenesExcluidos([19]); // Valor por defecto en caso de error
    }
  };

  const updateExcludedAlmacenes = async (newExcluidos: number[]) => {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, "almacenes_excluidos");
      await setDoc(docRef, { excluidos: newExcluidos });
      setAlmacenesExcluidos(newExcluidos);
      
      // Actualizar el estado de los almacenes
      setAlmacenes(prev => prev.map(almacen => ({
        ...almacen,
        esExcluido: newExcluidos.includes(almacen.id)
      })));
    } catch (error) {
      console.error("Error al actualizar almacenes excluidos:", error);
    }
  };

  const toggleAlmacenExcluido = async (almacenId: number) => {
    const almacen = almacenes.find(a => a.id === almacenId);
    if (!almacen) return;

    const isCurrentlyExcluded = almacenesExcluidos.includes(almacenId);
    
    if (!isCurrentlyExcluded) {
      // Si se va a excluir y tiene usuarios asignados
      if (almacen.usuariosAsignados.length > 0) {
        const confirmMessage = `El almacén "${almacen.nombre}" tiene ${almacen.usuariosAsignados.length} usuario(s) asignado(s).\n\n¿Deseas marcar este almacén como No-Camioneta?\n\nEsto desasignará automáticamente a todos los usuarios y los moverá a disponibles.`;
        if (!window.confirm(confirmMessage)) return;
        
        // Desasignar todos los usuarios del almacén
        const usuariosADesasignar = [...almacen.usuariosAsignados];
        
        // Actualizar Firebase para cada usuario
        for (const usuario of usuariosADesasignar) {
          await updateUserCamioneta(usuario.id, null);
        }
        
        // Actualizar el estado local: mover usuarios a disponibles
        setUsuariosDisponibles(prev => [
          ...prev,
          ...usuariosADesasignar.map(u => ({ ...u, camionetaAsignada: undefined }))
        ]);
        
        // Limpiar usuarios del almacén
        setAlmacenes(prev => prev.map(a => {
          if (a.id === almacenId) {
            return { ...a, usuariosAsignados: [], esExcluido: true };
          }
          return a;
        }));
      } else {
        // Si no tiene usuarios, solo confirmar
        const confirmMessage = `¿Estás seguro de marcar "${almacen.nombre}" como almacén que NO será usado como camioneta?\n\nEsto evitará que se puedan asignar usuarios a este almacén.`;
        if (!window.confirm(confirmMessage)) return;
        
        // Actualizar el estado del almacén
        setAlmacenes(prev => prev.map(a => {
          if (a.id === almacenId) {
            return { ...a, esExcluido: true };
          }
          return a;
        }));
      }
    } else {
      // Si se va a habilitar como camioneta
      const confirmMessage = `¿Deseas habilitar "${almacen.nombre}" para ser usado como camioneta?\n\nEsto permitirá asignar usuarios a este almacén.`;
      if (!window.confirm(confirmMessage)) return;
      
      // Actualizar el estado del almacén
      setAlmacenes(prev => prev.map(a => {
        if (a.id === almacenId) {
          return { ...a, esExcluido: false };
        }
        return a;
      }));
    }

    // Actualizar lista de excluidos
    const newExcluidos = isCurrentlyExcluded
      ? almacenesExcluidos.filter(id => id !== almacenId)
      : [...almacenesExcluidos, almacenId];
    
    // Guardar en Firebase
    await updateExcludedAlmacenes(newExcluidos);
    
    // Mostrar mensaje de éxito
    const successMessage = isCurrentlyExcluded 
      ? `"${almacen.nombre}" ahora puede usarse como camioneta`
      : almacen.usuariosAsignados.length > 0
        ? `"${almacen.nombre}" ha sido marcado como No-Camioneta y se desasignaron ${almacen.usuariosAsignados.length} usuario(s)`
        : `"${almacen.nombre}" ha sido marcado como almacén No-Camioneta`;
    
    setTimeout(() => alert(successMessage), 100);
  };

  const fetchAlmacenes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${URL_API}/almacenes`);
      const data: AlmacenResponse = await response.json();

      if (data.error) {
        console.error("Error de API:", data.error);
        return;
      }

      // Primero obtenemos los almacenes excluidos actuales de Firebase
      let excluidos: number[] = [];
      try {
        const docRef = doc(db, CONFIG_COLLECTION, "almacenes_excluidos");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          excluidos = data.excluidos || [];
        }
      } catch (error) {
        console.error("Error al cargar almacenes excluidos en fetchAlmacenes:", error);
        excluidos = almacenesExcluidos; // Usar el estado actual como fallback
      }

      const almacenesFormateados: Almacen[] = data.body.map((almacen) => ({
        id: almacen.ALMACEN_ID,
        nombre: almacen.ALMACEN,
        existencias: almacen.EXISTENCIAS,
        capacidad: 3,
        usuariosAsignados: [],
        esExcluido: excluidos.includes(almacen.ALMACEN_ID)
      }));

      // Si ya tenemos cobradores cargados, asignarlos directamente
      if (cobradores.length > 0) {
        const usuariosFormateados = cobradores.map((cobrador) => ({
          id: cobrador.ID,
          nombre: cobrador.NOMBRE,
          email: cobrador.EMAIL,
          telefono: cobrador.TELEFONO,
          camionetaAsignada: cobrador.CAMIONETA_ASIGNADA
        }));

        const usuariosDisponiblesTemp: Usuario[] = [];

        usuariosFormateados.forEach(usuario => {
          if (usuario.camionetaAsignada) {
            const almacenIndex = almacenesFormateados.findIndex(
              a => a.id === usuario.camionetaAsignada && !a.esExcluido
            );
            if (almacenIndex !== -1) {
              almacenesFormateados[almacenIndex].usuariosAsignados.push(usuario);
            } else {
              usuariosDisponiblesTemp.push(usuario);
            }
          } else {
            usuariosDisponiblesTemp.push(usuario);
          }
        });

        setUsuariosDisponibles(usuariosDisponiblesTemp);
      }

      setAlmacenes(almacenesFormateados);
    } catch (error) {
      console.error("Error al cargar almacenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserCamioneta = async (userId: string, camionetaId: number | null) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      if (camionetaId === null) {
        // Remover la asignación
        await updateDoc(userRef, {
          CAMIONETA_ASIGNADA: null
        });
      } else {
        // Asignar camioneta
        await updateDoc(userRef, {
          CAMIONETA_ASIGNADA: camionetaId
        });
      }
    } catch (error) {
      console.error("Error al actualizar camioneta del usuario:", error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      return;
    }

    // Extraer el ID del usuario del draggableId
    const usuarioId = draggableId.replace('disponible-', '').replace('asignado-', '');

    // Buscar el usuario en todas las fuentes posibles
    let usuario: Usuario | undefined;
    
    if (draggableId.startsWith('disponible-')) {
      usuario = usuariosDisponibles.find(u => u.id === usuarioId);
    } else if (draggableId.startsWith('asignado-')) {
      // Buscar en todos los almacenes
      for (const almacen of almacenes) {
        usuario = almacen.usuariosAsignados.find(u => u.id === usuarioId);
        if (usuario) break;
      }
    }

    if (!usuario) {
      console.error('Usuario no encontrado:', usuarioId);
      return;
    }

    if (source.droppableId === "usuarios-disponibles") {
      // Mover de disponibles a almacén
      const almacenId = parseInt(destination.droppableId.replace("almacen-", ""));
      const almacen = almacenes.find(a => a.id === almacenId);
      
      if (almacen?.esExcluido) {
        alert("No puedes asignar usuarios a un almacén que no es camioneta");
        return;
      }
      
      if (almacen && almacen.usuariosAsignados.length >= 3) {
        alert("Este almacén ya tiene el máximo de 3 usuarios asignados");
        return;
      }
      
      // Verificar si el usuario ya tiene una camioneta asignada
      if (usuario.camionetaAsignada && usuario.camionetaAsignada !== almacenId) {
        const confirm = window.confirm(`Este usuario ya está asignado a otra camioneta. ¿Desea reasignarlo?`);
        if (!confirm) return;
        
        // Remover de la camioneta anterior
        setAlmacenes(prev => prev.map(a => {
          if (a.id === usuario.camionetaAsignada) {
            return {
              ...a,
              usuariosAsignados: a.usuariosAsignados.filter(u => u.id !== usuario.id)
            };
          }
          return a;
        }));
      }
      
      setUsuariosDisponibles(prev => prev.filter(u => u.id !== usuario!.id));
      
      setAlmacenes(prev => prev.map(a => {
        if (a.id === almacenId) {
          return {
            ...a,
            usuariosAsignados: [...a.usuariosAsignados, { ...usuario!, camionetaAsignada: almacenId }]
          };
        }
        return a;
      }));

      // Guardar en Firebase
      await updateUserCamioneta(usuario.id, almacenId);
    } else {
      // Mover de almacén a otro lugar
      const sourceAlmacenId = parseInt(source.droppableId.replace("almacen-", ""));
      
      if (destination.droppableId === "usuarios-disponibles") {
        // Mover de almacén a disponibles
        setAlmacenes(prev => prev.map(a => {
          if (a.id === sourceAlmacenId) {
            return {
              ...a,
              usuariosAsignados: a.usuariosAsignados.filter(u => u.id !== usuario!.id)
            };
          }
          return a;
        }));
        
        setUsuariosDisponibles(prev => [...prev, { ...usuario!, camionetaAsignada: undefined }]);
        
        // Remover asignación en Firebase
        await updateUserCamioneta(usuario.id, null);
      } else {
        // Mover de almacén a otro almacén
        const destAlmacenId = parseInt(destination.droppableId.replace("almacen-", ""));
        const destAlmacen = almacenes.find(a => a.id === destAlmacenId);
        
        if (destAlmacen && destAlmacen.usuariosAsignados.length >= 3) {
          alert("Este almacén ya tiene el máximo de 3 usuarios asignados");
          return;
        }
        
        setAlmacenes(prev => prev.map(a => {
          if (a.id === sourceAlmacenId) {
            return {
              ...a,
              usuariosAsignados: a.usuariosAsignados.filter(u => u.id !== usuario!.id)
            };
          }
          if (a.id === destAlmacenId) {
            return {
              ...a,
              usuariosAsignados: [...a.usuariosAsignados, { ...usuario!, camionetaAsignada: destAlmacenId }]
            };
          }
          return a;
        }));

        // Actualizar asignación en Firebase
        await updateUserCamioneta(usuario.id, destAlmacenId);
      }
    }
  };

  const handleQuickAssign = async (usuarioId: string) => {
    if (selectedAlmacen === null) {
      alert("Por favor selecciona un almacén primero");
      return;
    }

    const almacen = almacenes.find(a => a.id === selectedAlmacen);
    
    if (almacen?.esExcluido) {
      alert("No puedes asignar usuarios a un almacén que no es camioneta");
      return;
    }
    
    if (almacen && almacen.usuariosAsignados.length >= 3) {
      alert("Este almacén ya tiene el máximo de 3 usuarios asignados");
      return;
    }

    const usuario = usuariosDisponibles.find(u => u.id === usuarioId);
    if (!usuario) return;

    // Verificar si el usuario ya tiene una camioneta asignada
    if (usuario.camionetaAsignada && usuario.camionetaAsignada !== selectedAlmacen) {
      const confirm = window.confirm(`Este usuario ya está asignado a otra camioneta. ¿Desea reasignarlo?`);
      if (!confirm) return;
      
      // Remover de la camioneta anterior
      setAlmacenes(prev => prev.map(a => {
        if (a.id === usuario.camionetaAsignada) {
          return {
            ...a,
            usuariosAsignados: a.usuariosAsignados.filter(u => u.id !== usuario.id)
          };
        }
        return a;
      }));
    }

    setUsuariosDisponibles(prev => prev.filter(u => u.id !== usuarioId));
    setAlmacenes(prev => prev.map(a => {
      if (a.id === selectedAlmacen) {
        return {
          ...a,
          usuariosAsignados: [...a.usuariosAsignados, { ...usuario, camionetaAsignada: selectedAlmacen }]
        };
      }
      return a;
    }));

    // Guardar en Firebase
    await updateUserCamioneta(usuario.id, selectedAlmacen);
  };

  const handleResetAll = async () => {
    if (resetConfirmText.toUpperCase() !== "RESTABLECER") {
      alert("Debes escribir 'RESTABLECER' para confirmar");
      return;
    }

    setSaving(true);
    try {
      // Restablecer todas las asignaciones en Firebase
      const resetPromises = cobradores
        .filter(cobrador => cobrador.CAMIONETA_ASIGNADA)
        .map(cobrador => updateUserCamioneta(cobrador.ID, null));
      
      await Promise.all(resetPromises);

      // Mover todos los usuarios asignados de vuelta a disponibles
      const todosUsuarios = almacenes.flatMap(almacen => almacen.usuariosAsignados);
      const usuariosRestablecidos = todosUsuarios.map(usuario => ({
        ...usuario,
        camionetaAsignada: undefined
      }));

      setUsuariosDisponibles(prev => [...prev, ...usuariosRestablecidos]);
      setAlmacenes(prev => prev.map(almacen => ({
        ...almacen,
        usuariosAsignados: []
      })));

      setShowResetModal(false);
      setResetConfirmText("");
      
      alert("Todas las asignaciones han sido restablecidas");
    } catch (error) {
      console.error("Error al restablecer asignaciones:", error);
      alert("Error al restablecer las asignaciones");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUser = async (almacenId: number, usuarioId: string) => {
    const almacen = almacenes.find(a => a.id === almacenId);
    if (!almacen) return;

    const usuario = almacen.usuariosAsignados.find(u => u.id === usuarioId);
    if (!usuario) return;

    setAlmacenes(prev => prev.map(a => {
      if (a.id === almacenId) {
        return {
          ...a,
          usuariosAsignados: a.usuariosAsignados.filter(u => u.id !== usuarioId)
        };
      }
      return a;
    }));
    
    setUsuariosDisponibles(prev => [...prev, { ...usuario, camionetaAsignada: undefined }]);
    
    // Remover asignación en Firebase
    await updateUserCamioneta(usuario.id, null);
  };


  const filteredUsuarios = usuariosDisponibles.filter(usuario =>
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (usuario.email && usuario.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading || loadingCobradores) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Asignación de Almacenes (Camionetas)
            </h1>
            <p className="text-gray-600">
              Asigna hasta 3 usuarios por camioneta. Arrastra y suelta o usa la asignación rápida.
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={fetchAlmacenes}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Recargar Almacenes
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Restablecer Todo
              </button>
              <button
                onClick={() => setShowExcludedSection(!showExcludedSection)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showExcludedSection 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300'
                }`}
              >
                {showExcludedSection ? 'Ocultar' : 'Ver'} Almacenes No-Camioneta ({almacenes.filter(a => a.esExcluido).length})
              </button>
              {!showExcludedSection && (
                <button
                  onClick={() => {
                    setModoEdicionExcluidos(!modoEdicionExcluidos);
                    if (modoEdicionExcluidos) {
                      // Si se está desactivando el modo, mostrar mensaje
                      alert('Modo de gestión desactivado');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    modoEdicionExcluidos 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg animate-pulse' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
                  }`}
                >
                  {modoEdicionExcluidos ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Modo Gestión Activo
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Gestionar No-Camionetas
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="text-green-700 text-sm font-medium">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardado automático activado
              </span>
            </div>
          </div>

          {/* Banner informativo cuando el modo de edición está activo */}
          {modoEdicionExcluidos && !showExcludedSection && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 text-white rounded-full p-2 animate-pulse">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900">Modo de Gestión Activo</h3>
                    <p className="text-purple-700 text-sm">
                      Puedes marcar los almacenes vacíos como "No-Camioneta". Los almacenes con usuarios asignados no se pueden modificar.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModoEdicionExcluidos(false)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}

          {/* Sección de almacenes excluidos */}
          {showExcludedSection && (
            <div className="mb-8">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-orange-800 mb-2">
                      Almacenes que NO son Camionetas
                    </h2>
                    <p className="text-orange-700 text-sm">
                      Estos almacenes están marcados como "solo almacén" y no pueden tener usuarios asignados.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 px-3 py-2 rounded-lg">
                      <span className="text-orange-800 font-medium text-sm">
                        {almacenes.filter(a => a.esExcluido).length} almacén(es)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowExcludedSection(false);
                        setModoEdicionExcluidos(true);
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Gestionar
                    </button>
                  </div>
                </div>
                
                {almacenes.filter(a => a.esExcluido).length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-gray-500">
                      No hay almacenes excluidos. Usa el botón "Marcar como No-Camioneta" en cualquier almacén vacío.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {almacenes.filter(a => a.esExcluido).map((almacen) => (
                      <div
                        key={`excluido-${almacen.id}`}
                        className="bg-white rounded-lg shadow-sm p-4 border border-orange-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800 text-sm">
                            {almacen.nombre}
                          </h3>
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">
                            No-Camioneta
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          ID: {almacen.id}
                        </p>
                        <p className="text-xs text-gray-600">
                          Existencias: {almacen.existencias.toLocaleString()}
                        </p>
                        <button
                          onClick={() => toggleAlmacenExcluido(almacen.id)}
                          className="mt-3 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs py-2 rounded transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Habilitar como Camioneta
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Almacenes / Camionetas</h2>
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-blue-700 font-medium text-sm">
                    {almacenes.filter(a => !a.esExcluido).length} camioneta(s) disponible(s)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {almacenes.filter(a => !a.esExcluido).map((almacen) => (
                  <div
                    key={almacen.id}
                    className={`bg-white rounded-lg shadow-md p-4 border-2 transition-all ${
                      selectedAlmacen === almacen.id ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedAlmacen(almacen.id)}
                  >
                    <div className="mb-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">{almacen.nombre}</h3>
                        <span className={`text-sm px-2 py-1 rounded ${
                          almacen.usuariosAsignados.length === 3 
                            ? 'bg-red-100 text-red-600' 
                            : almacen.usuariosAsignados.length > 0
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {almacen.usuariosAsignados.length}/3
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Existencias: {almacen.existencias.toLocaleString()}
                      </p>
                      {modoEdicionExcluidos && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAlmacenExcluido(almacen.id);
                          }}
                          className={`mt-2 text-xs px-3 py-1.5 rounded transition-all w-full font-medium ${
                            almacen.usuariosAsignados.length > 0
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                          }`}
                          title={almacen.usuariosAsignados.length > 0 ? 'Al marcar como No-Camioneta se desasignarán los usuarios' : 'Marcar como almacén que no será usado como camioneta'}
                        >
                          {almacen.usuariosAsignados.length > 0 ? (
                            <span className="flex items-center justify-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Desasignar {almacen.usuariosAsignados.length} y marcar
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              Marcar como No-Camioneta
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <Droppable droppableId={`almacen-${almacen.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[120px] max-h-[250px] overflow-y-auto p-3 rounded-lg transition-colors ${
                            snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                          }`}
                        >
                          {almacen.usuariosAsignados.length === 0 ? (
                            <p className="text-gray-400 text-center py-8 font-medium">
                              Sin usuarios asignados
                              <br />
                              <span className="text-xs">Arrastra usuarios aquí</span>
                            </p>
                          ) : (
                            almacen.usuariosAsignados.map((usuario, index) => (
                              <Draggable
                                key={`asignado-${usuario.id}`}
                                draggableId={`asignado-${usuario.id}`}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white p-3 mb-2 rounded-lg shadow-md border-2 flex justify-between items-center transition-all ${
                                      snapshot.isDragging ? 'shadow-xl border-blue-400 scale-105' : 'border-gray-300 hover:border-blue-300'
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      color: '#374151',
                                      backgroundColor: '#ffffff',
                                      minHeight: '60px'
                                    }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span className="text-base font-semibold text-gray-900 block truncate">{usuario.nombre}</span>
                                      {usuario.email && (
                                        <span className="text-sm text-blue-600 block truncate">{usuario.email}</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveUser(almacen.id, usuario.id);
                                      }}
                                      className="text-red-500 hover:text-red-700 ml-2"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Usuarios Disponibles</h2>
              <div className="bg-white rounded-lg shadow-md p-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                />
                
                <Droppable droppableId="usuarios-disponibles">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`max-h-[500px] overflow-y-auto p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      {filteredUsuarios.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">
                          No hay usuarios disponibles
                        </p>
                      ) : (
                        filteredUsuarios.map((usuario, index) => (
                          <Draggable
                            key={`disponible-${usuario.id}`}
                            draggableId={`disponible-${usuario.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-3 mb-2 rounded-lg shadow-sm border cursor-move hover:shadow-md transition-all ${
                                  snapshot.isDragging ? 'shadow-lg border-blue-400' : 'border-gray-200'
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                  color: '#374151',
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{usuario.nombre}</p>
                                    <div className="flex flex-col gap-1">
                                      {usuario.email && (
                                        <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
                                      )}
                                      {usuario.telefono && (
                                        <p className="text-xs text-gray-400 truncate">Tel: {usuario.telefono}</p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleQuickAssign(usuario.id)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[70px] flex-shrink-0"
                                  >
                                    Asignar
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Instrucciones:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Arrastra y suelta usuarios entre las columnas para asignarlos</li>
              <li>• Cada camioneta puede tener máximo 3 usuarios asignados</li>
              <li>• Haz clic en una camioneta y luego en "Asignar" para asignación rápida</li>
              <li>• Los cambios se guardan automáticamente</li>
              <li>• Usa el botón "Gestionar No-Camionetas" para marcar almacenes que no serán usados como camionetas</li>
              <li>• Solo los almacenes vacíos pueden ser marcados como "No-Camioneta"</li>
              <li>• Los almacenes "No-Camioneta" se guardan en Firebase y no pueden recibir usuarios</li>
            </ul>
          </div>
        </div>

        {/* Modal de confirmación para restablecer todo */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Restablecer Todas las Asignaciones</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm font-medium mb-2">
                    Advertencia: Esta acción es irreversible
                  </p>
                  <p className="text-red-700 text-sm">
                    Se eliminarán todas las asignaciones de usuarios a camionetas del sistema.
                  </p>
                </div>
                <p className="text-gray-700 text-sm font-medium mb-3">
                  Para confirmar esta operación, escriba: <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">RESTABLECER</span>
                </p>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Escriba RESTABLECER para confirmar"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center font-semibold bg-white text-gray-900 uppercase tracking-wider"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirmText("");
                  }}
                  className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetAll}
                  disabled={saving || resetConfirmText.toUpperCase() !== "RESTABLECER"}
                  className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Procesando..." : "Confirmar Restablecimiento"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Navegación profesional */}
        <Navigation />
      </div>
    </DragDropContext>
  );
};

export default AsignacionAlmacenes;