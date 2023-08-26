import React, { useState } from 'react';
import { Apis } from 'bitsharesjs-ws';
import { Apis as tuscApis } from 'tuscjs-ws';

import { Link } from "react-router-dom";
import {
  Title,
  Card,
  Radio,
  Table,
  Button,
  ActionIcon,
  Group,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import _ from "lodash";

import {
  appStore, ticketStore, leaderboardStore, assetStore
} from '../lib/states';
import { humanReadableFloat, sliceIntoChunks } from '../lib/common';

export default function Fetch(properties) {
  const { t, i18n } = useTranslation();
  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);

  const changeTickets = ticketStore((state) => state.changeTickets);
  const changeLeaders = leaderboardStore((state) => state.changeLeaders);

  const eraseTickets = ticketStore((state) => state.eraseTickets);
  const eraseLeaders = leaderboardStore((state) => state.eraseLeaders);

  const nodes = appStore((state) => state.nodes);
  const changeURL = appStore((state) => state.changeURL);

  const setFees = appStore((state) => state.setFees);
  const resetFees = appStore((state) => state.resetFees);

  const btsAssets = assetStore((state) => state.bitshares);
  const btsTestnetAssets = assetStore((state) => state.bitshares_testnet);
  const tuscAssets = assetStore((state) => state.tusc);
  const changeAssets = assetStore((state) => state.changeAssets);
  const eraseAssets = assetStore((state) => state.eraseAssets);

  const [value, setValue] = useState('bitshares');
  const [inProgress, setInProgress] = useState(false);

  async function execFetch() {
    setInProgress(true);
    console.log("Fetching tickets");

    let currentTickets;
    let currentAssets;
    if (value === 'bitshares') {
      currentTickets = btsTickets;
      currentAssets = btsAssets;
    } else if (value === 'bitshares_testnet') {
      currentTickets = btsTestnetTickets;
      currentAssets = btsTestnetAssets;
    } else if (value === 'tusc') {
      currentTickets = tuscTickets;
      currentAssets = tuscAssets;
    }

    const lastID = currentTickets && currentTickets.length
      ? parseInt((currentTickets.at(-1).id).split("1.18.")[1], 10) + 1
      : 0;

    let updatedTickets;
    try {
      updatedTickets = await window.electron.getTickets(
        nodes[value][0],
        value,
        lastID,
        currentTickets
      );
    } catch (error) {
      console.log(error);
      setInProgress(false);
      return;
    }

    if (!updatedTickets || !updatedTickets.length) {
      setInProgress(false);
      return;
    }

    const mergedTickets = currentTickets.concat(updatedTickets);
    const filteredTickets = mergedTickets.filter((x) => x.current_type !== "liquid");

    // Analysis

    console.log("Tallying data");
    const userTicketQty = {};
    const tallies = {};
    let sum = 0.00000;
    for (let i = 0; i < filteredTickets.length; i++) {
      const currentTicket = filteredTickets[i];
      const { id } = currentTicket;
      const currentAccount = currentTicket.account;
      const ticketType = currentTicket.current_type;
      let currentAmount = parseInt(currentTicket.amount.amount, 10);

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

      if (!Object.prototype.hasOwnProperty.call(tallies, currentAccount)) {
        tallies[currentAccount] = currentAmount;
        userTicketQty[currentAccount] = [id];
        continue;
      }

      tallies[currentAccount] += currentAmount;
      userTicketQty[currentAccount].push(id);
    }

    console.log("Creating leaderboard");
    const leaderboard = [];
    let from = 0;
    for (const key of Object.keys(tallies)) {
      const currentValue = parseFloat(
        humanReadableFloat(
          parseInt(tallies[key], 10),
          5,
        ).toFixed(5),
      );

      leaderboard.push({
        id: key,
        amount: currentValue,
        tickets: userTicketQty[key],
        percent: (currentValue / sum) * 100,
      });
    }

    console.log("Fetching user and blockchain data");

    let fetchedAccounts;
    try {
      fetchedAccounts = await window.electron.fetchAccounts(
        leaderboard,
        value,
        nodes[value][0],
      );
    } catch (error) {
      console.log(error);
      setInProgress(false);
      return;
    }
    const {
      feeResponse,
      fetchedAssets,
      accountResults
    } = await fetchedAccounts;

    if (feeResponse) {
      console.log("Setting blockchain fee schedule")
      setFees(value, feeResponse);
    }

    changeAssets(value, fetchedAssets);

    const sortedLeaderboard = accountResults.sort((a, b) => b.amount - a.amount);

    console.log("Calculating ticket ranges");
    const finalLeaderboard = [];
    for (let i = 0; i < sortedLeaderboard.length; i++) {
      const current = sortedLeaderboard[i];
      current.range = {
        from: parseInt(from, 10),
        to: parseInt(from + current.amount, 10),
      };

      finalLeaderboard.push(current);
      from += current.amount + 1;
    }

    console.log("Finished fetching blockchain data");
    setInProgress(false);
    changeTickets(value, mergedTickets);
    changeLeaders(value, finalLeaderboard);
  }

  return (
    <>
      <Card shadow="md" radius="md" padding="xl">
        <Title order={2} ta="center" mt="sm">
          {t("fetch:topCard.title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("fetch:topCard.label")}
          description={t("fetch:topCard.desc")}
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
                    {t("fetch:topCard.btn1")}
                  </Button>
                )
                : (
                  <Button disabled style={{ marginLeft: '20px' }}>
                    ⏳ {t("fetch:topCard.btn2")}
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
              <th>{t("fetch:secondCard.th1")}</th>
              <th>{t("fetch:secondCard.th2")}</th>
              <th>{t("fetch:secondCard.th3")}</th>
              <th>{t("fetch:secondCard.cached")}</th>
              <th>{t("fetch:secondCard.th4")}</th>
              <th>{t("fetch:secondCard.th5")}</th>
            </tr>
          </thead>
          <tbody>
            <tr key="BTS">
              <td>BTS</td>
              <td>{btsTickets.length}</td>
              <td>
                {
                  btsTickets && btsTickets.length
                    ? (
                      btsTickets
                        .map((x) => x.value)
                        .reduce((partialSum, a) => parseInt(partialSum, 10) + parseInt(a, 10), 0) / 100000
                    ).toFixed(0)
                    : 0
                }
              </td>
              <td>
                {
                  btsAssets && btsAssets.length
                    ? btsAssets.length
                    : 0
                }
              </td>
              <td>
                {
                    btsTickets.length
                      ? (
                        <Link style={{ textDecoration: 'none' }} to="../Tickets/bitshares">
                          <ActionIcon>📄</ActionIcon>
                        </Link>
                      )
                      : null
                }
              </td>
              <td>
                {
                  btsTickets.length
                    ? (
                        <ActionIcon onClick={() => {
                          eraseTickets('bitshares');
                          eraseLeaders('bitshares');
                          eraseAssets('bitshares');
                          resetFees('bitshares');
                        }}
                        >
                          ❌
                        </ActionIcon>
                    )
                    : null
                }

              </td>
            </tr>
            <tr key="BTS_TEST">
              <td>BTS_TEST</td>
              <td>{btsTestnetTickets.length}</td>
              <td>
                {
                  btsTestnetTickets.length
                    ? (
                      btsTestnetTickets
                        .map((x) => x.value)
                        .reduce((partialSum, a) => parseInt(partialSum, 10) + parseInt(a, 10), 0)
                        / 100000 // TODO: Swap for human readable formula
                    ).toFixed(0)
                    : 0
                }
              </td>
              <td>
                {
                  btsTestnetAssets && btsTestnetAssets.length
                    ? btsTestnetAssets.length
                    : 0
                }
              </td>
              <td>
                {
                  btsTestnetTickets.length
                    ? (
                      <Link style={{ textDecoration: 'none' }} to="../Tickets/bitshares_testnet">
                        <ActionIcon>📄</ActionIcon>
                      </Link>
                    )
                    : null
                }
              </td>
              <td>
                {
                  btsTestnetTickets.length
                    ? (
                      <ActionIcon onClick={() => {
                        eraseTickets('bitshares_testnet');
                        eraseLeaders('bitshares_testnet');
                        eraseAssets('bitshares_testnet');
                        resetFees('bitshares_testnet');
                      }}
                      >
                        ❌
                      </ActionIcon>
                    )
                    : null
                }
              </td>
            </tr>
            <tr key="TUSC">
              <td>TUSC</td>
              <td>{tuscTickets.length}</td>
              <td>
                {
                  tuscTickets.length
                    ? (
                      tuscTickets
                        .map((x) => x.value)
                        .reduce((partialSum, a) => parseInt(partialSum, 10) + parseInt(a, 10), 0)
                        / 100000
                    ).toFixed(0)
                    : 0
                }
              </td>
              <td>
                {
                  tuscAssets && tuscAssets.length
                    ? tuscAssets.length
                    : 0
                }
              </td>
              <td>
                {
                  tuscTickets.length
                    ? (
                      <Link style={{ textDecoration: 'none' }} to="../Tickets/tusc">
                        <ActionIcon>📄</ActionIcon>
                      </Link>
                    )
                    : null
                }
              </td>
              <td>
                {
                  tuscTickets.length
                    ? (
                      <ActionIcon onClick={() => {
                        eraseTickets('tusc');
                        eraseLeaders('tusc');
                        eraseAssets('tusc');
                        resetFees('tusc');
                      }}
                      >
                        ❌
                      </ActionIcon>
                    )
                    : null
                }
              </td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </>
  );
}
