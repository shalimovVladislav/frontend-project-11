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
        ui: {
          form: {
            state: 'filling',
            message: null,
          },
          content: {
            feeds: [],
            posts: [],
          },
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

      const validate = (url) => {
        const feedLinks = watchedState.ui.content.feeds.map((feed) => feed.link);
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

        validate(url)
          .then((validURL) => {
            watchedState.ui.form.message = null;
            watchedState.ui.form.state = 'processing';
            axios.get(addProxy(validURL))
              .then((response) => {
                const { feed, posts } = parseRSS(response);
                feed.link = validURL;
                feed.id = uniqueId;
                watchedState.ui.content.feeds.push(feed);
                posts.forEach((post) => {
                  post.feedID = feed.id;
                  post.id = uniqueId();
                });
                watchedState.ui.content.posts.push(...posts);
                watchedState.ui.form.message = 'successed';
                watchedState.ui.form.state = 'processed';
                watchedState.ui.form.state = 'filling';
              })
              .catch((error) => {
                if (error.message === 'Network Error') {
                  watchedState.ui.form.message = 'networkError';
                }
                if (error.isParseError) {
                  watchedState.ui.form.message = 'notContainRSS';
                }
                watchedState.ui.form.state = 'failed';
              });
          })
          .catch((error) => {
            watchedState.ui.form.message = error.errors;
            watchedState.ui.form.state = 'failed';
          });
      });
      elements.postsContainer.addEventListener('click', (e) => {
        const { id } = e.target.dataset;
        const viewPost = watchedState.ui.content.posts.find((post) => post.id === id);
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
                watchedState.ui.content.posts.push(newPost);
              });
          }));
        const promise = Promise.all(promises);
        promise
          .finally(() => {
            setTimeout(() => updateTracking(
              watchedState.ui.content.feeds,
              watchedState.ui.content.posts,
            ), 5000);
          });
      };
      updateTracking(watchedState.ui.content.feeds, watchedState.ui.content.posts);
    });
};
