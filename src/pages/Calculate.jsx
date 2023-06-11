/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Apis } from 'bitsharesjs-ws';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

import {
  Title,
  Text,
  SimpleGrid,
  Badge,
  Card,
  Radio,
  Table,
  Button,
  ScrollArea,
  Checkbox,
  Group,
  TextInput,
} from '@mantine/core';
import blake from 'blakejs';

import { executeCalculation } from '../lib/algos';
import { appStore, leaderboardStore, airdropStore, ticketStore } from '../lib/states';

export default function Calculate(properties) {
  const { t, i18n } = useTranslation();
  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const btsTickets = ticketStore((state) => state.bitshares);
  const btsTestnetTickets = ticketStore((state) => state.bitshares);
  const tuscTickets = ticketStore((state) => state.bitshares);

  const nodes = appStore((state) => state.nodes);
  const changeURL = appStore((state) => state.changeURL);
  const changeAirdrops = airdropStore((state) => state.changeAirdrops);

  const [value, setValue] = useState('bitshares');
  const [hash, setHash] = useState('plain');

  const [randID, setRandID] = useState('none');

  const [blockNumber, onBlockNumber] = useState(1000);
  const [selection, setSelection] = useState([]);

  const [deduplicate, setDeduplicate] = useState("Yes");
  const [alwaysWinning, setAlwaysWinning] = useState("Yes");

  const [progress, setProgress] = useState('planning'); // planning, calculating, completed

  const calculationTypes = [
    'forward',
    'reverse',
    'pi',
    'reverse_pi',
    'cubed',
    'bouncing_ball',
    'alien_blood',
    'avg_point_lines',
    'freebie',
    'forever_freebie',
  ]
    .map((x) => ({
      name: t(`calculate:calcs.${x}.name`),
      value: x,
      desc: t(`calculate:calcs.${x}.desc`)
    }));

  const toggleRow = (id) => setSelection(
    (current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  );

  let assetName = "1.3.0";
  let leaderboardJSON = [];
  let relevantTickets = [];
  if (value === 'bitshares') {
    leaderboardJSON = btsLeaderboard;
    relevantTickets = btsTickets;
    assetName = "BTS";
  } else if (value === 'bitshares_testnet') {
    leaderboardJSON = btsTestnetLeaderboard;
    relevantTickets = btsTestnetTickets;
    assetName = "TEST";
  } else if (value === 'tusc') {
    leaderboardJSON = tuscLeaderboard;
    relevantTickets = tuscTickets;
    assetName = "TUSC";
  }

  const rows = calculationTypes.map((item) => {
    const selected = selection.includes(item.value);
    return (
      <tr key={item.value}>
        <td>
          <Checkbox
            checked={selection.includes(item.value)}
            onChange={() => toggleRow(item.value)}
            transitionDuration={0}
          />
        </td>
        <td>
          <Group spacing="sm">
            <Text size="sm" weight={500}>
              {item.name}
            </Text>
          </Group>
        </td>
        <td>
          {item.desc}
        </td>
      </tr>
    );
  });

  /**
     * For identifying non-numeric chars in witness signature
     * @param {String} c
     * @returns {Boolean}
     */
  function isCharNumber(c) {
    return c >= '0' && c <= '9';
  }

  let lastID;
  async function performCalculation() {
    setProgress('calculating');

    try {
      await Apis.instance(nodes[value][0], true).init_promise;
    } catch (error) {
      console.log(error);
      changeURL(value);
      return;
    }

    let object;
    try {
      object = await Apis.instance().db_api().exec("get_block", [blockNumber]);
    } catch (error) {
      console.log(error);
      return;
    }

    if (!object) {
      console.log('get_block failed');
      return;
    }

    let { witness_signature } = object;

    if (hash === 'Blake2B') { // 512 bit
      witness_signature = blake.blake2bHex(witness_signature);
    } else if (hash === 'Blake2S') { // 256 bit
      witness_signature = blake.blake2sHex(witness_signature);
    }

    const filtered_signature = witness_signature.split('').map((char) => {
      if (isCharNumber(char)) {
        return char; // fine
      }
      return char.charCodeAt(0).toString(); // swap letters for numbers
    }).join('');

    let calculatedAirdrop;
    try {
      calculatedAirdrop = await executeCalculation(
        filtered_signature,
        selection,
        deduplicate,
        alwaysWinning,
        leaderboardJSON,
        relevantTickets,
      );
    } catch (error) {
      console.log(error);
    }

    const calcID = uuidv4();
    setRandID(calcID);
    const finalAirdropData = {
      hash,
      blockNumber,
      algos: selection,
      deduplicate,
      alwaysWinning,
      witness_signature,
      filtered_signature,
      calculatedAirdrop,
      id: calcID,
    };

    changeAirdrops(value, finalAirdropData);

    setProgress('completed');
  }

  if (progress === 'calculating') {
    return (
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={4} ta="left" mt="xs">
          {t("calculate:calculatingTitle")}
        </Title>
      </Card>
    );
  }

  if (progress === 'completed') {
    return (
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={4} ta="left" mt="xs">
          {t("calculate:completed.title")}
        </Title>
        <Button m="xs" onClick={() => setProgress('planning')}>
          {t("calculate:completed.anotherBtn")}
        </Button>
        <Link to={`/PlannedAirdrop/${value}/${randID}`}>
          <Button m="xs">
            {t("calculate:completed.airdropBtn")}
          </Button>
        </Link>
        <Link to="/CalculatedAirdrops">
          <Button m="xs">
            {t("calculate:completed.generatedBtn")}
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={4} ta="left" mt="xs">
          {t("calculate:title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("calculate:radioLabel")}
          description={t("calculate:radioDesc")}
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
        !leaderboardJSON || !leaderboardJSON.length
          ? null
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={4} ta="left" mt="xs">
                {t("calculate:hash.title")}
              </Title>
              <Radio.Group
                value={hash}
                onChange={setHash}
                name="chosenHash"
                label={t("calculate:hash.radioLabel")}
                description={t("calculate:hash.radioDesc")}
                withAsterisk
              >
                <Group mt="xs">
                  <Radio value="plain" label={t("calculate:hash.plain")} />
                  <Radio value="Blake2B" label={`Blake2B (512 bit) ${t("calculate:hash.witSig")}`} />
                  <Radio value="Blake2S" label={`Blake2B (256 bit) ${t("calculate:hash.witSig")}`} />
                </Group>
              </Radio.Group>
            </Card>
          )
      }

      {
        !leaderboardJSON || !leaderboardJSON.length
          ? null
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={4} ta="left" mt="xs">
                {t("calculate:ticket.title")}
              </Title>
              <Radio.Group
                value={deduplicate}
                onChange={setDeduplicate}
                name="chosenDuplicate"
                label={t("calculate:ticket.radioLabel")}
                description={t("calculate:ticket.radioDesc")}
                withAsterisk
              >
                <Group mt="xs">
                  <Radio value="Yes" label={t("calculate:ticket.yes")} />
                  <Radio value="No" label={t("calculate:ticket.no")} />
                </Group>
              </Radio.Group>
              <Radio.Group
                value={alwaysWinning}
                onChange={setAlwaysWinning}
                name="chosenWinning"
                label={t("calculate:ticket.winLabel")}
                description={t("calculate:ticket.winDesc")}
                withAsterisk
                style={{ marginTop: '15px' }}
              >
                <Group mt="xs">
                  <Radio value="Yes" label={t("calculate:ticket.yes")} />
                  <Radio value="No" label={t("calculate:ticket.no")} />
                </Group>
              </Radio.Group>
            </Card>
          )
      }

      {
        !leaderboardJSON || !leaderboardJSON.length
          ? null
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={4} ta="left" mt="xs">
                {t("calculate:blockNum.title")}
              </Title>
              <TextInput
                type="number"
                placeholder={blockNumber}
                label={t("calculate:blockNum.label")}
                style={{ maxWidth: '250px' }}
                onChange={(event) => onBlockNumber(event.currentTarget.value)}
              />
            </Card>
          )
      }

      {
        !leaderboardJSON || !leaderboardJSON.length
          ? (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={3} ta="center" mt="sm">
                {t("calculate:fetchTickets")}
              </Title>
            </Card>
          )
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={4} ta="left" mt="xs">
                {t("calculate:distro.title")}
              </Title>
              <ScrollArea>
                <Table miw={800} verticalSpacing="sm">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }} />
                      <th>{t("calculate:distro.th1")}</th>
                      <th>{t("calculate:distro.th2")}</th>
                    </tr>
                  </thead>
                  <tbody>{rows}</tbody>
                </Table>
              </ScrollArea>
            </Card>
          )
      }

      {
        !leaderboardJSON || !leaderboardJSON.length
          ? null
          : (
            <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
              <Title order={4} ta="left" mt="xs">
                {t("calculate:proceed.title")}
              </Title>
              <Text>
                {t("calculate:proceed.desc")}
              </Text>
              {
                    !selection.length
                      ? (
                        <Button disabled style={{ marginTop: '10px' }}>
                          {t("calculate:proceed.btn")}
                        </Button>
                      )
                      : (
                        <Button style={{ marginTop: '10px' }} onClick={() => performCalculation()}>
                          {t("calculate:proceed.btn")}
                        </Button>
                      )
                }

            </Card>
          )
      }
    </>
  );
}
