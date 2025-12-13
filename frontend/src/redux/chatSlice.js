import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../utils/axiosInstance';
import { logout as authLogout } from './authSlice';

// Thunks asynchrones
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ channelType, channelId, limit = 50, offset = 0 }, { rejectWithValue }) => {
    try {
      const params = { channelType, limit, offset };
      if (channelId) params.channelId = channelId;

      const response = await axiosInstance.get('/chat/messages', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des messages');
    }
  }
);

export const sendMessageHttp = createAsyncThunk(
  'chat/sendMessage',
  async ({ channelType, channelId, message, metadata = {} }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/chat/messages', {
        channelType,
        channelId,
        message,
        metadata,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'envoi du message');
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async ({ messageId, message }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/chat/messages/${messageId}`, { message });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la modification');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/chat/messages/${messageId}`);
      return messageId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

const initialState = {
  // Messages par canal
  globalMessages: [],
  allianceMessages: [],
  privateMessages: {}, // { userId: [messages] }
  
  // Canal actif
  activeChannel: 'global', // 'global', 'alliance', 'private'
  activePrivateUserId: null,
  
  // État de chargement
  loading: false,
  error: null,
  
  // Pagination
  pagination: {
    global: { offset: 0, limit: 50, hasMore: true },
    alliance: { offset: 0, limit: 50, hasMore: true },
  },
  
  // Indicateurs de frappe
  typingUsers: {}, // { channelKey: [userIds] }
  
  // État de connexion Socket.IO
  connected: false,
  
  // Nombre de messages non lus
  unreadCount: {
    global: 0,
    alliance: 0,
    private: {},
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Ajouter un message reçu via Socket.IO
    addMessage: (state, action) => {
      const message = action.payload;
      const { channelType, channelId } = message;

      if (channelType === 'global') {
        // Éviter les doublons
        if (!state.globalMessages.find(m => m.id === message.id)) {
          state.globalMessages.push(message);
          if (state.activeChannel !== 'global') {
            state.unreadCount.global += 1;
          }
        }
      } else if (channelType === 'alliance') {
        if (!state.allianceMessages.find(m => m.id === message.id)) {
          state.allianceMessages.push(message);
          if (state.activeChannel !== 'alliance') {
            state.unreadCount.alliance += 1;
          }
        }
      } else if (channelType === 'private') {
        const userId = channelId;
        if (!state.privateMessages[userId]) {
          state.privateMessages[userId] = [];
        }
        if (!state.privateMessages[userId].find(m => m.id === message.id)) {
          state.privateMessages[userId].push(message);
          if (state.activeChannel !== 'private' || state.activePrivateUserId !== userId) {
            state.unreadCount.private[userId] = (state.unreadCount.private[userId] || 0) + 1;
          }
        }
      }
    },

    // Mettre à jour un message (édition)
    updateMessage: (state, action) => {
      const updatedMessage = action.payload;
      const updateInArray = (array) => {
        const index = array.findIndex(m => m.id === updatedMessage.id);
        if (index !== -1) {
          array[index] = { ...array[index], ...updatedMessage };
        }
      };

      updateInArray(state.globalMessages);
      updateInArray(state.allianceMessages);
      Object.values(state.privateMessages).forEach(updateInArray);
    },

    // Marquer un message comme supprimé
    removeMessage: (state, action) => {
      const messageId = action.payload;
      const markDeleted = (array) => {
        const index = array.findIndex(m => m.id === messageId);
        if (index !== -1) {
          array[index].isDeleted = true;
        }
      };

      markDeleted(state.globalMessages);
      markDeleted(state.allianceMessages);
      Object.values(state.privateMessages).forEach(markDeleted);
    },

    // Changer de canal actif
    setActiveChannel: (state, action) => {
      const { channelType, userId } = action.payload;
      state.activeChannel = channelType;
      
      if (channelType === 'private') {
        state.activePrivateUserId = userId;
        state.unreadCount.private[userId] = 0;
      } else if (channelType === 'global') {
        state.unreadCount.global = 0;
      } else if (channelType === 'alliance') {
        state.unreadCount.alliance = 0;
      }
    },

    // Indicateurs de frappe
    addTypingUser: (state, action) => {
      const { channel, userId } = action.payload;
      if (!state.typingUsers[channel]) {
        state.typingUsers[channel] = [];
      }
      if (!state.typingUsers[channel].includes(userId)) {
        state.typingUsers[channel].push(userId);
      }
    },

    removeTypingUser: (state, action) => {
      const { channel, userId } = action.payload;
      if (state.typingUsers[channel]) {
        state.typingUsers[channel] = state.typingUsers[channel].filter(id => id !== userId);
      }
    },

    // État de connexion Socket.IO
    setConnected: (state, action) => {
      state.connected = action.payload;
    },

    // Réinitialiser les messages
    clearMessages: (state, action) => {
      const channelType = action.payload;
      if (channelType === 'global') {
        state.globalMessages = [];
        state.unreadCount.global = 0;
      } else if (channelType === 'alliance') {
        state.allianceMessages = [];
        state.unreadCount.alliance = 0;
      }
    },

    // Réinitialiser tout
    resetChat: () => initialState,
  },

  extraReducers: (builder) => {
    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { messages, pagination } = action.payload;
        const { channelType } = action.meta.arg;

        if (channelType === 'global') {
          // Ajouter les messages en évitant les doublons
          const existingIds = new Set(state.globalMessages.map(m => m.id));
          const newMessages = messages.filter(m => !existingIds.has(m.id));
          state.globalMessages = [...newMessages, ...state.globalMessages];
          state.pagination.global = pagination;
        } else if (channelType === 'alliance') {
          const existingIds = new Set(state.allianceMessages.map(m => m.id));
          const newMessages = messages.filter(m => !existingIds.has(m.id));
          state.allianceMessages = [...newMessages, ...state.allianceMessages];
          state.pagination.alliance = pagination;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Send message (HTTP fallback)
    builder
      .addCase(sendMessageHttp.fulfilled, (state, action) => {
        // Le message sera ajouté via Socket.IO normalement
        // Ceci est juste un fallback
      })
      .addCase(sendMessageHttp.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Edit message
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        const updateInArray = (array) => {
          const index = array.findIndex(m => m.id === updatedMessage.id);
          if (index !== -1) {
            array[index] = updatedMessage;
          }
        };

        updateInArray(state.globalMessages);
        updateInArray(state.allianceMessages);
        Object.values(state.privateMessages).forEach(updateInArray);
      })
      .addCase(editMessage.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        const markDeleted = (array) => {
          const index = array.findIndex(m => m.id === messageId);
          if (index !== -1) {
            array[index].isDeleted = true;
          }
        };

        markDeleted(state.globalMessages);
        markDeleted(state.allianceMessages);
        Object.values(state.privateMessages).forEach(markDeleted);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Réinitialiser le chat lors du logout
      .addCase(authLogout, () => initialState);
  },
});

export const {
  addMessage,
  updateMessage,
  removeMessage,
  setActiveChannel,
  addTypingUser,
  removeTypingUser,
  setConnected,
  clearMessages,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
