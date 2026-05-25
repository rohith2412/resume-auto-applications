'use client'

import { useState, useRef, useEffect } from 'react'

export const UNIVERSITIES = [
  'MIT', 'Stanford University', 'Harvard University', 'Caltech', 'University of Chicago',
  'Princeton University', 'Yale University', 'Columbia University', 'UPenn', 'Cornell University',
  'Duke University', 'Northwestern University', 'Johns Hopkins University', 'Dartmouth College',
  'Brown University', 'Vanderbilt University', 'Rice University', 'Notre Dame', 'Washington University in St. Louis',
  'Emory University', 'Georgetown University', 'Carnegie Mellon University', 'UC Berkeley',
  'UCLA', 'UC San Diego', 'UC Santa Barbara', 'UC Davis', 'UC Irvine', 'University of Michigan',
  'University of Virginia', 'University of North Carolina', 'Georgia Tech', 'University of Florida',
  'University of Texas at Austin', 'Ohio State University', 'Penn State', 'Purdue University',
  'University of Wisconsin–Madison', 'University of Washington', 'University of Illinois Urbana-Champaign',
  'University of Minnesota', 'University of Colorado Boulder', 'Arizona State University',
  'University of Arizona', 'Boston University', 'Northeastern University', 'Tufts University',
  'Boston College', 'George Washington University', 'American University', 'NYU',
  'Fordham University', 'Syracuse University', 'Rochester Institute of Technology',
  'Rensselaer Polytechnic Institute', 'Stevens Institute of Technology', 'Drexel University',
  'Temple University', 'University of Maryland', 'Virginia Tech', 'William & Mary',
  'University of Pittsburgh', 'Case Western Reserve University', 'Wake Forest University',
  'Lehigh University', 'Miami University', 'Indiana University', 'Michigan State University',
  'University of Southern California', 'University of Notre Dame', 'Tulane University',
  'Rutgers University', 'CUNY', 'Cal Poly', 'San Jose State University', 'University of Oregon',
  'University of Utah', 'Brigham Young University', 'University of Nevada Las Vegas',
  'Florida State University', 'University of Miami', 'Howard University', 'Morehouse College',
  'Spelman College', 'Hampton University', 'Xavier University of Louisiana',
  'Community College', 'Bootcamp / Coding School', 'Online Program', 'Trade School',
  'Oxford University', 'Cambridge University', 'University of Toronto', 'McGill University',
  'University of British Columbia', 'University of Waterloo', 'London School of Economics',
  'Imperial College London', 'University of Melbourne', 'National University of Singapore',
  'Self-taught / No formal degree',
]

export const LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
  'Indianapolis, IN', 'San Francisco, CA', 'Seattle, WA', 'Denver, CO', 'Nashville, TN',
  'Oklahoma City, OK', 'El Paso, TX', 'Washington, DC', 'Las Vegas, NV', 'Louisville, KY',
  'Memphis, TN', 'Portland, OR', 'Baltimore, MD', 'Milwaukee, WI', 'Albuquerque, NM',
  'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA', 'Kansas City, MO', 'Mesa, AZ',
  'Atlanta, GA', 'Omaha, NE', 'Colorado Springs, CO', 'Raleigh, NC', 'Long Beach, CA',
  'Virginia Beach, VA', 'Minneapolis, MN', 'Tampa, FL', 'New Orleans, LA', 'Arlington, TX',
  'Wichita, KS', 'Bakersfield, CA', 'Aurora, CO', 'Anaheim, CA', 'Santa Ana, CA',
  'Corpus Christi, TX', 'Riverside, CA', 'St. Louis, MO', 'Lexington, KY', 'Pittsburgh, PA',
  'Stockton, CA', 'Anchorage, AK', 'Cincinnati, OH', 'St. Paul, MN', 'Greensboro, NC',
  'Toledo, OH', 'Newark, NJ', 'Plano, TX', 'Henderson, NV', 'Orlando, FL',
  'Jersey City, NJ', 'Chandler, AZ', 'St. Petersburg, FL', 'Laredo, TX', 'Norfolk, VA',
  'Madison, WI', 'Durham, NC', 'Lubbock, TX', 'Winston-Salem, NC', 'Garland, TX',
  'Glendale, AZ', 'Hialeah, FL', 'Reno, NV', 'Baton Rouge, LA', 'Irvine, CA',
  'Chesapeake, VA', 'Scottsdale, AZ', 'North Las Vegas, NV', 'Fremont, CA', 'Gilbert, AZ',
  'San Bernardino, CA', 'Boise, ID', 'Birmingham, AL', 'Rochester, NY', 'Richmond, VA',
  'Spokane, WA', 'Des Moines, IA', 'Montgomery, AL', 'Modesto, CA', 'Fayetteville, NC',
  'Tacoma, WA', 'Shreveport, LA', 'Fontana, CA', 'Moreno Valley, CA', 'Glendale, CA',
  'Akron, OH', 'Yonkers, NY', 'Huntington Beach, CA', 'Columbus, GA', 'Little Rock, AR',
  'Augusta, GA', 'Amarillo, TX', 'Mobile, AL', 'Grand Rapids, MI', 'Salt Lake City, UT',
  'Tallahassee, FL', 'Huntsville, AL', 'Worcester, MA', 'Knoxville, TN', 'Providence, RI',
  'Boston, MA', 'Miami, FL', 'Detroit, MI', 'Portland, ME', 'Hartford, CT',
  'New Haven, CT', 'Bridgeport, CT', 'Buffalo, NY', 'Albany, NY', 'Syracuse, NY',
  'Remote', 'Hybrid', 'Open to relocation',
  'London, UK', 'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada',
  'Sydney, Australia', 'Melbourne, Australia', 'Singapore', 'Dublin, Ireland',
  'Berlin, Germany', 'Amsterdam, Netherlands', 'Paris, France', 'Zurich, Switzerland',
]

export default function AutocompleteInput({ value, onChange, placeholder, suggestions, className = 'input', style = {} }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const filtered = value.trim().length === 0
    ? suggestions.slice(0, 8)
    : suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKey(e) {
    if (!open) { if (e.key === 'ArrowDown') setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); select(filtered[highlighted]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  function select(val) {
    onChange(val)
    setOpen(false)
    setHighlighted(-1)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'hidden', maxHeight: '260px', overflowY: 'auto' }}>
          {filtered.map((s, i) => (
            <div
              key={s}
              onMouseDown={() => select(s)}
              onMouseEnter={() => setHighlighted(i)}
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem', cursor: 'pointer', background: i === highlighted ? '#f3f4f6' : '#fff', color: '#111', transition: 'background 0.1s', borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
