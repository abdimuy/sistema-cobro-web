import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import {
  User,
  Phone,
  MapPin,
  ShoppingCart,
  ChevronDown,
  Upload,
  X,
} from "lucide-react";

import { URL_API } from "../../constants/api";
import getVenta, { Venta } from "../../services/api/getVenta";
import { Garantia } from "./Garantias";
import useGetEventosByGarantia from "../../hooks/useGetEventosByGarantia";
import useGetProductsSaleByFolio from "../../hooks/useGetProductsSaleByFolio";
import useGetImagesByGarantia from "../../hooks/useGetImagesByGarantia";
import useGetEstadosGarantia from "../../hooks/useGetEstadosGarantia";
import createEventoGarantia, {
  AllowedEstadosDesktop,
} from "../../services/api/createEventoGarantia";
import createEventoGarantiaConImagenes from "../../services/api/createEventoGarantiaConImagenes";

import GarantiaStatusBadge from "../../components/garantias/GarantiaStatusBadge";
import GarantiaTimeline from "../../components/garantias/GarantiaTimeline";
import GarantiaImageGallery from "../../components/garantias/GarantiaImageGallery";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "../../components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { Skeleton } from "../../components/ui/skeleton";

const GarantiaDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [garantia, setGarantia] = useState<Garantia | null>(null);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<
    (typeof AllowedEstadosDesktop)[number]
  >(AllowedEstadosDesktop[0]);
  const [nuevaObservacion, setNuevaObservacion] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [imagenesEvento, setImagenesEvento] = useState<File[]>([]);

  // Gallery external open
  const [externalImageUrl, setExternalImageUrl] = useState<string | null>(null);

  // Collapsible sections
  const [clienteOpen, setClienteOpen] = useState(true);
  const [productosOpen, setProductosOpen] = useState(true);

  // Hooks
  const { eventos, refetch: refetchEventos } = useGetEventosByGarantia(
    garantia?.ID || 0
  );
  const { products, loading: loadingProductos } = useGetProductsSaleByFolio(
    venta?.FOLIO || ""
  );
  const { images, loading: loadingImages } = useGetImagesByGarantia(
    garantia?.ID || 0
  );
  const { getEstadoLabel } = useGetEstadosGarantia();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get<{ body: Garantia }>(`${URL_API}/garantias/${id}`)
      .then(async (response) => {
        const g = response.data.body;
        setGarantia(g);
        if (g.DOCTO_CC_ID) {
          const ventaData = await getVenta(g.DOCTO_CC_ID);
          setVenta(ventaData);
        }
      })
      .catch(() => setError("No se pudo cargar la garantia"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAgregarEvento = useCallback(async () => {
    if (!garantia || !garantia.EXTERNAL_ID) return;
    setAgregando(true);
    try {
      if (imagenesEvento.length > 0) {
        await createEventoGarantiaConImagenes(
          garantia.EXTERNAL_ID,
          {
            id: uuidv4(),
            tipoEvento: nuevoEstado,
            fechaEvento: new Date().toISOString(),
            comentario: nuevaObservacion,
          },
          imagenesEvento
        );
      } else {
        await createEventoGarantia(garantia.EXTERNAL_ID, {
          tipoEvento: nuevoEstado,
          fechaEvento: new Date().toISOString(),
          comentario: nuevaObservacion,
        });
      }
      setShowModal(false);
      setNuevaObservacion("");
      setNuevoEstado(AllowedEstadosDesktop[0]);
      setImagenesEvento([]);
      toast.success("Evento agregado con exito");
      await refetchEventos();
    } catch {
      toast.error("No se pudo agregar el evento");
    } finally {
      setAgregando(false);
    }
  }, [garantia, nuevoEstado, nuevaObservacion, imagenesEvento, refetchEventos]);

  const handleRemoveImage = (index: number) => {
    setImagenesEvento((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-6 bg-muted/50 min-h-screen">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-32 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-60 rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-60 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !garantia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50">
        <p className="text-destructive font-medium text-lg">
          {error || "Garantia no encontrada"}
        </p>
        <Link
          to="/garantias"
          className="mt-4 text-primary hover:underline text-sm"
        >
          Volver a garantias
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-muted/50 min-h-screen">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/garantias">Garantias</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{garantia.ID}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header card */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <GarantiaStatusBadge
            estado={garantia.ESTADO}
            label={getEstadoLabel(garantia.ESTADO)}
          />
          <span className="text-xl font-bold text-foreground">
            #{garantia.ID}
          </span>
          <span className="text-sm text-muted-foreground">
            {dayjs(garantia.FECHA_SOLICITUD).format("DD/MM/YYYY")}
          </span>
        </div>
        <p className="mt-3 text-foreground">{garantia.DESCRIPCION_FALLA?.toUpperCase()}</p>
        {garantia.OBSERVACIONES && (
          <p className="mt-1 text-sm text-muted-foreground">
            {garantia.OBSERVACIONES?.toUpperCase()}
          </p>
        )}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Cliente section */}
          <SectionRow
            icon={<User className="w-4 h-4" />}
            title="Cliente"
            open={clienteOpen}
            onToggle={() => setClienteOpen(!clienteOpen)}
            summary={
              venta?.CLIENTE || garantia.NOMBRE_CLIENTE || "Sin cliente"
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente</span>
                <p className="font-medium text-foreground">
                  {venta?.CLIENTE || garantia.NOMBRE_CLIENTE || "Sin cliente"}
                </p>
              </div>
              {venta?.TELEFONO && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Telefono
                  </span>
                  <p className="font-medium text-foreground">
                    {venta.TELEFONO}
                  </p>
                </div>
              )}
              {venta && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Direccion
                  </span>
                  <p className="font-medium text-foreground">
                    {venta.CALLE}, {venta.CIUDAD}
                  </p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Zona</span>
                <p className="font-medium text-foreground">
                  {venta?.ZONA_NOMBRE ||
                    garantia.ZONA_CLIENTE_NOMBRE ||
                    "Sin zona"}
                </p>
              </div>
              {venta?.VENDEDOR_1 && (
                <div>
                  <span className="text-muted-foreground">Vendedor</span>
                  <p className="font-medium text-foreground">
                    {venta.VENDEDOR_1}
                  </p>
                </div>
              )}
            </div>
          </SectionRow>

          {/* Productos section */}
          <SectionRow
            icon={<ShoppingCart className="w-4 h-4" />}
            title="Productos"
            open={productosOpen}
            onToggle={() => setProductosOpen(!productosOpen)}
            summary={
              venta
                ? loadingProductos
                  ? "Cargando..."
                  : `${products?.length || 0} producto(s)`
                : garantia.NOMBRE_PRODUCTO || "Sin productos"
            }
          >
            {venta ? (
              loadingProductos ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : products && products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((prod) => (
                      <TableRow key={prod.ARTICULO_ID}>
                        <TableCell className="font-mono text-xs">
                          {prod.FOLIO}
                        </TableCell>
                        <TableCell>{prod.ARTICULO}</TableCell>
                        <TableCell className="text-right">
                          {prod.CANTIDAD}
                        </TableCell>
                        <TableCell className="text-right">
                          ${prod.PRECIO_UNITARIO_IMPTO?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay productos asociados a esta venta.
                </p>
              )
            ) : garantia.NOMBRE_PRODUCTO ? (
              <p className="text-sm text-foreground">
                {garantia.NOMBRE_PRODUCTO}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay productos asociados.
              </p>
            )}
          </SectionRow>

          {/* Timeline */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Eventos
            </h2>
            <GarantiaTimeline
              eventos={eventos}
              getEstadoLabel={getEstadoLabel}
              onAddEvento={() => setShowModal(true)}
              onImageClick={(url) => setExternalImageUrl(url)}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Image gallery */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Imagenes
            </h2>
            <GarantiaImageGallery
              images={images}
              loading={loadingImages}
              externalOpenUrl={externalImageUrl}
              onExternalClose={() => setExternalImageUrl(null)}
            />
          </div>

          {/* Quick actions */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Acciones
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Agregar evento
            </button>
          </div>
        </div>
      </div>

      {/* Add evento dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar nuevo evento</DialogTitle>
            <DialogDescription>
              Registra un cambio de estado o comentario para esta garantia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Nuevo estado
              </label>
              <select
                onChange={(e) =>
                  setNuevoEstado(
                    e.target.value as (typeof AllowedEstadosDesktop)[number]
                  )
                }
                value={nuevoEstado}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {AllowedEstadosDesktop.map((estado) => (
                  <option key={estado} value={estado}>
                    {getEstadoLabel(estado)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Observacion (opcional)
              </label>
              <Textarea
                value={nuevaObservacion}
                onChange={(e) => setNuevaObservacion(e.target.value)}
                rows={3}
                placeholder="Escribe un comentario..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Imagenes (opcional, max. 10)
              </label>
              <label className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Seleccionar imagenes</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length + imagenesEvento.length > 10) {
                      toast.error("Maximo 10 imagenes permitidas");
                      return;
                    }
                    setImagenesEvento((prev) => [...prev, ...files]);
                  }}
                />
              </label>

              {imagenesEvento.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {imagenesEvento.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded-md border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => setShowModal(false)}
              disabled={agregando}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={handleAgregarEvento}
              disabled={agregando}
            >
              {agregando ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Collapsible section row ──

interface SectionRowProps {
  icon: React.ReactNode;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SectionRow: React.FC<SectionRowProps> = ({
  icon,
  title,
  summary,
  open,
  onToggle,
  children,
}) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/50 transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-sm text-muted-foreground flex-1 truncate">
        {summary}
      </span>
      <ChevronDown
        className={`w-4 h-4 text-muted-foreground transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
    {open && <div className="px-5 pb-4 border-t border-border pt-3">{children}</div>}
  </div>
);

export default GarantiaDetalle;
