import { create } from 'zustand';
import api from '../services/api';

let clearEmailsFn = () => {};

export const setClearEmails = (fn) => {
  clearEmailsFn = fn;
};

export const clearEmails = () => {
  clearEmailsFn();
};

const useEmailStore = create((set, get) => ({
  emails: [],
  selectedEmail: null,
  labels: [],
  nextPageToken: null,
  totalEstimate: 0,
  isLoading: false,
  searchQuery: '',
  
  fetchEmails: async (pageToken = null, append = false) => {
    set({ isLoading: true });
    try {
      const params = {
        maxResults: 10,
        ...(pageToken && { pageToken }),
        ...(get().searchQuery && { q: get().searchQuery })
      };
      
      const response = await api.get('/gmail/messages', { params });
      
      set({
        emails: append 
          ? [...get().emails, ...response.data.messages]
          : response.data.messages,
        nextPageToken: response.data.nextPageToken,
        totalEstimate: response.data.resultSizeEstimate
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchSingleEmail: async (emailId) => {
    try {
      const response = await api.get(`/gmail/messages/${emailId}`);
      set({ selectedEmail: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch email:', error);
      throw error;
    }
  },
  
  fetchLabels: async () => {
    try {
      const response = await api.get('/gmail/labels');
      set({ labels: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      throw error;
    }
  },
  
  sendEmail: async ({ to, subject, body }) => {
    try {
      const response = await api.post('/gmail/send', { to, subject, body });
      await get().fetchEmails();
      return response.data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  },
  
  loadMore: async () => {
    const { nextPageToken } = get();
    if (nextPageToken && !get().isLoading) {
      await get().fetchEmails(nextPageToken, true);
    }
  },
  
  refresh: async () => {
    set({ emails: [], nextPageToken: null });
    await get().fetchEmails();
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  search: async (query) => {
    set({ searchQuery: query, emails: [], nextPageToken: null });
    await get().fetchEmails();
  },
  
  clearEmails: () => {
    set({ 
      emails: [], 
      selectedEmail: null, 
      labels: [], 
      nextPageToken: null,
      totalEstimate: 0,
      searchQuery: ''
    });
  },
  
  markAsRead: (emailId) => {
    set({
      emails: get().emails.map(email => 
        email.id === emailId 
          ? { ...email, isUnread: false }
          : email
      )
    });
  }
}));

// Initialize the decoupled clear function
setClearEmails(useEmailStore.getState().clearEmails);

export default useEmailStore;
