import { useState, useCallback } from "react";
import {
  updateVentaLocal,
  UpdateVentaLocalRequest,
  UpdateVentaLocalResponse,
  UpdateVentaError,
} from "../services/api/updateVentaLocal";

// ============================================================================
// Types
// ============================================================================

interface UseUpdateVentaLocalState {
  loading: boolean;
  error: UpdateVentaError | null;
  data: UpdateVentaLocalResponse | null;
}

interface UseUpdateVentaLocalReturn extends UseUpdateVentaLocalState {
  update: (request: UpdateVentaLocalRequest) => Promise<UpdateVentaLocalResponse>;
  reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

const useUpdateVentaLocal = (): UseUpdateVentaLocalReturn => {
  const [state, setState] = useState<UseUpdateVentaLocalState>({
    loading: false,
    error: null,
    data: null,
  });

  const update = useCallback(
    async (request: UpdateVentaLocalRequest): Promise<UpdateVentaLocalResponse> => {
      setState({ loading: true, error: null, data: null });

      try {
        const response = await updateVentaLocal(request);
        setState({ loading: false, error: null, data: response });
        return response;
      } catch (error) {
        const updateError =
          error instanceof UpdateVentaError
            ? error
            : new UpdateVentaError(
                error instanceof Error ? error.message : "Error desconocido"
              );

        setState({ loading: false, error: updateError, data: null });
        throw updateError;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    update,
    reset,
  };
};

export default useUpdateVentaLocal;
