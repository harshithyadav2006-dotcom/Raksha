import { useCallback, useEffect, useState } from 'react';

const ARDUINO_URL = 'http://localhost:5000';

interface ArduinoSosResult {
  status: string;
  arduino_response?: string;
  message?: string;
}

/**
 * useSosArduino
 *
 * Bridges the Raksha frontend to the local Arduino Flask server (server.py).
 * - Tries GET /sos (OPTIONS preflight) every 5s to detect if server is up
 * - triggerArduinoSos() sends POST /sos to make Arduino fire GSM SMS + call
 */
export function useSosArduino() {
  const [arduinoConnected, setArduinoConnected] = useState(false);

  // Lightweight reachability check — just ping the server root
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${ARDUINO_URL}/sos`, {
          method: 'OPTIONS',
          signal: AbortSignal.timeout(2000),
        });
        setArduinoConnected(res.ok || res.status === 200 || res.status === 405);
      } catch {
        setArduinoConnected(false);
      }
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerArduinoSos = useCallback(async (): Promise<ArduinoSosResult> => {
    try {
      const res = await fetch(`${ARDUINO_URL}/sos`, {
        method: 'POST',
        signal: AbortSignal.timeout(15000), // Arduino needs ~8s
      });
      const data: ArduinoSosResult = await res.json();
      return data;
    } catch (err) {
      console.error('[Arduino SOS] Failed:', err);
      return { status: 'error', message: 'Arduino bridge unreachable' };
    }
  }, []);

  return { arduinoConnected, triggerArduinoSos };
}
