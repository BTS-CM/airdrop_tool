import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connect, checkBeet, link } from 'beet-js';

import { testNodes } from './stateQueries';
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
        console.log(`Erasing ${env} tickets!`)
        if (env === 'bitshares') {
          set({ bitshares: [] });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: [] });
        } else if (env === 'tusc') {
          set({ tusc: [] });
        }
      }
    }),
    {
      name: 'ticketStorage',
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
        console.log(`Erasing ${env} leaderboards!`)
        if (env === 'bitshares') {
          set({ bitshares: [] });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: [] });
        } else if (env === 'tusc') {
          set({ tusc: [] });
        }
      }
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
        console.log(`Erasing all ${env} airdrops!`)
        if (env === 'bitshares') {
          set({ bitshares: [] });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: [] });
        } else if (env === 'tusc') {
          set({ tusc: [] });
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

        let newAirdrops = currentAirdrops.filter(x => x.id != airdropID);

        if (env === 'bitshares') {
          set({ bitshares: newAirdrops });
        } else if (env === 'bitshares_testnet') {
          set({ bitshares_testnet: newAirdrops });
        } else if (env === 'tusc') {
          set({ tusc: newAirdrops });
        }
      }
    }),
    {
      name: 'airdropStorage',
    },
  ),
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
        tusc: config.tusc.nodeList.map((node) => node.url)
      },
      setNodes: async (env) => {
        /**
         * Testing then storing the bitshares nodes for blockchain queries
         */  
        let response;
        try {
          response = await testNodes(env);
        } catch (error) {
          console.log(error);
          return;
        }

        if (response) {
          if (env === 'bitshares') {
            set(async (state) => ({
              nodes: { ...state.nodes, bitshares: await response },
            }))
          } else if (env === 'bitshares_testnet') {
            set(async (state) => ({
              nodes: { ...state.nodes, bitshares_testnet: await response },
            }))
          } else if (env === 'tusc') {
            set(async (state) => ({
              nodes: { ...state.nodes, tusc: await response },
            }))
          }
        }
      },
      replaceNodes: (env, nodes) => {
        console.log({env, nodes})
        if (env === 'bitshares') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares: nodes },
          }))
        } else if (env === 'bitshares_testnet') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodes },
          }))
        } else if (env === 'tusc') {
          set(async (state) => ({
            nodes: { ...state.nodes, tusc: nodes },
          }))
        }
      },
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
          }))
        } else if (env === 'bitshares_testnet') {
          set(async (state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodesToChange },
          }))
        } else if (env === 'tusc') {
          set(async (state) => ({
            nodes: { ...state.nodes, tusc: nodesToChange },
          }))
        }

      },
      reset: () => set({
        nodes: {
          bitshares: [],
          bitshares_testnet: [],
          tusc: []
        }
      }),
      removeURL: (env, url) => {
        let nodesToChange = get().nodes[env];
        nodesToChange = nodesToChange.filter(x => x !== url);
        
        if (env === 'bitshares') {
          set((state) => ({
            nodes: { ...state.nodes, bitshares: nodesToChange },
          }))
        } else if (env === 'bitshares_testnet') {
          set((state) => ({
            nodes: { ...state.nodes, bitshares_testnet: nodesToChange },
          }))
        } else if (env === 'tusc') {
          set((state) => ({
            nodes: { ...state.nodes, tusc: nodesToChange },
          }))
        }
      },
    }),
    {
        name: 'nodeStorage',
    }
  )
);

export {
  appStore,
  ticketStore,
  leaderboardStore,
  localePreferenceStore,
  airdropStore
};
