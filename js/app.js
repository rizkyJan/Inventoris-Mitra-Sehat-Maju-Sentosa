// ======================================================
// INVENTARIS FRONTEND
// CLOUDFLARE WORKER VERSION
// ======================================================

console.log(
  "INVENTARIS CLOUDFLARE VERSION AKTIF"
);


let inventoryData = [];

let editingId = null;


// ======================================================
// ELEMENT
// ======================================================

const tableBody =
  document.getElementById(
    "tableBody"
  );

const mobileList =
  document.getElementById(
    "mobileList"
  );

const loading =
  document.getElementById(
    "loading"
  );

const emptyState =
  document.getElementById(
    "emptyState"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const filterKeadaan =
  document.getElementById(
    "filterKeadaan"
  );


const totalJenis =
  document.getElementById(
    "totalJenis"
  );

const totalUnit =
  document.getElementById(
    "totalUnit"
  );

const totalBaik =
  document.getElementById(
    "totalBaik"
  );

const totalMasalah =
  document.getElementById(
    "totalMasalah"
  );


const btnTambah =
  document.getElementById(
    "btnTambah"
  );

const modalForm =
  document.getElementById(
    "modalForm"
  );

const modalTitle =
  document.getElementById(
    "modalTitle"
  );

const btnCloseModal =
  document.getElementById(
    "btnCloseModal"
  );

const btnBatal =
  document.getElementById(
    "btnBatal"
  );

const btnSimpan =
  document.getElementById(
    "btnSimpan"
  );


const inventoryForm =
  document.getElementById(
    "inventoryForm"
  );

const inventoryId =
  document.getElementById(
    "inventoryId"
  );

const nomorSeri =
  document.getElementById(
    "nomorSeri"
  );

const namaAlat =
  document.getElementById(
    "namaAlat"
  );

const jumlah =
  document.getElementById(
    "jumlah"
  );

const tahunPerolehan =
  document.getElementById(
    "tahunPerolehan"
  );

const keadaan =
  document.getElementById(
    "keadaan"
  );

const keterangan =
  document.getElementById(
    "keterangan"
  );

const toast =
  document.getElementById(
    "toast"
  );


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ======================================================
// TOAST
// ======================================================

function showToast(
  message,
  type = "success"
) {

  toast.textContent =
    message;


  toast.className =
    `toast ${type} show`;


  setTimeout(
    function () {

      toast.className =
        "toast";

    },
    3500
  );

}


// ======================================================
// GET DATA INVENTARIS
// ======================================================

async function loadInventory() {

  try {

    loading.classList.remove(
      "hidden"
    );


    emptyState.classList.add(
      "hidden"
    );


    const response =
      await fetch(

        CONFIG.API_URL +
        "?action=list",

        {

          method:
            "GET",

          cache:
            "no-store"

        }

      );


    const result =
      await response.json();


    if (
      !response.ok
    ) {

      throw new Error(
        result.message ||
        "Gagal mengambil data."
      );

    }


    if (
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Database gagal memberikan data."
      );

    }


    inventoryData =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    updateDashboard();


    applyFilter();


    return inventoryData;


  } catch (error) {

    console.error(
      "LOAD ERROR:",
      error
    );


    showToast(
      error.message ||
      "Tidak dapat terhubung ke server.",
      "error"
    );


    return [];


  } finally {

    loading.classList.add(
      "hidden"
    );

  }

}


// ======================================================
// POST DATA
// ======================================================

async function postToGAS(
  data
) {

  const body =
    new URLSearchParams();


  Object.entries(
    data
  ).forEach(
    function (
      [key, value]
    ) {

      body.append(

        key,

        value === undefined ||
        value === null
          ? ""
          : String(value)

      );

    }
  );


  const response =
    await fetch(

      CONFIG.API_URL,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8"

        },

        body:
          body

      }

    );


  const result =
    await response.json();


  if (
    !response.ok
  ) {

    throw new Error(
      result.message ||
      "Request gagal."
    );

  }


  if (
    !result.success
  ) {

    throw new Error(
      result.message ||
      "Operasi database gagal."
    );

  }


  return result;

}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

  // Total jenis / record alat
  const jumlahJenis =
    inventoryData.length;


  // Total semua unit
  const jumlahUnit =
    inventoryData.reduce(

      function (
        total,
        item
      ) {

        return (
          total +
          Number(
            item.jumlah || 0
          )
        );

      },

      0

    );


  // Unit kondisi baik
  const jumlahBaik =
    inventoryData

      .filter(
        function (item) {

          return (
            item.keadaan ===
            "Baik"
          );

        }
      )

      .reduce(

        function (
          total,
          item
        ) {

          return (
            total +
            Number(
              item.jumlah || 0
            )
          );

        },

        0

      );


  // Unit selain baik
  const jumlahMasalah =
    inventoryData

      .filter(
        function (item) {

          return (
            item.keadaan !==
            "Baik"
          );

        }
      )

      .reduce(

        function (
          total,
          item
        ) {

          return (
            total +
            Number(
              item.jumlah || 0
            )
          );

        },

        0

      );


  totalJenis.textContent =
    jumlahJenis;


  totalUnit.textContent =
    jumlahUnit;


  totalBaik.textContent =
    jumlahBaik;


  totalMasalah.textContent =
    jumlahMasalah;

}


// ======================================================
// FILTER
// ======================================================

function applyFilter() {

  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();


  const filter =
    filterKeadaan.value;


  const data =
    inventoryData.filter(

      function (item) {

        const seri =
          String(
            item.nomor_seri || ""
          )
            .toLowerCase();


        const nama =
          String(
            item.nama_alat || ""
          )
            .toLowerCase();


        const ket =
          String(
            item.keterangan || ""
          )
            .toLowerCase();


        const cocokCari =
          !keyword ||

          seri.includes(
            keyword
          ) ||

          nama.includes(
            keyword
          ) ||

          ket.includes(
            keyword
          );


        const cocokKeadaan =
          !filter ||
          item.keadaan ===
            filter;


        return (
          cocokCari &&
          cocokKeadaan
        );

      }

    );


  renderTable(
    data
  );


  renderMobile(
    data
  );

}


// ======================================================
// BADGE
// ======================================================

function getBadgeClass(
  status
) {

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

function renderTable(
  data
) {

  tableBody.innerHTML =
    "";


  if (
    data.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

    return;

  }


  emptyState.classList.add(
    "hidden"
  );


  data.forEach(
    function (item) {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${escapeHTML(
            item.nomor
          )}
        </td>


        <td>

          <strong>

            ${escapeHTML(
              item.nomor_seri
            )}

          </strong>

        </td>


        <td>

          ${escapeHTML(
            item.nama_alat
          )}

        </td>


        <td>

          ${escapeHTML(
            item.jumlah
          )}

        </td>


        <td>

          ${escapeHTML(
            item.tahun_perolehan
          )}

        </td>


        <td>

          <span
            class="
              badge
              ${getBadgeClass(
                item.keadaan
              )}
            "
          >

            ${escapeHTML(
              item.keadaan
            )}

          </span>

        </td>


        <td>

          ${escapeHTML(
            item.keterangan ||
            "-"
          )}

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
              data-id="${escapeHTML(
                item.id
              )}"
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
              data-id="${escapeHTML(
                item.id
              )}"
            >
              Hapus
            </button>

          </div>

        </td>

      `;


      tableBody.appendChild(
        row
      );

    }
  );

}


// ======================================================
// MOBILE
// ======================================================

function renderMobile(
  data
) {

  mobileList.innerHTML =
    "";


  data.forEach(
    function (item) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "mobile-card";


      card.innerHTML = `

        <div
          class="mobile-card-header"
        >

          <div>

            <div
              class="mobile-card-title"
            >

              ${escapeHTML(
                item.nama_alat
              )}

            </div>


            <div
              class="mobile-card-serial"
            >

              ${escapeHTML(
                item.nomor_seri
              )}

            </div>

          </div>


          <span
            class="
              badge
              ${getBadgeClass(
                item.keadaan
              )}
            "
          >

            ${escapeHTML(
              item.keadaan
            )}

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

              ${escapeHTML(
                item.jumlah
              )}

            </strong>

          </div>


          <div>

            <span>
              Tahun Perolehan
            </span>

            <strong>

              ${escapeHTML(
                item.tahun_perolehan
              )}

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


          ${escapeHTML(
            item.keterangan ||
            "-"
          )}

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
            data-id="${escapeHTML(
              item.id
            )}"
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
            data-id="${escapeHTML(
              item.id
            )}"
          >
            Hapus
          </button>

        </div>

      `;


      mobileList.appendChild(
        card
      );

    }
  );

}


// ======================================================
// MODAL
// ======================================================

function openModal() {

  modalForm.classList.remove(
    "hidden"
  );


  document.body.style.overflow =
    "hidden";

}


function closeModal() {

  modalForm.classList.add(
    "hidden"
  );


  document.body.style.overflow =
    "";


  resetForm();

}


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

  inventoryForm.reset();


  editingId =
    null;


  inventoryId.value =
    "";


  modalTitle.textContent =
    "Tambah Inventaris";


  btnSimpan.textContent =
    "Simpan Data";


  tahunPerolehan.max =
    new Date().getFullYear();

}


// ======================================================
// TAMBAH
// ======================================================

function openAddForm() {

  resetForm();


  tahunPerolehan.value =
    new Date().getFullYear();


  keadaan.value =
    "Baik";


  openModal();

}


// ======================================================
// EDIT
// ======================================================

function editInventory(
  id
) {

  const item =
    inventoryData.find(

      function (data) {

        return (
          String(
            data.id
          ) ===
          String(id)
        );

      }

    );


  if (!item) {

    showToast(
      "Data tidak ditemukan.",
      "error"
    );

    return;

  }


  editingId =
    item.id;


  inventoryId.value =
    item.id;


  nomorSeri.value =
    item.nomor_seri;


  namaAlat.value =
    item.nama_alat;


  jumlah.value =
    item.jumlah;


  tahunPerolehan.value =
    item.tahun_perolehan;


  keadaan.value =
    item.keadaan;


  keterangan.value =
    item.keterangan || "";


  modalTitle.textContent =
    "Edit Inventaris";


  btnSimpan.textContent =
    "Simpan Perubahan";


  openModal();

}


// ======================================================
// SIMPAN / UPDATE
// ======================================================

inventoryForm.addEventListener(

  "submit",

  async function (event) {

    event.preventDefault();


    const isEdit =
      Boolean(
        editingId
      );


    const data = {

      action:
        isEdit
          ? "update"
          : "add",

      nomor_seri:
        nomorSeri.value.trim(),

      nama_alat:
        namaAlat.value.trim(),

      jumlah:
        jumlah.value,

      tahun_perolehan:
        tahunPerolehan.value,

      keadaan:
        keadaan.value,

      keterangan:
        keterangan.value.trim()

    };


    if (isEdit) {

      data.id =
        editingId;

    }


    try {

      btnSimpan.disabled =
        true;


      btnSimpan.textContent =
        isEdit
          ? "Menyimpan Perubahan..."
          : "Menyimpan...";


      const result =
        await postToGAS(
          data
        );


      closeModal();


      showToast(
        result.message ||
        (
          isEdit
            ? "Data berhasil diperbarui."
            : "Data berhasil ditambahkan."
        ),
        "success"
      );


      await loadInventory();


    } catch (error) {

      console.error(
        "SAVE ERROR:",
        error
      );


      showToast(
        error.message ||
        "Gagal menyimpan data.",
        "error"
      );


    } finally {

      btnSimpan.disabled =
        false;


      btnSimpan.textContent =
        isEdit
          ? "Simpan Perubahan"
          : "Simpan Data";

    }

  }

);


// ======================================================
// DELETE
// ======================================================

async function deleteInventory(
  id
) {

  const item =
    inventoryData.find(

      function (data) {

        return (
          String(
            data.id
          ) ===
          String(id)
        );

      }

    );


  if (!item) {

    showToast(
      "Data tidak ditemukan.",
      "error"
    );

    return;

  }


  const yakin =
    confirm(
      `Apakah Anda yakin ingin menghapus "${item.nama_alat}"?`
    );


  if (!yakin) {
    return;
  }


  try {

    const result =
      await postToGAS({

        action:
          "delete",

        id:
          id

      });


    showToast(
      result.message ||
      "Data berhasil dihapus.",
      "success"
    );


    await loadInventory();


  } catch (error) {

    console.error(
      "DELETE ERROR:",
      error
    );


    showToast(
      error.message ||
      "Gagal menghapus data.",
      "error"
    );

  }

}


// ======================================================
// BUTTON EDIT / DELETE
// ======================================================

document.addEventListener(

  "click",

  function (event) {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) {
      return;
    }


    const action =
      button.dataset.action;


    const id =
      button.dataset.id;


    if (
      action === "edit"
    ) {

      editInventory(
        id
      );

    }


    if (
      action === "delete"
    ) {

      deleteInventory(
        id
      );

    }

  }

);


// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener(

  "input",

  applyFilter

);


filterKeadaan.addEventListener(

  "change",

  applyFilter

);


// ======================================================
// MODAL BUTTON
// ======================================================

btnTambah.addEventListener(

  "click",

  openAddForm

);


btnCloseModal.addEventListener(

  "click",

  closeModal

);


btnBatal.addEventListener(

  "click",

  closeModal

);


document
  .querySelector(
    ".modal-overlay"
  )
  .addEventListener(

    "click",

    closeModal

  );


// ======================================================
// ESC
// ======================================================

document.addEventListener(

  "keydown",

  function (event) {

    if (
      event.key ===
        "Escape" &&
      !modalForm.classList.contains(
        "hidden"
      )
    ) {

      closeModal();

    }

  }

);


// ======================================================
// START
// ======================================================

document.addEventListener(

  "DOMContentLoaded",

  async function () {

    tahunPerolehan.max =
      new Date().getFullYear();


    await loadInventory();

  }

);