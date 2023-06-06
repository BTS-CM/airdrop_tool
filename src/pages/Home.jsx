/* eslint-disable max-len */
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import {
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
} from '@mantine/core';

import {
  HiOutlineTicket,
  HiOutlineDatabase,
  HiViewList,
  HiOutlineCalculator,
  HiOutlineSave,
  HiOutlinePaperAirplane,
  HiPlus,
  HiOutlineLogin,
  HiOutlineWifi,
  HiOutlineChartPie,
  HiSearch,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi";

/*
  <Link style={{ textDecoration: 'none' }} to="/faq">
      <Card shadow="md" radius="md" padding="xl">
          <ThemeIcon variant="light" size={40} radius={40}>
              <HiSearch />
          </ThemeIcon>
          <Text fz="lg" fw={500} mt="sm">
              Account search
          </Text>
          <Text fz="sm" c="dimmed" mt="sm">
              Search for blockchain accounts
          </Text>
      </Card>
  </Link>
*/

export default function Home(properties) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <Title order={2} ta="center" mt="sm">
        {t("home:title")}
      </Title>

      <Text c="dimmed" ta="center" mt="md">
        {t("home:desc")}
      </Text>

      <SimpleGrid cols={3} spacing="xl" mt={50} breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'sm', cols: 1 }]}>
        <Link style={{ textDecoration: 'none' }} to="/fetch">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineTicket />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.ticketRetrieval.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.ticketRetrieval.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/analyze">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineDatabase />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.ticketAnalysis.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.ticketAnalysis.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/leaderboard">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiViewList />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.ticketLeaderboard.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.ticketLeaderboard.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/calculate">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineCalculator />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.airdropCalc.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.airdropCalc.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/CalculatedAirdrops">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineChartPie />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.airdropAnalysis.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.airdropAnalysis.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/CalculatedAirdrops">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlinePaperAirplane />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.airdropExecute.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.airdropExecute.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/create">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiPlus />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.createTicket.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.createTicket.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/faq">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineQuestionMarkCircle />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.faq.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.faq.desc")}
            </Text>
          </Card>
        </Link>
        <Link style={{ textDecoration: 'none' }} to="/nodes">
          <Card shadow="md" radius="md" padding="xl">
            <ThemeIcon variant="light" size={40} radius={40}>
              <HiOutlineWifi />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="sm">
              {t("home:grid.nodes.title")}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {t("home:grid.nodes.desc")}
            </Text>
          </Card>
        </Link>
      </SimpleGrid>

      <Text c="dimmed" ta="center" mt="md">
        {t("home:footer")}
      </Text>
    </>
  );
}
