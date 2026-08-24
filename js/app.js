// ======================================================
// INVENTARIS FRONTEND
// ======================================================

console.log("APP INVENTARIS V20 DIMUAT");

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

const filterKeadaan = document.getElementById("filterKeadaan");

const totalJenis = document.getElementById("totalJenis");

const totalUnit = document.getElementById("totalUnit");

const totalBaik = document.getElementById("totalBaik");

const totalMasalah = document.getElementById("totalMasalah");

const btnTambah = document.getElementById("btnTambah");

const modalForm = document.getElementById("modalForm");

const modalTitle = document.getElementById("modalTitle");

const btnCloseModal = document.getElementById("btnCloseModal");

const btnBatal = document.getElementById("btnBatal");

const btnSimpan = document.getElementById("btnSimpan");

const inventoryForm = document.getElementById("inventoryForm");

const inventoryId = document.getElementById("inventoryId");

const nomorSeri = document.getElementById("nomorSeri");

const namaAlat = document.getElementById("namaAlat");

const jumlah = document.getElementById("jumlah");

const tahunPerolehan = document.getElementById("tahunPerolehan");

const keadaan = document.getElementById("keadaan");

const keterangan = document.getElementById("keterangan");

const toast = document.getElementById("toast");

// ======================================================
// UTILITAS
// ======================================================

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ======================================================
// TOAST
// ======================================================

function showToast(message, type = "success") {
  toast.textContent = message;

  toast.className = `toast ${type} show`;

  setTimeout(function () {
    toast.className = "toast";
  }, 3500);
}

// ======================================================
// GET DATA DENGAN JSONP
// ======================================================

function loadInventory() {
  return new Promise((resolve, reject) => {
    loading.classList.remove("hidden");

    emptyState.classList.add("hidden");

    const callbackName =
      "inventoryCallback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);

    const script = document.createElement("script");

    let selesai = false;

    function cleanup() {
      if (selesai) {
        return;
      }

      selesai = true;

      clearTimeout(timeout);

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }
    }

    const timeout = setTimeout(function () {
      cleanup();

      loading.classList.add("hidden");

      const error = new Error("Waktu koneksi ke database habis.");

      showToast(error.message, "error");

      reject(error);
    }, 15000);

    window[callbackName] = function (result) {
      cleanup();

      loading.classList.add("hidden");

      if (!result || !result.success) {
        const message =
          result && result.message
            ? result.message
            : "Gagal mengambil data inventaris.";

        showToast(message, "error");

        reject(new Error(message));

        return;
      }

      inventoryData = Array.isArray(result.data) ? result.data : [];

      updateDashboard();

      applyFilter();

      resolve(inventoryData);
    };

    script.onerror = function () {
      cleanup();

      loading.classList.add("hidden");

      const error = new Error("Tidak dapat terhubung ke Google Apps Script.");

      showToast(error.message, "error");

      reject(error);
    };

    script.src =
      CONFIG.API_URL +
      "?action=list" +
      "&callback=" +
      encodeURIComponent(callbackName) +
      "&_=" +
      Date.now();

    document.body.appendChild(script);
  });
}

// ======================================================
// POST KE GAS DENGAN FORM TERSEMBUNYI
// ======================================================

function postToGAS(data) {
  return new Promise((resolve) => {
    const iframeName =
      "gas_iframe_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

    const iframe = document.createElement("iframe");

    iframe.name = iframeName;

    iframe.id = iframeName;

    iframe.style.display = "none";

    document.body.appendChild(iframe);

    const form = document.createElement("form");

    form.method = "POST";

    form.action = CONFIG.API_URL;

    form.target = iframeName;

    form.style.display = "none";

    Object.keys(data).forEach(function (key) {
      const input = document.createElement("input");

      input.type = "hidden";

      input.name = key;

      input.value =
        data[key] === undefined || data[key] === null ? "" : String(data[key]);

      form.appendChild(input);
    });

    document.body.appendChild(form);

    console.log("POST GAS:", data);

    form.submit();

    // GAS memerlukan sedikit waktu
    setTimeout(function () {
      try {
        form.remove();

        iframe.remove();
      } catch (error) {
        console.log(error);
      }

      resolve();
    }, 1800);
  });
}

// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {
  const jumlahJenis = inventoryData.length;

  const jumlahUnit = inventoryData.reduce(function (total, item) {
    return total + Number(item.jumlah || 0);
  }, 0);

  const jumlahBaik = inventoryData
    .filter((item) => item.keadaan === "Baik")
    .reduce(function (total, item) {
      return total + Number(item.jumlah || 0);
    }, 0);

  const jumlahMasalah = inventoryData
    .filter((item) => item.keadaan !== "Baik")
    .reduce(function (total, item) {
      return total + Number(item.jumlah || 0);
    }, 0);

  totalJenis.textContent = jumlahJenis;

  totalUnit.textContent = jumlahUnit;

  totalBaik.textContent = jumlahBaik;

  totalMasalah.textContent = jumlahMasalah;
}

// ======================================================
// FILTER
// ======================================================

function applyFilter() {
  const keyword = searchInput.value.trim().toLowerCase();

  const selectedKeadaan = filterKeadaan.value;

  const filtered = inventoryData.filter(function (item) {
    const nama = String(item.nama_alat || "").toLowerCase();

    const seri = String(item.nomor_seri || "").toLowerCase();

    const keteranganText = String(item.keterangan || "").toLowerCase();

    const cocokSearch =
      !keyword ||
      nama.includes(keyword) ||
      seri.includes(keyword) ||
      keteranganText.includes(keyword);

    const cocokKeadaan = !selectedKeadaan || item.keadaan === selectedKeadaan;

    return cocokSearch && cocokKeadaan;
  });

  renderTable(filtered);

  renderMobile(filtered);
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

  data.forEach(function (item) {
    const row = document.createElement("tr");

    row.innerHTML = `

        <td>
          ${escapeHTML(item.nomor)}
        </td>


        <td>

          <strong>
            ${escapeHTML(item.nomor_seri)}
          </strong>

        </td>


        <td>
          ${escapeHTML(item.nama_alat)}
        </td>


        <td>
          ${escapeHTML(item.jumlah)}
        </td>


        <td>
          ${escapeHTML(item.tahun_perolehan)}
        </td>


        <td>

          <span
            class="
              badge
              ${getBadgeClass(item.keadaan)}
            "
          >

            ${escapeHTML(item.keadaan)}

          </span>

        </td>


        <td>

          ${escapeHTML(item.keterangan || "-")}

        </td>


        <td>

          <div
            class="action-group"
          >

            <button
              type="button"
              class="
                action-button
                action-edit
              "
              data-action="edit"
              data-id="${escapeHTML(item.id)}"
            >
              Edit
            </button>


            <button
              type="button"
              class="
                action-button
                action-delete
              "
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
// MOBILE
// ======================================================

function renderMobile(data) {
  mobileList.innerHTML = "";

  data.forEach(function (item) {
    const card = document.createElement("div");

    card.className = "mobile-card";

    card.innerHTML = `

        <div
          class="mobile-card-header"
        >

          <div>

            <div
              class="mobile-card-title"
            >

              ${escapeHTML(item.nama_alat)}

            </div>


            <div
              class="mobile-card-serial"
            >

              ${escapeHTML(item.nomor_seri)}

            </div>

          </div>


          <span
            class="
              badge
              ${getBadgeClass(item.keadaan)}
            "
          >

            ${escapeHTML(item.keadaan)}

          </span>

        </div>



        <div
          class="mobile-info"
        >

          <div>

            <span>
              Jumlah
            </span>

            <strong>

              ${escapeHTML(item.jumlah)}

            </strong>

          </div>


          <div>

            <span>
              Tahun Perolehan
            </span>

            <strong>

              ${escapeHTML(item.tahun_perolehan)}

            </strong>

          </div>

        </div>



        <div
          style="
            margin-bottom:15px;
          "
        >

          <span
            style="
              display:block;
              margin-bottom:4px;
              font-size:11px;
              color:#64748b;
            "
          >
            Keterangan
          </span>

          ${escapeHTML(item.keterangan || "-")}

        </div>



        <div
          class="mobile-actions"
        >

          <button
            type="button"
            class="
              action-button
              action-edit
            "
            data-action="edit"
            data-id="${escapeHTML(item.id)}"
          >
            Edit
          </button>


          <button
            type="button"
            class="
              action-button
              action-delete
            "
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

// ======================================================
// RESET
// ======================================================

function resetForm() {
  inventoryForm.reset();

  editingId = null;

  inventoryId.value = "";

  modalTitle.textContent = "Tambah Inventaris";

  btnSimpan.textContent = "Simpan Data";

  tahunPerolehan.max = new Date().getFullYear();
}

// ======================================================
// TAMBAH
// ======================================================

function openAddForm() {
  resetForm();

  tahunPerolehan.value = new Date().getFullYear();

  keadaan.value = "Baik";

  openModal();
}

// ======================================================
// EDIT
// ======================================================

function editInventory(id) {
  const item = inventoryData.find(function (data) {
    return String(data.id) === String(id);
  });

  if (!item) {
    showToast("Data tidak ditemukan.", "error");

    return;
  }

  editingId = item.id;

  inventoryId.value = item.id;

  nomorSeri.value = item.nomor_seri;

  namaAlat.value = item.nama_alat;

  jumlah.value = item.jumlah;

  tahunPerolehan.value = item.tahun_perolehan;

  keadaan.value = item.keadaan;

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

  const serialTarget = nomorSeri.value.trim().toLowerCase();

  const idTarget = editingId;

  const data = {
    action: isEdit ? "update" : "add",

    nomor_seri: nomorSeri.value.trim(),

    nama_alat: namaAlat.value.trim(),

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

    btnSimpan.textContent = isEdit ? "Menyimpan Perubahan..." : "Menyimpan...";

    await postToGAS(data);

    // beri waktu GAS menulis
    await delay(1200);

    await loadInventory();

    let berhasil = false;

    if (isEdit) {
      berhasil = inventoryData.some(function (item) {
        return (
          String(item.id) === String(idTarget) &&
          String(item.nomor_seri).trim().toLowerCase() === serialTarget
        );
      });
    } else {
      berhasil = inventoryData.some(function (item) {
        return String(item.nomor_seri).trim().toLowerCase() === serialTarget;
      });
    }

    if (berhasil) {
      closeModal();

      showToast(
        isEdit ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.",
        "success",
      );
    } else {
      showToast(
        "Data belum masuk ke database. Cek Eksekusi Apps Script.",
        "error",
      );
    }
  } catch (error) {
    console.error("SAVE ERROR:", error);

    showToast("Gagal menyimpan data.", "error");
  } finally {
    btnSimpan.disabled = false;

    btnSimpan.textContent = isEdit ? "Simpan Perubahan" : "Simpan Data";
  }
});

// ======================================================
// DELETE
// ======================================================

async function deleteInventory(id) {
  const item = inventoryData.find(function (data) {
    return String(data.id) === String(id);
  });

  if (!item) {
    showToast("Data tidak ditemukan.", "error");

    return;
  }

  const yakin = confirm(
    `Apakah Anda yakin ingin menghapus "${item.nama_alat}"?`,
  );

  if (!yakin) {
    return;
  }

  try {
    await postToGAS({
      action: "delete",

      id: id,
    });

    await delay(1200);

    await loadInventory();

    const masihAda = inventoryData.some(function (data) {
      return String(data.id) === String(id);
    });

    if (!masihAda) {
      showToast("Data berhasil dihapus.", "success");
    } else {
      showToast("Data belum berhasil dihapus.", "error");
    }
  } catch (error) {
    console.error("DELETE ERROR:", error);

    showToast("Gagal menghapus data.", "error");
  }
}

// ======================================================
// ACTION BUTTON
// ======================================================

document.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  const id = button.dataset.id;

  if (action === "edit") {
    editInventory(id);
  }

  if (action === "delete") {
    deleteInventory(id);
  }
});

// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener("input", applyFilter);

filterKeadaan.addEventListener("change", applyFilter);

// ======================================================
// MODAL EVENT
// ======================================================

btnTambah.addEventListener("click", openAddForm);

btnCloseModal.addEventListener("click", closeModal);

btnBatal.addEventListener("click", closeModal);

document.querySelector(".modal-overlay").addEventListener("click", closeModal);

// ======================================================
// ESC
// ======================================================

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !modalForm.classList.contains("hidden")) {
    closeModal();
  }
});

// ======================================================
// START
// ======================================================

document.addEventListener("DOMContentLoaded", async function () {
  tahunPerolehan.max = new Date().getFullYear();

  try {
    await loadInventory();
  } catch (error) {
    console.error("LOAD AWAL ERROR:", error);
  }
});
