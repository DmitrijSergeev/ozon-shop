import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Commission {
    delivery_amount?: number;
    percent?: number;
    return_amount?: number;
    sale_schema?: string;
    value?: number;
}

interface Stock {
    present: number;
    reserved: number;
    sku: number;
    source: string;
}

interface ProductDetailsData {
    id: number;
    name: string;
    offer_id: string;

    is_archived: boolean;
    is_autoarchived: boolean;

    barcodes: string[];

    created_at: string;
    updated_at: string;

    images: string[];

    primary_image: string[];

    currency_code: string;

    min_price: string;
    old_price: string;
    price: string;

    sku: number;

    volume_weight: number;

    vat: string;

    is_discounted: boolean;

    discounted_fbo_stocks: number;

    has_discounted_fbo_item: boolean;

    stocks: {
        has_stock: boolean;
        stocks: Stock[];
    };

    commissions: Commission[];

    statuses?: {
        status: string;
        status_failed: string;
        moderate_status: string;
        validation_status: string;
        status_name: string;
        status_description: string;
        status_tooltip: string;
        is_created: boolean;
        status_updated_at: string;
    };

    visibility_details?: {
        has_price: boolean;
        has_stock: boolean;
    };
}

function ProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState<ProductDetailsData | null>(null);
    const [loading, setLoading] = useState<boolean>(Boolean(productId));
    const [error, setError] = useState<string>(
        productId ? "" : "Не указан product_id"
    );

    useEffect(() => {
        if (!productId) return;

        let ignore = false;

        async function loadProduct() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/ozon/products/${productId}`
                );

                if (!response.ok) {
                    const data = await response.json().catch(() => null);

                    throw new Error(
                        data?.message || "Не удалось загрузить товар"
                    );
                }

                const data: ProductDetailsData = await response.json();

                if (!ignore) {
                    setProduct(data);
                }
            } catch (err) {
                console.error(err);

                if (!ignore) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Не удалось загрузить товар"
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            ignore = true;
        };
    }, [productId]);

    if (!productId) {
        return (
            <main>
                <button onClick={() => navigate(-1)}>← Назад</button>
                <p>Не указан product_id</p>
            </main>
        );
    }

    if (loading) {
        return (
            <main>
                <p>Загрузка товара...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main>
                <button onClick={() => navigate(-1)}>
                    ← Назад
                </button>

                <p>{error}</p>
            </main>
        );
    }

    if (!product) {
        return (
            <main>
                <button onClick={() => navigate(-1)}>
                    ← Назад
                </button>

                <p>Товар не найден</p>
            </main>
        );
    }

    const fboStocks =
        product.stocks?.stocks?.filter(
            (stock) => stock.source === "fbo",
        ) ?? [];

    const fboPresent = fboStocks.reduce(
        (total, stock) => total + stock.present,
        0,
    );

    const fboReserved = fboStocks.reduce(
        (total, stock) => total + stock.reserved,
        0,
    );

    return (
        <main className="product-details">
            <button
                type="button"
                onClick={() => navigate(-1)}
            >
                ← Назад к товарам
            </button>

            <div className="product-details-header">
                <div className="product-details-images">
                    {product.primary_image?.length > 0 ? (
                        <img
                            src={product.primary_image[0]}
                            alt={product.name}
                        />
                    ) : product.images?.length > 0 ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                        />
                    ) : (
                        <div>Нет изображения</div>
                    )}
                </div>

                <div className="product-details-main">
                    <h1>{product.name}</h1>

                    <p>
                        <strong>Offer ID:</strong>{" "}
                        {product.offer_id}
                    </p>

                    <p>
                        <strong>Product ID:</strong>{" "}
                        {product.id}
                    </p>

                    <p>
                        <strong>SKU:</strong> {product.sku}
                    </p>

                    <div className="product-price">
                        <strong>
                            {product.price}{" "}
                            {product.currency_code}
                        </strong>

                        {product.old_price && (
                            <span>
                {product.old_price}{" "}
                                {product.currency_code}
              </span>
                        )}
                    </div>

                    {product.is_discounted && (
                        <p>🏷️ Товар со скидкой</p>
                    )}

                    {product.is_archived && (
                        <p>📦 Архивный товар</p>
                    )}
                </div>
            </div>

            <section className="product-details-section">
                <h2>Остатки</h2>

                <div className="product-info-grid">
                    <div>
                        <strong>FBO:</strong>
                        <span>
              {fboPresent} шт.
            </span>
                    </div>

                    <div>
                        <strong>Зарезервировано FBO:</strong>
                        <span>
              {fboReserved} шт.
            </span>
                    </div>

                    <div>
                        <strong>Есть остатки:</strong>
                        <span>
              {product.stocks?.has_stock
                  ? "Да"
                  : "Нет"}
            </span>
                    </div>

                    <div>
                        <strong>
                            Уценённых FBO:
                        </strong>
                        <span>
              {product.discounted_fbo_stocks}
            </span>
                    </div>
                </div>
            </section>

            <section className="product-details-section">
                <h2>Статус</h2>

                <div className="product-info-grid">
                    <div>
                        <strong>Статус:</strong>
                        <span>
              {product.statuses?.status_name ||
                  "—"}
            </span>
                    </div>

                    <div>
                        <strong>Модерация:</strong>
                        <span>
              {product.statuses
                  ?.moderate_status || "—"}
            </span>
                    </div>

                    <div>
                        <strong>Валидация:</strong>
                        <span>
              {product.statuses
                  ?.validation_status || "—"}
            </span>
                    </div>

                    <div>
                        <strong>Описание статуса:</strong>
                        <span>
              {product.statuses
                  ?.status_description || "—"}
            </span>
                    </div>
                </div>
            </section>

            <section className="product-details-section">
                <h2>Характеристики</h2>

                <div className="product-info-grid">
                    <div>
                        <strong>Вес:</strong>
                        <span>
              {product.volume_weight} кг
            </span>
                    </div>

                    <div>
                        <strong>НДС:</strong>
                        <span>
              {product.vat}
            </span>
                    </div>

                    <div>
                        <strong>Штрихкоды:</strong>
                        <span>
              {product.barcodes?.join(", ") ||
                  "—"}
            </span>
                    </div>

                    <div>
                        <strong>Дата создания:</strong>
                        <span>
              {new Date(
                  product.created_at,
              ).toLocaleString("ru-RU")}
            </span>
                    </div>
                </div>
            </section>

            <section className="product-details-section">
                <h2>Комиссии Ozon</h2>

                {product.commissions?.length > 0 ? (
                    <div className="commissions">
                        {product.commissions.map(
                            (commission) => (
                                <div
                                    className="commission"
                                    key={
                                        commission.sale_schema
                                    }
                                >
                                    <strong>
                                        {commission.sale_schema}
                                    </strong>

                                    <span>
                    Комиссия:{" "}
                                        {commission.percent}%
                  </span>

                                    <span>
                    Сумма:{" "}
                                        {commission.value}
                  </span>

                                    <span>
                    Доставка:{" "}
                                        {commission.delivery_amount}
                  </span>

                                    <span>
                    Возврат:{" "}
                                        {commission.return_amount}
                  </span>
                                </div>
                            ),
                        )}
                    </div>
                ) : (
                    <p>Данные о комиссиях отсутствуют</p>
                )}
            </section>

            <section className="product-details-section">
                <h2>Фотографии</h2>

                <div className="product-gallery">
                    {product.images?.map(
                        (image, index) => (
                            <img
                                key={`${image}-${index}`}
                                src={image}
                                alt={`${product.name} ${
                                    index + 1
                                }`}
                            />
                        ),
                    )}
                </div>
            </section>
        </main>
    );
}

export default ProductDetails;