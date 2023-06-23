/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  SimpleGrid,
  useMantineTheme,
  TextInput,
  Loader,
  Card,
  Accordion,
  Box,
  JsonInput,
  ActionIcon,
  Modal,
  Radio,
  Table,
  Button,
  Col,
  Paper,
  Group,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { Link, useParams } from "react-router-dom";
import Fuse from 'fuse.js';
import { TbInputSearch, TbArrowNarrowRight } from "react-icons/tb";

import { leaderboardStore, blocklistStore, appStore } from '../lib/states';
import { getBlockedAccounts } from '../lib/directQueries';

export default function BlockAccounts(properties) {
  const { t, i18n } = useTranslation();
  const theme = useMantineTheme();

  const params = useParams();
  const [value, setValue] = useState(
    (params && params.env) ?? 'bitshares'
  );

  const [opened, { open, close }] = useDisclosure(false);

  const [searchInput, setSearchInput] = useState("");

  const btsLeaderboard = leaderboardStore((state) => state.bitshares);
  const btsTestnetLeaderboard = leaderboardStore((state) => state.bitshares_testnet);
  const tuscLeaderboard = leaderboardStore((state) => state.tusc);

  const btsBlockedAccounts = blocklistStore((state) => state.bitshares);
  const btsTestnetBlockedAccounts = blocklistStore((state) => state.bitshares_testnet);
  const tuscBlockedAccounts = blocklistStore((state) => state.tusc);
  const change = blocklistStore((state) => state.change);
  const eraseOne = blocklistStore((state) => state.eraseOne);
  const eraseAll = blocklistStore((state) => state.eraseAll);

  const nodes = appStore((state) => state.nodes);
  const currentNodes = nodes[value];

  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState();

  useEffect(() => {
    setSearchInput("");
    setResult();
  }, [value]);

  let leaderboardJSON = [];
  let blockList = [];
  if (value === 'bitshares') {
    leaderboardJSON = btsLeaderboard.map((x) => ({ id: x.id, name: x.account.name }));
    blockList = btsBlockedAccounts;
  } else if (value === 'bitshares_testnet') {
    leaderboardJSON = btsTestnetLeaderboard.map((x) => ({ id: x.id, name: x.account.name }));
    blockList = btsTestnetBlockedAccounts;
  } else if (value === 'tusc') {
    leaderboardJSON = tuscLeaderboard.map((x) => ({ id: x.id, name: x.account.name }));
    blockList = tuscBlockedAccounts;
  }

  const fuse = new Fuse(
    leaderboardJSON,
    {
      keys: [
        "id",
        "name"
      ],
      includeScore: true
    }
  );

  async function performSearch() {
    setInProgress(true);
    setResult();

    let searchResult;
    try {
      searchResult = fuse.search(searchInput);
    } catch (error) {
      console.log(error);
      setInProgress(false);
      return;
    }

    if (searchResult) {
      setResult(searchResult);
    }

    setInProgress(false);
  }

  async function fetchCommitteeBlocklist() {
    setInProgress(true);
    let committeeAccount;
    try {
      committeeAccount = await getBlockedAccounts(currentNodes[0]);
    } catch (error) {
      console.log(error);
      setInProgress(false);
      return;
    }

    setInProgress(false);
    if (committeeAccount && committeeAccount.length) {
      let fetchedBlockedAccounts = committeeAccount[0].blacklisted_accounts;
      fetchedBlockedAccounts = fetchedBlockedAccounts.filter((x) => !blockList.includes(x));
      change(value, fetchedBlockedAccounts);
    }
  }

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("blockAccounts:title")}
        </Title>

        <Radio.Group
          value={value}
          onChange={setValue}
          name="chosenBlockchain"
          label={t("create:radioA.label")}
          description={t("create:radioA.desc")}
          withAsterisk
        >
          <Group mt="xs">
            <Radio value="bitshares" label="Bitshares" />
            <Radio value="bitshares_testnet" label="Bitshares (Testnet)" />
            <Radio value="tusc" label="TUSC" />
          </Group>
        </Radio.Group>

        <Text mt="md">
          {t("blockAccounts:header", { chain: value })}
        </Text>

        <Group mt="xs">
          {
            value === "bitshares" && !inProgress
              ? (
                <>
                  <Button
                    compact
                    onClick={() => {
                      fetchCommitteeBlocklist();
                    }}
                  >
                    {t("blockAccounts:buttons.committee")}
                  </Button>
                  <Button
                    compact
                    onClick={() => {
                      eraseAll(value);
                    }}
                  >
                    {t("blockAccounts:buttons.eraseAll")}
                  </Button>
                </>
              )
              : null
          }

          {
            value === "bitshares" && inProgress
              ? (
                <Button
                  compact
                  disabled
                >
                  {t("blockAccounts:buttons.committeeInProgress")}
                </Button>
              )
              : null
          }

          <Button
            compact
            onClick={() => open()}
          >
            {t("blockAccounts:buttons.search")}
          </Button>
        </Group>

        <Modal
          opened={opened}
          onClose={() => {
            close();
            setSearchInput();
            setResult();
            setInProgress();
          }}
          title={t("blockAccounts:modal.title")}
        >
          {
            leaderboardJSON && leaderboardJSON.length
              ? (
                <TextInput
                  icon={<TbInputSearch />}
                  radius="xl"
                  mt="md"
                  size="md"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                  }}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      performSearch();
                    }
                  }}
                  rightSection={(
                    <ActionIcon
                      size={32}
                      radius="xl"
                      color={theme.primaryColor}
                      onClick={() => {
                        performSearch();
                      }}
                      variant="filled"
                    >
                      <TbArrowNarrowRight />
                    </ActionIcon>
                  )}
                  placeholder={t('blockAccounts:modal.inputText', { chain: value })}
                  rightSectionWidth={42}
                />
              )
              : null
          }
          {
            inProgress
              ? <Text>{t('blockAccounts:modal.searching', { chain: value, input: searchInput })}</Text>
              : null
          }
          {
            !inProgress && result && result.length
              ? (
                <>
                  <Table highlightOnHover mt="sm">
                    <thead>
                      <tr>
                        <th>{t('blockAccounts:modal.results')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        result.filter((x) => x.score < 0.5).map((x) => (
                            <tr key={`${x.item.id}_search`}>
                              <td>
                                  <b>{x.item.name}</b> ({x.item.id})
                              </td>
                              <td>
                                  <Button
                                    compact
                                    variant="outline"
                                    onClick={() => {
                                      change(value, x.item.id); // add to block list
                                      close();
                                    }}
                                  >
                                    {t('blockAccounts:modal.block')}
                                  </Button>
                              </td>
                            </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                </>
              )
              : null
          }
        </Modal>

        <Text mt="xs">
          {t("blockAccounts:qty", { chain: value, qty: blockList.length })}
        </Text>

        {
          blockList
          && blockList.length
          && blockList.filter((x) => leaderboardJSON.map((y) => y.id).includes(x)).length
            ? (
              <ScrollArea>
                <Table mt="md" highlightOnHover>
                  <thead>
                    <tr>
                      <th>{t("blockAccounts:table.header")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      blockList.filter((x) => leaderboardJSON.map((y) => y.id).includes(x))
                        .map((blockedUser) => (
                          <tr key={`${blockedUser}_blocked`}>
                            <td>
                              {
                                leaderboardJSON.find((x) => x.id === blockedUser).name
                              } ({blockedUser})
                            </td>
                            <td>
                              <Button onClick={() => {
                                eraseOne(value, blockedUser);
                              }}
                              >
                                {t("blockAccounts:table.remove")}
                              </Button>
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </Table>
              </ScrollArea>
            )
            : null
        }

      </Card>
    </>
  );
}
