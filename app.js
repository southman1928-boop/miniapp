const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let selectedProductId = null;
let selectedProductTitle = '';
let selectedQuantity = 1;

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
            value="1"
            class="qty-input"
          >
        </label>

        <button class="book-btn">
          Забронировать
        </button>
        `
            : ''
        }
      `;

      /* ===== ЛОГИКА КНОПКИ ===== */
      if (hasPrice) {
        const input = item.querySelector('.qty-input');
        const button = item.querySelector('.book-btn');

        button.addEventListener('click', () => {
          const qty = parseInt(input.value, 10);

          selectedProductId = p.id;
          selectedProductTitle = p.title;
          selectedQuantity = !qty || qty < 1 ? 1 : qty;

          tg.MainButton.setText(
            `Подтвердить бронирование (${selectedQuantity} шт)`
          );
          tg.MainButton.show();
        });
      }

      catalog.appendChild(item);
    });
  });

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

  book(selectedProductId);

  tg.MainButton.hide();
  selectedProductId = null;
  selectedProductTitle = '';
  selectedQuantity = 1;
});
