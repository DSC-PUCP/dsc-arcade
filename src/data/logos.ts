import {
  siClaude, siAnthropic, siGooglegemini, siOllama, siHuggingface, siLangchain, siCursor, siGithubcopilot, siPerplexity,
  siMistralai, siDeepseek, siQwen, siWindsurf, siV0, siN8n, siCrewai, siModelcontextprotocol, siOpenrouter, siElevenlabs,
  siBun, siDeno, siVite, siSupabase, siVercel, siTurso, siDrizzle, siHono, siTauri, siUv, siRuff, siPolars, siDuckdb,
  siPytorch, siReplit, siStreamlit, siTailwindcss, siAstro, siSvelte, siDocker, siRust,
} from 'simple-icons'

export interface Logo { name: string; path: string; hex: string }

const icons = [
  siClaude, siAnthropic, siGooglegemini, siOllama, siHuggingface, siLangchain, siCursor, siGithubcopilot, siPerplexity,
  siMistralai, siDeepseek, siQwen, siWindsurf, siV0, siN8n, siCrewai, siModelcontextprotocol, siOpenrouter, siElevenlabs,
  siBun, siDeno, siVite, siSupabase, siVercel, siTurso, siDrizzle, siHono, siTauri, siUv, siRuff, siPolars, siDuckdb,
  siPytorch, siReplit, siStreamlit, siTailwindcss, siAstro, siSvelte, siDocker, siRust,
]

export const LOGOS: Logo[] = icons.map((i) => ({ name: i.title, path: i.path, hex: i.hex }))
