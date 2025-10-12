// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    // Cek login
    if (typeof(Storage) === '' || localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    // Inisialisasi data transaksi
    let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
    let filteredData = [...transaksi]; // Copy untuk filter
    let pieChart, barChart;

    // Jika localStorage kosong, load dari JSON eksternal (opsional)
    if (transaksi.length === 0) {
        fetch('data/transaksi.json')
            .then(response => response.json())
            .then(data => {
                transaksi = data;
                filteredData = [...transaksi];
                simpanData();
                initUI();
            })
            .catch(error => {
                console.error('Gagal load data JSON:', error);
                initUI(); // Lanjut tanpa data sample
            });
    } else {
        initUI();
    }

    // Fungsi inisialisasi UI
    function initUI() {
        renderTabel(filteredData);
        hitungRingkasan(filteredData);
        updateGrafik(filteredData);
        updateFilter(transaksi);
        setupEventListeners();
    }

    // Fungsi format Rupiah
    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
    }

    // Fungsi simpan data ke localStorage
    function simpanData() {
        localStorage.setItem('transaksi', JSON.stringify(transaksi));
    }

    // Fungsi generate ID unik
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Fungsi hitung ringkasan
    function hitungRingkasan(data) {
        let pemasukan = 0, pengeluaran = 0;
        data.forEach(t => {
            const jumlah = parseInt(t.jumlah) || 0;
            if (t.jenis === 'pemasukan') pemasukan += jumlah;
            else pengeluaran += jumlah;
        });
        const saldo = pemasukan - pengeluaran;
        document.getElementById('totalPemasukan').textContent = formatRupiah(pemasukan);
        document.getElementById('totalPengeluaran').textContent = formatRupiah(pengeluaran);
        document.getElementById('saldoAkhir').textContent = saldo >= 0 ? formatRupiah(saldo) : formatRupiah(saldo);
        return { pemasukan, pengeluaran, saldo };
    }

    // Fungsi filter data berdasarkan bulan dan tahun
    function filterData(data) {
        const bulan = document.getElementById('filterBulan').value;
        const tahun = document.getElementById('filterTahun').value;
        filteredData = data.filter(t => {
            const tDate = new Date(t.tanggal);
            const tBulan = (tDate.getMonth() + 1).toString().padStart(2, '0');
            const tTahun = tDate.getFullYear().toString();
            return (!bulan || tBulan === bulan) && (!tahun || tTahun === tahun);
        });
        return filteredData;
    }

    // Fungsi render tabel transaksi
    function renderTabel(data) {
        const tbody = document.querySelector('#transaksiTable tbody');
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada transaksi</td></tr>';
            return;
        }
        data.forEach(t => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                <td><span class="badge ${t.jenis === 'pemasukan' ? 'bg-success' : 'bg-danger'}">${t.jenis}</span></td>
                <td>${t.kategori}</td>
                <td>${formatRupiah(t.jumlah)}</td>
                <td>${t.deskripsi || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${t.id}">Edit</button>
                    <button class="btn btn-sm btn-danger hapus-btn" data-id="${t.id}">Hapus</button>
                </td>
            `;
        });
    }

    // Fungsi update grafik
    function updateGrafik(data) {
        const ctxPie = document.getElementById('pieChart').getContext('2d');
        const ctxBar = document.getElementById('barChart').getContext('2d');

        // Data pie chart: Pemasukan vs Pengeluaran
        const ringkasan = hitungRingkasan(data);
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Pemasukan', 'Pengeluaran'],
                datasets: [{
                    data: [ringkasan.pemasukan, ringkasan.pengeluaran],
                    backgroundColor: ['#28a745', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        // Data bar chart: Bulanan (agregasi sederhana)
        const monthly = {};
        data.forEach(t => {
            const tDate = new Date(t.tanggal);
            const key = `${tDate.getFullYear()}-${(tDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthly[key]) monthly[key] = { pemasukan: 0, pengeluaran: 0 };
            const jumlah = parseInt(t.jumlah) || 0;
            if (t.jenis === 'pemasukan') monthly[key].pemasukan += jumlah;
            else monthly[key].pengeluaran += jumlah;
        });
        const labels = Object.keys(monthly);
        const pemasukanData = labels.map(key => monthly[key].pemasukan);
        const pengeluaranData = labels.map(key => monthly[key].pengeluaran);

        if (barChart) barChart.destroy();
        barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels.map(l => new Date(l + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })),
                datasets: [
                    { label: 'Pemasukan', data: pemasukanData, backgroundColor: '#28a745' },
                    { label: 'Pengeluaran', data: pengeluaranData, backgroundColor: '#dc3545' }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Fungsi update dropdown filter
    function updateFilter(data) {
        const bulanSelect = document.getElementById('filterBulan');
        const tahunSelect = document.getElementById('filterTahun');
        const bulanUnik = [...new Set(data.map(t => {
            const d = new Date(t.tanggal);
            return (d.getMonth() + 1).toString().padStart(2, '0');
        }))].sort();
        const tahunUnik = [...new Set(data.map(t => new Date(t.tanggal).getFullYear().toString()))].sort();

        bulanSelect.innerHTML = '<option value="">Semua Bulan</option>';
        ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].forEach(b => {
            if (bulanUnik.includes(b)) {
                const option = document.createElement('option');
                option.value = b;
                option.textContent = new Date(2000, parseInt(b) - 1, 1).toLocaleDateString('id-ID', { month: 'long' });
                bulanSelect.appendChild(option);
            }
        });

        tahunSelect.innerHTML = '<option value="">Semua Tahun</option>';
        tahunUnik.forEach(y => {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            tahunSelect.appendChild(option);
        });
    }

    // Fungsi ekspor ke Excel menggunakan SheetJS (HANYA UNTUK MANUAL - TIDAK OTOMATIS)
    function eksporExcel(data, filename = null) {
        console.log('Ekspor Excel dipanggil (manual)'); // Debug log
        const ws = XLSX.utils.json_to_sheet(data.map(t => ({
            Tanggal: new Date(t.tanggal).toLocaleDateString('id-ID'),
            Jenis: t.jenis,
            Kategori: t.kategori,
            Jumlah: parseInt(t.jumlah),
            Deskripsi: t.deskripsi || ''
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
        const fileName = filename || `laporan_keuangan_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Form tambah transaksi (TIDAK ADA EKSPOR OTOMATIS)
        document.getElementById('transaksiForm').addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form tambah transaksi disubmit'); // Debug log
            const tanggal = document.getElementById('tanggal').value;
            const jenis = document.getElementById('jenis').value;
            const kategori = document.getElementById('kategori').value.trim();
            const jumlah = parseInt(document.getElementById('jumlah').value);
            const deskripsi = document.getElementById('deskripsi').value.trim();

            if (!tanggal || !kategori || isNaN(jumlah) || jumlah <= 0) {
                alert('Semua field wajib diisi dan jumlah harus lebih dari 0!');
                return;
            }

            const newTransaksi = {
                id: generateId(),
                tanggal,
                jenis,
                kategori,
                jumlah,
                deskripsi
            };

            transaksi.unshift(newTransaksi); // Tambah di atas
            simpanData();
            filteredData = filterData(transaksi); // Re-filter
            renderTabel(filteredData);
            hitungRingkasan(filteredData);
            updateGrafik(filteredData);
            updateFilter(transaksi);

            // Reset form
            this.reset();
            document.getElementById('tanggal').value = new Date().toISOString().split('T')[0]; // Default hari ini
            alert('Transaksi berhasil ditambahkan!');
            // TIDAK ADA EKSPOR DI SINI - SUDAH DIHAPUS
        });

        // Clear form
        document.getElementById('clearForm').addEventListener('click', function() {
            document.getElementById('transaksiForm').reset();
            document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
        });

        // Filter change
        document.getElementById('filterBulan').addEventListener('change', function() {
            filteredData = filterData(transaksi);
            renderTabel(filteredData);
            hitungRingkasan(filteredData);
            updateGrafik(filteredData);
        });
        document.getElementById('filterTahun').addEventListener('change', function() {
            filteredData = filterData(transaksi);
            renderTabel(filteredData);
            hitungRingkasan(filteredData);
            updateGrafik(filteredData);
        });

        // Refresh
        document.getElementById('refreshBtn').addEventListener('click', function() {
            location.reload();
        });

        // Download Excel manual (SAJA YANG MEMANGGIL EKSPOR)
        document.getElementById('exportBtn').addEventListener('click', function() {
            console.log('Tombol ekspor manual diklik'); // Debug log
            eksporExcel(filteredData);
            alert('Laporan Excel berhasil diunduh!');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('loggedIn');
            window.location.href = 'index.html';
        });

        // Event delegation untuk edit dan hapus (TIDAK ADA EKSPOR OTOMATIS)
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const id = e.target.dataset.id;
                const trans = transaksi.find(t => t.id === id);
                if (trans) {
                    document.getElementById('editId').value = id;
                    document.getElementById('editTanggal').value = trans.tanggal;
                    document.getElementById('editJenis').value = trans.jenis;
                    document.getElementById('editKategori').value = trans.kategori;
                    document.getElementById('editJumlah').value = trans.jumlah;
                    document.getElementById('editDeskripsi').value = trans.deskripsi || '';
                    new bootstrap.Modal(document.getElementById('editModal')).show();
                }
            } else if (e.target.classList.contains('hapus-btn')) {
                if (confirm('Yakin hapus transaksi ini?')) {
                    console.log('Transaksi dihapus'); // Debug log
                    const id = e.target.dataset.id;
                    transaksi = transaksi.filter(t => t.id !== id);
                    simpanData();
                    filteredData = filterData(transaksi);
                    renderTabel(filteredData);
                    hitungRingkasan(filteredData);
                    updateGrafik(filteredData);
                    updateFilter(transaksi);
                    alert('Transaksi berhasil dihapus!');
                    // TIDAK ADA EKSPOR DI SINI - SUDAH DIHAPUS
                }
            }
        });

        // Form edit (TIDAK ADA EKSPOR OTOMATIS)
        document.getElementById('editForm').addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form edit disubmit'); // Debug log
            const id = document.getElementById('editId').value;
            const index = transaksi.findIndex(t => t.id === id);
            if (index !== -1) {
                transaksi[index] = {
                    ...transaksi[index],
                    tanggal: document.getElementById('editTanggal').value,
                    jenis: document.getElementById('editJenis').value,
                    kategori: document.getElementById('editKategori').value.trim(),
                    jumlah: parseInt(document.getElementById('editJumlah').value),
                    deskripsi: document.getElementById('editDeskripsi').value.trim()
                };
                simpanData();
                filteredData = filterData(transaksi);
                renderTabel(filteredData);
                hitungRingkasan(filteredData);
                updateGrafik(filteredData);
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                alert('Transaksi berhasil diupdate!');
                // TIDAK ADA EKSPOR DI SINI - SUDAH DIHAPUS
            }
        });

        // Default tanggal hari ini
        document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];

        // Fungsi reset data (ditambahkan baru tanpa merubah kode existing)
        document.getElementById('resetBtn').addEventListener('click', function() {
            if (confirm('Yakin reset semua data transaksi? Data tidak bisa dikembalikan!')) {
                transaksi = []; // Kosongkan array transaksi
                filteredData = []; // Kosongkan filtered data
                localStorage.removeItem('transaksi'); // Hapus dari localStorage
                renderTabel(filteredData); // Update tabel kosong
                hitungRingkasan(filteredData); // Update ringkasan ke 0
                updateGrafik(filteredData); // Update grafik kosong
                updateFilter(transaksi); // Update filter kosong
                alert('Data berhasil direset!');
            }
        });
    }
});
