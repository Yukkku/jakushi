import { furusato, kirakira, tutorial } from "./score.js";

const heading = document.createElement("h1");
heading.innerText = "オタマトーン自動演奏システム「Jakushi」";
document.body.append(heading);

const getOtama = () => new Promise(resolve => {
  const connectButton = document.createElement("input");
  connectButton.type = "button";
  connectButton.value = "接続する";
  document.body.appendChild(connectButton);

  connectButton.addEventListener("click", async () => {
    const port = await navigator.serial.requestPort();
    connectButton.remove();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    resolve(async f => {
      await writer.write(encoder.encode(String(Math.round(f)) + "\n"));
    });
  });
});

const otama = await getOtama();

let isPlaying = false;
const playScript = async code => {
  isPlaying = true;
  const sleep = async t => await new Promise(r => setTimeout(r, t));
  for (const line of code.trim().split("\n")) {
    if (!isPlaying) return false;
    if (/^\s*sleep\s+\d+\s*$/.test(line)) {
      const t = Number(line.match(/^\s*sleep\s+(\d+)\s*$/)[1]);
      await sleep(t);
    }
    if (/^\s*freq\s+\d+\s*$/.test(line)) {
      const f = Number(line.match(/^\s*freq\s+(\d+)\s*$/)[1]);
      otama(f);
    }
    if (/^\s*note\s+\d+\s*$/.test(line)) {
      const n = Number(line.match(/^\s*note\s+(\d+)\s*$/)[1]);
      otama(440 * 2 ** ((n - 69) / 12));
    }
    if (/^\s*stop\s*$/.test(line)) {
      otama(0);
    }
  }
  stopScript();
  return true;
};
const stopScript = () => {
  isPlaying = false;
  otama(0);
};

const buttons = document.createElement("div");

const playButton = document.createElement("input");
playButton.type = "button";
playButton.value = "再生する";

const sample1 = document.createElement("input");
sample1.type = "button";
sample1.value = "サンプル1";

const sample2 = document.createElement("input");
sample2.type = "button";
sample2.value = "サンプル2";

const sample3 = document.createElement("input");
sample3.type = "button";
sample3.value = "サンプル3";

buttons.append(playButton, sample1, sample2, sample3);

const textarea = document.createElement("textarea");
textarea.value = furusato;

playButton.addEventListener("click", async () => {
  if (isPlaying) {
    stopScript();
    playButton.value = "再生する";
    return;
  }
  playButton.value = "停止する";
  if (await playScript(textarea.value)) {
    playButton.value = "再生する";
  }
});
sample1.addEventListener("click", async () => {
  textarea.value = furusato;
});
sample2.addEventListener("click", async () => {
  textarea.value = kirakira;
});
sample3.addEventListener("click", async () => {
  textarea.value = tutorial;
});

document.body.append(buttons, textarea);
