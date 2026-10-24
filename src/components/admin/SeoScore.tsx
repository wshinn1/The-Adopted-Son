'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Loader2, Plus, Sparkles, TriangleAlert, X } from 'lucide-react'
import {
  clearSeoSuggestionsAction, keepSeoSuggestionsAction, loadSeoSuggestionsAction,
  suggestSeoAction, type SavedSeoSuggestions, type SeoSuggestions,
} from '@/app/admin/seo-actions'
import {
  contentFromHtml, minimumWords, scoreSeo, scoreState, wordCount,
  type PageContent, type ScoreInput, type SeoPatch,
} from '@/lib/seo-check'
import { type Seo } from '@/lib/seo'
import { seoDraftHtml, seoDraftText, seoSectionTypes, toSeoDraft, type SeoDraft } from '@/lib/seo-sections'

const stateLabel = { good: 'Good', ok: 'Needs work', bad: 'Poor' }

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const state = scoreState(score)
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  return (
    <span className={`seo-ring ${state}`} style={{ width: size, height: size }} aria-label={`SEO score ${score}/100: ${stateLabel[state]}`}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="seo-ring-track" />
        <circle cx={size / 2} cy={size / 2} r={r} className="seo-ring-value" strokeDasharray={`${(score / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <strong>{score}</strong>
    </span>
  )
}

export function ScoreDot({ score }: { score: number }) {
  const state = scoreState(score)
  return (
    <span className={`seo-dot ${state}`} title={`SEO score ${score}/100: ${stateLabel[state]}`} aria-label={`SEO score ${score}/100`}>
      {score}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="text-button seo-copy"
      onClick={() => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {}) }}
    >
      {copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Gain({ points, why }: { points: number; why?: string }) {
  if (points < 0 && why) return <small className="seo-gain down" title={why}>−{-points}</small>
  if (points === 0) return <small className="seo-gain none">+0</small>
  return <small className={`seo-gain ${points > 0 ? 'up' : 'down'}`}>{points > 0 ? `+${points}` : `−${-points}`}</small>
}

function UseButton({ inUse, points, onUse }: { inUse: boolean; points: number; onUse: () => void }) {
  if (inUse) return <span className="seo-alt-saved"><Check />In use</span>
  return <span className="seo-use"><Gain points={points} /><button type="button" className="text-button" onClick={onUse}>Use</button></span>
}

function suggestedWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'earlier'
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000)
  if (days === 0) return `today at ${time}`
  if (days === 1) return `yesterday at ${time}`
  return `on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${time}`
}

/** Drafted sections to append to a post's HTML content. */
function BuildOut({ drafts, noun, words: wordCnt, target, gainFor, addToHtml, added, onAdded }: {
  drafts: SeoDraft[]
  noun: string
  words: number
  target: number
  gainFor: (contents: PageContent[]) => number
  addToHtml?: (html: string) => void
  added: Record<number, boolean>
  onAdded: (added: Record<number, boolean>) => void
}) {
  const addedWords = drafts.reduce((sum, d) => sum + wordCount(d.text), 0)
  const waiting = drafts.map((_, i) => i).filter((i) => !added[i])

  const add = (indexes: number[]) => {
    if (!addToHtml || !indexes.length) return
    addToHtml(indexes.map((i) => seoDraftHtml(drafts[i])).join(''))
    onAdded({ ...added, ...Object.fromEntries(indexes.map((i) => [i, true])) })
  }

  return (
    <div>
      <div className="seo-alt-head">
        <span className="seo-field-label">Build out this {noun}</span>
        <span className="seo-use">
          {waiting.length > 0 && <Gain points={gainFor(waiting.map((i) => contentFromHtml(seoDraftHtml(drafts[i]))))} />}
          {addToHtml && waiting.length > 0 && (
            <button type="button" className="seo-secondary-button" onClick={() => add(waiting)}>
              <Plus />{waiting.length === drafts.length ? `Add all to the ${noun}` : `Add the other ${waiting.length}`}
            </button>
          )}
          {!addToHtml && <CopyButton text={drafts.map(seoDraftText).join('\n\n')} />}
        </span>
      </div>
      <p className="seo-hint">
        Your {noun} has {wordCnt.toLocaleString()} words; around {target.toLocaleString()} helps it rank. These are drafted from what it already says and add about {addedWords.toLocaleString()} words.
        {addToHtml ? ` Adding one puts it at the end of your ${noun}'s text. Save the ${noun} to keep it.` : ` Edit them to sound like you, paste them into the ${noun}, then save.`}
      </p>
      {drafts.map((draft, i) => (
        <div className="seo-option seo-section" key={draft.heading + draft.text.slice(0, 20) + i}>
          <span>
            <strong>{draft.heading}</strong>
            {draft.text.split(/\n+/).filter(Boolean).map((p, n) => <span className="seo-section-text" key={n}>{p}</span>)}
          </span>
          <span className="seo-alt-actions">
            {added[i]
              ? <span className="seo-alt-saved"><Check />Added</span>
              : <span className="seo-use">
                  <Gain points={gainFor([contentFromHtml(seoDraftHtml(draft))])} />
                  {addToHtml && <button type="button" className="text-button" onClick={() => add([i])}>Add to {noun}</button>}
                </span>
            }
            <CopyButton text={seoDraftText(draft)} />
          </span>
        </div>
      ))}
    </div>
  )
}

export type SeoScoreProps = {
  input: ScoreInput
  onChange: (patch: SeoPatch) => void
  /** For devotionals: appends drafted HTML to the post content. */
  addToHtml?: (html: string) => void
  /** Injects suggested alt text directly into the content by matching src URLs. */
  applyImageAlts?: (alts: { src: string; alt: string }[]) => void
  saveKey?: string
}

export function SeoScore({ input, onChange, addToHtml, applyImageAlts, saveKey = '' }: SeoScoreProps) {
  const content = input.content
  const report = scoreSeo(input)
  const currentSlug = input.path.split('/').filter(Boolean).pop() ?? ''

  const scoreWith = (change: SeoPatch, text: { heading?: string; opening?: string; sections?: PageContent[] } = {}) => {
    const { slug, ...patch } = change
    const withText = {
      ...content,
      headings: [...content.headings, ...(text.heading ? [text.heading] : []), ...(text.sections ?? []).flatMap((s) => s.headings)],
      text: [text.opening, content.text, ...(text.sections ?? []).map((s) => s.text)].filter(Boolean).join(' '),
    }
    return scoreSeo({ ...input, path: slug ? input.path.replace(/[^/]*$/, slug) : input.path, seo: { ...input.seo, ...patch }, content: withText }).score
  }

  const gain = (patch: SeoPatch, text?: { heading?: string; opening?: string; sections?: PageContent[] }) =>
    scoreWith(patch, text) - report.score

  const keywordWhy = 'A keyword earns points for each place it appears, so this one appears in fewer places than your current keyword.'

  const [ai, setAi] = useState<SavedSeoSuggestions | null>(null)
  const keyRef = useRef('')
  const aiRef = useRef(ai)
  aiRef.current = ai

  useEffect(() => {
    const previous = keyRef.current
    keyRef.current = saveKey
    if (previous && previous !== saveKey) setAi(null)
    if (!saveKey) return
    if (!previous && aiRef.current) {
      keepSeoSuggestionsAction(saveKey, aiRef.current).catch(() => {})
      return
    }
    let current = true
    loadSeoSuggestionsAction(saveKey).then((saved) => {
      if (current && keyRef.current === saveKey) setAi(saved)
    }).catch(() => {})
    return () => { current = false }
  }, [saveKey])

  const clearAi = () => {
    setAi(null)
    if (saveKey) clearSeoSuggestionsAction(saveKey).catch(() => {})
  }

  const [added, setAdded] = useState<Record<number, boolean>>({})
  useEffect(() => setAdded({}), [ai])
  const [appliedAlts, setAppliedAlts] = useState<Record<string, boolean>>({})
  useEffect(() => setAppliedAlts({}), [ai])
  const drafts = useMemo(() => (ai?.buildOut ?? []).map(toSeoDraft), [ai])

  const planKeyword = input.seo.keyword.trim() || ai?.keyword || ''
  const planGain = (patch: SeoPatch, text?: { heading?: string; opening?: string; sections?: PageContent[] }) =>
    planKeyword === input.seo.keyword.trim()
      ? gain(patch, text)
      : scoreWith({ keyword: planKeyword, ...patch }, text) - scoreWith({ keyword: planKeyword })

  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const askAi = async () => {
    setPending(true)
    setError('')
    try {
      const result = await suggestSeoAction({
        noun: input.noun, title: input.title, path: input.path, siteTitle: input.siteTitle,
        keyword: input.seo.keyword, seoTitle: input.seo.title, description: input.seo.description,
        headings: content.headings, text: content.text, images: content.images,
        slugEditable: input.slugEditable, siteDescription: input.siteDescription,
        wordCount: wordCount(content.text), targetWords: minimumWords(input.noun), saveKey,
      })
      if (result.ok) setAi(result.data)
      else setError(result.error)
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  const best = useMemo(() => {
    if (!ai) return null
    const options = (current: string, picks: string[]) => [current, ...picks.filter((p) => p && p !== current)]
    let top = { score: -1, patch: {} as SeoPatch }
    const slugs = input.slugEditable ? options(currentSlug, [ai.slug]) : [currentSlug]
    for (const title of options(input.seo.title, ai.titles))
      for (const description of options(input.seo.description, ai.descriptions))
        for (const keyword of options(input.seo.keyword, [ai.keyword, ...ai.relatedKeywords]))
          for (const slug of slugs) {
            const patch: SeoPatch = { title, description, keyword, ...(slug !== currentSlug ? { slug } : {}) }
            const score = scoreWith(patch)
            if (score > top.score) top = { score, patch }
          }
    const patch = Object.fromEntries(
      Object.entries(top.patch).filter(([key, value]) => (key === 'slug' ? value !== currentSlug : input.seo[key as keyof Seo] !== value))
    ) as SeoPatch
    const text = { heading: ai.heading, opening: ai.openingSentence, sections: drafts.filter((_, i) => !added[i]).map((d) => contentFromHtml(seoDraftHtml(d))) }
    return { patch, textScore: top.score, score: top.score, fullScore: scoreWith(top.patch, text) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai, input, content, drafts, added])

  const bestFields = best ? Object.keys(best.patch).map((key) => (key === 'title' ? 'title' : key === 'description' ? 'description' : key === 'slug' ? 'URL' : 'keyword')) : []
  const state = scoreState(report.score)

  return (
    <div className="seo-score">
      <div className="seo-score-head">
        <ScoreRing score={report.score} />
        <div>
          <strong>SEO score: {stateLabel[state]}</strong>
          <p className="seo-hint">A guide to good practice, updated as you edit. Search engines don&apos;t publish their own scores.</p>
        </div>
      </div>

      <label className="seo-keyword">
        <span>Focus keyword</span>
        <input
          value={input.seo.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
          placeholder="The phrase you want people to find this by"
        />
      </label>
      {!input.seo.keyword && report.keywordIdeas.length > 0 && (
        <div className="seo-ideas" aria-label="Keyword ideas from this page">
          <span className="seo-hint">From your text:</span>
          {report.keywordIdeas.map((idea) => (
            <button key={idea} type="button" className="seo-chip" onClick={() => onChange({ keyword: idea })}>
              {idea} <Gain points={gain({ keyword: idea })} why={keywordWhy} />
            </button>
          ))}
        </div>
      )}

      <ul className="seo-checks">
        {report.checks.map((check) => (
          <li key={check.id} className={check.state}>
            {check.state === 'good' ? <Check aria-label="Good" /> : check.state === 'ok' ? <TriangleAlert aria-label="Needs work" /> : <X aria-label="Problem" />}
            <span>{check.label}</span>
            {check.fix && (
              <span className="seo-use seo-fix-wrap">
                <Gain points={gain(check.fix.patch)} why={'keyword' in check.fix.patch ? keywordWhy : undefined} />
                <button type="button" className="text-button seo-fix" onClick={() => onChange(check.fix!.patch)}>{check.fix.label}</button>
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="seo-ai">
        <button type="button" className="seo-secondary-button" onClick={askAi} disabled={pending}>
          {pending ? <Loader2 className="seo-spin" /> : <Sparkles />}
          {pending ? 'Reading your post…' : ai ? 'Suggest again' : 'Suggest with AI'}
        </button>
        <span className="seo-hint">
          Reads this {input.noun}&apos;s current text and suggests a keyword with a title, description, URL and heading to match.
          {input.noun === 'post' ? " If it's short, it also drafts more content." : ''}
        </span>
      </div>
      {error && <p className="seo-hint seo-error" role="alert">{error}</p>}

      {ai && (
        <div className="seo-ai-results" aria-live="polite">
          <p className="seo-hint seo-ai-when">
            Suggested {suggestedWhen(ai.savedAt)}{saveKey ? ', and kept until you ask again' : ''}.{' '}
            <button type="button" className="text-button" onClick={clearAi}>Clear</button>
          </p>
          {best && (best.score > report.score
            ? <div className="seo-best">
                <span>Picking the best of these would take your score from <strong>{report.score}</strong> to <strong>{best.score}</strong> <Gain points={best.score - report.score} /></span>
                {bestFields.length > 0 && (
                  <button type="button" className="seo-secondary-button" onClick={() => onChange(best.patch)}>
                    Use the best {bestFields.join(', ').replace(/, ([^,]*)$/, ' and $1')}<Gain points={best.textScore - report.score} />
                  </button>
                )}
                {best.fullScore > best.score && <small className="seo-alt-note">Adding the new sections, heading and opening sentence would take it to <strong>{best.fullScore}</strong>.</small>}
                {best.patch.slug && <small className="seo-alt-note">Changing the URL to /{best.patch.slug}: the old address redirects after you save.</small>}
              </div>
            : <p className="seo-hint">Your score is already as high as these suggestions can take it.</p>)}

          {ai.titles.length > 0 && (
            <div>
              <span className="seo-field-label">SEO titles</span>
              {ai.titles.map((title) => (
                <div className="seo-option" key={title}>
                  <span>{title} <small>{title.length}</small></span>
                  <UseButton inUse={title === input.seo.title} points={planGain({ title })} onUse={() => onChange({ title })} />
                </div>
              ))}
            </div>
          )}
          {ai.descriptions.length > 0 && (
            <div>
              <span className="seo-field-label">Meta descriptions</span>
              {ai.descriptions.map((desc) => (
                <div className="seo-option" key={desc}>
                  <span>{desc} <small>{desc.length}</small></span>
                  <UseButton inUse={desc === input.seo.description} points={planGain({ description: desc })} onUse={() => onChange({ description: desc })} />
                </div>
              ))}
            </div>
          )}
          {ai.keyword && (
            <div>
              <span className="seo-field-label">Focus keyword</span>
              {[ai.keyword, ...ai.relatedKeywords.filter((k) => k.toLowerCase() !== ai.keyword.toLowerCase())].map((keyword, i) => (
                <div className="seo-option" key={keyword}>
                  <span>
                    {keyword}{i === 0 ? <small> · best fit</small> : null}
                    {i === 0 && ai.keywordReason && <small className="seo-alt-note">{ai.keywordReason}</small>}
                  </span>
                  <UseButton inUse={keyword === input.seo.keyword} points={gain({ keyword })} onUse={() => onChange({ keyword })} />
                </div>
              ))}
              {planKeyword !== input.seo.keyword.trim() && (
                <p className="seo-hint">Everything here is written around &ldquo;{planKeyword}&rdquo;, and the points shown assume you use it as your keyword.</p>
              )}
            </div>
          )}
          {ai.slug && input.slugEditable && (
            <div>
              <span className="seo-field-label">URL</span>
              <div className="seo-option">
                <span>
                  /{input.path.replace(/[^/]*$/, ai.slug).replace(/^\//, '')}
                  <small className="seo-alt-note">The old address redirects to the new one after you save.</small>
                </span>
                <UseButton inUse={ai.slug === currentSlug} points={planGain({ slug: ai.slug })} onUse={() => onChange({ slug: ai.slug })} />
              </div>
            </div>
          )}
          {(ai.heading || ai.openingSentence) && (
            <div>
              <span className="seo-field-label">For your {input.noun}&apos;s text</span>
              <p className="seo-hint">Add these in the {input.noun}&apos;s content to put the keyword in your opening text and a heading.</p>
              {ai.openingSentence && (
                <div className="seo-option">
                  <span><small>Start your first paragraph with:</small> {ai.openingSentence}</span>
                  <span className="seo-use"><Gain points={planGain({}, { opening: ai.openingSentence })} /><CopyButton text={ai.openingSentence} /></span>
                </div>
              )}
              {ai.heading && (
                <div className="seo-option">
                  <span><small>Add a heading:</small> {ai.heading}</span>
                  <span className="seo-use"><Gain points={planGain({}, { heading: ai.heading })} /><CopyButton text={ai.heading} /></span>
                </div>
              )}
            </div>
          )}
          {drafts.length > 0 && (
            <BuildOut
              key={drafts.map((d) => d.heading).join(' ')}
              drafts={drafts}
              noun={input.noun}
              words={wordCount(content.text)}
              target={minimumWords(input.noun)}
              gainFor={(sections) => planGain({}, { sections })}
              addToHtml={addToHtml}
              added={added}
              onAdded={setAdded}
            />
          )}
          {ai.imageAlts && ai.imageAlts.length > 0 && (
            <div>
              <div className="seo-alt-head">
                <span className="seo-field-label">Image alt text</span>
                <span className="seo-use">
                  {applyImageAlts && ai.imageAlts.some(({ src }) => !appliedAlts[src]) && (
                    <button type="button" className="seo-secondary-button" onClick={() => {
                      const pending = ai.imageAlts.filter(({ src }) => !appliedAlts[src])
                      applyImageAlts(pending)
                      setAppliedAlts(prev => ({ ...prev, ...Object.fromEntries(pending.map(a => [a.src, true])) }))
                    }}>
                      <Plus />Apply all
                    </button>
                  )}
                  {!applyImageAlts && <CopyButton text={ai.imageAlts.map(({ alt }) => alt).join('\n')} />}
                </span>
              </div>
              <p className="seo-hint">
                {applyImageAlts
                  ? `These alt texts are matched to your images by URL. Applying updates the content — save the ${input.noun} to keep the changes.`
                  : 'Copy each alt text and paste it into the image settings in your content.'}
              </p>
              {ai.imageAlts.map(({ src, alt }) => (
                <div className="seo-option" key={src}>
                  <span>
                    <small className="seo-alt-note" style={{ wordBreak: 'break-all' }}>{src.split('/').pop()}</small>
                    {alt}
                  </span>
                  <span className="seo-alt-actions">
                    {appliedAlts[src]
                      ? <span className="seo-alt-saved"><Check />Applied</span>
                      : applyImageAlts
                        ? <button type="button" className="text-button" onClick={() => {
                            applyImageAlts([{ src, alt }])
                            setAppliedAlts(prev => ({ ...prev, [src]: true }))
                          }}>Apply</button>
                        : null
                    }
                    <CopyButton text={alt} />
                  </span>
                </div>
              ))}
            </div>
          )}
          {ai.advice.length > 0 && (
            <div>
              <span className="seo-field-label">Ideas for the content</span>
              <ul className="seo-advice">{ai.advice.map((tip) => <li key={tip}>{tip}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
