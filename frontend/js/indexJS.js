$(document).ready(function(){
    $('.header__burger').click(function(event) {
        $('.header__burger, .header__menu').toggleClass('active');
        $('body').toggleClass('lock');
    });
});

document.addEventListener('touchstart', function(event) {
    if(event.target.matches('.slick-element')) {
        event.target.classList.add('feeling-touchy');
    }
});

document.addEventListener('touchend', function(event) {
    if(event.target.matches('.slick-element')) {
        event.target.classList.remove('feeling-touchy');
    }
});

/*Стрелки на слайдере */
document.addEventListener('touchstart', function(event) {
    if(event.target.matches('.control')) {
        event.target.classList.add('feeling-touchy');
    }
});
document.addEventListener('touchend', function(event) {
    if(event.target.matches('.control')) {
        event.target.classList.remove('feeling-touchy');
    }
});

/*Для переключателей */
function showImage(imageId) {
    // Скрыть все изображения
    const images = document.querySelectorAll('.entertainment__images img');
    images.forEach(img => {
        img.style.display = "none";
    });
  
    // Показать выбранное изображение
    const selectedImage = document.getElementById(imageId.replace('image', 'img'));
    if (selectedImage) {
        selectedImage.style.display = "block";
    }
}