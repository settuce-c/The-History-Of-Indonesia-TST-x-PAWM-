// Avatar bawaan aplikasi (ikon lokal, tanpa URL gambar). Server hanya menyimpan id-nya (avatarId).
// Jika daftar ini diubah, samakan dengan core-service/src/shared/avatars.js.
export const AVATARS = [
  { id: 'candi', label: 'Candi', icon: 'temple-hindu', bg: '#F4E3BF', fg: '#6E470B' },
  { id: 'keris', label: 'Keris', icon: 'sword', bg: '#E9ECF6', fg: '#22306A' },
  { id: 'wayang', label: 'Wayang', icon: 'drama-masks', bg: '#E5F2EA', fg: '#22603C' },
  { id: 'pinisi', label: 'Pinisi', icon: 'sail-boat', bg: '#22306A', fg: '#F3D58C' },
  { id: 'batik', label: 'Batik', icon: 'hexagon-multiple', bg: '#FBE9E7', fg: '#8C1D18' },
  { id: 'gunungan', label: 'Gunungan', icon: 'pine-tree', bg: '#D9A441', fg: '#1A1814' },
  { id: 'rumah-gadang', label: 'Rumah Gadang', icon: 'home-roof', bg: '#EFEAE0', fg: '#5E5A52' },
  { id: 'garuda', label: 'Garuda', icon: 'bird', bg: '#1C2758', fg: '#D9A441' },
];

export const findAvatar = (id) => AVATARS.find((a) => a.id === id) || null;
