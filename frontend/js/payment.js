document.addEventListener("DOMContentLoaded", () => {
    const payableSum = localStorage.getItem("totalSum") || 0;
    const payableSumElement = document.getElementById("payable-sum");
    const paymentForm = document.getElementById("payment-form");
    const paymentNotification = document.getElementById("payment-notification");

    const cardNumberInput = document.getElementById("card-number");
    const cardNameInput = document.getElementById("card-holder");
    const cardExpiryInput = document.getElementById("expiry-date");
    const cardCvvInput = document.getElementById("cvv");

    // Показ итоговой суммы
    payableSumElement.textContent = `К оплате: ${payableSum} руб.`;

    // Номер карты: только числа и разделение по 4 цифры
    cardNumberInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, ""); // Удаляем все нецифровые символы
        value = value.match(/.{1,4}/g)?.join(" ") || ""; // Разбиваем на блоки по 4
        e.target.value = value;
    });

    // Имя владельца карты: только латинские буквы и пробелы
    cardNameInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, ""); // Разрешаем только латинские буквы и пробел
    });

    // Срок действия: MM/YY, автоматическое добавление "/"
    cardExpiryInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, ""); // Удаляем нецифровые символы
        if (value.length > 2) {
            value = value.slice(0, 2) + "/" + value.slice(2, 4);
        }
        e.target.value = value;
    });

    // CVV: только числа, максимум 3 цифры
    cardCvvInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
    });

    // Обработчик отправки формы оплаты
    paymentForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const cardNumber = cardNumberInput.value;
        const cardName = cardNameInput.value;
        const cardExpiry = cardExpiryInput.value;
        const cardCvv = cardCvvInput.value;

        if (
            cardNumber.length === 19 &&
            cardName.trim() !== "" &&
            cardExpiry.length === 5 &&
            cardCvv.length === 3
        ) {
        // Имитация успешной оплаты
        paymentNotification.classList.remove("hidden");

        // Удаляем только итоговую сумму из localStorage
        localStorage.removeItem("totalSum");
        
        // Устанавливаем статус бронирования как "оплачено"
        setTimeout(() => {
            markBookingsAsPaid();
            window.location.href = "profile.html"; // Возвращаемся в личный кабинет
        }, 3000);
    }
    });

    function markBookingsAsPaid() {
        let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

        bookings = bookings.map(booking => ({
            ...booking,
            status: "Оплачено"
        }));

        localStorage.setItem("bookings", JSON.stringify(bookings));
    }
});