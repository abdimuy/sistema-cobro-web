import { describe, it, expect, vi, beforeEach } from "vitest";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import {
  guardarReporte,
  imprimirReporte,
  nombreArchivoReporte,
  slugifyNombre,
} from "./reporteActions";

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: vi.fn() }));
vi.mock("@tauri-apps/plugin-fs", () => ({ writeFile: vi.fn() }));

const mockSave = vi.mocked(save);
const mockWriteFile = vi.mocked(writeFile);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("slugifyNombre", () => {
  it("strips accents and collapses non-alphanumerics to underscores", () => {
    expect(slugifyNombre("Minerva López Merino")).toBe("Minerva_Lopez_Merino");
  });

  it("falls back to 'cliente' when nothing usable remains", () => {
    expect(slugifyNombre("—  —")).toBe("cliente");
  });
});

describe("nombreArchivoReporte", () => {
  it("builds Reporte_<slug>_<fecha>.pdf", () => {
    expect(nombreArchivoReporte("Juan Pérez", "2026-06-30")).toBe(
      "Reporte_Juan_Perez_2026-06-30.pdf",
    );
  });
});

describe("imprimirReporte", () => {
  it("calls print on the iframe's content window", () => {
    const print = vi.fn();
    const iframe = {
      contentWindow: { print },
    } as unknown as HTMLIFrameElement;
    imprimirReporte(iframe);
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when the iframe is null", () => {
    expect(() => imprimirReporte(null)).not.toThrow();
  });
});

describe("guardarReporte", () => {
  // jsdom's Blob lacks arrayBuffer(); WebView2/Chromium has it. Stub a blob-like
  // so the test exercises the write path without depending on the environment.
  const blob = {
    arrayBuffer: async () => new TextEncoder().encode("%PDF-1.4 fake").buffer,
  } as unknown as Blob;

  it("writes the PDF bytes to the chosen path and returns it", async () => {
    mockSave.mockResolvedValue("/Users/x/Reporte.pdf");

    const path = await guardarReporte(blob, "Ana Ruiz", "2026-06-30");

    expect(path).toBe("/Users/x/Reporte.pdf");
    expect(mockSave).toHaveBeenCalledWith({
      defaultPath: "Reporte_Ana_Ruiz_2026-06-30.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const [writtenPath, bytes] = mockWriteFile.mock.calls[0];
    expect(writtenPath).toBe("/Users/x/Reporte.pdf");
    expect(bytes).toBeInstanceOf(Uint8Array);
  });

  it("returns null and does not write when the user cancels", async () => {
    mockSave.mockResolvedValue(null);

    const path = await guardarReporte(blob, "Ana Ruiz", "2026-06-30");

    expect(path).toBeNull();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
