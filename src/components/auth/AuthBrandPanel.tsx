import Brand from '../Brand'

export default function AuthBrandPanel() {
  return <aside className="auth-art">
    <Brand />
    <div className="auth-art-copy">
      <div className="eyebrow"><span className="live-dot" /> A BETTER INTERNET IS A TEAM EFFORT</div>
      <h1>Find your<br /><em>people.</em><br />Build your<br />next thing.</h1>
      <p>The future isn’t built alone. Your people are already here.</p>
      <div className="auth-art-orbit"><span>◈</span><i>✳</i><b>⌘</b></div>
    </div>
    <span className="auth-art-foot">THE ARENA · WEB3, TOGETHER</span>
  </aside>
}
