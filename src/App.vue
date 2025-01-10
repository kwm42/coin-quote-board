<script>
import { WebSocketClient } from "./websocket-client";
import { Alarm } from "./alarm";

const greenColors = Array.from({ length: 100 }, (v, k) => {
  return `rgb(15, ${173 - k * 10}, 134)`;
});
const redColors = Array.from({ length: 100 }, (v, k) => {
  return `rgb(${220 - k * 10}, 62, 62)`;
});

const precision = {
  btcusdt: 2,
  ethusdt: 2,
  xrpusdt: 4,
  ltcusdt: 2,
  solusdt: 2,
  bnbusdt: 2,
  dogeusdt: 5,
  pepeusdt: 9,
};

const app = {
  data() {
    return {
      message: "Hello Vue!",
      redColors,
      greenColors,
      sheetOpen: false,
      snackbarOpen: false,
      selectedCoinString: "",
      coins: [],
      ws: null,
      items: [
        {
          title: "播放",
          handler: () => {
            this.playAlarm();
          },
        },
        {
          title: "清除localstorage",
          handler: () => {
            this.clearStorage();
          },
        },
      ],
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
            coin.openPrice = openPrice.openPrice;
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
        "ltcusdt",
        "solusdt",
        "bnbusdt",
        "dogeusdt",
      ];
      const coinList = this.getLocalStorage("coinList") || defaultValue;
      this.setLocalStorage("coinList", coinList);
      this.selectedCoinString = coinList.join(",");
      this.coins = coinList.map((coin) => {
        return {
          symbol: coin.toUpperCase(),
          price: 50000,
          openPrice: 0,
          amplitude: 0,
          attention: false,
        };
      });
      const wsUrl = `wss://fstream.binance.com/ws/${coinList
        .map((coin) => `${coin}@kline_15m`)
        .join("/")}`;
      if (/localhost|127\.0\.0\.1/.test(location.href)) {
        return;
      }
      this.ws = new WebSocketClient({
        url: wsUrl,
        onmessageHandler: this.messageHandler,
      });
    },
    messageHandler(data) {
      console.log(data);
      const coinIndex = this.coins.findIndex((coin) => data.s === coin.symbol);
      if (coinIndex !== -1) {
        const precisionValue = this.getPrecision(data.s);
        const currentPrice = Number(data.k.c).toFixed(precisionValue);
        this.coins[coinIndex].price = currentPrice;
        this.coins[coinIndex].amplitude = (
          ((currentPrice - this.coins[coinIndex].openPrice) /
            this.coins[coinIndex].openPrice) *
          100
        ).toFixed(precisionValue);
        const currentKlineAmplitude = ((data.k.c - data.k.o) / data.k.o) * 100;
        if (Math.abs(currentKlineAmplitude) > 1) {
          // this.playAlarm();
          this.coins[coinIndex].attention = true;
        } else {
          this.coins[coinIndex].attention = false;
        }
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
          const precisionValue = this.getPrecision(code);
          const openPrice = Number(data[0][1]).toFixed(precisionValue);
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
    getPrecision(code) {
      return precision[code.toLowerCase()] || 4;
    },
    onSave() {
      const coinList = this.selectedCoinString.split(",").filter(Boolean);
      this.setLocalStorage("coinList", coinList);
      this.ws?.close?.();
      this.connectWebSocket();
      this.getDailyOpenPriceBatch();
      this.sheetOpen = false;
    },
    clearStorage() {
      localStorage.clear();
      this.snackbarOpen = true;
    },
    handleMenuClick(index) {
      this.items[index].handler();
    },
    playAlarm() {
      Alarm.playSound();
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
        <i v-if="pair.attention" class="attention"></i>
      </div>
    </div>
  </div>

  <v-menu>
    <template v-slot:activator="{ props }">
      <v-fab v-bind="props" class="menu-icon" icon="$vuetify">
        <v-icon icon="mdi-menu" />
      </v-fab>
    </template>

    <v-list style="cursor: pointer">
      <v-list-item v-for="(item, index) in items" :key="index">
        <v-list-item-title @click="() => handleMenuClick(index)">{{
          item.title
        }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
  <v-bottom-sheet v-model="sheetOpen" inset>
    <template v-slot:activator="{ props }">
      <v-fab v-bind="props" class="edit-icon" icon="$vuetify"></v-fab>
    </template>

    <v-card title="编辑币种">
      <v-card-text>
        <v-textarea label="Label" v-model="selectedCoinString"></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="sheetOpen = !sheetOpen">Cancel</v-btn>
        <v-btn text @click="onSave">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
  <v-snackbar v-model="snackbarOpen" class="clear-tip" :timeout="2000">
    <span>清除成功</span>
    <template v-slot:actions>
      <v-btn color="red" variant="text" @click="snackbarOpen = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
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
  position: relative;
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

.block-content .attention {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 6px;
  background: linear-gradient(
    to right,
    red,
    orange,
    yellow,
    green,
    blue,
    indigo,
    violet,
    red,
    orange,
    yellow,
    green,
    blue,
    indigo,
    violet
  );
  background-size: 500% 100%;
  animation: rainbowMove 3s linear infinite;
}

@keyframes rainbowMove {
  0% {
    background-position: 0% 0%; /* 从左侧开始 */
  }
  100% {
    background-position: 600% 0%; /* 移动到右侧 */
  }
}

.edit-icon {
  position: fixed;
  right: 80px;
  bottom: 60px;
}

.menu-icon {
  position: fixed;
  right: 140px;
  bottom: 60px;
}
</style>
