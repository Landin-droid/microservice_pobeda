document.addEventListener("DOMContentLoaded", () => {
    fetchHouses();
    fetchGazebos();
});

const API_URL = {
    auth: process.env.AUTH_SERVICE_URL || 'https://auth-service-g23m.onrender.com',
    booking: process.env.BOOKING_SERVICE_URL || 'https://booking-service-g1ea.onrender.com',
    admin: process.env.ADMIN_SERVICE_URL || 'https://booking-admin-service.onrender.com'
};

async function fetchHouses() {
  try {
    const response = await fetch(`${API_URL.admin}/houses`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const houses = await response.json();
    displayHouses(houses);
  } catch (error) {
    console.error('Error fetching houses:', error.message);
  }
}

async function fetchGazebos() {
  try {
    const response = await fetch(`${API_URL.admin}/gazebos`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const gazebos = await response.json();
    displayGazebos(gazebos);
  } catch (error) {
    console.error('Error fetching gazebos:', error.message);
  }
}

function displayHouses(houses) {
    const container = document.querySelector('.houses-container');
    if (!container) return;
    container.innerHTML = '';

    houses.forEach((house, index) => {
        const images = house.images || [];
        const card = document.createElement('div');
        card.className = 'house-card';
        card.innerHTML = `
            <div class="card-info">
                <div class="card-title"><h1>${house.name}</h1></div>
                <hr>
                <div class="house-info">
                    <div class="text-about">
                        <ul class="chars1">
                            <li class="facility facility-price" id="price-item-h${house.id}">${house.price} ₽</li>
                            <li class="facility facility-people" id="people-h${house.id}">до ${house.people_amount}</li>
                            <li class="facility">${house.water_supply ? 'Подключена' : 'Не подключена'}</li>
                            <li class="facility">${house.electricity ? 'Подключен' : 'Не подключен'}</li>
                        </ul>
                        <ul class="chars2">
                            <li class="facility">${house.bathroom ? 'Есть' : 'Нет'}</li>
                            <li class="facility fridge">${house.fridge ? 'Есть' : 'Нет'}</li>
                            <li class="facility teapot">${house.teapot ? 'Есть' : 'Нет'}</li>
                            <li class="facility microwave">${house.microwave_oven ? 'Есть' : 'Нет'}</li>
                        </ul>
                    </div>
                </div>
                <div class="btn-container">
                    <button class="btn-book" data-object="${house.name}" 
                    data-price="${house.price}" data-max-people="${house.people_amount}" 
                    data-id="${house.id}" 
                    onclick='openBookingModal("${house.id}", "house", "${house.name}", "${house.people_amount}", "${house.price}", "${house.images[0]}")'>Забронировать</button>
                </div>
            </div>
            <div class="carousel-container">
                <div id="carouselExampleIndicators${house.id}" class="carousel slide">
                    <div class="carousel-indicators">
                        ${images.map((_, i) => `
                            <button type="button" data-bs-target="#carouselExampleIndicators${house.id}" data-bs-slide-to="${i}" ${i === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${i + 1}"></button>
                        `).join('')}
                    </div>
                    <div class="carousel-inner">
                        ${images.map((img, i) => `
                            <div class="carousel-item ${i === 0 ? 'active' : ''}">
                            <img src="${img}" class="d-block w-100" alt="Фото ${house.name}">
                            </div>
                        `).join('')}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators${house.id}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators${house.id}" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Next</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function displayGazebos(gazebos) {
  const container = document.querySelector('.gazebos-container');
  if (!container) {
    console.error('Gazebo container not found');
    return;
  }
  container.innerHTML = '';

  gazebos.forEach((gazebo, index) => {
    const images = gazebo.images || [];
    const card = document.createElement('div');
    card.className = 'house-card';
    card.innerHTML = `
      <div class="card-info">
        <div class="card-title"><h1>${gazebo.name}</h1></div>
        <hr>
        <div class="house-info">
          <div class="text-about">
            <p>При бронировании беседки уточняйте, нужны ли вам решетки и уголь!</p>
            <ul class="charsPav">
              <li class="facility facility-price" id="price-item-g${gazebo.id}">${gazebo.price} ₽</li>
              <li class="facility facility-people" id="people-g${gazebo.id}">до ${gazebo.people_amount}</li>
              <li class="facility">${gazebo.electricity ? 'Есть' : 'Нет'}</li>
              <li class="facility">${gazebo.grill ? 'Есть' : 'Нет'}</li>
            </ul>
          </div>
        </div>
        <div class="btn-container">
            <button class="btn-book" data-object="${gazebo.name}" 
            data-price="${gazebo.price}" data-max-people="${gazebo.people_amount}" 
            data-id="${gazebo.id}"
            onclick='openBookingModal("${gazebo.id}", "gazebo", "${gazebo.name}", "${gazebo.people_amount}", "${gazebo.price}", "${gazebo.images[0]}")'>Забронировать</button>
        </div>
      </div>
      <div class="carousel-container">
        <div id="carouselExampleIndicatorsG${gazebo.id}" class="carousel slide">
          <div class="carousel-indicators">
            ${images.map((_, i) => `
              <button type="button" data-bs-target="#carouselExampleIndicatorsG${gazebo.id}" data-bs-slide-to="${i}" ${i === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${i + 1}"></button>
            `).join('')}
          </div>
          <div class="carousel-inner">
            ${images.map((img, i) => `
              <div class="carousel-item ${i === 0 ? 'active' : ''}">
                <img src="${img}" class="d-block w-100" alt="Беседка ${gazebo.name}">
              </div>
            `).join('')}
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicatorsG${gazebo.id}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicatorsG${gazebo.id}" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function hashPassword() {
    const bcrypt = dcodeIO.bcrypt;
    bcrypt.hash('admin123', 10).then(hash => console.log(hash));
}

const today = new Date().toISOString().split('T')[0];
document.getElementById('booking-date').setAttribute('min', today);

// Открытие модального окна
let currentItem = {};
async function openBookingModal(id, type, name, people_amount, price, image_url) {
    const token = Cookies.get('jwt_token');
    if (!token) {
        alert('Пожалуйста, войдите в систему');
        window.location.href = '/pages/profile.html';
        return;
    }

    currentItem = { id, type, name, people_amount, price, image_url };
    document.getElementById('modal-people_amount').textContent = `До ${people_amount} человек`;
    document.getElementById('modal-name').textContent = name;
    document.getElementById('modal-price').textContent = `Цена: ${price} руб.`;
    document.getElementById('modal-image').src = image_url;
    document.getElementById('modal-error').textContent = '';

    // Загрузка занятых дат
    try {
        const response = await fetch(`${API_URL.booking}/bookings/dates?type=${type}&item_id=${id}`);
        const bookedDates = await response.json();
        if (!response.ok) throw new Error('Ошибка получения дат');
        const dateInput = document.getElementById('booking-date');
        dateInput.value = '';
        dateInput.onchange = () => {
        if (bookedDates.includes(dateInput.value)) {
            dateInput.setCustomValidity('Эта дата уже забронирована');
            document.getElementById('modal-error').textContent = 'Эта дата уже забронирована';
        } else {
            dateInput.setCustomValidity('');
            document.getElementById('modal-error').textContent = '';
        }
        };
    } catch (error) {
        document.getElementById('modal-error').textContent = error.message;
    }

    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

// Подтверждение бронирования
document.getElementById('confirm-booking').addEventListener('click', async () => {
    const bookingDate = document.getElementById('booking-date').value;
    const modalError = document.getElementById('modal-error');
    const token = Cookies.get('jwt_token');

    if (!bookingDate) {
        modalError.textContent = 'Выберите дату';
        return;
    }

    try {
        const response = await fetch(`${API_URL.booking}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            type: currentItem.type,
            item_id: currentItem.id,
            booking_date: bookingDate
        })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка бронирования');
        modalError.textContent = 'Бронирование успешно!';
        modalError.className = 'success';
        setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        }, 1000);
    } catch (error) {
        modalError.textContent = error.message;
        modalError.className = 'error';
    }
});