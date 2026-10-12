import { client } from './client';
import type { GeocodeResponse, RouteInfoResponse } from '@/types/ai';

export const mapApi = {
  geocode: (address: string) =>
    client.get<GeocodeResponse>('/map/geocode', { address }),

  route: (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    transportMode: string = 'driving',
  ) =>
    client.get<RouteInfoResponse>('/map/route', {
      fromLat,
      fromLng,
      toLat,
      toLng,
      transportMode,
    }),
};
