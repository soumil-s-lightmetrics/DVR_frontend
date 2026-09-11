import { useEffect, useRef, useState } from 'react'
import { CLIENT_IDS } from '../lib/clientIds.js'

// Free-text client ID field with a filtered suggestion menu.
//
// This deliberately does NOT use <datalist>: the browser renders that popup
// itself, ignoring all CSS, so it showed up as a huge OS-themed (dark) list
// next to an otherwise white UI. A plain menu we render ourselves inherits the
// app's palette and stays whatever size we say.
//
// Still free text — anything typed is submitted as-is, including accounts
// missing from CLIENT_IDS. The list is a typing aid, not a whitelist.
export default function ClientIdInput({ value, onChange, onEnter, disabled }) {
  const [open, setOpen] = useState(false)
  const [focusIdx, setFocusIdx] = useState(-1)
  const wrapRef = useRef(null)
  const menuRef = useRef(null)

  const q = value.trim().toLowerCase()
  // An exact match means the user has already picked one — showing a
  // single-item menu over it is just noise, so treat it as nothing to suggest.
  const matches = q && CLIENT_IDS.includes(q) ? [] : CLIENT_IDS.filter((id) => id.includes(q))
  const showMenu = open && matches.length > 0

  // Close when focus or a click lands anywhere outside the field + menu.
  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open])

  // Keep the keyboard-highlighted row inside the scroll viewport.
  useEffect(() => {
    if (focusIdx < 0) return
    menuRef.current?.querySelectorAll('.client-opt')[focusIdx]?.scrollIntoView({ block: 'nearest' })
  }, [focusIdx])

  const pick = (id) => {
    onChange(id)
    setOpen(false)
    setFocusIdx(-1)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!showMenu) {
        setOpen(true)
        return
      }
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1
      setFocusIdx((i) => {
        const next = i + dir
        if (next < 0) return matches.length - 1
        if (next >= matches.length) return 0
        return next
      })
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setFocusIdx(-1)
      return
    }
    if (e.key === 'Enter') {
      // Enter commits the highlighted suggestion if there is one; otherwise it
      // falls through to the parent's "load fleet" action.
      if (showMenu && focusIdx >= 0) {
        e.preventDefault()
        pick(matches[focusIdx])
        return
      }
      setOpen(false)
      onEnter?.()
    }
  }

  return (
    <div className="client-combo" ref={wrapRef}>
      <input
        className="fleet-input"
        placeholder="Client ID…"
        value={value}
        disabled={disabled}
        role="combobox"
        aria-expanded={showMenu}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setFocusIdx(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showMenu && (
        <div className="client-menu" ref={menuRef} role="listbox">
          {matches.map((id, i) => (
            <div
              key={id}
              role="option"
              aria-selected={i === focusIdx}
              className={`client-opt${i === focusIdx ? ' focused' : ''}`}
              // mousedown, not click: click fires after blur, which would have
              // already closed the menu and swallowed the selection.
              onMouseDown={(e) => {
                e.preventDefault()
                pick(id)
              }}
            >
              {id}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
