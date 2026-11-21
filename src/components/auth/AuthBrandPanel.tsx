import Brand from '../Brand'

export default function AuthBrandPanel() {
  return (
    <aside className="auth-art">
      <Brand to="/" />
      <div className="auth-art-copy">
        <div className="eyebrow">
          <span className="live-dot" /> A COMMUNITY FOR BECOMING
        </div>
        <h1>
          One identity.
          <br />
          <em>Every path.</em>
        </h1>
        <p>
          Every member enters The Arena as a unified Spartan—free to learn, join missions, align with Houses, and optionally build an organisation later without splitting accounts.
        </p>
        <div className="auth-art-orbit" aria-hidden="true">
          <span>◈</span>
          <i>✳</i>
          <b>⌘</b>
        </div>
      </div>
      <span className="auth-art-foot">THE ARENA · UNIFIED SPARTAN ACCOUNT · CLIENT SIMULATION</span>
    </aside>
  )
}
