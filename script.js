// ============================================
// SISTEM KEUANGAN MADRASAH - SCRIPT.JS
// ============================================

// Data Dummy Awal (jika localStorage kosong, load dari JSON)
let transaksi = [];
let currentUser = null;
let chart = null;

// Users Demo (enkripsi sederhana base64 untuk demo; GUNAKAN BACKEND UNTUK HASH NYATA)
const users = {
    'bendahara': btoa('madrasah123'),  // Password dienkripsi sederhana (base64)
    'kepala': btoa('madrasah123')
};

// Fungsi enkripsi sederhana (demo only)
function enkripsiPass(pass) {
    return btoa(pass);
}

// Load Data Transaksi (dari localStorage atau JSON file)
async function loadData() {
    // Coba load dari localStorage
    const stored = localStorage.getItem('transaksiMadrasah');
    if (stored) {
        transaksi = JSON.parse(stored);
        console.log('Data loaded from localStorage:', transaksi.length, 'transaksi');
        return;
    }

    // Fallback: Load dari data/transaksi.json
    try {
        const response = await fetch('data/transaksi.json');
        if (response.ok) {
            transaksi = await response.json();
            localStorage.setItem('transaksiMadrasah', JSON.stringify(transaksi));
            console.log('Data loaded from JSON file:', transaksi.length, 'transaksi');
        } else {
            // Jika file tidak ada, gunakan dummy
            transaksi = [
                { id: 1, jenis: 'pemasukan', kategori: 'BOS', deskripsi: 'Dana BOS Januari 2024', jumlah: 5000000, tanggal: '2024-01-15' },
                { id: 2, jenis: 'pengeluaran', kategori: 'SPP', deskripsi: 'Pembelian buku pelajaran', jumlah: 1000000, tanggal: '2024-01-20' },
                { id: 3, jenis: 'pemasukan', kategori: 'Infaq', deskripsi: 'Infaq dari orang tua', jumlah: 2000000, tanggal: '2024-02-05' }
            ];
            localStorage.setItem('transaksiMadrasah', JSON.stringify(transaksi));
            console.log('Using dummy data');
        }
    } catch (error) {
        console.error('Error loading JSON:', error);
        // Fallback ke dummy seperti di atas
        transaksi = [...];  // Copy dummy di atas
        localStorage.setItem('transaksiMadrasah', JSON.stringify(transaksi));
    }
}

// Simpan Data ke localStorage
function simpanData() {
    localStorage.setItem('transaksiMadrasah', JSON.stringify(transaksi));
    console.log('Data saved to localStorage');
}

// Hitung Ringkasan Keuangan
function hitungRingkasan(filteredTransaksi = transaksi) {
    const pemasukan = filteredTransaksi
        .filter(t => t.jenis === 'pemasukan')
        .reduce((sum, t) => sum + t.jumlah, 0);
    const pengeluaran = filteredTransaksi
        .filter(t => t.jenis === 'pengeluaran')
        .reduce((sum, t) => sum + t.jumlah, 0);
    const saldo = pemasukan - pengeluaran;

    return { pemasukan, pengeluaran, saldo };
}

// Tampilkan Ringkasan (untuk dashboard)
function tampilkanRingkasan(filteredTransaksi = transaksi) {
    const { pemasukan, pengeluaran, saldo } = hitungRingkasan(filteredTransaksi);
    
    document.getElementById('totalPemasukan').textContent = `Rp ${pemasukan.toLocaleString('id-ID')}`;
    document.getElementById('totalPengeluaran').textContent = `Rp ${pengeluaran.toLocaleString('id-ID')}`;
    const saldoEl = document.getElementById('saldoDisplay');
    saldoEl.textContent = `Rp ${saldo.toLocaleString('id-ID')}`;
    
    // Warna saldo
    if (saldo < 0) {
        saldoEl.classList.add('text-danger');
        saldoEl.classList.remove('text-success');
    } else {
        saldoEl.classList.add('text-success');
        saldoEl.classList.remove('text-danger');
    }
}

// Render Tabel Transaksi
function renderTabel(filteredTransaksi = transaksi) {
    const tbody = document.getElementById('transaksiBody');
    if (!tbody) return;  // Jika bukan di dashboard

    tbody.innerHTML = '';
    filteredTransaksi.forEach(t => {
        const row = tbody.insertRow();
        row.className = t.jenis === 'pemasukan' ? 'table-success' : 'table-danger';  // Warna baris
        row.innerHTML = `
            <td>${new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
            <td><span class="badge ${t.jenis === 'pemasukan' ? 'bg-success' : 'bg-danger'}">${t.jenis.toUpperCase()}</span></td>
            <td><span class="badge bg-info">${t.kategori}</span></td>
            <td>${t.deskripsi}</td>
            <td class="fw-bold">Rp ${t.jumlah.toLocaleString('id-ID')}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1 edit-btn" data-id="${t.id}" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger hapus-btn" data-id="${t.id}" title="Hapus"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });

    // Event Listeners untuk Edit & Hapus
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editTransaksi(parseInt(e.target.closest('button').dataset.id)));
    });
    document.querySelectorAll('.hapus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => hapusTransaksi(parseInt(e.target.closest('button').dataset.id)));
    });
}

// Filter Transaksi Berdasarkan Bulan/Tahun
function applyFilter() {
    const bulan = document.getElementById('filterBulan')?.value || '';
    const tahun = document.getElementById('filterTahun')?.value || '';
    
    let filtered = transaksi;
    if (bulan) {
        filtered = filtered.filter(t => t.tanggal.startsWith(`${tahun || new Date().getFullYear()}-${bulan}`));
    } else if (tahun) {
        filtered = filtered.filter(t => t.tanggal.startsWith(tahun));
    }
    
    renderTabel(filtered);
    tampilkanRingkasan(filtered);
    updateGrafik(filtered);
    console.log('Filter applied:', filtered.length, 'transaksi');
}

// Update Grafik dengan Chart.js
function updateGrafik(filteredTransaksi = transaksi) {
    const ctx = document.getElementById('keuanganChart')?.getContext('2d');
    if (!ctx) return;

    const { pemasukan, pengeluaran } = hitungRingkasan(filteredTransaksi);
    
    if (chart) chart.destroy();
    
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                data: [pemasukan, pengeluaran],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Ringkasan Keuangan' }
            }
        }
    });
}

// Tambah/Edit Transaksi
function tambahEditTransaksi(e, isEdit = false) {
    e.preventDefault();
    const id = document.getElementById('editId')?.value || Date.now();
    const jenis = document.getElementById('jenis').value;
    const jumlah = parseInt(document.getElementById('jumlah').value);
    const kategori = document.getElementById('kategori').value;
    const deskripsi = document.getElementById('deskripsi').value;
    const tanggal = new Date().toISOString().split('T')[0];  // Tanggal hari ini

    const trans = { id: parseInt(id), jenis, jumlah, kategori, deskripsi, tanggal };

    if (isEdit) {
        const index = transaksi.findIndex(t => t.id === parseInt(id));
        if (index !== -1) {
            transaksi[index] = trans;
            alert('Transaksi berhasil diupdate!');
        }
    } else {
        transaksi.unshift(trans);  // Tambah di awal
        alert('Transaksi berhasil ditambahkan!');
    }

    simpanData();
    document.getElementById('transaksiForm').reset();
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('editId').value = '';

    // Refresh tampilan
    renderTabel();
    tampilkanRingkasan();
    updateGrafik();
}

// Edit Transaksi (isi form)
function editTransaksi(id) {
    const t = transaksi.find(tx => tx.id === id);
    if (t) {
        document.getElementById('jenis').value = t.jenis;
        document.getElementById('jumlah').value = t.jumlah;
        document.getElementById('kategori').value = t.kategori;
        document.getElementById('deskripsi').value = t.deskripsi;
        document.getElementById('editId').value = t.id;
        document.getElementById('editBtn').style.display = 'inline-block';
        document.getElementById('editBtn').textContent = 'Update';
        document.getElementById('transaksiForm').scrollIntoView({ behavior: 'smooth' });
    }
}

// Hapus Transaksi
function hapusTransaksi(id) {
    if (confirm('Yakin hapus transaksi ini?')) {
        transaksi = transaksi.filter(t => t.id !== id);
        simpanData();
        renderTabel();
        tampilkanRingkasan();
        updateGrafik();
        alert('Transaksi dihapus!');
    }
}

// Ekspor ke Excel (SheetJS)
function eksporExcel(filteredTransaksi = transaksi) {
    const { pemasukan, pengeluaran, saldo } = hitungRingkasan(filteredTransaksi);
    const wsData = [
        ['LAPORAN KEUANGAN MADRASAH', '', '', `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`],
        [''],
        ['Ringkasan:', '', '', ''],
        ['Total Pemasukan', pemasukan, '', ''],
        ['Total Pengeluaran', pengeluaran, '', ''],
        ['Saldo Akhir', saldo, '', ''],
        [''],
        ['Riwayat Transaksi:', '', '', ''],
        ['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Jumlah (Rp)']
    ];

    filteredTransaksi.forEach(t => {
        wsData.push([t.tanggal, t.jenis, t.kategori, t.deskripsi, t.jumlah]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
    XLSX.writeFile(wb, 'laporan-keuangan-madrasah.xlsx');
    console.log('Excel exported successfully');
}

// Ekspor ke PDF (jsPDF - Opsional, tambahkan CDN di HTML jika pakai)
function eksporPDF(filteredTransaksi = transaksi) {
    // Tambahkan <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script> di dashboard.html jika ingin pakai
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert('Library jsPDF belum di-load. Tambahkan CDN di HTML.');
        return;
    }

    const { pemasukan, pengeluaran, saldo } = hitungRingkasan(filteredTransaksi);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Laporan Keuangan Madrasah', 20, 20);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 30);

    doc.setFontSize(12);
    doc.text('Ringkasan:', 20, 50);
    doc.text(`Pemasukan: Rp ${pemasukan.toLocaleString('id-ID')}`, 20, 60);
    doc.text(`Pengeluaran: Rp ${pengeluaran.toLocaleString('id-ID')}`, 20, 70);
    doc.text(`Saldo: Rp ${saldo.toLocaleString('id-ID')}`, 20, 80);

    let y = 100;
    doc.text('Riwayat Transaksi:', 20, y);
    y += 10;
    filteredTransaksi.forEach((t, i) => {
        if (y > 280) { doc.addPage(); y = 20; }  // New page if overflow
        doc.text(`${i+1}. ${t.tanggal} - ${t.jenis} (${t.kategori}): ${t.deskripsi} - Rp ${t.jumlah.toLocaleString('id-ID')}`, 20, y);
        y += 10;
    });

    doc.save('laporan-keuangan-madrasah.pdf');
    console.log('PDF exported successfully');
}

// Show/Hide Sections (untuk sidebar)
function showSection(section) {
    // Sembunyikan semua section
    document.querySelectorAll('[id$="Section"]').forEach(el => el.style.display = 'none');
    
    // Tampilkan section yang dipilih
    if (section === 'transaksi') {
        document.getElementById('transaksiSection').style.display = 'block';
        renderTabel();
    } else if (section === 'riwayat') {
        document.getElementById('riwayatSection').style.display = 'block';  // Tambahkan div id="riwayatSection" di HTML jika perlu
        renderTabel();
    } else if (section === 'ringkasan') {
        document.getElementById('ringkasanSection').style.display = 'block';
        tampilkanRingkasan();
    } else if (section === 'grafik') {
        document.getElementById('grafikSection').style.display = 'block';
        updateGrafik();
    } else if (section === 'ekspor') {
        document.getElementById('eksporSection').style.display = 'block';  // Tambahkan div jika perlu
        // Auto ekspor atau tampilkan tombol
    }
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    event?.target.classList.add('active');
}

// ============================================
// HANDLER UNTUK INDEX.HTML (LOGIN)
// ============================================
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElement
