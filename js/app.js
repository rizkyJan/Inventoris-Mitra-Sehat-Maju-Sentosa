// ======================================================
// SISTEM INVENTARIS MITRA SEHAT MAJU SENTOSA
// FRONTEND - CLOUDFLARE WORKER VERSION
// ======================================================

console.log("INVENTARIS MSMS V60 - CLOUDFLARE VERSION AKTIF");

let inventoryData = [];
let editingId = null;

// ======================================================
// ELEMENT
// ======================================================

const tableBody = document.getElementById("tableBody");
const mobileList = document.getElementById("mobileList");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterCabang = document.getElementById("filterCabang");
const filterJenis = document.getElementById("filterJenis");
const filterKeadaan = document.getElementById("filterKeadaan");

const totalJenis = document.getElementById("totalJenis");
const totalUnit = document.getElementById("totalUnit");
const totalBaik = document.getElementById("totalBaik");
const totalMasalah = document.getElementById("totalMasalah");

const btnTambah = document.getElementById("btnTambah");
const btnDownloadExcel = document.getElementById("btnDownloadExcel");
const modalForm = document.getElementById("modalForm");
const modalTitle = document.getElementById("modalTitle");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnBatal = document.getElementById("btnBatal");
const btnSimpan = document.getElementById("btnSimpan");

const inventoryForm = document.getElementById("inventoryForm");
const inventoryId = document.getElementById("inventoryId");
const nomorBarang = document.getElementById("nomorBarang");
const nomorSeri = document.getElementById("nomorSeri");
const namaAlat = document.getElementById("namaAlat");
const merkBarang = document.getElementById("merkBarang");
const jenisBarang = document.getElementById("jenisBarang");
const lokasiCabang = document.getElementById("lokasiCabang");
const lokasiAlat = document.getElementById("lokasiAlat");
const jumlah = document.getElementById("jumlah");
const tahunPerolehan = document.getElementById("tahunPerolehan");
const keadaan = document.getElementById("keadaan");
const keterangan = document.getElementById("keterangan");
const toast = document.getElementById("toast");

// ======================================================
// HELPER
// ======================================================

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayValue(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3500);
}

// ======================================================
// GET DATA INVENTARIS
// ======================================================

async function loadInventory() {
  try {
    loading.classList.remove("hidden");
    emptyState.classList.add("hidden");

    const response = await fetch(CONFIG.API_URL + "?action=list", {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal mengambil data.");
    }

    if (!result.success) {
      throw new Error(result.message || "Database gagal memberikan data.");
    }

    inventoryData = Array.isArray(result.data) ? result.data : [];

    updateDashboard();
    applyFilter();

    return inventoryData;
  } catch (error) {
    console.error("LOAD ERROR:", error);
    inventoryData = [];
    updateDashboard();
    applyFilter();
    showToast(error.message || "Tidak dapat terhubung ke server.", "error");
    return [];
  } finally {
    loading.classList.add("hidden");
  }
}

// ======================================================
// POST DATA
// ======================================================

async function postToGAS(data) {
  const body = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    body.append(
      key,
      value === undefined || value === null ? "" : String(value),
    );
  });

  const response = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Request gagal.");
  }

  if (!result.success) {
    throw new Error(result.message || "Operasi database gagal.");
  }

  return result;
}

// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {
  const jumlahBarang = inventoryData.length;

  const jumlahUnit = inventoryData.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0,
  );

  const jumlahBaik = inventoryData
    .filter((item) => item.keadaan === "Baik")
    .reduce((total, item) => total + Number(item.jumlah || 0), 0);

  const jumlahMasalah = inventoryData
    .filter((item) => item.keadaan !== "Baik")
    .reduce((total, item) => total + Number(item.jumlah || 0), 0);

  totalJenis.textContent = jumlahBarang;
  totalUnit.textContent = jumlahUnit;
  totalBaik.textContent = jumlahBaik;
  totalMasalah.textContent = jumlahMasalah;
}

// ======================================================
// FILTER
// ======================================================

function getFilteredData() {
  const keyword = searchInput.value.trim().toLowerCase();
  const cabang = filterCabang.value;
  const jenis = filterJenis.value;
  const kondisi = filterKeadaan.value;

  return inventoryData.filter((item) => {
    const searchable = [
      item.nomor_barang,
      item.nomor_seri,
      item.nama_alat,
      item.merk_barang,
      item.jenis_barang,
      item.lokasi_cabang,
      item.lokasi_alat,
      item.keadaan,
      item.keterangan,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    const cocokCari = !keyword || searchable.includes(keyword);
    const cocokCabang = !cabang || item.lokasi_cabang === cabang;
    const cocokJenis = !jenis || item.jenis_barang === jenis;
    const cocokKeadaan = !kondisi || item.keadaan === kondisi;

    return cocokCari && cocokCabang && cocokJenis && cocokKeadaan;
  });
}

function applyFilter() {
  const data = getFilteredData();
  renderTable(data);
  renderMobile(data);
}

// ======================================================
// BADGE
// ======================================================

function getBadgeClass(status) {
  switch (status) {
    case "Baik":
      return "badge-baik";
    case "Rusak Ringan":
      return "badge-rusak-ringan";
    case "Rusak Berat":
      return "badge-rusak-berat";
    case "Dalam Perbaikan":
      return "badge-perbaikan";
    case "Tidak Digunakan":
      return "badge-tidak-digunakan";
    default:
      return "badge-tidak-digunakan";
  }
}

// ======================================================
// TABLE DESKTOP
// ======================================================

function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  data.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(item.nomor)}</td>
      <td><strong>${escapeHTML(displayValue(item.nomor_barang))}</strong></td>
      <td>${escapeHTML(displayValue(item.nomor_seri))}</td>
      <td>${escapeHTML(displayValue(item.nama_alat))}</td>
      <td>${escapeHTML(displayValue(item.merk_barang))}</td>
      <td>${escapeHTML(displayValue(item.jenis_barang))}</td>
      <td>${escapeHTML(displayValue(item.lokasi_cabang))}</td>
      <td>${escapeHTML(displayValue(item.lokasi_alat))}</td>
      <td>${escapeHTML(item.jumlah)}</td>
      <td>${escapeHTML(item.tahun_perolehan)}</td>
      <td>
        <span class="badge ${getBadgeClass(item.keadaan)}">
          ${escapeHTML(displayValue(item.keadaan))}
        </span>
      </td>
      <td>${escapeHTML(displayValue(item.keterangan))}</td>
      <td>
        <div class="action-group">
          <button
            type="button"
            class="action-button action-edit"
            data-action="edit"
            data-id="${escapeHTML(item.id)}"
          >
            Edit
          </button>
          <button
            type="button"
            class="action-button action-delete"
            data-action="delete"
            data-id="${escapeHTML(item.id)}"
          >
            Hapus
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// ======================================================
// MOBILE CARD
// ======================================================

function renderMobile(data) {
  mobileList.innerHTML = "";

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "mobile-card";

    card.innerHTML = `
      <div class="mobile-card-header">
        <div>
          <div class="mobile-card-title">
            ${escapeHTML(displayValue(item.nama_alat))}
          </div>
          <div class="mobile-card-serial">
            Merk: ${escapeHTML(displayValue(item.merk_barang))}
          </div>
          <div class="mobile-card-serial">
            Nomor Barang: <strong>${escapeHTML(displayValue(item.nomor_barang))}</strong>
          </div>
          <div class="mobile-card-serial">
            Nomor Seri: ${escapeHTML(displayValue(item.nomor_seri))}
          </div>
        </div>

        <span class="badge ${getBadgeClass(item.keadaan)}">
          ${escapeHTML(displayValue(item.keadaan))}
        </span>
      </div>

      <div class="mobile-meta-grid">
        <div>
          <span>Jenis</span>
          <strong>${escapeHTML(displayValue(item.jenis_barang))}</strong>
        </div>
        <div>
          <span>Lokasi Cabang</span>
          <strong>${escapeHTML(displayValue(item.lokasi_cabang))}</strong>
        </div>
        <div>
          <span>Lokasi Alat</span>
          <strong>${escapeHTML(displayValue(item.lokasi_alat))}</strong>
        </div>
        <div>
          <span>Jumlah</span>
          <strong>${escapeHTML(item.jumlah)}</strong>
        </div>
        <div>
          <span>Tahun Perolehan</span>
          <strong>${escapeHTML(item.tahun_perolehan)}</strong>
        </div>
      </div>

      <div class="mobile-description">
        <span>Keterangan</span>
        ${escapeHTML(displayValue(item.keterangan))}
      </div>

      <div class="mobile-actions">
        <button
          type="button"
          class="action-button action-edit"
          data-action="edit"
          data-id="${escapeHTML(item.id)}"
        >
          Edit
        </button>
        <button
          type="button"
          class="action-button action-delete"
          data-action="delete"
          data-id="${escapeHTML(item.id)}"
        >
          Hapus
        </button>
      </div>
    `;

    mobileList.appendChild(card);
  });
}

// ======================================================
// MODAL
// ======================================================

function openModal() {
  modalForm.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalForm.classList.add("hidden");
  document.body.style.overflow = "";
  resetForm();
}

function resetForm() {
  inventoryForm.reset();
  editingId = null;
  inventoryId.value = "";
  modalTitle.textContent = "Tambah Inventaris";
  btnSimpan.textContent = "Simpan Data";
  tahunPerolehan.max = new Date().getFullYear();
}

function openAddForm() {
  resetForm();
  tahunPerolehan.value = new Date().getFullYear();
  jumlah.value = 1;
  jenisBarang.value = "Medis";
  keadaan.value = "Baik";
  lokasiCabang.value = "";
  openModal();
}

// ======================================================
// EDIT
// ======================================================

function editInventory(id) {
  const item = inventoryData.find((data) => String(data.id) === String(id));

  if (!item) {
    showToast("Data tidak ditemukan.", "error");
    return;
  }

  editingId = item.id;
  inventoryId.value = item.id;
  nomorBarang.value = item.nomor_barang || "";
  nomorSeri.value = item.nomor_seri || "";
  namaAlat.value = item.nama_alat || "";
  merkBarang.value = item.merk_barang || "";
  jenisBarang.value = item.jenis_barang || "";
  lokasiCabang.value = item.lokasi_cabang || "";
  lokasiAlat.value = item.lokasi_alat || "";
  jumlah.value = item.jumlah || 1;
  tahunPerolehan.value = item.tahun_perolehan || "";
  keadaan.value = item.keadaan || "";
  keterangan.value = item.keterangan || "";

  modalTitle.textContent = "Edit Inventaris";
  btnSimpan.textContent = "Simpan Perubahan";
  openModal();
}

// ======================================================
// SIMPAN / UPDATE
// ======================================================

inventoryForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const isEdit = Boolean(editingId);

  const data = {
    action: isEdit ? "update" : "add",
    nomor_barang: nomorBarang.value.trim(),
    nomor_seri: nomorSeri.value.trim(),
    nama_alat: namaAlat.value.trim(),
    merk_barang: merkBarang.value.trim(),
    jenis_barang: jenisBarang.value,
    lokasi_cabang: lokasiCabang.value,
    lokasi_alat: lokasiAlat.value.trim(),
    jumlah: jumlah.value,
    tahun_perolehan: tahunPerolehan.value,
    keadaan: keadaan.value,
    keterangan: keterangan.value.trim(),
  };

  if (isEdit) {
    data.id = editingId;
  }

  try {
    btnSimpan.disabled = true;
    btnSimpan.textContent = isEdit
      ? "Menyimpan Perubahan..."
      : "Menyimpan...";

    const result = await postToGAS(data);

    closeModal();
    showToast(
      result.message ||
        (isEdit
          ? "Data berhasil diperbarui."
          : "Data berhasil ditambahkan."),
      "success",
    );

    await loadInventory();
  } catch (error) {
    console.error("SAVE ERROR:", error);
    showToast(error.message || "Gagal menyimpan data.", "error");
  } finally {
    btnSimpan.disabled = false;
    btnSimpan.textContent = isEdit ? "Simpan Perubahan" : "Simpan Data";
  }
});

// ======================================================
// DELETE
// ======================================================

async function deleteInventory(id) {
  const item = inventoryData.find((data) => String(data.id) === String(id));

  if (!item) {
    showToast("Data tidak ditemukan.", "error");
    return;
  }

  const yakin = confirm(
    `Apakah Anda yakin ingin menghapus "${item.nama_alat}" dengan nomor barang "${item.nomor_barang}"?`,
  );

  if (!yakin) return;

  try {
    const result = await postToGAS({
      action: "delete",
      id,
    });

    showToast(result.message || "Data berhasil dihapus.", "success");
    await loadInventory();
  } catch (error) {
    console.error("DELETE ERROR:", error);
    showToast(error.message || "Gagal menghapus data.", "error");
  }
}

// ======================================================
// DOWNLOAD EXCEL
// ======================================================

function downloadExcel() {
  const data = getFilteredData();

  if (data.length === 0) {
    showToast("Tidak ada data yang dapat di-download.", "error");
    return;
  }

  if (typeof XLSX === "undefined") {
    showToast("Library Excel belum berhasil dimuat. Coba refresh halaman.", "error");
    return;
  }

  const excelData = data.map((item, index) => ({
    No: index + 1,
    "Nomor Barang": displayValue(item.nomor_barang),
    "Nomor Seri": displayValue(item.nomor_seri),
    "Nama Barang / Aset": displayValue(item.nama_alat),
    "Merk Barang / Aset": displayValue(item.merk_barang),
    "Jenis Barang": displayValue(item.jenis_barang),
    "Lokasi Cabang": displayValue(item.lokasi_cabang),
    "Lokasi Alat": displayValue(item.lokasi_alat),
    Jumlah: Number(item.jumlah || 0),
    "Tahun Perolehan": Number(item.tahun_perolehan || 0),
    Keadaan: displayValue(item.keadaan),
    Keterangan: displayValue(item.keterangan),
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 22 },
    { wch: 18 },
    { wch: 28 },
    { wch: 24 },
    { wch: 10 },
    { wch: 18 },
    { wch: 20 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris");

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const fileName = `Inventaris-Mitra-Sehat-Maju-Sentosa-${yyyy}-${mm}-${dd}.xlsx`;

  XLSX.writeFile(workbook, fileName, { compression: true });
  showToast("File Excel berhasil dibuat.", "success");
}

// ======================================================
// EVENTS
// ======================================================

document.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit") editInventory(id);
  if (action === "delete") deleteInventory(id);
});

searchInput.addEventListener("input", applyFilter);
filterCabang.addEventListener("change", applyFilter);
filterJenis.addEventListener("change", applyFilter);
filterKeadaan.addEventListener("change", applyFilter);
btnTambah.addEventListener("click", openAddForm);
btnDownloadExcel.addEventListener("click", downloadExcel);
btnCloseModal.addEventListener("click", closeModal);
btnBatal.addEventListener("click", closeModal);

document.querySelector(".modal-overlay").addEventListener("click", closeModal);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !modalForm.classList.contains("hidden")) {
    closeModal();
  }
});

// Cegah scroll mouse mengubah nilai input number secara tidak sengaja.
document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener(
    "wheel",
    function () {
      if (document.activeElement === input) {
        input.blur();
      }
    },
    { passive: true },
  );
});

// ======================================================
// START
// ======================================================

document.addEventListener("DOMContentLoaded", async function () {
  tahunPerolehan.max = new Date().getFullYear();
  await loadInventory();
});
