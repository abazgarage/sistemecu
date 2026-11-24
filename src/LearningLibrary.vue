<script setup>
import { computed, ref } from 'vue'

const category = ref('ALL')
const search = ref('')
const selectedId = ref('ecu')
const completed = ref([])

const categories = ['ALL', 'FUNDAMENTAL', 'SENSOR', 'ACTUATOR', 'DIAGNOSTIC']
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
        <button class="lesson-complete" :class="{ completed: completed.includes(currentLesson.id) }" @click="toggleComplete(currentLesson.id)">{{ completed.includes(currentLesson.id) ? '✓ MATERI SUDAH SELESAI — BATALKAN' : 'TANDAI MATERI SELESAI' }}</button>
        <div class="data-disclaimer">MATERI EDUKASI UMUM · SPESIFIKASI DAN PROSEDUR DAPAT BERBEDA MENURUT MEREK, MODEL, TAHUN, DAN VARIAN KENDARAAN.</div>
      </article>
    </div>
  </section>
</template>
