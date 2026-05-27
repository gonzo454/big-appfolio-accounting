"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import type { AnalyzedData } from "./appfolio";

type State = {
  data: AnalyzedData | null;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; data: AnalyzedData }
  | { type: "fetch_error"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch_start":
      return { ...state, loading: true, error: null };
    case "fetch_success":
      return { data: action.data, loading: false, error: null };
    case "fetch_error":
      return { ...state, loading: false, error: action.error };
  }
}

export function useAppFolioData(initialPeriod: "mtd" | "ytd" = "mtd") {
  const [period, setPeriod] = useState(initialPeriod);
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: "fetch_start" });

    fetch(`/api/appfolio?period=${period}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) dispatch({ type: "fetch_success", data: json });
      })
      .catch((err) => {
        if (!cancelled)
          dispatch({
            type: "fetch_error",
            error: err instanceof Error ? err.message : "Failed to load data",
          });
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const changePeriod = useCallback((p: "mtd" | "ytd") => {
    setPeriod(p);
  }, []);

  return { ...state, period, changePeriod };
}
