import { useState, useEffect } from "react";
import dayjs from "dayjs";
import useGetVentaLocalCompleta from "../../hooks/useGetVentaLocalCompleta";
import { getImageUrl } from "../../services/api/getVentasLocales";
import MapSimple from "../../components/MapSimple";
import useGetAlmacenes from "../../hooks/useGetAlmacenes";

interface VentaDetalleModalProps {
  ventaId: string;
  onClose: () => void;
}

const VentaDetalleModal = ({ ventaId, onClose }: VentaDetalleModalProps) => {
  const { venta, loading, error } = useGetVentaLocalCompleta(ventaId);
  const { getAlmacenById, loading: loadingAlmacenes } = useGetAlmacenes();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"info" | "productos" | "imagenes">("info");
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape para cerrar modal
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        } else {
          onClose();
        }
      }

      // Flechas para navegar imágenes (solo cuando hay imagen seleccionada)
      if (selectedImage && venta?.imagenes) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextImage();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevImage();
        }
      }

      // Zoom con + y -
      if (selectedImage) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }

        // Rotación con R y L
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          rotateRight();
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          rotateLeft();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (selectedImage) {
        e.preventDefault();

        // Zoom suave con scroll (incrementos más pequeños)
        const zoomIncrement = 0.1;
        const minZoom = imageElement ? calculateOptimalZoom(imageElement, rotation) * 0.8 : 0.1;
        const maxZoom = 3;

        if (e.deltaY < 0) {
          // Scroll up = zoom in
          setZoom(prev => Math.min(prev + zoomIncrement, maxZoom));
        } else {
          // Scroll down = zoom out
          setZoom(prev => Math.max(prev - zoomIncrement, minZoom));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [selectedImage, venta?.imagenes, selectedImageIndex, imageElement, rotation]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: "", visible: false });
    }, 3000);
  };

  const copyToClipboard = async (text: string, buttonElement: HTMLButtonElement, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const originalContent = buttonElement.innerHTML;
      buttonElement.innerHTML = `
        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `;
      buttonElement.classList.add('bg-green-100');
      setTimeout(() => {
        buttonElement.innerHTML = originalContent;
        buttonElement.classList.remove('bg-green-100');
      }, 2000);
      
      showToast(`${label || 'Texto'} copiado al portapapeles`);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      showToast('Error al copiar');
    }
  };

  const CopyableField = ({ label, value, tooltip }: { label: string; value: string; tooltip: string }) => (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <button
          onClick={(e) => copyToClipboard(value, e.currentTarget, label)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={tooltip}
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );


  const nextImage = () => {
    if (!venta?.imagenes) return;
    const nextIndex = (selectedImageIndex + 1) % venta.imagenes.length;
    setSelectedImageIndex(nextIndex);
    setSelectedImage(getImageUrl(venta.imagenes[nextIndex].IMG_PATH));
  };

  const prevImage = () => {
    if (!venta?.imagenes) return;
    const prevIndex = selectedImageIndex === 0 ? venta.imagenes.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(prevIndex);
    setSelectedImage(getImageUrl(venta.imagenes[prevIndex].IMG_PATH));
  };

  const openImage = (index: number) => {
    if (!venta?.imagenes) return;
    setSelectedImageIndex(index);
    setSelectedImage(getImageUrl(venta.imagenes[index].IMG_PATH));
    setImagePosition({ x: 0, y: 0 });
    setRotation(0);

    // El zoom se establecerá cuando la imagen se cargue
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    // Calcular el zoom mínimo basado en el tamaño óptimo para la rotación actual
    const minZoom = imageElement ? calculateOptimalZoom(imageElement, rotation) * 0.8 : 0.1;
    setZoom(prev => Math.max(prev - 0.5, minZoom));
  };

  const resetZoom = () => {
    // Volver al zoom óptimo para la rotación actual
    if (imageElement) {
      const optimalZoom = calculateOptimalZoom(imageElement, rotation);
      setZoom(optimalZoom);
    } else {
      setZoom(1);
    }
    setImagePosition({ x: 0, y: 0 });
  };

  const rotateLeft = () => {
    setRotation(prev => {
      const newRotation = prev - 90;
      const normalizedRotation = newRotation < 0 ? 270 : newRotation % 360;

      // Calcular zoom óptimo para la nueva orientación
      if (imageElement) {
        const optimalZoom = calculateOptimalZoom(imageElement, normalizedRotation);
        setZoom(optimalZoom);
      } else {
        setZoom(1);
      }
      setImagePosition({ x: 0, y: 0 });

      return normalizedRotation;
    });
  };

  const rotateRight = () => {
    setRotation(prev => {
      const newRotation = (prev + 90) % 360;

      // Calcular zoom óptimo para la nueva orientación
      if (imageElement) {
        const optimalZoom = calculateOptimalZoom(imageElement, newRotation);
        setZoom(optimalZoom);
      } else {
        setZoom(1);
      }
      setImagePosition({ x: 0, y: 0 });

      return newRotation;
    });
  };

  const calculateOptimalZoom = (img: HTMLImageElement, rotationDeg: number) => {
    if (!img) return 1;

    // Usar 90% del espacio disponible para buena UX
    const viewportWidth = window.innerWidth * 0.9;
    const viewportHeight = window.innerHeight * 0.9;

    // Dimensiones de la imagen
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // Si la rotación es 90° o 270°, intercambiamos las dimensiones
    const isRotated90or270 = rotationDeg === 90 || rotationDeg === 270;
    const effectiveWidth = isRotated90or270 ? imgHeight : imgWidth;
    const effectiveHeight = isRotated90or270 ? imgWidth : imgHeight;

    // Calculamos el factor de escala para ocupar 90% del espacio
    const scaleX = viewportWidth / effectiveWidth;
    const scaleY = viewportHeight / effectiveHeight;

    // Usamos el menor de los dos para que quepa completamente
    // y ocupe el máximo espacio posible
    const optimalScale = Math.min(scaleX, scaleY);

    return optimalScale;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageLoad = (imageId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoadStart = (imageId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: true }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold text-gray-900 mb-2">Error al cargar la venta</p>
            <p className="text-gray-600 mb-6">{error || "No se pudo cargar la información"}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal principal */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slide-up mx-4 sm:mx-0">
          {/* Header del modal */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Detalle de Venta</h2>
                <p className="text-blue-100 mt-1">ID: {venta.LOCAL_SALE_ID}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === "info" 
                    ? "text-blue-600 bg-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Información General
                {activeTab === "info" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("productos")}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === "productos" 
                    ? "text-blue-600 bg-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Productos ({venta.productos?.length || 0})
                {activeTab === "productos" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("imagenes")}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === "imagenes" 
                    ? "text-blue-600 bg-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Imágenes ({venta.imagenes?.length || 0})
                {activeTab === "imagenes" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Contenido del modal */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
            {/* Tab de Información General */}
            {activeTab === "info" && (
              <div className="space-y-6 animate-fade-in">
                {/* Información del cliente */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Información del Cliente
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CopyableField
                      label="Nombre"
                      value={venta.NOMBRE_CLIENTE}
                      tooltip="Copiar nombre"
                    />
                    {venta.TELEFONO ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Teléfono</p>
                          <button
                            onClick={(e) => copyToClipboard(venta.TELEFONO, e.currentTarget)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar teléfono"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <a href={`tel:${venta.TELEFONO}`} className="font-semibold text-blue-600 hover:underline">
                          {venta.TELEFONO}
                        </a>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-semibold text-gray-900">No registrado</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <CopyableField
                        label="Dirección"
                        value={venta.DIRECCION}
                        tooltip="Copiar dirección"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Número</p>
                      {venta.NUMERO ? (
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{venta.NUMERO}</p>
                          <button
                            onClick={(e) => copyToClipboard(venta.NUMERO!, e.currentTarget, 'Número')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar número"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-400">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Colonia</p>
                      {venta.COLONIA ? (
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{venta.COLONIA}</p>
                          <button
                            onClick={(e) => copyToClipboard(venta.COLONIA!, e.currentTarget, 'Colonia')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar colonia"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-400">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Población</p>
                      {venta.POBLACION ? (
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{venta.POBLACION}</p>
                          <button
                            onClick={(e) => copyToClipboard(venta.POBLACION!, e.currentTarget, 'Población')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar población"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-400">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ciudad</p>
                      {venta.CIUDAD ? (
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{venta.CIUDAD}</p>
                          <button
                            onClick={(e) => copyToClipboard(venta.CIUDAD!, e.currentTarget, 'Ciudad')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar ciudad"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-400">-</p>
                      )}
                    </div>
                    {venta.AVAL_O_RESPONSABLE && (
                      <div className="md:col-span-2">
                        <CopyableField
                          label="Aval o Responsable"
                          value={venta.AVAL_O_RESPONSABLE!}
                          tooltip="Copiar aval/responsable"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Información financiera */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Información Financiera
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Precio Total</p>
                        <button
                          onClick={(e) => copyToClipboard(venta.PRECIO_TOTAL.toString(), e.currentTarget)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copiar precio total"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(venta.PRECIO_TOTAL)}</p>
                    </div>
                    {venta.ENGANCHE !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Enganche</p>
                          <button
                            onClick={(e) => copyToClipboard((venta.ENGANCHE || 0).toString(), e.currentTarget)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar enganche"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(venta.ENGANCHE || 0)}</p>
                      </div>
                    )}
                    {venta.PARCIALIDAD !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Parcialidad</p>
                          <button
                            onClick={(e) => copyToClipboard((venta.PARCIALIDAD || 0).toString(), e.currentTarget)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar parcialidad"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(venta.PARCIALIDAD || 0)}</p>
                    </div>
                    )}
                    {venta.MONTO_A_CORTO_PLAZO !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Monto a Corto Plazo</p>
                          <button
                            onClick={(e) => copyToClipboard((venta.MONTO_A_CORTO_PLAZO || 0).toString(), e.currentTarget)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar monto a corto plazo"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xl font-bold text-gray-700">{formatCurrency(venta.MONTO_A_CORTO_PLAZO || 0)}</p>
                      </div>
                    )}
                    {venta.TIEMPO_A_CORTO_PLAZOMESES !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-500">Plazo</p>
                        <p className="text-xl font-bold text-gray-700">{venta.TIEMPO_A_CORTO_PLAZOMESES} meses</p>
                      </div>
                    )}
                    {venta.FREC_PAGO && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-500">Frecuencia de Pago</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {venta.FREC_PAGO}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Venta</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Venta</p>
                        <p className="font-semibold text-gray-900">{dayjs(venta.FECHA_VENTA).format("DD/MM/YYYY HH:mm")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vendedor</p>
                        <p className="font-semibold text-gray-900">{venta.USER_EMAIL}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Almacén</p>
                        {loadingAlmacenes ? (
                          <p className="font-semibold text-gray-900">Cargando...</p>
                        ) : (
                          <p className="font-semibold text-gray-900">
                            {getAlmacenById(venta.ALMACEN_ID)?.ALMACEN || `ID: ${venta.ALMACEN_ID}`}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tipo de Venta</p>
                        {venta.TIPO_VENTA ? (
                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                            venta.TIPO_VENTA === 'CREDITO'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {venta.TIPO_VENTA}
                          </span>
                        ) : (
                          <p className="font-semibold text-gray-400">-</p>
                        )}
                      </div>
                      {venta.DIA_COBRANZA && (
                        <div>
                          <p className="text-sm text-gray-500">Día de Cobranza</p>
                          <p className="font-semibold text-gray-900">{venta.DIA_COBRANZA}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {venta.NOTA && (
                    <div className="bg-yellow-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Notas
                      </h3>
                      <p className="text-gray-700">{venta.NOTA}</p>
                    </div>
                  )}
                </div>

                {/* Ubicación */}
                {venta.LATITUD && venta.LONGITUD && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ubicación
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Coordenadas</p>
                          <p className="font-semibold text-gray-900">{venta.LATITUD}, {venta.LONGITUD}</p>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${venta.LATITUD},${venta.LONGITUD}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Ver en Google Maps
                        </a>
                      </div>
                      {/* Mapa integrado */}
                      <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                        <MapSimple 
                          point={{ lat: Number(venta.LATITUD), lng: Number(venta.LONGITUD) }} 
                          height="256px"
                          zoom={16}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Productos */}
            {activeTab === "productos" && (
              <div className="animate-fade-in">
                {venta.productos && venta.productos.length > 0 ? (
                  <div className="space-y-4">
                    {venta.productos.map((producto, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{producto.ARTICULO}</h4>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-500">ID: {producto.ARTICULO_ID}</span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                Cantidad: {producto.CANTIDAD}
                              </span>
                            </div>
                          </div>
                          <div className="w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-gray-50 rounded-lg p-3 border">
                                <p className="text-xs text-gray-500 mb-2">Lista</p>
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-gray-900">{formatCurrency(producto.PRECIO_LISTA)}</p>
                                  <button
                                    onClick={(e) => copyToClipboard(producto.PRECIO_LISTA.toString(), e.currentTarget)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Copiar precio lista"
                                  >
                                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <p className="text-xs text-gray-500 mb-2">Corto Plazo</p>
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-blue-600">{formatCurrency(producto.PRECIO_CORTO_PLAZO)}</p>
                                  <button
                                    onClick={(e) => copyToClipboard(producto.PRECIO_CORTO_PLAZO.toString(), e.currentTarget)}
                                    className="p-1 hover:bg-blue-200 rounded transition-colors"
                                    title="Copiar precio corto plazo"
                                  >
                                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-xs text-gray-500 mb-2">Contado</p>
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-green-600">{formatCurrency(producto.PRECIO_CONTADO)}</p>
                                  <button
                                    onClick={(e) => copyToClipboard(producto.PRECIO_CONTADO.toString(), e.currentTarget)}
                                    className="p-1 hover:bg-green-200 rounded transition-colors"
                                    title="Copiar precio contado"
                                  >
                                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Resumen de productos */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total de Productos</p>
                          <p className="text-2xl font-bold text-gray-900">{venta.productos.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Unidades Totales</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {venta.productos.reduce((sum, p) => sum + p.CANTIDAD, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-500">No hay productos registrados</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Imágenes */}
            {activeTab === "imagenes" && (
              <div className="animate-fade-in">
                {venta.imagenes && venta.imagenes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {venta.imagenes.map((imagen, index) => (
                      <div
                        key={imagen.ID}
                        className="group relative bg-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        {/* Loading spinner */}
                        {imageLoadingStates[imagen.ID] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                            <div className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-blue-600 animate-spin"></div>
                          </div>
                        )}
                        
                        <img
                          src={getImageUrl(imagen.IMG_PATH)}
                          alt={imagen.IMG_DESC}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => openImage(index)}
                          onLoadStart={() => handleImageLoadStart(imagen.ID)}
                          onLoad={() => handleImageLoad(imagen.ID)}
                          onError={(e) => {
                            handleImageLoad(imagen.ID);
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBWMTMwTTEwMCA3MEw3MCA4NUwxMzAgODVMMTAwIDcwWiIgc3Ryb2tlPSIjOUI5QkE0IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
                            target.classList.add('opacity-50');
                          }}
                        />
                        
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => openImage(index)}
                        >
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <p className="text-sm font-medium">{imagen.IMG_DESC}</p>
                            <p className="text-xs opacity-75">
                              {dayjs(imagen.FECHA_SUBIDA).format("DD/MM/YYYY HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No hay imágenes disponibles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {selectedImage && venta?.imagenes && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 animate-fade-in overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Controles de zoom y rotación - Top center de pantalla */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-2 z-20">
            {/* Controles de Zoom */}
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Zoom out (-)"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
              </svg>
            </button>
            <div className="px-2 py-1 text-white text-xs font-medium min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Zoom in (+)"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Reset zoom (0)"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            {/* Separador */}
            <div className="w-px h-4 bg-white/30 mx-1"></div>

            {/* Controles de Rotación */}
            <button
              onClick={rotateLeft}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Rotar izquierda (L)"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2h-4m6 2a9 9 0 11-8.72-9" />
              </svg>
            </button>
            <div className="px-1 py-1 text-white text-xs font-medium min-w-[35px] text-center">
              {rotation}°
            </div>
            <button
              onClick={rotateRight}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Rotar derecha (R)"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l-2-2m0 0l-2-2m2 2h4m-6 2a9 9 0 108.72-9" />
              </svg>
            </button>
          </div>

          {/* Botón cerrar - Top right de pantalla */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors z-20"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navegación anterior - Left center de pantalla */}
          {venta.imagenes.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors z-20"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Navegación siguiente - Right center de pantalla */}
          {venta.imagenes.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors z-20"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Contador de imágenes - Bottom center de pantalla */}
          {venta.imagenes.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm z-20">
              {selectedImageIndex + 1} / {venta.imagenes.length}
            </div>
          )}

          {/* Información de la imagen - Bottom right de pantalla */}
          <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white max-w-xs z-20">
            <p className="text-sm font-medium">{venta.imagenes[selectedImageIndex]?.IMG_DESC}</p>
            <p className="text-xs opacity-75 mt-1">
              {dayjs(venta.imagenes[selectedImageIndex]?.FECHA_SUBIDA).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>

          {/* Contenedor de imagen */}
          <div className="relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className={`object-contain rounded-lg transition-transform duration-200 ${
                zoom > 1 ? 'cursor-move' : 'cursor-default'
              }`}
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom}) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                transformOrigin: 'center',
                width: 'auto',
                height: 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImageElement(img);
                // Calcular zoom inicial óptimo
                const optimalZoom = calculateOptimalZoom(img, rotation);
                setZoom(optimalZoom);
              }}
              onMouseDown={handleMouseDown}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 z-[80] animate-fade-in">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default VentaDetalleModal;