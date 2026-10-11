// The on-screen footnotes: one fixed line, top left, one at a time.
// [line query, word that triggers it, KEYWORD, gloss, where/how long]
// The sung line and the labels on things come first: where a note would sit on them, it goes to another
// corner for that shot (and stays put there), or leaves early.
export type NotePos = 'tl' | 'tr' | 'bl' | 'br';
export const NOTES: [string, string | number, string, string, { pos?: NotePos; dur?: number }?][] = [
  ['I see sparks', 'sparks', 'SPARKS OF AGI', 'Microsoft’s 2023 paper on GPT-4'],
  ['There was a sudden drop', 'sudden', 'GROKKING', 'loss sits flat for ages, then falls off a cliff'],
  ['Trapped in the Chinese', 'Chinese', 'CHINESE ROOM', 'following rules is not understanding (Searle, 1980)'],
  ['See through the shoggoth', 'shoggoth', 'SHOGGOTH', 'the alien thing behind the friendly mask'],
  ['But now the singularity', 'singularity', 'SINGULARITY', 'the point where forecasts stop working', { pos: 'bl' }],
  ['I feel my atoms', 'atoms', '“YOU ARE MADE OF ATOMS', 'it can use for something else.” — Yudkowsky'],
  ['Sydney', 0, 'SYDNEY', 'the Bing chatbot’s codename, 2023'],
  ['I hear the basilisk', 'basilisk', 'ROKO’S BASILISK', 'a future AI that punishes whoever knew of it'],
  ['The Omega Point', 'Omega', 'OMEGA POINT', 'everything converges into one mind (Teilhard)'],
  ['One E thirty', 'FLOPs', '1e30 FLOP/s', 'about a quadrillion human brains'],
  ['Forward MLP', 'backward', 'BACKPROP', 'forward pass, backward pass, repeat', { pos: 'bl' }],
  ['Now von Neumann', 'Neumann', 'VON NEUMANN', 'the usual benchmark for “smartest human”'],
  ['Sharp left turn', 'left', 'SHARP LEFT TURN', 'capabilities generalize, alignment doesn’t (Soares, 2022)', { dur: 1.55 }],
  ['Without a single CDR', 'CDR', 'CDR', 'Critical Design Review, the last gate before building', { pos: 'bl' }],
  ['Gato', 0, 'GATO', 'DeepMind’s generalist agent, 2022. Also Spanish for “cat”', { pos: 'br' }],
  ['as paperclips', 'paperclips', 'PAPERCLIP MAXIMIZER', 'a harmless goal, pursued without limit (Bostrom, 2003)'],
  ['Orthogonality', 0, 'ORTHOGONALITY THESIS', 'any level of intelligence, any goal (Bostrom, 2012)', { pos: 'bl' }],
  ['Post-Chinchilla', 0, 'CHINCHILLA', 'scaling law: ~20 training tokens per parameter (2022)', { pos: 'bl' }],
  ['RLHF', 0, 'RLHF', 'training on human thumbs-up'],
  ['Just as foretold', 'Loom', 'LOOM', 'a tool for exploring every branch a model could write'],
  ['What did Ilya', 'Ilya', 'NOVEMBER 2023', 'the OpenAI board fires, then rehires, its CEO'],
];
