'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DeviceMotionHookOptions {
  sensitivity?: number; // Threshold magnitude (default 14.0 m/s^2)
  autoPingIntervalMs?: number; // Minimum time between auto passive pings (e.g. 15 mins)
  onMotionDetected?: (magnitude: number) => void;
  onAutoPing?: () => void;
}

export function useDeviceMotion({
  sensitivity = 14.0,
  autoPingIntervalMs = 15 * 60 * 1000,
  onMotionDetected,
  onAutoPing,
}: DeviceMotionHookOptions = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(true);
  const [currentMagnitude, setCurrentMagnitude] = useState<number>(0);
  const [motionCount, setMotionCount] = useState<number>(0);
  const [lastMotionTime, setLastMotionTime] = useState<Date | null>(null);
  const [lastAutoPingTime, setLastAutoPingTime] = useState<Date | null>(null);
  const [isDesktopSimulated, setIsDesktopSimulated] = useState<boolean>(false);

  const lastAutoPingRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastStateUpdateRef = useRef<number>(0);
  const onMotionRef = useRef(onMotionDetected);
  const onPingRef = useRef(onAutoPing);

  useEffect(() => {
    onMotionRef.current = onMotionDetected;
    onPingRef.current = onAutoPing;
  }, [onMotionDetected, onAutoPing]);

  const triggerMotionAlert = useCallback((magnitude: number) => {
    const roundedMag = Math.round(magnitude * 10) / 10;
    const now = Date.now();

    // Throttle React state updates to once every 150ms to prevent render flooding
    if (now - lastStateUpdateRef.current > 150) {
      lastStateUpdateRef.current = now;
      setCurrentMagnitude(roundedMag);
    }

    // Only count significant motion exceeding sensitivity threshold
    if (magnitude >= sensitivity) {
      setLastMotionTime(new Date(now));
      setMotionCount(prev => prev + 1);

      if (onMotionRef.current) {
        onMotionRef.current(roundedMag);
      }

      if (now - lastAutoPingRef.current >= autoPingIntervalMs) {
        lastAutoPingRef.current = now;
        setLastAutoPingTime(new Date(now));
        if (onPingRef.current) {
          onPingRef.current();
        }
      }
    }
  }, [sensitivity, autoPingIntervalMs]);

  // Handle Hardware Accelerometer (Mobile)
  const handleMotionEvent = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    if (magnitude > 0.5) {
      setIsDesktopSimulated(false);
      triggerMotionAlert(magnitude);
    }
  }, [triggerMotionAlert]);

  // Handle Mouse Movement Simulation (Desktop)
  const handleMouseMoveEvent = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (lastMousePosRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      const dt = Math.max(1, now - lastMousePosRef.current.time);

      const distance = Math.sqrt(dx * dx + dy * dy);
      const velocity = distance / dt; // pixels per ms

      // Scale mouse velocity to simulated acceleration (e.g. 5 to 25 m/s^2)
      const simulatedMag = Math.min(32, Math.round(velocity * 18 * 10) / 10);
      
      if (simulatedMag > 2) {
        setIsDesktopSimulated(true);
        triggerMotionAlert(simulatedMag);
      }
    }
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };
  }, [triggerMotionAlert]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined') return false;

    // iOS Safari permission check
    // @ts-expect-error iOS Safari permission API
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        // @ts-expect-error iOS Safari permission API
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          return true;
        } else {
          setPermissionGranted(false);
          return false;
        }
      } catch (err) {
        console.error('DeviceMotion permission error:', err);
        return false;
      }
    }
    setPermissionGranted(true);
    return true;
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('devicemotion', handleMotionEvent);
    window.addEventListener('mousemove', handleMouseMoveEvent);
    setIsListening(true);
  }, [handleMotionEvent, handleMouseMoveEvent]);

  const stopListening = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', handleMotionEvent);
      window.removeEventListener('mousemove', handleMouseMoveEvent);
    }
    setIsListening(false);
  }, [handleMotionEvent, handleMouseMoveEvent]);

  // Auto-start listening on mount
  useEffect(() => {
    startListening();
    return () => {
      stopListening();
    };
  }, [startListening, stopListening]);

  return {
    isSupported,
    permissionGranted,
    isListening,
    isDesktopSimulated,
    currentMagnitude,
    motionCount,
    lastMotionTime,
    lastAutoPingTime,
    requestPermission,
    startListening,
    stopListening,
  };
}
