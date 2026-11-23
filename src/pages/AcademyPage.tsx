import { useState } from 'react'
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, GraduationCap, HelpCircle } from 'lucide-react'
import { useArena } from '../app/arenaContext'
import { getHouseName } from '../domain/constants'

export default function AcademyPage() {
  const { state, currentMember, completeLesson, submitAssessment } = useArena()

  const [tab, setTab] = useState<'paths' | 'glossary'>('paths')
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [assessmentText, setAssessmentText] = useState<Record<string, string>>({})

  const isCompleted = (itemType: 'lesson' | 'module' | 'path' | 'assessment', itemId: string) =>
    currentMember
      ? state.learningCompletions.some(
          (lc) => lc.memberId === currentMember.id && lc.itemType === itemType && lc.itemId === itemId,
        )
      : false

  const filteredPaths = state.academyPaths.filter(
    (p) => trackFilter === 'all' || p.track === trackFilter,
  )

  const handleExplorePaths = () => {
    setTab('paths')
    setTrackFilter('all')
    const target = document.getElementById('academy-paths')
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="inner-page">
      <div className="learning-experience" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="learning-hero">
          <div>
            <span className="section-kicker">ARENA ACADEMY</span>
            <h2>
              Learn something.
              <br />
              <em>Put it into practice.</em>
            </h2>
            <p>
              Complete lessons (+5 XP, +1 CP), modules (+20 XP, +5 CP), learning paths (+75 XP, +15 CP), and practical assessments as you build skills for real missions.
            </p>
            <button
              type="button"
              className="button button-bright"
              onClick={handleExplorePaths}
            >
              Explore learning paths <ArrowRight size={15} />
            </button>
          </div>
          <div className="learning-hero-card">
            <span className="course-index">LEARNING PATH 01</span>
            <div className="course-glyph"><GraduationCap size={36} strokeWidth={1.75} aria-hidden="true" /></div>
            <span className="course-label">ARENA FOUNDATIONS</span>
            <b>
              From first lesson
              <br />
              to verified work.
            </b>
            <div className="course-path">
              01 <i /> 02 <i /> 03 <i /> 04
            </div>
          </div>
        </section>

        <div className="arena-notice arena-notice-warn">
          <AlertCircle size={17} />
          <span>
            <b>Sample curriculum (Demo Mode):</b> These paths demonstrate Arena lessons, knowledge checks, and practical assessments. Final curriculum courses will replace these samples.
          </span>
        </div>

        <div className="arena-tabs" role="tablist">
          <button
            type="button"
            className={`arena-tab ${tab === 'paths' ? 'active' : ''}`}
            onClick={() => setTab('paths')}
          >
            <GraduationCap size={14} /> Learning Paths &amp; Assessments
          </button>
          <button
            type="button"
            className={`arena-tab ${tab === 'glossary' ? 'active' : ''}`}
            onClick={() => setTab('glossary')}
          >
            <HelpCircle size={14} /> Arena &amp; Web3 Glossary ({state.glossary.length})
          </button>
        </div>

        {tab === 'glossary' ? (
          <div className="arena-grid-2">
            {state.glossary.map((entry) => (
              <div className="dashboard-panel" key={entry.term}>
                <span className="tag" style={{ marginBottom: 6, display: 'inline-block' }}>{entry.category}</span>
                <h3 style={{ margin: '6px 0 4px' }}>{entry.term}</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: '#52647d' }}>{entry.definition}</p>
              </div>
            ))}
          </div>
        ) : (
          <div id="academy-paths" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'Web3 Foundations', 'Wallet & Digital Safety', 'House Mastery'].map((tr) => (
                <button
                  key={tr}
                  type="button"
                  className={`button button-small ${trackFilter === tr ? 'button-bright' : 'button-quiet'}`}
                  onClick={() => setTrackFilter(tr)}
                >
                  {tr === 'all' ? 'All Tracks' : tr}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredPaths.map((path) => {
                const pathDone = isCompleted('path', path.id)
                const assessment = path.assessment
                const assessmentDone = assessment ? isCompleted('assessment', assessment.id) : false

                return (
                  <section className="dashboard-panel" key={path.id}>
                    <div className="panel-title">
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                          <span className="listing-kind">{path.track}</span>
                          {path.houseId && <span className="tag">House {getHouseName(path.houseId, state.houses)}</span>}
                          {pathDone && (
                            <span className="listing-kind kind-success">
                              <CheckCircle2 size={12} /> Path Completed
                            </span>
                          )}
                        </div>
                        <h2>{path.title}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#52647d' }}>{path.subtitle}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {path.modules.map((mod) => {
                        const modDone = isCompleted('module', mod.id)
                        return (
                          <div key={mod.id} style={{ padding: 14, border: '1px solid #d7e2f1', borderRadius: 9, background: '#f9fbfe' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                              <div>
                                <b style={{ fontSize: 14.5 }}>{mod.title}</b>
                                <div style={{ fontSize: 12.5, color: '#52647d' }}>{mod.summary}</div>
                              </div>
                              <span className={`listing-kind ${modDone ? 'kind-success' : ''}`}>
                                {modDone ? 'Module Completed (+20 XP / +5 CP)' : 'In Progress'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {mod.lessons.map((lesson) => {
                                const lessonDone = isCompleted('lesson', lesson.id)
                                const picked = selectedAnswers[lesson.id]

                                return (
                                  <div key={lesson.id} style={{ padding: 12, background: '#fff', border: '1px solid #e1e9f4', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <BookOpen size={15} color="#1e5cb5" />
                                        <b style={{ fontSize: 13.5 }}>{lesson.title}</b>
                                        <span className="tag">{lesson.estimatedMinutes} min</span>
                                      </div>
                                      {lessonDone && (
                                        <span className="listing-kind kind-success">
                                          <CheckCircle2 size={12} /> Passed (+5 XP / +1 CP)
                                        </span>
                                      )}
                                    </div>

                                    <p style={{ margin: '6px 0 10px', fontSize: 13, color: '#52647d' }}>{lesson.summary}</p>

                                    <div style={{ padding: 10, background: '#f7faff', borderRadius: 7, border: '1px solid #e3ecf7' }}>
                                      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                                        Knowledge Check: {lesson.knowledgeCheckQuestion}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        {lesson.knowledgeCheckOptions.map((opt, idx) => (
                                          <label
                                            key={opt}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}
                                          >
                                            <input
                                              type="radio"
                                              name={`quiz-${lesson.id}`}
                                              checked={picked === idx}
                                              onChange={() => setSelectedAnswers((prev) => ({ ...prev, [lesson.id]: idx }))}
                                            />
                                            <span>{opt}</span>
                                          </label>
                                        ))}
                                      </div>
                                      <div style={{ marginTop: 8 }}>
                                        <button
                                          type="button"
                                          className="button button-bright button-small"
                                          disabled={picked === undefined}
                                          onClick={() => completeLesson(lesson.id, picked)}
                                        >
                                          {lessonDone ? 'Re-check Answer' : 'Verify & Claim +5 XP / +1 CP'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}

                      {assessment && (
                        <div style={{ padding: 14, border: '1px solid #c3d7f2', borderRadius: 9, background: '#eff6ff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div>
                              <span className="section-kicker" style={{ color: '#1e5cb5' }}>PRACTICAL ASSESSMENT</span>
                              <h3 style={{ margin: '2px 0' }}>{assessment.title}</h3>
                            </div>
                            <span className={`listing-kind ${assessmentDone ? 'kind-success' : 'kind-featured'}`}>
                              {assessmentDone ? 'Assessment Passed' : `+${assessment.xpReward} XP · +${assessment.cpReward} CP`}
                            </span>
                          </div>
                          <p style={{ margin: '6px 0 10px', fontSize: 13 }}>{assessment.brief}</p>
                          {!assessmentDone && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <textarea
                                rows={2}
                                className="arena-textarea"
                                placeholder="Write your practical assessment response (min 20 characters)..."
                                value={assessmentText[assessment.id] ?? ''}
                                onChange={(e) => setAssessmentText((p) => ({ ...p, [assessment.id]: e.target.value }))}
                              />
                              <div>
                                <button
                                  type="button"
                                  className="button button-bright button-small"
                                  onClick={() => submitAssessment(assessment.id, assessmentText[assessment.id] ?? '')}
                                >
                                  Submit Practical Assessment
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
