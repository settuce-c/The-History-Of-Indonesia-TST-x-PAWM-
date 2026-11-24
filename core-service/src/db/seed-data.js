'use strict';
/**
 * Data contoh kurikulum sejarah Indonesia.
 *
 * - videoUrl masih PLACEHOLDER bertanda TODO: ganti dengan video YouTube asli
 *   (lewat endpoint admin PUT /api/admin/chapters/:id atau edit file ini lalu `npm run seed:reset`).
 * - Tahun untuk masa awal (Kutai, Tarumanegara) bersifat perkiraan ("sekitar abad ke-5").
 * - Koordinat adalah perkiraan lokasi situs/kota, cukup untuk penanda peta.
 * - wikiTitle = judul artikel id.wikipedia.org (sudah diperiksa ada) untuk bagian "Baca lebih lanjut".
 * - answer = indeks (mulai 0) pilihan yang benar.
 */

const todoVideo = (slug) => `https://www.youtube.com/watch?v=TODO-${slug}`;

// ---------------- Historical Knowledge: peristiwa & tokoh ----------------
const items = {
  // --- Kutai & Tarumanegara ---
  yupa: { kind: 'event', wikiTitle: 'Prasasti Yupa', name: 'Penulisan Prasasti Yupa', year: 400, location: 'Muara Kaman, Kutai Kartanegara', region: 'Kalimantan Timur', lat: -0.18, lng: 116.72, description: 'Tujuh tiang batu bertulisan huruf Pallawa berbahasa Sanskerta, bukti tertulis tertua kerajaan Hindu di Indonesia (sekitar abad ke-4/5 M).' },
  mulawarman: { kind: 'figure', wikiTitle: 'Mulawarman', name: 'Mulawarman', year: 400, location: 'Muara Kaman, Kutai Kartanegara', region: 'Kalimantan Timur', lat: -0.18, lng: 116.72, description: 'Raja Kutai paling terkenal, cucu Kudungga dan putra Aswawarman. Menurut Prasasti Yupa ia menyedekahkan 20.000 ekor sapi kepada kaum brahmana.' },
  purnawarman: { kind: 'figure', wikiTitle: 'Purnawarman', name: 'Purnawarman', year: 450, location: 'Bogor', region: 'Jawa Barat', lat: -6.55, lng: 106.69, description: 'Raja Tarumanegara paling terkenal (sekitar abad ke-5). Dalam prasastinya ia digambarkan sebagai titisan Dewa Wisnu.' },
  ciaruteun: { kind: 'event', wikiTitle: 'Prasasti Ciaruteun', name: 'Prasasti Ciaruteun', year: 450, location: 'Ciaruteun Ilir, Cibungbulang, Bogor', region: 'Jawa Barat', lat: -6.55, lng: 106.69, description: 'Prasasti Tarumanegara dengan pahatan sepasang telapak kaki Purnawarman yang diibaratkan telapak kaki Dewa Wisnu.' },
  tugu: { kind: 'event', wikiTitle: 'Prasasti Tugu', name: 'Prasasti Tugu', year: 450, location: 'Tugu, Koja, Jakarta Utara', region: 'DKI Jakarta', lat: -6.13, lng: 106.92, description: 'Prasasti terpanjang Tarumanegara; mencatat penggalian Sungai Candrabhaga dan Sungai Gomati sepanjang 6.122 tombak untuk irigasi dan pencegahan banjir.' },

  // --- Sriwijaya ---
  kedukanBukit: { kind: 'event', wikiTitle: 'Prasasti Kedukan Bukit', name: 'Prasasti Kedukan Bukit', year: 682, location: 'Kedukan Bukit, Palembang', region: 'Sumatera Selatan', lat: -2.99, lng: 104.73, description: 'Prasasti tertua Sriwijaya (605 Saka/682 M) berbahasa Melayu Kuno; menceritakan perjalanan suci (siddhayatra) Dapunta Hyang.' },
  jayanasa: { kind: 'figure', name: 'Dapunta Hyang Sri Jayanasa', year: 682, location: 'Palembang', region: 'Sumatera Selatan', lat: -2.98, lng: 104.76, description: 'Pendiri Kerajaan Sriwijaya menurut Prasasti Kedukan Bukit.' },
  itsing: { kind: 'event', wikiTitle: 'Yijing (biksu)', name: 'Kunjungan I-Tsing ke Sriwijaya', year: 671, location: 'Palembang', region: 'Sumatera Selatan', lat: -2.98, lng: 104.76, description: 'Biksu Tiongkok I-Tsing singgah dan belajar tata bahasa Sanskerta di Sriwijaya dalam perjalanan ke India; ia mencatat Sriwijaya sebagai pusat pembelajaran agama Buddha.' },
  balaputradewa: { kind: 'figure', wikiTitle: 'Balaputradewa', name: 'Balaputradewa', year: 860, location: 'Palembang', region: 'Sumatera Selatan', lat: -2.98, lng: 104.76, description: 'Raja Sriwijaya abad ke-9 dari wangsa Syailendra; disebut dalam Prasasti Nalanda karena membangun asrama bagi pelajar Sriwijaya di Nalanda, India.' },
  chola: { kind: 'event', name: 'Serangan Kerajaan Chola ke Sriwijaya', year: 1025, location: 'Selat Malaka', region: 'Sumatra dan Semenanjung Malaya', lat: 2.5, lng: 101.5, description: 'Raja Rajendra Chola I dari India Selatan menyerang pusat-pusat Sriwijaya; serangan ini melemahkan dominasi maritim Sriwijaya.' },

  // --- Majapahit ---
  majapahit: { kind: 'event', name: 'Berdirinya Kerajaan Majapahit', year: 1293, location: 'Trowulan, Mojokerto', region: 'Jawa Timur', lat: -7.56, lng: 112.38, description: 'Raden Wijaya memanfaatkan pasukan Mongol untuk mengalahkan Jayakatwang dari Kediri, lalu mengusir pasukan Mongol dan mendirikan Majapahit.' },
  raden_wijaya: { kind: 'figure', wikiTitle: 'Raden Wijaya', name: 'Raden Wijaya', year: 1293, location: 'Trowulan, Mojokerto', region: 'Jawa Timur', lat: -7.56, lng: 112.38, description: 'Pendiri dan raja pertama Majapahit, bergelar Kertarajasa Jayawardhana.' },
  palapa: { kind: 'event', wikiTitle: 'Sumpah Palapa', name: 'Sumpah Palapa', year: 1336, location: 'Trowulan, Mojokerto', region: 'Jawa Timur', lat: -7.56, lng: 112.38, description: 'Sumpah Gajah Mada saat diangkat menjadi mahapatih: ia tidak akan menikmati palapa sebelum menyatukan Nusantara.' },
  gajah_mada: { kind: 'figure', wikiTitle: 'Gajah Mada', name: 'Gajah Mada', year: 1336, location: 'Trowulan, Mojokerto', region: 'Jawa Timur', lat: -7.56, lng: 112.38, description: 'Mahapatih Majapahit yang terkenal dengan Sumpah Palapa dan perannya memperluas pengaruh Majapahit.' },
  hayam_wuruk: { kind: 'figure', wikiTitle: 'Hayam Wuruk', name: 'Hayam Wuruk', year: 1350, yearEnd: 1389, location: 'Trowulan, Mojokerto', region: 'Jawa Timur', lat: -7.56, lng: 112.38, description: 'Raja Majapahit (bergelar Rajasanagara) yang memerintah pada masa puncak kejayaan kerajaan.' },
  negarakertagama: { kind: 'event', wikiTitle: 'Kakawin Nagarakretagama', name: 'Penulisan Kakawin Negarakertagama', year: 1365, location: 'Trowulan, Mojokerto', region: 'Jawa Timur', lat: -7.56, lng: 112.38, description: 'Karya Mpu Prapanca yang menggambarkan wilayah, pemerintahan, dan kehidupan Majapahit pada masa Hayam Wuruk.' },

  // --- Samudra Pasai ---
  malik_saleh: { kind: 'figure', name: 'Sultan Malik as-Saleh', year: 1297, location: 'Samudera, Aceh Utara', region: 'Aceh', lat: 5.16, lng: 97.27, description: 'Pendiri dan sultan pertama Samudra Pasai (nama asli Meurah Silu). Nisan makamnya bertarikh 696 H/1297 M.' },
  nisan_malik: { kind: 'event', name: 'Nisan Makam Sultan Malik as-Saleh', year: 1297, location: 'Samudera, Aceh Utara', region: 'Aceh', lat: 5.16, lng: 97.27, description: 'Nisan bertarikh 1297 M yang menjadi salah satu bukti tertua kerajaan Islam di Nusantara.' },
  ibnu_battuta: { kind: 'event', wikiTitle: 'Ibnu Batutah', name: 'Kunjungan Ibnu Battuta ke Samudra Pasai', year: 1345, location: 'Samudera, Aceh Utara', region: 'Aceh', lat: 5.16, lng: 97.27, description: 'Penjelajah asal Maroko, Ibnu Battuta, singgah di Samudra Pasai dan mencatat sultannya sebagai penganut mazhab Syafi\'i yang taat.' },

  // --- Demak ---
  demak: { kind: 'event', name: 'Berdirinya Kesultanan Demak', year: 1478, location: 'Demak', region: 'Jawa Tengah', lat: -6.89, lng: 110.64, description: 'Kerajaan Islam pertama di Pulau Jawa, didirikan Raden Patah seiring melemahnya Majapahit.' },
  raden_patah: { kind: 'figure', wikiTitle: 'Raden Patah', name: 'Raden Patah', year: 1478, location: 'Demak', region: 'Jawa Tengah', lat: -6.89, lng: 110.64, description: 'Pendiri dan sultan pertama Kesultanan Demak.' },
  masjid_demak: { kind: 'event', wikiTitle: 'Masjid Agung Demak', name: 'Pembangunan Masjid Agung Demak', year: 1479, location: 'Demak', region: 'Jawa Tengah', lat: -6.89, lng: 110.64, description: 'Masjid yang menurut tradisi dibangun oleh Wali Songo; salah satu tiang utamanya (saka tatal) dikaitkan dengan Sunan Kalijaga.' },
  pati_unus: { kind: 'event', wikiTitle: 'Pati Unus', name: 'Serangan Pati Unus ke Malaka', year: 1513, location: 'Malaka', region: 'Semenanjung Malaya', lat: 2.19, lng: 102.25, description: 'Pati Unus memimpin armada Demak menyerang Portugis di Malaka sehingga dijuluki Pangeran Sabrang Lor.' },
  sunda_kelapa: { kind: 'event', name: 'Penaklukan Sunda Kelapa', year: 1527, location: 'Sunda Kelapa, Jakarta Utara', region: 'DKI Jakarta', lat: -6.12, lng: 106.81, description: 'Fatahillah merebut Sunda Kelapa dari pengaruh Portugis pada 22 Juni 1527 dan menamainya Jayakarta.' },
  fatahillah: { kind: 'figure', wikiTitle: 'Fatahillah', name: 'Fatahillah', year: 1527, location: 'Sunda Kelapa, Jakarta Utara', region: 'DKI Jakarta', lat: -6.12, lng: 106.81, description: 'Panglima Demak yang menaklukkan Sunda Kelapa dan mengganti namanya menjadi Jayakarta.' },

  // --- Mataram Islam ---
  mataram: { kind: 'event', name: 'Berdirinya Kesultanan Mataram', year: 1586, location: 'Kotagede, Yogyakarta', region: 'DI Yogyakarta', lat: -7.83, lng: 110.4, description: 'Sutawijaya (Panembahan Senopati) membangun Mataram di Kotagede, bekas Alas Mentaok yang diberikan kepada ayahnya, Ki Ageng Pemanahan.' },
  senopati: { kind: 'figure', wikiTitle: 'Senapati dari Mataram', name: 'Panembahan Senopati', year: 1586, location: 'Kotagede, Yogyakarta', region: 'DI Yogyakarta', lat: -7.83, lng: 110.4, description: 'Nama asli Sutawijaya; pendiri Kesultanan Mataram Islam.' },
  sultan_agung: { kind: 'figure', wikiTitle: 'Sultan Agung dari Mataram', name: 'Sultan Agung', year: 1613, yearEnd: 1645, location: 'Kerta, Bantul', region: 'DI Yogyakarta', lat: -7.86, lng: 110.4, description: 'Raja Mataram pada masa kejayaan; menyerang VOC di Batavia dan memperkenalkan kalender Jawa.' },
  serangan_batavia: { kind: 'event', name: 'Serangan Mataram ke Batavia', year: 1628, yearEnd: 1629, location: 'Batavia (Jakarta)', region: 'DKI Jakarta', lat: -6.13, lng: 106.81, description: 'Dua kali serangan pasukan Sultan Agung ke Batavia (1628 dan 1629) yang gagal, antara lain karena lumbung padi pasukan Mataram dihancurkan VOC.' },
  giyanti: { kind: 'event', wikiTitle: 'Perjanjian Giyanti', name: 'Perjanjian Giyanti', year: 1755, location: 'Giyanti, Karanganyar', region: 'Jawa Tengah', lat: -7.59, lng: 110.95, description: 'Perjanjian 13 Februari 1755 yang membagi Mataram menjadi Kasunanan Surakarta dan Kesultanan Yogyakarta.' },

  // --- VOC ---
  houtman: { kind: 'event', name: 'Kedatangan Cornelis de Houtman di Banten', year: 1596, location: 'Banten Lama, Serang', region: 'Banten', lat: -6.04, lng: 106.15, description: 'Ekspedisi Belanda pertama yang tiba di Nusantara untuk mencari rempah-rempah.' },
  voc: { kind: 'event', name: 'Pendirian VOC', year: 1602, location: 'Amsterdam', region: 'Belanda', lat: 52.37, lng: 4.9, description: 'Vereenigde Oostindische Compagnie didirikan pada 20 Maret 1602 sebagai gabungan perusahaan dagang Belanda dan diberi hak oktroi.' },
  coen: { kind: 'figure', wikiTitle: 'Jan Pieterszoon Coen', name: 'Jan Pieterszoon Coen', year: 1619, location: 'Batavia (Jakarta)', region: 'DKI Jakarta', lat: -6.13, lng: 106.81, description: 'Gubernur Jenderal VOC yang merebut Jayakarta dan mendirikan Batavia.' },
  batavia: { kind: 'event', wikiTitle: 'Batavia', name: 'Pendirian Batavia', year: 1619, location: 'Batavia (Jakarta)', region: 'DKI Jakarta', lat: -6.13, lng: 106.81, description: 'VOC merebut Jayakarta dan menjadikannya Batavia, pusat kekuasaan VOC di Asia.' },
  voc_bubar: { kind: 'event', name: 'Pembubaran VOC', year: 1799, location: 'Batavia (Jakarta)', region: 'DKI Jakarta', lat: -6.13, lng: 106.81, description: 'VOC dibubarkan pada 31 Desember 1799 akibat korupsi, utang besar, dan biaya perang; wilayahnya diambil alih pemerintah Belanda.' },

  // --- Tanam Paksa ---
  van_den_bosch: { kind: 'figure', wikiTitle: 'Johannes van den Bosch', name: 'Johannes van den Bosch', year: 1830, location: 'Batavia (Jakarta)', region: 'DKI Jakarta', lat: -6.13, lng: 106.81, description: 'Gubernur Jenderal Hindia Belanda yang memberlakukan Cultuurstelsel (Tanam Paksa) mulai 1830.' },
  tanam_paksa: { kind: 'event', name: 'Pemberlakuan Tanam Paksa', year: 1830, yearEnd: 1870, location: 'Pulau Jawa', region: 'Jawa', lat: -7.3, lng: 110.0, description: 'Petani wajib menyisihkan sebagian tanah (seperlima) untuk tanaman ekspor seperti kopi, tebu, dan nila.' },
  grobogan: { kind: 'event', name: 'Bencana Kelaparan di Grobogan', year: 1849, yearEnd: 1850, location: 'Grobogan', region: 'Jawa Tengah', lat: -7.02, lng: 110.92, description: 'Salah satu bencana kelaparan besar akibat beban Tanam Paksa, selain di Cirebon dan Demak.' },
  multatuli: { kind: 'figure', wikiTitle: 'Eduard Douwes Dekker', name: 'Eduard Douwes Dekker (Multatuli)', year: 1860, location: 'Rangkasbitung, Lebak', region: 'Banten', lat: -6.36, lng: 106.25, description: 'Mantan asisten residen Lebak yang menulis novel Max Havelaar untuk mengkritik penindasan pada masa Tanam Paksa.' },
  max_havelaar: { kind: 'event', wikiTitle: 'Max Havelaar', name: 'Terbitnya Novel Max Havelaar', year: 1860, location: 'Amsterdam', region: 'Belanda', lat: 52.37, lng: 4.9, description: 'Novel karya Multatuli yang membuka mata publik Belanda tentang penderitaan rakyat Hindia Belanda.' },
  uu_agraria: { kind: 'event', wikiTitle: 'Undang-Undang Agraria 1870', name: 'Undang-Undang Agraria 1870', year: 1870, location: 'Batavia (Jakarta)', region: 'DKI Jakarta', lat: -6.13, lng: 106.81, description: 'Agrarische Wet membuka Hindia Belanda bagi modal swasta dan menandai berakhirnya Tanam Paksa (era ekonomi liberal).' },

  // --- Politik Etis & Kebangkitan Nasional ---
  van_deventer: { kind: 'figure', wikiTitle: 'Conrad Theodor van Deventer', name: 'Conrad Theodor van Deventer', year: 1899, location: 'Belanda', region: 'Belanda', lat: 52.37, lng: 4.9, description: 'Penulis artikel "Een Eereschuld" (Utang Kehormatan) yang mendorong lahirnya Politik Etis.' },
  eereschuld: { kind: 'event', name: 'Artikel Een Eereschuld', year: 1899, location: 'Belanda', region: 'Belanda', lat: 52.37, lng: 4.9, description: 'Artikel di majalah De Gids yang menyatakan Belanda berutang budi kepada rakyat Hindia Belanda.' },
  politik_etis: { kind: 'event', wikiTitle: 'Politik Etis', name: 'Pemberlakuan Politik Etis', year: 1901, location: 'Batavia (Jakarta)', region: 'DKI Jakarta', lat: -6.13, lng: 106.81, description: 'Kebijakan balas budi berisi tiga program: irigasi, emigrasi, dan edukasi.' },
  budi_utomo: { kind: 'event', wikiTitle: 'Boedi Oetomo', name: 'Berdirinya Budi Utomo', year: 1908, location: 'STOVIA, Jakarta Pusat', region: 'DKI Jakarta', lat: -6.18, lng: 106.84, description: 'Organisasi modern pertama, didirikan mahasiswa STOVIA pada 20 Mei 1908; tanggalnya diperingati sebagai Hari Kebangkitan Nasional.' },
  sutomo: { kind: 'figure', wikiTitle: 'Soetomo', name: 'dr. Sutomo', year: 1908, location: 'STOVIA, Jakarta Pusat', region: 'DKI Jakarta', lat: -6.18, lng: 106.84, description: 'Mahasiswa STOVIA yang bersama rekan-rekannya mendirikan Budi Utomo, terinspirasi gagasan dr. Wahidin Sudirohusodo.' },
  sumpah_pemuda: { kind: 'event', wikiTitle: 'Sumpah Pemuda', name: 'Sumpah Pemuda', year: 1928, location: 'Jalan Kramat Raya 106, Jakarta Pusat', region: 'DKI Jakarta', lat: -6.18, lng: 106.84, description: 'Ikrar Kongres Pemuda II pada 28 Oktober 1928: satu tanah air, satu bangsa, dan menjunjung bahasa persatuan, bahasa Indonesia.' },
};

const q = (question, options, answer, explanation) => ({ question, options, answer, explanation });

// ---------------- Curriculum + Assessment ----------------
const eras = [
  {
    slug: 'kerajaan-hindu-buddha',
    title: 'Kerajaan Hindu-Buddha',
    description: 'Masa kerajaan bercorak Hindu dan Buddha di Nusantara, dari Kutai hingga Majapahit.',
    startYear: 400,
    endYear: 1527,
    chapters: [
      {
        slug: 'kutai-dan-tarumanegara',
        wikiTitle: 'Kerajaan Kutai Martapura',
        title: 'Kutai dan Tarumanegara',
        topicTags: ['kutai', 'tarumanegara', 'mulawarman', 'purnawarman', 'yupa', 'hindu'],
        summary:
          'Kutai di tepi Sungai Mahakam, Kalimantan Timur, dikenal sebagai kerajaan Hindu tertua di Indonesia. Bukti utamanya adalah tujuh Prasasti Yupa berhuruf Pallawa dan berbahasa Sanskerta dari sekitar abad ke-4 atau ke-5 M. Prasasti itu menyebut silsilah Kudungga, Aswawarman, dan Mulawarman, raja yang menyedekahkan 20.000 ekor sapi kepada kaum brahmana.\n\n' +
          'Tarumanegara berkembang di Jawa Barat pada abad ke-5 dengan raja terkenalnya Purnawarman, pemuja Dewa Wisnu. Peninggalannya antara lain Prasasti Ciaruteun (telapak kaki Purnawarman), Kebon Kopi (telapak kaki gajah), dan Tugu yang mencatat penggalian Sungai Gomati dan Candrabhaga untuk irigasi dan pencegahan banjir.',
        items: ['yupa', 'mulawarman', 'purnawarman', 'ciaruteun', 'tugu'],
        questions: [
          q('Tujuh prasasti peninggalan Kerajaan Kutai yang menjadi bukti tertulis tertua kerajaan Hindu di Indonesia disebut...', ['Prasasti Ciaruteun', 'Prasasti Yupa', 'Prasasti Kedukan Bukit', 'Prasasti Canggal'], 1, 'Prasasti Yupa berupa tiang batu peninggalan Kutai di Muara Kaman, Kalimantan Timur.'),
          q('Raja Kutai yang menurut prasasti menyedekahkan 20.000 ekor sapi kepada kaum brahmana adalah...', ['Kudungga', 'Aswawarman', 'Mulawarman', 'Purnawarman'], 2, 'Prasasti Yupa memuji kedermawanan Mulawarman yang menyedekahkan 20.000 ekor sapi.'),
          q('Prasasti Yupa ditulis dengan huruf dan bahasa...', ['Pallawa dan Sanskerta', 'Kawi dan Jawa Kuno', 'Pallawa dan Melayu Kuno', 'Pranagari dan Sanskerta'], 0, 'Huruf Pallawa dan bahasa Sanskerta menunjukkan pengaruh budaya India Selatan.'),
          q('Prasasti Tugu mencatat bahwa Raja Purnawarman memerintahkan...', ['Pembangunan Candi Borobudur', 'Penggalian Sungai Gomati dan Candrabhaga', 'Pengiriman utusan ke Tiongkok', 'Penaklukan Kerajaan Kutai'], 1, 'Penggalian sungai sepanjang 6.122 tombak dilakukan untuk irigasi dan mencegah banjir.'),
          q('Pahatan yang terdapat pada Prasasti Ciaruteun adalah...', ['Gambar gajah Airawata', 'Sepasang telapak kaki Purnawarman', 'Relief kapal dagang', 'Lambang cakra Wisnu'], 1, 'Telapak kaki Purnawarman di Prasasti Ciaruteun diibaratkan telapak kaki Dewa Wisnu.'),
        ],
      },
      {
        slug: 'sriwijaya',
        wikiTitle: 'Sriwijaya',
        title: 'Sriwijaya: Kerajaan Maritim',
        topicTags: ['sriwijaya', 'palembang', 'buddha', 'maritim', 'balaputradewa'],
        summary:
          'Sriwijaya berpusat di sekitar Palembang, Sumatera Selatan, dan muncul pada abad ke-7. Prasasti Kedukan Bukit (682 M) berbahasa Melayu Kuno menceritakan perjalanan suci Dapunta Hyang Sri Jayanasa. Kekuatan Sriwijaya bertumpu pada penguasaan jalur perdagangan laut, terutama Selat Malaka dan Selat Sunda.\n\n' +
          'Sriwijaya juga menjadi pusat pembelajaran agama Buddha; biksu Tiongkok I-Tsing singgah di sana pada 671 M. Pada abad ke-9 Balaputradewa dari wangsa Syailendra memerintah dan disebut dalam Prasasti Nalanda di India. Serangan Kerajaan Chola dari India Selatan pada 1025 melemahkan dominasi Sriwijaya.',
        items: ['kedukanBukit', 'jayanasa', 'itsing', 'balaputradewa', 'chola'],
        questions: [
          q('Prasasti tertua Sriwijaya (682 M) yang menceritakan perjalanan suci Dapunta Hyang adalah...', ['Talang Tuwo', 'Kota Kapur', 'Kedukan Bukit', 'Karang Berahi'], 2, 'Prasasti Kedukan Bukit bertarikh 605 Saka atau 682 M dan ditemukan di Palembang.'),
          q('Biksu dari Tiongkok yang pada abad ke-7 singgah dan belajar di Sriwijaya adalah...', ['Fa-Hien', 'I-Tsing', 'Ma Huan', 'Xuanzang'], 1, 'I-Tsing singgah di Sriwijaya pada 671 M dan mencatatnya sebagai pusat pembelajaran Buddha.'),
          q('Sumber kekuatan utama Kerajaan Sriwijaya adalah...', ['Pertanian padi di pedalaman Jawa', 'Penguasaan jalur perdagangan laut seperti Selat Malaka', 'Tambang emas di Kalimantan', 'Perdagangan kuda dengan Persia'], 1, 'Sriwijaya adalah kerajaan maritim yang mengendalikan jalur dagang Selat Malaka dan Selat Sunda.'),
          q('Raja Sriwijaya keturunan wangsa Syailendra yang disebut dalam Prasasti Nalanda adalah...', ['Samaratungga', 'Balaputradewa', 'Dharmawangsa', 'Sanjaya'], 1, 'Balaputradewa membangun asrama bagi pelajar Sriwijaya di Nalanda, India.'),
          q('Kerajaan dari India yang menyerang Sriwijaya pada tahun 1025 adalah...', ['Gupta', 'Maurya', 'Chola', 'Mughal'], 2, 'Rajendra Chola I dari Kerajaan Chola menyerang pusat-pusat Sriwijaya pada 1025.'),
        ],
      },
      {
        slug: 'majapahit',
        wikiTitle: 'Majapahit',
        title: 'Majapahit',
        topicTags: ['majapahit', 'gajah mada', 'hayam wuruk', 'sumpah palapa', 'raden wijaya'],
        summary:
          'Majapahit didirikan Raden Wijaya pada 1293 di Trowulan, Jawa Timur. Ia memanfaatkan pasukan Mongol untuk mengalahkan Jayakatwang dari Kediri, lalu berbalik mengusir pasukan Mongol.\n\n' +
          'Pada 1336 Gajah Mada mengucapkan Sumpah Palapa untuk menyatukan Nusantara. Majapahit mencapai puncak kejayaan pada masa Hayam Wuruk (1350–1389). Karya sastra penting dari masa ini adalah Kakawin Negarakertagama karya Mpu Prapanca (1365) dan Kakawin Sutasoma karya Mpu Tantular, sumber semboyan "Bhinneka Tunggal Ika".',
        items: ['majapahit', 'raden_wijaya', 'palapa', 'gajah_mada', 'hayam_wuruk', 'negarakertagama'],
        questions: [
          q('Pendiri Kerajaan Majapahit adalah...', ['Hayam Wuruk', 'Ken Arok', 'Raden Wijaya', 'Jayakatwang'], 2, 'Raden Wijaya mendirikan Majapahit pada 1293 dan bergelar Kertarajasa Jayawardhana.'),
          q('Sumpah Palapa untuk menyatukan Nusantara diucapkan oleh...', ['Hayam Wuruk', 'Gajah Mada', 'Mpu Prapanca', 'Tribhuwana Tunggadewi'], 1, 'Gajah Mada mengucapkan Sumpah Palapa pada 1336 saat diangkat menjadi mahapatih.'),
          q('Semboyan "Bhinneka Tunggal Ika" berasal dari kitab...', ['Negarakertagama karya Mpu Prapanca', 'Sutasoma karya Mpu Tantular', 'Arjunawiwaha karya Mpu Kanwa', 'Pararaton'], 1, 'Kalimat "Bhinneka tunggal ika tan hana dharma mangrwa" terdapat dalam Kakawin Sutasoma.'),
          q('Majapahit mencapai puncak kejayaan pada masa pemerintahan...', ['Raden Wijaya', 'Jayanegara', 'Hayam Wuruk', 'Wikramawardhana'], 2, 'Hayam Wuruk memerintah 1350–1389 didampingi Mahapatih Gajah Mada.'),
          q('Kitab Negarakertagama (1365) yang menggambarkan wilayah dan kehidupan Majapahit ditulis oleh...', ['Mpu Tantular', 'Mpu Prapanca', 'Mpu Sedah', 'Mpu Panuluh'], 1, 'Mpu Prapanca menulis Negarakertagama, juga dikenal sebagai Desawarnana.'),
        ],
      },
    ],
  },
  {
    slug: 'kerajaan-islam',
    title: 'Kerajaan Islam',
    description: 'Masa kesultanan Islam di Nusantara, dari Samudra Pasai hingga terbaginya Mataram.',
    startYear: 1267,
    endYear: 1755,
    chapters: [
      {
        slug: 'samudra-pasai',
        wikiTitle: 'Kesultanan Samudera Pasai',
        title: 'Samudra Pasai',
        topicTags: ['samudra pasai', 'pasai', 'aceh', 'malik as-saleh', 'islam'],
        summary:
          'Samudra Pasai di pesisir utara Aceh dikenal sebagai kerajaan Islam pertama di Nusantara. Pendirinya, Sultan Malik as-Saleh (Meurah Silu), wafat pada 1297; nisan makamnya yang bertarikh 696 H menjadi bukti penting.\n\n' +
          'Letaknya di Selat Malaka menjadikan Pasai bandar dagang dan pusat penyebaran Islam. Pasai mencetak mata uang emas (dirham). Penjelajah Maroko Ibnu Battuta singgah di sana pada 1345. Pada awal abad ke-16 Pasai melemah akibat serangan Portugis dan kemudian berada di bawah Kesultanan Aceh.',
        items: ['malik_saleh', 'nisan_malik', 'ibnu_battuta'],
        questions: [
          q('Kerajaan yang dikenal sebagai kerajaan Islam pertama di Indonesia adalah...', ['Demak', 'Samudra Pasai', 'Ternate', 'Gowa-Tallo'], 1, 'Samudra Pasai berdiri pada abad ke-13 di pesisir utara Aceh.'),
          q('Pendiri Kesultanan Samudra Pasai adalah...', ['Raden Patah', 'Sultan Iskandar Muda', 'Sultan Malik as-Saleh', 'Sultan Agung'], 2, 'Sultan Malik as-Saleh, bernama asli Meurah Silu, wafat pada 1297.'),
          q('Penjelajah asal Maroko yang singgah di Samudra Pasai pada 1345 adalah...', ['Vasco da Gama', 'Ibnu Battuta', 'Ferdinand Magellan', 'Christopher Columbus'], 1, 'Ibnu Battuta mencatat kunjungannya ke Pasai dalam kitab perjalanannya, Rihlah.'),
          q('Bukti penting keberadaan Samudra Pasai sebagai kerajaan Islam adalah...', ['Prasasti Yupa', 'Nisan makam Sultan Malik as-Saleh bertarikh 1297', 'Candi Muara Takus', 'Prasasti Kedukan Bukit'], 1, 'Nisan bertarikh 696 H/1297 M menunjukkan Islam telah menjadi agama kerajaan.'),
          q('Mata uang yang dicetak Kesultanan Samudra Pasai adalah...', ['Gulden', 'Dirham emas', 'Ringgit perak', 'Uang kepeng Tiongkok'], 1, 'Pasai mencetak dirham (deureuham) emas sebagai alat tukar perdagangan.'),
        ],
      },
      {
        slug: 'demak',
        wikiTitle: 'Kesultanan Demak',
        title: 'Kesultanan Demak',
        topicTags: ['demak', 'raden patah', 'wali songo', 'pati unus', 'fatahillah', 'islam'],
        summary:
          'Demak di pesisir utara Jawa Tengah adalah kerajaan Islam pertama di Pulau Jawa, didirikan Raden Patah sekitar 1478 seiring melemahnya Majapahit. Masjid Agung Demak yang menurut tradisi dibangun Wali Songo menjadi pusat dakwah Islam.\n\n' +
          'Pada 1513 Pati Unus memimpin serangan laut ke Portugis di Malaka sehingga dijuluki Pangeran Sabrang Lor. Pada masa Sultan Trenggana, Fatahillah merebut Sunda Kelapa pada 1527 dan menamainya Jayakarta, cikal bakal Jakarta.',
        items: ['demak', 'raden_patah', 'masjid_demak', 'pati_unus', 'sunda_kelapa', 'fatahillah'],
        questions: [
          q('Pendiri Kesultanan Demak adalah...', ['Sultan Trenggana', 'Raden Patah', 'Pati Unus', 'Sunan Kalijaga'], 1, 'Raden Patah mendirikan Demak, kerajaan Islam pertama di Jawa.'),
          q('Pati Unus dijuluki Pangeran Sabrang Lor karena memimpin serangan terhadap Portugis di...', ['Goa', 'Ambon', 'Malaka', 'Batavia'], 2, '"Sabrang lor" berarti menyeberang ke utara, yaitu ke Malaka.'),
          q('Setelah merebut Sunda Kelapa pada 1527, Fatahillah mengganti namanya menjadi...', ['Batavia', 'Jayakarta', 'Banten', 'Cirebon'], 1, 'Jayakarta berarti "kemenangan yang sempurna"; tanggal 22 Juni 1527 kini diperingati sebagai hari jadi Jakarta.'),
          q('Salah satu tiang utama Masjid Agung Demak yang terbuat dari potongan kayu (saka tatal) menurut tradisi dibuat oleh...', ['Sunan Ampel', 'Sunan Giri', 'Sunan Kalijaga', 'Sunan Gunung Jati'], 2, 'Saka tatal Masjid Agung Demak dikaitkan dengan Sunan Kalijaga.'),
          q('Sultan Demak yang memperluas wilayah kerajaan dan mengutus Fatahillah ke Sunda Kelapa adalah...', ['Raden Patah', 'Sultan Trenggana', 'Sunan Prawoto', 'Arya Penangsang'], 1, 'Sultan Trenggana memerintah setelah Pati Unus dan memperluas pengaruh Demak.'),
        ],
      },
      {
        slug: 'mataram-islam',
        wikiTitle: 'Kesunanan Mataram',
        title: 'Mataram Islam',
        topicTags: ['mataram', 'mataram islam', 'sultan agung', 'panembahan senopati', 'giyanti'],
        summary:
          'Mataram Islam didirikan Sutawijaya, bergelar Panembahan Senopati, sekitar 1586 dengan pusat awal di Kotagede, Yogyakarta. Wilayah itu semula hutan Mentaok yang dihadiahkan Sultan Hadiwijaya dari Pajang kepada ayahnya, Ki Ageng Pemanahan.\n\n' +
          'Puncak kejayaan dicapai pada masa Sultan Agung (1613–1645), yang dua kali menyerang VOC di Batavia (1628 dan 1629) dan memperkenalkan kalender Jawa yang memadukan kalender Saka dan Hijriah. Konflik internal dan campur tangan VOC berujung pada Perjanjian Giyanti (1755) yang membagi Mataram menjadi Kasunanan Surakarta dan Kesultanan Yogyakarta.',
        items: ['mataram', 'senopati', 'sultan_agung', 'serangan_batavia', 'giyanti'],
        questions: [
          q('Raja Mataram Islam yang menyerang VOC di Batavia pada 1628 dan 1629 adalah...', ['Panembahan Senopati', 'Sultan Agung', 'Amangkurat I', 'Hamengkubuwono I'], 1, 'Serangan Sultan Agung gagal, antara lain karena lumbung padi pasukan Mataram dihancurkan VOC.'),
          q('Perjanjian Giyanti (1755) membagi Mataram menjadi...', ['Pajang dan Demak', 'Kasunanan Surakarta dan Kesultanan Yogyakarta', 'Banten dan Cirebon', 'Mangkunegaran dan Pakualaman'], 1, 'Perjanjian Giyanti dikenal dengan istilah palihan nagari (pembagian negeri).'),
          q('Nama asli pendiri Mataram Islam yang bergelar Panembahan Senopati adalah...', ['Ki Ageng Pemanahan', 'Jaka Tingkir', 'Sutawijaya', 'Raden Mas Said'], 2, 'Sutawijaya adalah putra Ki Ageng Pemanahan.'),
          q('Pusat pemerintahan awal Kesultanan Mataram Islam terletak di...', ['Kartasura', 'Kotagede', 'Plered', 'Surakarta'], 1, 'Kotagede menjadi pusat awal sebelum ibu kota berpindah ke Kerta, Plered, Kartasura, dan Surakarta.'),
          q('Kalender Jawa yang diperkenalkan Sultan Agung merupakan perpaduan antara kalender...', ['Masehi dan Saka', 'Saka dan Hijriah', 'Masehi dan Hijriah', 'Tionghoa dan Saka'], 1, 'Kalender Jawa memakai hitungan bulan seperti Hijriah tetapi melanjutkan angka tahun Saka.'),
        ],
      },
    ],
  },
  {
    slug: 'masa-kolonial',
    title: 'Masa Kolonial',
    description: 'Masa VOC dan pemerintahan Hindia Belanda hingga lahirnya pergerakan nasional.',
    startYear: 1596,
    endYear: 1942,
    chapters: [
      {
        slug: 'voc',
        wikiTitle: 'Perusahaan Hindia Timur Belanda',
        title: 'VOC dan Monopoli Rempah',
        topicTags: ['voc', 'kolonial', 'belanda', 'rempah', 'batavia', 'jp coen'],
        summary:
          'Ekspedisi Belanda pertama di bawah Cornelis de Houtman tiba di Banten pada 1596. Untuk mengurangi persaingan antarpedagang, Belanda mendirikan VOC (Vereenigde Oostindische Compagnie) pada 20 Maret 1602 dan memberinya hak oktroi: hak monopoli dagang, membentuk tentara, mencetak uang, dan membuat perjanjian.\n\n' +
          'Pada 1619 Gubernur Jenderal Jan Pieterszoon Coen merebut Jayakarta dan mendirikan Batavia. VOC menegakkan monopoli rempah di Maluku antara lain melalui pelayaran hongi. Korupsi, utang besar, dan biaya perang membuat VOC dibubarkan pada 31 Desember 1799.',
        items: ['houtman', 'voc', 'coen', 'batavia', 'voc_bubar'],
        questions: [
          q('VOC didirikan pada tahun...', ['1596', '1602', '1619', '1799'], 1, 'VOC didirikan pada 20 Maret 1602 di Belanda.'),
          q('Hak istimewa yang diberikan pemerintah Belanda kepada VOC disebut...', ['Hak ulayat', 'Hak oktroi', 'Hak veto', 'Hak erfpacht'], 1, 'Hak oktroi mencakup monopoli dagang, membentuk tentara, mencetak uang, dan membuat perjanjian.'),
          q('Gubernur Jenderal VOC yang merebut Jayakarta pada 1619 dan menggantinya menjadi Batavia adalah...', ['Herman Willem Daendels', 'Jan Pieterszoon Coen', 'Cornelis de Houtman', 'Johannes van den Bosch'], 1, 'J.P. Coen menjadikan Batavia pusat kekuasaan VOC di Asia.'),
          q('Pelayaran hongi adalah...', ['Ekspedisi pertama Belanda ke Banten', 'Patroli kapal VOC di Maluku untuk menjaga monopoli rempah', 'Jalur dagang Sriwijaya', 'Pelayaran haji pada masa kolonial'], 1, 'Dengan kapal kora-kora, VOC mengawasi dan menghukum pelanggar monopoli cengkih dan pala.'),
          q('Penyebab utama VOC dibubarkan pada 31 Desember 1799 adalah...', ['Kalah perang melawan Mataram', 'Korupsi pegawai dan utang yang sangat besar', 'Rempah-rempah tidak laku lagi', 'Diserang Kerajaan Chola'], 1, 'Korupsi, utang, dan biaya perang membuat VOC bangkrut; asetnya diambil alih pemerintah Belanda.'),
        ],
      },
      {
        slug: 'tanam-paksa',
        wikiTitle: 'Cultuurstelsel',
        title: 'Tanam Paksa (Cultuurstelsel)',
        topicTags: ['tanam paksa', 'cultuurstelsel', 'van den bosch', 'multatuli', 'max havelaar', 'kolonial'],
        summary:
          'Tanam Paksa (Cultuurstelsel) diberlakukan Gubernur Jenderal Johannes van den Bosch mulai 1830 untuk mengisi kas Belanda yang kosong. Petani wajib menyisihkan seperlima tanahnya untuk tanaman ekspor seperti kopi, tebu, dan nila, sedangkan yang tidak punya tanah wajib bekerja di perkebunan pemerintah.\n\n' +
          'Dalam praktiknya terjadi banyak penyimpangan yang menimbulkan bencana kelaparan, misalnya di Cirebon, Demak, dan Grobogan. Kritik datang antara lain dari Eduard Douwes Dekker (Multatuli) melalui novel Max Havelaar (1860). Tanam Paksa dihapus bertahap dan digantikan sistem ekonomi liberal setelah Undang-Undang Agraria 1870.',
        items: ['van_den_bosch', 'tanam_paksa', 'grobogan', 'multatuli', 'max_havelaar', 'uu_agraria'],
        questions: [
          q('Tokoh yang memberlakukan sistem Tanam Paksa pada 1830 adalah...', ['Herman Willem Daendels', 'Thomas Stamford Raffles', 'Johannes van den Bosch', 'Jan Pieterszoon Coen'], 2, 'Van den Bosch memberlakukan Cultuurstelsel untuk mengisi kas Belanda.'),
          q('Menurut aturan Tanam Paksa, petani wajib menyerahkan tanahnya untuk tanaman ekspor sebesar...', ['Setengah', 'Seperlima', 'Sepersepuluh', 'Seluruhnya'], 1, 'Aturannya seperlima tanah, meski dalam praktik sering jauh lebih besar.'),
          q('Novel Max Havelaar yang mengkritik Tanam Paksa ditulis oleh...', ['Van Deventer', 'Eduard Douwes Dekker (Multatuli)', 'Snouck Hurgronje', 'Raffles'], 1, 'Douwes Dekker memakai nama pena Multatuli dan pernah menjadi asisten residen Lebak.'),
          q('Contoh tanaman wajib dalam sistem Tanam Paksa adalah...', ['Padi, jagung, dan singkong', 'Kopi, tebu, dan nila', 'Karet dan kelapa sawit', 'Cengkih dan pala saja'], 1, 'Tanaman yang laku di pasar Eropa seperti kopi, tebu, dan nila (indigo) diwajibkan.'),
          q('Berakhirnya Tanam Paksa dan dimulainya era ekonomi liberal ditandai oleh Undang-Undang Agraria tahun...', ['1830', '1860', '1870', '1901'], 2, 'Agrarische Wet 1870 membuka Hindia Belanda bagi penanaman modal swasta.'),
        ],
      },
      {
        slug: 'politik-etis-dan-kebangkitan-nasional',
        wikiTitle: 'Politik Etis',
        title: 'Politik Etis dan Kebangkitan Nasional',
        topicTags: ['politik etis', 'budi utomo', 'kebangkitan nasional', 'sumpah pemuda', 'van deventer'],
        summary:
          'Pada 1899 C. Th. van Deventer menulis artikel "Een Eereschuld" (Utang Kehormatan) yang menyatakan Belanda berutang budi kepada rakyat Hindia Belanda. Pada 1901 Politik Etis diberlakukan dengan tiga program: irigasi, emigrasi, dan edukasi.\n\n' +
          'Pendidikan melahirkan golongan terpelajar yang memelopori pergerakan nasional. Budi Utomo didirikan mahasiswa STOVIA, antara lain dr. Sutomo, pada 20 Mei 1908; tanggal itu diperingati sebagai Hari Kebangkitan Nasional. Semangat persatuan memuncak dalam Sumpah Pemuda pada Kongres Pemuda II, 28 Oktober 1928.',
        items: ['van_deventer', 'eereschuld', 'politik_etis', 'budi_utomo', 'sutomo', 'sumpah_pemuda'],
        questions: [
          q('Tokoh Belanda yang menulis artikel "Een Eereschuld" (Utang Kehormatan) pada 1899 adalah...', ['Multatuli', 'C. Th. van Deventer', 'Johannes van den Bosch', 'Snouck Hurgronje'], 1, 'Artikel van Deventer di majalah De Gids mendorong lahirnya Politik Etis.'),
          q('Tiga program Politik Etis adalah...', ['Irigasi, emigrasi, edukasi', 'Industri, ekspor, edukasi', 'Irigasi, ekspor, ekonomi', 'Emigrasi, ekonomi, kesehatan'], 0, 'Trias Politik Etis: irigasi (pengairan), emigrasi (perpindahan penduduk), dan edukasi (pendidikan).'),
          q('Budi Utomo didirikan pada 20 Mei 1908 oleh para mahasiswa...', ['Technische Hoogeschool Bandung', 'STOVIA', 'Rechtshoogeschool', 'Universitas Leiden'], 1, 'STOVIA adalah sekolah kedokteran bumiputra di Batavia.'),
          q('Tanggal berdirinya Budi Utomo kini diperingati sebagai...', ['Hari Sumpah Pemuda', 'Hari Pendidikan Nasional', 'Hari Kebangkitan Nasional', 'Hari Pahlawan'], 2, 'Setiap 20 Mei diperingati sebagai Hari Kebangkitan Nasional.'),
          q('Sumpah Pemuda diikrarkan pada Kongres Pemuda II tanggal...', ['20 Mei 1908', '28 Oktober 1928', '17 Agustus 1945', '10 November 1945'], 1, 'Sumpah Pemuda menegaskan satu tanah air, satu bangsa, dan bahasa persatuan Indonesia.'),
        ],
      },
    ],
  },
];

// Isi videoUrl placeholder bertanda TODO.
for (const era of eras) for (const ch of era.chapters) ch.videoUrl = ch.videoUrl || todoVideo(ch.slug);

module.exports = { items, eras };
