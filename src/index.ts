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
    'rank': async (message: discord.Message, args: string) => {
        if (!conf.botMasters.includes(message.author.id)) return; // when the command only should be used by mods

        // date format used: '04 Dec 1995 00:12:00 GMT'
        let params = args.split(","); // params = [date1, date2, number of results] || Seperate parameters with ','

        let submissionChannel = message.client.channels.get(conf.channels.test);
        if (submissionChannel instanceof discord.TextChannel)
            submissionChannel.fetchMessages()
                .then(messages => {
                    let m = messages.filter(m => m.createdTimestamp >=  Date.parse(params[0]) && m.createdTimestamp <=  Date.parse(params[1]) && m.attachments.first() != undefined).array();
                    m.sort(compare);
                    for (let i = 0; i < parseInt(params[2]); i++) {
                        const file = m[i].attachments.first();
                        let attachment = new discord.Attachment(file.url);
                        message.channel.send(`#${i +1}: ${m[i].content}`, attachment);
                    }
                })
                .catch(() => message.channel.send("There was a problem retrieving the messages"));
    },
    'clear': async (message: discord.Message, args: string) => {
        if (!conf.botMasters.includes(message.author.id)) return;

        // date format used: '04 Dec 1995 00:12:00 GMT'
        let submissionChannel = message.client.channels.get(conf.channels.test);
        if (submissionChannel instanceof discord.TextChannel)
            submissionChannel.fetchMessages({limit: 100})
                .then(messages => {
                    let m = messages.filter(mes => mes.createdTimestamp <= Date.parse(args) && mes.attachments.first() != undefined).array();
                    let mTotal = m.length;
                    if (submissionChannel instanceof discord.TextChannel)
                        submissionChannel.bulkDelete(m, true).catch(() => message.channel.send(`Failed to delete messages`));
                    message.channel.send(`${mTotal} messages sent before ${args} were deleted`);
                })
                .catch(() => message.channel.send("There was a problem retrieving the messages"));
    },
    'golf': async (message: discord.Message, args: string) => {
        const rulesEmbed = new discord.RichEmbed()
            .setColor('#00b300')
            .setTitle('Code Golf')
            .addField('Current golfing problem', 'Make a bot to do golfing-mod\'s work')
            .addField('Submission deadline', 'When ever code golfing begins')
            .setTimestamp()
            .setFooter(`Courtesy of Nemo & Otaku`);

        message.channel.send(rulesEmbed);
    },
    'submit': async (message: discord.Message, args: string) => {
        let file = message.attachments.first();
        if (file != undefined) {
            let fileType = file.filename.substring(file.filename.lastIndexOf("."));
            let fileName = `${message.author.username}_${message.createdTimestamp}${fileType}`;

            let attachment = new discord.Attachment(file.url, fileName);
            let submissionChannel = message.client.channels.get(conf.channels.test);
            if (submissionChannel instanceof discord.TextChannel)
                submissionChannel.send(`Submission (${file.filesize} bytes) from ${message.author.username} (${message.author.id}) made in ${message.channel instanceof discord.DMChannel ? 'DM' : message.channel}`, attachment)
                    .then(() => {
                        message.channel.send(`${message.author.username}, your submission has successfully been sent`);
                    })
                    .catch(() => {
                        message.channel.send(`${message.author.username}, your submission failed. Your file may be too large.`);
                    });
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

const compare = (a: discord.Message, b: discord.Message) => {
    const A = a.attachments.first().filesize;
    const B = b.attachments.first().filesize;
    
    let comparison = 0;
    if (A > B) {
      comparison = 1;
    } else if (A < B) {
      comparison = -1;
    }
    return comparison;
}

client.login(conf.botToken);