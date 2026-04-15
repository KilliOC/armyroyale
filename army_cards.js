export const ARMY_CARDS = [
  {
    id: "monkey",
    name: "🐒 Monkey",
    cost: 3,
    color: { x: 217, y: 140, z: 64, w: 255 },
    role: "melee",
    squadSize: 5,
  },
  {
    id: "hamster",
    name: "🐹 Hamster",
    cost: 3,
    color: { x: 209, y: 173, z: 89, w: 255 },
    role: "ranged",
    squadSize: 5,
  },
  {
    id: "frog",
    name: "🐸 Frog",
    cost: 4,
    color: { x: 51, y: 191, z: 77, w: 255 },
    role: "breaker",
    squadSize: 4,
  },
  {
    id: "duckling",
    name: "🦆 Duckling",
    cost: 2,
    color: { x: 255, y: 224, z: 51, w: 255 },
    role: "rush",
    squadSize: 6,
  },
];

export function getCardById(cardId) {
  return ARMY_CARDS.find((card) => card.id === cardId) || null;
}
