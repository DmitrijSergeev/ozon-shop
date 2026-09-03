import { useShop } from "../hooks/useShop.js";

function ShopSelector() {
  const { shops, shopId, setShopId } = useShop();

  if (shops.length <= 1) return null;

  return (
    <select
      className="shop-selector"
      value={shopId}
      onChange={(e) => setShopId(e.target.value)}
    >
      {shops.map((shop) => (
        <option key={shop.id} value={shop.id}>
          {shop.name}
        </option>
      ))}
    </select>
  );
}

export default ShopSelector;
