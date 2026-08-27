export interface PriceItem {
  id?: number;
  start_time: string;
  end_time: string;
  price: number;
}

export interface CheapestWindowResponse {
  start_time: string;
  end_time: string;
  duration_hours: number;
  average_price: number;
  intervals_count: number;
  prices: PriceItem[];
}

export interface FetchPricesResponse {
  status: string;
  records_processed: number;
}

export interface WindowSearchParams {
  hours: number;
  start_after?: string;
  end_before?: string;
}