// frontend/src/contexts/ModalContext.tsx
'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ModalState {
  id: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  // Component renders its own UI and resolves a value
  render: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => React.ReactNode;
}

interface ModalContextValue {
  openModal<T = unknown>(options: Omit<ModalState, 'id' | 'render'> & { render: ModalState['render'] }): Promise<T>;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ModalState | null>(null);
  const [resolver, setResolver] = useState<((value: unknown) => void) | null>(null);
  const [rejecter, setRejecter] = useState<((reason?: unknown) => void) | null>(null);

  const closeModal = useCallback(() => {
    setCurrent(null);
    setResolver(null);
    setRejecter(null);
  }, []);

  const openModal = useCallback(<T,>(options: Omit<ModalState, 'id'>) => {
    return new Promise<T>((resolve, reject) => {
      setResolver(() => resolve);
      setRejecter(() => reject);
      setCurrent({ id: String(Date.now()), ...options });
    });
  }, []);

  const value = useMemo<ModalContextValue>(() => ({ openModal, closeModal }), [openModal, closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {current && (
        <Modal
          open={!!current}
          title={current.title}
          size={current.size}
          onClose={() => {
            rejecter?.('closed');
            closeModal();
          }}
        >
          {current.render(
            (val) => {
              resolver?.(val);
              closeModal();
            },
            (reason) => {
              rejecter?.(reason);
              closeModal();
            }
          )}
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
}
