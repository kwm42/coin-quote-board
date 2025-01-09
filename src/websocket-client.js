const WEBSOCKET_URL = "wss://data-stream.binance.vision:443/ws/btcusdt@kline_1m";

class WebSocketClient {
  constructor({
    url,
    onmessageHandler,
  }) {
    this.url = url;
    this.ws = new WebSocket(url);
    this.onmessageHandler = onmessageHandler;
    this.ws.onopen = this.onopen.bind(this);
    this.ws.onmessage = this.onmessage.bind(this);
    this.ws.onerror = this.onerror.bind(this);
  }

  onopen() {
    console.log("WebSocket 连接成功");
  }

  onmessage(event) {
    // console.log("收到消息：", event.data);
    const data = this.parse(event.data);
    this.onmessageHandler(data);
  }

  onerror(error) {
    console.error("WebSocket 连接出错：", error);
  }

  parse(data) {
    try {
      return JSON.parse(data);
    }
    catch (error) {
      console.error("解析 JSON 出错：", error);
      return null;
    }
  }
}

export {
  WebSocketClient,
  WEBSOCKET_URL
}