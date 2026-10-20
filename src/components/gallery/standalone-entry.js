// Static/Vite preview adapter; the Astro route owns its home link through the
// shared custom element, while this entry decorates the same plain anchor.
import {decorateDivisionBellReturn} from '../navigation/division-bell-dom';
import './scene.js';

const disposeHomeReturn=decorateDivisionBellReturn(document.getElementById('gallery-home-return'),{label:'首页',compact:true,iconOnly:true});
window.addEventListener('pagehide',event=>{if(!event.persisted)disposeHomeReturn();});
