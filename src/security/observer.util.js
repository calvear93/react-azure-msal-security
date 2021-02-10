/**
 * Simple observer pattern handler.
 *
 * @summary Observer handler.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 *
 * Created at     : 2020-02-09 19:53:33
 * Last modified  : 2021-02-09 20:01:13
 */

export default class Observer
{
    /**
     * Initializes subscriptors
     */
    constructor()
    {
        this.subscriptors = {};
    }

    /**
     * Subscribes a listener callback.
     *
     * @param {Function} callback listener
     *
     * @returns {string} id subscription identifier
     */
    subscribe(callback)
    {
        const id = Date.now().toString();

        this.subscriptors[id] = callback;

        return id;
    }

    /**
     * Removes subscription by it'd id.
     *
     * @param {string} id
     */
    unsubscribe(id)
    {
        this.subscriptors[id] = undefined;
    }

    /**
     * Triggers the event for every subscriptions.
     *
     * @param {any} args any payload for callbacks.
     */
    trigger(args)
    {
        for (let callback of Object.values(this.subscriptors))
            callback && callback(args);
    }
}
