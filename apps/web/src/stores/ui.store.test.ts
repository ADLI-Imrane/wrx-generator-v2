import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/ui.store';

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.setState({
      sidebarOpen: true,
      sidebarCollapsed: false,
      createLinkModalOpen: false,
      createQRModalOpen: false,
      deleteConfirmModalOpen: false,
      deleteItemId: null,
      deleteItemType: null,
      theme: 'light',
    });
  });

  describe('Sidebar', () => {
    it('should toggle sidebar open state', () => {
      const { toggleSidebar } = useUIStore.getState();

      expect(useUIStore.getState().sidebarOpen).toBe(true);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar open state', () => {
      const { setSidebarOpen } = useUIStore.getState();

      setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should toggle sidebar collapsed state', () => {
      const { toggleSidebarCollapsed } = useUIStore.getState();

      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      toggleSidebarCollapsed();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });
  });

  describe('Create Link Modal', () => {
    it('should open create link modal', () => {
      const { openCreateLinkModal } = useUIStore.getState();

      openCreateLinkModal();
      expect(useUIStore.getState().createLinkModalOpen).toBe(true);
    });

    it('should close create link modal', () => {
      const { openCreateLinkModal, closeCreateLinkModal } = useUIStore.getState();

      openCreateLinkModal();
      expect(useUIStore.getState().createLinkModalOpen).toBe(true);

      closeCreateLinkModal();
      expect(useUIStore.getState().createLinkModalOpen).toBe(false);
    });
  });

  describe('Create QR Modal', () => {
    it('should open create QR modal', () => {
      const { openCreateQRModal } = useUIStore.getState();

      openCreateQRModal();
      expect(useUIStore.getState().createQRModalOpen).toBe(true);
    });

    it('should close create QR modal', () => {
      const { openCreateQRModal, closeCreateQRModal } = useUIStore.getState();

      openCreateQRModal();
      closeCreateQRModal();
      expect(useUIStore.getState().createQRModalOpen).toBe(false);
    });
  });

  describe('Delete Confirm Modal', () => {
    it('should open delete confirm modal with item details', () => {
      const { openDeleteConfirmModal } = useUIStore.getState();

      openDeleteConfirmModal('item-123', 'link');

      const state = useUIStore.getState();
      expect(state.deleteConfirmModalOpen).toBe(true);
      expect(state.deleteItemId).toBe('item-123');
      expect(state.deleteItemType).toBe('link');
    });

    it('should close delete confirm modal and clear item', () => {
      const { openDeleteConfirmModal, closeDeleteConfirmModal } = useUIStore.getState();

      openDeleteConfirmModal('item-123', 'qr');
      closeDeleteConfirmModal();

      const state = useUIStore.getState();
      expect(state.deleteConfirmModalOpen).toBe(false);
      expect(state.deleteItemId).toBeNull();
      expect(state.deleteItemType).toBeNull();
    });
  });

  describe('Theme', () => {
    it('should set theme', () => {
      const { setTheme } = useUIStore.getState();

      setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');

      setTheme('system');
      expect(useUIStore.getState().theme).toBe('system');

      setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });
  });
});
