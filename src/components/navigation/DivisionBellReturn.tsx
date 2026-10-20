import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { divisionBellGlyph } from './division-bell-glyph';
import { installDivisionBellReturn } from './division-bell-return';
import '../../styles/division-bell-return.css';
type Content = { label: string; compact?: boolean; iconOnly?: boolean };
export const DivisionBellReturnLink = forwardRef<HTMLAnchorElement, Content & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'|'href'> & {href: string}>(
  function DivisionBellReturnLink({ label, compact, iconOnly = false, className = '', ...props }, ref) {
    const node = useRef<HTMLAnchorElement>(null), key = useId();
    useImperativeHandle(ref, () => node.current!);
    useEffect(() => node.current ? installDivisionBellReturn(node.current) : undefined, []);
    return <a {...props} ref={node} className={`db-return ${className}`} data-compact={compact || undefined} data-icon-only={iconOnly || undefined} title={iconOnly ? undefined : props.title} aria-label={props['aria-label'] || label}><span className="db-return-glyph-slot" dangerouslySetInnerHTML={{__html: divisionBellGlyph(key)}}/><span className="db-return-label" data-db="word" hidden={iconOnly}>{label}</span></a>;
  });
export const DivisionBellReturnButton = forwardRef<HTMLButtonElement, Content & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>>(
  function DivisionBellReturnButton({ label, compact, iconOnly = false, className = '', ...props }, ref) {
    const node = useRef<HTMLButtonElement>(null), key = useId();
    useImperativeHandle(ref, () => node.current!);
    useEffect(() => node.current ? installDivisionBellReturn(node.current) : undefined, []);
    return <button type="button" {...props} ref={node} className={`db-return ${className}`} data-compact={compact || undefined} data-icon-only={iconOnly || undefined} title={iconOnly ? undefined : props.title} aria-label={props['aria-label'] || label}><span className="db-return-glyph-slot" dangerouslySetInnerHTML={{__html: divisionBellGlyph(key)}}/><span className="db-return-label" data-db="word" hidden={iconOnly}>{label}</span></button>;
  });
