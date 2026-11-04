import { Component, type ReactNode } from 'react'
import { Mascot } from './Mascot'

/** Evita la pantalla blanca en el stand: si un juego falla, ofrece volver al menú. */
export class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[DSC Arcade]', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="center card pop" style={{ maxWidth: 700, margin: '40px auto' }}>
        <Mascot mood="sad" size={150} />
        <h2 style={{ fontSize: 44 }}>Uy, este juego tuvo un bug de verdad 🙈</h2>
        <p style={{ margin: 0 }} className="muted">{this.state.error.message}</p>
        <button
          className="btn big sun"
          onClick={() => {
            this.setState({ error: null })
            this.props.onReset()
          }}
        >
          Volver al menú
        </button>
      </div>
    )
  }
}
