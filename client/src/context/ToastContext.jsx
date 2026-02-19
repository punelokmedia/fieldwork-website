import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = 'success') => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, []);

  const toastApi = {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
          style={{
            background: toast.type === 'error' ? '#b91c1c' : '#1f2937',
          }}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { success: () => {}, error: () => {} };
  return ctx;
}
