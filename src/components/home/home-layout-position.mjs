// Layout-independent chapter identity/progress. Preserve progress > 1 in the
// authored spacer after projects; never replace the actual chapter with hash.
export function captureChapterPosition(chapters,y,focusOrigin='') {
  let section=chapters[0];for(const candidate of chapters)if(y>=candidate.y)section=candidate;
  return {chapterId:section?.id??'intro',localProgress:section?Math.max(0,(y-section.y)/Math.max(1,section.height)):0,scrollY:y,focusOrigin};
}
export function projectChapterPosition(chapters,state) {
  const section=chapters.find(s=>s.id===state.chapterId);
  return section?section.y+section.height*state.localProgress:0;
}
