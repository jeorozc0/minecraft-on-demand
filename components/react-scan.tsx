"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { JSX, useEffect } from "react";

const enabled = (process.env.NEXT_PUBLIC_REACT_SCAN_ENABLED ?? "") === "true";

export function ReactScan(): JSX.Element {
  useEffect(() => {
    scan({ enabled });
  }, []);

  return <></>;
}
