const formRender = (state, { input, button, feedbackMessage }) => {
  switch (state) {
    case 'filling':
      input.removeAttribute('readonly');
      button.disabled = false;
      break;
    case 'processing':
      input.classList.remove('is-invalid');
      input.setAttribute('readonly', 'true');
      button.disabled = true;
      feedbackMessage.textContent = '';
      feedbackMessage.classList.remove('text-danger');
      break;
    case 'processed':
      feedbackMessage.classList.add('text-success');
      break;
    case 'failed':
      input.removeAttribute('readonly');
      button.disabled = false;
      input.classList.add('is-invalid');
      feedbackMessage.classList.add('text-danger');
      break;
    default:
      throw new Error(`unknown input state ${state}`);
  }
};
const showMessage = (value, messageElement) => {
  messageElement.textContent = value;
};
const feedsRender = () => {

};
const postsRender = () => {

};
export {
  formRender,
  showMessage,
  feedsRender,
  postsRender,
};
