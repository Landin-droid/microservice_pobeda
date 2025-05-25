// Переменные для управления формами
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const welcomeView = document.getElementById("welcome");

// Кнопки переключения форм
const showRegister = document.getElementById("show-register");
const showLogin = document.getElementById("show-login");

// Переменные для профиля
const userNameElement = document.getElementById("user-name");
const userEmailElement = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// Переменные для редактирования профиля
const editProfileBtn = document.getElementById("edit-profile-btn");
const editProfileForm = document.getElementById("edit-profile-form");
const saveProfileBtn = document.getElementById("save-profile-btn");
const editNameInput = document.getElementById("edit-name");
const editEmailInput = document.getElementById("edit-email");

// Кнопка перехода на страницу бронирования
const bookingPageBtn = document.getElementById("booking-page-btn");

// Проверяем LocalStorage на наличие зарегистрированного пользователя
let user = JSON.parse(localStorage.getItem("user")) || {};
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
const payButton = document.getElementById("pay-button");

// Обновление отображения бронирований
function updateBookings() {
    const bookingsList = document.getElementById("bookings-list");
    const totalSumElement = document.getElementById("total-sum");
    
    let totalSum = 0;
    bookingsList.innerHTML = "";

    if (bookings.length === 0) {
        bookingsList.innerHTML = "<li>У вас пока нет бронирований.</li>";
        totalSumElement.textContent = "Итоговая сумма: 0 руб.";
        payButton.classList.add("hidden"); // Скрываем кнопку оплаты
    } else {
        bookings.forEach((booking, index) => {
            const listItem = document.createElement("li");
            listItem.textContent = `${booking.object} 
            (с ${booking.timeFrom} до ${booking.timeTo}, ${booking.date}), Людей: ${booking.people}
            , Цена: ${booking.price} Статус: ${booking.status || "Не оплачено"}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Отменить";
            deleteBtn.classList.add("btn", "btn-delete");
            deleteBtn.addEventListener("click", () => deleteBooking(index));
            listItem.appendChild(deleteBtn);
            bookingsList.appendChild(listItem);

            if (!booking.status || booking.status !== "Оплачено") {
                totalSum += parseInt(booking.price);
            }
            // Обработчик для кнопки "Оплатить"
            payButton.addEventListener("click", () => {
                localStorage.setItem("totalSum", totalSum); // Сохраняем итоговую сумму
                window.location.href = "payment.html"; // Переход на страницу оплаты
            });
        });
        totalSumElement.textContent = `Итоговая сумма: ${totalSum} руб.`;
        if (totalSum > 0) {
            payButton.classList.remove("hidden");
        } else {
            payButton.classList.add("hidden");
        }
        localStorage.setItem("totalSum", totalSum);
    }
}

// Функция удаления бронирования
function deleteBooking(index) {
    bookings.splice(index, 1);
    localStorage.setItem("bookings", JSON.stringify(bookings));
    updateBookings();
}

// Обновление вида
function updateView() {
    if (isAuthenticated) {
        userNameElement.textContent = user.name || "Пользователь";
        userEmailElement.textContent = user.email || "";
        loginForm.classList.add("hidden");
        registerForm.classList.add("hidden");
        welcomeView.classList.remove("hidden");
        updateBookings();
    } else {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        welcomeView.classList.add("hidden");
    }
}

// Переключение на форму регистрации
showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
});

// Переключение на форму входа
showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
});

// Сохранение профиля
function updateProfile(name, email) {
    if (name) user.name = name;
    if (email) user.email = email;
    localStorage.setItem("user", JSON.stringify(user));
    updateView();
}

// Регистрация
document.getElementById("register-btn").addEventListener("click", () => {
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (name && email && password) {
        user = { name, email, password };
        localStorage.setItem("user", JSON.stringify(user));
        alert("Регистрация успешна! Теперь войдите.");
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
    } else {
        alert("Пожалуйста, заполните все поля.");
    }
});

// Вход
document.getElementById("login-btn").addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (email === user.email && password === user.password) {
        isAuthenticated = true;
        localStorage.setItem("isAuthenticated", "true");
        updateView();
    } else {
        alert("Неверный email или пароль.");
    }
});

// Выход
logoutBtn.addEventListener("click", () => {
    isAuthenticated = false;
    localStorage.setItem("isAuthenticated", "false");
    updateView();
});

// Редактирование профиля
editProfileBtn.addEventListener("click", () => {
    editProfileForm.classList.toggle("hidden");
    editNameInput.value = user.name || "";
    editEmailInput.value = user.email || "";
});

// Сохранение изменений профиля
saveProfileBtn.addEventListener("click", () => {
    const newName = editNameInput.value.trim();
    const newEmail = editEmailInput.value.trim();

    if (newName && newEmail) {
        updateProfile(newName, newEmail);
        alert("Профиль обновлен!");
        editProfileForm.classList.add("hidden");
    } else {
        alert("Пожалуйста, заполните оба поля.");
    }
});

// Переход на страницу бронирования
bookingPageBtn.addEventListener("click", () => {
    window.location.href = "book.html";
});

// Инициализация
updateView();