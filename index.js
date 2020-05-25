/**
 * This class randomly routes the client to one of two URLs
 * fetched from https://cfw-takehome.developers.workers.dev/api/variants.
 * 
 * The probability of routing to one URL over the other should be roughly 50/50.
 * 
 * The first time our client visits our page, a Cookie will be assigned,
 * and for the next month, every time they come visit our site,
 * they'll be taken to the same page.
 * 
 * To test the two variants, please open the page in a new incognito window or
 * delete the "variant" cookie from your browser and refresh. Thank you.
 * 
 * 
 * @author Roberto Herman
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with the response from one of the two variants
 * @param {Request} request
 */
async function handleRequest(request){
  const endpoint = 'https://cfw-takehome.developers.workers.dev/api/variants';
  // Request the URLs from the given API endpoint
  let urlArray = await fetch(endpoint)
  // response should contain an array with 2 URLs. Parse as JSON and save them to a variable
    .then(response => response.json())
    .then(json => { return json.variants })
    .catch(function(error) {
      console.log(`${error} while fetching ${endpoint}`);
    });

  // save each variant request's response in variables
  const NAME = 'variant-cookie';
  const VARIANT1_RESPONSE = await fetch(`${urlArray[0]}`)
    .then(res => { return res.text() }) // response is html
    .then(htmlText => {
      // modify HTML in response
      let modifiedResponse = modifyHTML(htmlText, 1);
      return new Response(modifiedResponse, {
        headers: { 'Content-type' : 'text/html' },
        });
    });

  const VARIANT2_RESPONSE = await fetch(`${urlArray[1]}`)
    .then(res => { return res.text() }) // response is html
    .then(htmlText => {
      // modify html in response
      let modifiedResponse = modifyHTML(htmlText, 2);
      return new Response(modifiedResponse, {
        headers: { 'Content-type' : 'text/html' },
        });
    });

  // Determine which variant group this requester is in.
  const cookie = request.headers.get('Cookie');
  if (cookie && cookie.includes(`${NAME}=1`)) {
    return VARIANT1_RESPONSE;
  } else if (cookie && cookie.includes(`${NAME}=2`)) {
    return VARIANT2_RESPONSE;
  } else {
    // if no cookie then this is a new client, decide a group and set the cookie
    let group = Math.random() < 0.5 ? '1' : '2'; // 50/50 split
    let response = group === '1' ? VARIANT1_RESPONSE : VARIANT2_RESPONSE;
    response.headers.append('Set-Cookie',
      `${NAME}=${group}; path=/; Max-Age=2592000`); // 30 days
      
    return response;
  }
}

/**
 * Does very specific string replacement to modify HTML content
 * @param {string} htmlBody 
 * @param {int} variantNum 
 */
function modifyHTML(htmlBody, variantNum){
  let modifiedHTMLResponse;
  // check which variant's HTML body we're modifying
  if(variantNum == 1){
    // Modify <title> and h1#title contents
    modifiedHTMLResponse = htmlBody.replace(/Variant 1/g, "Yin");
    // Change link
    modifiedHTMLResponse = modifiedHTMLResponse
      .replace('https://cloudflare.com','https://github.com/mecosteas');
    // Change link's p#description
    modifiedHTMLResponse = modifiedHTMLResponse
      .replace('Return to cloudflare.com',
        '<img border="0" alt="YinYang"' +
        ' src="https://upload.wikimedia.org/wikipedia/commons/4/41/Yin_and_yang.svg"' +
        ' width="100" height="100">');
    modifiedHTMLResponse = modifiedHTMLResponse
      .replace('This is variant one of the take home project!',
        "Congratulations, your presence gives a Yin vibe! <br />Yin is characterized" +
        " as an inward energy that is feminine, still, dark, and negative.");
  } else {
    modifiedHTMLResponse = htmlBody.replace(/Variant 2/g, "Yang");
    modifiedHTMLResponse = modifiedHTMLResponse
      .replace('https://cloudflare.com','https://github.com/mecosteas');
    modifiedHTMLResponse = modifiedHTMLResponse
      .replace('Return to cloudflare.com', '<img border="0" alt="YinYang"' +
        ' src="https://upload.wikimedia.org/wikipedia/commons/4/41/Yin_and_yang.svg"' +
        ' width="100" height="100">');
    modifiedHTMLResponse = modifiedHTMLResponse
      .replace('This is variant two of the take home project!',
        "Congratulations, your presence gives a Yang vibe! <br />Yang is characterized" +
        " as outward energy, masculine, hot, bright, and positive.");
  }
  return modifiedHTMLResponse;
}