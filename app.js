const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let selectedProductId = null;
let selectedProductTitle = '';

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

/* ===== Выбор товара ===== */
function selectProduct(productId, title) {
  selectedProductId = productId;
  selectedProductTitle = title;

  tg.MainButton.setText('Подтвердить бронирование');
  tg.MainButton.show();

  tg.showPopup({
    title: 'Выбран товар',
    message: title,
    buttons: [{ type: 'ok' }]
  });
}

/* ===== Отправка бронирования ===== */
function book(productId) {
  const user = tg.initDataUnsafe.user;

  const data = new URLSearchParams();
  data.append('entry.457040264', productId);        // product_id
  data.append('entry.467357019', user.id);          // user_id
  data.append('entry.1706370580', user.username);   // username

  // Google Form
  fetch('https://docs.google.com/forms/d/e/1FAIpQLSefsUyWJjpJo_sCW775Fb6Ba0tl8fUbB1DyfDIBRp3RVJY9lA/formResponse', {
    method: 'POST',
    mode: 'no-cors',
    body: data
  });

  // 🔔 УВЕДОМЛЕНИЕ АДМИНУ (КЛЮЧЕВАЯ СТРОКА)
  notifyAdmin(selectedProductTitle, user);

  tg.showPopup({
    title: 'Готово',
    message: 'Бронь отправлена',
    buttons: [{ type: 'ok' }]
  });
}

/* ===== Уведомление админу ===== */
function notifyAdmin(productTitle, user) {
  const text =
    '📦 Новая бронь\n' +
    'Товар: ' + productTitle + '\n' +
    'Пользователь: @' + (user.username || 'без username') + '\n' +
    'ID: ' + user.id;

  fetch('https://api.telegram.org/bot8244786429:AAEeSIu8W-z0HoeTAN09e-R3QBSAQWDDp5E/sendMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: 400820942,
      text: text
    })
  });
}

/* ===== Подтверждение через MainButton ===== */
tg.MainButton.onClick(() => {
  if (!selectedProductId) return;

  book(selectedProductId);

  tg.MainButton.hide();
  selectedProductId = null;
  selectedProductTitle = '';
});
