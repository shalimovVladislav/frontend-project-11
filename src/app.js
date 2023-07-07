import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId';
import resources from './locales/index';
import parseRSS from './parser';
import getwatchedState from './view';

export default () => {
  const defaultLanguage = 'ru';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  })
    .then(() => {
      yup.setLocale({
        mixed: {
          notOneOf: 'existingRSS',
        },
        string: {
          url: 'invalidURL',
        },
      });

      const state = {
        loadingProcess: 'filling',
        form: {
          message: null,
        },
        content: {
          feeds: [],
          posts: [],
        },
        ui: {
          viewPostsIDs: [],
          modalPost: null,
        },
      };

      const elements = {
        form: document.querySelector('form'),
        input: document.querySelector('#url-input'),
        feedbackMessage: document.querySelector('.feedback'),
        button: document.querySelector('[type="submit"]'),
        feedsContainer: document.querySelector('.feeds'),
        postsContainer: document.querySelector('.posts'),
      };

      const watchedState = getwatchedState(state, elements, i18nInstance);

      const validate = (url, feedLinks) => {
        const shema = yup.string().url().notOneOf(feedLinks);
        return shema.validate(url);
      };
      const addProxy = (url) => {
        const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
        urlWithProxy.searchParams.set('url', url);
        urlWithProxy.searchParams.set('disableCache', 'true');
        return urlWithProxy.toString();
      };

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const url = formData.get('url').trim();

        const feedLinks = watchedState.content.feeds.map((feed) => feed.link);

        validate(url, feedLinks)
          .then((validURL) => {
            watchedState.form.message = null;
            watchedState.loadingProcess = 'processing';
            axios.get(addProxy(validURL))
              .then((response) => {
                const { feed, posts } = parseRSS(response);
                feed.link = validURL;
                feed.id = uniqueId;
                watchedState.content.feeds.push(feed);
                posts.forEach((post) => {
                  post.feedID = feed.id;
                  post.id = uniqueId();
                });
                watchedState.content.posts.push(...posts);
                watchedState.form.message = 'successed';
                watchedState.loadingProcess = 'filling';
              })
              .catch((error) => {
                if (error.message === 'Network Error') {
                  watchedState.form.message = 'networkError';
                }
                if (error.isParseError) {
                  watchedState.form.message = 'notContainRSS';
                }
                watchedState.loadingProcess = 'failed';
              });
          })
          .catch((error) => {
            watchedState.form.message = error.errors;
            watchedState.loadingProcess = 'failed';
          });
      });
      elements.postsContainer.addEventListener('click', (e) => {
        const { id } = e.target.dataset;
        const viewPost = watchedState.content.posts.find((post) => post.id === id);
        if (id) {
          if (e.target.tagName === 'BUTTON') {
            watchedState.ui.modalPost = viewPost;
          }
          if (!watchedState.ui.viewPostsIDs.includes(id)) {
            watchedState.ui.viewPostsIDs.push(viewPost.id);
          }
        }
      });
      const updateTracking = (feeds, currentPosts) => {
        const currentPostsLinks = currentPosts.map((post) => post.link);
        const promises = feeds.map((feed) => axios
          .get(addProxy(feed.link))
          .then((response) => {
            const { posts } = parseRSS(response);
            posts
              .filter((post) => !currentPostsLinks.includes(post.link))
              .forEach((newPost) => {
                newPost.feedID = feed.id;
                newPost.id = uniqueId();
                watchedState.content.posts.push(newPost);
              });
          }));
        const promise = Promise.all(promises);
        promise
          .finally(() => {
            setTimeout(() => updateTracking(
              watchedState.content.feeds,
              watchedState.content.posts,
            ), 5000);
          });
      };
      updateTracking(watchedState.content.feeds, watchedState.content.posts);
    });
};
