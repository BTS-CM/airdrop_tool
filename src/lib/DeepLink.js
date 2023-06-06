/* eslint-disable default-param-last */
import { v4 as uuidv4 } from 'uuid';

class DeepLink {
  constructor(appName, chain, browser, origin) {
    this.appName = appName; // Name/identifier of the app making use of this client
    this.chain = chain;
    this.browser = browser;
    this.origin = origin;
  }

  /**
     * Encode the deeplink payload
     *
     * @param {string} type Name of the call to execute
     * @param {object} payload
     * @returns {String}
     */
  async encodePayload(type, payload) {
    return new Promise(async (resolve, reject) => {
      const request = { type };
      request.id = await uuidv4();
      request.payload = payload;
      request.payload.appName = this.appName;
      request.payload.chain = this.chain;
      request.payload.browser = this.browser;
      request.payload.origin = this.origin;

      let encoded;
      try {
        encoded = encodeURIComponent(
          JSON.stringify(request),
        );
      } catch (error) {
        console.log(error);
        reject(error);
        return;
      }

      resolve(encoded);
    });
  }

  /**
     * Enable the user to inject the bitsharesjs library for advanced bitshares chain interaction
     *
     * @param {Module} TransactionBuilder
     * @param {object} options
     * @returns {Module}
     */
  injectTransactionBuilder(TransactionBuilder, options) {
    const encodePayload = this.encodePayload.bind(this);

    // if both options are set, we only want 1 beet call anyways
    if (options.sign && options.broadcast) {
      // forfeit private keys, and store public keys
      TransactionBuilder.prototype.add_signer = function add_signer(private_key, public_key) {
        if (typeof private_key !== "string" || !private_key || private_key !== "inject_wif") {
          throw new Error("Do not inject wif while using Beet");
        }
        if (!this.signer_public_keys || !public_key) {
          this.signer_public_keys = [];
        }
      };
      const handle_payload = function handlePayload(builder) {
        return new Promise((resolve, reject) => {
          /*
          if (builder.operations.length !== builder.operations.length) {
            throw new Error("Serialized and constructed operation count differs");
          }
          */
          const args = [
            "signAndBroadcast",
            JSON.stringify(builder.toObject()),
            builder && builder.signer_public_keys ? builder.signer_public_key : [],
          ];
          encodePayload(
            'api',
            {
              method: 'injectedCall',
              params: args,
            },
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
            (result) => {
              if (was_encrypted_callback) {
                was_encrypted_callback();
              }
              resolve(result);
            },
          ).catch((err) => {
            reject(err);
          });
        });
      };
    } else if (options.sign && !options.broadcast) {
      // forfeit private keys, and store public keys
      TransactionBuilder.prototype.add_signer = function add_signer(private_key, public_key) {
        if (typeof private_key !== "string" || !private_key || private_key !== "inject_wif") {
          throw new Error("Do not inject wif while using Beet");
        }
        if (!this.signer_public_keys || !public_key) {
          this.signer_public_keys = [];
        }
      };
    } else if (!options.sign && options.broadcast) {
      throw new Error("Unsupported injection");
    }
    return TransactionBuilder;
  }

  /**
   * Inject an external blockchain library into Beet-JS
   * @param {String} pointOfInjection
   * @param {Object} options
   * @returns
   */
  async inject(pointOfInjection, options = { sign: true, broadcast: true }) {
    if (!!pointOfInjection.prototype && !!pointOfInjection.prototype.get_type_operation) {
      return this.injectTransactionBuilder(pointOfInjection, options);
    }
    throw new Error("Unsupported point of injection");
  }
}

export default DeepLink;
