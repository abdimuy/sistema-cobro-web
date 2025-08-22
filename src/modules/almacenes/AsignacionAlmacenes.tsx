import React, { useState, useEffect } from "react";
import { URL_API } from "../../constants/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import useGetCobradores from "../../hooks/useGetCobradores";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { USERS_COLLECTION } from "../../constants/collections";
import { ALMACENES_EXCLUIDOS } from "../../constants/values";
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
}

const AsignacionAlmacenes = () => {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlmacen, setSelectedAlmacen] = useState<number | null>(null);
  const [almacenesLoaded, setAlmacenesLoaded] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const { cobradores, isLoading: loadingCobradores } = useGetCobradores();

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  useEffect(() => {
    if (cobradores.length > 0 && almacenesLoaded && almacenes.length > 0) {
      const usuariosFormateados = cobradores.map((cobrador) => ({
        id: cobrador.ID,
        nombre: cobrador.NOMBRE,
        email: cobrador.EMAIL,
        telefono: cobrador.TELEFONO,
        camionetaAsignada: cobrador.CAMIONETA_ASIGNADA
      }));

      // Separar usuarios según si tienen camioneta asignada
      const usuariosDisponiblesTemp: Usuario[] = [];
      const almacenesTemp = almacenes.map(almacen => ({
        ...almacen,
        usuariosAsignados: []
      }));

      usuariosFormateados.forEach(usuario => {
        if (usuario.camionetaAsignada) {
          // Buscar el almacén correspondiente y asignar el usuario
          const almacenIndex = almacenesTemp.findIndex(a => a.id === usuario.camionetaAsignada);
          if (almacenIndex !== -1) {
            almacenesTemp[almacenIndex].usuariosAsignados.push(usuario);
          } else {
            // Si no encuentra el almacén, lo pone como disponible
            usuariosDisponiblesTemp.push(usuario);
          }
        } else {
          usuariosDisponiblesTemp.push(usuario);
        }
      });

      setUsuariosDisponibles(usuariosDisponiblesTemp);
      setAlmacenes(almacenesTemp);
    }
  }, [cobradores, almacenesLoaded]); // Re-ejecutar cuando cambian cobradores o se recargan almacenes

  const fetchAlmacenes = async () => {
    setLoading(true);
    setAlmacenesLoaded(false); // Reset para que se vuelva a mapear
    try {
      const response = await fetch(`${URL_API}/almacenes`);
      const data: AlmacenResponse = await response.json();
      
      if (data.error) {
        console.error("Error de API:", data.error);
        return;
      }

      const almacenesFormateados: Almacen[] = data.body
        .filter((almacen) => !ALMACENES_EXCLUIDOS.includes(almacen.ALMACEN_ID))
        .map((almacen) => ({
          id: almacen.ALMACEN_ID,
          nombre: almacen.ALMACEN,
          existencias: almacen.EXISTENCIAS,
          capacidad: 3,
          usuariosAsignados: []
        }));

      setAlmacenes(almacenesFormateados);
      setAlmacenesLoaded(true);
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

  const handleSave = async () => {
    // Las asignaciones se guardan automáticamente en Firebase
    alert("Las asignaciones se guardan automáticamente al realizar cambios");
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
            <div className="flex gap-3">
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
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="text-green-700 text-sm font-medium">
                ✅ Guardado automático activado
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Almacenes / Camionetas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {almacenes.map((almacen) => (
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
              <li>• Los cambios se guardan al hacer clic en "Guardar Asignaciones"</li>
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