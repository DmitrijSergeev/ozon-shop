import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getProducts,
  type ProductRow,
  type SortBy,
  type SortOrder,
  type ProductsFilters,
} from "../api/products";
import { listShops } from "../api/shop";

const DEFAULT_FILTERS: ProductsFilters = {
  inStock: false,
  outOfStock: false,
  lowStock: false,
  selling: false,
  noSales: false,
  highPrice: false,
  lowPrice: false,
};

const FILTER_OPTIONS: { key: keyof ProductsFilters; label: string }[] = [
  { key: "inStock", label: "Есть остаток" },
  { key: "outOfStock", label: "Нет остатка" },
  { key: "lowStock", label: "Низкий остаток" },
  { key: "selling", label: "Продаётся" },
  { key: "noSales", label: "Нет продаж" },
  { key: "highPrice", label: "Высокая цена" },
  { key: "lowPrice", label: "Низкая цена" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "sales", label: "Продажи" },
  { value: "revenue", label: "Выручка" },
  { value: "price", label: "Цена" },
  { value: "stock", label: "Остаток" },
];

const STATUS_LABELS: Record<ProductRow["status"], string> = {
  ok: "OK",
  out_of_stock: "Нет остатка",
  low_stock: "Низкий остаток",
  archived: "Архив",
};

function formatMoney(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProductList() {
  const navigate = useNavigate();

  const [shopId, setShopId] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProductsFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortBy>("sales");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    listShops()
      .then((shops) => {
        if (shops.length > 0) {
          setShopId(shops[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    setError("");

    getProducts(shopId, {
      search,
      limit,
      offset,
      sortBy,
      sortOrder,
      filters,
    })
      .then((page) => {
        setProducts(page.items);
        setTotal(page.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [shopId, search, filters, sortBy, sortOrder, offset]);

  function toggleFilter(key: keyof ProductsFilters) {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
    setOffset(0);
  }

  function handleSort(nextSortBy: SortBy) {
    if (sortBy === nextSortBy) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(nextSortBy);
      setSortOrder("desc");
    }
    setOffset(0);
  }

  const hasNextPage = offset + limit < total;
  const hasPreviousPage = offset > 0;

  return (
    <section className="products-page">
      <div className="products-toolbar">
        <input
          type="text"
          className="products-search"
          placeholder="Поиск по названию, SKU или артикулу"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOffset(0);
          }}
        />

        <div className="products-sort">
          <label htmlFor="sort-by">Сортировка:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) => handleSort(event.target.value as SortBy)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="sort-order"
            onClick={() => setSortOrder((current) => (current === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="products-filters">
        {FILTER_OPTIONS.map((option) => (
          <label key={option.key} className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters[option.key]}
              onChange={() => toggleFilter(option.key)}
            />
            <span>{option.label}</span>
          </label>
        ))}
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
                  <th>Артикул</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th>Продажи</th>
                  <th>Выручка</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="product-row"
                    onClick={() => navigate(`/products/${product.ozonId}`)}
                  >
                    <td className="product-name-cell">
                      <div className="product-name">
                        {product.name || `Товар ${product.offerId}`}
                      </div>
                      <div className="product-id-mobile">SKU: {product.sku ?? "—"}</div>
                    </td>
                    <td>
                      <span className="product-code">{product.offerId}</span>
                    </td>
                    <td>{formatMoney(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>{product.sales}</td>
                    <td>{formatMoney(product.revenue)}</td>
                    <td>
                      <span className={`badge badge-${product.status}`}>
                        {STATUS_LABELS[product.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="products-pagination">
            <button
              type="button"
              disabled={loading || !hasPreviousPage}
              onClick={() => setOffset((current) => Math.max(0, current - limit))}
            >
              ← Назад
            </button>

            <span>
              {offset + 1}–{Math.min(offset + limit, total)} из {total}
            </span>

            <button
              type="button"
              disabled={loading || !hasNextPage}
              onClick={() => setOffset((current) => current + limit)}
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
