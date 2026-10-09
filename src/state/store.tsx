import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Appointment, Data } from "../types";
import {
  readData,
  saveData,
  STORAGE_KEY,
  storageFailed,
  validData,
} from "../lib/storage";
import { seed } from "../lib/seed";
import { isAvailable } from "../lib/availability";
import { nowClock } from "../lib/dates";
import { validPhone } from "../lib/whatsapp";
const Context = createContext<Store | null>(null);
type Store = {
  data: Data;
  update: (fn: (d: Data) => Data) => void;
  book: (a: Appointment, excludeId?: string) => Promise<boolean>;
  reset: () => void;
  notice: string;
  toast: (s: string) => void;
  newIds: string[];
  clearNew: () => void;
  memoryOnly: boolean;
};
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(readData);
  const current = useRef(data);
  const [notice, setNotice] = useState("");
  const [newIds, setNewIds] = useState<string[]>([]);
  const channel = useRef<BroadcastChannel | null>(null);
  const [memoryOnly, setMemoryOnly] = useState(storageFailed());
  const toast = (message: string) => setNotice(message);
  const clearNew = useCallback(() => setNewIds([]), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    saveData(current.current);
    setMemoryOnly(storageFailed());
    const receive = (next: Data) => {
      const fresh = next.appointments.filter(
        (a) =>
          a.source === "client" &&
          !current.current.appointments.some((old) => old.id === a.id),
      );
      current.current = next;
      setData(next);
      if (fresh.length) {
        setNewIds((ids) => [...ids, ...fresh.map((a) => a.id)]);
        setNotice("Novo agendamento recebido: " + fresh[0].name);
      }
    };
    try {
      channel.current = new BroadcastChannel(STORAGE_KEY);
      channel.current.onmessage = (event: MessageEvent<unknown>) => {
        if (validData(event.data)) {
          saveData(event.data);
          receive(event.data);
        }
      };
    } catch {
      /* storage event remains available */
    }
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const value: unknown = JSON.parse(event.newValue);
          if (validData(value)) receive(value);
        } catch {
          /* ignore malformed data */
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => {
      channel.current?.close();
      window.removeEventListener("storage", handler);
    };
  }, []);
  function update(fn: (d: Data) => Data) {
    const next = fn(readData());
    saveData(next);
    current.current = next;
    setData(next);
    setMemoryOnly(storageFailed());
    try {
      channel.current?.postMessage(next);
    } catch {
      /* memory fallback */
    }
  }
  async function book(a: Appointment, excludeId?: string): Promise<boolean> {
    const commit = () => {
      const latest = readData();
      const service = latest.services.find(
        (s) => s.id === a.serviceId && s.active,
      );
      if (
        !service ||
        a.name.trim().length < 2 ||
        !validPhone(a.phone) ||
        !isAvailable(
          latest,
          a.date,
          a.start,
          service.duration,
          a.barberId,
          nowClock(),
          excludeId,
        )
      )
        return false;
      const next = {
        ...latest,
        appointments: [
          ...latest.appointments.filter((old) => old.id !== excludeId),
          {
            ...a,
            serviceName: service.name,
            price: service.price,
            duration: service.duration,
          },
        ],
      };
      saveData(next);
      current.current = next;
      setData(next);
      setMemoryOnly(storageFailed());
      try {
        channel.current?.postMessage(next);
      } catch {
        /* fallback */
      }
      return true;
    };
    // Serialize concurrent confirmations in same-origin tabs when Web Locks is available.
    if (navigator.locks) return navigator.locks.request(STORAGE_KEY, commit);
    return commit();
  }
  function reset() {
    update(() => seed());
    setNewIds([]);
    toast("Dados de demonstração restaurados.");
  }
  return (
    <Context.Provider
      value={{
        data,
        update,
        book,
        reset,
        notice,
        toast,
        newIds,
        clearNew,
        memoryOnly,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("Store ausente");
  return store;
}
