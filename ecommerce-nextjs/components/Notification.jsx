'use client';
import { useState, useEffect, useCallback } from 'react';

let showNotificationFn = null;

export function showNotification(msg) {
  if (showNotificationFn) showNotificationFn(msg);
}

export default function Notification() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = { current: null };

  const show = useCallback((msg) => {
    setMessage(msg);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2800);
  }, []);

  useEffect(() => {
    showNotificationFn = show;
    return () => { showNotificationFn = null; };
  }, [show]);

  return (
    <div className={`notification${visible ? ' show' : ''}`}>
      {message}
    </div>
  );
}
