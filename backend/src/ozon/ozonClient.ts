import axios, { AxiosInstance } from "axios";
import type { OzonCredentials } from "./ozon.types.js";

/**
 * Низкоуровневый HTTP-клиент Ozon Seller API.
 *
 * Единственное место, где создаётся axios-инстанс с заголовками
 * авторизации. Все Ozon-сервисы получают готовый клиент через
 * `createOzonClient(credentials)`.
 */
export function createOzonClient(credentials: OzonCredentials): AxiosInstance {
  return axios.create({
    baseURL: "https://api-seller.ozon.ru",
    headers: {
      "Client-Id": credentials.clientId,
      "Api-Key": credentials.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}
