export default (response) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data.contents, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const error = new Error(parseError.textContent);
    error.isParseError = true;
    throw error;
  }

  const rss = doc.querySelector('rss');
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
