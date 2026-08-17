import { useCallback, useEffect, useState } from "react";

import {
  getOzonProducts,
  type OzonProduct,
  type SearchType,
} from "../api/ozonApi";

export interface OzonFilters {
  fbo: boolean;
  fbs: boolean;
  archived: boolean;
  discounted: boolean;
}

interface LoadParams {
  cursor: string;
  page: number;
  search: string;
  searchType: SearchType;
  filters: OzonFilters;
}

const DEFAULT_FILTERS: OzonFilters = {
  fbo: false,
  fbs: false,
  archived: false,
  discounted: false,
};

const DEFAULT_LOAD: LoadParams = {
  cursor: "",
  page: 1,
  search: "",
  searchType: "offer_id",
  filters: DEFAULT_FILTERS,
};

export function useOzonProducts() {
  const [products, setProducts] = useState<OzonProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("offer_id");
  const [filters, setFilters] = useState<OzonFilters>(DEFAULT_FILTERS);

  const [pageCursors, setPageCursors] = useState<string[]>([""]);
  const [page, setPage] = useState(1);

  const load = useCallback(async (params: LoadParams) => {
    setLoading(true);
    setError("");

    try {
      const data = await getOzonProducts({
        search: params.search,
        searchType: params.searchType,
        lastId: params.cursor,
        limit: 20,
        ...params.filters,
      });

      setProducts(data.result.items);

      const nextCursor = data.result.last_id || "";

      setPageCursors((current) => {
        const updated = [...current];
        updated[params.page] = nextCursor;
        return updated;
      });
    } catch (err) {
      console.error(err);

      setProducts([]);
      setError("Не удалось загрузить товары");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(DEFAULT_LOAD);
  }, [load]);

  function runSearch(value: string, type: SearchType) {
    setSearch(value);
    setSearchType(type);
    setPage(1);
    setPageCursors([""]);

    load({ cursor: "", page: 1, search: value, searchType: type, filters });
  }

  function setFilter(key: keyof OzonFilters, value: boolean) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    setPage(1);
    setPageCursors([""]);

    load({ cursor: "", page: 1, search, searchType, filters });
  }

  function retry() {
    load({
      cursor: pageCursors[page - 1] || "",
      page,
      search,
      searchType,
      filters,
    });
  }

  function goToNextPage() {
    if (loading) return;

    const nextCursor = pageCursors[page];

    if (!nextCursor) return;

    const nextPage = page + 1;
    setPage(nextPage);

    load({ cursor: nextCursor, page: nextPage, search, searchType, filters });
  }

  function goToPreviousPage() {
    if (loading || page <= 1) return;

    const previousPage = page - 1;
    const previousCursor = pageCursors[previousPage - 1] || "";

    setPage(previousPage);

    load({
      cursor: previousCursor,
      page: previousPage,
      search,
      searchType,
      filters,
    });
  }

  return {
    products,
    loading,
    error,
    page,
    filters,
    hasNextPage: Boolean(pageCursors[page]),
    hasPreviousPage: page > 1,
    runSearch,
    setFilter,
    applyFilters,
    retry,
    goToNextPage,
    goToPreviousPage,
  };
}
