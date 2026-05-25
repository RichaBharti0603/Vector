export interface ButterflyEntity {
  id: string;
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
  duration: number;
  scale: number;
  rotation: number;
}

export type EventType = 'VECTOR_CLASSIFIED' | 'VECTOR_ESCALATION' | 'VECTOR_SECURITY_ALERT' | string;

export interface ButterflyConfig {
  count: number;
  speed: 'slow' | 'fast' | 'aggressive';
}

export const EVENT_BUTTERFLY_MAP: Record<string, ButterflyConfig> = {
  VECTOR_CLASSIFIED: { count: 1, speed: 'slow' },
  VECTOR_ESCALATION: { count: 4, speed: 'fast' }, // 3-6 average
  VECTOR_SECURITY_ALERT: { count: 9, speed: 'aggressive' }, // 6-12 average
};
