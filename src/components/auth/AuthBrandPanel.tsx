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
          Join The Arena with a single account—learn in the Academy, align with your Houses, complete real missions, and optionally represent an organisation later.
        </p>
        <div className="auth-art-orbit" aria-hidden="true">
          <span>◈</span>
          <i>✳</i>
          <b>⌘</b>
        </div>
      </div>
      <span className="auth-art-foot">THE ARENA · DEMO MODE</span>
    </aside>
  )
}
