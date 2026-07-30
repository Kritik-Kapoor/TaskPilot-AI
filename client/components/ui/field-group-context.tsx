"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type FieldState = {
  order: number;
  isInvalid: boolean;
  errors?: Array<{ message?: string } | undefined>;
};

type FieldGroupCtx = {
  register: (id: string) => () => void;
  update: (id: string, state: Pick<FieldState, "isInvalid" | "errors">) => void;
};

const FieldGroupContext = createContext<FieldGroupCtx | null>(null);

export const useFieldGroupContext = () => useContext(FieldGroupContext);

export function useFieldGroupState() {
  const [fields, setFields] = useState<Map<string, FieldState>>(new Map());
  const orderRef = useRef(0);

  const register = useCallback((id: string) => {
    const order = orderRef.current++;
    setFields((prev) => new Map(prev).set(id, { order, isInvalid: false }));
    return () =>
      setFields((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
  }, []);

  const update = useCallback(
    (id: string, state: Pick<FieldState, "isInvalid" | "errors">) => {
      setFields((prev) => {
        const existing = prev.get(id);
        if (!existing) return prev;
        return new Map(prev).set(id, { ...existing, ...state });
      });
    },
    [],
  );

  const ctx = useMemo<FieldGroupCtx>(() => ({ register, update }), [register, update]);

  const sortedFields = useMemo(
    () => [...fields.values()].sort((a, b) => a.order - b.order),
    [fields],
  );

  return { ctx, sortedFields };
}

export function FieldGroupContextProvider({
  ctx,
  children,
}: {
  ctx: FieldGroupCtx;
  children: React.ReactNode;
}) {
  return (
    <FieldGroupContext.Provider value={ctx}>{children}</FieldGroupContext.Provider>
  );
}

export type { FieldState, FieldGroupCtx };
