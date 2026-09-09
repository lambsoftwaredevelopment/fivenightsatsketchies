// Room graph. Paths are fixed and linear, which keeps movement deterministic and
// trivially testable while still producing distinct approach routes per character.

export const ROOMS = {
  CAM1A: 'Show Stage',
  CAM1B: 'Dining Area',
  CAM1C: 'Pirate Cove',
  CAM2A: 'West Hall',
  CAM2B: 'W. Hall Corner',
  CAM3: 'Supply Closet',
  CAM4A: 'East Hall',
  CAM4B: 'E. Hall Corner',
  CAM5: 'Backstage',
  CAM6: 'Kitchen',
  CAM7: 'Restrooms',
};

export const CAM_ORDER = [
  'CAM1A', 'CAM1B', 'CAM1C', 'CAM5', 'CAM3',
  'CAM2A', 'CAM2B', 'CAM4A', 'CAM4B', 'CAM6', 'CAM7',
];

// Kitchen has no working video feed -- audio only, pure static.
export const AUDIO_ONLY = new Set(['CAM6']);

export const PATHS = {
  bonnie: ['CAM1A', 'CAM1B', 'CAM5', 'CAM3', 'CAM2A', 'CAM2B', 'DOOR_LEFT'],
  chica: ['CAM1A', 'CAM1B', 'CAM7', 'CAM6', 'CAM4A', 'CAM4B', 'DOOR_RIGHT'],
  freddy: ['CAM1A', 'CAM1B', 'CAM7', 'CAM6', 'CAM4A', 'CAM4B', 'DOOR_RIGHT'],
};

export function nextRoom(charKey, currentRoom) {
  const path = PATHS[charKey];
  if (!path) return null;
  const i = path.indexOf(currentRoom);
  if (i < 0 || i === path.length - 1) return null;
  return path[i + 1];
}

export function prevRoom(charKey, currentRoom) {
  const path = PATHS[charKey];
  if (!path) return null;
  const i = path.indexOf(currentRoom);
  if (i <= 0) return path ? path[0] : null;
  return path[i - 1];
}

export function isDoorRoom(room) {
  return room === 'DOOR_LEFT' || room === 'DOOR_RIGHT';
}
