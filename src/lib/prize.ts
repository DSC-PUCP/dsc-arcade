import type { GameId } from './config'

export interface PrizeCtx {
  game?: GameId
  gameLabel?: string
  player?: string
  score?: string
}

export const BADGES: Record<string, string[]> = {
  debug: ['Bug Hunter', 'Último en Pie', 'Debugger Supremo'],
  speedrun: ['Teclado en Llamas', 'Speedrun Legend', 'Dedos de Compilador'],
  logos: ['Radar Tech', 'Stack Sommelier', 'Ojo de Halcón Dev'],
  truth: ['Hallucination Slayer', 'Fact Checker 3000', 'Prompt Detective'],
  any: ['Full Stack Legend', 'Top 1% DSC Arcade', 'Bug Hunter', '10x Developer (en formación)'],
}
