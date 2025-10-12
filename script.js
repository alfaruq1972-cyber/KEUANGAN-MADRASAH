// Inisialisasi aplikasi - VERSI LENGKAP DENGAN RESET DATA BERFUNGSI
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script.js dimuat - Versi lengkap dengan reset data'); // Debug: Konfirmasi load

    // Cek login
    if (typeof(Storage) === 'undefined' || localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    // Inisialisasi data transaksi
    let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
    let filteredData = [...transaksi];
    let pieChart, barChart;

    // Langsung init UI
    initUI();

    // Fungsi inisialisasi UI
    function initUI() {
        console.log('Init UI - Jumlah transaksi:', transaksi.length); // Debug
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
        document.getElementById('saldoAkhir').textContent = formatRupiah(saldo);
        return { pemasukan, pengeluaran, saldo };
    }

    // Fungsi filter data berdasarkan bulan dan tahun
    function filterData(data) {
        const bulan = document.getElementById('filterBulan') ? document.getElementById('filterBulan').value : '';
        const tahun = document.getElementById('filterTahun') ? document.getElementById('filterTahun').value : '';
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
        if (!tbody) return; // Error handling
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
        try {
            const ctxPie = document.getElementById('pieChart');
            const ctxBar = document.getElementById('barChart');
            if (!ctxPie || !ctxBar) return;

            const ctxPie2d = ctxPie.getContext('2d');
            const ctxBar2d = ctxBar.getContext('2d');

            const ringkasan = hitungRingkasan(data);
            if (pieChart) pieChart.destroy();
            pieChart = new Chart(ctxPie2d, {
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
            barChart = new Chart(ctxBar2d, {
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
        } catch (error) {
            console.error('Error update grafik:', error);
        }
    }

    // Fungsi update dropdown filter
    function updateFilter(data) {
        const bulanSelect = document.getElementById('filterBulan');
        const tahunSelect = document.getElementById('filterTahun');
        if (!bulanSelect || !tahunSelect) return;

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

    // Fungsi ekspor ke Excel (manual saja)
    function eksporExcel(data, filename = null) {
        if (typeof XLSX === 'undefined') {
            alert('Library Excel tidak dimuat. Periksa koneksi.');
            return;
        }
        if (!confirm('Yakin download laporan Excel sekarang?')) return;

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
        alert('Laporan Excel berhasil diunduh!');
    }

    // Setup event listeners (TERMASUK RESET DATA)
    function setupEventListeners() {
        console.log('Setup event listeners - Termasuk reset'); // Debug

        // Form tambah transaksi
        const formTambah = document.getElementById('transaksiForm');
        if (formTambah) {
            formTambah.addEventListener('submit', function(e) {
                e.preventDefault();
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
                    tanggal, jenis, kategori, jumlah, deskripsi
                };

                transaksi.unshift(newTransaksi);
                simpanData();
                filteredData = filterData(transaksi);
                renderTabel(filteredData);
                hitungRingkasan(filteredData);
                updateGrafik(filteredData);
                updateFilter(transaksi);

                this.reset();
                document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
                alert('Transaksi berhasil ditambahkan!');
            });
        }

        // Clear form
        const clearBtn = document.getElementById('clearForm');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                document.getElementById('transaksiForm').reset();
                document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
            });
        }

        // Filter change
        const filterBulan = document.getElementById('filterBulan');
        const filterTahun = document.getElementById('filterTahun');
        if (filterBulan) filterBulan.addEventListener('change', function() {
            filteredData = filterData(transaksi);
            renderTabel(filteredData);
            hitungRingkasan(filteredData);
            updateGrafik(filteredData);
        });
        if (filterTahun) filterTahun.addEventListener('change', function() {
            filteredData = filterData(transaksi);
            renderTabel(filteredData);
            hitungRingkasan(filteredData);
            updateGrafik(filteredData);
        });

        // Refresh
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', function() {
            location.reload();
        });

        // Ekspor manual
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', function() {
            eksporExcel(filteredData);
        });

        // *** MENU RESET DATA - INI YANG BARU DAN BERFUNGSI ***
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            console.log('Reset button ditemukan - Event listener ditambahkan'); // Debug
            resetBtn.addEventListener('click', function() {
                console.log('Tombol Reset Data diklik!'); // Debug
                if (confirm('Yakin reset semua data transaksi? Data tidak bisa dikembalikan!')) {
                    localStorage.removeItem('transaksi'); // Hapus data transaksi saja
                    console.log('Data direset - Reload halaman'); // Debug
                    alert('Data berhasil direset! Halaman akan dimuat ulang.');
                    location.reload(); // Reload untuk update UI
                } else {
                    console.log('Reset dibatalkan'); // Debug
                }
            });
        } else {
            console.error('Reset button tidak ditemukan! Periksa ID di HTML.'); // Debug error
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('loggedIn');
            window.location.href = 'index.html';
        });

        // Event delegation untuk edit dan hapus
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
                    const id = e.target.dataset.id;
                    transaksi = transaksi.filter(t => t.id !== id);
                    simpanData();
                    filteredData = filterData(transaksi);
                    renderTabel(filteredData);
                    hitungRingkasan(filteredData);
                    updateGrafik(filteredData);
                    updateFilter(transaksi);
                    alert('Transaksi berhasil dihapus!');
                }
            }
        });

        // Form edit
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', function(e) {
                e.preventDefault();
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
                }
            });
        }

        // Default tanggal hari ini
        const tanggalInput = document.getElementById('tanggal');
        if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
    }
});
