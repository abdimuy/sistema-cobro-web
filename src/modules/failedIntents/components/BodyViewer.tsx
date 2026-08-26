import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileWarning, Braces, Paperclip } from "lucide-react";
import type { BlobPart, FailedIntent } from "../domain/entities";
import { LINEA, SUPERFICIE_2, TEXTO_2 } from "./paleta";

// BodyViewer muestra el cuerpo capturado de la petición.
//
//   • Intentos JSON: se imprime con sangría.
//   • Intentos multipart: el cuerpo NO viene en la fila —vive en disco— pero
//     sus partes sí se pueden leer, y son las MISMAS que ya se pidieron para
//     pintar las fotos. Se muestran los campos con su contenido y los archivos
//     como manifiesto, sin bytes.
//
// Por qué las partes llegan por props y no de un hook propio: `useBlobParts`
// no comparte caché entre consumidores, así que un segundo hook aquí haría una
// SEGUNDA petición de `blob-parts` por cada renglón abierto. La pantalla la
// pide una vez y la reparte. Es la misma regla que gobierna el listado, un
// nivel más abajo.
export function BodyViewer({
  intent,
  partes,
}: {
  intent: FailedIntent;
  partes?: ReadonlyArray<BlobPart>;
}) {
  if (intent.hasBlob) {
    return <MultipartBody intent={intent} partes={partes} />;
  }
  return <JsonBody body={intent.body} truncated={intent.bodyTruncated} />;
}

function MultipartBody({
  intent,
  partes,
}: {
  intent: FailedIntent;
  partes?: ReadonlyArray<BlobPart>;
}) {
  const campos = (partes ?? []).filter((p) => p.kind.isField());
  const archivos = (partes ?? []).filter((p) => !p.kind.isField());

  return (
    <div className="flex flex-col gap-2.5" data-testid="multipart-body">
      <div className={`rounded-sm border ${LINEA} ${SUPERFICIE_2} px-3 py-2`}>
        <div className={`flex items-center gap-1.5 text-xs ${TEXTO_2}`}>
          <FileWarning className="h-3 w-3 shrink-0" />
          <span>Subida multipart — el cuerpo original está en disco</span>
        </div>
        {intent.bodyContentType && (
          <p className="text-[11px] font-mono mt-1 break-all">{intent.bodyContentType}</p>
        )}
      </div>

      {partes === undefined ? (
        <p className={`text-[11.5px] ${TEXTO_2}`}>Leyendo las partes…</p>
      ) : (
        <>
          {campos.map((p) => (
            <CampoMultipart key={p.index} parte={p} />
          ))}
          {archivos.length > 0 && <ManifiestoDeArchivos archivos={archivos} />}
          {campos.length === 0 && archivos.length === 0 && (
            <p className={`text-[11.5px] ${TEXTO_2}`} data-testid="multipart-sin-partes">
              No se pudieron leer las partes del cuerpo
            </p>
          )}
        </>
      )}
    </div>
  );
}

// CampoMultipart pinta un campo con su contenido. El JSON se formatea; lo que
// no sea JSON se muestra tal cual, sin fingir que lo es.
function CampoMultipart({ parte }: { parte: BlobPart }) {
  const texto = useMemo(() => decodificar(parte.value), [parte.value]);
  const bonito = useMemo(() => formatearSiEsJSON(texto), [texto]);

  return (
    <div
      className={`rounded-sm border ${LINEA} ${SUPERFICIE_2} overflow-hidden`}
      data-testid={`multipart-campo-${parte.name ?? parte.index}`}
    >
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 border-b ${LINEA} bg-card`}>
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <Braces className={`h-3 w-3 shrink-0 ${TEXTO_2}`} />
          <span className="font-mono truncate">{parte.name ?? `parte ${parte.index}`}</span>
        </div>
        <span className={`text-[10px] ${TEXTO_2} shrink-0 tabular-nums`}>{tamano(parte.sizeBytes)}</span>
      </div>
      <ScrollArea className="max-h-[320px]">
        <pre className="px-3 py-2.5 text-[11.5px] font-mono leading-relaxed whitespace-pre-wrap break-all">
          {bonito}
        </pre>
      </ScrollArea>
    </div>
  );
}

// ManifiestoDeArchivos lista los archivos SIN sus bytes. Las fotos ya se ven
// arriba, en su propia sección; aquí sólo hace falta saber qué llegó y cuánto
// pesa, que es lo que una persona compara contra lo que el vendedor dice que
// capturó.
function ManifiestoDeArchivos({ archivos }: { archivos: ReadonlyArray<BlobPart> }) {
  return (
    <div className={`rounded-sm border ${LINEA} ${SUPERFICIE_2} overflow-hidden`}>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 border-b ${LINEA} bg-card text-xs ${TEXTO_2}`}>
        <Paperclip className="h-3 w-3" />
        <span>
          {archivos.length} {archivos.length === 1 ? "archivo" : "archivos"}
        </span>
      </div>
      <ul className="px-3 py-2 flex flex-col gap-1">
        {archivos.map((p) => (
          <li
            key={p.index}
            className="flex items-baseline justify-between gap-3 text-[11.5px]"
            data-testid={`multipart-archivo-${p.index}`}
          >
            <span className="font-mono truncate">{p.filename ?? p.name ?? `parte ${p.index}`}</span>
            <span className={`${TEXTO_2} shrink-0 tabular-nums`}>
              {p.contentType} · {tamano(p.sizeBytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JsonBody({ body, truncated }: { body: unknown; truncated: boolean }) {
  const pretty = useMemo(() => {
    if (body === null || body === undefined) return "null";
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }, [body]);

  return (
    <div className={`rounded-sm border ${LINEA} ${SUPERFICIE_2} overflow-hidden`}>
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${LINEA} bg-card`}>
        <div className={`flex items-center gap-1.5 text-xs ${TEXTO_2}`}>
          <Braces className="h-3 w-3" />
          <span>application/json</span>
        </div>
        {truncated && (
          <span className="text-[10px] uppercase tracking-wider text-destructive">truncado</span>
        )}
      </div>
      <ScrollArea className="max-h-[420px]">
        <pre className="px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
          {pretty}
        </pre>
      </ScrollArea>
    </div>
  );
}

// decodificar pasa los bytes del campo a texto. UTF-8 sin `fatal`: un byte
// inválido sale como carácter de reemplazo en vez de reventar el panel — el
// resto del campo sigue siendo legible, que es lo que importa aquí.
function decodificar(bytes: Uint8Array | null): string {
  if (!bytes || bytes.length === 0) return "";
  return new TextDecoder("utf-8").decode(bytes);
}

// formatearSiEsJSON imprime con sangría cuando el campo ES JSON, y devuelve el
// texto intacto cuando no. No se adivina: un campo de formulario suelto no
// tiene por qué parecerse a un objeto.
function formatearSiEsJSON(texto: string): string {
  const limpio = texto.trim();
  if (limpio === "") return "(vacío)";
  if (!limpio.startsWith("{") && !limpio.startsWith("[")) return texto;
  try {
    return JSON.stringify(JSON.parse(limpio), null, 2);
  } catch {
    return texto;
  }
}

function tamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
