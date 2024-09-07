import { configDotenv } from 'dotenv';
configDotenv('./env');
const port = process.env.PORT || 8000;

import replybot from './reply.json' with { type: "json" };
import { DefaultAzureCredential } from '@azure/identity';
import config from './config.json' with { type: "json" };
import { SecretClient } from '@azure/keyvault-secrets';
import TelegramBot from 'node-telegram-bot-api';
import { Dropbox } from "dropbox";
import axios from "axios";
import cron from 'cron';
import fs from 'fs';
import express from 'express';
const Database = {};

const app = express();

const credential = new DefaultAzureCredential();

const vaultName = "BotTgf";

const vaultUrl = `https://${vaultName}.vault.azure.net`;
// Azure client (for local purposes only)
const client = new SecretClient(vaultUrl, credential);
const refreshKey = 'REFRESHTOKEN';
const secretKey = 'SECRETTOKEN';
const clientID = 'CLIENTID';

var refreshUrl = 'https://api.dropboxapi.com/oauth2/token';
// var fonder2Move = '/NoPorn_USED';
var mainFolder = '/NoPorn';
// Test Channel
var channelId = '1399835669';
// Fuse Channel
// var channelId = '-1002117179392';

async function starting() {
    //Azure
    // var resultAzRefreshTk = await client.getSecret(refreshKey);
    // var resultAzClientID = await client.getSecret(clientID);
    // var resultAzSecret = await client.getSecret(secretKey);

    var resultAzRefreshTk = process.env.REFRESH_TOKEN;
    var resultAzClientID = process.env.CLIENT_ID;
    var resultAzSecret = process.env.SECRET_TOKEN;
    var tgToken = process.env.TG_TOKEN;

    let bot = new TelegramBot(tgToken, { polling: true });
    bot.on("polling_error", console.log);

    // Automatic Flow
    // await dbx.filesListFolder({ path: mainFolder })
    //     .then(function (response) {
    //         let maxFileSend = 1;
    //         response.result.entries.forEach(async (element, index) => {
    //             if (index < maxFileSend) {
    //                 await dbx.filesGetTemporaryLink({
    //                     path: element.path_display
    //                 }).then((r) => {
    //                     bot.sendMediaGroup(channelId, [{
    //                         media: r.result.link, type: "photo",
    //                     }]).then((e) => {
    //                         bot.copyMessage(config.channel, channelId, e[0].message_id, {
    //                             caption: 'Look those views! 👀',
    //                             disable_notification: true
    //                         });
    //                     });
    //                 });

    //                 // Funcion para mover archivos que ya fueron usados
    //                 await dbx.filesMoveBatchV2({
    //                     entries: [{
    //                         from_path: element.path_display, to_path: `${fonder2Move}/${element.name}`
    //                     }],
    //                     allow_ownership_transfer: true,
    //                     autorename: false,
    //                 })
    //                     .then(function (response) {
    //                         console.log(response);
    //                     })
    //                     .catch(function (error) {
    //                         console.log(error);
    //                     });
    //             }
    //         });
    //     })
    //     .catch(function (error) {
    //         console.error(error);
    //     });

    //Set schedulle to send Messages

    new cron.CronJob(
        // Set data function, schedule function 2 execute PHOTO GETTER
        '*/2 * * * *',
        // '00 17 * * *',
        async function () {
            // Start with our save refresh token, for exhance to access token
            refreshUrl += `?grant_type=refresh_token&refresh_token=${resultAzRefreshTk}&client_id=${resultAzClientID}&client_secret=${resultAzSecret}`;
            var dbxToken = await axios.post(refreshUrl)
                .then((res) => {
                    return res.data.access_token;
                });
            // Bring Oauth2 token access point to dropbox
            var dbx = new Dropbox({ accessToken: dbxToken });
            // TODO: Set /config command to change this param 
            // @maxFileSend
            await dbx.filesListFolder({ path: mainFolder })
                .then(function (response) {
                    let maxFileSend = 20;
                    response.result.entries.forEach(async (element, index) => {
                        if (index < maxFileSend) {
                            await dbx.filesGetTemporaryLink({
                                path: element.path_display
                            }).then(async (r) => {
                                bot.sendMediaGroup(channelId, [{
                                    media: r.result.link, type: "photo",
                                }]).then(async (e) => {
                                    bot.copyMessage(config.channel, channelId, e[0].message_id, {
                                        disable_notification: true
                                    });
                                    await dbx.filesDeleteBatch({
                                        entries: [{
                                            path: element.path_display
                                        }]
                                    })
                                        .then(function (response) {
                                            console.log(response);
                                        })
                                        .catch(function (error) {
                                            console.log(error);
                                        });
                                });
                                // Funcion para eliminar archivos que ya fueron usados
                            });

                            // // Funcion para mover archivos que ya fueron usados
                            // await dbx.filesMoveBatchV2({
                            //     entries: [{
                            //         from_path: element.path_display, to_path: `${fonder2Move}/${element.name}`
                            //     }],
                            //     allow_ownership_transfer: true,
                            //     autorename: false,
                            // })
                            //     .then(function (response) {
                            //         console.log(response);
                            //     })
                            //     .catch(function (error) {
                            //         console.log(error);
                            //     });
                        }
                    });
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        null,
        true,
        'Portugal'
    );

    // Admin tools (Bot Params)
    bot.on('message', (msg) => {
        console.log(msg)
        let start = "/help";
        let start2 = "/start";
        if (!msg.text) return;
        if (msg.text.toString().startsWith('/unban') && msg.chat.id == 431324710) { try { fs.unlinkSync(`./banned/${msg.text.toString().split(' ')[1]}.txt`) } catch (e) { } };
        if (fs.readdirSync('./banned', { encoding: "utf-8" }).includes(msg.chat.id + '.txt')) return;
        if (msg.text.toString().toLowerCase() == start || msg.text.toString().toLowerCase() == start2) {
            console.log(msg.chat.id)
            welcomemsg(msg.chat.id,
                msg.from.first_name)
        }
    });

    bot.on("callback_query", callbackQuery => {
        let channelId = callbackQuery.message.chat.id;
        let callbackData = callbackQuery.data.split(" ")[0];

        switch (callbackData) {
            case "sumbit":

                bot.sendMessage(channelId, replybot.rules, {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                {
                                    text: "✔️",
                                    callback_data: 'accept'
                                },
                                {
                                    text: "❌",
                                    callback_data: 'decline'
                                }
                            ]
                        ],
                    }),
                });
                bot.answerCallbackQuery(callbackQuery.id);
                break;
            case "accept":
                if (Database[channelId] == undefined) Database[channelId] = { nick: true, message: null, msg: null, artist: null, ban: null };
                else Database[channelId].msg = null
                bot.sendMessage(channelId, replybot.acceptrules)
                //console.log(Database)
                messageartist(channelId, 1, bot, buttons, Database);
                bot.deleteMessage(channelId, callbackQuery.message.message_id);
                bot.answerCallbackQuery(callbackQuery.id);
                break;
            case "contact":
                bot.deleteMessage(channelId, callbackQuery.message.message_id);
                bot.sendMessage(channelId, replybot.contact, {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                {
                                    text: "back",
                                    callback_data: 'back welcome',
                                }
                            ]
                        ],
                    }),
                });
                bot.answerCallbackQuery(callbackQuery.id);
                break;
            case "decline":
                bot.answerCallbackQuery(callbackQuery.id);
                bot.deleteMessage(channelId, callbackQuery.message.message_id);
                bot.sendMessage(channelId, replybot.declineReply).then(e => {
                    setTimeout(() => { bot.deleteMessage(channelId, e.message_id); }, 5000)
                });
                break;
            case "back":
                bot.answerCallbackQuery(callbackQuery.id);
                bot.deleteMessage(channelId, callbackQuery.message.message_id);
                let callbackData2 = callbackQuery.data.split(" ")[1];
                if (callbackData2 == "welcome") {
                    return welcomemsg(channelId, callbackQuery.message.chat.first_name)
                }
                break;

            case "username":
                bot.answerCallbackQuery(callbackQuery.id);
                if (!Database[channelId]) return;
                //console.log(Database[channelId])
                //console.log(Database)
                Database[channelId].nick = !Database[channelId].nick;
                bot.deleteMessage(channelId, Database[channelId].message.message_id);
                buttons(Database, Database[channelId].msg, channelId, bot);
                break;

            case "artist":
                bot.answerCallbackQuery(callbackQuery.id);
                if (!Database[channelId]) return;
                bot.sendMessage(channelId, replybot.sendArtist);
                messageartist(channelId, 2, bot, buttons, Database);
                break;

            case "review":
                bot.answerCallbackQuery(callbackQuery.id);
                if (!Database[channelId]) return;
                if (!Database[channelId].artist) return bot.sendMessage(channelId, replybot.provideartist);
                bot.deleteMessage(channelId, Database[channelId].message.message_id);
                copy(channelId);
                bot.sendMessage(channelId, replybot.sent);
                Database[channelId].artist = null
                break;

            case "accepted":
                bot.answerCallbackQuery(callbackQuery.id);
                let splitted1 = callbackQuery.message.caption.split('\n');
                let good = [];
                for (let i = 0; i < splitted1.length - 2; i++) {
                    good.push(splitted1[i]);
                }
                const senderIdAccept = callbackQuery.data.split(" ")[1];
                bot.copyMessage(config.channel, callbackQuery.message.chat.id, callbackQuery.message.message_id, { caption: good.join('\n') }).then(e => setTimeout(() => bot.deleteMessage(channelId, callbackQuery.message.message_id), 2000));
                bot.sendMessage(Number.parseInt(senderIdAccept), replybot.sendaccept);
                bot.sendMessage(channelId, replybot.accepted)
                break;

            case "declined":
                bot.answerCallbackQuery(callbackQuery.id);
                const senderIdDecline = callbackQuery.data.split(" ")[1];
                bot.sendMessage(Number.parseInt(senderIdDecline), replybot.declinedMessage);
                bot.deleteMessage(channelId, callbackQuery.message.message_id);
                bot.sendMessage(channelId, replybot.declineReplyart)
                break;

            case "ban":
                bot.answerCallbackQuery(callbackQuery.id);
                const senderIdban = callbackQuery.data.split(" ")[1];
                bot.sendMessage(channelId, replybot.banreason);
                messageban(channelId, 1, senderIdban, bot, Database, fs, replybot);
                break;
            default:
                bot.answerCallbackQuery(callbackQuery.id);
                break;
        }
    });
    function copy(channelId) {

        let verifyart = [
            { text: "✔", callback_data: 'accepted {senderId}' },
            { text: "❌", callback_data: 'declined {senderId}' },
            { text: "🔨", callback_data: 'ban {senderId}' }
        ]

        verifyart.forEach(function (element, index) {
            verifyart[index].callback_data = element.callback_data.replace("{senderId}", channelId.toString());
        });

        bot.copyMessage(config.reviewer, Database[channelId].msg.chat.id, Database[channelId].msg.message_id, {
            caption: `Sent by: ${Database[channelId].nick ? '@' + Database[channelId].msg.chat.username : 'Anon'}\nArtist: ${Database[channelId].artist}\nSent via @GaySubmitBot\ndev: @${Database[channelId].msg.chat.username}\ndev: ${Database[channelId].msg.chat.id}`,
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    verifyart
                ]
            })
        });
    }
    function welcomemsg(channelId, username) {
        bot.sendMessage(channelId, replybot.mainmessage.replace("{name}", username), {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        {
                            text: "Submit art",
                            callback_data: 'sumbit'
                        },
                        {
                            text: "Contact",
                            callback_data: 'contact'
                        }
                    ],
                ],
            }),
        }
        );
    }
}
starting();

app.get('/', (req, res) => {
    res.json({
        message: 'Hello, Dog 🐕!',
    })
})

app.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})
