export async function getOzonProducts() {
  const response = await fetch(
    "http://localhost:3000/api/ozon/products"
  );

  if (!response.ok) {
    throw new Error("Ошибка при получении товаров");
  }

  return response.json();
}