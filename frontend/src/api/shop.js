import api from '../utils/axiosInstance';

export const fetchShopItems = async () => {
  const { data } = await api.get('/shop/items');
  return data;
};

export const purchaseItem = async (payload) => {
  const { data } = await api.post('/shop/purchase', payload);
  return data;
};