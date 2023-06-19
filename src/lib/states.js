import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connect, checkBeet, link } from 'beet-js';
import config from '../config/config.json';

const localePreferenceStore = create(
  persist(
    (set, get) => ({
      locale: 'en',
      changeLocale: (lng) => {
        console.log(`Saving preferred locale: ${lng}`);
        set({ locale: lng });
      },
    }),
    {
      name: 'localePreference',
    },
  ),
);

const ticketStore = create(
  persist(
    (set, get) => ({
      bitshares: [],
      bitshares_testnet: [],
      tusc: [],
      changeTickets: (env, newTickets) => {
        if (env === 'bitshares') {
          set({ bitshares: newTickets });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: newTickets });
        } else if (env === 'tusc') {
          set({ tusc: newTickets });
        }
      },
      eraseTickets: (env) => {
        console.log(`Erasing ${env} tickets!`);
        if (env === 'bitshares') {
          set({ bitshares: [] });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: [] });
        } else if (env === 'tusc') {
          set({ tusc: [] });
        }
      },
    }),
    {
      name: 'ticketStorage',
    },
  ),
);

// Storing asset names and precision values
const assetStore = create(
  persist(
    (set, get) => ({
      bitshares: [],
      bitshares_testnet: [],
      tusc: [],
      changeAssets: (env, leaders) => {
        if (env === 'bitshares') {
          set({ bitshares: leaders });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: leaders });
        } else if (env === 'tusc') {
          set({ tusc: leaders });
        }
      },
      addOne: (env, newAsset) => {
        let currentAssets;
        if (env === "bitshares") {
          currentAssets = get().bitshares;
        } else if (env === "bitshares_testnet") {
          currentAssets = get().bitshares_testnet;
        } else if (env === "tusc") {
          currentAssets = get().tusc;
        }

        currentAssets.push(newAsset);

        if (env === 'bitshares') {
          set({ bitshares: currentAssets });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: currentAssets });
        } else if (env === 'tusc') {
          set({ tusc: currentAssets });
        }
      },
      eraseAssets: (env) => {
        console.log(`Erasing ${env} leaderboards!`);
        if (env === 'bitshares') {
          set({ bitshares: [] });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: [] });
        } else if (env === 'tusc') {
          set({ tusc: [] });
        }
      },
    }),
    {
      name: 'assetStorage',
    },
  ),
);

const leaderboardStore = create(
  persist(
    (set, get) => ({
      bitshares: [],
      bitshares_testnet: [],
      tusc: [],
      changeLeaders: (env, leaders) => {
        if (env === 'bitshares') {
          set({ bitshares: leaders });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: leaders });
        } else if (env === 'tusc') {
          set({ tusc: leaders });
        }
      },
      eraseLeaders: (env) => {
        console.log(`Erasing ${env} leaderboards!`);
        if (env === 'bitshares') {
          set({ bitshares: [] });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: [] });
        } else if (env === 'tusc') {
          set({ tusc: [] });
        }
      },
    }),
    {
      name: 'leaderboardStorage',
    },
  ),
);

const airdropStore = create(
  persist(
    (set, get) => ({
      bitshares: [],
      bitshares_testnet: [],
      tusc: [],
      changeAirdrops: (env, airdrop) => {
        let currentAirdrops;
        if (env === 'bitshares') {
          currentAirdrops = get().bitshares;
          set({ bitshares: currentAirdrops.concat(airdrop) });
        } else if (env === 'bitshares_testnet') {
          currentAirdrops = get().bitshares_testnet;
          set({ bitshares_testnet: currentAirdrops.concat(airdrop) });
        } else if (env === 'tusc') {
          currentAirdrops = get().tusc;
          set({ tusc: currentAirdrops.concat(airdrop) });
        }
      },
      eraseAirdrops: (env) => {
        console.log(`Erasing all ${env} airdrops!`);
        if (env === 'bitshares') {
          set({ bitshares: [] });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: [] });
        } else if (env === 'tusc') {
          set({ tusc: [] });
        }
      },
      updateOne: (env, airdropID, updatedSettings) => {
        let currentAirdrops;
        if (env === "bitshares") {
          currentAirdrops = get().bitshares;
        } else if (env === "bitshares_testnet") {
          currentAirdrops = get().bitshares_testnet;
        } else if (env === "tusc") {
          currentAirdrops = get().tusc;
        }

        const newAirdrops = currentAirdrops.filter((x) => x.id !== airdropID);
        const updateTarget = currentAirdrops.find((x) => x.id === airdropID);
        updateTarget.settings = updatedSettings;
        newAirdrops.push(updateTarget);

        if (env === 'bitshares') {
          set({ bitshares: newAirdrops });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: newAirdrops });
        } else if (env === 'tusc') {
          set({ tusc: newAirdrops });
        }
      },
      eraseOne: (env, airdropID) => {
        console.log(`Erasing one ${env} airdrop with ID ${airdropID}!`);

        let currentAirdrops;
        if (env === "bitshares") {
          currentAirdrops = get().bitshares;
        } else if (env === "bitshares_testnet") {
          currentAirdrops = get().bitshares_testnet;
        } else if (env === "tusc") {
          currentAirdrops = get().tusc;
        }

        const newAirdrops = currentAirdrops.filter((x) => x.id !== airdropID);

        if (env === 'bitshares') {
          set({ bitshares: newAirdrops });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: newAirdrops });
        } else if (env === 'tusc') {
          set({ tusc: newAirdrops });
        }
      },
    }),
    {
      name: 'airdropStorage',
    },
  ),
);

const identitiesStore = create(
  persist(
    (set, get) => ({
      identities: [],
      drafts: [],
      storedConnections: {},
      storeConnection: (connection) => {
        if (!connection || !connection.identity) {
          return;
        }
        const currentConnections = get().storedConnections;
        if (!currentConnections || !currentConnections[connection.identity.identityhash]) {
          currentConnections[connection.identity.identityhash] = {
            beetkey: connection.beetkey,
            next_identification: connection.next_identification,
            secret: connection.secret,
          };
          set({ storedConnections: currentConnections });
        }
      },
      removeConnection: (identityhash) => {
        const currentConnections = get().storedConnections;
        if (currentConnections && currentConnections[identityhash]) {
          delete currentConnections[identityhash];
          set({ storedConnections: currentConnections });
        }
      },
      setIdentities: (identity) => {
        if (!identity) {
          return;
        }

        const currentIdentities = get().identities;
        if (
          currentIdentities.find(
            (id) => id.identityHash === identity.identityHash
              && id.requested.account.id === identity.requested.account.id,
          )
        ) {
          console.log('using existing identity');
          return;
        }

        currentIdentities.push(identity);
        set({ identities: currentIdentities });
      },
      removeIdentity: (accountID) => {
        if (!accountID) {
          return;
        }
        const currentIdentities = get().identities;
        const newIdentities = currentIdentities.filter((x) => x.requested.account.id !== accountID);
        set({ identities: newIdentities });
      },
    }),
    {
      name: 'beetIdentities',
    },
  ),
);

const tempStore = create(
  (set, get) => ({
    account: "",
    setAccount: (newAccount) => set({ account: newAccount }),
    reset: () => set({
      account: "",
    }),
  })
);

/**
 * airdrop tool related
 */
const appStore = create(
  persist(
    (set, get) => ({
      nodes: {
        bitshares: config.bitshares.nodeList.map((node) => node.url),
        bitshares_testnet: config.bitshares_testnet.nodeList.map((node) => node.url),
        tusc: config.tusc.nodeList.map((node) => node.url),
      },
      account: "",
      replaceNodes: (env, nodes) => {
        if (env === 'bitshares') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares: nodes },
          }));
        } else if (env === 'bitshares_testnet') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodes },
          }));
        } else if (env === 'tusc') {
          set(async (state) => ({
            nodes: { ...state.nodes, tusc: nodes },
          }));
        }
      },
      setAccount: (newAccount) => set({ account: newAccount }),
      changeURL: (env) => {
        /**
         * The current node url isn't healthy anymore
         * shift it to the back of the queue
         * Replaces nodeFailureCallback
         */
        console.log('Changing primary node');
        const nodesToChange = get().nodes[env];
        nodesToChange.push(nodesToChange.shift()); // Moving misbehaving node to end

        if (env === 'bitshares') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares: nodesToChange },
          }));
        } else if (env === 'bitshares_testnet') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodesToChange },
          }));
        } else if (env === 'tusc') {
          set(async (state) => ({
            nodes: { ...state.nodes, tusc: nodesToChange },
          }));
        }
      },
      reset: () => set({
        nodes: {
          bitshares: [],
          bitshares_testnet: [],
          tusc: [],
        },
        account: "",
      }),
      removeURL: (env, url) => {
        let nodesToChange = get().nodes[env];
        nodesToChange = nodesToChange.filter((x) => x !== url);

        if (env === 'bitshares') {
          set((state) => ({
            nodes: { ...state.nodes, bitshares: nodesToChange },
          }));
        } else if (env === 'bitshares_testnet') {
          set((state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodesToChange },
          }));
        } else if (env === 'tusc') {
          set((state) => ({
            nodes: { ...state.nodes, tusc: nodesToChange },
          }));
        }
      },
    }),
    {
      name: 'nodeStorage',
    },
  ),
);

/**
 * Beet wallet related
 */
const beetStore = create((set, get) => ({
  connection: null,
  authenticated: null,
  isLinked: null,
  identity: null,
  connect: async (identity) => {
    /**
     * Connect to and authenticate with the Beet client
     * @param {Object} identity
     */
    let beetOnline;
    try {
      beetOnline = await checkBeet(true);
    } catch (error) {
      console.log(error);
    }

    if (!beetOnline) {
      console.log('beet not online');
      return;
    }

    let connected;
    try {
      connected = await connect(
        "Airdrop tool",
        "Application",
        "localhost",
        null,
        identity ?? null
      );
    } catch (error) {
      console.error(error);
    }

    if (!connected) {
      console.error("Couldn't connect to Beet");
      set({
        connection: null,
        authenticated: null,
        isLinked: null
      });
      return;
    }

    if (identity && identity.identityhash) {
      const { storedConnections } = identitiesStore.getState();

      const storedConnection = storedConnections[identity.identityhash];
      if (storedConnection) {
        connected.beetkey = storedConnection.beetkey;
        connected.next_identification = storedConnection.next_identification;
        connected.secret = storedConnection.secret;
        connected.id = storedConnection.next_identification;
        console.log('updated connected');

        set({
          connection: connected,
          authenticated: true,
          isLinked: true,
        });
        return;
      }
    }

    set({
      connection: connected,
      authenticated: true,
      isLinked: false
    });
    /*
    if (identity) {
      set({ identity });
    }
    */
  },
  link: async (environment) => {
    /**
     * Re/Link to Beet wallet
     * @param {String} environment
     */
    const currentConnection = get().connection;

    let linkAttempt;
    try {
      linkAttempt = await link(environment, currentConnection);
    } catch (error) {
      console.error(error);
      set({ isLinked: null, identity: null });
      return;
    }

    if (!currentConnection.identity) {
      set({ isLinked: null, identity: null });
      return;
    }

    const { storeConnection, setIdentities } = identitiesStore.getState();

    try {
      storeConnection(currentConnection);
    } catch (error) {
      console.log(error);
    }

    const { setAccount } = tempStore.getState();
    try {
      setAccount(currentConnection.identity.requested.account.id);
    } catch (error) {
      console.log(error);
    }

    setIdentities(currentConnection.identity);

    set({ isLinked: true, identity: currentConnection.identity });
  },
  setConnection: (res) => set({ connection: res }),
  setAuthenticated: (auth) => set({ authenticated: auth }),
  setIsLinked: (link) => set({ isLinked: link }),
  setIdentity: (id) => set({ identity: id }),
  reset: () => set({
    connection: null,
    authenticated: null,
    isLinked: null,
    identity: null,
  })
}));

export {
  appStore,
  assetStore,
  beetStore,
  tempStore,
  ticketStore,
  leaderboardStore,
  localePreferenceStore,
  identitiesStore,
  airdropStore,
};
