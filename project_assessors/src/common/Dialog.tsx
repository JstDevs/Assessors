import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  error?: string;
}

export default function Dialog({ open, onClose, title, children, actions, error }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dialog card */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl min-w-[calc(30%)] max-w-[calc(50%)] p-6 flex flex-col gap-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Title */}
            {title && <h2 className="text-xl font-semibold text-gray-900 w-full">{title} <span className="text-red-500 text-sm text-right">{ error? error: "" }</span></h2>} 

            {/* Content */}
            <div className="text-gray-700">{children}</div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {actions ? (
                actions
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
