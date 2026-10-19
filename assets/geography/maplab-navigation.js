(function () {
  const quizzes = ['globle','travle','tradle','geogrid'];
  const mode = new URLSearchParams(location.search).get('quiz');
  const isQuiz = quizzes.includes(mode);
  // Each host owns navigation and analytics; the shared frame never tracks independently.
  document.querySelector('.sidebar').style.display = 'none';
  document.querySelectorAll('.tab[data-tab]').forEach(button => {
    if (isQuiz && button.dataset.tab !== mode) button.disabled = true;
    if (!isQuiz && quizzes.includes(button.dataset.tab)) button.disabled = true;
  });
  if (isQuiz) document.querySelector('.tab[data-tab="' + mode + '"]').click();
})();
