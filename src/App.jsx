import { Link, Route } from "wouter";

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

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Grid key="about" grow>
            <Col mt={"xl"} ta={"left"} span={1}>
              <Menu shadow="md" width={200}>
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
                    <Link href="/nodes">
                      <Menu.Item icon={<HiWifi />}>
                        <a className="link">Change nodes</a>
                      </Menu.Item>
                    </Link>
                </Menu.Dropdown>
              </Menu> 
            </Col>
            <Col ta={"Center"} span={10}>
              <div style={{ width: 350, marginLeft: 'auto', marginRight: 'auto' }}>
                <Image
                  style={{width: 350}}
                  radius="md"
                  src="/logo2.png"
                  alt="Bitshares logo"
                  caption="Bitshares BEET Airdrop tool"
                />

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
              <Route path="/Create/:env/:id" component={Create} />
              <Route path="/Analyze" component={Analyze} />
              <Route path="/Leaderboard" component={Leaderboard} />
              <Route path="/Calculate" component={Calculate} />
              <Route path="/CalculatedAirdrops" component={CalculatedAirdrops} />
              <Route path="/Airdrop" component={Airdrop} />

              <Route path="/faq" component={FAQ} />
              <Route path="/Nodes" component={Nodes} />
            </Col>
          </Grid>
        </Container>
      </header>
    </div>
  );
}

export default App;
