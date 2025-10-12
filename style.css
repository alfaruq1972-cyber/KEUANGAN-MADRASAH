// Fungsi umum untuk format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0 
    }).format(angka);
}

// Fungsi ekspor Excel menggunakan SheetJS
function eksporExcel(transaksiData, totalPemasukan, totalPengeluaran, saldoAkhir) {
    // Sheet untuk daftar transaksi
    const transaksiSheetData = transaksiData.map(t => ({
        Tanggal: t.tanggal,
        Jenis: t.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
        Jumlah: t.jumlah,  // Tanpa format untuk Excel (akan diformat otomatis)
        Deskripsi: t.deskripsi
    }));
    const wsTransaksi = XLSX.utils.json_to_sheet(transaksiSheetData);

    // Sheet untuk ringkasan
    const ringkasanData = [
        ['Ringkasan Keuangan'],
        [''],
        ['Total Pemasukan', totalPemasukan],
        ['Total Pengeluaran', totalPengeluaran],
        ['Saldo Akhir', saldoAkhir],
        [''],
        ['Tanggal Laporan', new Date().toLocaleDateString('id-ID')]
    ];
    const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData);

    // Buat workbook dan tambahkan sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsTransaksi, 'Transaksi');
    XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan');

    // Download file
    const namaFile = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// Inisialisasi dashboard (hanya jalankan jika di halaman dashboard)
document.addEventListener('DOMContentLoaded', function() {
    // Cek jika ini halaman dashboard
    if (document.getElementById('dashboard')) {  // Ganti dengan ID unik di body dashboard.html jika perlu, e.g., <body id="dashboard">
        // Cek login
        if (localStorage.getItem('loggedIn') !== 'true') {
            window.location.href = 'index.html';
            return;
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('loggedIn');
                window.location.href = 'index.html';
            });
        }

        // Load data transaksi
        let transaksiData = JSON.parse(localStorage.getItem('transaksi')) || [];
        let chart;  // Untuk Chart.js

        // Fungsi render tabel transaksi
        function renderTransaksi() {
            const tbody = document.querySelector('#tabelTransaksi tbody');
            if (!tbody) return;  // Safety check

            tbody.innerHTML = '';
            const filterBulan = document.getElementById('filterBulan').value;
            let filteredData = transaksiData;
            if (filterBulan) {
                filteredData = transaksiData.filter(t => t.tanggal.startsWith(filterBulan));
            }

            filteredData.forEach((t, index) => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${t.tanggal}</td>
                    <td>${t.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}</td>
                    <td>${formatRupiah(t.jumlah)}</td>
                    <td>${t.deskripsi}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editTransaksi(${index})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="hapusTransaksi(${index})">Hapus</button>
                    </td>
                `;
            });

            // Update ringkasan dan grafik berdasarkan filteredData
            const pemasukan = filteredData.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
            const pengeluaran = filteredData.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);
            const saldo = pemasukan - pengeluaran;

            updateRingkasan(pemasukan, pengeluaran, saldo);
            updateGrafik(filteredData);
            updateFilterBulan();
        }

        // Update ringkasan saldo
        function updateRingkasan(pemasukan, pengeluaran, saldo) {
            document.getElementById('totalPemasukan').textContent = formatRupiah(pemasukan);
            document.getElementById('totalPengeluaran').textContent = formatRupiah(pengeluaran);
            document.getElementById('saldoAkhir').textContent = formatRupiah(saldo);
        }

        // Update grafik dengan Chart.js
        function updateGrafik(data) {
            const canvas = document.getElementById('grafikChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const monthlyData = {};
            data.forEach(t => {
                const bulan = t.tanggal.substring(0, 7);  // YYYY-MM
                if (!monthlyData[bulan]) {
                    monthlyData[bulan] = { pemasukan: 0, pengeluaran: 0 };
                }
                if (t.jenis === 'pemasukan') {
                    monthlyData[bulan].pemasukan += t.jumlah;
                } else {
                    monthlyData[bulan].pengeluaran += t.jumlah;
                }
            });

            const labels = Object.keys(monthlyData).sort();
            const pemasukanData = labels.map(l => monthlyData[l].pemasukan);
            const pengeluaranData = labels.map(l => monthlyData[l].pengeluaran);

            if (chart) {
                chart.destroy();
            }
            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { 
                            label: 'Pemasukan', 
                            data: pemasukanData, 
                            backgroundColor: '#4CAF50' 
                        },
                        { 
                            label: 'Pengeluaran', 
                            data: pengeluaranData, 
                            backgroundColor: '#f44336' 
                        }
                    ]
                },
                options: { 
                    responsive: true, 
                    scales: { 
                        y: { 
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatRupiah(value);  // Format y-axis sebagai Rupiah
                                }
                            }
                        }
                    }
                }
            });
        }

        // Update dropdown filter bulan
        function updateFilterBulan() {
            const select = document.getElementById('filterBulan');
            if (!select) return;

            const bulanUnik = [...new Set(transaksiData.map(t => t.tanggal.substring(0, 7)))].sort();
            select.innerHTML = '<option value="">Semua Bulan</option>' + 
                bulanUnik.map(b => `<option value="${b}">${new Date(b + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>`).join('');
            
            select.addEventListener('change', renderTransaksi);
        }

        // Form tambah transaksi
        const transaksiForm = document.getElementById('transaksiForm');
        if (transaksiForm) {
            transaksiForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const jenis = document.getElementById('jenis').value;
                const jumlah = parseInt(document.getElementById('jumlah').value);
                const deskripsi = document.getElementById('deskripsi').value;
                const tanggal = document.getElementById('tanggal').value;

                if (jenis && jumlah && deskripsi && tanggal) {
                    transaksiData.unshift({ jenis, jumlah, deskripsi, tanggal });  // Tambah di atas (terbaru dulu)
                    localStorage.setItem('transaksi', JSON.stringify(transaksiData));
                    renderTransaksi();

                    // Hitung ulang untuk ekspor
                    const pemasukan = transaksiData.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
                    const pengeluaran = transaksiData.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);
                    const saldo = pemasukan - pengeluaran;

                    eksporExcel(transaksiData, pemasukan, pengeluaran, saldo);  // Ekspor otomatis
                    this.reset();
                    alert('Transaksi berhasil ditambahkan dan diekspor ke Excel!');
                } else {
                    alert('Mohon lengkapi semua field!');
                }
            });
        }

        // Fungsi edit transaksi (sederhana dengan prompt; bisa di-upgrade ke modal)
        window.editTransaksi = function(index) {
            const t = transaksiData[index];
            const newJumlah = prompt('Jumlah baru (Rp):', t.jumlah);
            const newDeskripsi = prompt('Deskripsi baru:', t.deskripsi);
            if (newJumlah !== null && newDeskripsi !== null) {
                transaksiData[index].jumlah = parseInt(newJumlah);
                transaksiData[index].deskripsi = newDeskripsi;
                localStorage.setItem('transaksi', JSON.stringify(transaksiData));
                renderTransaksi();
                alert('Transaksi berhasil diedit!');
            }
        };

        // Fungsi hapus transaksi
        window.hapusTransaksi = function(index) {
            if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
                transaksiData.splice(index, 1);
                localStorage.setItem('transaksi', JSON.stringify(transaksiData));
                renderTransaksi();
                alert('Transaksi berhasil dihapus!');
            }
        };

        // Tombol download Excel manual
        const downloadBtn = document.getElementById('downloadExcel');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                const pemasukan = transaksiData.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
                const pengeluaran = transaksiData.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);
                const saldo = pemasukan - pengeluaran;
                eksporExcel(transaksiData, pemasukan, pengeluaran, saldo);
            });
        }

        // Render awal
        renderTransaksi();
    }
});
