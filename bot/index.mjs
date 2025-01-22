// imports
import {Client, GatewayIntentBits, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    EmbedBuilder, Collection, ActivityType,PermissionFlagsBits } from 'discord.js';
import { createCanvas, loadImage, registerFont } from 'canvas'; import fs from 'fs';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
// BOT-SCOPED HELPERS
// [HELPER] Set bot's status.
// Options: 'online', 'idle', 'dnd', 'invisible'; ActivityType: Playing, Watching, Streaming (with URL), Listening to, Competing in
function setStatus(status, customText = null, activityType = null, activityText = null) {try{const pO={status,activities:activityType&&activityText?
        [{type:activityType,name:activityText}]:customText?[{type:ActivityType.Custom,state:customText}]:[]};
        if (activityType&&!Object.values(ActivityType).includes(activityType))return console.error(error);
        client.user.setPresence(pO);}catch(e){console.error(e);}
}
// [HELPER] Get function name
const getFuncName=()=>{const s=new Error().stack,cL=s.split("\n")[3],match=cL.match(/at (\S+?)\s/);return match?match[1].replace(/^Object\./, ""):"???";};
// LEVELS
let timeoutCollector;
let lastLevel = null;
let lastUsedDifficulty = null;
const difficulties = [
    { name: 'Easy', hex: '#8bd66b' },
    { name: 'Medium', hex: '#f49d46' },
    { name: 'Hard', hex: '#d4442c' },
    { name: 'Legendary', hex: '#f6a8f6' },
];
// data
function saveUserData(){try{fs.writeFileSync(globalPath,JSON.stringify(data,null,2));}catch (e){console.error(e);}}
const ROOT = `F:/Bots/SparkUp`;
const easyLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/easy_levels.json`, 'utf8'));
const mediumLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/medium_levels.json`, 'utf8'));
const hardLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/hard_levels.json`, 'utf8'));
const legendaryLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/leg_levels.json`, 'utf8'));
const userBadgesPath = JSON.parse(fs.readFileSync(`${ROOT}/data/badges.json`, 'utf8'));
const teamsPath = JSON.parse(fs.readFileSync(`${ROOT}/data/teams.json`, 'utf8'));
const allowedGuildChannelPath = `${ROOT}/data/allowedGuildChannels.json`;
const userDataJSON = { 
    streak: 0, highestStreak: 0, creatorPoints: 0, bannerID: '1', profileColor: '#FFFFFF', 
    levelCollection: {  Easy: [], Medium: [], Hard: [], Legendary: [] } 
};
let globalPath, data;
client.once('ready', () => {
    const guild = client.guilds.cache.first();
    globalPath = `F:\\Bots\\SparkUp\\data\\data-global.json`;
    data = fs.existsSync(globalPath) ? JSON.parse(fs.readFileSync(globalPath)) : {};
    console.log(`Loaded data for the ${guild.name} guild, ID: ${guild.id}`);
});
const levels = [...easyLevels, ...mediumLevels, ...hardLevels, ...legendaryLevels];
// IMPORTANT VARIABLES
// SETTINGS
const sparkName = 'SparkUp'
const PREFIX = 's!';
const ownerID = '1242556051857871002';
const ownerName = '`doctoon`';
const statusMode = 'online', activityType = ActivityType.Watching; let statusText = null, activityText;
const pingOnReply = false;
const cmdLockdown = false;
const gamblingMS = 3000;
const developers = [
    ownerID,
    '880242408116322335' // skyler/kazrii
];
// EMOJIS
const zeanEmoji = '<:zean:1327423276699353159>';
const rc = '<:randomcurse:1327399101645459507>';
const errEmoji = '<:error:1327423248568287262>';
const gamblerBadge = "<:gambler:1327043800429756477>";
// REUSED STRINGS/ELEMENTS
const errorHeader = `## A ${sparkName} error has occured! ${errEmoji}\n\`\`\`js\n`
const errorFooter = `\`\`\`\n-# Please contact ${ownerName} to fix this.`;
const restartMessage = `**${sparkName} will now be restarting, Reason provided by`;
const notEnoughPoints = `You don't have enough Creator Points to gamble!`;
const lockMsg=()=>`The \`${getFuncName()}()\` module is currently disabled due to numerous errors, please try again later. ${errEmoji}`;
const rLabel = 'Start a new game';
const alreadyRunningErr = `A game is already running! ${errEmoji}`;
const guessStr = 'Guess the Level!';
const timeUpStr = 'Time is up!';
const correctGuessStr = 'Congratulations! You guessed the Level correctly!';
const gambleCooldownStr = `You can only gamble once every ${gamblingMS / 1000} Seconds! ${errEmoji}`
const w = 'FFFFFF';
const rR=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('retry').setLabel(rLabel).setStyle(ButtonStyle.Secondary));
const outcomes = [
    createOutcome("double", "4ef5af", "assets/emoji/goldcpDT.png", async (userID, bet, username) => {
        const win = bet * 2; addCreatorPoints(userID, win);
        return { description: `${username} was awarded **${win}** Creator Points.` };
    }),
    createOutcome("lose", "ff0000", "assets/gambling/lose.png", async (userID, bet, username) => {
        return { description: `${username} lost ${bet} Creator Points.` };
    }),
    createOutcome("randomBadge", "ffffff", null, async (userID, _, username) => {
        const b = validBadges[Math.floor(Math.random() * validBadges.length)]; await addBadgeToUser(userID, b);
        return { description: `You got the ${b} badge!\n## Preview: ${badgeEmojis[b]}` };
    }),
    createOutcome("message_curse", "8b0000", "assets/gambling/randomcurse.png", async (userID, _, username) => {
        applyMessageCurse(userID, 7); 
        return { description: `You have been cursed! For the next 7 messages, you may lose half your Creator Points with each message you send.` }; 
    }),
    createOutcome("message_suffer", "8b0000", "assets/gambling/curse.png", async (userID, _, username) => {
        applyMessageCurse(userID, 25);
        return { description: `So you have chosen... SUFFERING >:) For the next 25 Messages, you may lose half of your creator points.` }; 
    }),
    createOutcome("message_blessing", "3FEEBA", "assets/gambling/blessing.png", async (userID, bet, username) => {
        applyBlessing(userID, 7);
        return { description:`You received a message blessing! For the next 7 messages, you will EARN half of your creator points.` };         
    }),
    createOutcome("blessing", "FFD700", "assets/gambling/blessing.png", async (userID, bet, username) => {
        const bP = Math.floor(bet * 1.5); addCreatorPoints(userID, bP);
        return { description:`You received a divine blessing! **${bP}** Creator Points have been added to your account.` };
    }),
    createOutcome("jackpot", "00FF00", "assets/gambling/rich.png", async (userID, bet, username) => {
        const jp=bet*10;addCreatorPoints(userID,jp);
        return { description: `Jackpot! You've won **${jp}** Creator Points. You're rich now!` };
    }),
    createOutcome("devTeamAccess", "1E90FF", "assets/gambling/test_team.png", async (userID, bet, username) => {
        return { description: `You've earned **Access to the [TAG] team!**\n-# **Please contact ${ownerName} to claim your reward.**`};
    }),
    createOutcome("slot", "8eff52", "assets/gambling/slotmachine.png", async (userID, bet, username) => {
        const win=bet*Math.floor(Math.random()*5+1);
        return { description: `Let's go gambling!\n\ You won **${win}** Creator Points!` };
    }),
];
// Register prefix and slash commands
client.commands = new Collection();
const commands = [
    { name: 'guess', aliases: ['g'], execute: sendGuessLevel },
    { name: 'stats', aliases: ['s', 'stats'], execute: showStats },
    { name: 'top', aliases: ['t'], execute: showLeaderboard },
    { name: 'topcp', aliases: ['tcp'], execute: showCPLeaderboard },
    { name: 'help', aliases: ['h'], execute: showHelp },
    { name: 'echo', aliases: ['e'], execute: echoMsg }, // DEVS ONLY
    { name: 'team', execute: showTeam },
    { name: 'gamble', execute: gamble },
    { name: 'gift', execute: giftCreatorPoints },
    { name: 'poll', execute: createPoll },
    { name: 'zap', aliases: ['z', 'zean', 'bean'], execute: zeanUser }, // DEVS ONLY
    { name: 'halloffame', aliases: ['hof', 'fame', 'hall'], execute: showHOF },
    { name: 'allowedsparkupchannels', aliases: ['asc', 'vsc'], execute: allowedSparkUpChannels }, // DEV/ADMIN ONLY
    { name: 'profile', aliases: ['p'], execute: showProfile },
    { name: 'forcegamble', execute: forceGamble }, // DOCTOON ONLY
    { name: 'setbanner', aliases: ['changebanner', 'sb', 'cb'], execute: changeBanner },
    { name: 'crash', aliases: ['stop'], execute: crashBot }, // DOCTOON ONLY
    { name: 'attachbanner', aliases: ['ab', 'banner', 'b'], execute: attachBanner },
    { name: 'cleanuserlevels', aliases: ['cl'], execute: cleanUserLevels }, // DOCTOON ONLY
    { name: 'skip', execute: skipCurrentLevel }, // DOCTOON ONLY
    { name: 'restart', aliases: ['r'], execute: restartBot }, // DOCTOON ONLY
    { name: 'clear', aliases: ['del', 'deletecurrentlevel', 'clearcurrentlevel'], execute: clearLevel }, // DOCTOON ONLY
];
commands.forEach(cmd => client.commands.set(cmd.name, cmd));
// Online Handler
client.on('ready', async () => {
    try {( async () => { try {
        const r = (256,256); const cv=createCanvas(r),c=cv.getContext('2d');c.fillStyle='black';c.fillRect(0,0,r); 
        c.fillStyle = 'white'; c.font='24px Outlier';c.fillText('PREWARM',50,150);}catch(e){console.error(e);}})();
        console.log(`${client.user.tag} is online!`);
        activityText = `for bugs in ${client.guilds.cache.size} servers.`;
        setStatus(statusMode, statusText, activityType, activityText);
    } catch (e) { console.error(e); }
});
// Message handler
client.on('messageCreate', message => {
    try {
        // if (message.author.bot) return;
        let guildChannels = {}; try {guildChannels = JSON.parse(fs.readFileSync(allowedGuildChannelPath, 'utf8'));} catch (error) {console.error(error);}
        // Message logging and not allowing nonsparkup channels
        const timestamp = new Date(message.createdTimestamp);
        const tC=`${((timestamp.getHours()+11) % 12 + 1)}:${String(timestamp.getMinutes()).padStart(2, '0')}${timestamp.getHours() >= 12 ? ' PM' : ' AM'}`;
        if (message.author.id === ownerID) {console.log(`[DEV] ${message.author.username} (${tC}): ${message.content}`);
        } else if (!message.author.bot) {console.log(`${message.author.username} (${tC}): ${message.content}`);
        } else {console.log(`[BOT] ${message.author.tag} (${tC}): ${message.content}`);}
        if (!guildChannels[message.guild.id]?.includes(message.channel.id)) {
            if(!message.guild||(!message.member?.permissions.has(PermissionFlagsBits.Administrator)&&message.author.id!==ownerID))return;
        }
        // Command handler
        if (message.content.startsWith(PREFIX)) {const args = message.content.slice(PREFIX.length).trim().split(/ +/);
            const cn = args.shift().toLowerCase();
            const c=client.commands.get(cn)||client.commands.find(cmd=>cmd.aliases&&cmd.aliases.some(alias=>alias.toLowerCase()===cn.toLowerCase()));
            if(c){if(args.length>0){c.execute(message,args);}else{c.execute(message);}}
        }
    } catch (error) { console.error(error); message.reply(`\`\`\`js\n${error}\n\`\`\``); }
});
// Button Handler
client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.isButton() || interaction.customId !== 'retry') return;
        if (interaction.replied || interaction.deferred || !interaction.channel) return;
        if (channelLevels.has(interaction.channel.id)) {await interaction.reply({ content: alreadyRunningErr, flags: 64 }); return; }
        const channelLevel = channelLevels.get(interaction.channel.id);
        if (channelLevel && !interaction.customId.includes('retry')) {lastUsedDifficulty = channelLevel.diff;
            console.log(`The last used Difficulty was ${lastUsedDifficulty}.`);
        } else if (!channelLevel && !lastUsedDifficulty) {lastUsedDifficulty = null;}
        channelLevels.delete(interaction.channel.id);
        await sendGuessLevel(interaction, true, lastUsedDifficulty);
    } catch (error) {if (error.message.includes('Unknown Interaction')) return channelLevels.delete(interaction.channel.id); console.error(error); }
});
// [HELPER] Add Level
async function addLevelToUser(userId, levelName, difficulty) {
    const user = await client.users.fetch(userId);
    if (!data[userId]) data[userId] = userDataJSON;
    if (!data[userId].levelCollection[difficulty]) data[userId].levelCollection[difficulty] = [];
    if (!data[userId].levelCollection[difficulty].includes(levelName)) { 
        data[userId].levelCollection[difficulty].push(levelName);
        console.log(`${levelName} was added to ${user.username} with difficulty ${difficulty}.`); 
    }
    fs.writeFileSync(globalPath, JSON.stringify(data, null, 2));
}
// [HELPER] Add Badge
const validBadges = ["luckyGambler"];
const badgeEmojis = {
    luckyGambler: "<:gambler:1327043800429756477>"
};
async function addBadgeToUser(userID, badge) {
    if (!validBadges.includes(badge)) return;
    const badgeEmoji = badgeEmojis[badge];
    if (!badgeEmoji) return;
    if (!userBadgesPath[userID]) userBadgesPath[userID] = [];
    if (!userBadgesPath[userID].includes(badgeEmoji)) {
        userBadgesPath[userID].push(badgeEmoji);
        fs.writeFileSync(`${ROOT}/data/badges.json`, JSON.stringify(userBadgesPath, null, 4), 'utf8');
    }
}
// [HELPER] Remove/Add Creator points.
function addCreatorPoints(userID, amount) {
    if (!data[userID]) {data[userID] = userDataJSON}
    data[userID].creatorPoints += amount;
    fs.writeFileSync(globalPath, JSON.stringify(data, null, 2));
}
function removeCreatorPoints(userID, amount) {
    if (!data[userID]) {data[userID] = userDataJSON}
    if (data[userID].creatorPoints >= amount) {
        data[userID].creatorPoints -= amount;
        fs.writeFileSync(globalPath, JSON.stringify(data, null, 2));
        return true;
    }
    return false; 
}
function getCreatorPoints(userID) {if (!data[userID]) {data[userID] = userDataJSON}return data[userID].creatorPoints;}
// [HELPER] Calculate creator points
function calcCreatorPoints(difficulty, inCollection = false) {
    let lowerRange = 5, higherRange = 1;
    difficulty = difficulty.toLowerCase();
    if (difficulty === 'easy') higherRange = 9;
    else if (difficulty === 'medium') higherRange = 18;
    else if (difficulty === 'hard') higherRange = 54;
    else if (difficulty === 'legendary') higherRange = 50;
    let calculatedPoints = Math.floor(Math.random() * (higherRange - lowerRange + 1)) + lowerRange;
    if (!inCollection) calculatedPoints *= 2;
    return calculatedPoints;
}
// [HELPER] Calculate user completion
function getUserCompletion(userId) {
    const profileData = data[userId];
    if (!profileData || !profileData.levelCollection) return '0.00';
    const easyLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/easy_levels.json`, 'utf8'));
    const mediumLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/medium_levels.json`, 'utf8'));
    const hardLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/hard_levels.json`, 'utf8'));
    const legendaryLevels = JSON.parse(fs.readFileSync(`${ROOT}/data/leg_levels.json`, 'utf8'));
    const easyCompleted = profileData.levelCollection.Easy.length;
    const mediumCompleted = profileData.levelCollection.Medium.length;
    const hardCompleted = profileData.levelCollection.Hard.length;
    const legendaryCompleted = profileData.levelCollection.Legendary.length;
    const totalEasy = easyLevels.length;
    const totalMedium = mediumLevels.length;
    const totalHard = hardLevels.length;
    const totalLegendary = legendaryLevels.length;
    const totalCompleted = easyCompleted + mediumCompleted + hardCompleted + legendaryCompleted;
    const totalLevels = totalEasy + totalMedium + totalHard + totalLegendary;
    return totalLevels ? ((totalCompleted / totalLevels) * 100).toFixed(2) : '0.00';
}
// [HELPER] Calculate user completion again
const calculateCompletion=(profileData, totalLevels)=>{const{Easy,Medium,Hard,Legendary}=profileData.levelCollection;
    const completed=Easy.length+Medium.length+Hard.length+Legendary.length;
    const percentage=totalLevels?((completed/totalLevels)*100).toFixed(2):'0.00';return{ completed, percentage };
};
// [HELPER] Parse mentions
const parseMention = (mention, guild) => {if (mention?.startsWith('<@') && mention.endsWith('>')) { const userId = mention.replace(/[<@!>]/g, '');
    return guild.members.fetch(userId).then(member => member.user).catch(() => null);
    } else if (/^\d+$/.test(mention)) { return guild.members.fetch(mention).then(member => member.user).catch(() => null);
    } else if (mention) { const lowerInput = mention.toLowerCase(); return guild.members.cache.find(
    member => member.user.username.toLowerCase() === lowerInput || member.user.tag.toLowerCase() === lowerInput )?.user || null;} return null;
};
// [HELPER] Fetch leaderboard spot
async function getLeaderboardSpot(userId, context) {
    try {
        const userStats = await Promise.all(Object.entries(data).map(async ([id, userData]) => {
            const completion = getUserCompletion(id);
            let member;
            try { member = await context.guild.members.fetch(id); } catch { member = null; }
            const user = member ? member.user : await client.users.fetch(id);
            const username = user ? user.username : 'Private User';
            return { id, username, completion };
        }));
        userStats.sort((a, b) => b.completion - a.completion);
        const spot = userStats.findIndex(entry => entry.id === userId) + 1;
        return { spot, leaderboard: userStats.slice(0, 10) };
    } catch (error) { console.error('Error in leaderboard:', error); return { spot: 'N/A', leaderboard: [] }; }
}
// [HELPER] Fetch Team Data
function getTeamInfoForUser(userID) {
    const team = Object.values(teamsPath).find(team => team.members.includes(userID) || team.owner === userID);
    if (!team) return null;
    return { name: team.name, tag: team.tag, owner: team.owner, members: team.members };
}
function getTeamTagForUser(userID) {
    const team = Object.values(teamsPath).find(team => team.members.includes(userID) || team.owner === userID);
    return team ? `[${team.tag}]` : null;
}
// [HELPER] Fetch leaderboard spot for Creator Points
async function getCPBoardSpot(userId, context) {
    try {
        const userStats = await Promise.all(Object.entries(data).map(async ([id, userData]) => {
            const creatorPoints = userData.creatorPoints || 0;
            let member;
            try { member = await context.guild.members.fetch(id); } catch { member = null; }
            const user = member ? member.user : await client.users.fetch(id);
            const username = user ? user.username : 'Private User';
            return { id, username, creatorPoints };
        }));
        userStats.sort((a, b) => b.creatorPoints - a.creatorPoints);
        const spot = userStats.findIndex(entry => entry.id === userId) + 1;
        return { spot, leaderboard: userStats.slice(0, 10) };
    } catch (error) { console.error('Error in leaderboard:', error); return { spot: 'N/A', leaderboard: [] }; }
}
// [HELPER] Get Level by Difficulty
function getLevelByDifficulty(difficultyArg, isRetry = false, lastDifficulty = null) {
if (isRetry && lastDifficulty) {const levelsForLastDifficulty = levels.filter(level => level.diff.toLowerCase() === lastDifficulty.toLowerCase());
    if (levelsForLastDifficulty.length === 0) throw new Error(`No levels available for difficulty '${lastDifficulty}'`);
        return levelsForLastDifficulty[Math.floor(Math.random() * levelsForLastDifficulty.length)];
    } else if (difficultyArg) {const levelsForDifficulty = levels.filter(level => level.diff.toLowerCase() === difficultyArg.toLowerCase());
        if (levelsForDifficulty.length === 0) throw new Error(`Invalid difficulty name; '${difficultyArg}'`);
        return levelsForDifficulty[Math.floor(Math.random() * levelsForDifficulty.length)];
    } else { return lastUsedDifficulty ?levels.find(level=>level.diff===lastUsedDifficulty)
        :levels.filter(level=>level!==lastLevel)[Math.floor(Math.random()*(levels.length-1))]; }
}
// [HELPER] Curse/Bless you!
const activeCurses = new Map();
const activeBlesses = new Map();
function applyMessageCurse(userID, messages) {activeCurses.set(userID, { remaining: messages });}
client.on('messageCreate', async message => {
    const curse = activeCurses.get(message.author.id);
    if (curse) { if (Math.random() < 0.2) { const totalPoints = getCreatorPoints(message.author.id), lossAmount = Math.floor(totalPoints / 2);
        removeCreatorPoints(message.author.id, lossAmount);
            const curseEmbed = { description: `You have lost **${lossAmount}** Creator Points ${rc}.`, color: parseInt('FFFFFF', 16), }
            message.reply({ embeds: [curseEmbed], allowedMentions: { repliedUser: pingOnReply }});
            console.log(`${message.author.username} just lost ${lossAmount} due to the curse.`)
        } curse.remaining -= 1; if (curse.remaining <= 0) { activeCurses.delete(message.author.id);
        message.reply({content:'Your curse ran out, congratulations!', allowedMentions:{repliedUser:pingOnReply}});
            console.log(`${message.author.username}'s curse just ran out.`) 
        }; 
    }
});
function applyBlessing(userID, messages) {activeBlesses.set(userID, { remaining: messages });}
client.on('messageCreate', async message => {
    const blessing = activeBlesses.get(message.author.id);
    if (blessing) {
        if (Math.random() < 0.2) {
            const totalPoints = getCreatorPoints(message.author.id), winAmount = Math.floor(totalPoints / 2);
            addCreatorPoints(message.author.id, winAmount);
            const blessingEmbed = { description: `You have earned **${winAmount}** Creator Points ${rc}.`, color: parseInt('3FEEBA', 16), }
            message.reply({ embeds: [blessingEmbed], allowedMentions: { repliedUser: pingOnReply }});
            console.log(`${message.author.username} just earned ${winAmount} due to the blessing.`)
        }
        blessing.remaining -= 1;
        if (blessing.remaining <= 0) { activeBlesses.delete(message.author.id);
            message.reply({content: 'Your blessing ran out, very sad :c', allowedMentions:{repliedUser:pingOnReply}});
            console.log(`${message.author.username}'s blessing just ran out.`)
        };
    }
});
// [HELPER] gamlbing helpesrs
function createOutcome(type, color, thumbnail, execute) {return { type, color, thumbnail, execute };}
function calculateBet(betInput, userPoints) {
    if (betInput === "half") return Math.floor(userPoints / 2); if (betInput === "all") return userPoints;
    if (betInput.endsWith("%")) {const percent = parseInt(betInput.slice(0, -1), 10);
        if (isNaN(percent) || percent <= 0 || percent > 100) return null; return Math.floor((percent / 100) * userPoints);
    }
    const bet = parseInt(betInput, 10); return isNaN(bet) || bet <= 0 ? null : bet;
}
async function executeOutcome(outcome, userID, bet, username) {
    const result = await outcome.execute(userID, bet, username);
    const embedColor = parseInt(outcome.color, 16);
    const embed = { description: result.description, color: embedColor, allowedMentions: { repliedUser: pingOnReply }, };
    if (outcome.thumbnail) {embed.thumbnail = { url: `attachment://${outcome.thumbnail.split("/").pop()}` };}
    return { embed, files: outcome.thumbnail ? [outcome.thumbnail] : [] };
}
function generateRandomOutcome() {return outcomes[Math.floor(Math.random() * outcomes.length)];}
// [CMD] Clear current level [if any]
async function clearLevel(context) {
    const au = context.author; if (au.id !== ownerID) return;
    if (!channelLevels.has(context.channel.id)) return; channelLevels.delete(context.channel.id);
    return context.reply({content:`Cleared the current level.\n-# If the bot stops working, please ping ${ownerName}.`,
        allowedMentions:{repliedUser:pingOnReply}});
}
// [CMD] Skip current level
async function skipCurrentLevel(context) {
    try {
        if (context.author.id !== ownerID) return; 
        if (!channelLevels.has(context.channel.id)) return; 
        const currentLevel = channelLevels.get(context.channel.id), userId = context.author.id, user = data[userId] || { ...userDataJSON };
        const { streak, highestStreak, levelCollection } = user;
        const thumbnailPath = `F:/Bots/SparkUp/assets/streak/${streak}.png`;
        const difficulty = difficulties.find(d => d.name === currentLevel.diff);
        const points = calcCreatorPoints(currentLevel.diff, levelCollection[difficulty.name]?.includes(currentLevel.name));
        addCreatorPoints(userId, points);
        user.streak++; 
        user.highestStreak = Math.max(user.highestStreak, user.streak);
        levelCollection[difficulty.name] ||= [];
        if (!levelCollection[difficulty.name].includes(currentLevel.name)) { levelCollection[difficulty.name].push(currentLevel.name);
            console.log(`${context.author.username} skipped ${currentLevel.name}! Added to collection.`); 
        }
        const embedDescription = [
            `You have been awarded ${points} creator point${points !== 1 ? 's' : ''}, <@${userId}>.`,
            streak > highestStreak ? `You got a new highest streak at **${streak}**!` : streak>1?`Your current streak is at **${streak}**, keep going!` : '',
            !levelCollection[difficulty.name]?.includes(currentLevel.name) ? 'This Level has been added to your Collection.' : ''
        ].filter(Boolean).join('\n');
        const cGE = new EmbedBuilder().setTitle(correctGuessStr).setDescription(embedDescription).setColor(difficulty.hex);
        if (fs.existsSync(thumbnailPath)) { cGE.setThumbnail(`attachment://${streak}.png`); }
        fs.writeFileSync(globalPath, JSON.stringify(data, null, 2));
        addLevelToUser(userId, currentLevel.name, currentLevel.diff);
        await context.reply({ embeds: [cGE], components: [rR], allowedMentions: { repliedUser: pingOnReply } });
        console.log(`${context.author.username} skipped ${currentLevel.name}.`);
        channelLevels.delete(context.channel.id); 
        if (channelTimeoutCollectors.has(context.channel.id)) {
            channelTimeoutCollectors.get(context.channel.id).stop(); channelTimeoutCollectors.delete(context.channel.id);
        }
    } catch (error) { console.error(error); await context.reply(errorHeader+e+errorFooter);}
}
// [CMD] clean levels
function cleanUserLevels(context) {
    if (context.author.id !== ownerID) return;
    console.log(`${context.author.username} tried clearing levels, lets see how it goes:`);
    const levelNames = { Easy: easyLevels.map(level => level.name), Medium: mediumLevels.map(level => level.name), Hard: hardLevels.map(level => level.name), Legendary: legendaryLevels.map(level => level.name) };
    let cleanAmount = 0, userNumber = 0;
    Object.keys(data).forEach(userId => { const user = data[userId]; let cleaned = false; Object.keys(user.levelCollection).forEach(diff => { const originalLength = user.levelCollection[diff].length; const lTR = user.levelCollection[diff].filter(level => !levelNames[diff].includes(level)); 
    lTR.forEach(level => { 
        const remain = user.levelCollection[diff].length - 1; 
        console.log(`${level} has been cleared, ${remain} remain.`); }); 
        user.levelCollection[diff] = user.levelCollection[diff].filter(level => levelNames[diff].includes(level)); 
        if (user.levelCollection[diff].length !== originalLength) { cleaned = true; 
        cleanAmount += originalLength - user.levelCollection[diff].length; } }); if (cleaned) userNumber++; });
    fs.writeFileSync(`${ROOT}/data/data-global.json`, JSON.stringify(data, null, 2));
    context.reply({embeds: [{color: parseInt(w, 16), description: `**${cleanAmount}** levels have been cleaned from **${userNumber}** users!`}]});
}
// [CMD] Attach Banner
async function attachBanner(context) {
    const args = context.isCommand ? context.options.getString("args").split(" ") : context.content.split(" ");
    const bannerID = args[1]
    const invalidBannerStr = `Invalid banner ID '${bannerID}' ${errEmoji}.`;
    if (!bannerID) {return context.reply({content:invalidBannerStr,allowedMentions:{repliedUser:pingOnReply}});}
    const bannerFilePath = `${ROOT}/banners/${bannerID}.jpg`;
    if (!fs.existsSync(bannerFilePath)){return context.reply({content:invalidBannerStr,allowedMentions:{repliedUser:pingOnReply}});}
    console.log(`${context.author.username} just showed banner id ${bannerID}.`)
    return context.reply({files:[{attachment:bannerFilePath,name:`${bannerID}.jpg`}], allowedMentions:{repliedUser:pingOnReply}});
}
// [CMD] Restart Bot
async function restartBot(context) {
    const au = context.author; if (au.id !== ownerID) return;
    const reason = context.content.split(" ").slice(1).join(" ") || "No reason provided.";
    const timestamp = new Date().toLocaleString('en-US',{hour12:true,hour:'2-digit',minute:'2-digit',second:'2-digit',millisecond:'numeric'});
    const logMessage = `${sparkName} has been restarted by ${au.username} for ${reason} at ${timestamp}\n`;
    fs.appendFileSync(`${ROOT}/logs/restartLog.txt`, logMessage);
    console.log(logMessage)
    await context.reply({content:`${restartMessage} \`${au.username}\`: **\n${reason}`, allowedMentions:{repliedUser: pingOnReply}});
}
// [CMD] Crash bot
async function crashBot(context) {
    if (context.author.id !== ownerID) return;
    const err="Crash triggered intentionally to test bot recovery."; 
    await context.reply({content:`## ${sparkName} has crashed!\n\`\`\`js\n${err}\n\`\`\``,allowedMentions: { repliedUser: pingOnReply }});
    try { throw new Error(err); } catch (err) { console.error(err); process.exit(1); }
}
// [CMD] Set user banner
async function changeBanner(context) {
    const args = context.isCommand ? context.options.getString("args").split(" ") : context.content.split(" ");
    const bannerID = args[1], userData = data[context.author.id] || userDataJSON;
    const invalidBannerStr = `Invalid banner ID '${bannerID}' ${errEmoji}.`;
    if (!bannerID) {return context.reply({content:invalidBannerStr,allowedMentions:{repliedUser:pingOnReply}});}
    const bannerFilePath = `${ROOT}/banners/${bannerID}.jpg`;
    if (!fs.existsSync(bannerFilePath)){return context.reply({content:invalidBannerStr,allowedMentions:{repliedUser:pingOnReply}});}
    userData.bannerID = bannerID;
    saveUserData();
    console.log(`${context.author.username} changed their banner to ${bannerID}.`)
    return context.reply(`Successfully updated your banner to banner ID \`${bannerID}\`!`);
}
// [CMD] Disallow certain channels.
async function allowedSparkUpChannels(context) {
    try {
        if (!context.member.permissions.has(PermissionFlagsBits.Administrator) && context.author.id !== ownerID) return;
        const content = context.content.slice(PREFIX.length + 'allowedsparkupchannels'.length).trim();
        let allowedChannelsData = fs.existsSync(allowedGuildChannelPath) ? JSON.parse(fs.readFileSync(allowedGuildChannelPath, 'utf-8')) : {};
        if (content.toLowerCase() === "all") {
            allowedChannelsData[context.guild.id] = context.guild.channels.cache.filter(channel => channel.isText()).map(channel => channel.id);
            fs.writeFileSync(allowedGuildChannelPath, JSON.stringify(allowedChannelsData, null, 2), 'utf-8');
            return context.reply("Successfully updated allowed channels to include **all text channels** in this guild.");
        }
        const channelIDs = content.split(',').map(mention => {
            const channel = context.guild.channels.cache.get(mention.replace(/[<#>]/g, '').trim()) 
            || context.guild.channels.cache.find(c => c.name === mention.trim()); return channel ? channel.id : null; }
        ).filter(id => id !== null);
        if (channelIDs.length === 0) return context.reply('No valid channels provided.');
        allowedChannelsData[context.guild.id] = channelIDs;
        fs.writeFileSync(allowedGuildChannelPath, JSON.stringify(allowedChannelsData, null, 2), 'utf-8');
        context.reply(`Successfully updated allowed channels for this guild: ${channelIDs.map(id => `<#${id}>`).join(', ')}`);
        console.log(`${context.author.username} updated allowed channels for ${context.guild.name} (${context.guild.id})`);
    } catch (error) { console.error(error); await context.reply(errorHeader+e+errorFooter);}
}
// [CMD] Show Creator Points Leaderboard
async function showCPLeaderboard(context) {
    try {
        console.log(`${PREFIX}topcp was used.`);
        const isInteraction = !!context.isCommand;
        const user = isInteraction ? context.user : context.author;
        const { spot, leaderboard } = await getCPBoardSpot(user.id, context);
        const thumb = 'assets/emoji/cp.png';
        const em = new EmbedBuilder().setTitle('Top Creator Points Leaderboard').setColor('#FFD700')
            .setDescription(leaderboard .map((entry, index) => {
                const teamTag = getTeamTagForUser(entry.id) || '', formattedBadges = userBadgesPath[entry.id]?.join(' ') || '';
                return `${index === 0 ? '**' : ''}#${index + 1} | ${formattedBadges} ${teamTag} \`${entry.username}\` | ${entry.creatorPoints} <:CreatorPoints:1326573508754542624> ${index === 0 ? '**' : ''}`;
            }).join('\n') + (spot > 10 ? `\nYour Spot: #${spot}` : '')
        );
        const options={embeds:[em],allowedMentions:{repliedUser:pingOnReply},files:fs.existsSync(thumb)?[{attachment: thumb,name:'cp.png'}]:[]};
        if (fs.existsSync(thumb)) {em.setThumbnail('attachment://cp.png');}
        if (isInteraction) {await context.reply(options); } else {await context.reply(options); }
    } catch(e){console.error(error);context.reply(errorHeader+e+errorFooter); }
}
// [CMD] Bean???? no we got zean
async function zeanUser(context) {
    if (!developers.includes(context.author.id)) return;
    const args = context.isCommand ? context.options.getString("args").split(" ") : context.content.split(" ");
    const targetArg = args[1];
    if (!targetArg) {return context.reply("<:no:1327423267530739775> You are missing a required command argument: \`user\`");}
    const reason = args.slice(2).join(" ") || "No reason given.";
    const targetID = targetArg.replace(/[<@!>]/g, '');
    const targetUser = context.guild?.members.cache.get(targetID) || 
                       context.guild?.members.cache.find(member => member.user.username.toLowerCase() === targetArg.toLowerCase());
    await context.reply({
        content: `${zeanEmoji} ${targetUser.user.username} (\`${targetUser.user.id}\`) was zapped. Reason: \`${reason}\``,
        allowedMentions: { repliedUser:pingOnReply }
    });
    console.log(`${targetUser.user.username} was zapped for ${reason} by ${context.author.username}.`)
    const filter = (message) => message.author.id === targetUser.user.id;
    const collector = context.channel.createMessageCollector({ filter, time: 30000 });
    collector.on('collect', async (message) => {
        try {
            await message.react(zeanEmoji);
            collector.stop();
        } catch (error) {console.error('Failed to react:', error);}
    });
    collector.on('end', (collected, reason) => {if (reason === 'time') {console.log(`Target user did not send a message in time.`);}});
}
// [CMD] Create Poll
async function createPoll(context) {
    if (!developers.includes(context.author.id)) return;
    try {
        const content = context.content.startsWith(`${PREFIX}poll`) ? context.content.slice(6).trim() : context.content.trim();
        const args = content.split('\'').filter(arg => arg.trim() !== "");
        const q = args[0].trim(), options = args.slice(1).map(opt => opt.trim());
        const em = new EmbedBuilder().setTitle(q).setDescription(options.map((option,index)=>`${index+1}\u20E3  ${option}`).join('\n'))
        .setColor(w);
        const message = await context.reply({ embeds: [em], allowedMentions: { repliedUser:pingOnReply } });
        for (let i = 1; i <= options.length; i++) {await message.react(`${i}\u20E3`);}
        context.delete; console.log(`${context.author} made a poll titled '${q}' in #${context.channel.name}, at ${context.guild.name}.`);
    } catch (error) {}
}
// [CMD] Sharing is caring!
async function giftCreatorPoints(context) {
    const args = context.isCommand ? context.options.getString("args").split(" ") : context.content.split(" ");
    const gifter = context.author;
    if (!args[1]) {return context.reply({content: 'pls use da comman properly :3',allowedMentions: { repliedUser: pingOnReply },});}
    const recieverID = args[1].replace(/[<@!>]/g, '');
    const giftAmount = parseInt(args[2], 10);
    if(isNaN(giftAmount)||giftAmount<=0){return context.reply(
        {content:'Please provide a valid amount of Creator Points to gift.',allowedMentions:{repliedUser:pingOnReply}});}
    const receiverUser = await context.client.users.fetch(recieverID).catch(() => null);
    if (!receiverUser) return;
    if (developers.includes(gifter.id)) { addCreatorPoints(recieverID, giftAmount);
        console.log(`A DEVELOPER gifted ${receiverUser.username} ${giftAmount} creator points! - ${gifter.username}`);
    }else{ addCreatorPoints(recieverID, giftAmount); removeCreatorPoints(gifter.id, giftAmount);
        console.log(`${gifter.username} gifted ${receiverUser.username} ${giftAmount} creator points!`);
    }
    const giftEmbed = { description: `<@${recieverID}> has been gifted **${giftAmount}** Creator Points!`, color: 0xffffff};
    return context.reply({ embeds: [giftEmbed], allowedMentions: { repliedUser:pingOnReply }});
}
// [CMD] Gambling 🎰🎲🤑💲
const cooldowns = new Map();
async function gamble(context) {
    try {
        const userID = context.author.id;
        const now = Date.now();
        if (cooldowns.has(userID)) {return context.reply({content:gambleCooldownStr,allowedMentions: {repliedUser: pingOnReply},});}
        const args = context.content.split(" ").slice(1);
        const betInput = args[0]?.toLowerCase();
        const user = context.author;
        const uP = getCreatorPoints(user.id);
        const bet = calculateBet(betInput, uP);
        if(bet===null||bet>uP){return context.reply({content:"Please specify a valid amount to gamble!",allowedMentions:{repliedUser:pingOnReply},});}
        if(!removeCreatorPoints(user.id,bet)){return context.reply({content:notEnoughPoints,allowedMentions:{repliedUser:pingOnReply},});}
        const outcome = generateRandomOutcome();
        // const outcome = outcomes.find(o=>o.type==="message_blessing");
        const { embed, files } = await executeOutcome(outcome, userID, bet, user.username);
        console.log(`${user.username} gambled ${bet} Creator Points.`);
        cooldowns.set(userID, now);
        setTimeout(() => cooldowns.delete(userID), gamblingMS);
        return context.reply({embeds: [embed],files,allowedMentions: { repliedUser: pingOnReply },});
    } catch (error) {console.error(error);}
}
// [CMD] Forced Gambling 🎰🎲🤑💲
async function forceGamble(context) {
    try {
        if (context.author.id !== ownerID) return;
        const args = context.content.split(" ").slice(1);
        const targetMention = args.find((arg) => /<@!?(\d+)>/.test(arg) || /^\d+$/.test(arg));
        const betInput = args.find((arg) => arg.toLowerCase() === "all" || arg.toLowerCase() === "half" || /\d+%/.test(arg) || /^\d+$/.test(arg));
        if (!targetMention || !betInput) {
                return context.reply({content: "Please specify a user and a valid amount to gamble!", allowedMentions: { repliedUser: pingOnReply },
            });
        }
        const targetUserID = targetMention.replace(/[<@!>]/g, "");
        const user = await context.guild.members.fetch(targetUserID).then((member) => member.user).catch(() => null);
        if (!user)
            return context.reply({ content: "Invalid user specified.", allowedMentions: { repliedUser: pingOnReply }, });
        const userPoints = getCreatorPoints(targetUserID);
        const bet = calculateBet(betInput, userPoints);
        if (bet === null || bet > userPoints) {
            return context.reply({ content: "Please specify a valid amount to gamble!", allowedMentions: { repliedUser: pingOnReply }, });
        }
        if (!removeCreatorPoints(user.id, bet)) {
            return context.reply({content: "They don't have enough Creator Points to gamble!",allowedMentions: { repliedUser: pingOnReply }, });
        }
        const outcome = generateRandomOutcome();
        const { embed, files } = await executeOutcome(outcome, targetUserID, bet, user.username);
        console.log(`${context.author.username} forced ${user.username} to gamble ${bet} Creator Points.`);
        return context.reply({embeds: [embed],files,allowedMentions: { repliedUser: pingOnReply },});
    } catch (error) {console.error(error);}
}
// [CMD] View Team Data
async function showTeam(context) {
    try {
        const args = context.isCommand ? context.options.getString("args").split(" ") : context.content.split(" ");
        const tagArg = args[1];
        const user = context.isCommand ? context.user : context.author;
        let teamData;
        if (tagArg) {
            teamData = Object.values(teamsPath).find(team => team.tag === tagArg);
            if (!teamData) return context.reply({ content: `No team found with the tag: \`${tagArg}\`` });
        } else {
            teamData = getTeamInfoForUser(user.id);
            if (!teamData) return context.reply({ content: "You are not in a team!" });
        }
        const { name, tag, owner, members } = teamData;
        const ownerUser = await context.client.users.fetch(owner);
        const ownerBadges = userBadgesPath[owner] || [];
        const formattedOwnerBadges = ownerBadges.length > 0 ? ownerBadges.join(" ") : "";
        const ownerEntry = `**<:owner:1327143161046372362> | ${formattedOwnerBadges} \`${ownerUser.username}\`**`;
        const formattedMembers = await Promise.all(
            members.map(async (memberID) => {
                const userBadges = userBadgesPath[memberID] || [];
                const formattedBadges = userBadges.length > 0 ? userBadges.join(" ") : "";
                const username = (await context.client.users.fetch(memberID)).username;
                return `${formattedBadges} \`${username}\``;
            })
        );
        console.log(`${context.author.username} viewed team data for [${tag}].`);
        const teamEmbed = new EmbedBuilder()
            .setTitle(`Team information for ${name}`)
            .setDescription(`-# **TAG:**
            [${tag}]
-# **MEMBERS:**
            ${ownerEntry}
            ${formattedMembers.join("\n")}
            Total Member Count: ${teamData.members.length + 1}
            `)
            .setColor(w);
        await context.reply({ embeds: [teamEmbed] });
    } catch(e){console.error(error);context.reply(errorHeader+e+errorFooter); }
}
// [CMD] Echo
async function echoMsg(context) {
    try {
        const messageContent = context.content.slice(PREFIX.length).trim().split(/ +/).slice(1).join(' ');
        if (!messageContent) { messageContent = 'No message provided.'; }
        console.log(`Someone used '${PREFIX}echo ${messageContent}' in #${context.channel.name}.`);
        await context.delete();
        await context.channel.send(messageContent);
    } catch (error) { console.error(error); }
}
// [CMD] Hall of Fame Message
async function showHOF(context) {
    try {
        console.log(`${PREFIX}halloffame was used.`);
        const luckyGamblers = Object.entries(userBadgesPath).filter(([userID, badges]) => badges.includes(gamblerBadge)).map(([userID]) => userID);
        const gamblerNames = await Promise.all(luckyGamblers.map(async (userID) => {
                const user = await context.client.users.fetch(userID).catch(() => null); return user ? `\`${user.username}\`` : null;
            })
        );
        const filteredGamblers = gamblerNames.filter(Boolean);
        const hofEmbed = new EmbedBuilder()
            .setTitle(`Hall of Fame 👑`)
            .setDescription(`
## Playtesters who made this bot so awesome:
                <:doctoon:1327444776064254003> \`doctoon\` - <:owner:1327143161046372362> Bot Maker
                <:kazrii:1327444805063544883> \`kazrii_\` - One of the first playtesters, suggested ${PREFIX}hof, and made most of the screenshots.
                <:meth:1327444825674481835> \`methathesis\` - Created the more shitpost-y evil screenshots >:3 also one of the first 3 playtesters.
                <:jp:1327444783572189314> \`just.jp\`, <:jusabe:1327444795353862248> \`jusabe\`, <:ldog:1327444814689599581> \`ldog8038\` - Just generally playtesting
                <:rably:1327445147440648202> \`rably.7cat\` - Making the PFP and other ${sparkName} assets.

                And finally...
                You, for using this bot.
                Thank you, even if this bot keeps shutting down now and then or turning off while im sleeping, you were still here, and thats what's important, you stay no matter the imperfections...
### Congratulations to all the **lucky gamblers** <:gambler:1327043800429756477> who got to have their name here.
                ${filteredGamblers.join(', ')}
            `)
            .setColor('#ffdd00');
        await context.reply({ embeds: [hofEmbed], allowedMentions:{repliedUser:pingOnReply} });
    } catch (error) { console.error(error); }
}
// [CMD] Help Message
async function showHelp(context) {
    try {
        console.log(`${PREFIX}help was used.`);
        const helpEmbed = new EmbedBuilder()
            .setTitle(`Help`)
            .setDescription(`### All Commands
-# **COMMANDS FOR USE BY @EVERYONE**
**${PREFIX}guess** (Aliases: g) - Send a Geometry Dash Level to guess.
**${PREFIX}profile** (Aliases: p) - View your profile.
**${PREFIX}top** (Aliases: t) - View the completion leaderboard.
**${PREFIX}topcp** (Aliases: tcp) - View the leaderboard for Creator Points.
**${PREFIX}help** (Aliases: h) - Show this help message.
**${PREFIX}team** - View team data for your team.
**${PREFIX}gamble** - Gamble your Creator Points and try your luck.
**${PREFIX}gift** - Gift Creator Points to another user.
**${PREFIX}halloffame** (Aliases: hof, fame, hall) - View the Hall of Fame.
**${PREFIX}banner** (Aliases: cb, changebanner, b) - Change your banner [use id].
-# **COMMANDS FOR USE BY DEVS/TRUSTED USERS**
**${PREFIX}forcegamble** - Gamble another user's Creator Points.
**${PREFIX}poll** - Create a poll for users to vote on.
**${PREFIX}echo** (Aliases: e) - Echo back a message.
**${PREFIX}allowedsparkupchannels** (Aliases: asc, vsc) - Usage: ${PREFIX}asc #channel1, #channel2, #channel3.
**${PREFIX}zap** (Aliases: z, zean, bean) - gearbot now has competition :smiling_imp:.
**${PREFIX}crash** (Aliases: stop) - Stop the bot forcibly.
**${PREFIX}cleanuserlevels** (Aliases: cl) - Clear invalid levels when they get removed.
**${PREFIX}skip** - Skip the current level.
**${PREFIX}restart** (Aliases: r) - Restart the bot.
**${PREFIX}clear** (Aliases: del, deletecurrentlevel, clearcurrentlevel) - Clear the current level in the channel.
                `)
            .setColor(w);
        await context.reply({ embeds: [helpEmbed], allowedMentions: { repliedUser:pingOnReply } });
    } catch (error) { console.error(error); }
}
// [CMD] Show Leaderboard
async function showLeaderboard(context) {
    try {
        console.log(`${PREFIX}top was used.`);
        const isInteraction = !!context.isCommand;
        const user = isInteraction ? context.user : context.author;
        const { spot, leaderboard } = await getLeaderboardSpot(user.id, context);
        const lbThumb = 'F:\\Bots\\SparkUp\\assets\\emoji\\leaderboardspot.png';
        const leaderEmboard = new EmbedBuilder().setTitle('Top Global Completion').setColor(w)
            .setDescription(leaderboard .map((entry,index)=>{const userBadges = userBadgesPath[entry.id] || [];
                        const formattedBadges = userBadges.length > 0 ? userBadges.join(' ') : '', teamTag = getTeamTagForUser(entry.id) || '';
                        return `${index === 0 ? '**' : ''}#${index + 1} | ${formattedBadges} ${teamTag} \`${entry.username}\` | ${entry.completion}%${index === 0 ? '**' : ''}`;
                    })
                    .join('\n') +
                (spot > 10 ? `\nYour Spot: #${spot}` : '')
            )
        const options = {embeds:[leaderEmboard],allowedMentions:{repliedUser:pingOnReply},files:[{attachment:lbThumb,name:'leaderboardspot.png'}]};
        if (fs.existsSync(lbThumb)) {leaderEmboard.setThumbnail('attachment://leaderboardspot.png');}
        if (isInteraction) { await context.reply(options);
        } else { await context.reply(options); }
    } catch(e){console.error(e);context.reply(errorHeader+e+errorFooter); }
}
// [CMD] Profile Viewer
registerFont(`${ROOT}/font/Outlier.ttf`, { family: 'Outlier' });
async function showProfile(context) {
    try {
        const isInteraction = !!context.isCommand;
        const mention = isInteraction ? context.options?.getString('user') : context.content.slice(PREFIX.length).trim().split(/ +/)[1];
        const user = mention ? await parseMention(mention, context.guild) : context.author;
        if (user === context.author || !mention) console.log(`${context.author.username} tried seeing their own profile.`);
        else console.log(`${context.author.username} tried viewing ${mention}'s profile.`);
        if (!user || !user.id) throw new Error('User is invalid.');
        const userData = data[user.id] || userDataJSON;
        const totalLevels = easyLevels.length + mediumLevels.length + hardLevels.length + legendaryLevels.length;
        const { completed, percentage } = calculateCompletion(userData, totalLevels);
        const { spot } = await getLeaderboardSpot(user.id, context);
        const teamTag = getTeamTagForUser(user.id) || '';
        const canvas = createCanvas(620, 270), ctx = canvas.getContext('2d');
        const bannerID = userData.bannerID || '1', userBannerPath = `${ROOT}/banners/${bannerID}.jpg`;
        try { const backgroundImage = await loadImage(userBannerPath); ctx.drawImage(backgroundImage, 0, 0, 620, 270); }
        catch (err) { console.error(err); ctx.fillStyle = 'rgb(23, 40, 102)'; ctx.fillRect(0, 0, 620, 270); }
        const profileText = [
            { text: `${teamTag} ${user.username}`, fontSize: 23, x: 30, y: 40 },
            { text: `Creator Points: ${userData.creatorPoints || '0'}`, x: 220, y: 110 },
            { text: `Leaderboard Spot: #${spot || '0'}`, fontSize: 24, x: 220, y: 140 },
            { text: `Completion: ${percentage}%`, fontSize: 24, x: 220, y: 170 }
        ];
        ctx.shadowColor = 'black'; ctx.shadowBlur = 4; ctx.fillStyle = 'white';
        profileText.forEach(line=>{ctx.font = `${line.fontSize || 24}px Outlier`; ctx.fillText(line.text, line.x, line.y);});
        const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        try { const avatarImage = await loadImage(avatarURL);
            const avatarX=50,avatarY=60,avatarWidth=135,avatarHeight=135,radius=Math.min(avatarWidth,avatarHeight)/2;
            [[radius+10,'white',2],[radius+5,'black',1]].forEach(([r,color,width])=>{ctx.lineWidth=width;ctx.beginPath();ctx.arc(avatarX+avatarWidth/2,avatarY+avatarHeight/2,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();});ctx.save();ctx.beginPath();ctx.arc(avatarX+avatarWidth/2,avatarY+avatarHeight/2,radius,0,Math.PI*2);ctx.clip();
            ctx.drawImage(avatarImage,avatarX,avatarY,avatarWidth,avatarHeight);ctx.restore();
        }
        catch (err) { console.error(err); }
        const buffer = canvas.toBuffer(), attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });
        await context.reply({ files: [attachment], allowedMentions: { repliedUser: pingOnReply } });
    } catch(e){console.error(e);context.reply(errorHeader+e+errorFooter); }
}
// [CMD] Stat Viewer
async function showStats(context) {
    try { const isInteraction = !!context.isCommand;
        const mention = isInteraction ? context.options?.getString('user') : context.content.slice(PREFIX.length).trim().split(/ +/)[1];
        const user = mention ? await parseMention(mention, context.guild) : context.author;
        if (user === context.author || !mention) {console.log(`${context.author.username} tried seeing their own stats.`);
        } else {console.log(`${context.author.username} tried viewing stats for ${user.username}.`)}
        if (!user || !user.id) throw new Error('User is invalid.'); data[user.id] = data[user.id] || userDataJSON;
        const profileData = data[user.id];
        const totalLevels = easyLevels.length + mediumLevels.length + hardLevels.length + legendaryLevels.length;
        const { completed, percentage } = calculateCompletion(profileData, totalLevels);
        const { spot } = await getLeaderboardSpot(user.id, context); 
        const userBadges = userBadgesPath[user.id] || [], teamTag = getTeamTagForUser(user.id) || '';
        let badgesSection = '';
        if (userBadges.length > 0) {const formattedBadges = userBadges.join(' '); badgesSection = `-# **BADGES**\n## ${formattedBadges}\n`; }
        const embed = new EmbedBuilder().setTitle(`${teamTag} ${user.username}'s Stats`).setDescription(`${badgesSection}-# **MAIN**
**<:Streak:1326573565503475823> Highest Streak:** ${profileData.highestStreak || 'None, gl :)'}x
**<:CreatorPoints:1326573508754542624> Creator Points:** ${profileData.creatorPoints || '0'}
**<:LeaderboardSpot:1326648366305775707> Leaderboard Spot:** #${spot || '0'}
-# **COMPLETION**
**<:Completion:1326573554480713759> Total Completion:** ${percentage}% (${completed}/${totalLevels} levels completed)
**<:Easy:1326573516124065927> Easy Levels:** ${profileData.levelCollection.Easy.length}/${easyLevels.length}
**<:Medium:1326573522020995184> Medium Levels:** ${profileData.levelCollection.Medium.length}/${mediumLevels.length}
**<:Hard:1326573533517713419> Hard Levels:** ${profileData.levelCollection.Hard.length}/${hardLevels.length}
**<:Legendary:1326573542992511078> Legendary Levels:** ${profileData.levelCollection.Legendary.length}/${legendaryLevels.length}
            `).setColor(w);
        await context.reply({ embeds: [embed], allowedMentions: { repliedUser: pingOnReply } });
    } catch(e){console.error(e);context.reply(errorHeader+e+errorFooter); }
}
// [CMD] Guessing
const channelLevels = new Map();
const channelTimeoutCollectors = new Map();
async function sendGuessLevel(context, isRetry = false, lastDifficulty = null) {
    try{
        if (cmdLockdown === true) { return context.reply({content: lockMsg(), flags: 64}); }
        if(channelLevels.has(context.channel.id)){
            if(!context.replied&&!context.deferred){await context.reply({content:alreadyRunningErr,allowedMentions:{repliedUser:pingOnReply}});}return;}
            const isInteraction = !!context.isCommand;
            let difficultyArg = isInteraction ? context.options?.getString('difficulty') : context.content.slice(PREFIX.length).trim().split(/ +/)[1];
            let randomLevel = getLevelByDifficulty(difficultyArg, isRetry, lastDifficulty);
            if (!randomLevel) throw new Error('Unable to select a level');
            if (!difficulties.some(d => d.name === randomLevel.diff)) throw new Error('Invalid Difficulty.');
            lastLevel = randomLevel; 
            channelLevels.set(context.channel.id, randomLevel); 
            if (channelTimeoutCollectors.has(context.channel.id)) { channelTimeoutCollectors.get(context.channel.id).stop(); }
            const difficulty = difficulties.find(d => d.name === randomLevel.diff);
            const imageBuffer = fs.readFileSync(`${ROOT}/levels/${randomLevel.pngName}`);
            const image = new AttachmentBuilder(imageBuffer, { name: 'index.png' });
            const guessEmbed = new EmbedBuilder().setTitle(guessStr)
                .setDescription(`**Difficulty:** ${randomLevel.diff}`).setImage('attachment://index.png').setColor(difficulty.hex);
            const replyOptions = { embeds: [guessEmbed], files: [image], allowedMentions: {repliedUser: pingOnReply}};
            const replyMessage = await context.reply(replyOptions);
            console.log(`${sparkName} just showed ${channelLevels.get(context.channel.id).name} with difficulty ${difficulty.name.toLowerCase()}.`);
            timeoutCollector = await replyMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: 20000 });
            channelTimeoutCollectors.set(context.channel.id, timeoutCollector);
            timeoutCollector.on('end', async collected => { 
                if (!collected.size && channelLevels.has(context.channel.id)) {
                    channelLevels.delete(context.channel.id); 
                    const timeoutEmbed = new EmbedBuilder().setTitle(timeUpStr).setColor(w);
                    await context.channel.send({ embeds: [timeoutEmbed], components: [rR], allowedMentions: {repliedUser: pingOnReply} });
                    for (const userId in data) { data[userId].streak = 0; }
                    fs.writeFileSync(globalPath, JSON.stringify(data, null, 2));
                    console.log(timeUpStr);
                    channelTimeoutCollectors.delete(context.channel.id);
                }
        });
    } catch (e) {console.error(e);if(!context.replied&&!context.deferred){await context.reply(errorHeader+e+errorFooter);}}
}
// Correct Answer Listener
client.on('messageCreate', async message => {
    try {
        if (channelLevels.has(message.channel.id) && message.content.toLowerCase() === channelLevels.get(message.channel.id).name.toLowerCase()) {
            const currentLevel = channelLevels.get(message.channel.id);
            if (currentLevel.guessedCorrectly) return;
            currentLevel.guessedCorrectly = true;
            const userId = message.author.id;
            const user = data[userId] || { ...userDataJSON };
            const { streak, highestStreak, levelCollection } = user;
            const difficulty = difficulties.find(d => d.name === currentLevel.diff);
            const thumbnailPath = `F:\\Bots\\SparkUp\\assets\\streak\\${streak}.png`;
            if (currentLevel.guesser && currentLevel.guesser !== userId) { data[currentLevel.guesser].streak = 0; }
            const points = calcCreatorPoints(channelLevels.get(message.channel.id).diff, levelCollection[difficulty.name]?.includes(channelLevels.get(message.channel.id).name)); 
            addCreatorPoints(userId, points);
            user.streak++; user.highestStreak = Math.max(user.highestStreak, user.streak);
            const embedDescription = [
                `You have been awarded ${points} creator point${points !== 1 ? 's' : ''}, <@${userId}>.`,
                streak > highestStreak ? `You got a new highest streak at **${streak}**!` : streak > 1 
                ? `Your current streak is at **${streak}**, keep going!` : '',
                !levelCollection[difficulty.name]?.includes(currentLevel.name) ? 'This Level has been added to your Collection.' : ''
            ].filter(Boolean).join('\n');
            const cGE = new EmbedBuilder().setTitle(correctGuessStr).setDescription(embedDescription).setColor(difficulty.hex);
            if (fs.existsSync(thumbnailPath)) { cGE.setThumbnail(`attachment://${streak}.png`); }
            levelCollection[difficulty.name] ||= [];
            if (!levelCollection[difficulty.name].includes(channelLevels.get(message.channel.id).name)) {
                levelCollection[difficulty.name].push(channelLevels.get(message.channel.id).name);
                console.log(`${message.author.username} guessed ${channelLevels.get(message.channel.id).name} correctly! Added to collection.`);
            }
            fs.writeFileSync(globalPath, JSON.stringify(data, null, 2));
            addLevelToUser(userId, channelLevels.get(message.channel.id).name, channelLevels.get(message.channel.id).diff);
            await message.reply({ embeds: [cGE], files: fs.existsSync(thumbnailPath) ? [{ attachment: thumbnailPath, name: `${streak}.png` }] : [], components: [rR], allowedMentions: { repliedUser: pingOnReply } });
            console.log(`${message.author.username} guessed ${channelLevels.get(message.channel.id).name} correctly!`);
            channelLevels.delete(message.channel.id);
            if (channelTimeoutCollectors.has(message.channel.id)) {
                channelTimeoutCollectors.get(message.channel.id).stop(); channelTimeoutCollectors.delete(message.channel.id);
            }
        }
    } catch (error) { console.error(error); await message.reply(`\`\`\`js\n${error.message}\n\`\`\``); }
});
client.login('Token Hidden for Privacy Reasons.');
