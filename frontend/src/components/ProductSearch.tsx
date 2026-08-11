import { useState } from "react";
import type { SearchType } from "../api/ozonApi";

interface ProductSearchProps {
    onSearch: (
        search: string,
        searchType: SearchType
    ) => void;
}

function ProductSearch({
                           onSearch,
                       }: ProductSearchProps) {
    const [search, setSearch] = useState("");

    const [searchType, setSearchType] =
        useState<SearchType>("offer_id");

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        onSearch(search, searchType);
    }

    function handleReset() {
        setSearch("");
        setSearchType("offer_id");

        onSearch("", "offer_id");
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="product-search"
        >
            <select
                value={searchType}
                onChange={(event) =>
                    setSearchType(
                        event.target.value as SearchType
                    )
                }
            >
                <option value="offer_id">
                    Offer ID
                </option>

                <option value="product_id">
                    Product ID
                </option>

                <option value="sku">
                    SKU
                </option>
            </select>

            <input
                type="text"
                value={search}
                onChange={(event) =>
                    setSearch(event.target.value)
                }
                placeholder="Введите значение"
            />

            <button type="submit">
                Найти
            </button>

            <button
                type="button"
                onClick={handleReset}
            >
                Сбросить
            </button>
        </form>
    );
}

export default ProductSearch;