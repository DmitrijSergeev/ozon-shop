import { useEffect, useState } from "react";

import ProductCard from "./ProductCard";
import ProductSearch from "./ProductSearch";

import {
  getOzonProducts,
  type OzonProduct,
  type SearchType,
} from "../api/ozonApi";

function ProductList() {
  const [products, setProducts] = useState<OzonProduct[]>([]);
  // Начальное состояние уже true, поэтому вызывать setLoading(true) при старте не нужно
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("offer_id");

  // Функция для повторной загрузки (например, при поиске пользователем)
  async function loadProducts(
      currentSearch = search,
      currentSearchType = searchType
  ) {
    try {
      setLoading(true);
      setError("");

      const data = await getOzonProducts({
        search: currentSearch,
        searchType: currentSearchType,
      });

      setProducts(data.result.items);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить товары");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // Эффект для первичной загрузки при монтировании
  useEffect(() => {
    let ignore = false;

    async function fetchOnMount() {
      try {
        const data = await getOzonProducts({
          search,
          searchType,
        });

        // Обновляем состояние только если компонент всё еще смонтирован
        if (!ignore) {
          setProducts(data.result.items);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("Не удалось загрузить товары");
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchOnMount();

    // Функция отчистки: если компонент размонтируется, результаты запроса проигнорируются
    return () => {
      ignore = true;
    };
  }, []);

  function handleSearch(
      newSearch: string,
      newSearchType: SearchType
  ) {
    setSearch(newSearch);
    setSearchType(newSearchType);

    // При ручном поиске вызов происходит в обработчике событий, а не в useEffect
    loadProducts(newSearch, newSearchType);
  }

  return (
      <section>
        <ProductSearch onSearch={handleSearch} />

        {loading && <p>Загрузка товаров...</p>}

        {!loading && error && <p>{error}</p>}

        {!loading && !error && products.length === 0 && (
            <p>Товары не найдены</p>
        )}

        {!loading && !error && products.length > 0 && (
            <section className="product-list">
              {products.map((product) => (
                  <ProductCard
                      key={product.product_id}
                      product={product}
                  />
              ))}
            </section>
        )}
      </section>
  );
}

export default ProductList;