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
        return fetch(`https://api.linkedin.com/v1/${url}`, {
            query: Object.assign({}, query, { format: "json" }),
            data: data,
            method: method,
            headers: Object.assign({}, headers, {
                "authorization": `Bearer ${access_token}`,
                "x-li-format": "json"
            }),
            tags: ["linkedin"]
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
    fields: [
        // basicfields
        "id",
        "first-name",
        "last-name",
        "maiden-name",
        "formatted-name",
        "phonetic-first-name",
        "phonetic-last-name",
        "formatted-phonetic-name",
        "headline",
        "location",
        "industry",
        "current-share",
        "num-connections",
        "num-connections-capped",
        "summary",
        "specialties",
        "positions",
        "picture-url",
        "picture-urls",
        "site-standard-profile-request",
        "api-standard-profile-request",
        "public-profile-url",
        // emailaddress
        "email_address",
        // fullprofile
        "proposal-comments",
        "associations",
        "interests",
        "publications",
        "patents",
        "languages",
        "skills",
        "certifications",
        "educations",
        "courses",
        "volunteer",
        "three-current-positions",
        "three-past-positions",
        "num-recommenders",
        "recommendations-received",
        "following",
        "job-bookmarks",
        "suggestions",
        "date-of-birth",
        "member-url-resources",
        "related-profile-views",
        "honors-awards"
    ]
}, CRAWLER_ERROR_ID = "LN-CRAWL";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function crawle(fetch, { id, token }) {
    return __awaiter(this, void 0, void 0, function* () {
        let fetchWithToken = proxy(fetch, token);
        let url = `people/~:(${config.fields.join(",")})`;
        return fetchWithToken(url);
    });
};
