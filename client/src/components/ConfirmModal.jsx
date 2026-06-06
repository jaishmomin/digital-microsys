import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

/**
 * ConfirmModal — reusable confirmation dialog.
 *
 * @param {boolean}  isOpen      - Whether modal is visible
 * @param {function} onClose     - Close handler
 * @param {function} onConfirm   - Confirm handler
 * @param {string}   title       - Modal title
 * @param {string}   message     - Modal message
 * @param {string}   confirmText - Confirm button label (default "Confirm")
 * @param {string}   variant     - 'danger' | 'warning' | 'info' (default "danger")
 * @param {boolean}  loading     - Whether confirm action is in progress
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: 'bg-red-500/15 text-red-400',
      btn: 'from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/25',
    },
    warning: {
      icon: 'bg-amber-500/15 text-amber-400',
      btn: 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/25',
    },
    info: {
      icon: 'bg-primary-500/15 text-primary-400',
      btn: 'from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/25',
    },
  };

  const c = colors[variant] || colors.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-900 border border-surface-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
        <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center mx-auto mb-4`}>
          <HiOutlineExclamationTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-surface-100 text-center mb-2">{title}</h3>
        <p className="text-sm text-surface-400 text-center mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700/50 text-surface-300 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${c.btn} text-white rounded-xl text-sm font-semibold transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
