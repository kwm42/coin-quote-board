<script>
import { WebSocketClient } from "./websocket-client";

const greenColors = Array.from({ length: 100 }, (v, k) => {
  return `rgb(15, ${173 - k * 10}, 134)`;
});
const redColors = Array.from({ length: 100 }, (v, k) => {
  return `rgb(${220 - k * 10}, 62, 62)`;
});

const app = {
  data() {
    return {
      message: "Hello Vue!",
      redColors,
      greenColors,
      coins: [],
    };
  },
  mounted() {
    this.connectWebSocket();
    this.getDailyOpenPriceBatch();
  },
  methods: {
    getDailyOpenPriceBatch() {
      let openPriceList = [];
      const datestamp = "openPriceList" + this.getTodayDate();
      openPriceList = this.getLocalStorage(datestamp);
      if (openPriceList) {
        this.coins.forEach((coin) => {
          const openPrice = openPriceList.find(
            (item) => item.symbol === coin.symbol
          );
          if (openPrice) {
            coin.openPrice = openPrice.price;
          }
        });
        return;
      }
      this.coins.forEach((coin) => {
        this.getDailyOpenPrice(coin.symbol).then((openPrice) => {
          coin.openPrice = openPrice;
        });
      });
      setTimeout(() => {
        this.setLocalStorage(datestamp, this.coins);
      }, 5000);
    },
    connectWebSocket() {
      const defaultValue = [
        "btcusdt",
        "ethusdt",
        "xrpusdt",
        "ltcusdt",
        "solusdt",
        "bnbusdt",
      ];
      const coinList = this.getLocalStorage("coinList") || defaultValue;
      this.setLocalStorage("coinList", coinList);
      this.coins = coinList.map((coin) => {
        return {
          symbol: coin.toUpperCase(),
          price: 50000,
          openPrice: 0,
          amplitude: 0,
        };
      });
      const wsUrl = `wss://fstream.binance.com/ws/${coinList
        .map((coin) => `${coin}@kline_5m`)
        .join("/")}`;
      // const wsUrl = `wss://stream.binance.com:443/ws/${coinList.map(coin => `${coin}@kline_1m`).join('/')}`
      const ws = new WebSocketClient({
        url: wsUrl,
        onmessageHandler: this.messageHandler,
      });
    },
    messageHandler(data) {
      console.log(data);
      const coinIndex = this.coins.findIndex((coin) => data.s === coin.symbol);
      if (coinIndex !== -1) {
        const currentPrice = Number(data.k.c).toFixed(2);
        this.coins[coinIndex].price = currentPrice;
        this.coins[coinIndex].amplitude = (
          ((currentPrice - this.coins[coinIndex].openPrice) /
            this.coins[coinIndex].openPrice) *
          100
        ).toFixed(2);
      }
    },
    getLocalStorage(key) {
      let result = null;
      try {
        result = JSON.parse(localStorage.getItem(key));
      } catch (error) {
        return result;
      }
      return result;
    },
    setLocalStorage(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    getDailyOpenPrice(code) {
      const url = "https://api.binance.com/api/v3/klines";
      // 请求参数
      const params = new URLSearchParams({
        symbol: code.toUpperCase(), // 交易对
        interval: "1d", // 每日K线
        limit: "1", // 获取最新的一根K线
      });
      return fetch(`${url}?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          const openPrice = Number(data[0][1]).toFixed(2);
          return openPrice;
        });
    },
    getTodayDate() {
      const today = new Date();

      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");

      return `${year}${month}${day}`;
    },
  },
};

export default app;
</script>

<template>
  <div class="container">
    <div class="block" v-for="(pair, index) in coins" :key="index">
      <div
        class="block-content"
        :style="{
          backgroundColor:
            pair.openPrice > pair.price ? redColors[0] : greenColors[0],
        }"
      >
        <div class="title">{{ pair.symbol }}</div>
        <div class="price">{{ pair.price }}</div>
        <div class="open-price">开盘价：{{ pair.openPrice }}</div>
        <div class="amplitude">涨跌幅：{{ pair.amplitude }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: flex-start;
  gap: 0px;
  flex-wrap: wrap;
}

.block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 25%;
  height: 49vh;
  padding: 2px;
  box-sizing: border-box;
}

.block-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.block-content .title {
  font-size: 42px;
  font-weight: bold;
  color: white;
  text-align: center;
}

.block-content .price {
  font-size: 50px;
  font-weight: bolder;
  color: white;
  margin: 8px 0;
  text-align: center;
}

.block-content .amplitude,
.block .open-price {
  font-size: 12px;
  font-weight: normal;
  color: white;
  text-align: center;
}
</style>
