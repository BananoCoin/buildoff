window.onLoad = () => {
  showAllProjects();
};

window.submitForm = () => {
  document.getElementById('form').submit();
};

window.showAllProjects = () => {
  document.querySelector('#registerButton').disabled = false;
  document.querySelector('#allProjectsButton').disabled = true; document.querySelector('#allProjects').className = ''; document.querySelector('#register').className = 'display_none';
};

window.showRegister = () => {
  document.querySelector('#registerButton').disabled = true;
  document.querySelector('#allProjectsButton').disabled = false; document.querySelector('#allProjects').className = 'display_none'; document.querySelector('#register').className = '';
};
