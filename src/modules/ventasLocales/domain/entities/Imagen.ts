export type ImagenExistente = {
  kind: "existing";
  id: string;
  storageKind: string;
  storageKey: string;
  mime: string;
  sizeBytes: number;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type ImagenNueva = {
  kind: "new";
  id: string;         // client-side UUID for tracking before upload
  file: File;
  descripcion: string;
  previewUrl: string; // URL.createObjectURL — caller is responsible for revoking
};

export type ImagenAEliminar = {
  kind: "to-delete";
  id: string;         // server id of the existing image being removed
  storageKey: string; // kept for display while pending deletion
  mime: string;
  descripcion: string | null;
};

export type Imagen = ImagenExistente | ImagenNueva | ImagenAEliminar;

export const Imagen = {
  fromExistente(input: Omit<ImagenExistente, "kind">): ImagenExistente {
    return { kind: "existing", ...input };
  },

  fromNueva(input: { id: string; file: File; descripcion: string }): ImagenNueva {
    return { kind: "new", ...input, previewUrl: URL.createObjectURL(input.file) };
  },

  markForDeletion(img: ImagenExistente): ImagenAEliminar {
    return {
      kind: "to-delete",
      id: img.id,
      storageKey: img.storageKey,
      mime: img.mime,
      descripcion: img.descripcion,
    };
  },
};
