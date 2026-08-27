import axios from "axios";
import type {
  CheapestWindowResponse,
  FetchPricesResponse,
  PriceItem,
  WindowSearchParams,
} from "../types";

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const triggerFetchPrices = async (): Promise<FetchPricesResponse> => {
  const response = await apiClient.post<FetchPricesResponse>("/prices/fetch");
  return response.data;
};

export const getPrices = async (
  startAfter?: string,
  endBefore?: string
): Promise<PriceItem[]> => {
  const response = await apiClient.get<PriceItem[]>("/prices", {
    params: {
      start_after: startAfter,
      end_before: endBefore,
    },
  });
  return response.data;
};

export const getCheapestWindow = async (
  params: WindowSearchParams
): Promise<CheapestWindowResponse> => {
  const response = await apiClient.get<CheapestWindowResponse>(
    "/prices/cheapest-window",
    {
      params: {
        hours: params.hours,
        start_after: params.start_after,
        end_before: params.end_before,
      },
    }
  );
  return response.data;
};