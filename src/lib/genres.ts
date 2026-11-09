// Ticket colours by a film's main genre (TMDB's genre names), in a faded retro-print palette.
// Each entry is [background, text] so labels and stamped emoji stay readable.
const GENRE_COLOURS: Record<string, [string, string]> = {
  Action: ['#d9481c', '#fff8ec'],
  Adventure: ['#e9a800', '#2a1a12'],
  Animation: ['#f2a6b3', '#2a1a12'],
  Comedy: ['#f4c430', '#2a1a12'],
  Crime: ['#4a4e69', '#fff8ec'],
  Documentary: ['#8a9a5b', '#2a1a12'],
  Drama: ['#7a2e3a', '#fff8ec'],
  Family: ['#7fb7be', '#2a1a12'],
  Fantasy: ['#8e6cb0', '#fff8ec'],
  History: ['#9c6b30', '#fff8ec'],
  Horror: ['#3a1418', '#fff8ec'],
  Music: ['#d96ba0', '#2a1a12'],
  Mystery: ['#3e5c76', '#fff8ec'],
  Romance: ['#e07a8f', '#2a1a12'],
  'Science Fiction': ['#2f7f86', '#fff8ec'],
  'TV Movie': ['#b8a48c', '#2a1a12'],
  Thriller: ['#556b2f', '#fff8ec'],
  War: ['#6b705c', '#fff8ec'],
  Western: ['#c1663a', '#fff8ec'],
}
const NO_GENRE: [string, string] = ['#d8c8b0', '#2a1a12']

export function genreColours(genre: string | null | undefined) {
  const [background, color] = (genre && GENRE_COLOURS[genre]) || NO_GENRE
  return { background, color }
}
