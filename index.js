require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

// 환경변수
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const NOTICE_CHANNEL_ID = process.env.NOTICE_CHANNEL_ID;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const CHZZK_CHANNEL_ID = process.env.CHZZK_CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let youtubeWasLive = false;

// 유튜브 라이브 체크
async function checkYoutubeLive() {
    try {
        const url =
            `https://www.googleapis.com/youtube/v3/search?part=snippet` +
            `&channelId=${YOUTUBE_CHANNEL_ID}` +
            `&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;

        const res = await axios.get(url);
        return res.data.items.length > 0;

    } catch (err) {
        console.error("유튜브 API 오류:", err.message);
        return false;
    }
}

// 알림 체크
async function checkStreams() {
    const youtubeLive = await checkYoutubeLive();
    const channel = client.channels.cache.get(NOTICE_CHANNEL_ID);

    if (youtubeLive && !youtubeWasLive) {
        channel.send(
            `@everyone 🔴 **유튜브 라이브 시작!**\n` +
            `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}/live\n\n` +
            `**치지직 방송도 보기:**\n` +
            `https://chzzk.naver.com/${CHZZK_CHANNEL_ID}`
        );
    }

    youtubeWasLive = youtubeLive;
}

client.once("ready", () => {
    console.log(`로그인 완료! ${client.user.tag}`);
    setInterval(checkStreams, 30000);
});

client.login(DISCORD_TOKEN);
