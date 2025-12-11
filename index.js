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

/**
 * ⚡ 오늘 변경된 유튜브 방식에 완전 대응하는 새로운 라이브 감지 방식
 * 1) /live 페이지 HTML 불러오기
 * 2) "videoId":"xxxx" 패턴 검색
 * 3) liveStreamingDetails API로 실제 라이브인지 최종 확인
 */
async function checkYoutubeLive() {
    try {
        const livePageUrl = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}/live`;
        const html = await axios.get(livePageUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        // 1) HTML에서 videoId 추출
        const regex = /"videoId":"(.*?)"/;
        const match = html.data.match(regex);

        if (!match) return { live: false };

        const videoId = match[1];

        // 2) 해당 videoId 실제 라이브인지 검증
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const res = await axios.get(apiUrl);

        const info = res.data.items?.[0]?.liveStreamingDetails;

        if (!info || !info.actualStartTime)
            return { live: false };

        // 🔥 진짜 라이브인 경우
        return {
            live: true,
            videoId
        };

    } catch (err) {
        console.error("유튜브 라이브 감지 오류:", err);
        return { live: false };
    }
}

// 알림 체크
async function checkStreams() {
    const yt = await checkYoutubeLive();
    const channel = client.channels.cache.get(NOTICE_CHANNEL_ID);

    if (yt.live && !youtubeWasLive) {
        channel.send(
            `@everyone 🔴 **유튜브 라이브 시작!**\n` +
            `https://www.youtube.com/watch?v=${yt.videoId}\n\n` +
            `**치지직 방송도 보기:**\n` +
            `https://chzzk.naver.com/${CHZZK_CHANNEL_ID}`
        );
    }

    youtubeWasLive = yt.live;
}

client.once("ready", () => {
    console.log(`로그인 완료! ${client.user.tag}`);
    setInterval(checkStreams, 30000); // 30초마다 체크
});

client.login(DISCORD_TOKEN);
