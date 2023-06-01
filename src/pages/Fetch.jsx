import React, { useState } from 'react';
import { Apis } from 'bitsharesjs-ws';
import { Link } from "wouter";
import {
  Title,
  Text,
  SimpleGrid,
  Card,
  Radio,
  Table,
  Button,
  ActionIcon,
  Group,
} from '@mantine/core';

import { appStore, ticketStore, leaderboardStore } from '../lib/states';

function humanReadableFloat(satoshis, precision) {
  return satoshis / 10 ** precision;
}

export default function Fetch(properties) {
  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);

  const changeTickets = ticketStore((state) => state.changeTickets);
  const changeLeaders = leaderboardStore((state) => state.changeLeaders);

  const eraseTickets = ticketStore((state) => state.eraseTickets);
  const eraseLeaders = leaderboardStore((state) => state.eraseLeaders);

  const nodes = appStore((state) => state.nodes);
  const changeURL = appStore((state) => state.changeURL);

  const [value, setValue] = useState('bitshares');
  const [inProgress, setInProgress] = useState(false);

  /**
     * Retrieve the object contents
     * @param {String} fromID (next ticket id)
     * @returns {Object}
     */
  async function fetchObjects(fromID) {
    return new Promise(async (resolve, reject) => {
      console.log("Fetching tickets");
      try {
        await Apis.instance(nodes[value][0], true).init_promise;
      } catch (error) {
        console.log(error);
        changeURL(value);
        return reject({
          error, location: 'init', node: nodes[value][0], env: value,
        });
      }

      let object;
      try {
        object = await Apis.instance().db_api().exec("list_tickets", [100, fromID]);
      } catch (error) {
        console.log(error);
        return reject({
          error, location: 'exec', node: nodes[value][0], env: value,
        });
      }

      return resolve(object);
    });
  }

  async function execFetch() {
    setInProgress(true);
    console.log("Fetching tickets");

    let currentTickets;
    if (value == 'bitshares') {
      currentTickets = btsTickets;
    } else if (value == 'bitshares_testnet') {
      currentTickets = btsTestnetTickets;
    } else if (value == 'tusc') {
      currentTickets = tuscTickets;
    }

    const lastID = currentTickets && currentTickets.length
      ? parseInt((currentTickets.at(-1).id).split("1.18.")[1]) + 1
      : 0;

    const ids = [];
    const updatedTickets = [];
    for (let i = 0; i < 100; i++) {
      let response;
      try {
        response = await fetchObjects(`1.18.${lastID + (i * 100)}`);
      } catch (error) {
        console.log(error);
        break;
      }

      if (!response || !response.length) {
        console.log("no response");
        break;
      }

      for (let i = 0; i < response.length; i++) {
        if (!currentTickets.find((x) => x.id === response[i].id)) {
          if (!ids.includes(response[i].id)) {
            ids.push(response[i].id);
            updatedTickets.push(response[i]);
          }
        }
      }

      if (response.length < 100) {
        console.log(`Finished fetching ${updatedTickets.length} tickets!`);
        break;
      }
    }

    if (!updatedTickets.length) {
      setInProgress(false);
      return;
    }

    const mergedTickets = currentTickets.concat(updatedTickets);
    changeTickets(value, mergedTickets);

    // Now calculating and storing this blockchain's leaderboard in persistant zustand state

    const filteredTickets = mergedTickets.filter((x) => x.current_type != "liquid");

    const userTicketQty = {};
    const tallies = {};
    let sum = 0.00000;

    for (let i = 0; i < filteredTickets.length; i++) {
      const currentTicket = filteredTickets[i];
      const { id } = currentTicket;
      const currentAccount = currentTicket.account;
      const ticketType = currentTicket.current_type;
      let currentAmount = parseInt(currentTicket.amount.amount);

      if (ticketType === "lock_180_days") {
        currentAmount *= 2;
      } else if (ticketType === "lock_360_days") {
        currentAmount *= 4;
      } else if (ticketType === "lock_720_days") {
        currentAmount *= 8;
      } else if (ticketType === "lock_forever") {
        currentAmount *= 8;
      } else {
        currentAmount = 0;
      }

      sum += parseFloat(humanReadableFloat(currentAmount, 5).toFixed(5));

      if (!tallies.hasOwnProperty(currentAccount)) {
        tallies[currentAccount] = currentAmount;
        userTicketQty[currentAccount] = [id];
      } else {
        tallies[currentAccount] += currentAmount;
        userTicketQty[currentAccount].push(id);
      }
    }

    const leaderboard = [];
    let from = 0;
    for (const key of Object.keys(tallies)) {
      const currentValue = parseFloat(humanReadableFloat(parseInt(tallies[key]), 5).toFixed(5));

      leaderboard.push({
        id: key,
        amount: currentValue,
        tickets: userTicketQty[key],
        percent: (currentValue / sum) * 100,
      });
    }

    const sortedLeaderboard = leaderboard.sort((a, b) => b.amount - a.amount);

    const finalLeaderboard = [];
    for (let i = 0; i < sortedLeaderboard.length; i++) {
      const current = sortedLeaderboard[i];
      current.range = {
        from: parseInt(from),
        to: parseInt(from + current.amount),
      };
      finalLeaderboard.push(current);
      from += current.amount + 1;
    }

    changeLeaders(value, finalLeaderboard);
    setInProgress(false);
  }

  return (
    <>
      <Card shadow="md" radius="md" padding="xl">
        <Title order={2} ta="center" mt="sm">
          Fetch tickets from the blockchain
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label="Select the target blockchain"
          description="Graphene based blockchains only"
          withAsterisk
        >
          <Group mt="xs">
            {
                        !inProgress
                          ? <Radio value="bitshares" label="Bitshares" />
                          : <Radio disabled value="bitshares" label="Bitshares" />
                    }
            {
                        !inProgress
                          ? <Radio value="bitshares_testnet" label="Bitshares (Testnet)" />
                          : <Radio disabled value="bitshares_testnet" label="Bitshares (Testnet)" />
                    }
            {
                        !inProgress
                          ? <Radio value="tusc" label="TUSC" />
                          : <Radio disabled value="tusc" label="TUSC" />
                    }
            {
                        !inProgress
                          ? (
                            <Button onClick={() => execFetch()} style={{ marginLeft: '20px' }}>
                              Fetch tickets
                            </Button>
                          )
                          : (
                            <Button disabled style={{ marginLeft: '20px' }}>
                              ⏳ Fetching
                            </Button>
                          )
                    }

          </Group>
        </Radio.Group>
      </Card>

      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Table>
          <thead>
            <tr>
              <th>Blockchain</th>
              <th>Tickets</th>
              <th>Quantity tokens locked</th>
              <th>JSON</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            <tr key="BTS">
              <td>BTS</td>
              <td>{btsTickets.length}</td>
              <td>
                {
                                btsTickets.length
                                  ? (btsTickets.map((x) => x.value).reduce((partialSum, a) => parseInt(partialSum) + parseInt(a), 0) / 100000).toFixed(0)
                                  : 0
                            }
              </td>
              <td>
                {
                                btsTickets.length
                                  ? (
                                    <Link href="../Tickets/bitshares">
                                      <ActionIcon>📄</ActionIcon>
                                    </Link>
                                  )
                                  : <a>⛔</a>
                            }
              </td>
              <td>
                <ActionIcon onClick={() => {
                  eraseTickets('bitshares');
                  eraseLeaders('bitshares');
                }}
                >
                  ❌
                </ActionIcon>
              </td>
            </tr>
            <tr key="BTS_TEST">
              <td>BTS_TEST</td>
              <td>{btsTestnetTickets.length}</td>
              <td>
                {
                                btsTestnetTickets.length
                                  ? (btsTestnetTickets.map((x) => x.value).reduce((partialSum, a) => parseInt(partialSum) + parseInt(a), 0) / 100000).toFixed(0)
                                  : 0
                            }
              </td>
              <td>
                {
                                btsTestnetTickets.length
                                  ? (
                                    <Link href="../Tickets/bitshares_testnet">
                                      <ActionIcon>📄</ActionIcon>
                                    </Link>
                                  )
                                  : <a>⛔</a>
                            }
              </td>
              <td>
                <ActionIcon onClick={() => {
                  eraseTickets('bitshares_testnet');
                  eraseLeaders('bitshares_testnet');
                }}
                >
                  ❌
                </ActionIcon>
              </td>
            </tr>
            <tr key="TUSC">
              <td>TUSC</td>
              <td>{tuscTickets.length}</td>
              <td>
                {
                                tuscTickets.length
                                  ? (tuscTickets.map((x) => x.value).reduce((partialSum, a) => parseInt(partialSum) + parseInt(a), 0) / 100000).toFixed(0)
                                  : 0
                            }
              </td>
              <td>
                {
                                tuscTickets.length
                                  ? (
                                    <Link href="../Tickets/tusc">
                                      <ActionIcon>📄</ActionIcon>
                                    </Link>
                                  )
                                  : <a>⛔</a>
                            }
              </td>
              <td>
                <ActionIcon onClick={() => {
                  eraseTickets('tusc');
                  eraseLeaders('tusc');
                }}
                >
                  ❌
                </ActionIcon>
              </td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </>
  );
}
