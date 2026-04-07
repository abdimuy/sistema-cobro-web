import { useState, useEffect } from "react";
import { toast } from "sonner";
import { URL_API } from "../../constants/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import useGetCobradores from "../../hooks/useGetCobradores";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { USERS_COLLECTION, CONFIG_COLLECTION } from "../../constants/collections";


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
  const [camionetaSearchTerm, setCamionetaSearchTerm] = useState("");
  const [selectedAlmacen, setSelectedAlmacen] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showExcludedModal, setShowExcludedModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const { cobradores, isLoading: loadingCobradores } = useGetCobradores();

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

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
    
    const executeToggle = async () => {
      if (!isCurrentlyExcluded && almacen.usuariosAsignados.length > 0) {
        const usuariosADesasignar = [...almacen.usuariosAsignados];
        for (const usuario of usuariosADesasignar) {
          await updateUserCamioneta(usuario.id, null);
        }
        setUsuariosDisponibles(prev => [
          ...prev,
          ...usuariosADesasignar.map(u => ({ ...u, camionetaAsignada: undefined }))
        ]);
        setAlmacenes(prev => prev.map(a => {
          if (a.id === almacenId) return { ...a, usuariosAsignados: [], esExcluido: true };
          return a;
        }));
      } else {
        setAlmacenes(prev => prev.map(a => {
          if (a.id === almacenId) return { ...a, esExcluido: !isCurrentlyExcluded };
          return a;
        }));
      }

      const newExcluidos = isCurrentlyExcluded
        ? almacenesExcluidos.filter(id => id !== almacenId)
        : [...almacenesExcluidos, almacenId];
      await updateExcludedAlmacenes(newExcluidos);

      const successMessage = isCurrentlyExcluded
        ? `"${almacen.nombre}" ahora puede usarse como camioneta`
        : almacen.usuariosAsignados.length > 0
          ? `"${almacen.nombre}" marcado como No-Camioneta, ${almacen.usuariosAsignados.length} usuario(s) desasignados`
          : `"${almacen.nombre}" marcado como No-Camioneta`;
      toast.success(successMessage);
    };

    if (!isCurrentlyExcluded) {
      const msg = almacen.usuariosAsignados.length > 0
        ? `El almacén "${almacen.nombre}" tiene ${almacen.usuariosAsignados.length} usuario(s) asignado(s). ¿Deseas marcarlo como No-Camioneta? Esto desasignará a todos los usuarios.`
        : `¿Marcar "${almacen.nombre}" como almacén que NO será usado como camioneta?`;
      setConfirmDialog({ message: msg, onConfirm: executeToggle });
    } else {
      setConfirmDialog({
        message: `¿Habilitar "${almacen.nombre}" para ser usado como camioneta?`,
        onConfirm: executeToggle,
      });
    }
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
        toast.error("No puedes asignar vendedores a un almacén excluido");
        return;
      }

      if (almacen && almacen.usuariosAsignados.length >= 3) {
        toast.error("Esta camioneta ya tiene el máximo de 3 vendedores asignados");
        return;
      }

      const executeAssign = async () => {
        if (usuario.camionetaAsignada && usuario.camionetaAsignada !== almacenId) {
          setAlmacenes(prev => prev.map(a => {
            if (a.id === usuario.camionetaAsignada) {
              return { ...a, usuariosAsignados: a.usuariosAsignados.filter(u => u.id !== usuario.id) };
            }
            return a;
          }));
        }
        setUsuariosDisponibles(prev => prev.filter(u => u.id !== usuario!.id));
        setAlmacenes(prev => prev.map(a => {
          if (a.id === almacenId) {
            return { ...a, usuariosAsignados: [...a.usuariosAsignados, { ...usuario!, camionetaAsignada: almacenId }] };
          }
          return a;
        }));
        await updateUserCamioneta(usuario.id, almacenId);
      };

      if (usuario.camionetaAsignada && usuario.camionetaAsignada !== almacenId) {
        setConfirmDialog({
          message: `Este vendedor ya está asignado a otra camioneta. ¿Desea reasignarlo?`,
          onConfirm: executeAssign,
        });
      } else {
        await executeAssign();
      }
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
          toast.error("Esta camioneta ya tiene el máximo de 3 vendedores asignados");
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
      toast.error("Por favor selecciona un almacén primero");
      return;
    }

    const almacen = almacenes.find(a => a.id === selectedAlmacen);

    if (almacen?.esExcluido) {
      toast.error("No puedes asignar vendedores a un almacén excluido");
      return;
    }

    if (almacen && almacen.usuariosAsignados.length >= 3) {
      toast.error("Esta camioneta ya tiene el máximo de 3 vendedores asignados");
      return;
    }

    const usuario = usuariosDisponibles.find(u => u.id === usuarioId);
    if (!usuario) return;

    const executeQuickAssign = async () => {
      if (usuario.camionetaAsignada && usuario.camionetaAsignada !== selectedAlmacen) {
        setAlmacenes(prev => prev.map(a => {
          if (a.id === usuario.camionetaAsignada) {
            return { ...a, usuariosAsignados: a.usuariosAsignados.filter(u => u.id !== usuario.id) };
          }
          return a;
        }));
      }
      setUsuariosDisponibles(prev => prev.filter(u => u.id !== usuarioId));
      setAlmacenes(prev => prev.map(a => {
        if (a.id === selectedAlmacen) {
          return { ...a, usuariosAsignados: [...a.usuariosAsignados, { ...usuario, camionetaAsignada: selectedAlmacen }] };
        }
        return a;
      }));
      await updateUserCamioneta(usuario.id, selectedAlmacen);
    };

    if (usuario.camionetaAsignada && usuario.camionetaAsignada !== selectedAlmacen) {
      setConfirmDialog({
        message: `Este vendedor ya está asignado a otra camioneta. ¿Desea reasignarlo?`,
        onConfirm: executeQuickAssign,
      });
    } else {
      await executeQuickAssign();
    }
  };

  const handleResetAll = async () => {
    if (resetConfirmText.toUpperCase() !== "RESTABLECER") {
      toast.error("Debes escribir 'RESTABLECER' para confirmar");
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
      
      toast.success("Todas las asignaciones han sido restablecidas");
    } catch (error) {
      console.error("Error al restablecer asignaciones:", error);
      toast.error("Error al restablecer las asignaciones");
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

  const filteredCamionetas = almacenes.filter(almacen =>
    !almacen.esExcluido &&
    almacen.nombre.toLowerCase().includes(camionetaSearchTerm.toLowerCase())
  );

  if (loading || loadingCobradores) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-muted/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Asignación de Camionetas
            </h1>
            <p className="text-muted-foreground">
              Asigna hasta 3 vendedores por camioneta. Arrastra y suelta o usa la asignación rápida.
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={fetchAlmacenes}
                className="bg-muted-foreground hover:bg-muted-foreground/80 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Recargar Almacenes
              </button>
              <button
                onClick={() => window.location.href = '/inventario-camionetas'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
              >
                Ver Inventario
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Restablecer Todo
              </button>
              <button
                onClick={() => setShowExcludedModal(true)}
                className="bg-orange-500/15 hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-4 py-2 rounded-lg transition-colors"
              >
                Ver Almacenes ({almacenes.filter(a => a.esExcluido).length})
              </button>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardado automático activado
              </span>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Camionetas</h2>
                <div className="bg-primary/10 px-3 py-2 rounded-lg">
                  <span className="text-primary/80 font-medium text-sm">
                    {filteredCamionetas.length} camioneta(s) encontrada(s)
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar camionetas por nombre..."
                    value={camionetaSearchTerm}
                    onChange={(e) => setCamionetaSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  />
                  {camionetaSearchTerm && (
                    <button
                      onClick={() => setCamionetaSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredCamionetas.map((almacen) => (
                  <div
                    key={almacen.id}
                    className={`bg-card rounded-lg shadow-md p-4 border-2 transition-all ${
                      selectedAlmacen === almacen.id ? 'border-blue-500 shadow-lg' : 'border-border'
                    }`}
                    onClick={() => setSelectedAlmacen(almacen.id)}
                  >
                    <div className="mb-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">{almacen.nombre}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm px-2 py-1 rounded ${
                            almacen.usuariosAsignados.length === 3
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : almacen.usuariosAsignados.length > 0
                              ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                              : 'bg-green-500/15 text-green-600 dark:text-green-400'
                          }`}>
                            {almacen.usuariosAsignados.length}/3
                          </span>
                          {/* Menú de 3 puntos */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === almacen.id ? null : almacen.id);
                              }}
                              className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                              <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </button>
                            {openMenuId === almacen.id && (
                              <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[220px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAlmacenExcluido(almacen.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 text-foreground text-sm font-medium"
                                >
                                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  <span>
                                    {almacen.usuariosAsignados.length > 0
                                      ? `Cambiar a Almacén (${almacen.usuariosAsignados.length} usuarios)`
                                      : 'Cambiar a Almacén'
                                    }
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Existencias: {almacen.existencias.toLocaleString()}
                      </p>
                    </div>
                    
                    <Droppable droppableId={`almacen-${almacen.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[120px] max-h-[250px] overflow-y-auto p-3 rounded-lg transition-colors ${
                            snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-muted'
                          }`}
                        >
                          {almacen.usuariosAsignados.length === 0 ? (
                            <p className="text-muted-foreground/60 text-center py-8 font-medium">
                              Sin vendedores asignados
                              <br />
                              <span className="text-xs">Arrastra vendedores aquí</span>
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
                                    className={`bg-card p-3 mb-2 rounded-lg shadow-md border-2 flex justify-between items-center transition-all ${
                                      snapshot.isDragging ? 'shadow-xl border-primary scale-105' : 'border-border hover:border-primary/50'
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      minHeight: '60px'
                                    }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span className="text-base font-semibold text-foreground block truncate">{usuario.nombre}</span>
                                      {usuario.email && (
                                        <span className="text-sm text-primary block truncate">{usuario.email}</span>
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
              <h2 className="text-xl font-semibold text-foreground mb-4">Vendedores Disponibles</h2>
              <div className="bg-card rounded-lg shadow-md p-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
                
                <Droppable droppableId="usuarios-disponibles">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`max-h-[500px] overflow-y-auto p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      {filteredUsuarios.length === 0 ? (
                        <p className="text-muted-foreground/60 text-center py-4">
                          No hay vendedores disponibles
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
                                className={`bg-card p-3 mb-2 rounded-lg shadow-sm border cursor-move hover:shadow-md transition-all ${
                                  snapshot.isDragging ? 'shadow-lg border-primary' : 'border-border'
                                }`}
                                style={{
                                  ...provided.draggableProps.style
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{usuario.nombre}</p>
                                    <div className="flex flex-col gap-1">
                                      {usuario.email && (
                                        <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                                      )}
                                      {usuario.telefono && (
                                        <p className="text-xs text-muted-foreground/60 truncate">Tel: {usuario.telefono}</p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleQuickAssign(usuario.id)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[70px] flex-shrink-0"
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

          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-lg p-4 dark:bg-primary/10">
            <h3 className="font-semibold text-primary mb-2">Instrucciones:</h3>
            <ul className="text-sm text-primary/80 space-y-1">
              <li>• Arrastra y suelta vendedores entre las columnas para asignarlos</li>
              <li>• Cada camioneta puede tener máximo 3 vendedores asignados</li>
              <li>• Haz clic en una camioneta y luego en "Asignar" para asignación rápida</li>
              <li>• Los cambios se guardan automáticamente</li>
              <li>• Usa el menú de opciones (⋮) en cualquier camioneta para cambiarla a "Almacén"</li>
              <li>• Usa "Ver Almacenes" para gestionar almacenes que no serán usados como camionetas</li>
              <li>• Los almacenes se guardan automáticamente y no pueden recibir vendedores</li>
            </ul>
          </div>
        </div>

        {/* Modal para almacenes no-camioneta */}
        {showExcludedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Almacenes</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Estos almacenes están marcados como "almacén" y no pueden tener vendedores asignados
                  </p>
                </div>
                <button
                  onClick={() => setShowExcludedModal(false)}
                  className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {almacenes.filter(a => a.esExcluido).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-orange-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-2">No hay almacenes</h4>
                    <p className="text-muted-foreground">
                      Usa el menú de opciones (⋮) en cualquier camioneta para cambiarla a "Almacén"
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {almacenes.filter(a => a.esExcluido).map((almacen) => (
                      <div
                        key={`modal-excluido-${almacen.id}`}
                        className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground text-sm mb-1">
                              {almacen.nombre}
                            </h4>
                            <span className="bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs px-2 py-1 rounded">
                              Almacén
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">ID:</span> {almacen.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Existencias:</span> {almacen.existencias.toLocaleString()}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            toggleAlmacenExcluido(almacen.id);
                            // No cerramos el modal para que puedan ver el cambio
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Cambiar a Camioneta
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted">
                <button
                  onClick={() => setShowExcludedModal(false)}
                  className="px-6 py-2.5 rounded-lg bg-muted-foreground hover:bg-muted-foreground/80 text-white font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para restablecer todo */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-3">Restablecer Todas las Asignaciones</h3>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
                    Advertencia: Esta acción es irreversible
                  </p>
                  <p className="text-red-600/80 dark:text-red-400/80 text-sm">
                    Se eliminarán todas las asignaciones de usuarios a camionetas del sistema.
                  </p>
                </div>
                <p className="text-foreground text-sm font-medium mb-3">
                  Para confirmar esta operación, escriba: <span className="font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded">RESTABLECER</span>
                </p>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Escriba RESTABLECER para confirmar"
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center font-semibold bg-background text-foreground uppercase tracking-wider"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirmText("");
                  }}
                  className="px-6 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors"
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
      </div>
    </DragDropContext>

    {/* Confirm Dialog */}
    {confirmDialog && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDialog(null)}>
        <div className="bg-background border border-border rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar accion</h3>
          <p className="text-sm text-muted-foreground mb-6">{confirmDialog.message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDialog(null)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AsignacionAlmacenes;