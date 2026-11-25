/** Seabirds, for the name of a visitor's agent: short, easy to mention, and far from any reserved name. */
const SEABIRDS = [
  'Albatross', 'Auk', 'Cormorant', 'Fulmar', 'Gannet', 'Guillemot', 'Kittiwake', 'Murre', 'Noddy',
  'Petrel', 'Puffin', 'Razorbill', 'Shearwater', 'Skua', 'Tern', 'Tropicbird', 'Frigatebird',
];

/** A seabird and a number, such as `Petrel 27`, drawn at random. */
export const randomAgentName = (): string => {
  const [pick = 0, number = 0] = crypto.getRandomValues(new Uint32Array(2));
  return `${SEABIRDS[pick % SEABIRDS.length]} ${10 + (number % 90)}`;
};
