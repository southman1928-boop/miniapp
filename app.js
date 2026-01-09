const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let selectedProductId = null;
let selectedProductTitle = '';
let selectedQuantity = 1;

/* ===== Загрузка каталога из Google Sheets ===== */
fetch('https://opensheet.elk.sh/1_3n83ymNabp9c0BwdGeHLSiVMfa1t8GKxw7qxDSNCvY/products')
  .then(response => response.json())
  .then(products => {
    const catalog = document.getElementById('catalog');

    products.forEach(p => {
      if (p.active !== 'yes') return;

      const item = document.createElement('div');
      item.innerHTML = `
        <h3>${p.title}</h3>
        <img src="${p.image_url}" width="200">
        <p>${p.description}</p>

        <label style="font-size:12px;margin-bottom:8px;display:block;">
          Количество
          <input
            type="number"
            min="1"
            value="1"
            style="
              width:100%;
              padding:10px;
              margin-top:4px;
              border-radius:8px;
              border:1px solid #ccc;
              font-size:14px;
            "
            oninput="updateQuantity(this, ${p.id}, '${p.title}')"
          >
        </label>

        <button onclick="selectProduct(${p.id}, '${p.title}')">
          Забронировать
        </button>
      `;
      catalog.appendChild(item);
    });
  });

/* ===== Обновление количества ===== */
function updateQuantity(input, productId, title) {
  const qty = parseInt(input.value, 10);

  if (isNaN(qty) || qty < 1) {
    input.value = 1;
    selectedQuantity = 1;
  } else {
    selectedQuantity = qty;
  }

  selectedProductId = productId;
  selectedProductTitle = title;

  tg.MainButton.setText(
    `Подтвердить бронирование (${selectedQuantity} шт)`
  );
  tg.MainButton.show();
}

/* ===== Нажатие "Забронировать" ===== */
function selectProduct(productId, title) {
  selectedProductId = productId;
  selectedProductTitle = title;

  tg.MainButton.setText(
    `Подтвердить бронирование (${selectedQuantity} шт)`
  );
  tg.MainButton.show();
}

/* ===== Отправка бронирования ===== */
function book(productId) {
  const user = tg.initDataUnsafe.user;

  const data = new URLSearchParams();
  data.append('entry.457040264', productId);          // product_id
  data.append('entry.467357019', user.id);            // user_id
  data.append('entry.1706370580', user.username);     // username
  data.append('entry.1239404864', selectedQuantity); // quantity

  fetch('https://docs.google.com/forms/d/e/1FAIpQLSefsUyWJjpJo_sCW775Fb6Ba0tl8fUbB1DyfDIBRp3RVJY9lA/formResponse', {
    method: 'POST',
    mode: 'no-cors',
    body: data
  });

  tg.showPopup({
    title: 'Готово',
    message: `Бронь отправлена (${selectedQuantity} шт)`,
    buttons: [{ type: 'ok' }]
  });
}

/* ===== MainButton ===== */
tg.MainButton.onClick(() => {
  if (!selectedProductId) return;

  book(selectedProductId);

  tg.MainButton.hide();
  selectedProductId = null;
  selectedProductTitle = '';
  selectedQuantity = 1;
});
