import { useState } from "react";

import type { SearchType } from "../api/ozonApi";

interface ProductSearchProps {
    onSearch: (
        search: string,
        searchType: SearchType,
    ) => void;
}

function ProductSearch({
                           onSearch,
                       }: ProductSearchProps) {
    const [value, setValue] = useState("");
    const [searchType, setSearchType] =
        useState<SearchType>("offer_id");

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        onSearch(
            value.trim(),
            searchType,
        );
    }

    function handleClear() {
        setValue("");

        onSearch(
            "",
            searchType,
        );
    }

    return (
        <form
            className="product-search"
            onSubmit={handleSubmit}
        >
            <div className="product-search-type">
                <label htmlFor="search-type">
                    Искать по:
                </label>

                <select
                    id="search-type"
                    value={searchType}
                    onChange={(event) =>
                        setSearchType(
                            event.target
                                .value as SearchType,
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
            </div>

            <div className="product-search-input">
                <input
                    type="text"
                    value={value}
                    onChange={(event) =>
                        setValue(event.target.value)
                    }
                    placeholder={
                        searchType === "offer_id"
                            ? "Введите Offer ID"
                            : searchType === "product_id"
                                ? "Введите Product ID"
                                : "Введите SKU"
                    }
                />

                {value && (
                    <button
                        type="button"
                        className="search-clear"
                        onClick={handleClear}
                    >
                        ×
                    </button>
                )}
            </div>

            <button
                type="submit"
                className="search-button"
            >
                Найти
            </button>
        </form>
    );
}

export default ProductSearch;