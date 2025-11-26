import axiosInstance from '../utils/axiosInstance';

const normalizeStatus = (status) => {
  if (status === 'in_progress') return 'building';
  if (status === 'ready') return 'ready';
  return status || 'idle';
};

const mapBuildingPayload = (payload = {}) => ({
  ...payload,
  status: normalizeStatus(payload.status),
  constructionEndsAt:
    payload.constructionEndsAt || payload.construction_ends_at || null,
});

export const getAllowedResourceBuildings = async () => {
  const { data } = await axiosInstance.get('/resources/resource-buildings/allowed');
  return data;
};

export const getResourceBuildings = async () => {
  const { data } = await axiosInstance.get('/resources/resource-buildings');
  return Array.isArray(data) ? data.map(mapBuildingPayload) : [];
};

export const getResourceBuildingDetail = async (buildingId, signal) => {
  const { data } = await axiosInstance.get(
    `/resources/resource-buildings/${buildingId}`,
    { signal }
  );
  return mapBuildingPayload(data);
};

export const upgradeResourceBuilding = async (buildingId) => {
  const { data } = await axiosInstance.post(
    `/resources/resource-buildings/${buildingId}/upgrade`
  );
  return mapBuildingPayload(data);
};

export const downgradeResourceBuilding = async (buildingId) => {
  const { data } = await axiosInstance.post(
    `/resources/resource-buildings/${buildingId}/downgrade`
  );
  return mapBuildingPayload(data);
};