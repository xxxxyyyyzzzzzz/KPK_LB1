import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { getFirebase, LOCAL_MODE } from "@/lib/firebase";

export function useServerTimeOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (LOCAL_MODE) return;
    const fb = getFirebase(); if (!fb) return;
    const r = ref(fb.db, ".info/serverTimeOffset");
    const off = onValue(r, (snap) => setOffset(snap.val() ?? 0));
    return () => off();
  }, []);
  return offset;
}
