import aes from "crypto-js/aes.js";
import Base64 from 'crypto-js/enc-base64.js';
import Utf8 from 'crypto-js/enc-utf8.js'
import { v4 as uuidv4 } from 'uuid';

class DeepLink {
    constructor(appName, chain, browser, origin, totpCode) {
        this.appName = appName; // Name/identifier of the app making use of this client
        this.chain = chain;
        this.browser = browser;
        this.origin = origin;
        this.totpCode = totpCode;
    }

    /**
     * Encode the deeplink payload
     *
     * @param {string} type Name of the call to execute
     * @param {object} payload
     * @param {boolean} encrypt
     * @returns {String}
     */
    async encodePayload(type, payload, encrypt) {
        return new Promise(async (resolve, reject) => {
            if (encrypt && !this.totpCode) {
                return reject('No beet key');
            }

            let request = {type: type};
            request.id = await uuidv4();
            request.payload = payload;
            request.payload.appName = this.appName;
            request.payload.chain = this.chain;
            request.payload.browser = this.browser;
            request.payload.origin = this.origin;

            let encryptedPayload;
            if (encrypt) {
                try {
                    encryptedPayload = aes.encrypt(
                        JSON.stringify(request),
                        this.totpCode
                    ).toString();
                } catch (error) {
                    console.log(error)
                    return reject(error)
                }
            }

            let stringified;
            try {
                stringified = Base64.stringify(
                    Utf8.parse(encryptedPayload)
                );
            } catch (error) {
                console.log(error)
                return reject(error)
            }

            let encoded;
            try {
                encoded = encodeURIComponent(
                    encrypt ? stringified : JSON.stringify(request)
                );
            } catch (error) {
                console.log(error)
                return reject(error)
            }

            return resolve(encoded);
        });
    }

    /**
     * Enable the user to inject the bitsharesjs library for advanced bitshares chain interaction
     *
     * @param {Module} TransactionBuilder
     * @param {object} options
     * @param {Boolean} encrypted
     * @returns {Module}
     */
    injectTransactionBuilder(TransactionBuilder, options, encrypted) {
        let encodePayload = this.encodePayload.bind(this);

        // if both options are set, we only want 1 beet call anyways
        if (options.sign && options.broadcast) {
            // forfeit private keys, and store public keys
            TransactionBuilder.prototype.add_signer = function add_signer(private_key, public_key) {
                if (typeof private_key !== "string" || !private_key || private_key !== "inject_wif") {
                    throw new Error("Do not inject wif while using Beet")
                }
                if (!this.signer_public_keys || !public_key) {
                    this.signer_public_keys = [];
                }
            };
            let handle_payload = function handlePayload(builder) {
                return new Promise((resolve, reject) => {
                    if (builder.operations.length != builder.operations.length) {
                        throw "Serialized and constructed operation count differs"
                    }
                    let args = [
                        "signAndBroadcast",
                        JSON.stringify(builder.toObject()),
                        builder && builder.signer_public_keys ? builder.signer_public_key : []
                    ];
                    encodePayload(
                        'api',
                        {
                            method: 'injectedCall',
                            params: args
                        },
                        encrypted
                    ).then((result) => {
                        resolve(result);
                    }).catch((err) => {
                        reject(err);
                    });
                });
            };
            TransactionBuilder.prototype.encrypt = function encrypt(was_encrypted_callback) {
                return new Promise((resolve, reject) => {
                    handle_payload(this).then(
                        result => {
                            if (was_encrypted_callback) {
                                was_encrypted_callback();
                            }
                            resolve(result);
                        }
                    ).catch(err => {
                        reject(err);
                    });
                });
            }
        } else if (options.sign && !options.broadcast) {
            // forfeit private keys, and store public keys
            TransactionBuilder.prototype.add_signer = function add_signer(private_key, public_key) {
                if (typeof private_key !== "string" || !private_key || private_key !== "inject_wif") {
                    throw new Error("Do not inject wif while using Beet")
                }
                if (!this.signer_public_keys || !public_key) {
                    this.signer_public_keys = [];
                }
            };
        } else if (!options.sign && options.broadcast) {
            throw "Unsupported injection"
        }
        return TransactionBuilder;
    }

    /*
     * Inject an external blockchain library into Beet-JS
     */
    /**
     * 
     * @param {String} pointOfInjection 
     * @param {Object} options
     * @param {Boolean} encrypted 
     * @returns 
     */
    async inject(pointOfInjection, options = {sign: true, broadcast: true}, encrypted) {
        if (!!pointOfInjection.prototype && !!pointOfInjection.prototype.get_type_operation) {
            return this.injectTransactionBuilder(pointOfInjection, options, encrypted);
        }
        throw new Error("Unsupported point of injection")
    }

    /**
     * Requests to execute a library call for the linked chain
     *
     * @param payload
     * @returns {Promise} Resolving is done by Beet
     */
    /*
    async injectedCall(payload) {
        let injectedCall;
        try {
            injectedCall = await this.encodePayload('api', {
                method: 'injectedCall',
                params: payload
            });
        } catch (error) {
            console.log(error)
            return;
        }

        return injectedCall;
    }
    */

    /**
     * Requests a vote for specified votable object
     *
     * @param payload
     * @returns {Promise} Resolving is done by Beet
     */
    /*
    async voteFor(payload) {
        let vote;
        try {
            vote = await this.encodePayload('api', {
                method: 'voteFor',
                params: payload
            });
        } catch (error) {
            console.log(error);
            return;
        }

        return vote;
    }
    */

    /**
     * Requests to execute a transfer for the linked chain
     *
     * @param payload
     * @returns {Promise} Resolving is done by Beet
     */
    /*
    async transfer(payload) {
        let beetTransfer;
        try {
            beetTransfer = await this.encodePayload('api', {
                method: 'transfer',
                params: payload
            });
        } catch (error) {
            console.log(error)
            return;
        }

        return beetTransfer;
    }
    */
}

export default DeepLink;