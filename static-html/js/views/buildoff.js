window.onLoad = () => {
  document.getElementById('stars1').style.boxShadow = getBoxShadow(8*4*2);
  document.getElementById('stars2').style.boxShadow = getBoxShadow(8*4);
  document.getElementById('stars3').style.boxShadow = getBoxShadow(8);

  if (window.localStorage.show == 'showAllProjects') {
    showAllProjects();
  } else {
    showRegister();
  }
};

window.submitForm = () => {
  alert('thank you for yor submission. you are now redirected to the project list.');
  window.localStorage.show = 'showAllProjects';
  document.getElementById('form').submit();
};

window.showAllProjects = () => {
  document.querySelector('#registerButton').disabled = false;
  document.querySelector('#allProjectsButton').disabled = true; document.querySelector('#allProjects').className = ''; document.querySelector('#register').className = 'display_none';
};

window.showRegister = () => {
  delete window.localStorage.show;
  document.querySelector('#registerButton').disabled = true;
  document.querySelector('#allProjectsButton').disabled = false; document.querySelector('#allProjects').className = 'display_none'; document.querySelector('#register').className = '';
};

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

const getBoxShadow = (count) => {
  let boxShadow = '';
  for (let i = 0; i < count; i++) {
    const x = getRandomInt(0, 95);
    const y = getRandomInt(0, 100);
    if (i > 0) {
      boxShadow += ',';
    }
    boxShadow += `${x}vw ${y}vh #FFF`;
    boxShadow += ',';
    boxShadow += `${x}vw ${y-95}vh #FFF`;
  }
  return boxShadow;
};
