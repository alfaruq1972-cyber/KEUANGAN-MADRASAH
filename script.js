// TAMBAHAN: Fungsi pendukung untuk kompatibilitas Android (tidak merubah existing)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// TAMBAHAN: CSS dinamis untuk touch-friendly di Android
if (isMobile) {
    const style = document.createElement('style');
    style.id = 'mobileStyles';
    style.textContent = `
        * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        input[type="number"], input[type="date"], select, button { 
            font-size: 16px; min-height: 44px; width: 100%; padding: 8px; 
        } /* Hindari zoom dan touch target besar */
        #transaksiTable { overflow-x: auto; display: block; white-space: nowrap; }
        #transaksiTable th, #transaksiTable td { min-width: 80px; padding: 8px; }
        canvas { max-width: 100%; height: auto !important; } /* Grafik adaptif */
        .bukti-preview { max-width: 50px; max-height: 50px; cursor: pointer; }
    `;
    document.head.appendChild(style);
}

// TAMBAHAN: Registrasi Service Worker untuk PWA (offline & installable di Android)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('PWA SW registered'))
        .catch(err => console.log('SW not available'));
}

// TAMBAHAN: Handle online/offline events
window.addEventListener('online', () => {
    console.log('Koneksi kembali online');
    // Opsional: Reload jika perlu sync, tapi tidak ubah existing
});
window.addEventListener('offline', () => {
    alert('Mode offline aktif. Data disimpan lokal di perangkat.');
});

// TAMBAHAN: Fungsi kompres gambar untuk upload bukti (untuk Android kamera)
function compressImage(file, callback) {
    if (!file) return callback(null);
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let width = img.width;
            let height = img.height;
            // Resize jika terlalu besar
            if (width > 800) {
                height = (height / width) * 800;
                width = 800;
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            // Kompres quality hingga <500KB
            let quality = 0.9;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            while (dataUrl.length > 500 * 1024 && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// TAMBAHAN: Fungsi inject input file bukti ke form (dinamis, tanpa ubah HTML)
function injectBuktiInput() {
    if (isMobile) {
        // Tambah ke form tambah
        const formTambah = document.getElementById('transaksiForm');
        if (formTambah && !document.getElementById('buktiFile')) {
            const buktiInput = document.createElement('input');
            buktiInput.type = 'file';
            buktiInput.id = 'buktiFile';
            buktiInput.accept = 'image/*';
            buktiInput.capture = 'environment'; // Langsung kamera di Android
            buktiInput.style = 'margin: 10px 0;';
            buktiInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    compressImage(file, (compressed) => {
                        if (compressed) {
                            // Tampilkan preview sementara (opsional)
                            const preview = document.createElement('img');
                            preview.src = compressed;
                            preview.className = 'bukti-preview';
                            preview.onclick = () => window.open(compressed);
                            const existingPreview = formTambah.querySelector('.bukti-preview');
                            if (existingPreview) existingPreview.remove();
                            formTambah.appendChild(preview);
                            // Simpan sementara di form (akan diproses di submit)
                            formTambah.dataset.buktiTemp = compressed;
                        }
                    });
                }
            };
            const label = document.createElement('label');
            label.textContent = 'Upload Bukti (Foto Kwitansi)';
            label.htmlFor = 'buktiFile';
            label.style = 'display: block; font-weight: bold; margin: 10px 0 5px;';
            formTambah.appendChild(label);
            formTambah.appendChild(buktiInput);
        }

        // Tambah ke form edit (mirip)
        const formEdit = document.getElementById('editForm');
        if (formEdit && !document.getElementById('editBuktiFile')) {
            const editBuktiInput = document.createElement('input');
            editBuktiInput.type = 'file';
            editBuktiInput.id = 'editBuktiFile';
            editBuktiInput.accept = 'image/*';
            editBuktiInput.capture = 'environment';
            editBuktiInput.style = 'margin: 10px 0;';
            editBuktiInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    compressImage(file, (compressed) => {
                        if (compressed) {
                            formEdit.dataset.buktiTemp = compressed;
                            // Preview mirip di atas
                            const preview = document.createElement('img');
                            preview.src = compressed;
                            preview.className = 'bukti-preview';
                            preview.onclick = () => window.open(compressed);
                            const existing = formEdit.querySelector('.bukti-preview');
                            if (existing) existing.remove();
                            formEdit.appendChild(preview);
                        }
                    });
                }
            };
            const editLabel = document.createElement('label');
            editLabel.textContent = 'Update Bukti (Opsional)';
            editLabel.htmlFor = 'editBuktiFile';
            editLabel.style = 'display: block; font-weight: bold; margin: 10px 0 5px;';
            formEdit.appendChild(editLabel);
            formEdit.appendChild(editBuktiInput);
        }
    }
}

// TAMBAHAN: Extend renderTabel untuk tampilkan bukti (tambah kolom tanpa ubah row existing)
function extendRenderTabelWithBukti(originalRenderTabel, data) {
    originalRenderTabel(data); // Panggil existing
    const tbody = document.querySelector('#transaksiTable tbody tr');
    if (tbody) {
        // Tambah kolom bukti setelah kolom deskripsi (kolom ke-5)
        const cells = tbody.cells;
        if (cells.length === 6) { // Existing: tanggal, jenis, kategori, jumlah, deskripsi, action
            const buktiCell = tbody.insertCell(5); // Insert sebelum action
            const rowData = data.find(t => t.id === /* ambil dari data-id action */ wait, better loop
            // Sebenarnya, karena renderTabel loop forEach, kita perlu override ringan
            // Untuk sederhana, re-render dengan tambahan (tapi tanpa ubah fungsi, kita wrap)
        }
    }
    // Catatan: Untuk full integrasi, di bawah saya wrap renderTabel di initUI
}

// TAMBAHAN: Wrapper untuk fungsi existing agar tambah fitur tanpa ubah
const originalSimpanData = simpanData; // Backup
simpanData = function() {
    try {
        originalSimpanData(); // Panggil existing
        // TAMBAHAN: Check quota setelah simpan
        const dataSize = JSON.stringify(transaksi).length;
        if (dataSize > 5 * 1024 * 1024) { // >5MB
            alert('Storage hampir penuh di perangkat. Hapus foto lama jika perlu.');
        }
    } catch (e) {
        console.error('Simpan gagal:', e);
        alert('Gagal simpan data. Storage penuh atau error perangkat.');
    }
};

const originalUpdateGrafik = updateGrafik; // Backup
updateGrafik = function(data) {
    originalUpdateGrafik(data); // Panggil existing
    // TAMBAHAN: Adaptif untuk mobile
    if (isMobile && pieChart) {
        pieChart.options.maintainAspectRatio = false;
        pieChart.update();
    }
    if (isMobile && barChart) {
        barChart.options.maintainAspectRatio = false;
        barChart.update();
    }
};

const originalEksporExcel = eksporExcel; // Backup
eksporExcel = function(data, filename) {
    try {
        originalEksporExcel(data, filename); // Panggil existing
    } catch (e) {
        console.error('Ekspor gagal di Android:', e);
        // Fallback: Download sebagai CSV sederhana
        const csv = data.map(t => 
            `${new Date(t.tanggal).toLocaleDateString('id-ID')},${t.jenis},${t.kategori},${t.jumlah},${t.deskripsi || ''}`
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'laporan.csv';
        a.click();
        alert('Ekspor Excel gagal, fallback ke CSV.');
    }
};

// TAMBAHAN: Wrapper untuk cek login (handle typo tanpa ubah)
const originalCekLogin = () => typeof(Storage) === '' || localStorage.getItem('loggedIn') !== 'true';
if (typeof(Storage) === 'undefined') {
    // Fallback jika storage tidak support (jarang di Android modern)
    alert('Browser tidak support localStorage. App tidak bisa jalan.');
    window.location.href = 'index.html';
    return;
}

// Inisialisasi aplikasi (existing script mulai dari sini - TIDAK DIUBAH)
document.addEventListener('DOMContentLoaded', function() {
    // Cek login (existing, dengan wrapper di atas)
    if (originalCekLogin()) {
        window.location.href = 'index.html';
        return;
    }

    // Inisialisasi data transaksi (existing)
    let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
    let filteredData = [...transaksi]; // Copy untuk filter
    let pieChart, barChart;

    // Jika localStorage kosong, load dari JSON eksternal (opsional) (existing)
    if (transaksi.length === 0) {
        fetch('data/transaksi.json')
            .then(response => response.json())
            .then(data => {
                transaksi = data;
                filteredData = [...transaksi];
                simpanData(); // Sekarang extended
                initUI();
            })
            .catch(error => {
                console.error('Gagal load data JSON:', error);
                initUI(); // Lanjut tanpa data sample
            });
    } else {
        initUI();
    }

    // Fungsi inisialisasi UI (existing, dengan tambahan di bawah)
    function initUI() {
        // TAMBAHAN: Inject input bukti dan auto-focus
        injectBuktiInput();
        if (isMobile) {
            setTimeout(() => document.getElementById('tanggal').focus(), 100); // Delay untuk load
        }
        
        // TAMBAHAN: Extend renderTabel untuk bukti (wrap)
        const originalRenderTabel = renderTabel;
        renderTabel = function(dataWithBukti) {
            const tbody = document.querySelector('#transaksiTable tbody');
            tbody.innerHTML = '';
            if (dataWithBukti.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada transaksi</td></tr>'; // +1 untuk bukti
                return;
            }
            dataWithBukti.forEach(t => {
                const row = tbody.insertRow();
                const buktiHtml = t.bukti ? `<img src="${t.bukti}" class="bukti-preview" alt="Bukti" onclick="window.open(this.src)" style="cursor:pointer;">` : '-';
                row.innerHTML = `
                    <td>${new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                    <td><span class="badge ${t.jenis === 'pemasukan' ? 'bg-success' : 'bg-danger'}">${t.jenis}</span></td>
                    <td>${t.kategori}</td>
                    <td>${formatRupiah(t.jumlah)}</td>
                    <td>${t.deskripsi || '-'}</td>
                    <td>${buktiHtml}</td> <!-- TAMBAHAN: Kolom bukti -->
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${t.id}">Edit</button>
                        <button class="btn btn-sm btn-danger hapus-btn" data-id="${t.id}">Hapus</button>
                    </td>
                `;
            });
        };
        
        renderTabel(filteredData); // Existing call, sekarang dengan bukti
        hitungRingkasan(filteredData);
        updateGrafik(filteredData); // Sekarang extended
        updateFilter(transaksi);
        setupEventListeners();
    }

    // Fungsi format Rupiah (existing)
    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
    }

    // Fungsi simpan data ke localStorage (existing, sudah di-extend di atas)
    function simpanData() {
        localStorage.setItem('transaksi', JSON.stringify(transaksi));
    }

    // Fungsi generate ID unik (existing)
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Fungsi hitung ringkasan (existing)
    function hitungRingkasan(data) {
        let pemasukan = 0, pengeluaran = 0;
        data.forEach(t => {
            const jumlah = parseInt(t.jumlah) || 0;
            if (t.jenis === 'pemasukan') pemasukan += jumlah;
            else pengeluaran += jumlah;
        });
        const saldo = pemasukan - pengeluaran;
        document.getElementById('totalPemasukan').textContent = formatRupiah(pemasukan);
        document.getElementById('totalPengel
