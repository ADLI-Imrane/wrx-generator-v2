import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  createLinkModalOpen: boolean;
  createQRModalOpen: boolean;
  deleteConfirmModalOpen: boolean;
  deleteItemId: string | null;
  deleteItemType: 'link' | 'qr' | null;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;

  openCreateLinkModal: () => void;
  closeCreateLinkModal: () => void;

  openCreateQRModal: () => void;
  closeCreateQRModal: () => void;

  openDeleteConfirmModal: (id: string, type: 'link' | 'qr') => void;
  closeDeleteConfirmModal: () => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  createLinkModalOpen: false,
  createQRModalOpen: false,
  deleteConfirmModalOpen: false,
  deleteItemId: null,
  deleteItemType: null,
  theme: 'light',

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Create Link Modal
  openCreateLinkModal: () => set({ createLinkModalOpen: true }),
  closeCreateLinkModal: () => set({ createLinkModalOpen: false }),

  // Create QR Modal
  openCreateQRModal: () => set({ createQRModalOpen: true }),
  closeCreateQRModal: () => set({ createQRModalOpen: false }),

  // Delete Confirm Modal
  openDeleteConfirmModal: (id, type) =>
    set({
      deleteConfirmModalOpen: true,
      deleteItemId: id,
      deleteItemType: type,
    }),
  closeDeleteConfirmModal: () =>
    set({
      deleteConfirmModalOpen: false,
      deleteItemId: null,
      deleteItemType: null,
    }),

  // Theme
  setTheme: (theme) => set({ theme }),
}));
