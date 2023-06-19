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
} from '@mantine/core';
import { Link, useParams } from "react-router-dom";
import Fuse from 'fuse.js';
import { TbInputSearch, TbArrowNarrowRight } from "react-icons/tb";

import { assetStore } from '../lib/states';

export default function LookupAsset(properties) {
  const { t, i18n } = useTranslation();
  const theme = useMantineTheme();

  const params = useParams();
  const [value, setValue] = useState(
    (params && params.env) ?? 'bitshares'
  );

  const [searchInput, setSearchInput] = useState("");

  const btsAssets = assetStore((state) => state.bitshares);
  const btsTestnetAssets = assetStore((state) => state.bitshares_testnet);
  const tuscAssets = assetStore((state) => state.tusc);

  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState();

  useEffect(() => {
    setSearchInput("");
    setResult();
  }, [value]);

  let relevantChain = "bitshares";
  let assetName = "1.3.0";
  let assets = [];
  if (value === 'bitshares') {
    assets = btsAssets.map((x) => ({ id: x.id, symbol: x.symbol }));
    assetName = "BTS";
    relevantChain = 'BTS';
  } else if (value === 'bitshares_testnet') {
    assets = btsTestnetAssets.map((x) => ({ id: x.id, symbol: x.symbol }));
    assetName = "TEST";
    relevantChain = 'BTS_TEST';
  } else if (value === 'tusc') {
    assets = tuscAssets.map((x) => ({ id: x.id, symbol: x.symbol }));
    assetName = "TUSC";
    relevantChain = 'TUSC';
  }

  const fuse = new Fuse(
    assets,
    {
      keys: [
        "id",
        "symbol"
      ]
    }
  );

  async function performSearch() {
    setInProgress(true);
    setResult();

    console.log('performing search');

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

  return (
    <>
      <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
        <Title order={2} ta="center" mt="sm">
          {t("lookupAsset:title")}
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
          {t("lookupAsset:header", { chain: value })}
        </Text>

        {
          assets && assets.length
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
                placeholder={t('lookupAsset:inputText', { chain: value })}
                rightSectionWidth={42}
              />
            )
            : null
        }
        {
          inProgress
            ? <Text>{t('lookupAsset:searching', { chain: value, input: searchInput })}</Text>
            : null
        }
        {
          !inProgress && result && result.length
            ? (
              <>
                <Table highlightOnHover mt="sm">
                  <thead>
                    <tr>
                      <th>{t("lookupAsset:results")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      result.map((x) => (
                          <tr>
                            <td>
                              <Link style={{ textDecoration: 'none', color: 'black' }} to={`/asset/${value}/${x.item.id}`}>
                                <b>{x.item.symbol}</b> ({x.item.id})
                              </Link>
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

      </Card>
    </>
  );
}
