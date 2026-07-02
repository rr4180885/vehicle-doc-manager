import { useQuery } from "@tanstack/react-query";

export interface ShopInfo {
  shopName: string | null;
  shopLocation: string | null;
  shopLogoUrl: string | null;
}

async function fetchShopInfo(): Promise<ShopInfo> {
  const res = await fetch("/api/shop-info");
  if (!res.ok) return { shopName: null, shopLocation: null, shopLogoUrl: null };
  return res.json();
}

export function useShopInfo() {
  return useQuery<ShopInfo>({
    queryKey: ["/api/shop-info"],
    queryFn: fetchShopInfo,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
