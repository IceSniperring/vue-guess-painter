import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const socket = ref(null);
const connected = ref(false);
const error = ref(null);

export function useSocket() {
  const connect = (url = 'http://localhost:3001') => {
    if (socket.value?.connected) return socket.value;

    socket.value = io(url, {
      transports: ['websocket', 'polling']
    });

    socket.value.on('connect', () => {
      connected.value = true;
      error.value = null;
      console.log('[Socket] Connected:', socket.value.id);
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('[Socket] Disconnected');
    });

    socket.value.on('connect_error', (err) => {
      error.value = err.message;
      console.error('[Socket] Error:', err);
    });

    return socket.value;
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  };

  const emit = (event, data) => {
    if (socket.value) {
      socket.value.emit(event, data);
    } else {
      console.warn('[Socket] Cannot emit, socket not connected');
    }
  };

  const on = (event, callback) => {
    if (socket.value) {
      socket.value.on(event, callback);
    } else {
      console.warn('[Socket] Cannot register listener, socket not connected');
    }
  };

  const off = (event, callback) => {
    if (socket.value) {
      socket.value.off(event, callback);
    }
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    connected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off
  };
}
