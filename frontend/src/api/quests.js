/**
 * Quest API Client
 * Frontend service for portal quest system API calls
 */

import axiosInstance from '../utils/axiosInstance';

const BASE_URL = '/portal-quests';

export const questAPI = {
  // ============================================
  // QUEST DISCOVERY
  // ============================================

  async getAvailableQuests() {
    const response = await axiosInstance.get(`${BASE_URL}/available`);
    return response.data;
  },

  async getDailyQuests() {
    const response = await axiosInstance.get(`${BASE_URL}/daily`);
    return response.data;
  },

  async getStoryProgress() {
    const response = await axiosInstance.get(`${BASE_URL}/story`);
    return response.data;
  },

  // ============================================
  // QUEST LIFECYCLE
  // ============================================

  async acceptQuest(questId) {
    const response = await axiosInstance.post(`${BASE_URL}/${questId}/accept`);
    return response.data;
  },

  async abandonQuest(questId) {
    const response = await axiosInstance.post(`${BASE_URL}/${questId}/abandon`);
    return response.data;
  },

  async claimRewards(questId) {
    const response = await axiosInstance.post(`${BASE_URL}/${questId}/claim`);
    return response.data;
  },

  // ============================================
  // USER QUEST STATUS
  // ============================================

  async getActiveQuests() {
    const response = await axiosInstance.get(`${BASE_URL}/user/active`);
    return response.data;
  },

  async getQuestStats() {
    const response = await axiosInstance.get(`${BASE_URL}/user/stats`);
    return response.data;
  },

  // ============================================
  // UNLOCKS
  // ============================================

  async getUserUnlocks() {
    const response = await axiosInstance.get(`${BASE_URL}/unlocks`);
    return response.data;
  },

  async checkUnlock(unlockType, unlockKey) {
    const response = await axiosInstance.get(`${BASE_URL}/unlocks/check`, {
      params: { unlockType, unlockKey },
    });
    return response.data;
  },

  // ============================================
  // STREAKS
  // ============================================

  async getStreak() {
    const response = await axiosInstance.get(`${BASE_URL}/streak`);
    return response.data;
  },

  // ============================================
  // ADMIN
  // ============================================

  async rotateDailyQuests() {
    const response = await axiosInstance.post(`${BASE_URL}/admin/rotate-daily`);
    return response.data;
  },
};

// Legacy exports for backward compatibility with QuestPanel.js
export const getUserQuests = questAPI.getActiveQuests;
export const getQuestStats = questAPI.getQuestStats;
export const assignDailyQuests = questAPI.rotateDailyQuests;
export const assignWeeklyQuests = questAPI.rotateDailyQuests; // Same as daily for now
export const claimQuestRewards = questAPI.claimRewards;
export const startQuest = questAPI.acceptQuest;

// Additional named exports for PortalQuestPanel compatibility
export const getAvailableQuests = questAPI.getAvailableQuests;
export const getDailyQuests = questAPI.getDailyQuests;
export const getStoryProgress = questAPI.getStoryProgress;
export const getActiveQuests = questAPI.getActiveQuests;
export const acceptQuest = questAPI.acceptQuest;

export default questAPI;
