/**
 * Created by elessar on 2/2/16.
 */
"use strict";
/**
 * Proxy function. Mixes common parameters into request
 * @param {Function} fetch Original fetch function
 * @param {String} access_token User access token
 * @returns {Function}
 */
function proxy(fetch, access_token) {
    return function (url, query, data, method, headers) {
        return fetch(`https://graph.facebook.com/v2.5/${url}`, {
            query: Object.assign({}, query, { access_token: access_token }),
            data: data,
            method: method,
            headers: headers,
            tags: ["facebook"]
        }).then(result => {
            if (result.error)
                throw new Error(`[${CRAWLER_ERROR_ID}] Crawling troubles: ${result.error}`);
            return result;
        });
    };
}
/**
 * Gets whole list of items
 * @param {Function} fetch Original fetch function
 * @param {Object} current Current chunk of data
 * @returns {Promise<Array<Object>>} Returns list of data
 */
function getList(fetch, current) {
    if (!current) {
        return Promise.resolve([]);
    }
    if (current.paging && current.paging.next)
        return getListTail(fetch, current).then(result => current.data.concat(result));
    return Promise.resolve(current.data);
}
/**
 * Gets list tail
 * @param {Function} fetch Original fetch function
 * @param {Object} current Current chunk of data
 * @returns {Promise<Array<Object>>} Returns list of data
 */
function getListTail(fetch, current) {
    let url = current.paging ? current.paging.next : null;
    if (!url)
        return Promise.resolve({ data: [], paging: {} });
    let query = fetch(url, {}, {}, "get", {});
    return query
        .then(result => {
        return getListTail(fetch, result).then(newResult => {
            return Promise.resolve(result.data.concat(newResult.data));
        });
    });
}
/**
 * Crawler configuration
 * @type {Object}
 */
const config = {
    personal: {
        fields: `
                id,
                name,
                first_name,
                last_name,
                middle_name,
                name_format,
                about,
                age_range,
                bio,
                birthday,
                context,
                cover,
                devices,
                education,
                gender,
                hometown,
                inspirational_people,
                link,
                locale,
                meeting_for,
                albums {
                  count,
                  id,
                  description,
                  event,
                  from,
                  link,
                  created_time,
                  backdated_time,
                  photos {
                    id,
                    from,
                    link,
                    picture,
                    width,
                    height,
                    place,
                    comments {
                      id,
                      from,
                      message
                    }
                  }
                },
                picture {
                  width,
                  height,
                  url,
                  is_silhouette
                },
                interested_in,
                is_verified,
                political,
                quotes,
                relationship_status,
                religion,
                significant_other,
                sports,
                updated_time,
                verified,
                work,
                books {
                  about,
                  id,
                  name
                },
                family {
                  id,
                  name,
                  relationship,
                  updated_time
                },
                friends {
                  name,
                  id
                },
                movies {
                  id,
                  name
                },
                music {
                  id,
                  name
                },
                photos {
                  id,
                  name,
                  comments {
                    id,
                    from
                  },
                  album
                },
                videos {
                  id,
                  description,
                  comments {
                    id,
                    from
                  },
                  status
                },
                feed {
                  id,
                  name,
                  description,
                  updated_time,
                  comments {
                    id,
                    from
                  },
                  status_type
                },
                posts {
                  id,
                  name,
                  description,
                  updated_time,
                  comments {
                    id,
                    from
                  },
                  status_type
                },
                languages,
                favorite_athletes,
                favorite_teams,
                television {
                  id,
                  name,
                  description
                },
                events {
                  id,
                  name,
                  description,
                  start_time,
                  end_time,
                  updated_time,
                  comments {
                    id,
                    from,
                    message,
                    parent,
                    user_likes,
                    comments {
                      id,
                      from
                    }
                  },
                  type,
                  category
                },
                likes {
                  id,
                  about,
                  description,
                  name,
                  posts {
                    id,
                    from,
                    updated_time,
                    message,
                    name
                  }
                }
            `
    }
}, CRAWLER_ERROR_ID = "FB-CRAWL";
/**
 * Main crawling function. Crawles facebook user and returns data in json format
 * @param {Function} fetch Original fetch function
 * @param {String} token Access-token for crawling data
 * @returns {Promise<Object>} Crawling result
 */
function crawle(fetch, { token }) {
    let fetchWithToken = proxy(fetch, token);
    return fetchWithToken("me", { fields: config.personal.fields.replace(" ", "").replace("\n", "") })
        .then(result => {
        return Promise.all([
            getList(fetch, result.albums),
            getList(fetch, result.books),
            getList(fetch, result.family),
            getList(fetch, result.friends),
            getList(fetch, result.movies),
            getList(fetch, result.music),
            getList(fetch, result.photos),
            getList(fetch, result.videos),
            getList(fetch, result.feed),
            getList(fetch, result.posts),
            getList(fetch, result.television),
            getList(fetch, result.events),
            getList(fetch, result.likes)
        ]).then((partialResults) => {
            [
                result.albums,
                result.books,
                result.family,
                result.friends,
                result.movies,
                result.music,
                result.photos,
                result.videos,
                result.feed,
                result.posts,
                result.television,
                result.events,
                result.likes
            ] = partialResults;
            return result;
        });
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = crawle;
