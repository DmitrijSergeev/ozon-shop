import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { listShops, type Shop } from "../api/shop.js";

const STORAGE_KEY = "ozon-shop:selectedShopId";

interface ShopContextValue {
  shops: Shop[];
  shopId: string;
  setShopId: (id: string) => void;
  loading: boolean;
  error: string;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listShops()
      .then((data) => {
        setShops(data);
        // Если сохранённый shopId не существует — берём первый
        setShopIdState((current) => {
          if (data.length === 0) return "";
          if (current && data.some((s) => s.id === current)) return current;
          return data[0].id;
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  function setShopId(id: string) {
    setShopIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }

  return (
    <ShopContext.Provider value={{ shops, shopId, setShopId, loading, error }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextValue {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }

  return context;
}
