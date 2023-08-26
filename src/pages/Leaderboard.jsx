import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Title,
  Badge,
  Card,
  Radio,
  Table,
  Accordion,
  JsonInput,
  Group,
} from '@mantine/core';

import { leaderboardStore } from '../lib/states';

export default function Leaderboard(properties) {
  const { t, i18n } = useTranslation();
  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const [value, setValue] = useState('bitshares');

  let assetName = "1.3.0";
  let titleName = "token";
  let leaderboardJSON = [];
  if (value === 'bitshares') {
    leaderboardJSON = btsLeaderboard;
    assetName = "BTS";
    titleName = "Bitshares";
  } else if (value === 'bitshares_testnet') {
    leaderboardJSON = btsTestnetLeaderboard;
    assetName = "TEST";
    titleName = "Bitshares (Testnet)";
  } else if (value === 'tusc') {
    leaderboardJSON = tuscLeaderboard;
    assetName = "TUSC";
    titleName = "TUSC";
  }

  const tableRows = leaderboardJSON.map((ticket) => (
    <tr key={ticket.id}>
      <td>
        <Link style={{ textDecoration: 'none' }} to={`/Account/${value}/${ticket.id}`}>
          {ticket.account.name}<br />
          ({ticket.id})
        </Link>
      </td>
      <td>{ticket.amount}</td>
      <td width={200}>
        {
          ticket.tickets.map((id) => (
            <Link style={{ textDecoration: 'none' }} key={`bTicket_${id}`} to={`/Ticket/${value}/${id}`}>
              <Badge style={{ margin: '1px' }}>{id}</Badge>
            </Link>
          ))
        }
      </td>
      <td>{ticket.percent.toFixed(5)}</td>
      <td>{ticket.range.from}</td>
      <td>{ticket.range.to}</td>
    </tr>
  ));

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("leaderboard:title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("leaderboard:radio.label")}
          description={t("leaderboard:radio.desc")}
          withAsterisk
        >
          <Group mt="xs">
            <Radio value="bitshares" label="Bitshares" />
            <Radio value="bitshares_testnet" label="Bitshares (Testnet)" />
            <Radio value="tusc" label="TUSC" />
          </Group>
        </Radio.Group>
      </Card>

      {
        !tableRows || !tableRows.length
          ? null
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Accordion>
                <Accordion.Item key="json" value="leaderboard_json">
                  <Accordion.Control>
                    {titleName}
                    {' '}
                    {t("leaderboard:json")}
                  </Accordion.Control>
                  <Accordion.Panel style={{ backgroundColor: '#FAFAFA' }}>
                    <JsonInput
                      placeholder="Textarea will autosize to fit the content"
                      defaultValue={JSON.stringify(leaderboardJSON)}
                      validationError="Invalid JSON"
                      formatOnBlur
                      autosize
                      minRows={4}
                      maxRows={15}
                    />
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Card>
          )
      }

      {
        !tableRows || !tableRows.length
          ? (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={3} ta="center" mt="sm">
                {t("leaderboard:table.none")}
              </Title>
            </Card>
          )
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Table>
                <thead>
                  <tr>
                    <th>{t("leaderboard:table.th1")}</th>
                    <th>{t("leaderboard:table.th2")}</th>
                    <th>{t("leaderboard:table.th3")}</th>
                    <th>{t("leaderboard:table.th4")}</th>
                    <th>{t("leaderboard:table.th5")}</th>
                    <th>{t("leaderboard:table.th6")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows}
                </tbody>
              </Table>
            </Card>
          )
      }
    </>
  );
}
