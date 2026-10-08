import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'

export default function Newsletter({ flash }: { flash: (message: string) => void }) {
  const [email, setEmail] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    flash(`You're on the list${email ? `, ${email}` : ''}!`)
    setEmail('')
  }
  return <section className="newsletter section-wrap" id="how-it-works">
    <div><span className="section-kicker">A GOOD THING, IN YOUR INBOX</span><h2>The signal, not the noise.</h2><p>Opportunities, fresh ideas, and people to know. Every other week.</p></div>
    <form className="newsletter-form" onSubmit={submit}>
      <input type="email" aria-label="Email address" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <button className="button button-bright" type="submit">Count me in <ArrowRight size={15} /></button>
    </form>
  </section>
}
