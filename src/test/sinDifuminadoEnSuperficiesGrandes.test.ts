// Guarda contra el regreso de `backdrop-blur` en superficies grandes.
//
// En macOS 26, WKWebView (wry 0.55) a veces deja de presentar cuadros tras el
// reposo o un cambio de pantalla (tauri-apps/wry#1848). Lo que queda visible
// es la capa con `backdrop-filter`, sin el contenido: la "ventana difuminada
// vacía". Un telón a pantalla completa o una barra fija con blur convierte
// ese fallo en una ventana inutilizable, así que en superficies grandes se
// usan fondos opacos o semiopacos sin filtro.
//
// Regla: ningún `backdrop-blur` en el código, salvo los elementos pequeños
// listados abajo uno por uno (botones redondos y etiquetas sobre una imagen
// en el lightbox y en las miniaturas). Si esos se quedaran solos se vería un
// círculo borroso, no la ventana entera. Todo lo demás —telones, barras
// fijas, diálogos, tarjetas grandes— usa fondo opaco o semiopaco sin filtro.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(__dirname, "..");

function archivosTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivosTsx(ruta);
    return /\.(tsx?|css)$/.test(nombre) && !/\.test\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

// Elementos pequeños a los que se les permite conservar el blur.
const PERMITIDOS: Array<{ archivo: string; fragmento: string }> = [
  // Lightbox: píldoras y botones redondos sobre la foto, y la nota pequeña.
  { archivo: "VentaImagenLightbox.tsx", fragmento: "rounded-full" },
  { archivo: "VentaImagenLightbox.tsx", fragmento: "max-w-xs rounded-lg" },
  // Miniatura editable: botones de 28 px y la franja del pie de la miniatura.
  { archivo: "ImagenTileEditable.tsx", fragmento: "h-7 w-7" },
  { archivo: "ImagenTileEditable.tsx", fragmento: "absolute bottom-0 left-0 right-0" },
];

function permitido(archivo: string, linea: string): boolean {
  return PERMITIDOS.some((p) => archivo.endsWith(p.archivo) && linea.includes(p.fragmento));
}

function infractoresEn(archivo: string, contenido: string): string[] {
  return contenido.split("\n").flatMap((linea, i) =>
    linea.includes("backdrop-blur") && !permitido(archivo, linea)
      ? [`${archivo}:${i + 1}`]
      : [],
  );
}

describe("sin backdrop-blur en superficies grandes", () => {
  it("sólo los elementos pequeños permitidos conservan el blur", () => {
    const infractores = archivosTsx(RAIZ).flatMap((archivo) =>
      infractoresEn(relative(RAIZ, archivo), readFileSync(archivo, "utf8")),
    );
    expect(infractores).toEqual([]);
  });

  it("control positivo: detecta un telón con blur y deja pasar un botón permitido", () => {
    expect(
      infractoresEn("x/AgregarVendedorPanel.tsx", 'className="fixed inset-0 bg-background/60 backdrop-blur-sm"'),
    ).toHaveLength(1);
    expect(
      infractoresEn("x/VentaImagenLightbox.tsx", 'className="h-9 w-9 rounded-full bg-white/10 backdrop-blur"'),
    ).toHaveLength(0);
  });
});
