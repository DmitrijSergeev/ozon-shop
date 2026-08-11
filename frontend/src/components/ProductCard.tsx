import { useNavigate } from "react-router-dom";

import type { OzonProduct } from "../api/ozonApi";

interface ProductCardProps {
    product: OzonProduct;
}

function ProductCard({ product }: ProductCardProps) {
    const navigate = useNavigate();

    function handleClick() {
        navigate(`/products/${product.product_id}`);
    }

    return (
        <article
            className="product-card"
            onClick={handleClick}
            style={{ cursor: "pointer" }}
        >
            <h3>{product.offer_id}</h3>

            <p>
                <strong>Product ID:</strong>{" "}
                {product.product_id}
            </p>

            <p>
                <strong>SKU:</strong>{" "}
                {product.sku}
            </p>

            <p>
                FBO: {product.has_fbo_stocks ? "Да" : "Нет"}
            </p>

            <p>
                FBS: {product.has_fbs_stocks ? "Да" : "Нет"}
            </p>

            {product.archived && (
                <p>📦 Архивный товар</p>
            )}

            {product.is_discounted && (
                <p>🏷️ Есть скидка</p>
            )}
        </article>
    );
}

export default ProductCard;