// Same cubic topology as the shared person: no opacity swap or CSS path fallback.
type Kind = 'wall' | 'sound' | 'motion';
const parts = [
  "head",
  "left-arm",
  "right-arm",
  "forearm",
  "left-leg",
  "body",
  "right-leg"
] as const;
const soundOff = [
  "M11 11 C10.586 11 10.211 11.168 9.939 11.439 C9.668 11.711 9.5 12.086 9.5 12.5 C9.5 12.914 9.668 13.289 9.939 13.561 C10.211 13.832 10.586 14 11 14 C11.414 14 11.789 13.832 12.061 13.561 C12.332 13.289 12.5 12.914 12.5 12.5 C12.5 12.086 12.332 11.711 12.061 11.439 C11.789 11.168 11.414 11 11 11",
  "M11 4.5 C6.582 4.5 3 8.082 3 12.5 C3 16.918 6.582 20.5 11 20.5",
  "M11 4.5 C15.418 4.5 19 8.082 19 12.5",
  "M19 12.5 C19 14.709 18.105 16.709 16.657 18.157 C15.209 19.605 13.209 20.5 11 20.5",
  "M21 12.7 C20.1 12.9 19.3 13.2 18.5 13.5",
  "M21 3.5 C21 6.567 21 9.633 21 12.7",
  "M18.5 13.5 C19.3 14.1 20.1 13.8 21 12.7"
] as const;
const soundOn = [
  "M11 11 C10.586 11 10.211 11.168 9.939 11.439 C9.668 11.711 9.5 12.086 9.5 12.5 C9.5 12.914 9.668 13.289 9.939 13.561 C10.211 13.832 10.586 14 11 14 C11.414 14 11.789 13.832 12.061 13.561 C12.332 13.289 12.5 12.914 12.5 12.5 C12.5 12.086 12.332 11.711 12.061 11.439 C11.789 11.168 11.414 11 11 11",
  "M11 4.5 C6.582 4.5 3 8.082 3 12.5 C3 16.918 6.582 20.5 11 20.5",
  "M11 4.5 C15.418 4.5 19 8.082 19 12.5",
  "M19 12.5 C19 14.709 18.105 16.709 16.657 18.157 C15.209 19.605 13.209 20.5 11 20.5",
  "M17.3 12.7 C16.4 12.9 15.6 13.2 14.8 13.5",
  "M21 3.5 C19.767 6.567 18.533 9.633 17.3 12.7",
  "M14.8 13.5 C15.6 14.1 16.4 13.8 17.3 12.7"
] as const;
const motionOn = [
  "M7 5 C7 5 7 5 7 5 C7.966 5 8.75 5.784 8.75 6.75 C8.75 10.25 8.75 13.75 8.75 17.25 C8.75 18.216 7.966 19 7 19 C7 19 7 19 7 19 C6.034 19 5.25 18.216 5.25 17.25 C5.25 13.75 5.25 10.25 5.25 6.75 C5.25 5.784 6.034 5 7 5",
  "M17 5 C17 5 17 5 17 5 C17.966 5 18.75 5.784 18.75 6.75",
  "M18.75 6.75 C18.75 10.25 18.75 13.75 18.75 17.25",
  "M18.75 17.25 C18.75 18.216 17.966 19 17 19 C17 19 17 19 17 19",
  "M17 19 C16.034 19 15.25 18.216 15.25 17.25",
  "M15.25 17.25 C15.25 13.75 15.25 10.25 15.25 6.75",
  "M15.25 6.75 C15.25 5.784 16.034 5 17 5"
] as const;
const motionOff = [
  "M8 6.5 C8 5.7 8.8 5.3 9.6 5.8 C10.3 6.217 11 6.633 11.7 7.05 C12.4 7.467 13.1 7.883 13.8 8.3 C14.5 8.717 15.2 9.133 15.9 9.55 C16.6 9.967 17.3 10.383 18 10.8 C18.55 11.1 18.825 11.55 18.825 12 C18.825 12.45 18.55 12.9 18 13.2 C17.3 13.617 16.6 14.033 15.9 14.45",
  "M15.9 14.45 C15.2 14.867 14.5 15.283 13.8 15.7 C13.1 16.117 12.4 16.533 11.7 16.95",
  "M11.7 16.95 C11 17.367 10.3 17.783 9.6 18.2",
  "M9.6 18.2 C8.8 18.7 8 18.3 8 17.5 C8 16.583 8 15.667 8 14.75",
  "M8 14.75 C8 13.833 8 12.917 8 12",
  "M8 12 C8 11.083 8 10.167 8 9.25",
  "M8 9.25 C8 8.333 8 7.417 8 6.5"
] as const;
const soundPerson = [
  "M10 7 C9.393 7 8.843 6.754 8.444 6.356 C8.046 5.957 7.8 5.407 7.8 4.8 C7.8 4.192 8.046 3.643 8.444 3.244 C8.843 2.846 9.393 2.6 10 2.6 C10.607 2.6 11.157 2.846 11.556 3.244 C11.954 3.643 12.2 4.192 12.2 4.8 C12.2 5.407 11.954 5.957 11.556 6.356 C11.157 6.754 10.607 7 10 7",
  "M10 9.5 C8.9 10.2 7.8 11.3 7.1 12.4 C6.6 13.3 6.1 14.4 5.9 15.5",
  "M10 9.5 C11.433 9.767 12.867 10.033 14.3 10.3",
  "M14.3 10.3 C14 9.3 13.3 8.3 12.8 7.3 C12.7 6.5 12.8 5.7 13 5",
  "M10 15.5 C8.933 17.333 7.867 19.167 6.8 21",
  "M10 7 C10 9.833 10 12.667 10 15.5",
  "M10 15.5 C11.067 17.333 12.133 19.167 13.2 21"
] as const;
// Music is embodied by headphones and a relaxed listening pose in both toggle states.
// Keep the stock person below unchanged for the other toolbar controls.
const musicPerson: string[] = [...soundPerson];
musicPerson[0] = "M10 7 C9.448 7 8.948 6.776 8.586 6.414 C8.224 6.052 8 5.552 8 5 C8 4.448 8.224 3.948 8.586 3.586 C8.948 3.224 9.448 3 10 3 C10.552 3 11.052 3.224 11.414 3.586 C11.776 3.948 12 4.448 12 5 C12 5.552 11.776 6.052 11.414 6.414 C11.052 6.776 10.552 7 10 7";
musicPerson[1] = "M10 9.5 C8.4 10.5 6.9 11.5 6.7 12.8 C6.4 14 6.7 14.9 7.2 15.4";
musicPerson[2] = "M10 9.5 C12.267 10.1 14.533 10.7 16.8 11.3";
musicPerson[3] = "M16.8 11.3 C17.5 10.1 17.1 8.7 16.5 7.7 C16.1 7.1 16.2 6.5 16.2 6";
const headphones = [
  {part:'headband',person:"M4.8 5.3 C4.8 2.3 6.6 0.8 10 0.8 C13.4 0.8 15.2 2.3 15.2 5.3",arrow:"M11 4.5 C11 4.5 11 4.5 11 4.5 C11 4.5 11 4.5 11 4.5"},
  {part:'left-earcup',person:"M4.8 4.6 C3.467 4.6 3.467 8.2 4.8 8.2 C6.133 8.2 6.133 4.6 4.8 4.6",arrow:"M11 4.5 C11 4.5 11 4.5 11 4.5 C11 4.5 11 4.5 11 4.5"},
  {part:'right-earcup',person:"M15.2 4.6 C13.867 4.6 13.867 8.2 15.2 8.2 C16.533 8.2 16.533 4.6 15.2 4.6",arrow:"M11 4.5 C11 4.5 11 4.5 11 4.5 C11 4.5 11 4.5 11 4.5"}
];
// A slight resting lean survives when the finite sway has settled.
function upperLean(path: string, degrees = -5) {
  const coordinates = path.match(/-?\d*\.?\d+/g)!.map(Number);
  const angle = degrees * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle);
  let index = 0;
  return path.replace(/-?\d*\.?\d+/g, () => {
    const axis = index % 2, pair = index++ - axis;
    const x = coordinates[pair], y = coordinates[pair + 1];
    return (axis === 0 ? 10 + (x-10)*cosine - (y-15.5)*sine : 15.5 + (x-10)*sine + (y-15.5)*cosine).toFixed(3);
  });
}
const musicUpper = new Set(['head','left-arm','right-arm','forearm','body']);
const balancePerson: string[] = [...soundPerson];
balancePerson[1] = "M10 9.5 C8.3 9.2 6.7 8 5.2 7.1 C4.3 6.6 3.6 6.9 3.3 7.6";
balancePerson[2] = "M10 9.5 C11.833 10.733 13.667 11.967 15.5 13.2";
balancePerson[3] = "M15.5 13.2 C16.4 13.7 17.4 14.1 18.2 13.5 C18.7 13.1 18.9 12.5 18.8 12";
balancePerson[4] = "M10 15.5 C9.067 17.333 8.133 19.167 7.2 21";
balancePerson[6] = "M10 15.5 C15.2 17.3 16.8 18.2 13.4 19.2";
const hopPerson: string[] = [...soundPerson];
let coordinate = 0;
hopPerson[0] = soundPerson[0].replace(/-?\d*\.?\d+/g, value => String(Number(value) + (coordinate++ % 2 === 0 ? 1 : 0)));
hopPerson[1] = "M10.8 9.5 C8.9 9.4 7.1 8.9 6.2 7.8 C5.5 7.1 5.3 6.4 5.3 5.8";
hopPerson[3] = "M14.3 10.3 C15.8 10.4 17.3 9.7 18.3 8.4 C18.8 7.9 19.2 7.4 19.5 6.8";
hopPerson[4] = "M10.5 15.5 C8.9 17.2 7.5 18.9 5.8 19.8";
hopPerson[5] = "M11 7 C11 9.7 10.7 12.7 10.5 15.5";
hopPerson[6] = "M10.5 15.5 C13.2 15.4 16.3 16.1 17.5 18.3";
const listenPerson: string[] = [...soundPerson];
listenPerson[1] = "M10 9.5 C8.4 10.5 7.1 11.7 7.7 12.7 C8.3 13.7 10.4 13.4 11.3 12.8";
listenPerson[2] = "M10 9.5 C11.5 10.1 13 10.7 14.5 11.3";
listenPerson[3] = "M14.5 11.3 C15.1 10.1 14.8 8.7 14.1 7.5 C13.6 6.6 13.9 5.7 14.2 5.1";
listenPerson[4] = "M10 15.5 C9.1 17.333 8.2 19.167 7.3 21";
listenPerson[6] = "M10 15.5 C11.2 17.2 12.4 19 13.6 20.7";
// The original rounded speech bubble, split into matching cubic strokes.
const wallRest = [
  "M6 5 C8 5 10 5 12 5 C14 5 16 5 18 5 C18.552 5 19.052 5.224 19.414 5.586 C19.776 5.948 20 6.448 20 7 C20 8.167 20 9.333 20 10.5 C20 11.667 20 12.833 20 14 C20 14.552 19.776 15.052 19.414 15.414 C19.052 15.776 18.552 16 18 16",
  "M18 16 C16.5 16 15 16 13.5 16 C12 16 10.5 16 9 16",
  "M9 16 C8.167 16.667 7.333 17.333 6.5 18",
  "M6.5 18 C5.667 18.667 4.833 19.333 4 20 C4 18.917 4 17.833 4 16.75",
  "M4 16.75 C4 15.667 4 14.583 4 13.5",
  "M4 13.5 C4 11.333 4 9.167 4 7",
  "M4 7 C4 5.895 4.895 5 6 5"
];
const palmRest = "M4 20 C4 20 4 20 4 20";
const palmPerson = "M14.2 5.1 C14.6 4.4 14.5 3.7 13.9 3.5";

export function homeControlGesture(kind: Kind, active: boolean) {
  return kind === 'wall' ? 'home-warm-listen' : kind === 'sound' ? 'home-music' : (active ? 'home-balance' : 'home-hop');
}
export function homeControlStrokes(kind: Kind, active: boolean) {
  const rest = kind === 'wall' ? wallRest : kind === 'sound' ? (active ? soundOn : soundOff) : (active ? motionOn : motionOff);
  const person = kind === 'wall' ? listenPerson : kind === 'sound' ? musicPerson : (active ? balancePerson : hopPerson);
  const strokes: {part:string;arrow:string;person:string}[] = parts.map((part,index) => ({part, arrow:rest[index], person:person[index]}));
  if (kind === 'sound') {
    for (const stroke of strokes) if (musicUpper.has(stroke.part)) stroke.person = upperLean(stroke.person);
    for (const stroke of headphones) strokes.push({...stroke,person:upperLean(stroke.person)});
  }
  if (kind === 'wall') {
    for (const stroke of strokes) if (musicUpper.has(stroke.part)) stroke.person = upperLean(stroke.person,8);
    strokes.push({part:'palm',arrow:palmRest,person:upperLean(palmPerson,8)});
  }
  return strokes;
}
