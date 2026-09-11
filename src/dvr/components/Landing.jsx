import { useState } from 'react'
import { MIcon } from './common.jsx'
import SearchPill from './SearchPill.jsx'

// Driver lookup jumps straight to the Drivers item list (skips the category
// picker); Trip footage opens the category picker itself, since a trip is
// found by driver/asset/event, not by typing anything trip-specific.
const QUICK_CARDS = [
  { icon: 'person', title: 'Driver lookup', sub: 'Last trip, incident history', q: 'Show last trip for driver ', category: 'Drivers' },
  { icon: 'videocam', title: 'Trip footage', sub: 'Clips, timelapse, departure', q: 'Get DVR footage for trip ', openCats: true },
]

// Landing screen: prompt, search pill, and quick-start cards.
export default function Landing({ pillProps }) {
  const [seed, setSeed] = useState({ text: '', n: 0 })

  return (
    <div className="landing">
      <div className="landing-title">What footage do you need?</div>
      <SearchPill variant="landing" seed={seed} {...pillProps} />
      <div className="quick-cards">
        {QUICK_CARDS.map((c) => (
          <div
            className="quick-card"
            key={c.title}
            onClick={() => setSeed((s) => ({ text: c.q, category: c.category, openCats: c.openCats, n: s.n + 1 }))}
          >
            <div className="qc-icon">
              <MIcon name={c.icon} size={14} />
            </div>
            <div>
              <div className="qc-title">{c.title}</div>
              <div className="qc-sub">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
