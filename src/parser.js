export default (response) => {
  const parser = new DOMParser();
  const html = parser.parseFromString(response.data.contents, 'text/xml');
  const rss = html.querySelector('rss');
  if (!rss) {
    throw new Error('notContainRSS');
  }

  const feedTitle = rss.querySelector('title').textContent;
  const feedDescription = rss.querySelector('description').textContent;
  const feed = {
    title: feedTitle,
    description: feedDescription,
  };

  const posts = [];
  const items = rss.querySelectorAll('item');
  items.forEach((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postDescription = item.querySelector('description').textContent;
    const postLink = item.querySelector('link').textContent;
    const post = {
      title: postTitle,
      description: postDescription,
      link: postLink,
    };
    posts.push(post);
  });

  return { feed, posts };
};
