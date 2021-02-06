/**
 * Microsoft Graph query service.
 *
 * @summary Microsoft Graph service.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 *
 * Created at     : 2020-05-23 19:53:33
 * Last modified  : 2020-11-28 17:00:32
 */

import axios from 'axios';
import { types } from '../config';
import AuthenticationService from './aad.service';

// Graph API helper.
export default {
    // Graph API base URL.
    URL: `${types.RESOURCES.MICROSOFT_GRAPH}v1.0/`,

    /**
     * Acquire auth token and sends a request to
     * Microsoft Graph API.
     *
     * @param {any} [options] axios options. Use api for Graph action.
     *
     * @returns {Promise} response.
     */
    graphRequest(options)
    {
        return new Promise((resolve, reject) =>
        {
            AuthenticationService.acquireToken({ scopes: types.DEFAULT_SCOPES })
                .then(response =>
                {
                    const token = response.accessToken;
                    // builds request config.
                    options = {
                        ...options,
                        url: `${this.URL}${options.api}`,
                        headers: { Authorization: `Bearer ${token}` }
                    };
                    // Executes the request.
                    axios(options)
                        .then(res => resolve(res.data))
                        .catch(reject);
                })
                .catch(reject);
        });
    },

    /**
     * Reads blob data from axios
     * request for Graph API.
     *
     * @param {object} response request response.
     *
     * @returns {Promise<any>} promise waiting for blob data.
     */
    readBlob(response)
    {
        return new Promise((resolve) =>
        {
            var reader = new FileReader();
            reader.readAsDataURL(response);
            reader.onloadend = () =>
            {
                resolve(reader.result);
            };
        });
    },

    /**
     * User info.
     *
     * @returns {any} user info from AAD.
     */
    me()
    {
        return this.graphRequest({ api: 'me', params: { $select: types.ATTRIBUTES.join(',') } });
    },

    /**
     * User photo in max width.
     *
     * @returns {string} base64 string from user photo.
     */
    photo()
    {
        return new Promise((resolve, reject) =>
        {
            this.graphRequest({ api: 'me/photo/$value', responseType: 'blob' })
                .then((response) => resolve(this.readBlob(response)))
                .catch((error) => reject(error));
        });
    },

    /**
     * User photo with specified width.
     *
     * Available sizes are: 48x48, 64x64, 96x96, 120x120,
     * 240x240, 360x360, 432x432, 504x504 and 648x648.
     *
     * @param {string} [size] photo size.
     *
     * @returns {string} base64 string from user photo.
     */
    photoWithSize(size = '648x648')
    {
        return new Promise((resolve, reject) =>
        {
            this.graphRequest({ api: `me/photos/${size}/$value`, responseType: 'blob' })
                .then((response) => resolve(this.readBlob(response)))
                .catch((error) => reject(error));
        });
    }
};
