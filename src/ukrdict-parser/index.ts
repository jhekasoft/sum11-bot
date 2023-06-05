import axios from 'axios';
import { parse } from 'node-html-parser';

export async function getExplanation(keyword: string): Promise<string | string[]> {
  const result = await axios
  .get(encodeURI(`http://sum.in.ua/?swrd=${keyword}`))
  .then((response) => {
    // TODO: improve type definition
    const content: string = response.data

    const root = parse(content)

    // Parse article
    const articleEl = root.querySelector('[itemprop=articleBody]')
    if (articleEl) {
      return articleEl.structuredText
    }

    // Parse alternatives
    const alternativesEL = root.querySelector('#search-res ul')
    if (alternativesEL && alternativesEL.childNodes.length > 0) {
      const alternatives = alternativesEL.childNodes.map(n => n.text)
      return alternatives
    }

    return null
  });

  return result;
}
