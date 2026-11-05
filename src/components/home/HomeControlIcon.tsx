import { homeControlStrokes, homeControlGesture } from '../../lib/home-control-shapes';

type Props = { kind: 'sound' | 'motion'; active: boolean };

/** The parent toolbar owns one finite controller for all three marks. */
export default function HomeControlIcon({ kind, active }: Props) {
  return <span className="home-control-mark" data-home-control-mark="" data-invite-gesture={homeControlGesture(kind,active)} aria-hidden="true">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      {homeControlStrokes(kind,active).map(({part,arrow,person}) => <path key={part} fill={part.endsWith('earcup') ? 'currentColor' : undefined} data-invite-part={part} data-invite-arrow={arrow} data-invite-person={person} d={arrow} />)}
    </svg>
  </span>;
}
