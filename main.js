import { configDotenv } from 'dotenv';
// import mongoose, { model, Schema } from 'mongoose';
configDotenv('./env');
const port = process.env.PORT || 8000;

import replybot from './reply.json' with { type: "json" };
import config from './config.json' with { type: "json" };
import TelegramBot from 'node-telegram-bot-api';
import { Dropbox } from "dropbox";
import axios from "axios";
import cron from 'cron';
import fs from 'fs';
import express from 'express';
const Database = {};

const app = express();

var refreshUrl = 'https://api.dropboxapi.com/oauth2/token';
// var mainFolder = '/Fox';
var mainFolder = '/NoPorn';
// Test Channel
// var channelId = '1399835669';
// Fuse Channel
var channelId = '-1002117179392';

// Connect to DB
// mongoose.connect('mongodb://atlas-sql-67203479cf9ebd596f4986f2-e2xpj.a.query.mongodb.net/sample_mflix?ssl=true&authSource=admin');

async function starting() {
    // const a = new Schema({
    //     count_img: Number
    // });
    // const b = model('ettelegram', a);
    // let article = b.findOne({});
    // console.log(article);

    var envRefreshTk = process.env.REFRESH_TOKEN;
    var envClientID = process.env.CLIENT_ID;
    var envSecret = process.env.SECRET_TOKEN;
    var tgToken = process.env.TG_TOKEN;

    let bot = new TelegramBot(tgToken, { polling: true });

    // var dbx = new Dropbox({ accessToken: envRefreshTk });

    // Automatic Flow
    // await dbx.filesListFolder({ path: mainFolder })
    //     .then(function (response) {
    //         let maxFileSend = 3;
    //         response.result.entries.forEach(async (element, index) => {
    //             if (index < maxFileSend) {
    //                 await dbx.filesGetTemporaryLink({
    //                     path: element.path_display
    //                 }).then((r) => {
    //                     bot.sendMediaGroup(channelId, [{
    //                         media: r.result.link, type: "photo",
    //                     }]).then(async (e) => {
    //                         bot.copyMessage(config.channel, channelId, e[0].message_id, {
    //                             caption: 'Look those views! 👀',
    //                             disable_notification: true
    //                         });
    //                         await dbx.filesDeleteV2({path: element.path_display}).then((res) => {
    //                             console.log("------------------ Start Deleted Img's (Metadata) ------------------");
    //                             console.log(` | Name 🌄 -> ${JSON.stringify(res.result.metadata.name)}                             |`);
    //                             console.log(`| Path 🛣️ -> ${JSON.stringify(res.result.metadata.path_display)}                          |`);
    //                             console.log(` | Low 🗑️ -> ${JSON.stringify(res.result.metadata.id)} 📎                          |`);
    //                             console.log("------------------ End Deleted Img's (Metadata) --------------------");
    //                         }).catch((errNo) => {
    //                             console.log(`There is something wrong: ${errNo}`);
    //                         });
    //                         // await dbx.filesDeleteBatch({
    //                         //     entries: [{
    //                         //         path: element.path_display
    //                         //     }]
    //                         // })
    //                         //     .then(async function (response) {
    //                         //         await dbx.filesDeleteBatchCheck({
    //                         //             async_job_id: response.result.async_job_id
    //                         //         }).then(async (checkResponse) => {
    //                         //             if (await checkResponse.result['.tag'] === "complete") {
    //                         //                 console.log('------------------ Check Starts ✅ ------------------');
    //                         //                 console.log(`Succeced deleted Images: ${JSON.stringify(checkResponse.result)}`);
    //                         //                 console.log('------------------ Check Ends ------------------');
    //                         //             }
    //                         //             let quouqeFileError = [];
    //                         //             if (checkResponse.result.entries) {
    //                         //                 quouqeFileError.push(checkResponse.result.entries);
    //                         //                 quouqeFileError.forEach((entry) => {
    //                         //                     dbx.filesDeleteV2(entry).then((res) => {
    //                         //                         console.log('------------------ Emergency Starts 📢 ------------------');
    //                         //                         console.log(`Emergency Deleted: ${JSON.stringify(res.result)}`);
    //                         //                         console.log('------------------ Emergency Ends ------------------');
    //                         //                     })
    //                         //                 })
    //                         //             }
    //                         //          })
    //                         //             .catch((checkFail) => {
    //                         //                 console.log(`Error deleting some images: ${checkFail}`);
    //                         //                 // element.path_display.forEach(element => {

    //                         //                 // });
    //                         //                 // dbx.filesDeleteV2({
    //                         //                 //     path
    //                         //                 // })
    //                         //             })
    //                         //             .finally(async (checkResponse) => { })
    //                         //     })
    //                         //     .catch(function (error) {
    //                         //         console.log(`Last error: ${error}`);
    //                         //     });
    //                     });
    //                 });
    //             }
    //         });
    //     })
    //     .catch(function (error) {
    //         console.error(`Technical difficults, please stand by 🐶: ${error}`);
    //     });

    //Set schedule to send Messages
    new cron.CronJob(
        // Set data function, schedule function 2 execute PICTURES GETTER
        // '*/1  * * * *',
        '00 17 * * *',
        async function () {
            bot.on("polling_error", console.log);
            // Start with our save refresh token, for exhance to access token
            refreshUrl += `?grant_type=refresh_token&refresh_token=${envRefreshTk}&client_id=${envClientID}&client_secret=${envSecret}`;
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
                    let maxFileSend = 15;
                    response.result.entries.forEach(async (element, index) => {
                        if (index < maxFileSend) {
                            await dbx.filesGetTemporaryLink({
                                path: element.path_display
                            }).then(async (r) => {
                                await bot.sendMediaGroup(channelId, [{
                                    media: r.result.link, type: "photo",
                                }]).then(async (e) => {
                                    await bot.copyMessage(config.channel, channelId, e[0].message_id, {
                                        disable_notification: true
                                    });
                                    // Funcion para eliminar archivos que ya fueron usados
                                    await dbx.filesDeleteV2(
                                        {
                                            path: element.path_display
                                        }
                                    ).then((res) => {
                                        let tdy = new Date();
                                        const formatter = new tdy.DateTimeFormat('en-US');
                                        const timeMoment = tdy.toLocaleTimeString();
                                        const formattedDate = formatter.format(date);
                                        console.log("------------------ Start Deleted Img's (Metadata) ------------------");
                                        console.log(` | Client 💾 -> ${JSON.stringify(res.result.metadata.client_modified)}         |`);
                                        console.log(`| Path 🛣️ -> ${JSON.stringify(res.result.metadata.path_display)}                |`);
                                        console.log(` | Low 🌄 -> ${JSON.stringify(res.result.metadata.id)} 📎                       |`);
                                        console.log("------------------ End Deleted Img's (Metadata) --------------------");
                                        if(index >= maxFileSend - 1){
                                            console.log(`------------------ 🌃 Tonight bot posted all those pictures -> ${index}! 🌃 --------------------`);
                                            console.log(`------------------ 🏜️ ${formattedDate}: <${timeMoment}/>! 🏞️ --------------------`);

                                        }else{
                                            console.log(`------------------ 🗿 Current posted pictures: (${index}) 🎢 --------------------`);
                                        }
                                    }).catch((errNo) => {
                                        console.log(`There is something wrong: ${errNo}`);
                                    });
                                });
                            });
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
        message: 'We are online 🐕!',
    })
})

app.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})
