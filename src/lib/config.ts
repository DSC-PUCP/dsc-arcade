import raw from '../config/arcade.json'

export type SegmentType = 'flores' | 'insignia' | 'otra' | 'sorpresa' | 'chocolate' | 'custom'
export interface Segment { id: string; label: string; emoji: string; weight: number; type: SegmentType }

export const config = raw as typeof raw & { wheel: { segments: Segment[] } }
export type GameId = 'debug' | 'speedrun' | 'logos' | 'truth'
