import { useEffect, useRef, useCallback } from 'react';

/**
 * Anti-cheat / proctoring hook for TakeTest.
 *
 * @param {object} options
 * @param {boolean} options.active - Whether proctoring is active
 * @param {function} options.onViolation - Callback receiving {type, timestamp}
 * @param {function} options.onAutoSubmit - Callback to auto-submit the test
 */
const useProctor = ({ active, onViolation, onAutoSubmit }) => {
  const autoSubmittedRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  const onAutoSubmitRef = useRef(onAutoSubmit);

  // Keep refs fresh
  useEffect(() => {
    onViolationRef.current = onViolation;
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onViolation, onAutoSubmit]);

  const recordAndSubmit = useCallback((type) => {
    if (autoSubmittedRef.current) return;

    const violation = { type, timestamp: new Date().toISOString() };
    onViolationRef.current?.(violation);

    // Auto-submit on violation
    autoSubmittedRef.current = true;
    setTimeout(() => {
      onAutoSubmitRef.current?.();
    }, 100);
  }, []);

  useEffect(() => {
    if (!active) return;

    // ─── a) Fullscreen Enforcement ───
    const requestFullscreen = async () => {
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      } catch {
        // Fullscreen may be blocked by browser
      }
    };

    requestFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        recordAndSubmit('fullscreenExit');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // ─── b) Tab Switch Detection ───
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordAndSubmit('tabSwitch');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ─── c) Window Blur Detection ───
    const handleBlur = () => {
      recordAndSubmit('blur');
    };
    window.addEventListener('blur', handleBlur);

    // ─── d) Keyboard Shortcut Blocking ───
    const handleKeydown = (e) => {
      // F5 — refresh
      if (e.key === 'F5') {
        e.preventDefault();
        recordAndSubmit('refresh');
        return;
      }

      // Ctrl/Cmd combos
      if (e.ctrlKey || e.metaKey) {
        const blocked = ['r', 't', 'w', 'n', 'f', 'c', 'a', 'p', 's'];
        if (blocked.includes(e.key.toLowerCase())) {
          e.preventDefault();
          if (['r'].includes(e.key.toLowerCase())) {
            recordAndSubmit('refresh');
          } else if (['c', 'a'].includes(e.key.toLowerCase())) {
            recordAndSubmit('copyAttempt');
          }
          return;
        }
      }

      // Alt+F4
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        recordAndSubmit('altF4');
        return;
      }

      // Alt+Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        recordAndSubmit('altTab');
        return;
      }
    };
    document.addEventListener('keydown', handleKeydown, true);

    // ─── e) Right-click blocking ───
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // ─── f) beforeunload warning ───
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // ─── Cleanup ───
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Exit fullscreen on cleanup
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [active, recordAndSubmit]);

  return {
    isAutoSubmitted: autoSubmittedRef.current,
  };
};

export default useProctor;
