import React, { useState } from 'react';
import { Apis } from 'bitsharesjs-ws';
import { Apis as tuscApis } from 'tuscjs-ws';

import { Link } from "react-router-dom";
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
  Loader,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import _ from "lodash";

import {
  appStore, ticketStore, leaderboardStore, assetStore
} from '../lib/states';
import { humanReadableFloat, sliceIntoChunks } from '../lib/common';
import { lookupSymbols } from '../lib/directQueries';

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

    try {
      if (value === 'tusc') {
        await tuscApis.instance(nodes[value][0], true).init_promise;
      } else {
        await Apis.instance(nodes[value][0], true).init_promise;
      }
    } catch (error) {
      console.log(error);
      changeURL(value);
      return;
    }

    const ids = [];
    const updatedTickets = [];
    for (let i = 0; i < 100; i++) {
      let response;
      try {
        if (value === 'tusc') {
          response = await tuscApis.instance().db_api().exec("list_tickets", [100, `1.18.${lastID + (i * 100)}`]);
        } else {
          response = await Apis.instance().db_api().exec("list_tickets", [100, `1.18.${lastID + (i * 100)}`]);
        }
      } catch (error) {
        console.log(error);
        break;
      }

      if (!response || !response.length) {
        console.log("no response");
        break;
      }

      for (let k = 0; k < response.length; k++) {
        if (!currentTickets.find((x) => x.id === response[k].id)) {
          if (!ids.includes(response[k].id)) {
            ids.push(response[k].id);
            updatedTickets.push(response[k]);
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

    console.log("Fetching user balances");

    let assetsToFetch = [];
    const accountResults = [];
    const leaderboardBatches = _.chunk(
      leaderboard,
      value === 'bitshares'
        ? 50
        : 10
    );
    for (let i = 0; i < leaderboardBatches.length; i++) {
      let currentBatch = leaderboardBatches[i];
      const accountIDs = currentBatch.map((user) => user.id);
      let fetchedAccounts;
      try {
        if (value === 'tusc') {
          fetchedAccounts = await tuscApis.instance().db_api().exec("get_full_accounts", [accountIDs, false]).then((results) => {
            if (results && results.length) {
              return results;
            }
          });
        } else {
          fetchedAccounts = await Apis.instance().db_api().exec("get_full_accounts", [accountIDs, false]).then((results) => {
            if (results && results.length) {
              return results;
            }
          });
        }
      } catch (error) {
        console.log(error);
        continue;
      }

      // eslint-disable-next-line no-loop-func
      currentBatch = currentBatch.map((user) => {
        const foundAccount = fetchedAccounts.find((acc) => acc[0] === user.id)[1];
        const foundAssets = foundAccount.balances.map((balance) => balance.asset_type);
        assetsToFetch = assetsToFetch.concat(foundAssets);

        return {
          ...user,
          balances: foundAccount.balances.map((balance) => ({
            amount: balance.balance, asset_id: balance.asset_type
          })),
          account: {
            name: foundAccount.account.name,
            ltm: foundAccount.account.id === foundAccount.account.lifetime_referrer,
            creation_time: foundAccount.account.creation_time,
            assets: foundAccount.assets
          }
        };
      });

      if (fetchedAccounts && fetchedAccounts.length) {
        accountResults.push(...currentBatch);
      }
    }

    // assetsToFetch
    let fetchedAssets = [];
    const fetchableAssetChunks = sliceIntoChunks([...new Set(assetsToFetch)], 50);
    for (let i = 0; i < fetchableAssetChunks.length; i++) {
      const currentChunk = fetchableAssetChunks[i];
      let theseSymbols;
      try {
        theseSymbols = await lookupSymbols("", value, currentChunk, true);
      } catch (error) {
        console.log(error);
        return;
      }

      if (!theseSymbols || !theseSymbols.length) {
        return;
      }

      const requiredInfo = theseSymbols
        .map((q) => ({
          id: q.id,
          symbol: q.symbol,
          precision: q.precision,
          issuer: q.issuer,
          options: {
            max_supply: q.options.max_supply
          },
          dynamic_asset_data_id: q.dynamic_asset_data_id
        }));
      fetchedAssets = fetchedAssets.concat(requiredInfo);
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
                      : <a>⛔</a>
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
                        }}
                        >
                          ❌
                        </ActionIcon>
                    )
                    : (<ActionIcon disabled>❌</ActionIcon>)
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
                    : <a>⛔</a>
                }
              </td>
              <td>
                <ActionIcon onClick={() => {
                  eraseTickets('bitshares_testnet');
                  eraseLeaders('bitshares_testnet');
                  eraseAssets('bitshares_testnet');
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
                                  : <a>⛔</a>
                            }
              </td>
              <td>
                <ActionIcon onClick={() => {
                  eraseTickets('tusc');
                  eraseLeaders('tusc');
                  eraseAssets('tusc');
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
