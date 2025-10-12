// Data Dummy Awal (simpan di localStorage)
let transaksi = JSON.parse(localStorage.getItem('transaksiMadrasah')) || [
    { id: 1, jenis: 'pemasukan', kategori: 'BOS', deskripsi: 'Dana BOS Januari', jumlah: 5000000, tanggal: '2024-01-15' },
    { id: 2, jenis: 'pengeluaran', kategori: 'SPP', deskripsi: 'Pembelian buku', jumlah: 1000000, tanggal: '2024-01-20' }
];

let currentUser = null;
let chart = null;

// Users Demo (enkripsi sederhana untuk demo; gunakan backend nyata)
const users = {
    'bendahara': 'madrasah123',
    'kepala': 'madrasah123'
};

// Fungsi Simpan Data
function simpanData() {
    localStorage.setItem('transaksiMadrasah', JSON.stringify(transaksi));
}

// Hitung Saldo
function hitungSaldo(filteredTransaksi = transaksi) {
    const pemasukan = filteredTransaksi.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
    const pengeluaran = filteredTransaksi.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);
    return pemasukan - pengeluaran;
}

// Tampilkan Saldo
function tampilkanSaldo(filteredTransaksi = transaksi) {
    const saldo = hitungSaldo(filteredTransaksi);
    document.getElementById('saldoDisplay').textContent = `Rp ${saldo.toLocaleString('id-ID')}`;
    if (saldo < 0) {
        document.getElementById('saldoDisplay').classList.add('text-danger');
    } else {
        document.getElementById('saldoDisplay').classList.remove('text-danger');
    }
}

// Render Tabel Transaksi
function renderTabel(filteredTransaksi = transaksi) {
    const tbody = document.getElementById('transaksiBody');
    tbody.innerHTML = '';
    filteredTransaksi.forEach(t => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${t.tanggal}</td>
            <td><span class="badge ${t.jenis === 'pemasukan' ? 'bg-success' : 'bg-danger'}">${t.jenis.toUpperCase()}</span></td>
            <td>${t.kategori}</td>
            <td>${t.deskripsi}</td>
            <td>Rp ${t.jumlah.toLocaleString('id-ID')}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-btn" data-id="${t.id}">Edit</button>
                <button class="btn btn-sm btn-danger hapus-btn" data-id="${t.id}">Hapus</button>
            </td>
        `;
    });

    // Event Edit & Hapus
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editTransaksi(e.target.dataset.id));
    });
    document.querySelectorAll('.hapus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => hapusTransaksi(e.target.dataset.id));
    });
}

// Edit Transaksi
function editTransaksi(id) {
    const t = transaksi.find(tx => tx.id == id);
    if (t) {
        document.getElementById('jenis').value = t.jenis;
        document.getElementById('jumlah').value = t.jumlah;
        document.getElementById('kategori').value = t.kategori;
        document.getElementById('deskripsi').value = t.deskripsi;
        document.getElementById('editId').value = id;
        document.getElementById('editBtn').style.display = 'inline-block';
        document.getElementById('transaksiForm').scrollIntoView();
    }
}

// Hapus Transaksi
