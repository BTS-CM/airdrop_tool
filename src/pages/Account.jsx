import React, { useState } from 'react';
import {
  Text,
  SimpleGrid,
  Card,
  Table,
  Button,
  ScrollArea,
  Loader,
} from '@mantine/core';
import { HiOutlineChartPie } from "react-icons/hi";
import { useTranslation } from 'react-i18next';
import { Link, useParams } from "react-router-dom";

import {
  appStore, ticketStore, leaderboardStore, assetStore
} from '../lib/states';
import { humanReadableFloat } from '../lib/common';

export default function Account(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares_testnet);
  const tuscTickets = ticketStore((state) => state.tusc);

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const btsAssets = assetStore((state) => state.bitshares);
  const btsTestnetAssets = assetStore((state) => state.bitshares_testnet);
  const tuscAssets = assetStore((state) => state.tusc);

  const [inProgress, setInProgress] = useState(false);

  let currentLeaderboard = [];
  let assetName = "";
  let chainName = "";
  let targetJSON = [];
  let cachedAssets = [];
  if (params.env === 'bitshares') {
    targetJSON = btsTickets;
    currentLeaderboard = btsLeaderboard;
    assetName = "BTS";
    chainName = "Bitshares";
    cachedAssets = btsAssets;
  } else if (params.env === 'bitshares_testnet') {
    targetJSON = btsTestnetTickets;
    currentLeaderboard = btsTestnetLeaderboard;
    assetName = "TEST";
    chainName = "Bitshares (Testnet)";
    cachedAssets = btsTestnetAssets;
  } else if (params.env === 'tusc') {
    targetJSON = tuscTickets;
    currentLeaderboard = tuscLeaderboard;
    assetName = "TUSC";
    chainName = "TUSC";
    cachedAssets = tuscAssets;
  }

  const currentAccount = currentLeaderboard.find((x) => x.id === params.id);

  const accountBalanceRows = currentAccount && currentAccount.balances.length
    ? currentAccount.balances.map((x) => {
      const thisAsset = cachedAssets.find((a) => a.id === x.asset_id);
      const currentReadableFloat = parseFloat(
        humanReadableFloat(x.amount, thisAsset.precision)
          .toFixed(thisAsset.precision)
      );

      if (!currentReadableFloat) {
        return null;
      }

      return (
          <tr>
            <td>
              <Link style={{ textDecoration: 'none', color: 'black' }} key={x.asset_id} to={`/Asset/${params.env}/${x.asset_id}`}>
                <b>{thisAsset.symbol}</b>
              </Link>
              <br />
              ({x.asset_id})
            </td>
            <td>
              { currentReadableFloat }
            </td>
          </tr>
      );
    })
    : null;

  const retrievedAccountTickets = targetJSON.filter((x) => x.account === params.id);

  const tableRows = retrievedAccountTickets.map((ticket) => (
    <tr key={ticket.id}>
      <td>
        <Link to={`/Ticket/${params.env}/${ticket.id}`} style={{ textDecoration: 'none' }}>
          {ticket.id}
        </Link>
      </td>
      <td>
        {ticket.account}
      </td>
      <td>{ticket.current_type}</td>
      <td>{ticket.target_type}</td>
      <td>
        {
          ticket.amount.amount > 1
            ? parseFloat(humanReadableFloat(ticket.amount.amount, 5).toFixed(5))
            : ticket.amount.amount
        }
        {' '}
        {assetName}
      </td>
      <td>{ticket.status}</td>
      <td>
        {
          ticket.value > 1
            ? parseFloat(humanReadableFloat(ticket.value, 5).toFixed(5))
            : ticket.value
        }
        {' '}
        {assetName}
      </td>
      <td>{ticket.next_auto_update_time}</td>
      <td>{ticket.next_type_downgrade_time}</td>
    </tr>
  ));

  const validTickets = retrievedAccountTickets.map((ticket) => {
    if (ticket.current_type !== "liquid") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const smallLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_180_days") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const medLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_360_days") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const lgLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_720_days") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const xlLock = validTickets.map((ticket) => {
    if (ticket.current_type === "lock_forever") {
      return ticket;
    }
    return null;
  }).filter((x) => x);

  const lockedQuantity = humanReadableFloat(
    validTickets
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const smallLocked = humanReadableFloat(
    smallLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const medLocked = humanReadableFloat(
    medLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const lgLocked = humanReadableFloat(
    lgLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const xlLocked = humanReadableFloat(
    xlLock
      .map((ticket) => parseInt(ticket.amount.amount, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  const boostedValue = humanReadableFloat(
    validTickets
      .map((ticket) => parseInt(ticket.value, 10))
      .reduce((accumulator, ticket) => accumulator + parseInt(ticket, 10), 0),
    5,
  );

  return (
    <>
      <SimpleGrid cols={2} spacing="xl" breakpoints={[{ maxWidth: 'md', cols: 2 }]}>
        <SimpleGrid cols={2} spacing="xl" mt={25} breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {`${assetName} ${t('account:locked')}`}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {lockedQuantity}
            </Text>
          </Card>
          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {`${assetName} ${t('account:values')}`}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {boostedValue}
            </Text>
          </Card>
          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {t('account:created')}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {retrievedAccountTickets.length}
            </Text>
          </Card>
          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {t('account:active')}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {validTickets.length}
            </Text>
          </Card>

          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {t('account:smallLock')}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {smallLock.length}
              {' '}
              {t('account:tickets')}
              {` (${validTickets.length ? ((smallLock.length / validTickets.length) * 100).toFixed(2) : 0} %)`}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${smallLocked} ${assetName} ${t('account:locked')}`}
              {` (${lockedQuantity ? ((smallLocked / lockedQuantity) * 100).toFixed(2) : 0} %)`}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${smallLocked * 2} ${assetName} ${t('account:voteWeight')}`}
            </Text>
            <Text fz="xs" c="dimmed" mt="sm">
              {t('account:smallBoost')}
            </Text>
          </Card>
          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {t('account:medLock')}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${medLock.length} ${t('account:tickets')} (`}
              {validTickets.length ? ((medLock.length / validTickets.length) * 100).toFixed(2) : 0}
              {' %)'}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${medLocked} ${assetName} ${t('account:locked')} (`}
              {lockedQuantity ? ((medLocked / lockedQuantity) * 100).toFixed(2) : 0}
              {' %)'}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${medLocked * 4} ${assetName} ${t('account:voteWeight')}`}
            </Text>
            <Text fz="xs" c="dimmed" mt="sm">
              {t('account:medBoost')}
            </Text>
          </Card>
          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {t('account:lgLock')}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${lgLock.length} ${t('account:tickets')} (`}
              {validTickets.length ? ((lgLock.length / validTickets.length) * 100).toFixed(2) : 0}
              {' %)'}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${lgLocked} ${assetName} ${t('account:locked')} (`}
              {lockedQuantity ? ((lgLocked / lockedQuantity) * 100).toFixed(2) : 0}
              {' %)'}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${lgLocked * 8} ${assetName} ${t('account:voteWeight')}`}
            </Text>
            <Text fz="xs" c="dimmed" mt="sm">
              {t('account:lgBoost')}
            </Text>
          </Card>
          <Card shadow="md" radius="md" padding="xl">
            <Text fz="lg" fw={500} mt="md">
              {t('account:xlLock')}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${xlLock.length} ${t('account:tickets')} (`}
              {validTickets.length ? ((xlLock.length / validTickets.length) * 100).toFixed(2) : 0}
              {' %)'}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${xlLocked} ${assetName} ${t('account:locked')}(`}
              {lockedQuantity ? ((xlLocked / lockedQuantity) * 100).toFixed(2) : 0}
              {' %)'}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {`${xlLocked * 8} ${assetName} ${t('account:voteWeight')}`}
            </Text>
            <Text fz="xs" c="dimmed" mt="sm">
              {t('account:xlBoost')}
            </Text>
          </Card>
        </SimpleGrid>
        <SimpleGrid cols={1} mt={25} breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
          {
            !currentAccount && inProgress
              ? (
                <Card shadow="md" radius="md" padding="xl">
                    <Loader />
                    <Text>
                      {t('account:loadingAccount')}
                    </Text>
                </Card>
              )
              : null
          }
          {
            !currentAccount
              ? (
                <Card shadow="md" radius="md">
                  <Text fz="lg" fw={500} mt="md">
                    {`${chainName} account details`}
                  </Text>
                  <Text>
                    {t("account:disqualified", { id: params.id })}
                  </Text>
                  <Text>
                    {t("account:disqualifiedText")}
                  </Text>
                </Card>
              )
              : null
          }
          {
            currentAccount
              ? (
                <Card shadow="md" radius="md">
                  <Text fz="lg" fw={500} mt="md">
                    {`${chainName} account details`}
                  </Text>
                  <Text>
                    {`${currentAccount.account.name} (${params.id})`}
                  </Text>
                  <Text>
                    LTM: {currentAccount.account.ltm ? 'True' : 'False'} {
                      currentAccount.account.ltm
                        ? null
                        : (
                            <Link to={`/upgrade/${params.env}/${params.id}`}>
                              <Button ml="xs" compact variant="outline" color="green">
                                {t("account:upgrade")}
                              </Button>
                            </Link>
                        )
                    }
                  </Text>
                  {
                    currentAccount.account.creation_time
                      ? (
                        <Text>
                          {t('account:createTime')}: {currentAccount.account.creation_time}
                        </Text>
                      )
                      : null
                  }
                  {
                    accountBalanceRows
                      ? (
                          <Text>
                            {t('account:qtyTokens')}: {accountBalanceRows.length}
                          </Text>
                      )
                      : (
                          <Text>
                            {t('account:untracked')}
                          </Text>
                      )
                  }
                  <Text>
                    {t('account:assetsCreated')}: {currentAccount.account.assets.length}
                  </Text>
                </Card>
              )
              : null
          }
          {
            accountBalanceRows && accountBalanceRows.length
              ? (
                <Card shadow="md" radius="md">
                  <Text fz="lg" fw={500} mt="md">
                    {t('account:accountBalances')}
                  </Text>
                  <ScrollArea h={475}>
                    <Table highlightOnHover>
                      <thead>
                        <tr>
                          <th>
                            {t('account:assetTable.th1')}
                          </th>
                          <th>
                            {t('account:assetTable.th2')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountBalanceRows}
                      </tbody>
                    </Table>
                  </ScrollArea>
                </Card>
              )
              : null
          }
        </SimpleGrid>
      </SimpleGrid>

      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <ScrollArea h={300}>
          <Table>
            <thead>
              <tr>
                <th>{t('account:table.th1')}</th>
                <th>{t('account:table.th2')}</th>
                <th>{t('account:table.th3')}</th>
                <th>{t('account:table.th4')}</th>
                <th>{t('account:table.th5')}</th>
                <th>{t('account:table.th6')}</th>
                <th>{t('account:table.th7')}</th>
                <th>{t('account:table.th8')}</th>
                <th>{t('account:table.th9')}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </Table>
        </ScrollArea>
      </Card>

      <SimpleGrid cols={1} spacing="xl" mt={50} ml={75} mr={75}>
        <Card ta="center" shadow="md" radius="md" padding="xl">
          <Text fz="lg" fw={500} mt="md">
            <HiOutlineChartPie />
            {' '}
            {t('account:footer.title')}
          </Text>
          <Text fz="sm" c="dimmed" m="sm">
            {`${t('account:footer.create')} ${chainName} ${t('account:footer.blockchain')}`}
          </Text>
          <Link to={`/Create/${params.env}/${params.id}`}>
            <Button m="sm">
              {t('account:footer.button')}
            </Button>
          </Link>
        </Card>
      </SimpleGrid>
    </>
  );
}
