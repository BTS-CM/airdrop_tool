import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Link, Route, useLocation } from "wouter";

import {
  Menu,
  Text,
  Container,
  Center,
  Group,
  Grid,
  Col,
  Paper,
  Button,
  Divider,
  Image,
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
  HiOutlineHome
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
import Links from "./pages/Links";
import FAQ from "./pages/Faq";

function App() {

  const [location, setLocation] = useLocation();

  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Grid key="about" grow>
            <Col span={12}>
              <div style={{ width: 350, marginLeft: 'auto', marginRight: 'auto' }}>
                <Image
                  radius="md"
                  src="/logo2.png"
                  alt="Bitshares logo"
                  caption="Bitshares BEET Airdrop tool"
                />
                <Menu shadow="md" width={200} style={{marginLeft: '75px'}}>
                  <Menu.Target>
                    <Button>
                      📃 Menu
                    </Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Main menu</Menu.Label>
                      <Link href="/">
                        <Menu.Item icon={<HiOutlineHome />}>
                          <a className="link">Home</a>
                        </Menu.Item>
                      </Link>
                      <Menu.Divider />
                      <Link href="/create">
                        <Menu.Item icon={<HiPlus />}>
                          <a className="link">Create ticket</a>
                        </Menu.Item>
                      </Link>
                      <Menu.Divider />
                      <Link href="/fetch">
                        <Menu.Item icon={<HiOutlineTicket />}>
                          <a className="link">Fetch tickets</a>
                        </Menu.Item>
                      </Link>
                      <Link href="/calculate">
                        <Menu.Item icon={<HiOutlineCalculator />}>
                          <a className="link">Calculate airdrop</a>
                        </Menu.Item>
                      </Link>
                      <Link href="/CalculatedAirdrops">
                        <Menu.Item icon={<HiOutlineChartPie />}>
                          <a className="link">Calculated airdrops</a>
                        </Menu.Item>
                      </Link>
                      <Menu.Divider />
                      <Link href="/analyze">
                        <Menu.Item icon={<HiOutlineDatabase />}>
                          <a className="link">Analyze tickets</a>
                        </Menu.Item>
                      </Link>
                      <Link href="/leaderboard">
                        <Menu.Item icon={<HiViewList />}>
                          <a className="link">Ticket leaderboard</a>
                        </Menu.Item>
                      </Link>
                      <Menu.Divider />
                      <Link href="/faq">
                        <Menu.Item icon={<HiOutlineQuestionMarkCircle />}>
                          <a className="link">FAQ</a>
                        </Menu.Item>
                      </Link>
                  </Menu.Dropdown>
                </Menu>

                <Menu shadow="md" width={200} style={{marginLeft: '10px'}}>
                  <Menu.Target>
                    <Button>
                      ⚙️ Settings
                    </Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Settings</Menu.Label>
                      <Link href="/nodes">
                        <Menu.Item>
                          <a className="link">Change nodes</a>
                        </Menu.Item>
                      </Link>
                      <Link href="/links">
                        <Menu.Item>
                          <a className="link">Beet Dapp links</a>
                        </Menu.Item>
                      </Link>
                  </Menu.Dropdown>
                </Menu>
              </div>
            </Col>
            <Col span={12}>
              <Route path="/" component={Home} />
              <Route path="/Fetch" component={Fetch} />
              <Route path="/Tickets/:env" component={Tickets} />

              <Route path="/Ticket/:env/:id" component={Ticket} />
              <Route path="/Account/:env/:id" component={Account} />
              <Route path="/PlannedAirdrop/:env/:id" component={PlannedAirdrop} />
              <Route path="/PerformAirdrop/:env/:id" component={PerformAirdrop} />

              <Route path="/Create" component={Create} />
              <Route path="/Analyze" component={Analyze} />
              <Route path="/Leaderboard" component={Leaderboard} />
              <Route path="/Calculate" component={Calculate} />
              <Route path="/CalculatedAirdrops" component={CalculatedAirdrops} />
              <Route path="/Airdrop" component={Airdrop} />

              <Route path="/faq" component={FAQ} />

              <Route path="/Nodes" component={Nodes} />
              <Route path="/Links" component={Links} />
            </Col>
          </Grid>
        </Container>
      </header>
    </div>
  );
}

export default App;
