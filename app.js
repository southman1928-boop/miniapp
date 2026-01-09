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
        <button onclick="selectProduct(${p.id}, '${p.title}')">
          Забронировать
        </button>
      `;
      catalog.appendChild(item);
    });
  });

/* ===== Выбор товара + количества ===== */
function selectProduct(productId, title) {
  selectedProductId = productId;
  selectedProductTitle = title;

  const input = prompt(
    `Введите количество для товара:\n${title}`,
    '1'
  );

  // Пользователь нажал "Отмена"
  if (input === null) {
    return;
  }

  // Пусто = 1
  const qty = input.trim() === '' ? 1 : parseInt(input, 10);

  // Некорректный ввод
  if (isNaN(qty) || qty < 1) {
    tg.showPopup({
      title: 'Ошибка',
      message: 'Введите корректное количество (1 или больше)',
      buttons: [{ type: 'ok' }]
    });
    return;
  }

  selectedQuantity = qty;

  tg.MainButton.setText(
    `Подтвердить бронирование (${selectedQuantity} шт)`
  );
  tg.MainButton.show();
}


/* ===== Popup выбора количества ===== */
function showQuantityPopup() {
  tg.showPopup({
    title: selectedProductTitle,
    message: `Количество: ${selectedQuantity}`,
    buttons: [
      { id: 'minus', type: 'default', text: '−' },
      { id: 'plus', type: 'default', text: '+' },
      { type: 'ok', text: 'Готово' }
    ]
  }, (btn) => {
    if (btn === 'plus') {
      selectedQuantity++;
    }

    if (btn === 'minus' && selectedQuantity > 1) {
      selectedQuantity--;
    }

    updateMainButton();

    if (btn !== 'ok') {
      showQuantityPopup();
    }
  });
}

/* ===== Обновление MainButton ===== */
function updateMainButton() {
  tg.MainButton.setText(
    `Подтвердить бронирование (${selectedQuantity} шт)`
  );
  tg.MainButton.show();
}

/* ===== Отправка бронирования ===== */
function book(productId) {
  const user = tg.initDataUnsafe.user;

  const data = new URLSearchParams();
  data.append('entry.457040264', productId);        // product_id
  data.append('entry.467357019', user.id);          // user_id
  data.append('entry.1706370580', user.username);   // username
  data.append('entry.1239404864', selectedQuantity); // quantity ← ЗАМЕНИ entry

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

/* ===== Подтверждение через MainButton ===== */
tg.MainButton.onClick(() => {
  if (!selectedProductId) return;

  book(selectedProductId);

  tg.MainButton.hide();
  selectedProductId = null;
  selectedProductTitle = '';
  selectedQuantity = 1;
});
