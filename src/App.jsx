/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";

import { 
  Link,
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

import {
  Menu,
  Container,
  Grid,
  Col,
  Button,
  Image,
  Select,
  ScrollArea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import {
  HiOutlineTicket,
  HiOutlineDatabase,
  HiViewList,
  HiOutlineCalculator,
  HiPlus,
  HiOutlineChartPie,
  HiOutlineQuestionMarkCircle,
  HiOutlineHome,
  HiWifi,
  HiOutlineIdentification,
} from "react-icons/hi";

import Home from "./pages/Home";
import Fetch from "./pages/Fetch";
import Tickets from "./pages/Tickets";
import Create from "./pages/Create";
import Upgrade from "./pages/Upgrade";
import Analyze from "./pages/Analyze";
import Leaderboard from "./pages/Leaderboard";
import Calculate from "./pages/Calculate";
import CalculatedAirdrops from "./pages/CalculatedAirdrops";
import PlannedAirdrop from "./pages/PlannedAirdrop";
import PerformAirdrop from "./pages/PerformAirdrop";
import Nodes from "./pages/Nodes";
import Ticket from "./pages/Ticket";
import Account from "./pages/Account";
import FAQ from "./pages/Faq";
import Asset from "./pages/Asset";

import { localePreferenceStore } from "./lib/states";

function openGallery() {
  window.electron.openURL('gallery');
}

function openGit() {
  window.electron.openURL('toolGithub');
}

function openBeet() {
  window.electron.openURL('beetGithub');
}

function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const changeLocale = localePreferenceStore((state) => state.changeLocale);
  const locale = localePreferenceStore((state) => state.locale);

  /**
   * Set the i18n locale
   * @param {String} newLocale
   */
  function setLanguage(newLocale) {
    try {
      i18n.changeLanguage(newLocale);
    } catch (error) {
      console.log(error);
      return;
    }

    try {
      changeLocale(newLocale);
    } catch (error) {
      console.log(error);
    }
  }

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'da', label: 'Dansk' },
    { value: 'de', label: 'Deutsche' },
    { value: 'et', label: 'Eesti' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'pt', label: 'Português' },
    { value: 'th', label: 'ไทย' },
  ];

  const localeItems = languages.map((lang) => {
    return <Menu.Item key={`lang_${lang.value}`} onClick={() => setLanguage(lang.value)}>
            { lang.label }
          </Menu.Item>
  });

  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Grid key="about" grow>
            <Col mt="xl" ta="left" span={1}>
              <Menu shadow="md" width={200} position="right-start">
                <Menu.Target>
                  <Button>
                    {t("app:menu.btn")}
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>{t("app:menu.label")}</Menu.Label>
                  <Link style={{ textDecoration: 'none' }} to="/">
                    <Menu.Item icon={<HiOutlineHome />}>
                      {t("app:menu.home")}
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./create">
                    <Menu.Item icon={<HiPlus />}>
                      {t("app:menu.createTicket")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./upgrade">
                    <Menu.Item icon={<HiOutlineIdentification />}>
                      {t("app:menu.upgradeAccount")}
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./fetch">
                    <Menu.Item icon={<HiOutlineTicket />}>
                      {t("app:menu.fetchTickets")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./calculate">
                    <Menu.Item icon={<HiOutlineCalculator />}>
                      {t("app:menu.calculateAirdrop")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./CalculatedAirdrops">
                    <Menu.Item icon={<HiOutlineChartPie />}>
                      {t("app:menu.calculatedAirdrops")}
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./analyze">
                    <Menu.Item icon={<HiOutlineDatabase />}>
                      {t("app:menu.analyzeTickets")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./leaderboard">
                    <Menu.Item icon={<HiViewList />}>
                      {t("app:menu.ticketLeaderboard")}
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./faq">
                    <Menu.Item icon={<HiOutlineQuestionMarkCircle />}>
                      {t("app:menu.faq")}
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./nodes">
                    <Menu.Item icon={<HiWifi />}>
                      {t("app:menu.changeNodes")}
                    </Menu.Item>
                  </Link>
                </Menu.Dropdown>
              </Menu>
              <br/>
              <Menu shadow="md" mt="sm" width={200} position="right-start">
                <Menu.Target>
                  <Button compact>
                    { languages.find(x => x.value === locale).label }
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <ScrollArea h={200}>
                    { localeItems }
                  </ScrollArea>
                </Menu.Dropdown>
              </Menu>
            </Col>
            <Col ta="Center" span={9}>
              <div style={{ width: 350, marginLeft: 'auto', marginRight: 'auto' }}>
                <Image
                  style={{ width: 350 }}
                  radius="md"
                  src="./logo2.png"
                  alt="Bitshares logo"
                  caption="Bitshares BEET Airdrop tool"
                />
              </div>
            </Col>
            <Col span={12}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Fetch" element={<Fetch />} />
                <Route path="/Tickets/:env" element={<Tickets />} />
                <Route path="/Ticket/:env/:id" element={<Ticket />} />
                <Route path="/Asset/:env/:id" element={<Asset />} />
                <Route path="/Account/:env/:id" element={<Account />} />
                <Route path="/PlannedAirdrop/:env/:id" element={<PlannedAirdrop />} />
                <Route path="/PerformAirdrop/:env/:id" element={<PerformAirdrop />} />

                <Route path="/Create" element={<Create />} />
                <Route path="/Create/:env/:id" element={<Create />} />
                <Route path="/Upgrade" element={<Upgrade />} />
                <Route path="/Upgrade/:env/:id" element={<Upgrade />} />

                <Route path="/Analyze" element={<Analyze />} />
                <Route path="/Leaderboard" element={<Leaderboard />} />
                <Route path="/Calculate" element={<Calculate />} />
                <Route path="/CalculatedAirdrops" element={<CalculatedAirdrops />} />

                <Route path="/faq" element={<FAQ />} />
                <Route path="/Nodes" element={<Nodes />} />
              </Routes>
            </Col>
            <Col ta="center" span={12}>
              <Button
                variant="default"
                color="dark"
                sx={{ marginTop: '15px', marginRight: '5px' }}
                onClick={() => {
                  openGallery();
                }}
              >
                NFTEA Gallery
              </Button>
              <Button
                variant="default"
                color="dark"
                sx={{ marginTop: '15px', marginRight: '5px' }}
                onClick={() => {
                  openGit();
                }}
              >
                Github Repo
              </Button>
              <Button
                variant="default"
                color="dark"
                sx={{ marginTop: '15px', marginRight: '5px' }}
                onClick={() => {
                  openBeet();
                }}
              >
                Beet
              </Button>
            </Col>
          </Grid>
        </Container>
      </header>
    </div>
  );
}

export default App;
