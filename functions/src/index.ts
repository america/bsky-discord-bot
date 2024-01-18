import * as dotenv from "dotenv";
dotenv.config();
// require("dotenv").config();
import {TextEncoder} from "util";
import {AppBskyFeedPost, AppBskyRichtextFacet, BskyAgent} from "@atproto/api";
// import { configDotenv } from "dotenv";
import * as functions from "firebase-functions";
import {defineString} from "firebase-functions/params";

// const bskyService = "https://bsky.social";
const bskyService = "https://bsky.app";
const discordURL = "https://discord.gg/fyGnYh2k2e";

export const postJob = functions.pubsub
  .schedule("05 */1 * * *")
  .onRun(async () => {
    try {
      // Blueskyへログイン
      const agent = new BskyAgent({service: bskyService});
      await agent.login({
        identifier: defineString("BSKY_ID").value(),
        password: defineString("BSKY_PASSWORD").value(),
      });

      // リッチテキストの作成
      const encoder = new TextEncoder();

      const plainText = `[botのテスト中] Gentoo Linux 勉強会(非公式)サーバー』について \n\n

                     Gentoo Linuxについて一緒に勉強していこうというサーバーです。\n

                     Gentooを触ったことがなくても構いません。\n\n

                     公用語は日本語です。\n

                     `;

      const byteStart = encoder.encode(plainText).byteLength;
      const byteEnd = byteStart + encoder.encode(discordURL).byteLength;
      const textParams = `${plainText}${discordURL}`;

      const facetsParams: AppBskyRichtextFacet.Main[] = [
        {
          index: {
            byteStart,
            byteEnd,
          },
          features: [{$type: "app.bsky.richtext.facet#link", uri: discordURL}],
        },
      ];

      const embedParams: AppBskyFeedPost.Record["embed"] = {
        $type: "app.bsky.embed.external",
        external: {
          uri: discordURL,
        },
      };

      // Blueskyへ投稿
      const postParams: AppBskyFeedPost.Record = {
        $type: "app.bsky.feed.post",
        text: textParams,
        facets: facetsParams,
        embed: embedParams,
        createdAt: new Date().toISOString(),
      };
      await agent.post(postParams);
    } catch (error) {
      console.error(error);
      process.exit(-1);
      // return Promise.resolve();
    }

    return null;
  });
