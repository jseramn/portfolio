import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Surface = "human" | "agent";
export type WindowId = "docs" | "changelog";

type SurfaceApi = {
  surface: Surface;
  setSurface: (next: Surface) => void;
};

type WindowApi = {
  id: WindowId | null;
  open: (id: WindowId) => void;
  close: () => void;
};

const SurfaceCtx = createContext<SurfaceApi | null>(null);
const WindowCtx = createContext<WindowApi | null>(null);

function readSearch(): URLSearchParams {
  return new URL(window.location.href).searchParams;
}

function writeSearch(mutate: (params: URLSearchParams) => void) {
  const url = new URL(window.location.href);
  mutate(url.searchParams);
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.pushState({}, "", next);
}

function surfaceFromSearch(): Surface {
  return readSearch().get("surface") === "agent" ? "agent" : "human";
}

function windowFromSearch(): WindowId | null {
  const value = readSearch().get("w");
  return value === "docs" || value === "changelog" ? value : null;
}

export function SurfaceProvider({ children }: { children: ReactNode }) {
  const [surface, setSurfaceState] = useState<Surface>(surfaceFromSearch);
  useEffect(() => {
    const onPop = () => setSurfaceState(surfaceFromSearch());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const setSurface = useCallback((next: Surface) => {
    writeSearch((params) => {
      if (next === "agent") params.set("surface", "agent");
      else params.delete("surface");
    });
    setSurfaceState(next);
  }, []);
  const value = useMemo(() => ({ surface, setSurface }), [surface, setSurface]);
  return <SurfaceCtx.Provider value={value}>{children}</SurfaceCtx.Provider>;
}

export function WindowProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<WindowId | null>(windowFromSearch);
  useEffect(() => {
    const onPop = () => setId(windowFromSearch());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const open = useCallback((next: WindowId) => {
    writeSearch((params) => {
      params.set("w", next);
    });
    setId(next);
  }, []);
  const close = useCallback(() => {
    writeSearch((params) => {
      params.delete("w");
    });
    setId(null);
  }, []);
  const value = useMemo(() => ({ id, open, close }), [id, open, close]);
  return <WindowCtx.Provider value={value}>{children}</WindowCtx.Provider>;
}

export function useSurface(): SurfaceApi {
  const ctx = useContext(SurfaceCtx);
  if (!ctx) throw new Error("useSurface requires SurfaceProvider");
  return ctx;
}

export function useWindow(): WindowApi {
  const ctx = useContext(WindowCtx);
  if (!ctx) throw new Error("useWindow requires WindowProvider");
  return ctx;
}

export function ShellProviders({ children }: { children: ReactNode }) {
  return (
    <SurfaceProvider>
      <WindowProvider>{children}</WindowProvider>
    </SurfaceProvider>
  );
}
