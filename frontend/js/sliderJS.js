const slides = document.querySelector('.slides');
const slide = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentIndex = 0;
const totalSlides = slide.length;

function updateSliderPosition() {
  slides.style.transform = `translateX(-${currentIndex * 100}%)`;
  updateActiveClass();
}

function updateActiveClass() {
  slide.forEach((s, index) => {
    if (index === currentIndex) {
      s.classList.add('activeSlide');
    } else {
      s.classList.remove('activeSlide');
    }
  });
}

nextBtn.addEventListener('click', () => {
  if (currentIndex < totalSlides - 1) {
    currentIndex++;
  } else {
    currentIndex = 0;
  }
  updateSliderPosition();
});

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
  } else {
    currentIndex = totalSlides - 1;
  }
  updateSliderPosition();
});
updateActiveClass()