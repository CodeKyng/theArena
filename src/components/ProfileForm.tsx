import { Check } from 'lucide-react'
import { useAppState } from '../app/appStateContext'

export default function ProfileForm({ name }: { name: string }) {
  const { flash } = useAppState()
  const createOpportunity = name === 'Create Opportunity'
  return <form className="form-panel" onSubmit={(event) => {
    event.preventDefault()
    flash(`${name} changes saved`)
  }}>
    <h2>{createOpportunity ? 'Tell the community what you’re building.' : 'Your details'}</h2>
    <div className="form-grid">
      {!createOpportunity && <label>Display name<input defaultValue="Jordan Davis" /></label>}
      <label>{createOpportunity ? 'Opportunity title' : 'Your role'}<input defaultValue={createOpportunity ? '' : 'Web3 builder'} placeholder={createOpportunity ? 'e.g. Community Growth Lead' : 'What do you do?'} required={createOpportunity} /></label>
      <label className="full-field">{createOpportunity ? 'Description' : 'About you'}<textarea defaultValue={createOpportunity ? '' : 'Building at the intersection of people and technology.'} rows={4} /></label>
      <label>{createOpportunity ? 'Skills required' : 'Skills'}<input defaultValue={createOpportunity ? '' : 'Solidity, Product, Community'} placeholder="Add skills" /></label>
      <label>{createOpportunity ? 'Compensation' : 'Location'}<input defaultValue={createOpportunity ? '' : 'Remote'} placeholder={createOpportunity ? 'e.g. $5,000 / month' : ''} /></label>
    </div>
    <button className="button button-bright" type="submit"><Check size={16} /> {createOpportunity ? 'Publish opportunity' : 'Save changes'}</button>
  </form>
}
