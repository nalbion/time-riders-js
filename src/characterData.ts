export interface Character {
  name: string;
  img: string; // path to image asset
  description: string;
}

export const CHARACTERS: Character[] = [
  { name: 'Olivia Rodrigo', img: '/assets/olivia.png', description: 'Pop star and bike enthusiast.' },
  { name: 'P!nk', img: '/assets/pink.png', description: 'Daredevil and acrobat.' },
  { name: 'Taylor Swift', img: '/assets/taylor.png', description: 'Swift on the track.' },
  { name: 'Billie Eilish', img: '/assets/billie.png', description: 'Cool and collected.' },
  { name: 'Lizzo', img: '/assets/lizzo.png', description: 'Bold, fat, and wears a leotard.' },
  { name: 'Claire', img: '/assets/claire.png', description: 'Rides with feet on handlebars.' },
  { name: 'Maddy', img: '/assets/maddy.png', description: 'Energetic and fun.' }
];
