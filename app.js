const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let selectedProductId = null;
let selectedProductTitle = '';
let selectedQuantity = 1; // 👈 ПО УМОЛЧАНИЮ 1

/* ===== Загрузка каталога ===== */
fetch('https://opensheet.elk.sh/1_3n83ymNabp9c0BwdGeHLSiVMfa1t8GKxw7qxDSNCvY/products')
  .then(r => r.json())
  .then(products => {
    const catalog = document.getElementById('catalog');

    products.forEach(p => {
      if (p.active !== 'yes') return;

      const hasPrice = p.price && Number(p.price) > 0;

      const item = document.createElement('div');
      item.innerHTML = `
        <h3>${p.title}</h3>
        <img src="${p.image_url}" alt="${p.title}">

        <p class="price">
          ${hasPrice ? p.price + ' ₽' : 'Цена по запросу'}
        </p>

        ${
          hasPrice
            ? `
        <label class="qty-label">
          Количество
          <input
            type="number"
            min="1"
            placeholder="1"
            class="qty-input"
            oninput="updateQuantity(this, ${p.id}, '${p.title}')"
          >
        </label>

        <button onclick="selectProduct(${p.id}, '${p.title}')">
          Забронировать
        </button>
        `
            : ''
        }
      `;
      catalog.appendChild(item);
    });
  });

/* ===== Обновление количества ===== */
function updateQuantity(input, productId, title) {
  const value = input.value.trim();

  selectedProductId = productId;
  selectedProductTitle = title;

  // если поле очищено — считаем 1, но кнопку пока не показываем
  if (value === '') {
    selectedQuantity = 1;
    tg.MainButton.hide();
    return;
  }

  const qty = parseInt(value, 10);

  if (isNaN(qty) || qty < 1) {
    selectedQuantity = 1;
    tg.MainButton.hide();
    return;
  }

  selectedQuantity = qty;

  tg.MainButton.setText(
    `Подтвердить бронирование (${selectedQuantity} шт)`
  );
  tg.MainButton.show();
}

/* ===== Нажатие "Забронировать" ===== */
function selectProduct(productId, title) {
  selectedProductId = productId;
  selectedProductTitle = title;

  // если пользователь не вводил количество — используем 1
  if (!selectedQuantity || selectedQuantity < 1) {
    selectedQuantity = 1;
  }

  tg.MainButton.setText(
    `Подтвердить бронирование (${selectedQuantity} шт)`
  );
  tg.MainButton.show();
}

/* ===== Отправка бронирования ===== */
function book(productId) {
  const user = tg.initDataUnsafe.user;

  const data = new URLSearchParams();
  data.append('entry.457040264', productId);
  data.append('entry.467357019', user.id);
  data.append('entry.1706370580', user.username || '');
  data.append('entry.1239404864', selectedQuantity);

  fetch(
    'https://docs.google.com/forms/d/e/1FAIpQLSefsUyWJjpJo_sCW775Fb6Ba0tl8fUbB1DyfDIBRp3RVJY9lA/formResponse',
    {
      method: 'POST',
      mode: 'no-cors',
      body: data
    }
  );

  tg.showPopup({
    title: 'Готово',
    message: `Бронь отправлена (${selectedQuantity} шт)`,
    buttons: [{ type: 'ok' }]
  });
}

/* ===== MainButton ===== */
tg.MainButton.onClick(() => {
  if (!selectedProductId) return;

  if (!selectedQuantity || selectedQuantity < 1) {
    selectedQuantity = 1;
  }

  book(selectedProductId);

  tg.MainButton.hide();
  selectedProductId = null;
  selectedProductTitle = '';
  selectedQuantity = 1;
});
