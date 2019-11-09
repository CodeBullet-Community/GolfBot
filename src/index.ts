import * as discord from 'discord.js';
import * as fs from 'fs';
import * as conf from './bot-config.json';

// console logging info
require('console-stamp')(console, {
    metadata: function () {
        let orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        let err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        let stack: any = err.stack;
        Error.prepareStackTrace = orig;

        let output = `[${stack[1].getFileName().split(/[\\\/]/).pop()}:${stack[1].getFunctionName()}:${stack[1].getLineNumber()}]   `;
        for (; output.length < 25; output += ' ') { }
        return output;
    },
    pattern: 'dd/mm/yyyy HH:MM:ss.l'
});

process.on('uncaughtException', (error) => {
    console.error(error);
});

process.on('unhandledRejection', async (reason, promise) => {
    let error = new Error('Unhandled Rejection. Reason: ' + reason);
    console.error(error, "Promise:", promise);
});

// all commands
let commands = {
    'ping': async (message: discord.Message, args: string) => {
        if (!conf.botMasters.includes(message.author.id)) return; // when the command only should be used by mods
        // stuff
        message.channel.send(`pong, ${message.channel.id}`);
    },
    'rules': async (message: discord.Message, args: string) => {
        const rulesEmbed = new discord.RichEmbed()
            .setColor('#00b300')
            .setTitle('Coding Golf Rules')
            .setTimestamp()
            .setFooter(`Courtesy of Nemo & Otaku`);

        message.channel.send(rulesEmbed);
    },
    'submit': async (message: discord.Message, args: string) => {
        let file = message.attachments.first();
        if (file != undefined) {
            let fileType = file.filename.substring(file.filename.lastIndexOf("."));
            let fileName = `${message.author.username}_${message.createdTimestamp + fileType}`;

            let attachment = new discord.Attachment(file.url, fileName);
            let submissionChannel = message.client.channels.get(conf.channels.test);
            if (submissionChannel instanceof discord.TextChannel) {
                submissionChannel.send(`Submission from ${message.author.username} (${message.author.id}) made in ${message.channel instanceof discord.DMChannel ? 'DM' : message.channel}`, attachment)
                    .then(() => {
                        message.channel.send(`${message.author.username}, your submission has successfully been sent`);
                    })
                    .catch(() => {
                        message.channel.send(`${message.author.username}, your submission failed. Your file may be too large.`);
                    });
            }
        } else {
            message.channel.send(`${message.author.username}, please attach a file`);
        }
        if(!(message.channel instanceof discord.DMChannel)) message.delete();
    },
};

let client = new discord.Client({ disableEveryone: true });
client.on('ready', () => {
    console.info("I'm ready!");
});

client.on('message', async message => {
    if (message.author.bot) return; // bot shouldn't listen to other bots
    if (message.content.startsWith(conf.prefix)) {
        let command = message.content.split(' ')[0].slice(conf.prefix.length).toLowerCase(); // gets command name
        let args = message.content.slice(conf.prefix.length + command.length + 1);
        let cmdFunc = commands[command];
        if (cmdFunc) cmdFunc(message, args);
    }

});

client.login(conf.botToken);