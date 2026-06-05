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
  precioTotalCalculado: number;
  montoACortoPlazoCalculado: number;
  totalContadoCalculado: number;
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

const DIAS_SEMANA: Array<{ value: FinancieroFormData["diaCobranzaSemana"]; label: string }> = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

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

const FinancieroTab = ({
  data,
  errors,
  precioTotalCalculado,
  montoACortoPlazoCalculado,
  totalContadoCalculado,
  onUpdate,
}: FinancieroTabProps) => {
  const isCredito = data.tipoVenta === "CREDITO";
  const isMensual = data.frecPago === "MENSUAL";

  const handleFrecPagoChange = (value: string) => {
    onUpdate("frecPago", value as FinancieroFormData["frecPago"]);
    // Clear the day field that no longer applies
    if (value === "MENSUAL") {
      onUpdate("diaCobranzaSemana", "");
    } else {
      onUpdate("diaCobranzaMes", 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Totales Calculados */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Totales Calculados</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Precio Lista */}
          <div className="bg-card rounded-lg p-3 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">Precio Lista</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(precioTotalCalculado)}
            </p>
          </div>
          {/* Corto Plazo */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800 text-center">
            <p className="text-xs text-blue-600 mb-1">Corto Plazo</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(montoACortoPlazoCalculado)}
            </p>
          </div>
          {/* Contado */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800 text-center">
            <p className="text-xs text-green-600 mb-1">Contado</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(totalContadoCalculado)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2 text-center">
          Calculados automáticamente de la suma de productos
        </p>
      </div>

      {/* Montos editables */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <DollarSign className="h-4 w-4 text-blue-600" />
          Montos
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Monto Anual */}
          <div className="space-y-2">
            <Label htmlFor="montoAnual" className="text-sm font-medium">
              Monto Lista
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="montoAnual"
                type="text"
                inputMode="decimal"
                value={data.montoAnual}
                onChange={(e) => onUpdate("montoAnual", e.target.value)}
                className={`pl-7 ${getFieldError(errors, "financiero.montoAnual") ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground/60">
              Calculado: {formatCurrency(precioTotalCalculado)}
            </p>
            {getFieldError(errors, "financiero.montoAnual") && (
              <p className="text-xs text-red-500">{getFieldError(errors, "financiero.montoAnual")}</p>
            )}
          </div>

          {/* Monto Corto Plazo */}
          <div className="space-y-2">
            <Label htmlFor="montoCortoPlazo" className="text-sm font-medium">
              Monto Corto Plazo
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="montoCortoPlazo"
                type="text"
                inputMode="decimal"
                value={data.montoCortoPlazo}
                onChange={(e) => onUpdate("montoCortoPlazo", e.target.value)}
                className={`pl-7 ${getFieldError(errors, "financiero.montoCortoPlazo") ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground/60">
              Calculado: {formatCurrency(montoACortoPlazoCalculado)}
            </p>
            {getFieldError(errors, "financiero.montoCortoPlazo") && (
              <p className="text-xs text-red-500">{getFieldError(errors, "financiero.montoCortoPlazo")}</p>
            )}
          </div>

          {/* Monto Contado */}
          <div className="space-y-2">
            <Label htmlFor="montoContado" className="text-sm font-medium">
              Monto Contado
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="montoContado"
                type="text"
                inputMode="decimal"
                value={data.montoContado}
                onChange={(e) => onUpdate("montoContado", e.target.value)}
                className={`pl-7 ${getFieldError(errors, "financiero.montoContado") ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground/60">
              Calculado: {formatCurrency(totalContadoCalculado)}
            </p>
            {getFieldError(errors, "financiero.montoContado") && (
              <p className="text-xs text-red-500">{getFieldError(errors, "financiero.montoContado")}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Tipo de Venta */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <CreditCard className="h-4 w-4 text-blue-600" />
          Tipo de Venta
        </legend>

        <div className="space-y-2">
          <Label htmlFor="tipoVenta" className="text-sm font-medium">
            Tipo de Venta
          </Label>
          <Select
            value={data.tipoVenta}
            disabled
          >
            <SelectTrigger
              id="tipoVenta"
              title="Para cambiar tipo de venta, cancelá y creá una nueva"
              className="opacity-70 cursor-not-allowed"
            >
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
          <p className="text-xs text-muted-foreground/60">
            Para cambiar tipo de venta, cancelá y creá una nueva.
          </p>
        </div>
      </fieldset>

      {/* Información de Crédito */}
      {isCredito && (
        <fieldset className="space-y-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <legend className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="enganche"
                  type="text"
                  inputMode="decimal"
                  value={data.enganche}
                  onChange={(e) => onUpdate("enganche", e.target.value)}
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="parcialidad"
                  type="text"
                  inputMode="decimal"
                  value={data.parcialidad}
                  onChange={(e) => onUpdate("parcialidad", e.target.value)}
                  className={`pl-7 ${getFieldError(errors, "financiero.parcialidad") ? "border-red-500" : ""}`}
                  placeholder="0.00"
                />
              </div>
              {getFieldError(errors, "financiero.parcialidad") && (
                <p className="text-xs text-red-500">{getFieldError(errors, "financiero.parcialidad")}</p>
              )}
            </div>

            {/* Frecuencia de Pago */}
            <div className="space-y-2">
              <Label htmlFor="frecPago" className="text-sm font-medium">
                Frecuencia de Pago <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.frecPago}
                onValueChange={handleFrecPagoChange}
              >
                <SelectTrigger
                  id="frecPago"
                  className={getFieldError(errors, "financiero.frecPago") ? "border-red-500" : ""}
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
              {getFieldError(errors, "financiero.frecPago") && (
                <p className="text-xs text-red-500">{getFieldError(errors, "financiero.frecPago")}</p>
              )}
            </div>

            {/* Día de Cobranza */}
            <div className="space-y-2">
              <Label htmlFor="diaCobranza" className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Día de Cobranza
              </Label>
              {isMensual ? (
                <Input
                  id="diaCobranzaMes"
                  type="number"
                  min={1}
                  max={31}
                  value={data.diaCobranzaMes || ""}
                  onChange={(e) => onUpdate("diaCobranzaMes", parseInt(e.target.value, 10) || 0)}
                  placeholder="Día del mes (1-31)"
                  className={getFieldError(errors, "financiero.diaCobranzaMes") ? "border-red-500" : ""}
                />
              ) : (
                <Select
                  value={data.diaCobranzaSemana}
                  onValueChange={(value) =>
                    onUpdate("diaCobranzaSemana", value as FinancieroFormData["diaCobranzaSemana"])
                  }
                >
                  <SelectTrigger
                    id="diaCobranzaSemana"
                    className={getFieldError(errors, "financiero.diaCobranzaSemana") ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value as string}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {getFieldError(errors, "financiero.diaCobranzaMes") && (
                <p className="text-xs text-red-500">{getFieldError(errors, "financiero.diaCobranzaMes")}</p>
              )}
              {getFieldError(errors, "financiero.diaCobranzaSemana") && (
                <p className="text-xs text-red-500">{getFieldError(errors, "financiero.diaCobranzaSemana")}</p>
              )}
            </div>
          </div>
        </fieldset>
      )}

      {/* Plazo */}
      <div className="space-y-2">
        <Label htmlFor="plazoMeses" className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-purple-600" />
          Plazo a Corto Plazo (meses)
        </Label>
        <Input
          id="plazoMeses"
          type="number"
          min="0"
          max="120"
          value={data.plazoMeses || ""}
          onChange={(e) => onUpdate("plazoMeses", parseInt(e.target.value, 10) || 0)}
          placeholder="0"
        />
      </div>

      {/* Nota */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
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

      {/* Resumen de crédito */}
      {isCredito && (
        <div className="bg-muted rounded-lg p-4 border">
          <h4 className="text-sm font-semibold text-foreground mb-3">Resumen de Crédito</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-muted-foreground">Precio Lista:</div>
            <div className="font-semibold text-green-600 text-right">
              {formatCurrency(precioTotalCalculado)}
            </div>

            <div className="text-muted-foreground">Enganche:</div>
            <div className="font-medium text-right">
              {formatCurrency(parseFloat(data.enganche) || 0)}
            </div>

            <div className="text-muted-foreground">Parcialidad:</div>
            <div className="font-medium text-right">
              {formatCurrency(parseFloat(data.parcialidad) || 0)}
            </div>

            <div className="text-muted-foreground font-medium">Saldo a financiar:</div>
            <div className="font-semibold text-right text-orange-600">
              {formatCurrency(precioTotalCalculado - (parseFloat(data.enganche) || 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancieroTab;
