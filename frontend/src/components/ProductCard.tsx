import type { OzonProduct } from "../api/ozonApi";

interface ProductCardProps {
    product: OzonProduct;
    onClick: () => void;
}

function ProductCard({
                         product,
                         onClick,
                     }: ProductCardProps) {
    return (
        <tr
            className="product-row"
            onClick={onClick}
        >
            <td className="product-name-cell">
                <div className="product-name">
                    Товар Ozon
                </div>

                <div className="product-id-mobile">
                    ID: {product.product_id}
                </div>
            </td>

            <td>
                <span className="product-code">
                    {product.offer_id}
                </span>
            </td>

            <td>
                {product.product_id}
            </td>

            <td>
                {product.sku}
            </td>

            <td>
                <span
                    className={
                        product.has_fbo_stocks
                            ? "stock stock-yes"
                            : "stock stock-no"
                    }
                >
                    {product.has_fbo_stocks
                        ? "Есть"
                        : "Нет"}
                </span>
            </td>

            <td>
                <span
                    className={
                        product.has_fbs_stocks
                            ? "stock stock-yes"
                            : "stock stock-no"
                    }
                >
                    {product.has_fbs_stocks
                        ? "Есть"
                        : "Нет"}
                </span>
            </td>

            <td>
                {product.archived ? (
                    <span className="badge badge-archived">
                        Архив
                    </span>
                ) : (
                    <span className="badge badge-active">
                        Активен
                    </span>
                )}
            </td>

            <td>
                {product.is_discounted ? (
                    <span className="badge badge-discount">
                        Скидка
                    </span>
                ) : (
                    <span className="badge badge-none">
                        —
                    </span>
                )}
            </td>
        </tr>
    );
}

export default ProductCard;