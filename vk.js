/**
 * Created by elessar on 2016.
 */
"use strict";
/**
 * Proxy function. Mixes common parameters into request
 * @param {Function} fetch Original fetch function
 * @param {String} access_token User access token
 * @returns {Function} Proxied fetch function
 */
function proxy(fetch, access_token) {
    return function (url, query, data, method, headers) {
        return fetch(`https://api.vk.com/method/${url}`, {
            query: Object.assign({}, query, { access_token: access_token, v: "5.45" }),
            data: data,
            method: method,
            headers: headers,
            tags: ["vkontakte"]
        })
            .then(result => {
            if (result.error) {
                throw new Error(`[${CRAWLING_ERROR_CODE}] Request error: ${JSON.stringify(result.error)}`);
            }
            return result;
        })
            .then(result => result.response);
    };
}
/**
 * Fetches the whole list of items from network
 * @param {Function} fetch Original fetch function
 * @param {String} url Request url
 * @param {Object} params Request parans
 * @param {Number} total Total item count. If negative, function will try to determine total count
 * @param {Number} offset Request offset
 * @returns {Promise<Array<Object>>} Proxied fetch function
 */
function fetchList(fetch, url, params, total, offset = 0) {
    let step = 100;
    // If we don't know total count than we need to perform first request to determine count
    if (total < 0) {
        return fetch(url, params)
            .then(({ count, items }) => fetchList(fetch, url, params, count, step)
            .then(result => items.concat(result)));
    }
    // If total is zero then return empty array
    if (total <= offset)
        return Promise.resolve([]);
    let steps = Math.ceil((total - offset) / step);
    let counters = new Array(steps)
        .fill(0)
        .map((_, i) => ({
        offset: offset + step * i,
        count: Math.min((total - offset) - i * step, step)
    }));
    let promises = counters
        .map(offsetData => fetch(url, Object.assign({}, params, offsetData)));
    return Promise.all(promises)
        .then(results => results.reduce((prev, curr) => prev.concat(curr.items), []));
}
/**
 * Crawler configuration
 * @type {Object}
 */
const config = {
    userFields: `sex,
        bdate,
        city,
        country,
        home_town,
        photo_max,
        photo_max_orig,
        online,
        domain,
        has_mobile,
        contacts,
        site,
        education,
        universities,
        schools,
        status,
        last_seen,
        counters,
        occupation,
        nickname,
        relatives,
        relation,
        personal,
        connections,
        exports,
        screen_name,
        maiden_name,
        crop_photo,
        timezone,
        activities,
        interests,
        music,
        movies,
        tv,
        books,
        games,
        about,
        quotes`
}, CRAWLING_ERROR_CODE = "VK-CRAWL";
function crawleGroupFields(fetchList, groupId, counters) {
    let queries = [
        {
            key: "topics",
            promise: fetchList("board.getTopics", { group_id: -groupId }, counters.topics)
        },
        {
            key: "wall",
            promise: fetchList("wall.get", { group_id: -groupId }, -1)
        },
        {
            key: "photoComments",
            promise: fetchList("photos.getAllComments", { owner_id: -groupId }, -1)
        },
        {
            key: "videos",
            promise: fetchList("video.get", { owner_id: -groupId }, -1)
        }
    ];
    // Combines all queries in one map
    return Promise.all(queries.map(query => query.promise))
        .then(data => {
        return queries
            .map((query, index) => ({ key: query.key, value: data[index] }))
            .reduce((prev, curr) => Object.assign(prev, { [curr.key]: curr.value }), {});
    })
        .then(data => {
        // Here will be all comment parsing logic
    });
}
/**
 * Main crawling function. Crawles vkontakte user and returns data in json format
 * @param {Function} fetch Original fetch function
 * @param {String} id Vk.com user id
 * @param {String} token Access-token for crawling data
 * @returns {Promise<Object>} Crawling result
 */
function crawle(fetch, { id, token }) {
    let fetchWithToken = proxy(fetch, token);
    let fetchListWithToken = fetchList.bind(null, fetchWithToken);
    return fetchWithToken("users.get", { user_id: id, fields: config.userFields })
        .then(result => result[0])
        .then(profileResult => {
        const counters = profileResult.counters;
        // Sub-query definitions
        let queries = [
            {
                key: "friends",
                promise: fetchListWithToken("friends.get", { user_id: id }, counters.friends)
            },
            {
                key: "groups",
                promise: fetchListWithToken("groups.get", { user_id: id, extended: 1 }, counters.groups)
            },
            {
                key: "photos",
                promise: fetchListWithToken("photos.getAll", { owner_id: id, extended: 1 }, counters.photos)
            },
            {
                key: "audios",
                promise: fetchListWithToken("audio.get", { owner_id: id }, counters.audios)
            },
            {
                key: "wall",
                promise: fetchListWithToken("wall.get", { owner_id: id, filter: "owner" }, -1)
            },
            {
                key: "videos",
                promise: fetchListWithToken("video.get", { owner_id: id }, counters.videos)
            },
            {
                key: "notes",
                promise: fetchListWithToken("notes.get", { user_id: id }, counters.notes)
            }
        ];
        // Combines all queries in one map
        return Promise.all(queries.map(query => query.promise))
            .then(data => {
            return queries
                .map((query, index) => ({ key: query.key, value: data[index] }))
                .reduce((prev, curr) => Object.assign(prev, { [curr.key]: curr.value }), { profile: profileResult });
        });
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = crawle;
