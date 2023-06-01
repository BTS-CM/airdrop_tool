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
} from '@mantine/core';

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
} from "react-icons/hi";

import Home from "./pages/Home";
import Fetch from "./pages/Fetch";
import Tickets from "./pages/Tickets";
import Create from "./pages/Create";
import Analyze from "./pages/Analyze";
import Leaderboard from "./pages/Leaderboard";
import Calculate from "./pages/Calculate";
import CalculatedAirdrops from "./pages/CalculatedAirdrops";
import Airdrop from "./pages/Airdrop";
import PlannedAirdrop from "./pages/PlannedAirdrop";
import PerformAirdrop from "./pages/PerformAirdrop";
import Nodes from "./pages/Nodes";
import Ticket from "./pages/Ticket";
import Account from "./pages/Account";
import FAQ from "./pages/Faq";

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
  const location = useLocation();
  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Grid key="about" grow>
            <Col mt="xl" ta="left" span={1}>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button>
                    📃 Menu
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Main menu</Menu.Label>
                  <Link style={{ textDecoration: 'none' }} to="/">
                    <Menu.Item icon={<HiOutlineHome />}>
                      Home
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./create">
                    <Menu.Item icon={<HiPlus />}>
                      Create ticket
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./fetch">
                    <Menu.Item icon={<HiOutlineTicket />}>
                      Fetch tickets
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./calculate">
                    <Menu.Item icon={<HiOutlineCalculator />}>
                      Calculate airdrop
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./CalculatedAirdrops">
                    <Menu.Item icon={<HiOutlineChartPie />}>
                      Calculated airdrops
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./analyze">
                    <Menu.Item icon={<HiOutlineDatabase />}>
                      Analyze tickets
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./leaderboard">
                    <Menu.Item icon={<HiViewList />}>
                      Ticket leaderboard
                    </Menu.Item>
                  </Link>
                  <Menu.Divider />
                  <Link style={{ textDecoration: 'none' }} to="./faq">
                    <Menu.Item icon={<HiOutlineQuestionMarkCircle />}>
                      FAQ
                    </Menu.Item>
                  </Link>
                  <Link style={{ textDecoration: 'none' }} to="./nodes">
                    <Menu.Item icon={<HiWifi />}>
                      Change nodes
                    </Menu.Item>
                  </Link>
                </Menu.Dropdown>
              </Menu>
            </Col>
            <Col ta="Center" span={10}>
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
                <Route path="/Account/:env/:id" element={<Account />} />
                <Route path="/PlannedAirdrop/:env/:id" element={<PlannedAirdrop />} />
                <Route path="/PerformAirdrop/:env/:id" element={<PerformAirdrop />} />

                <Route path="/Create" element={<Create />} />
                <Route path="/Create/:env/:id" element={<Create />} />
                <Route path="/Analyze" element={<Analyze />} />
                <Route path="/Leaderboard" element={<Leaderboard />} />
                <Route path="/Calculate" element={<Calculate />} />
                <Route path="/CalculatedAirdrops" element={<CalculatedAirdrops />} />
                <Route path="/Airdrop" element={<Airdrop />} />

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
