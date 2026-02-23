import axios from 'axios';
import type { ApiResponse } from '../types/artwork';

const BASE_URL = 'https://api.artic.edu/api/v1/artworks?page=1';

export const fetchArtworks = async (page: number, limit: number) => {
  const response = await axios.get<ApiResponse>(BASE_URL, {
    params: {
      page,
      limit
    }
  });

  return response.data;
};