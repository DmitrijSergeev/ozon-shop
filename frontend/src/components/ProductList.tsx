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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] =
      useState<SearchType>("offer_id");

  const [fboOnly, setFboOnly] = useState(false);
  const [fbsOnly, setFbsOnly] = useState(false);
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [discountedOnly, setDiscountedOnly] = useState(false);

  // Текущая страница
  const [page, setPage] = useState(1);

  // last_id для каждой страницы
  const [pageTokens, setPageTokens] = useState<string[]>([""]);

  // Есть ли следующая страница
  const [hasNextPage, setHasNextPage] =
      useState(false);

  async function loadProducts(
      currentSearch = search,
      currentSearchType = searchType,
      currentPage = page
  ) {
    try {
      setLoading(true);
      setError("");

      const lastId =
          pageTokens[currentPage - 1] || "";

      const data = await getOzonProducts({
        search: currentSearch,
        searchType: currentSearchType,
        lastId,
      });

      setProducts(data.result.items);

      const nextLastId = data.result.last_id;

      setHasNextPage(
          Boolean(nextLastId) &&
          data.result.items.length > 0
      );

      // Сохраняем last_id для следующей страницы
      if (nextLastId) {
        setPageTokens((currentTokens) => {
          const newTokens = [...currentTokens];

          newTokens[currentPage] =
              nextLastId;

          return newTokens;
        });
      }
    } catch (err) {
      console.error(err);

      setError("Не удалось загрузить товары");
      setProducts([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }

  /*
   * Первоначальная загрузка.
   *
   * Здесь специально не вызываем setState
   * непосредственно внутри useEffect.
   */
  useEffect(() => {
    let ignore = false;

    async function fetchOnMount() {
      try {
        const data = await getOzonProducts({
          search: "",
          searchType: "offer_id",
          lastId: "",
        });

        if (!ignore) {
          setProducts(data.result.items);

          const nextLastId =
              data.result.last_id;

          setHasNextPage(
              Boolean(nextLastId) &&
              data.result.items.length > 0
          );

          if (nextLastId) {
            setPageTokens([ "", nextLastId ]);
          }
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError(
              "Не удалось загрузить товары"
          );

          setProducts([]);
          setHasNextPage(false);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchOnMount();

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

    // При новом поиске начинаем с первой страницы
    setPage(1);

    setPageTokens([""]);

    setHasNextPage(false);

    loadProducts(
        newSearch,
        newSearchType,
        1
    );
  }

  function handleNextPage() {
    if (!hasNextPage || loading) {
      return;
    }

    const nextPage = page + 1;

    setPage(nextPage);

    loadProducts(
        search,
        searchType,
        nextPage
    );
  }

  function handlePreviousPage() {
    if (page === 1 || loading) {
      return;
    }

    const previousPage = page - 1;

    setPage(previousPage);

    loadProducts(
        search,
        searchType,
        previousPage
    );
  }

  const filteredProducts = products.filter(
      (product) => {
        if (
            fboOnly &&
            !product.has_fbo_stocks
        ) {
          return false;
        }

        if (
            fbsOnly &&
            !product.has_fbs_stocks
        ) {
          return false;
        }

        if (
            archivedOnly &&
            !product.archived
        ) {
          return false;
        }

        if (
            discountedOnly &&
            !product.is_discounted
        ) {
          return false;
        }

        return true;
      }
  );

  return (
      <section>
        <ProductSearch
            onSearch={handleSearch}
        />

        <div className="filters">
          <label>
            <input
                type="checkbox"
                checked={fboOnly}
                onChange={(event) =>
                    setFboOnly(
                        event.target.checked
                    )
                }
            />
            Есть остатки FBO
          </label>

          <label>
            <input
                type="checkbox"
                checked={fbsOnly}
                onChange={(event) =>
                    setFbsOnly(
                        event.target.checked
                    )
                }
            />
            Есть остатки FBS
          </label>

          <label>
            <input
                type="checkbox"
                checked={archivedOnly}
                onChange={(event) =>
                    setArchivedOnly(
                        event.target.checked
                    )
                }
            />
            Архивные товары
          </label>

          <label>
            <input
                type="checkbox"
                checked={discountedOnly}
                onChange={(event) =>
                    setDiscountedOnly(
                        event.target.checked
                    )
                }
            />
            Со скидкой
          </label>
        </div>

        {loading && (
            <p>Загрузка товаров...</p>
        )}

        {!loading && error && (
            <p>{error}</p>
        )}

        {!loading &&
            !error &&
            filteredProducts.length === 0 && (
                <p>Товары не найдены</p>
            )}

        {!loading &&
            !error &&
            filteredProducts.length > 0 && (
                <>
                  <section className="product-list">
                    {filteredProducts.map(
                        (product) => (
                            <ProductCard
                                key={product.product_id}
                                product={product}
                            />
                        )
                    )}
                  </section>

                  <div className="pagination">
                    <button
                        onClick={
                          handlePreviousPage
                        }
                        disabled={
                            page === 1 || loading
                        }
                    >
                      ← Назад
                    </button>

                    <span>
                Страница {page}
              </span>

                    <button
                        onClick={
                          handleNextPage
                        }
                        disabled={
                            !hasNextPage || loading
                        }
                    >
                      Вперёд →
                    </button>
                  </div>
                </>
            )}
      </section>
  );
}

export default ProductList;