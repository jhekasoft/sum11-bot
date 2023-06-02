import axios from 'axios';
import { parse } from 'node-html-parser';

export async function getArticle(keyword: string): Promise<string> {
  const result = await axios
  .get(encodeURI(`http://sum.in.ua/?swrd=${keyword}`))
  .then((response) => {
    // TODO: improve type definition
    const content: string = response.data

    const root = parse(content)
    const articleEl = root.querySelector('[itemprop=articleBody]');
    if (articleEl) {
      return articleEl.structuredText
    }

    return null
  });

  return result;
}
