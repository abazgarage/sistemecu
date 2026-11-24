<script setup>
import { computed, ref, watch } from 'vue'

const category = ref('ALL')
const search = ref('')
const selectedId = ref('ecu')
const completed = ref([])

const categories = ['ALL', 'FUNDAMENTAL', 'SENSOR', 'ACTUATOR', 'DIAGNOSTIC']

const quizBank = {
  ecu: [
    { question: 'Apa fungsi utama ECU pada sistem manajemen mesin?', options: ['Menyimpan bahan bakar', 'Mengolah masukan sensor dan mengendalikan aktuator', 'Mengisi baterai kendaraan', 'Menggerakkan roda secara langsung'], answer: 1, explanation: 'ECU memproses informasi dari sensor sesuai program kontrol, kemudian mengatur keluaran ke aktuator.' },
    { question: 'Urutan kerja sistem kontrol yang paling tepat adalah ...', options: ['Aktuator → sensor → ECU', 'ECU → sensor → baterai', 'Sensor → ECU → aktuator', 'Baterai → aktuator → sensor'], answer: 2, explanation: 'Sensor menyediakan masukan, ECU mengolahnya, dan aktuator menjalankan perintah kontrol.' }
  ],
  map: [
    { question: 'Apa yang diukur oleh sensor MAP?', options: ['Tekanan absolut di intake manifold', 'Suhu oli transmisi', 'Kecepatan roda', 'Level bahan bakar'], answer: 0, explanation: 'MAP adalah Manifold Absolute Pressure, yaitu pengukuran tekanan absolut di intake manifold.' },
    { question: 'Kode gangguan MAP selalu membuktikan sensornya rusak. Pernyataan ini ...', options: ['Benar untuk semua kendaraan', 'Salah, rangkaian dan kondisi intake juga perlu diperiksa', 'Benar jika mesin dingin', 'Tidak perlu diagnosis lanjutan'], answer: 1, explanation: 'Konektor, kabel, referensi tegangan, ground, kebocoran intake, dan ECU dapat memengaruhi sinyal.' }
  ],
  tps: [
    { question: 'Informasi utama yang diberikan TPS adalah ...', options: ['Tekanan oli', 'Posisi atau sudut throttle', 'Suhu radiator', 'Tekanan ban'], answer: 1, explanation: 'TPS memberikan informasi posisi throttle kepada sistem kontrol mesin.' },
    { question: 'Nilai tegangan TPS harus dibandingkan dengan ...', options: ['Angka universal semua kendaraan', 'Warna kabel saja', 'Spesifikasi servis kendaraan terkait', 'Tegangan lampu utama'], answer: 2, explanation: 'Karakteristik sensor dan rentang sinyal berbeda menurut desain kendaraan.' }
  ],
  ckp: [
    { question: 'Sensor CKP memberikan informasi tentang ...', options: ['Posisi dan kecepatan poros engkol', 'Ketinggian bahan bakar', 'Tekanan ban', 'Suhu kabin'], answer: 0, explanation: 'CKP membantu sistem mengetahui posisi dan kecepatan putaran poros engkol.' },
    { question: 'Mengapa tipe sensor CKP perlu diketahui sebelum pemeriksaan?', options: ['Semua CKP memiliki sinyal sama', 'Jenis induktif dan Hall memiliki karakteristik berbeda', 'Agar warna kabel cocok', 'Supaya tidak perlu data servis'], answer: 1, explanation: 'Sensor induktif dan Hall dapat berbeda dalam bentuk sinyal dan kebutuhan kelistrikan.' }
  ],
  injector: [
    { question: 'Fuel injector termasuk komponen ...', options: ['Sensor suhu', 'Aktuator', 'Filter udara', 'Pengaman mekanis'], answer: 1, explanation: 'Injektor menerima perintah kendali dan mengatur penyaluran bahan bakar.' },
    { question: 'Strategi pengaktifan injektor ditentukan dengan mempertimbangkan ...', options: ['Masukan sensor dan kalibrasi sistem', 'Warna bodi kendaraan', 'Ukuran ban saja', 'Tingkat kecerahan lampu'], answer: 0, explanation: 'ECU mengatur injektor berdasarkan berbagai masukan, kondisi operasi, dan kalibrasi.' }
  ],
  dtc: [
    { question: 'Apa arti DTC dalam diagnosis kendaraan?', options: ['Data Tekanan Cairan', 'Diagnostic Trouble Code', 'Digital Throttle Control', 'Drive Torque Calculation'], answer: 1, explanation: 'DTC adalah kode gangguan diagnostik yang disimpan saat kriteria pemantauan tertentu terpenuhi.' },
    { question: 'Apa langkah yang tepat setelah menemukan DTC?', options: ['Langsung mengganti komponen', 'Mengabaikan gejala', 'Memeriksa data, kondisi, dan prosedur servis terkait', 'Menghapus kode tanpa pemeriksaan'], answer: 2, explanation: 'DTC adalah petunjuk awal. Penyebabnya perlu dikonfirmasi dengan data dan pemeriksaan yang sesuai.' }
  ]
}
const quizIndex = ref(0)
const quizChoice = ref(null)
const quizSubmitted = ref(false)
const quizResults = ref({})
const currentQuiz = computed(() => (quizBank[selectedId.value] || [])[quizIndex.value])
const currentQuizKey = computed(() => selectedId.value + '-' + quizIndex.value)
const quizCorrectCount = computed(() => (quizBank[selectedId.value] || []).filter((_, index) => quizResults.value[selectedId.value + '-' + index] === true).length)
const quizComplete = computed(() => quizIndex.value >= (quizBank[selectedId.value] || []).length)
function submitQuizAnswer() {
  if (quizChoice.value === null || !currentQuiz.value) return
  quizResults.value = { ...quizResults.value, [currentQuizKey.value]: quizChoice.value === currentQuiz.value.answer }
  quizSubmitted.value = true
}
function nextQuizQuestion() {
  if (quizIndex.value < (quizBank[selectedId.value] || []).length - 1) {
    quizIndex.value++
    quizChoice.value = null
    quizSubmitted.value = false
  } else {
    quizIndex.value++
  }
}
function restartQuiz() {
  const next = { ...quizResults.value }
  Object.keys(next).filter(key => key.startsWith(selectedId.value + '-')).forEach(key => delete next[key])
  quizResults.value = next
  quizIndex.value = 0
  quizChoice.value = null
  quizSubmitted.value = false
}

const lessons = [
  {
    id: 'ecu', category: 'FUNDAMENTAL', level: 'DASAR', duration: '6 MENIT',
    title: 'Mengenal Engine Control Unit',
    summary: 'Peran ECU dalam menerima masukan sensor, mengolah data, dan mengendalikan aktuator.',
    sections: [
      ['Apa itu ECU?', 'Engine Control Unit adalah modul elektronik yang menerima informasi dari sensor, mengolahnya berdasarkan program kalibrasi, lalu mengatur aktuator yang terkait dengan kerja mesin.'],
      ['Alur kerja sederhana', 'Sensor mengirim sinyal, rangkaian input mengondisikan sinyal, prosesor mengolah data, lalu rangkaian output mengendalikan aktuator. Proses ini berlangsung berulang selama sistem aktif.'],
      ['Komponen pendukung', 'Modul dapat berisi catu daya, mikrokontroler, memori, rangkaian input, rangkaian output, konektor, dan perlindungan listrik. Susunan sebenarnya berbeda menurut pabrikan dan model kendaraan.']
    ],
    takeaway: 'ECU tidak bekerja sendirian. Hasil kendali bergantung pada kualitas sinyal sensor, catu daya, perangkat lunak, dan kondisi rangkaian.'
  },
  {
    id: 'map', category: 'SENSOR', level: 'MENENGAH', duration: '5 MENIT',
    title: 'Sensor MAP dan tekanan manifold',
    summary: 'Fungsi sensor tekanan absolut manifold dan penggunaan datanya oleh ECU.',
    sections: [
      ['Fungsi sensor MAP', 'MAP mengukur tekanan absolut di dalam intake manifold. Informasi ini dapat digunakan ECU untuk memperkirakan beban mesin dan membantu menentukan strategi pengendalian.'],
      ['Sinyal dan interpretasi', 'Pada banyak sistem, sensor MAP menghasilkan sinyal tegangan yang berubah mengikuti tekanan. Hubungan tekanan dan tegangan serta rentang kerjanya harus mengacu pada data servis kendaraan.'],
      ['Catatan diagnosis', 'Kode gangguan MAP tidak otomatis berarti sensornya rusak. Konektor, kabel, kebocoran intake, catu referensi, ground, dan rangkaian ECU juga dapat memengaruhi pembacaan.']
    ],
    takeaway: 'Gunakan data live dan spesifikasi pabrikan. Jangan menyimpulkan kerusakan hanya dari satu kode DTC.'
  },
  {
    id: 'tps', category: 'SENSOR', level: 'MENENGAH', duration: '5 MENIT',
    title: 'Sensor TPS dan posisi throttle',
    summary: 'Informasi bukaan throttle yang digunakan sistem manajemen mesin.',
    sections: [
      ['Fungsi TPS', 'Throttle Position Sensor memberikan informasi posisi atau sudut bukaan throttle kepada sistem kontrol mesin.'],
      ['Perubahan sinyal', 'Pada sensor analog tertentu, sinyal berubah secara bertahap saat throttle bergerak. Sistem lain dapat memakai teknologi sensor berbeda.'],
      ['Hal yang perlu dipahami', 'Nilai tertutup, nilai terbuka, prosedur kalibrasi, dan batas tegangan bergantung pada kendaraan. Periksa dokumentasi servis yang sesuai.']
    ],
    takeaway: 'Nilai TPS harus ditafsirkan berdasarkan jenis sensor dan spesifikasi kendaraan, bukan angka universal.'
  },
  {
    id: 'ckp', category: 'SENSOR', level: 'MENENGAH', duration: '6 MENIT',
    title: 'Sensor CKP dan putaran mesin',
    summary: 'Peran sinyal posisi poros engkol untuk kecepatan dan referensi putaran mesin.',
    sections: [
      ['Fungsi CKP', 'Crankshaft Position Sensor memberikan informasi posisi dan kecepatan poros engkol. Informasi ini penting untuk sinkronisasi pengendalian mesin.'],
      ['Jenis sinyal', 'Sensor CKP dapat menggunakan prinsip induktif atau efek Hall. Bentuk sinyal, kebutuhan catu daya, dan metode pemeriksaannya berbeda sesuai desain.'],
      ['Hubungan dengan diagnosis', 'Gangguan sinyal CKP dapat menyebabkan data RPM tidak terbaca atau sinkronisasi terganggu. Kode terkait perlu ditinjau bersama data kendaraan dan prosedur pabrikan.']
    ],
    takeaway: 'Kenali tipe sensor sebelum menafsirkan sinyal. Jangan menggunakan satu prosedur untuk semua jenis CKP.'
  },
  {
    id: 'injector', category: 'ACTUATOR', level: 'DASAR', duration: '5 MENIT',
    title: 'Prinsip kerja fuel injector',
    summary: 'Injektor sebagai aktuator yang mengatur penyaluran bahan bakar.',
    sections: [
      ['Peran injektor', 'Fuel injector adalah aktuator elektromekanis yang membuka dan menutup jalur bahan bakar sesuai sinyal kendali dari sistem.'],
      ['Perintah ECU', 'ECU menentukan strategi dan durasi pengaktifan berdasarkan berbagai masukan, kondisi operasi, serta kalibrasi sistem.'],
      ['Perbedaan sistem', 'Rancangan injektor, tekanan bahan bakar, rangkaian driver, dan strategi kontrol berbeda antar kendaraan.']
    ],
    takeaway: 'Injektor merupakan bagian dari sistem yang lebih luas; evaluasi perlu mempertimbangkan suplai bahan bakar, kelistrikan, dan kontrol.'
  },
  {
    id: 'dtc', category: 'DIAGNOSTIC', level: 'DASAR', duration: '7 MENIT',
    title: 'Memahami Diagnostic Trouble Code',
    summary: 'Membaca DTC sebagai petunjuk awal, bukan vonis kerusakan komponen.',
    sections: [
      ['Apa itu DTC?', 'Diagnostic Trouble Code adalah kode yang disimpan sistem ketika kondisi pemantauan tertentu memenuhi kriteria gangguan yang ditetapkan.'],
      ['Kode bukan kesimpulan akhir', 'Satu kode dapat memiliki beberapa kemungkinan penyebab. Diagnosis perlu mempertimbangkan gejala, freeze-frame bila tersedia, data live, inspeksi, dan informasi servis.'],
      ['Urutan berpikir', 'Identifikasi kendaraan dan sistemnya, catat kode serta kondisi kemunculannya, pelajari definisi pabrikan, lalu ikuti prosedur diagnosis resmi.']
    ],
    takeaway: 'DTC membantu mengarahkan pemeriksaan. Konfirmasi penyebab dengan bukti dan prosedur yang sesuai.'
  }
]

const visibleLessons = computed(() => lessons.filter(item =>
  (category.value === 'ALL' || item.category === category.value) &&
  (item.title + ' ' + item.summary + ' ' + item.category).toLowerCase().includes(search.value.toLowerCase())
))
const currentLesson = computed(() => lessons.find(item => item.id === selectedId.value) || lessons[0])
const progress = computed(() => Math.round(completed.value.length / lessons.length * 100))


watch(selectedId, () => {
  quizIndex.value = 0
  quizChoice.value = null
  quizSubmitted.value = false
})

function toggleComplete(id) {
  completed.value = completed.value.includes(id)
    ? completed.value.filter(item => item !== id)
    : [...completed.value, id]
}
</script>

<template>
  <section class="library-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> KNOWLEDGE BASE <span class="eyebrow-tag">LEARNING MODE</span></div>
        <h1>Learning <span>Library</span></h1>
        <p>Materi dasar sistem kontrol mesin, sensor, aktuator, dan diagnosis elektronik kendaraan.</p>
      </div>
      <div class="heading-meta"><span>LEARNING PROGRESS</span><strong>{{ completed.length }} / {{ lessons.length }} MATERI</strong><span class="meta-live"><i></i> LOCAL PROGRESS</span></div>
    </div>

    <div class="library-progress panel">
      <div class="progress-copy"><div><div class="panel-kicker">YOUR LEARNING PATH</div><h2>Perkembangan belajar</h2></div><strong>{{ progress }}%</strong></div>
      <div class="progress-track"><i :style="{ width: progress + '%' }"></i></div>
      <p>Progres tersimpan sementara selama halaman ini terbuka.</p>
    </div>

    <div class="library-toolbar">
      <div class="library-filters">
        <button v-for="item in categories" :key="item" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
      </div>
      <input v-model="search" class="library-search" placeholder="Cari materi..." aria-label="Cari materi" />
    </div>

    <div class="library-layout">
      <div class="lesson-list">
        <button v-for="lesson in visibleLessons" :key="lesson.id" class="lesson-card panel" :class="{ active: selectedId === lesson.id }" @click="selectedId = lesson.id">
          <div class="lesson-card-top"><span>{{ lesson.category }}</span><span v-if="completed.includes(lesson.id)" class="lesson-done">✓ SELESAI</span><span v-else>{{ lesson.duration }}</span></div>
          <h3>{{ lesson.title }}</h3><p>{{ lesson.summary }}</p>
          <div class="lesson-card-foot"><span>{{ lesson.level }}</span><b>BUKA MATERI ↗</b></div>
        </button>
        <div v-if="!visibleLessons.length" class="panel empty-state">Materi tidak ditemukan. Coba kata kunci lain.</div>
      </div>

      <article class="panel lesson-reader">
        <div class="lesson-reader-head">
          <div><div class="panel-kicker">{{ currentLesson.category }} / {{ currentLesson.level }}</div><h2>{{ currentLesson.title }}</h2><p>{{ currentLesson.summary }}</p></div>
          <span class="lesson-time">{{ currentLesson.duration }}</span>
        </div>
        <div v-for="(section, index) in currentLesson.sections" :key="section[0]" class="lesson-section">
          <span class="lesson-index">0{{ index + 1 }}</span><div><h3>{{ section[0] }}</h3><p>{{ section[1] }}</p></div>
        </div>
        <div class="lesson-takeaway"><span>KEY TAKEAWAY</span><p>{{ currentLesson.takeaway }}</p></div>

        <section v-if="currentQuiz && !quizComplete" class="quiz-panel">
          <div class="quiz-top"><div><div class="panel-kicker">KNOWLEDGE CHECK</div><h3>Uji pemahaman</h3></div><span>SOAL {{ quizIndex + 1 }} / {{ quizBank[selectedId].length }}</span></div>
          <div class="quiz-progress"><i :style="{ width: ((quizIndex + 1) / quizBank[selectedId].length * 100) + '%' }"></i></div>
          <p class="quiz-question">{{ currentQuiz.question }}</p>
          <div class="quiz-options">
            <button v-for="(option, index) in currentQuiz.options" :key="option" class="quiz-option" :class="{ chosen: quizChoice === index, correct: quizSubmitted && index === currentQuiz.answer, incorrect: quizSubmitted && quizChoice === index && index !== currentQuiz.answer }" :disabled="quizSubmitted" @click="quizChoice = index">
              <span>{{ String.fromCharCode(65 + index) }}</span>{{ option }}
            </button>
          </div>
          <div v-if="quizSubmitted" class="quiz-feedback" :class="{ good: quizChoice === currentQuiz.answer }">
            <strong>{{ quizChoice === currentQuiz.answer ? 'BENAR!' : 'BELUM TEPAT' }}</strong>
            <p>{{ currentQuiz.explanation }}</p>
          </div>
          <div class="quiz-actions">
            <span class="quiz-score">BENAR: {{ quizCorrectCount }} / {{ quizBank[selectedId].length }}</span>
            <button v-if="!quizSubmitted" class="quiz-submit" :disabled="quizChoice === null" @click="submitQuizAnswer">PERIKSA JAWABAN</button>
            <button v-else class="quiz-submit" @click="nextQuizQuestion">{{ quizIndex === quizBank[selectedId].length - 1 ? 'LIHAT HASIL' : 'SOAL BERIKUTNYA →' }}</button>
          </div>
        </section>
        <section v-else-if="quizComplete" class="quiz-result">
          <div class="panel-kicker">QUIZ COMPLETED</div><h3>{{ quizCorrectCount }} / {{ quizBank[selectedId].length }} JAWABAN BENAR</h3>
          <p>Nilai latihan: <strong>{{ Math.round(quizCorrectCount / quizBank[selectedId].length * 100) }}</strong></p>
          <button class="quiz-submit" @click="restartQuiz">ULANGI LATIHAN</button>
        </section>
        <button class="lesson-complete" :class="{ completed: completed.includes(currentLesson.id) }" @click="toggleComplete(currentLesson.id)">{{ completed.includes(currentLesson.id) ? '✓ MATERI SUDAH SELESAI — BATALKAN' : 'TANDAI MATERI SELESAI' }}</button>
        <div class="data-disclaimer">MATERI EDUKASI UMUM · SPESIFIKASI DAN PROSEDUR DAPAT BERBEDA MENURUT MEREK, MODEL, TAHUN, DAN VARIAN KENDARAAN.</div>
      </article>
    </div>
  </section>
</template>
