/* eslint-disable new-cap */
/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-use-before-define */
import axios from "axios";
import * as ffn from "firebase-functions";
import * as puppeteer from "puppeteer";
import { BehaviorSubject } from "rxjs";
import { iGeniusUser, iGeniusUserResponse } from "../models/igenius.model";
import { logger } from "../utils/utils";

const username = ffn.config().igenius.username;
const password = ffn.config().igenius.password;
const apiKey = ffn.config().igenius.apikey;
const siteKey = ffn.config().igenius.sitekey;
const pageUrl = ffn.config().igenius.pageurl;

export const verifyClient = async (
  userId: number,
  res$: BehaviorSubject<iGeniusUserResponse>
): Promise<void> => {
  logger.info(`Verifing client with iGenius ID: ${userId}`, "verifyClient");

  let tries = 0;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      slowMo: 0,
      ignoreHTTPSErrors: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--window-size=1280,720"
      ]
    });
    const page = await browser.newPage();
    logger.info("Page Created", "verifyClient");
    res$.next({
      completion: 14.3,
      completionMsg: "Mi sto connettendo al sito di iGenius"
    });
    await page.goto("https://igenius.biz/login.html", {
      timeout: 120000,
      waitUntil: "networkidle2"
    });

    logger.info("Page Loaded", "verifyClient");
    res$.next({
      completion: 28.6,
      completionMsg: "Ok, sono sul sito di iGenius"
    });

    const timeout = (mills: number) =>
      new Promise((resolve) => setTimeout(resolve, mills));

    const bypassWebsiteCaptcha = async () => {
      logger.info("Solving Captcha...", "verifyClient > bypassWebsiteCaptcha");
      res$.next({
        completion: 57.2,
        completionMsg: "Oh oh... Devo dimostrare di non essere un robot"
      });

      try {
        const { data: res } = await axios({
          method: "get",
          url: `http://2captcha.com/in.php?key=${apiKey}&method=hcaptcha&sitekey=${siteKey}&pageurl=${pageUrl}&json=1`
        });
        logger.info(
          "Sent to 2Captcha to solve it",
          "verifyClient > bypassWebsiteCaptcha"
        );
        await timeout(25 * 1000); // Wait for 25 seconds
        res$.next({
          completion: 71.5,
          completionMsg: "Sono un robot, ma dovrebbe funzionare"
        });
        const { data } = await axios({
          method: "get",
          url: `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${res.request}&json=1`
        });
        logger.info(
          "2captcha responded with:",
          "verifyClient > bypassWebsiteCaptcha"
        );
        logger.info(data.request, "verifyClient > bypassWebsiteCaptcha");
        return data;
      } catch (err) {
        logger.error(err, "verifyClient > bypassWebsiteCaptcha");
      }
    };

    const login = async (): Promise<void> => {
      logger.info("Trying to login", "verifyClient > login");
      res$.next({
        completion: 42.9,
        completionMsg: "Accedo ad iGenius"
      });
      await page.type('input[name="username"]', username);
      await page.type('input[name="password"]', password);

      const { request } = await bypassWebsiteCaptcha();

      await page.evaluate(
        `document.querySelector('textarea[name="g-recaptcha-response"]').innerHTML='${request}'`
      );
      await page.evaluate(
        `document.querySelector('textarea[name="h-captcha-response"]').innerHTML='${request}'`
      );

      await page.evaluate('document.querySelector("form.login-form").submit()');

      logger.info("LOGIN SUBMIT", "verifyClient > login");
      res$.next({
        completion: 85.8,
        completionMsg: "Indovina? Sta funzionando eheheh"
      });
      await page.waitForNavigation({
        timeout: 120000
      });
      return await checkLogin();
    };

    const elabHtml = async (): Promise<void> => {
      logger.info("Elaboring HTML", "verifyClient > elabHtml");
      await page.goto(
        "https://shield.igenius.biz/client_homepage.dhtml?a=1&language=EN"
      );
      await page.goto(
        `https://shield.igenius.biz/downline.dhtml?a=1&daterange=&view=enroller&xuserid=${userId}`
      );

      const u = await page.evaluate(getUserDetails);
      res$.next({
        completion: 97,
        completionMsg:
          "Oh beh, ha funzionato :D Aspetta un secondo mentre verifico le tue info di iGenius",
        user: u
      });
      res$.complete();
      return;
    };

    const checkLogin = async (): Promise<void> => {
      logger.info("Checking Login...", "verifyClient > checkLogin");
      const host = await page.evaluate(() => location.host);
      if (!host.includes("shield")) {
        const defaultTimer = 30 * 1000;
        const timer = tries <= 0 ? defaultTimer : defaultTimer * tries;
        tries += 1;
        const normTimer = timer > 18000000 ? 18000000 : timer;
        const consoleTimer =
          normTimer >= 3600000
            ? normTimer / 60 / 60 / 1000
            : normTimer / 60 / 1000;
        logger.error(
          `[LOGIN FAILED] Waiting for ${consoleTimer} ${
            normTimer >= 3600000 ? "hours" : "minutes"
          }`,
          "verifyClient > checkLogin"
        );
        res$.next({
          completion: 28.6,
          completionMsg: `Uffa, non ha funzionato 😢 Riprovo fra ${consoleTimer} ${
            consoleTimer == 1
              ? normTimer >= 3600000
                ? "oretta"
                : "minutino"
              : normTimer >= 3600000
              ? "orette"
              : "minutini"
          }, puoi chiudere questa pagina se vuoi, ti avviserò via email appena ci sarò riuscito`
        });
        await timeout(normTimer);
        return await login();
      }
      logger.info("LOGGED SUCCESFULLY", "verifyClient > checkLogin");
      return await elabHtml();
    };

    const getUserDetails = () => {
      logger.info("Getting User Details...", "verifyClient > getUserDetails");
      const tds = document.querySelectorAll(
        "table.datatable-downline tbody tr:nth-child(1) td"
      );
      const user: iGeniusUser = {};
      const parseNumber = (num: string): number => {
        const normNum = num.replace(",", "");
        return parseFloat(normNum);
      };
      tds.forEach((td, i) => {
        switch (i) {
          case 0:
            break;
          case 1: // ID
            user.id = parseNumber(td.innerHTML);
            break;
          case 2: // Name
            user.name = td.innerHTML;
            break;
          case 3: // Country
            const iFlag = td.innerHTML.indexOf("flags/");
            const iPng = td.innerHTML.indexOf(".png");
            const str = td.innerHTML.slice(iFlag, iPng).replace("flags/", "");
            user.country = str;
            break;
          case 4: // PV
            user.pv = parseNumber(td.innerHTML);
            break;
          case 5: // Enroll Volume
            user.enrollVolume = parseNumber(td.innerHTML);
            break;
          case 6: // QEV
            user.qev = parseNumber(td.innerHTML);
            break;
          case 7: // BV Left
            user.bvLeft = parseNumber(td.innerHTML);
            break;
          case 8: // BV Right
            user.bvRight = parseNumber(td.innerHTML);
            break;
          case 9: // Active Left
            user.activeLeft = parseNumber(td.innerHTML);
            break;
          case 10: // Active Right
            user.activeRight = parseNumber(td.innerHTML);
            break;
          case 11: // Current Rank
            user.currentRank = td.innerHTML;
            break;
          case 12: // Highest Rank
            user.highestRank = td.innerHTML;
            break;
          case 13: // Subscription
            user.subscription = td.innerHTML;
            break;
          case 14: // 4 Week Rolling Left
            user.monthRollingLeft = parseNumber(td.innerHTML);
            break;
          case 15: // 4 Week Rolling Right
            user.monthRollingRight = parseNumber(td.innerHTML);
            break;
          case 16: // Left + Holding
            user.leftAndHolding = parseNumber(td.innerHTML);
            break;
          case 17: // Right + Holding
            user.rightAndHolding = parseNumber(td.innerHTML);
            break;
          case 18: // Last Order Date
            user.lastOrder = new Date(td.innerHTML);
            break;
          case 19: // Last Order BV
            user.lastOrderBV = parseNumber(td.innerHTML);
            break;
          case 20: // Join Date
            user.joinDate = new Date(td.innerHTML);
            break;
          case 21: // Username
            user.username = td.innerHTML;
            break;
          case 22: // Enroller Name
            user.enrollerName = td.innerHTML;
            break;
          case 23: // Email
            user.email = td.innerHTML;
            break;

          default:
            break;
        }
      });
      return user;
    };

    await login();
    browser.close();
    return;
  } catch (error) {
    const normErr = typeof error === "string" ? error : JSON.stringify(error);
    res$.next({
      completion: 0,
      completionMsg:
        "Oh oh... C'è stato un problemino, ho avvisato lo staff. Puoi chiudere questa pagina, ti aggiornerò via email appena avrò verificato il tuo account",
      error: new Error(normErr)
    });
    res$.complete();
    logger.error(normErr, "verifyClient");
    return;
  }
};
