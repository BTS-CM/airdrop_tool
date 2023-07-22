/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Title,
  Text,
  Card,
  Center,
  Button,
  Radio,
  FileButton,
  Group
} from '@mantine/core';
import _ from "lodash";

import {
  airdropStore,
  appStore,
  leaderboardStore,
  beetStore,
  tempStore,
  assetStore,
  blocklistStore,
} from "../lib/states";

import GetAccount from "../components/GetAccount";

export default function CustomcustomAirdropPrep(properties) {
  const { t, i18n } = useTranslation();
  const params = useParams();

  const [environment, setEnvironment] = useState();

  let titleName = "custom";
  if (environment === 'bitshares') {
    titleName = "Bitshares";
  } else if (environment === 'bitshares_testnet') {
    titleName = "Bitshares (Testnet)";
  } else if (environment === 'tusc') {
    titleName = "TUSC";
  }

  const account = tempStore((state) => state.account);
  const resetAccount = tempStore((state) => state.reset);
  const fileContents = tempStore((state) => state.fileContents);
  const setFileContents = tempStore((state) => state.setFileContents);

  useEffect(() => {
    if (account) {
      //  erasing last temp account
      resetAccount();
    }
  }, []);

  const [file, setFile] = useState();

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const contents = JSON.parse(reader.result);
        if (contents && contents.length && contents[0].id) {
          setFileContents(contents);
        }
      };
      reader.onerror = () => {
        console.error(reader.error);
      };
    }
  }, [file]);

  return (
    <Card shadow="md" radius="md" padding="xl" style={{ marginTop: '25px' }}>
      <Title order={3} ta="center" mt="sm">
        {t("customAirdropPrep:header1.title", { titleName })}
      </Title>

      {
        !environment
          ? (
            <Center>
              <Group mt="xs">
                <Button onClick={() => setEnvironment('bitshares')}>
                  Bitshares
                </Button>
                <Button onClick={() => setEnvironment('bitshares_testnet')}>
                  Bitshares (Testnet)
                </Button>
                <Button onClick={() => setEnvironment('tusc')}>
                  TUSC
                </Button>
              </Group>
            </Center>
          )
          : null
      }

      {
        environment && !account
          ? (
          <>
              <GetAccount env={environment} basic />
              <Center>
                <Button
                  compact
                  mt="sm"
                  onClick={() => setEnvironment()}
                >
                  {t("customAirdrop:header.switchEnv")}
                </Button>
              </Center>
          </>
          )
          : null
      }

      {
        environment && account && !fileContents
          ? (
            <>
              <Text align="center">
                {t("customAirdrop:uploadText")}
              </Text>
              <Text align="center">
                {t("customAirdrop:uploadText2")}
              </Text>
              <Text align="center">
                {'[{"id": "1.2.x", "qty": 1, "value": 2}]'}
              </Text>
              <Center mt="sm">
                <FileButton onChange={setFile} accept="file/JSON">
                  {(props) => <Button {...props}>{t("customAirdrop:uploadBtn")}</Button>}
                </FileButton>
              </Center>
            </>
          )
          : null
      }

      {
        environment && account && fileContents
          ? (
            <>
            <Center>
              <Card shadow="md" radius="md" mt="md" withBorder style={{ width: 450 }}>
                <Center>
                    <Text>{t("customAirdropPrep:header2.title", { titleName })}</Text>
                </Center>
                <Center>
                    <Link to={`/CustomAirdrop/${environment}/`}>
                      <Button mt="sm" compact>
                        {t("customAirdropPrep:header2.button", { accountName: account })}
                      </Button>
                    </Link>
                </Center>
              </Card>
            </Center>
            </>
          )
          : null
      }
    </Card>
  );
}
