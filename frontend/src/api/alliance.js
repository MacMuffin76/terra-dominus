import axiosInstance from '../utils/axiosInstance';

/**
 * API client pour les alliances
 */

// ===== GESTION ALLIANCE =====

export const createAlliance = async (data) => {
  const response = await axiosInstance.post('/alliances', data);
  return response.data;
};

export const getAlliance = async (allianceId) => {
  const response = await axiosInstance.get(`/alliances/${allianceId}`);
  return response.data;
};

export const updateAlliance = async (allianceId, updates) => {
  const response = await axiosInstance.put(`/alliances/${allianceId}`, updates);
  return response.data;
};

export const disbandAlliance = async (allianceId) => {
  const response = await axiosInstance.delete(`/alliances/${allianceId}`);
  return response.data;
};

// ===== MEMBRES =====

export const getMembers = async (allianceId) => {
  const response = await axiosInstance.get(`/alliances/${allianceId}/members`);
  return response.data;
};

export const promoteMember = async (allianceId, memberId, role) => {
  const response = await axiosInstance.put(`/alliances/${allianceId}/members/${memberId}/promote`, { role });
  return response.data;
};

export const kickMember = async (allianceId, memberId) => {
  const response = await axiosInstance.delete(`/alliances/${allianceId}/members/${memberId}`);
  return response.data;
};

export const leaveAlliance = async (allianceId) => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/leave`);
  return response.data;
};

// ===== INVITATIONS =====

export const sendInvitation = async (allianceId, inviteeId, message) => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/invite`, { inviteeId, message });
  return response.data;
};

export const getMyInvitations = async () => {
  const response = await axiosInstance.get('/alliances/my/invitations');
  return response.data;
};

export const respondToInvitation = async (invitationId, accept) => {
  const response = await axiosInstance.post(`/alliances/invitations/${invitationId}/respond`, { accept });
  return response.data;
};

// ===== DEMANDES D'ADHÉSION =====

export const requestToJoin = async (allianceId, message) => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/join-request`, { message });
  return response.data;
};

export const getPendingRequests = async (allianceId) => {
  const response = await axiosInstance.get(`/alliances/${allianceId}/join-requests`);
  return response.data;
};

export const reviewJoinRequest = async (requestId, approve) => {
  const response = await axiosInstance.post(`/alliances/join-requests/${requestId}/review`, { approve });
  return response.data;
};

// ===== RECHERCHE =====

export const searchAlliances = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/alliances/search?${params}`);
  return response.data;
};

export const getTopAlliances = async (limit = 20) => {
  const response = await axiosInstance.get(`/alliances/top?limit=${limit}`);
  return response.data;
};

// ===== DIPLOMATIE =====

/**
 * Get diplomatic relations for an alliance
 */
export const getDiplomaticRelations = async (allianceId) => {
  const response = await axiosInstance.get(`/alliances/${allianceId}/diplomacy`);
  return response.data;
};

/**
 * Propose a diplomatic relation
 */
export const proposeDiplomacy = async (allianceId, targetAllianceId, relationType, terms = {}) => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/diplomacy`, {
    targetAllianceId,
    relationType,
    terms
  });
  return response.data;
};

/**
 * Declare war on another alliance
 */
export const declareWar = async (allianceId, targetAllianceId, reason = '') => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/diplomacy/war`, {
    targetAllianceId,
    reason
  });
  return response.data;
};

/**
 * Propose peace (return to neutral)
 */
export const proposePeace = async (allianceId, targetAllianceId) => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/diplomacy/peace`, {
    targetAllianceId
  });
  return response.data;
};

/**
 * Propose a Non-Aggression Pact
 */
export const proposeNAP = async (allianceId, targetAllianceId, durationDays = 30) => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/diplomacy/nap`, {
    targetAllianceId,
    durationDays
  });
  return response.data;
};

/**
 * Propose an alliance
 */
export const proposeAlliance = async (allianceId, targetAllianceId) => {
  const response = await axiosInstance.post(`/alliances/${allianceId}/diplomacy/ally`, {
    targetAllianceId
  });
  return response.data;
};

/**
 * Break a diplomatic relation
 */
export const breakRelation = async (allianceId, targetAllianceId) => {
  const response = await axiosInstance.delete(`/alliances/${allianceId}/diplomacy/${targetAllianceId}`);
  return response.data;
};
