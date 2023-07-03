import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId';
import resources from './locales/index';
import {
  formRender,
  showMessage,
  feedsRender,
  postsRender,
} from './view';

const parseRSS = (response) => {
  const parser = new DOMParser();
  const html = parser.parseFromString(response.data.contents, 'text/xml');
  const rss = html.querySelector('rss');
  if (!rss) {
    throw new Error('notContainRSS');
  }

  const feedTitle = rss.querySelector('title').textContent;
  const feedDescription = rss.querySelector('description').textContent;
  const feedLink = response.data.status.url;
  const feedID = uniqueId();
  const feed = {
    title: feedTitle,
    description: feedDescription,
    link: feedLink,
    id: feedID,
  };

  const posts = [];
  const items = rss.querySelectorAll('item');
  items.forEach((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postDescription = item.querySelector('description').textContent;
    const postLink = item.querySelector('link').textContent;
    const postPubDate = item.querySelector('pubDate').textContent;
    const postID = uniqueId();
    const post = {
      title: postTitle,
      description: postDescription,
      link: postLink,
      pubDate: postPubDate,
      id: postID,
      feedID,
    };
    posts.push(post);
  });

  return { feed, posts };
};

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
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
  };

  const watchedState = onChange(state, (path, value, prevValue) => {
    switch (path) {
      case 'ui.form.state':
        formRender(value, elements);
        break;
      case 'ui.form.message':
        showMessage(value, elements.feedbackMessage, i18nInstance);
        break;
      case 'ui.content.feeds':
        feedsRender(value, elements.feedsContainer, i18nInstance);
        break;
      case 'ui.content.posts':
        postsRender(value, prevValue, elements.postsContainer, i18nInstance);
        break;
      default:
        throw new Error(`unknown state path ${path}`);
    }
  });

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const feedLinks = watchedState.ui.content.feeds.map((feed) => feed.link);
    const shema = yup.string().url().notOneOf(feedLinks);
    const formData = new FormData(e.target);
    const url = formData.get('url').trim();
    shema.validate(url)
      .then((validURL) => {
        watchedState.ui.form.message = null;
        watchedState.ui.form.state = 'processing';
        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(validURL)}`)
          .then(parseRSS)
          .then(({ feed, posts }) => {
            watchedState.ui.content.feeds.push(feed);
            watchedState.ui.content.posts.push(...posts);
            watchedState.ui.form.message = 'successed';
            watchedState.ui.form.state = 'processed';
          })
          .then(() => {
            watchedState.ui.form.state = 'filling';
          })
          .catch((error) => {
            if (error.message === 'Network Error') {
              watchedState.ui.form.message = 'networkError';
            } else {
              watchedState.ui.form.message = error.message;
            }
            watchedState.ui.form.state = 'failed';
          });
      })
      .catch((error) => {
        watchedState.ui.form.message = error.errors;
        watchedState.ui.form.state = 'failed';
      });
  });
  const updateTracking = (feeds, currentPosts) => {
    console.log('Tracking');
    if (feeds.length !== 0) {
      const currentPostsLinks = currentPosts.map((post) => post.link);
      const promises = feeds.map((feed) => axios
        .get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feed.link)}`)
        .then(parseRSS)
        .then(({ posts }) => posts.filter((post) => !currentPostsLinks.includes(post.link)))
        .then((newPosts) => newPosts.map((newPost) => {
          newPost.feedID = feed.id;
          return newPost;
        })));
      const promise = Promise.all(promises);
      promise
        .then((contents) => watchedState.ui.content.posts.push(...contents.flat()))
        .catch((error) => {
          console.log(error);
        });
    }
    setTimeout(() => updateTracking(
      watchedState.ui.content.feeds,
      watchedState.ui.content.posts,
    ), 5000);
  };
  updateTracking(watchedState.ui.content.feeds, watchedState.ui.content.posts);
};
