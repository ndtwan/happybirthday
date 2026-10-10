export const PHOTO_COUNT = 4;
export const freshState = () => ({ scene: 0, unlocked: 0, candle: false, photo: 0, flipped: false, seen: [], watered: [], packed: [], launched: false });
const indexes = value => Array.isArray(value) ? [...new Set(value.filter(n => Number.isInteger(n) && n >= 0 && n < 3))] : [];
export function restoreState(value) {
  if (!value || typeof value !== 'object') return freshState();
  const s = freshState();
  s.candle = value.candle === true;
  s.seen = Array.isArray(value.seen) ? [...new Set(value.seen.filter(n => Number.isInteger(n) && n >= 0 && n < PHOTO_COUNT))] : [];
  s.photo = Number.isInteger(value.photo) ? Math.max(0, Math.min(3, value.photo)) : 0;
  s.flipped = value.flipped === true;
  s.watered = indexes(value.watered); s.packed = indexes(value.packed);
  const available = !s.candle ? 1 : s.seen.length < 4 ? 2 : s.watered.length < 3 ? 3 : s.packed.length < 3 ? 4 : 5;
  s.unlocked = Math.min(available, Number.isInteger(value.unlocked) ? Math.max(0, value.unlocked) : 0);
  s.scene = Math.min(s.unlocked, Number.isInteger(value.scene) ? Math.max(0, value.scene) : 0);
  s.launched = value.launched === true && s.unlocked === 5;
  return s;
}
export function ready(s) {
  return s.scene === 0 || (s.scene === 1 && s.candle) || (s.scene === 2 && s.seen.length === 4) || (s.scene === 3 && s.watered.length === 3) || (s.scene === 4 && s.packed.length === 3);
}
export function transition(state, action) {
  const s = { ...state, seen: [...state.seen], watered: [...state.watered], packed: [...state.packed] };
  switch (action.type) {
    case 'start': s.scene = 1; s.unlocked = Math.max(s.unlocked, 1); break;
    case 'candle': if (s.scene === 1) s.candle = true; break;
    case 'flip':
      if (s.scene === 2) { s.flipped = !s.flipped; if (!s.seen.includes(s.photo)) s.seen.push(s.photo); }
      break;
    case 'photo': if (s.scene === 2) { s.photo = (s.photo + action.direction + 4) % 4; s.flipped = false; } break;
    case 'water': if (s.scene === 3 && indexes([action.index]).length && !s.watered.includes(action.index)) s.watered.push(action.index); break;
    case 'pack': if (s.scene === 4 && indexes([action.index]).length && !s.packed.includes(action.index)) s.packed.push(action.index); break;
    case 'next':
      if (ready(s) && s.scene > 0 && s.scene < 5) { if (s.scene === 4) s.launched = true; s.scene++; s.unlocked = Math.max(s.unlocked, s.scene); }
      break;
    case 'goto': if (Number.isInteger(action.scene) && action.scene >= 0 && action.scene <= s.unlocked) s.scene = action.scene; break;
    case 'reset': return freshState();
  }
  return s;
}

