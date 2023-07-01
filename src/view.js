import { reverse } from 'lodash';

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
      feedbackMessage.classList.remove('text-danger');
      break;
    case 'processed':
      feedbackMessage.classList.add('text-success');
      input.value = '';
      input.focus();
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
const showMessage = (value, messageElement, i18nInstance) => {
  if (!value) {
    messageElement.textContent = '';
    return;
  }
  messageElement.textContent = i18nInstance.t(`feedbackMessages.${value}`);
};
const feedsRender = (feeds, container, i18nInstance) => {
  if (container.innerHTML === '') {
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const cardTitle = document.createElement('h2');
    cardTitle.classList.add('card-title', 'h4');
    cardTitle.textContent = i18nInstance.t('feeds');

    const listGroup = document.createElement('ul');
    listGroup.classList.add('list-group', 'border-0', 'rounded-0');

    cardBody.append(cardTitle, listGroup);
    card.append(cardBody);
    container.append(cardBody);
  }

  const newFeed = feeds[feeds.length - 1];

  const listGroup = container.querySelector('.list-group');
  const listItem = document.createElement('li');
  listItem.classList.add('list-group-item', 'border-0', 'border-end-0');

  const itemTitle = document.createElement('h3');
  itemTitle.classList.add('h6', 'm-0');
  itemTitle.textContent = newFeed.title;

  const itemDescription = document.createElement('p');
  itemDescription.classList.add('m-0', 'small', 'text-black-50');
  itemDescription.textContent = newFeed.description;

  listItem.append(itemTitle, itemDescription);
  listGroup.prepend(listItem);
};
const postsRender = (posts, currentPosts, container, i18nInstance) => {
  if (container.innerHTML === '') {
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const cardTitle = document.createElement('h2');
    cardTitle.classList.add('card-title', 'h4');
    cardTitle.textContent = i18nInstance.t('posts');

    const listGroup = document.createElement('ul');
    listGroup.classList.add('list-group', 'border-0', 'rounded-0');

    cardBody.append(cardTitle, listGroup);
    card.append(cardBody);
    container.append(cardBody);
  }

  const listGroup = container.querySelector('.list-group');
  const newPosts = reverse(posts.slice(currentPosts.length));
  newPosts.forEach((post) => {
    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const itemLink = document.createElement('a');
    itemLink.setAttribute('href', post.link);
    itemLink.classList.add('fw-bold');
    itemLink.dataset.id = post.id;
    itemLink.setAttribute('target', '_blank');
    itemLink.setAttribute('rel', 'noopener noreferrer');
    itemLink.textContent = post.title;

    const itemBtn = document.createElement('button');
    itemBtn.setAttribute('type', 'button');
    itemBtn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    itemBtn.dataset.id = post.id;
    itemBtn.dataset.bsToggle = 'modal';
    itemBtn.dataset.bsTarget = '#modal';
    itemBtn.textContent = i18nInstance.t('action.view');

    listItem.append(itemLink, itemBtn);
    listGroup.prepend(listItem);
  });
};
export {
  formRender,
  showMessage,
  feedsRender,
  postsRender,
};
