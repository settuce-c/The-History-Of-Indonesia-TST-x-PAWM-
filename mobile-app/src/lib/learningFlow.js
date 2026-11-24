// Teks penjelasan alur belajar. Dipakai di onboarding (3 layar) dan di layar "Cara kerja belajar"
// (ikon ⓘ di Jelajah / menu Profil) supaya penjelasannya selalu sama.

export const ONBOARDING_SLIDES = [
  {
    icon: 'map-outline',
    title: 'Belajar per era, kuis tiap bab',
    text: 'Sejarah Indonesia disusun dari masa ke masa. Tiap era berisi beberapa bab: tonton video, baca ringkasan, lalu kerjakan kuis singkat.',
  },
  {
    icon: 'lock-open-outline',
    title: 'Era berikutnya terbuka',
    text: 'Selesaikan semua bab di satu era (video ditonton dan kuis lulus dengan nilai minimal 70) untuk membuka era berikutnya.',
  },
  {
    icon: 'flash-outline',
    title: 'Sudah paham? Lewati saja',
    text: 'Ikuti tes awal untuk mengetahui era mana yang sudah kamu kuasai. Era dengan skor minimal 80 dilewati, dan kamu langsung mulai dari bagian yang belum dipahami.',
  },
];

export const FLOW_STEPS = [
  { icon: 'book-outline', title: '1. Pelajari bab', text: 'Tonton video, baca ringkasan, dan kenali tokoh serta peristiwa pentingnya. Tandai video sudah ditonton.' },
  { icon: 'checkmark-done-outline', title: '2. Lulus kuis bab', text: 'Nilai minimal 70 untuk lulus. Boleh mengulang sebanyak apa pun; yang dihitung nilai tertinggi. Bab selesai jika video ditonton dan kuis lulus.' },
  { icon: 'lock-open-outline', title: '3. Era berikutnya terbuka', text: 'Era baru terbuka jika semua bab di era sebelumnya selesai atau dilewati. Era yang masih terkunci ditandai gembok beserta alasannya.' },
  { icon: 'rocket-outline', title: 'Tes awal', text: 'Berisi sekitar 2 soal dari tiap era. Era dengan skor minimal 80 dianggap dikuasai: semua babnya dilewati. Tes awal bisa diulang dari Profil.' },
  { icon: 'play-skip-forward-outline', title: 'Tes lompat per era', text: 'Ingin melompat ke era tertentu kapan saja? Pilih "Tes lompat" pada era itu. Skor minimal 80 membuka era dan melewati semua babnya.' },
  { icon: 'medal-outline', title: 'Lencana', text: 'Lencana era hanya diberikan jika kamu menyelesaikan era lewat kuis bab dengan rata-rata minimal 90. Bab yang dilewati tidak memberi lencana.' },
];
