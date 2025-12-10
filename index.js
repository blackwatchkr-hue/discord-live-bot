require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
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

// 유튜브 라이브 체크 (영상 ID 포함)
async function checkYoutubeLive() {
    try {
        const url =
            `https://www.googleapis.com/youtube/v3/search?part=snippet` +
            `&channelId=${YOUTUBE_CHANNEL_ID}` +
            `&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;

        const res = await axios.get(url);

        if (res.data.items.length > 0) {
            const video = res.data.items[0];
            return {
                live: true,
                videoId: video.id.videoId,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails.high.url
            };
        }

        return { live: false };

    } catch (err) {
        console.error("유튜브 API 오류:", err.message);
        return { live: false };
    }
}

// 알림 체크
async function checkStreams() {
    const yt = await checkYoutubeLive();
    const channel = client.channels.cache.get(NOTICE_CHANNEL_ID);

    // 라이브 시작 + 이전엔 라이브가 아니었을 때
    if (yt.live && !youtubeWasLive) {

        const embed = new EmbedBuilder()
            .setTitle("🔴 유튜브 라이브 시작!")
            .setDescription(
                `**${yt.title}**\n\n` +
                `[➡️ 유튜브 라이브 보러가기](https://www.youtube.com/watch?v=${yt.videoId})\n\n` +
                `[🟢 치지직 방송 보러가기](https://chzzk.naver.com/${CHZZK_CHANNEL_ID})`
            )
            .setColor("#FF0000")
            .setImage(yt.thumbnail);

        channel.send({ content: "@everyone", embeds: [embed] });
    }

    youtubeWasLive = yt.live;
}

client.once("ready", () => {
    console.log(`로그인 완료! ${client.user.tag}`);
    setInterval(checkStreams, 30000);
});

client.login(DISCORD_TOKEN);
