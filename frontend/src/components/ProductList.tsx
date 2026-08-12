import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductSearch from "./ProductSearch";
import ProductCard from "./ProductCard";

import {
  getOzonProducts,
  type OzonProduct,
  type SearchType,
} from "../api/ozonApi";

function ProductList() {
  const navigate = useNavigate();

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

  /*
   * Курсоры страниц.
   *
   * pageCursors[0] = курсор первой страницы
   * pageCursors[1] = курсор второй страницы
   * pageCursors[2] = курсор третьей страницы
   *
   * Для первой страницы всегда используется "".
   */
  const [pageCursors, setPageCursors] =
      useState<string[]>([""]);

  const [page, setPage] = useState(1);

  /*
   * Загружает страницу товаров.
   */
  async function loadProducts(
      cursor: string,
      currentSearch = search,
      currentSearchType = searchType,
      currentFbo = fboOnly,
      currentFbs = fbsOnly,
      currentArchived = archivedOnly,
      currentDiscounted = discountedOnly,
  ) {
    try {
      setLoading(true);
      setError("");

      const data = await getOzonProducts({
        search: currentSearch,
        searchType: currentSearchType,
        lastId: cursor,
        limit: 20,

        fbo: currentFbo,
        fbs: currentFbs,
        archived: currentArchived,
        discounted: currentDiscounted,
      });

      setProducts(data.result.items);

      /*
       * last_id, который вернул Ozon,
       * понадобится для следующей страницы.
       */
      const nextCursor = data.result.last_id || "";

      setPageCursors((current) => {
        const updated = [...current];

        /*
         * Курсор для следующей страницы.
         *
         * Например:
         *
         * page 1 -> nextCursor = cursor2
         * page 2 -> nextCursor = cursor3
         */
        updated[page] = nextCursor;

        return updated;
      });
    } catch (err) {
      console.error(err);

      setProducts([]);
      setError("Не удалось загрузить товары");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Первоначальная загрузка.
   */
  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      try {
        const data = await getOzonProducts({
          search: "",
          searchType: "offer_id",
          lastId: "",
          limit: 20,
        });

        if (!ignore) {
          setProducts(data.result.items);

          const nextCursor =
              data.result.last_id || "";

          setPageCursors([
            "",
            nextCursor,
          ]);

          setPage(1);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setProducts([]);
          setError(
              "Не удалось загрузить товары",
          );
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      ignore = true;
    };
  }, []);

  /*
   * Поиск.
   *
   * При новом поиске начинаем пагинацию заново.
   */
  function handleSearch(
      newSearch: string,
      newSearchType: SearchType,
  ) {
    setSearch(newSearch);
    setSearchType(newSearchType);

    setPage(1);
    setPageCursors([""]);

    loadProducts(
        "",
        newSearch,
        newSearchType,
        fboOnly,
        fbsOnly,
        archivedOnly,
        discountedOnly,
    );
  }

  /*
   * Применение фильтров.
   *
   * Сейчас сами фильтры мы уже подготовили.
   * Если backend принимает их отдельно —
   * подключим их к запросу следующим шагом.
   */
  function applyFilters() {
    setPage(1);
    setPageCursors([""]);

    loadProducts(
        "",
        search,
        searchType,
        fboOnly,
        fbsOnly,
        archivedOnly,
        discountedOnly,
    );
  }

  /*
   * Следующая страница.
   */
  function handleNextPage() {
    if (loading) {
      return;
    }

    const nextCursor =
        pageCursors[page];

    /*
     * Если Ozon не дал last_id,
     * следующей страницы нет.
     */
    if (!nextCursor) {
      return;
    }

    const nextPage = page + 1;

    setPage(nextPage);

    loadProducts(
        nextCursor,
        search,
        searchType,
        fboOnly,
        fbsOnly,
        archivedOnly,
        discountedOnly,
    );
  }

  /*
   * Предыдущая страница.
   */
  function handlePreviousPage() {
    if (loading || page <= 1) {
      return;
    }

    const previousPage = page - 1;

    /*
     * Для предыдущей страницы
     * нужен курсор, с которого она была загружена.
     *
     * pageCursors:
     *
     * [0] = ""
     * [1] = cursor для page 2
     * [2] = cursor для page 3
     */
    const previousCursor =
        pageCursors[previousPage - 1] || "";

    setPage(previousPage);

    loadProducts(
        previousCursor,
        search,
        searchType,
        fboOnly,
        fbsOnly,
        archivedOnly,
        discountedOnly,
    );
  }

  function handleRowClick(
      product: OzonProduct,
  ) {
    navigate(
        `/products/${product.product_id}`,
    );
  }

  const hasNextPage =
      Boolean(pageCursors[page]);

  const hasPreviousPage =
      page > 1;

  return (
      <section className="products-page">

        <ProductSearch
            onSearch={handleSearch}
        />

        <div className="products-filters">

          <label className="filter-checkbox">
            <input
                type="checkbox"
                checked={fboOnly}
                onChange={(event) =>
                    setFboOnly(
                        event.target.checked,
                    )
                }
            />

            <span>
                        Есть остатки FBO
                    </span>
          </label>

          <label className="filter-checkbox">
            <input
                type="checkbox"
                checked={fbsOnly}
                onChange={(event) =>
                    setFbsOnly(
                        event.target.checked,
                    )
                }
            />

            <span>
                        Есть остатки FBS
                    </span>
          </label>

          <label className="filter-checkbox">
            <input
                type="checkbox"
                checked={archivedOnly}
                onChange={(event) =>
                    setArchivedOnly(
                        event.target.checked,
                    )
                }
            />

            <span>
                        Архивные
                    </span>
          </label>

          <label className="filter-checkbox">
            <input
                type="checkbox"
                checked={discountedOnly}
                onChange={(event) =>
                    setDiscountedOnly(
                        event.target.checked,
                    )
                }
            />

            <span>
                        Со скидкой
                    </span>
          </label>

          <button
              type="button"
              className="filter-apply"
              onClick={applyFilters}
          >
            Применить
          </button>
        </div>

        {loading && (
            <div className="products-state">
              <div className="loader" />

              <p>
                Загрузка товаров...
              </p>
            </div>
        )}

        {!loading && error && (
            <div className="products-state products-state-error">

              <p>{error}</p>

              <button
                  type="button"
                  onClick={() =>
                      loadProducts(
                          pageCursors[page - 1] || "",
                          search,
                          searchType,
                          fboOnly,
                          fbsOnly,
                          archivedOnly,
                          discountedOnly,
                      )
                  }
              >
                Повторить
              </button>

            </div>
        )}

        {!loading &&
            !error &&
            products.length === 0 && (
                <div className="products-state">
                  <p>
                    Товары не найдены
                  </p>
                </div>
            )}

        {!loading &&
            !error &&
            products.length > 0 && (
                <>
                  <div className="products-table-wrapper">

                    <table className="products-table">

                      <thead>
                      <tr>
                        <th>
                          Товар
                        </th>

                        <th>
                          Offer ID
                        </th>

                        <th>
                          Product ID
                        </th>

                        <th>
                          SKU
                        </th>

                        <th>
                          FBO
                        </th>

                        <th>
                          FBS
                        </th>

                        <th>
                          Статус
                        </th>

                        <th>
                          Скидка
                        </th>
                      </tr>
                      </thead>

                      <tbody>
                      {products.map(
                          (product) => (
                              <ProductCard
                                  key={
                                    product.product_id
                                  }
                                  product={
                                    product
                                  }
                                  onClick={() =>
                                      handleRowClick(
                                          product,
                                      )
                                  }
                              />
                          ),
                      )}
                      </tbody>

                    </table>

                  </div>

                  <div className="products-pagination">

                    <button
                        type="button"
                        disabled={
                            loading ||
                            !hasPreviousPage
                        }
                        onClick={
                          handlePreviousPage
                        }
                    >
                      ← Назад
                    </button>

                    <span>
                                Страница {page}
                            </span>

                    <button
                        type="button"
                        disabled={
                            loading ||
                            !hasNextPage
                        }
                        onClick={
                          handleNextPage
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