import {inviteStrokes, rotateInviteArrow} from '../../lib/invite-shapes';

// Animation is owned by the surrounding React surface, not individual icons.
export default function InviteMark() {
  return <span className="invite-mark" data-invite-mark="" data-invite-direction="right" aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      {inviteStrokes.map(({part, arrow, person}) => {
        const start = rotateInviteArrow(arrow);
        return <path key={part} data-invite-part={part} data-invite-arrow={start} data-invite-person={person} d={start}/>;
      })}
    </svg>
  </span>;
}
