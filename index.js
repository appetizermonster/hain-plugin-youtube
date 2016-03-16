'use strict';

const shell = require('electron').shell;
const got = require('got');
const _ = require('lodash');
const co = require('co');

const RESULT_PREFIX_RE = /^google\.sbox\.p50 && google\.sbox\.p50\(/i;
const RESULT_POSTFIX_RE = /\)$(\s)*/i;
const DESC = 'Search Youtube.com';

function* queryYoutube(query) {
  const query_enc = encodeURIComponent(query);
  const url = `https://clients1.google.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=23&gs_ri=youtube&gs_is=1&ds=yt&cp=0&gs_id=a&q=${query_enc}&callback=google.sbox.p50`;
  let result = (yield got(url)).body;

  result = result.replace(RESULT_PREFIX_RE, '');
  result = result.replace(RESULT_POSTFIX_RE, '');

  result = JSON.parse(result);
  if (result[1]) {
    return result[1].map(x => x[0]);
  }
  return null;
}

module.exports = (context) => {

  function* search(query, reply) {
    const query_trim = query.trim();
    if (query_trim.length === 0)
      return;

    reply([{
      id: query_trim,
      payload: 'open',
      title: query_trim,
      desc: DESC
    }]);

    let results = yield* queryYoutube(query_trim);
    results = _.reject(results, (x) => x === query_trim);

    return _.take(results, 5).map((x) => {
      return {
        id: x,
        payload: 'open',
        title: x,
        desc: DESC
      };
    });
  }

  function* execute(id, payload) {
    if (payload !== 'open')
      return;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(id)}&page=&utm_source=opensearch`;
    shell.openExternal(url);
  }

  return {
    search: co.wrap(search),
    execute: co.wrap(execute)
  };
};
