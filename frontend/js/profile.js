const API_URL = {
    auth: 'https://auth-service-g23m.onrender.com',
    booking: 'https://booking-service-g1ea.onrender.com',
    admin: 'https://booking-admin-service.onrender.com'
};

let itemsCache = { houses: {}, gazebos: {} };

document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
});

document.getElementById('edit-profile-btn').addEventListener('click', () => {
    document.getElementById('edit-profile-form').classList.toggle('hidden');
});

function resetItemForm() {
    document.getElementById('item-form-title').textContent = 'Добавить объект';
    document.getElementById('item-type').value = 'house';
    document.getElementById('item-type').disabled = false;
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-people-amount').value = '';
    document.getElementById('item-images').value = '';
    document.getElementById('house-water-supply').checked = false;
    document.getElementById('house-electricity').checked = false;
    document.getElementById('house-bathroom').checked = false;
    document.getElementById('house-fridge').checked = false;
    document.getElementById('house-teapot').checked = false;
    document.getElementById('house-microwave-oven').checked = false;
    document.getElementById('gazebo-electricity').checked = false;
    document.getElementById('gazebo-grill').checked = false;
    document.getElementById('save-item-btn').classList.remove('hidden');
    document.getElementById('update-item-btn').classList.add('hidden');
    document.getElementById('add-item-message').textContent = '';
    toggleItemFields();
}

function toggleItemFields() {
    const type = document.getElementById('item-type').value;
    document.getElementById('house-fields').classList.toggle('hidden', type !== 'house');
    document.getElementById('gazebo-fields').classList.toggle('hidden', type !== 'gazebo');
}

document.getElementById('add-item-btn').addEventListener('click', () => {
    resetItemForm();
    document.getElementById('add-item-form').classList.remove('hidden');
});

document.addEventListener('DOMContentLoaded', async () => {
    const token = Cookies.get('jwt_token');
    if (token) {
        try {
            const user = await getUserProfile(token);
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('welcome').classList.remove('hidden');
            document.getElementById('user-name').textContent = `${user.name} ${user.surname}`;
            document.getElementById('user-email').textContent = user.email;
            if (user.role === 'admin') {
                document.getElementById('admin-section').classList.remove('hidden');
                await loadItemsCache();
                fetchAllBookings();
                fetchAllItems();
            }
            await loadItemsCache();
            fetchBookings();
        } catch (error) {
            console.error('Invalid token:', error);
        }
    }
});

async function loadItemsCache() {
    try {
        const [housesResponse, gazebosResponse] = await Promise.all([
            fetch(`${API_URL.admin}/houses`),
            fetch(`${API_URL.admin}/gazebos`)
        ]);
        const houses = await housesResponse.json();
        const gazebos = await gazebosResponse.json();
        if (!housesResponse.ok || !gazebosResponse.ok) throw new Error('Ошибка загрузки данных');
        houses.forEach(house => itemsCache.houses[house.id] = house);
        gazebos.forEach(gazebo => itemsCache.gazebos[gazebo.id] = gazebo);
    } catch (error) {
        console.error('Error loading items cache:', error);
    }
}

async function getUserProfile(token) {
    const response = await fetch(`${API_URL.auth}/profile`, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Ошибка получения профиля');
    return await response.json();
}

document.getElementById('register-btn').addEventListener('click', async () => {
    const name = document.getElementById('register-name').value;
    const surname = document.getElementById('register-surname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const messageEl = document.getElementById('register-message');

    try {
        const response = await fetch(`${API_URL.auth}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, surname, email, phone, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка регистрации');
        messageEl.textContent = 'Регистрация успешна! Теперь войдите.';
        messageEl.className = 'success';
        document.getElementById('register-name').value = '';
        document.getElementById('register-surname').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-phone').value = '';
        document.getElementById('register-password').value = '';
        setTimeout(() => {
            messageEl.textContent = '';
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        }, 2000);
    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.className = 'error';
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('login-message');

    try {
        const response = await fetch(`${API_URL.auth}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка входа');

        Cookies.set('jwt_token', data.token, { expires: 7, secure: true, sameSite: 'Strict' });
        const user = await getUserProfile(data.token);
        messageEl.textContent = 'Вход успешен!';
        messageEl.className = 'success';
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('welcome').classList.remove('hidden');
        document.getElementById('user-name').textContent = `${user.name} ${user.surname}`;
        document.getElementById('user-email').textContent = user.email;
        
        if (user.role === 'admin') {
            document.getElementById('admin-section').classList.remove('hidden');
        }
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        fetchBookings();
    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.className = 'error';
    }
});

document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const name = document.getElementById('edit-name').value;
    const surname = document.getElementById('edit-surname').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    const messageEl = document.getElementById('edit-message');
    const token = Cookies.get('jwt_token');

    try {
        const response = await fetch(`${API_URL.auth}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, surname, email, phone })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка обновления профиля');

        messageEl.textContent = 'Профиль обновлён!';
        messageEl.className = 'success';
        document.getElementById('user-name').textContent = `${name} ${surname}`;
        document.getElementById('user-email').textContent = email;
        document.getElementById('edit-profile-form').classList.add('hidden');
        setTimeout(() => (messageEl.textContent = ''), 2000);
    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.className = 'error';
    }
});

async function fetchBookings() {
    const token = Cookies.get('jwt_token');
    if (!token) {
        alert('Пожалуйста, войдите в систему');
        logout();
        return;
    }

    try {
        const response = await fetch(`${API_URL.booking}/bookings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const bookings = await response.json();

        if (!response.ok) throw new Error(bookings.error || 'Ошибка получения бронирований');

        displayBookings(bookings);
    } catch (error) {
        alert('Ошибка: ' + error.message);
        logout();
    }
}

function displayBookings(bookings) {
    const list = document.getElementById('bookings-list');
    const totalSumEl = document.getElementById('total-sum');
    list.innerHTML = '';
    let totalSum = 0;

    for (const booking of bookings) {
        const itemId = booking.type === 'house' ? booking.house_id : booking.gazebo_id;
        const item = itemsCache[booking.type + 's'][itemId] || { name: 'Неизвестно', price: 0 };
        const price = Number(item.price) || 0;
        if (booking.status !== 'cancelled') totalSum += price;

        const li = document.createElement('li');
        li.className = 'booking-item';
        li.innerHTML = `
        <div class="booking-info">
            <div class="booking-name">${booking.type === 'house' ? 'Домик' : 'Беседка'}: ${item.name}</div>
            <div class="booking-price">Цена: ${price} руб.</div>
            <div class="booking-date">Дата: ${booking.booking_date.substring(0, 10)}</div>
            <div class="booking-status">Статус: ${
            booking.status === 'pending' ? 'Ожидает' : booking.status === 'confirmed' ? 'Подтверждено' : 'Отменено'}
            </div>
        </div>
        ${booking.status !== 'cancelled' ? `<button class="btn btn-danger" onclick="cancelBooking(${booking.id})">Отменить</button>` : ''}
        `;
        list.appendChild(li);
    }

    totalSumEl.textContent = `Итоговая сумма: ${totalSum} руб.`;
    document.getElementById('pay-button').classList.toggle('hidden', totalSum === 0 || bookings.every(b => b.status === 'cancelled'));
}

async function cancelBooking(bookingId) {
    const token = Cookies.get('jwt_token');
    if (!token) {
        alert('Пожалуйста, войдите в систему');
        logout();
        return;
    }

    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;

    try {
        const response = await fetch(`${API_URL.booking}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка отмены');

        alert('Бронирование отменено');
        fetchBookings();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function fetchAllBookings() {
    const token = Cookies.get('jwt_token');
    try {
        const response = await fetch(`${API_URL.booking}/bookings/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const bookings = await response.json();

        console.log(bookings);
        if (!response.ok) throw new Error(bookings.error || 'Ошибка получения бронирований');

        displayAllBookings(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        document.getElementById('all-bookings-tbody').innerHTML = '<tr><td colspan="7">Ошибка загрузки</td></tr>';
    }
}

function displayAllBookings(bookings) {
    const tableBody = document.getElementById('all-bookings-tbody');
    tableBody.innerHTML = '';

    for (const booking of bookings) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.email}</td>
            <td>${booking.type === 'house' ? 'Домик' : 'Беседка'}: ${booking.item_name}</td>
            <td>${booking.booking_date.split("T")[0]}</td>
            <td>
                <select onchange="updateBookingStatus(${booking.id}, this.value)">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Ожидает</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Подтверждено</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Отменено</option>
                </select>
            </td>
            <td>${booking.item_price} руб.</td>
            <td>${booking.people_amount}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteBooking(${booking.id})">Удалить</button>
            </td>
        `;
        tableBody.appendChild(tr);
    }
}

async function updateBookingStatus(bookingId, status) {
    const token = Cookies.get('jwt_token');
    try {
        const response = await fetch(`${API_URL.booking}/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка обновления статуса');

        alert('Статус обновлён');
        fetchAllBookings();
    } catch (error) {
        alert('Ошибка: ' + error.message);
        fetchAllBookings();
    }
}

async function deleteBooking(bookingId) {
    if (!confirm('Вы уверены, что хотите удалить бронирование?')) return;
    const token = Cookies.get('jwt_token');
    try {
        const response = await fetch(`${API_URL.booking}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка удаления');

        alert('Бронирование удалено');
        fetchAllBookings();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function fetchAllItems() {
    try {
        const [housesResponse, gazebosResponse] = await Promise.all([
            fetch(`${API_URL.admin}/houses`),
            fetch(`${API_URL.admin}/gazebos`)
        ]);

        const houses = await housesResponse.json();
        const gazebos = await gazebosResponse.json();

        if (!housesResponse.ok || !gazebosResponse.ok) throw new Error('Ошибка загрузки объектов');

        displayItems([...houses.map(h => ({ ...h, type: 'house' })), ...gazebos.map(g => ({ ...g, type: 'gazebo' }))]);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

function displayItems(items) {
    const list = document.getElementById('items-list');
    list.innerHTML = '';

    for (const item of items) {
        const amenities = item.type === 'house'
        ? `Вода: ${item.water_supply ? 'Да' : 'Нет'},
        Электричество: ${item.electricity ? 'Да' : 'Нет'}, 
        Ванная: ${item.bathroom ? 'Да' : 'Нет'},
        Холодильник: ${item.fridge ? 'Да' : 'Нет'},
        Чайник: ${item.teapot ? 'Да' : 'Нет'},
        Микроволновка: ${item.microwave_oven ? 'Да' : 'Нет'}`

        : `Электричество: ${item.electricity ? 'Да' : 'Нет'}, Гриль: ${item.grill ? 'Да' : 'Нет'}`;

        const li = document.createElement('li');
        li.className = 'item';
        li.innerHTML = `
            <span>${item.type === 'house' ? 'Домик' : 'Беседка'}: ${item.name}, Цена: ${item.price} руб., Человек: ${item.people_amount}, ${amenities}</span>
            <button class="btn btn-warning" onclick='editItem("${item.type}", ${item.id}, ${JSON.stringify(item)})'>Редактировать</button>
            <button class="btn btn-danger" onclick="deleteItem('${item.type}', ${item.id})">Удалить</button>
        `;
        list.appendChild(li);
    }
}

async function saveItem() {
    const type = document.getElementById('item-type').value;
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    const people_amount = document.getElementById('item-people-amount').value;
    let images;
    const messageEl = document.getElementById('add-item-message');

    try {
        images = JSON.parse(document.getElementById('item-images').value || '[]');

        if (!Array.isArray(images) || images.some(img => typeof img !== 'string' || img.trim() === '')) {
            throw new Error('Поле изображения должен быть массивом непустых строк');
        }
    } catch (e) {
        messageEl.textContent = 'Некорректный JSON в поле изображений';
        messageEl.className = 'error';
        return;
    }

    const body = { name, price: parseFloat(price), people_amount: parseInt(people_amount), images };
    if (type === 'house') {
        body.water_supply = document.getElementById('house-water-supply').checked;
        body.electricity = document.getElementById('house-electricity').checked;
        body.bathroom = document.getElementById('house-bathroom').checked;
        body.fridge = document.getElementById('house-fridge').checked;
        body.teapot = document.getElementById('house-teapot').checked;
        body.microwave_oven = document.getElementById('house-microwave-oven').checked;
    } else {
        body.electricity = document.getElementById('gazebo-electricity').checked;
        body.grill = document.getElementById('gazebo-grill').checked;
    }

    if (!body.name || isNaN(body.price) || isNaN(body.people_amount)) {
        messageEl.textContent = 'Заполните все обязательные поля (название, цена, количество человек)';
        messageEl.className = 'error';
        return;
    }

    const token = Cookies.get('jwt_token');
    try {
        const response = await fetch(`${API_URL.admin}/${type}s`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка создания объекта');

        messageEl.textContent = 'Объект создан!';
        messageEl.className = 'success';
        document.getElementById('add-item-form').classList.add('hidden');
        resetItemForm();
        await loadItemsCache();
        fetchAllItems();
    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.className = 'error';
    }
}

async function updateItem(type, id) {
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    const people_amount = document.getElementById('item-people-amount').value;
    const imagesInput = document.getElementById('item-images').value.trim();
    let images;
    const messageEl = document.getElementById('add-item-message');

    try {
        images = imagesInput ? JSON.parse(imagesInput) : [];
        console.log(images);

        if (!Array.isArray(images) || images.some(img => typeof img !== 'string' || img.trim() === '')) {
            throw new Error('Поле изображения должен быть массивом непустых строк');
        }
    } catch (e) {
        messageEl.textContent = 'Ошибка: некорректный JSON в поле изображений. Пример: ["image1.jpg", "image2.jpg"]';
        messageEl.className = 'error';
        return;
    }

    const body = {
        name,
        price: parseFloat(price),
        people_amount: parseInt(people_amount),
        images
    };

    if (type === 'house') {
        body.water_supply = document.getElementById('house-water-supply').checked;
        body.electricity = document.getElementById('house-electricity').checked;
        body.bathroom = document.getElementById('house-bathroom').checked;
        body.fridge = document.getElementById('house-fridge').checked;
        body.teapot = document.getElementById('house-teapot').checked;
        body.microwave_oven = document.getElementById('house-microwave-oven').checked;
    } else {
        body.electricity = document.getElementById('gazebo-electricity').checked;
        body.grill = document.getElementById('gazebo-grill').checked;
    }

    if (!body.name || isNaN(body.price) || isNaN(body.people_amount)) {
        messageEl.textContent = 'Заполните все обязательные поля (название, цена, количество человек)';
        messageEl.className = 'error';
        return;
    }

    const token = Cookies.get('jwt_token');
    console.log(JSON.stringify(body));
    try {
        const response = await fetch(`${API_URL.admin}/${type}s/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка обновления объекта');

        messageEl.textContent = 'Объект обновлён!';
        messageEl.className = 'success';
        document.getElementById('add-item-form').classList.add('hidden');
        resetItemForm();
        await loadItemsCache();
        fetchAllItems();
    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.className = 'error';
    }
}

document.getElementById('save-item-btn').addEventListener('click', saveItem);

function editItem(type, id, item) {
    document.getElementById('add-item-form').classList.remove('hidden');
    document.getElementById('item-form-title').textContent = 'Редактировать объект';
    document.getElementById('item-type').value = type;
    document.getElementById('item-type').disabled = true;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-people-amount').value = item.people_amount;
    document.getElementById('item-images').value = JSON.stringify(item.images || [], null, 2);

    if (type === 'house') {
        document.getElementById('house-water-supply').checked = item.water_supply;
        document.getElementById('house-electricity').checked = item.electricity;
        document.getElementById('house-bathroom').checked = item.bathroom;
        document.getElementById('house-fridge').checked = item.fridge;
        document.getElementById('house-teapot').checked = item.teapot;
        document.getElementById('house-microwave-oven').checked = item.microwave_oven;
    } else {
        document.getElementById('gazebo-electricity').checked = item.electricity;
        document.getElementById('gazebo-grill').checked = item.grill;
    }

    document.getElementById('save-item-btn').classList.add('hidden');
    document.getElementById('update-item-btn').classList.remove('hidden');
    toggleItemFields();
    document.getElementById('update-item-btn').onclick = () => updateItem(type, id);
}

async function deleteItem(type, id) {
    if (!confirm('Вы уверены, что хотите удалить объект?')) return;
    const token = Cookies.get('jwt_token');

    try {
        const response = await fetch(`${API_URL.admin}/${type}s/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Ошибка удаления объекта');

        alert('Объект удалён');
        await loadItemsCache();
        fetchAllItems();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
});

function logout() {
    Cookies.remove('jwt_token');
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('bookings-list').innerHTML = '';
    document.getElementById('total-sum').textContent = 'Итоговая сумма: 0 руб.';
    document.getElementById('pay-button').classList.add('hidden');
}

document.getElementById('booking-page-btn').addEventListener('click', () => {
    window.location.href = '../pages/book.html';
});

document.getElementById('edit-profile-btn').addEventListener('click', async () => {
    const token = Cookies.get('jwt_token');
    try {
        const user = await getUserProfile(token);
        document.getElementById('edit-name').value = user.name;
        document.getElementById('edit-surname').value = user.surname;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-phone').value = user.phone;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
});