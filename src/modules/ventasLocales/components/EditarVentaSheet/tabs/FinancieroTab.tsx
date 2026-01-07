import { DollarSign, CreditCard, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinancieroFormData, ValidationError } from "../types";

// ============================================================================
// Types
// ============================================================================

interface FinancieroTabProps {
  data: FinancieroFormData;
  errors: ValidationError[];
  onUpdate: (field: keyof FinancieroFormData, value: FinancieroFormData[keyof FinancieroFormData]) => void;
}

// ============================================================================
// Constants
// ============================================================================

const FRECUENCIAS_PAGO = [
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
];

const TIPOS_VENTA = [
  { value: "CONTADO", label: "Contado" },
  { value: "CREDITO", label: "Crédito" },
];

const DIAS_SEMANA = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

// Normaliza el día quitando acentos para comparación
const normalizeDia = (dia: string): string => {
  if (!dia) return "";
  return dia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

// ============================================================================
// Helpers
// ============================================================================

const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find((e) => e.field === field)?.message;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
};

// ============================================================================
// Component
// ============================================================================

const FinancieroTab = ({ data, errors, onUpdate }: FinancieroTabProps) => {
  const isCredito = data.tipoVenta === "CREDITO";

  const handleNumberChange = (
    field: keyof FinancieroFormData,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    onUpdate(field, numValue);
  };

  return (
    <div className="space-y-6">
      {/* Tipo de Venta y Total */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <DollarSign className="h-4 w-4 text-green-600" />
          Información de Venta
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Venta */}
          <div className="space-y-2">
            <Label htmlFor="tipoVenta" className="text-sm font-medium">
              Tipo de Venta
            </Label>
            <Select
              value={data.tipoVenta}
              onValueChange={(value) => onUpdate("tipoVenta", value as FinancieroFormData["tipoVenta"])}
            >
              <SelectTrigger id="tipoVenta">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_VENTA.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Precio Total */}
          <div className="space-y-2">
            <Label htmlFor="precioTotal" className="text-sm font-medium">
              Precio Total <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="precioTotal"
                type="number"
                min="0"
                step="0.01"
                value={data.precioTotal || ""}
                onChange={(e) => handleNumberChange("precioTotal", e.target.value)}
                className={`pl-7 ${getFieldError(errors, "precioTotal") ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            {getFieldError(errors, "precioTotal") && (
              <p className="text-xs text-red-500">{getFieldError(errors, "precioTotal")}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Información de Crédito */}
      {isCredito && (
        <fieldset className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <legend className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <CreditCard className="h-4 w-4 text-orange-600" />
            Información de Crédito
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enganche */}
            <div className="space-y-2">
              <Label htmlFor="enganche" className="text-sm font-medium">
                Enganche
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="enganche"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.enganche || ""}
                  onChange={(e) => handleNumberChange("enganche", e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Parcialidad */}
            <div className="space-y-2">
              <Label htmlFor="parcialidad" className="text-sm font-medium">
                Parcialidad <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="parcialidad"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.parcialidad || ""}
                  onChange={(e) => handleNumberChange("parcialidad", e.target.value)}
                  className={`pl-7 ${getFieldError(errors, "parcialidad") ? "border-red-500" : ""}`}
                  placeholder="0.00"
                />
              </div>
              {getFieldError(errors, "parcialidad") && (
                <p className="text-xs text-red-500">{getFieldError(errors, "parcialidad")}</p>
              )}
            </div>

            {/* Frecuencia de Pago */}
            <div className="space-y-2">
              <Label htmlFor="frecPago" className="text-sm font-medium">
                Frecuencia de Pago <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.frecPago}
                onValueChange={(value) => onUpdate("frecPago", value as FinancieroFormData["frecPago"])}
              >
                <SelectTrigger
                  id="frecPago"
                  className={getFieldError(errors, "frecPago") ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Seleccionar frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  {FRECUENCIAS_PAGO.map((frec) => (
                    <SelectItem key={frec.value} value={frec.value}>
                      {frec.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError(errors, "frecPago") && (
                <p className="text-xs text-red-500">{getFieldError(errors, "frecPago")}</p>
              )}
            </div>

            {/* Día de Cobranza */}
            <div className="space-y-2">
              <Label htmlFor="diaCobranza" className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Día de Cobranza
              </Label>
              <Select
                value={normalizeDia(data.diaCobranza)}
                onValueChange={(value) => onUpdate("diaCobranza", value)}
              >
                <SelectTrigger id="diaCobranza">
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>
      )}

      {/* Corto Plazo */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <Calendar className="h-4 w-4 text-purple-600" />
          Información a Corto Plazo
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monto a Corto Plazo */}
          <div className="space-y-2">
            <Label htmlFor="montoACortoPlazo" className="text-sm font-medium">
              Monto a Corto Plazo
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="montoACortoPlazo"
                type="number"
                min="0"
                step="0.01"
                value={data.montoACortoPlazo || ""}
                onChange={(e) => handleNumberChange("montoACortoPlazo", e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Tiempo a Corto Plazo */}
          <div className="space-y-2">
            <Label htmlFor="tiempoACortoPlazoMeses" className="text-sm font-medium">
              Plazo (meses)
            </Label>
            <Input
              id="tiempoACortoPlazoMeses"
              type="number"
              min="0"
              max="120"
              value={data.tiempoACortoPlazoMeses || ""}
              onChange={(e) => handleNumberChange("tiempoACortoPlazoMeses", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </fieldset>

      {/* Nota */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <FileText className="h-4 w-4 text-gray-600" />
          Notas
        </legend>

        <div className="space-y-2">
          <Label htmlFor="nota" className="text-sm font-medium">
            Nota adicional
          </Label>
          <Textarea
            id="nota"
            value={data.nota}
            onChange={(e) => onUpdate("nota", e.target.value)}
            placeholder="Escribe una nota adicional sobre esta venta..."
            rows={3}
            className="resize-none"
          />
        </div>
      </fieldset>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Resumen Financiero</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-gray-600">Precio Total:</div>
          <div className="font-semibold text-green-600 text-right">
            {formatCurrency(data.precioTotal)}
          </div>

          {isCredito && (
            <>
              <div className="text-gray-600">Enganche:</div>
              <div className="font-medium text-right">{formatCurrency(data.enganche)}</div>

              <div className="text-gray-600">Parcialidad:</div>
              <div className="font-medium text-right">{formatCurrency(data.parcialidad)}</div>

              <div className="text-gray-600">Saldo a financiar:</div>
              <div className="font-medium text-right text-orange-600">
                {formatCurrency(data.precioTotal - data.enganche)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancieroTab;
