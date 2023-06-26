import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import resources from './locales/index';
import {
  formRender,
  showMessage,
  feedsRender,
  postsRender,
} from './view';

export default () => {
  const defaultLanguage = 'ru';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  yup.setLocale({
    mixed: {
      notOneOf: 'existingRSS',
    },
    string: {
      url: 'invalidURL',
    },
  });

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
        showMessage(value, elements.feedbackMessage, i18nInstance);
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
      .catch((error) => {
        watchedState.ui.form.message = error.errors;
        watchedState.ui.form.state = 'failed';
      })
      .then((feed) => {

      })
      .catch((error) => {

      });
  });
};
