import * as yup from 'yup';
import onChange from 'on-change';
import {
  formRender,
  showMessage,
  feedsRender,
  postsRender,
} from './view';

export default () => {
  const state = {
    ui: {
      form: {
        state: 'filling',
        message: null,
      },
      content: {
        feeds: [],
        posts: [],
      },
    },
  };

  const elements = {
    input: document.querySelector('#url-input'),
    feedbackMessage: document.querySelector('.feedback'),
    button: document.querySelector('[type="submit"]'),
    feedsContainer: null,
    postsContainer: null,
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'ui.form.state':
        formRender(value, elements);
        break;
      case 'ui.form.message':
        showMessage(value, elements.feedbackMessage);
        break;
      case 'ui.content.feeds':
        feedsRender(value, elements.feedsContainer);
        break;
      case 'ui.content.posts':
        postsRender(value, elements.postsContainer);
        break;
      default:
        throw new Error(`unknown state path ${path}`);
    }
  });

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const shema = yup.string().url().notOneOf(watchedState.ui.content.feeds);
    const formData = new FormData(e.target);
    const url = formData.get('url').trim();
    shema.validate(url)
      .then((feed) => {
        watchedState.ui.form.state = 'processing';
        return feed;
      })
      .then((feed) => {

      })
      .catch((error) => {
        switch (error.message) {
          case 'this must be a valid URL':
            watchedState.ui.form.message = 'Ссылка должна быть валидным URL';
            break;
          case `this must not be one of the following values: ${url}`:
            watchedState.ui.form.message = 'RSS уже существует';
            break;
          default:
            throw new Error(`unknown validation error ${error.message}`);
        }
        watchedState.ui.form.state = 'failed';
      });
  });
};
