import { useNavigate } from "react-router-dom";

import ProductSearch from "./ProductSearch";
import ProductCard from "./ProductCard";
import { useOzonProducts } from "../hooks/useOzonProducts";

import type { OzonProduct } from "../api/ozonApi";

function ProductList() {
  const navigate = useNavigate();

  const {
    products,
    loading,
    error,
    page,
    filters,
    hasNextPage,
    hasPreviousPage,
    runSearch,
    setFilter,
    applyFilters,
    retry,
    goToNextPage,
    goToPreviousPage,
  } = useOzonProducts();

  function handleRowClick(product: OzonProduct) {
    navigate(`/products/${product.product_id}`);
  }

  return (
    <section className="products-page">
      <ProductSearch onSearch={runSearch} />

      <div className="products-filters">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.fbo}
            onChange={(event) => setFilter("fbo", event.target.checked)}
          />
          <span>Есть остатки FBO</span>
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.fbs}
            onChange={(event) => setFilter("fbs", event.target.checked)}
          />
          <span>Есть остатки FBS</span>
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.archived}
            onChange={(event) => setFilter("archived", event.target.checked)}
          />
          <span>Архивные</span>
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.discounted}
            onChange={(event) => setFilter("discounted", event.target.checked)}
          />
          <span>Со скидкой</span>
        </label>

        <button type="button" className="filter-apply" onClick={applyFilters}>
          Применить
        </button>
      </div>

      {loading && (
        <div className="products-state">
          <div className="loader" />
          <p>Загрузка товаров...</p>
        </div>
      )}

      {!loading && error && (
        <div className="products-state products-state-error">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="products-state">
          <p>Товары не найдены</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="products-table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Offer ID</th>
                  <th>Product ID</th>
                  <th>SKU</th>
                  <th>FBO</th>
                  <th>FBS</th>
                  <th>Статус</th>
                  <th>Скидка</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    onClick={() => handleRowClick(product)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="products-pagination">
            <button
              type="button"
              disabled={loading || !hasPreviousPage}
              onClick={goToPreviousPage}
            >
              ← Назад
            </button>

            <span>Страница {page}</span>

            <button
              type="button"
              disabled={loading || !hasNextPage}
              onClick={goToNextPage}
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
