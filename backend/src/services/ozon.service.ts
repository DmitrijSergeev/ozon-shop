import "dotenv/config";
import axios from "axios";

export async function getOzonProducts() {
  console.log("➡️ Запрос к Ozon начался");

  console.log("CLIENT ID:", process.env.Client_ID);

  console.log(
    "API KEY:",
    process.env.API_Key
      ? `${process.env.API_Key.slice(0, 4)}...${process.env.API_Key.slice(-4)}`
      : "НЕ НАЙДЕН"
  );

console.log("CLIENT_ID:", JSON.stringify(process.env.Client_ID));
console.log("API_KEY существует:", Boolean(process.env.API_Key));
console.log("API_KEY длина:", process.env.API_Key?.length);

  const response = await axios.post(
    "https://api-seller.ozon.ru/v3/product/list",
    {
      filter: {
        visibility: "ALL",
      },
      last_id: "",
      limit: 100,
    },
    {
      headers: {
        "Client-Id": process.env.Client_ID,
        "Api-Key": process.env.API_Key,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}