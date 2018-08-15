/**
 * Created by elessar on 2/2/16.
 */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
/**
 * Proxy function. Mixes common parameters into request
 * @param {Function} fetch Original fetch function
 * @param {String} access_token User access token
 * @returns {Function}
 */
function proxy(fetch, access_token) {
    return function (url, query, data, method, headers) {
        return fetch(`https://api.twitter.com/1.1/${url}`, {
            query: query,
            data: data,
            method: method,
            headers: Object.assign({}, headers, { authorization: `Bearer ${access_token}` }),
            tags: ["twitter"]
        }).then(result => {
            if (result.error)
                throw new Error(`[${CRAWLER_ERROR_ID}] Crawling troubles: ${result.error}`);
            return result;
        });
    };
}
/**
 * Crawler configuration
 * @type {Object}
 */
const config = {
    batchSize: 2,
    totalCount: 5
}, CRAWLER_ERROR_ID = "TW-CRAWL";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function crawle(fetch, { id, token }) {
    return __awaiter(this, void 0, void 0, function* () {
        let fetchWithToken = proxy(fetch, token);
        let maxId = null;
        let processedTweets = 0;
        let result = [];
        while (processedTweets < config.totalCount) {
            let query = {
                user_id: id,
                count: Math.max(config.batchSize, config.totalCount - processedTweets)
            };
            if (maxId) {
                query.max_id = maxId;
            }
            let res = yield fetchWithToken("statuses/user_timeline.json", query);
            if (res.length === 0)
                break;
            processedTweets += res.length;
            maxId = res[res.length - 1].str_id;
            result = result.concat(res);
        }
        return result;
    });
};
