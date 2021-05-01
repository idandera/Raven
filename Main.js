//author: _dandera, github @idandera
//purpose: twom discord bot. various uses detailed in README.md
//created 2021-04-11
//last edited 2021-04-26


const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");
const key = JSON.parse(fs.readFileSync('./key.json', 'utf8'));

/*--------------------------------------------TO DO--------------------------------------------
    Set up the join-new-guild system
    Set up the register-new-member system
    Set up the leave-guild system
    Set up the role-add system
    Set up the role-remove system
    Set up the channel-create system
    Set up the channel-remove system
    
    How will data be stored? By user or by guild?
    Store redundant data?
    Set up user settings, privacy and custom settings for view
    Make it possible to add translations in the future
    Store all replies in an external json file? Instead of having switch cases every time a message is sent?
    There needs to be a better way to include multiple languages

    A wikia is vital. That was one of the top used functions
    use the code from the new stale oreos system. It was way faster than the old varient

    Undo button is gonna be needed.
---------------------------------------------------------------------------------------------*/
/*--------------------------------------------DONE--------------------------------------------
    - reporting a boss is up and working
    - reporting boxes is up and running
    - reporting boss and monster loot is completely done ( i think )
---------------------------------------------------------------------------------------------*/
/*--------------------------------------------BUGS--------------------------------------------
    - in box reporting, function can not handle equipment
    - in box reporting, function dungeon chests & treasures are empty
---------------------------------------------------------------------------------------------*/



//thinking about how to maintain boss time privacy
//for people who are okay with sharing drop rate stats, make it so that the stats do not update in real time as they report boss times
//maybe make stats update all at once at the end of the week, user log.json for each guild to trim log file size and also update stats at the same time
//this process will be, cpu intensive. So maybe do it when twom does their own maint.

client.on('ready', () => {
    console.log("connected as " + client.user.tag);
    client.user.setActivity('Arguing with JSON files');
    //Clean_Monster_Data()
    var template_json = JSON.parse(fs.readFileSync('./stats/template.json', 'utf8'));
    var boss_menu = fs.readFileSync('./menus/Boss.txt').toString().split('\n');
    var boss_json = JSON.parse(fs.readFileSync('./menus/Boss.json', 'utf8'));
    var mID = null;
    var loop = 0;
    var loot_dir = JSON.parse(fs.readFileSync('./menus/loot.json', 'utf8'));
    var box_dir = JSON.parse(fs.readFileSync('./Box_Data/box.json', 'utf8'));
    var file = {
        History_Arr: []
    }

    /*
    while(loop < loot_dir.Monster_Select.length){
        mID = (loop + 1).toString();
        while(mID.length < 3){
            mID = '0' + mID;
        }
        mID = 'm' + mID;
        loot_dir.Monster_Select[loop].mID = mID;
        loop++;
    }
    fs.writeFileSync('./menus/loot.json', JSON.stringify(loot_dir, null, 4), 'utf8');
    var file = {

    }
    loop = 141;
    while(loop < loot_dir.Monster_Select.length){
        file.Boss = loot_dir.Monster_Select[loop].Title;
        file.Map = loot_dir.Monster_Select[loop].Map;
        file.Respawn_Time = '0:2:30';
        file.Maint_Delay = '0:0:0';
        file.Image = null,
        file.id = loot_dir.Monster_Select[loop].mID;
        file.Loot_Table = [

        ]
        fs.writeFileSync('./Monster_Data/' + file.id + '.json', JSON.stringify(file, null, 4), 'utf8');
        loop++;
    }
    */
   //Clean_Monster_Data();
})

function Clean_Monster_Data(){
    var loop = 1;
    var inloop = null;
    var m_obj = null;
    var m_id = null;
    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json'));
    var equip_dir = JSON.parse(fs.readFileSync('./Equipment_Data/equipment.json'));
    while(loop < 218){
        m_id = loop.toString();
        while(m_id.length < 3){
            m_id = '0' + m_id;
        }
        m_id = 'm' + m_id;
        m_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + m_id + '.json', 'utf8'));
        inloop = 0;
        while(inloop < m_obj.Loot_Table.length){
            item_dir.Item_Objects.forEach(Element => {
                if(Element.Title == m_obj.Loot_Table[inloop]){
                    m_obj.Loot_Table[inloop] = Element.iID;
                    console.log('overwrote: ' + Element.iID);
                }
            })
            equip_dir.Equip_Objects.forEach(Element => {
                if(Element.Title == m_obj.Loot_Table[inloop]){
                    m_obj.Loot_Table[inloop] = Element.eID;
                    console.log('overwrote: ' + Element.eID);
                }
            })
            inloop++;
        }
        m_obj.Emoji = null;
        fs.writeFileSync('./Monster_Data/' + m_id + '.json', JSON.stringify(m_obj, null, 4), 'utf8');
        loop++;
    }
    
}

client.on('guildCreate', guild => {
    console.log('Joined new guild ' + guild.name);
    Join_Guild(guild);
})

client.on('guildDelete', guild => {
    console.log('Left guild ' + guild.name);
    LeaveGuild(guild);
})

client.on('channelDelete', channel => {

})

client.on('guildMemberRemove', guildMember => {

})

client.on('message', message => {
    const guild_data = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    var loop = 0;
    var guild_obj = null;
    if(message.guild == null){

    }else{
        while(loop < guild_data.Guild_Objects.length){
            if(guild_data.Guild_Objects[loop].discord == message.guild.id){
                guild_obj = guild_data.Guild_Objects[loop];
                loop = guild_data.Guild_Objects.length;
            }
            loop++;
        }
        var guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + guild_obj.id + '.json', 'utf8'));
        if(message.content.startsWith(guild_obj.key)){
            ProcessCommand(message, guild_file);
        }
        if(message.author.id == "252099253940387851"){
            console.log(message.content.length, message.content)
            if(message.content == 'init'){
                Init_Timers();
            }else if(message.content == 'bf10'){
                bf_ten_minute();
            }else if(message.content == 'bf'){
                bf_warning();
            }else if(message.content == 'test'){
                Join_Guild(message.guild);
                console.log('test join guild')
            }
        }
        
    }
    
})

function Init_Timers(){
    var date = new Date();
    var remain_ms = 0;
    var date_arr = [date.getHours(), date.getMinutes(), date.getSeconds()];
    if(date_arr[0]/2 != Math.floor(date_arr[0]/2)){
        remain_ms = 3600000;
    }
    remain_ms = remain_ms + (60 - date_arr[2]) * 1000;
    date_arr[1]++;
    remain_ms = remain_ms + (60 - date_arr[1]) * 60000;
    console.log(remain_ms);
    if(remain_ms > (600000)){
        setTimeout(function(){
            bf_ten_minute();
            setInterval(function(){
                bf_ten_minute();
            }, 7200000)
        }, remain_ms - 600000)
    }
    setTimeout(function(){
        bf_warning();
        setInterval(function(){
            bf_warning();
        }, 7200000)
    }, remain_ms)
    //guild sieges are tuesday 5:30am and 5:30am saturday
    //determine how long until the siege on wednesday
    var date_ms = date.getTime();
    var wednesday_siege_baseline = 1619587800000;
    remain_ms = date_ms - wednesday_siege_baseline;
    while(remain_ms > 604799999){
        remain_ms = remain_ms - 604800000;
    }
    if(remain_ms > 1800000){
        setTimeout(function(){
            siege_warning('30');
            setInterval(function(){
                siege_warning('30');
            }, 604800000)
        }, remain_ms - 1800000)
    }else{
        setTimeout(function(){
            siege_warning('30');
            setInterval(function(){
                siege_warning('30')
            }, 604800000)
        }, remain_ms + 603000000)
    }
    setTimeout(function(){
        siege_warning('now');
        setInterval(function(){
            siege_warning('now');
        }, 604800000)
    }, remain_ms)
    //determine how long until the siege on sunday
    var sunday_siege_baseline = 1619328600000;
    remain_ms = date_ms - sunday_siege_baseline;
    while(remain_ms > 604799999){
        remain_ms = remain_ms - 604800000;
    }
    if(remain_ms > 1800000){
        setTimeout(function(){
            siege_warning('30');
            setInterval(function(){
                siege_warning('30');
            }, 604800000)
        }, remain_ms - 1800000)
    }else{
        setTimeout(function(){
            siege_warning('30');
            setInterval(function(){
                siege_warning('30')
            }, 604800000)
        }, remain_ms + 603000000)
    }
    setTimeout(function(){
        siege_warning('now');
        setInterval(function(){
            siege_warning('now');
        }, 604800000)
    }, remain_ms)
    //determine how long until the time to run the weekly archive function
    var archive_log_baseline = 1619312400000;
    remain_ms = date_ms - sunday_siege_baseline;
    while(remain_ms > 604799999){
        remain_ms = remain_ms - 604800000;
    }
    setTimeout(function(){
        archive_logs();
        setInterval(function(){
            archive_logs();
        }, 604800000)
    }, remain_ms)
    

}

function bf_ten_minute(){
    var guilds = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    var maint = JSON.parse(fs.readFileSync('./Monster_Data/Maint.json', 'utf8'));
    if(maint.is_Maint == false){
        var guild_file = null;
        var loop = 0;
        var notif_file = null;
        var profiles = [];
        var channel = null;
        guilds.Guild_Objects.forEach(Element => {
            guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + Element.id + '.json', 'utf8'));
            loop = 0;
            while(loop < guild_file.Channel_Objects.length){
                if(guild_file.Channel_Objects[loop].Type == "discussion" && guild_file.battlefield == true){
                    profiles = [];
                    guild_file.User_Objects.forEach(Element => {
                        notif_file = JSON.parse(fs.readFileSync('./notifs/' + guild_file.id + '/' + Element.id + '.json', 'utf8'));
                        if(notif_file.notifs[0].notify_battlefield == true){
                            profiles[profiles.length] = client.users.cache.get(Element.discord);
                        }
                    })
                    channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                    channel.send('Battlefield starting in 10 mintes! ' + profiles);
                }
                loop++;
            }
        })
    }
}

function bf_warning(){
    var guilds = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    var maint = JSON.parse(fs.readFileSync('./Monster_Data/Maint.json', 'utf8'));
    if(maint.is_Maint == false){
        var guild_file = null;
        var loop = 0;
        var notif_file = null;
        var profiles = [];
        var channel = null;
        guilds.Guild_Objects.forEach(Element => {
            guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + Element.id + '.json', 'utf8'));
            loop = 0;
            while(loop < guild_file.Channel_Objects.length){
                if(guild_file.Channel_Objects[loop].Type == "discussion" && guild_file.battlefield == true){
                    channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                    channel.send('Battlefield has begun!');
                }
                loop++;
            }
        })
    }
}

function siege_warning(path){
    var guilds = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    var maint = JSON.parse(fs.readFileSync('./Monster_Data/Maint.json', 'utf8'));
    if(maint.is_Maint == false){
        var guild_file = null;
        var loop = 0;
        var notif_file = null;
        var profiles = [];
        var channel = null;
        guilds.Guild_Objects.forEach(Element => {
            guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + Element.id + '.json', 'utf8'));
            loop = 0;
            while(loop < guild_file.Channel_Objects.length){
                if(guild_file.Channel_Objects[loop].Type == "discussion" && guild_file.siege == true){
                    profiles = [];
                    guild_file.User_Objects.forEach(Element => {
                        notif_file = JSON.parse(fs.readFileSync('./notifs/' + guild_file.id + '/' + Element.id + '.json', 'utf8'));
                        if(notif_file.notifs[0].notify_siege == true){
                            profiles[profiles.length] = client.users.cache.get(Element.discord);
                        }
                    })
                    channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                    if(path == '30'){
                        channel.send('Guild Siege starting in 30 minutes! ' + profiles);
                    }else{
                        channel.send('Guild Siege has begun! ' + profiles);
                    }
                    
                }
                loop++;
            }
        })
    }
}

function archive_logs(){
    var guilds = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json'), 'utf8');
    var guild_objs_Arr = [];
    guilds.Guild_Objects.forEach(Element => {
        guild_objs_Arr[guild_objs_Arr.length] = JSON.parse(fs.readFileSync('./Guild_Data/' + Element.id + '.json', 'utf8'));
    })
    var log = [];
    var boss_Arr = [];
    var box_Arr = [];
    var date = new Date();
    var date_ms = date.getTime();
    var cutoff = date_ms - 604800000;
    var trimmed_log = {
        Event_Arr: []
    };
    var to_Archive = [];
    var to_Archive_total = [];
    var log_file = null;
    var loop = null;
    var inloop = null;
    var check = null;
    var gID = null;
    var file = null;
    var reduced_monster_log = {
        time: null,
        server: null,
        loot: [],
        users: [],
        author: null
    }
    var reduced_box_log = {
        time: null,
        server: null,
        contents: [],
        users: []
    }
    var scores_Arr = [];
    var score_Winners = [];
    var score_Users = [];
    var equip_file = null;
    var score = 0;
    var highest_score = 0;
    var guild_winner = null;
    guild_objs_Arr.forEach(Element => {
        score_Users = [];
        Element.User_Objects.forEach(Element => {
            score_Users[parseInt(Element.id.slice(1), 10)] = 0;
        })
        if(Element.id != 'g001'){
            scores_Arr[scores_Arr.length] = score;
        }
        score = 0;
        log_file = null;
        gID = Element.id;
        log_file = JSON.parse(fs.readFileSync('./log/' + gID + '/log.json'), 'utf8');
        loop = 0
        trimmed_log.Event_Arr = [];
        to_Archive = [];
        while(loop < log_file.Event_Arr.length){
            if(log_file.Event_Arr[loop].report < cutoff){
                to_Archive[to_Archive.length] = log_file.Event_Arr[loop];
                to_Archive_total[to_Archive_total.length] = log_file.Event_Arr[loop];
            }else{
                if(log_file.Event_Arr[loop].log_type == "L"){
                    if(log_file.Event_Arr[loop].anchor != null){
                        inloop = 0
                        check = false;
                        while(inloop < to_Archive.length){
                            if(to_Archive[inloop].id == log_file.Event_Arr[loop].anchor){
                                to_Archive[to_Archive.length] = log_file.Event_Arr[loop];
                                inloop = to_Archive.length;
                                check = true;
                            }
                            inloop++;
                        }
                        if(check == false){
                            trimmed_log.Event_Arr[trimmed_log.Event_Arr.length] = log_file.Event_Arr[loop];
                        }
                    }
                }
                trimmed_log.Event_Arr[trimmed_log.Event_Arr.length] = log_file.Event_Arr[loop];
            }
            loop++;
        }
        trimmed_log.Event_Arr.forEach(Element => {
            switch(Element.log_type){
                case "R":
                    if(Element.users.length > 0){
                        file = JSON.parse(fs.readFileSync('./stats/' + gID + '/Monster_Data/' + Element.mID + '.json', 'utf8'));
                        score = score + JSON.parse(fs.readFileSync('./Monster_Data/' + Element.mID + '.json', 'utf8')).Exp;
                        reduced_monster_log = {
                            time: Element.death,
                            server: Element.server,
                            loot: Element.loot,
                            users: Element.users,
                            author: Element.author
                        }
                        reduced_monster_log.loot.forEach(Element => {
                            if(Element.split(' ')[0] == 'Gold'){
                                if(Element.split(' ').length == 1){
                                    inloop = 0
                                    while(inloop < reduced_monster_log.users.length){
                                        score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + 1;
                                        inloop++;
                                    }
                                    score = score + 1;
                                }else{
                                    inloop = 0
                                    while(inloop < reduced_monster_log.users.length){
                                        score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + 2;
                                        inloop++;
                                    }
                                    score = score + 2;
                                }
                            }else if(Element.startsWith('i')){
                                inloop = 0
                                while(inloop < reduced_monster_log.users.length){
                                    score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + 2;
                                    inloop++;
                                }
                                score = score + 2;
                            }else if(Element.startsWith('e')){
                                inloop = 0
                                while(inloop < reduced_monster_log.users.length){
                                    score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(" ")[0] + '.json', 'utf8')).Exp;
                                    inloop++;
                                }
                                score = score + JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(" ")[0] + '.json', 'utf8')).Exp;
                            }
                        })
                        file.History_Arr[file.History_Arr.length] = reduced_monster_log;
                        //fs.writeFileSync('./stats/' + gID + '/Monster_Data/' + Element.mID + '.json', JSON.stringify(file, null, 4), 'utf8');
                    }
                    break;
                case "L":
                    if(Element.anchor == null){
                        file = JSON.parse(fs.readFileSync('./stats/' + gID + '/Monster_Data/' + Element.mID + '.json', 'utf8'));
                        reduced_monster_log = {
                            time: Element.report,
                            server: Element.server,
                            loot: Element.loot,
                            users: Element.users,
                            author: Element.author
                        }
                        reduced_monster_log.loot.forEach(Element => {
                            if(Element.split(' ')[0] == 'Gold'){
                                if(Element.split(' ').length == 1){
                                    inloop = 0
                                    while(inloop < reduced_monster_log.users.length){
                                        score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + 1;
                                        inloop++;
                                    }
                                    score = score + 1;
                                }else{
                                    inloop = 0
                                    while(inloop < reduced_monster_log.users.length){
                                        score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + 2;
                                        inloop++;
                                    }
                                    score = score + 2;
                                }
                            }else if(Element.startsWith('i')){
                                inloop = 0
                                while(inloop < reduced_monster_log.users.length){
                                    score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + 2;
                                    inloop++;
                                }
                                score = score + 2;
                            }else if(Element.startsWith('e')){
                                inloop = 0
                                while(inloop < reduced_monster_log.users.length){
                                    score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_monster_log.users[inloop].slice(1), 10)] + JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(" ")[0] + '.json', 'utf8')).Exp;
                                    inloop++;
                                }
                                score = score + JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(" ")[0] + '.json', 'utf8')).Exp;
                            }
                        })
                        file.History_Arr[file.History_Arr.length] = reduced_monster_log;
                        //fs.writeFileSync('./stats/' + gID + '/Monster_Data/' + Element.mID + '.json', JSON.stringify(file, null, 4), 'utf8');
                    }
                    break;
                case "B":
                    file = JSON.parse(fs.readFileSync('./stats/' + gID + '/Box_Data/' + Element.bID + '.json', 'utf8'));
                    reduced_box_log = {
                        time: Element.report,
                        server: Element.server,
                        contents: Element.contents,
                        users: Element.users
                    }
                    score = score + ((JSON.parse(fs.readFileSync('./Box_Data/' + Element.bID + '.json', 'utf8')).Exp) * Element.count);
                    inloop = 0;
                    while(inloop < Element.users.length){
                        score_Users[parseInt(Element.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_box_log.users[inloop].slice(1), 10)] + ((JSON.parse(fs.readFileSync('./Box_Data/' + Element.bID + '.json', 'utf8')).Exp) * Element.count);
                        inloop++;
                    }
                    reduced_box_log.contents.forEach(Element => {
                        if(Element.split('-')[1].startsWith('e')){
                            inloop = 0
                            while(inloop < reduced_box_log.users.length){
                                score_Users[parseInt(Element.users[inloop].slice(1), 10)] = score_Users[parseInt(reduced_box_log.users[inloop].slice(1), 10)] + JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(" ")[0] + '.json', 'utf8')).Exp;
                                inloop++;
                            }
                            score = score + ((JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(" ")[0] + '.json', 'utf8')).Exp) * parseInt(Element.split('-')[0], 10));
                        }
                    })
                    if(Element.contents.length > 0){
                        file.History_Arr[file.History_Arr.length] = reduced_box_log;
                        //fs.writeFileSync('./stats/' + gID + '/Box_Data/' + Element.bID + '.json', JSON.stringify(file, null, 4), 'utf8');
                    }
                    break;
            }
        })
        guild_winner = null;
        highest_score = 0
        loop = 1
        console.log(score_Users);
        while(loop < score_Users.length){
            if(isNaN(score_Users[loop]) == false){
                if(score_Users[loop] > highest_score){
                    guild_winner = Element.User_Objects[loop - 1].id;
                }else if(score_Users[loop] == highest_score && highest_score > 0){
                    guild_winner = guild_winner + ',' + Element.User_Objects[loop - 1].id;
                }
            }
            loop++;
        }
        score_Winners[score_Winners.length] = guild_winner;
        //fs.writeFileSync('./log/' + gID + '/log.json', JSON.stringify(trimmed_log, null, 4), 'utf8');
        if(to_Archive.length == 0){
            console.log('No event files to archive found in ' + gID);
        }else{
            console.log('successfully filed ' + to_Archive.length + ' events to archive in ' + gID);
        }
    })
    scores_Arr[scores_Arr.length] = score;
    
    loop = 0;
    var guild_rankings = [];
    console.log(score_Winners)
    while(loop < scores_Arr.length){
        guild_rankings[guild_rankings.length] = {
            id: guild_objs_Arr[loop].id,
            Guild_Name: guild_objs_Arr[loop].Guild_Name,
            score: scores_Arr[loop],
            color: guild_objs_Arr[loop].color,
            emoji: guild_objs_Arr[loop].emoji,
            image: guild_objs_Arr[loop].image
        };
        loop++;
    }
    loop = 0;
    var swap = null;
    while(loop < guild_rankings.length){
        inloop = 0;
        while(inloop < (guild_rankings.length - 1)){
            if(guild_rankings[inloop].score < guild_rankings[inloop + 1].score){
                swap = guild_rankings[inloop];
                guild_rankings[inloop] = guild_rankings[inloop + 1];
                guild_rankings[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    
    
    loop = 0;
    while(loop < guild_objs_Arr.length){
        Weekly_Roundup(guild_objs_Arr[loop], scores_Arr[loop], guild_rankings, score_Winners[loop]);
        loop++;
    }
}

function Weekly_Roundup(guild_obj, guild_score, guild_rankings, user_winners){
    console.log('guild ID report ' + guild_obj.id);
    const Weekly_Report_Embed = new Discord.MessageEmbed()
        .setAuthor("Black Raven Report", key.image, key.website)
        .setTitle("Weekly Summary");
    var loop = 0
    while(loop < guild_rankings.length){
        if(guild_rankings.id == guild_obj.id){
            Weekly_Report_Embed.addField('**' + guild_obj.Guild_Name + ' Weelky Score**', guild_rankings.score);
            loop = guild_rankings.length;
        }
        loop++;
    }
    if(guild_rankings[0].score > 0){
        Weekly_Report_Embed.setColor(guild_rankings[0].color);
        if(guild_rankings[0].image != null){
            Weekly_Report_Embed.setImage(guild_rankings[0].image);
        }
        loop = 1
        var rank_body = null;
        if(guild_rankings[0].emoji != null){
            rank_body = '1. ' + guild_rankings[0].emoji + ' ' + guild_rankings[0].Guild_Name;
        }else{
            rank_body = '1. ' + guild_rankings[0].Guild_Name;
        }
        while(loop < 10 && guild_rankings[loop].score > 0 && loop < guild_rankings.length){
            if(guild_rankings[loop].emoji != null){
                rank_body = rank_body + '\n' + (loop + 1).toString() + '. ' + guild_rankings[loop].emoji + ' ' + guild_rankings.Guild_Name;
            }else{
                rank_body = rank_body + '\n' + (loop + 1).toString() + '. ' + guild_rankings[loop].Guild_Name;
            }
            loop++;
        }
        if(rank_body.split('\n').length == 1){
            Weekly_Report_Embed.addField('**Top Guild**', rank_body.split("1. ")[1]);
        }else{
            Weekly_Report_Embed.addField('**Top ' + rank_body.split('\n').length + ' Guilds**', rank_body);
        }
    }else{
        Weekly_Report_Embed.setColor(guild_obj.color);
    }
    
    var user_json = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    var user_obj = null;
    console.log(user_winners)
    if(user_winners != null){
        user_winners = user_winners.split(',');
        if(user_winners.length == 1){
            user_obj = user_json.Member_Objects[parseInt(user_winners[0].slice(1), 10) - 1];
            if(user_obj.Image != null){
                Weekly_Report_Embed.setThumbnail(user_obj.Image);
            }
            if(user_obj.Emoji != null){
                Weekly_Report_Embed.addField('**Top ' + guild_obj.Guild_Name + ' User Score**', user_obj.Emoji + ' ' + user_obj.name);
            }else{
                Weekly_Report_Embed.addField('**Top ' + guild_obj.Guild_Name + ' User Score**', user_obj.name);
            }
        }else{
            var user_objs = [];
            user_winners.forEach(Element => {
                user_objs[user_objs.length] = user_json.Member_Objects[parseInt(Element.slice(1), 10) - 1];
            })
            var check = false;
            var user_body
            if(user_objs[0].Emoji != null){
                user_body = '1. ' + user_objs[0].Emoji + ' ' + user_objs[0].name;
            }else{
                user_body = '1. ' + user_objs[0].name;
            }
            if(user_body.Image != null){
                check = true;
                Weekly_Report_Embed.setThumbnail(user_body.Image);
            }
            loop = 1;
            while(loop < user_objs.length){
                if(user_objs[loop].Emoji != null){
                    user_body = user_body + '\n' + (loop + 1).toString() + '. ' + user_objs[loop].Emoji + ' ' + user_objs[loop].name;
                }else{
                    user_body = user_body + '\n' + (loop + 1).toString() + '. ' + user_objs[loop].name;
                }
                if(check == false && user_objs[loop].Image != null){
                    Weekly_Report_Embed.setThumbnail(user_objs[loop].Image);
                    check = true;
                }
                loop++;
            }
        }
    }
    /*if(user_winners.length == 1 && user_winners[0] != "n"){
        user_obj = user_json.Member_Objects[parseInt(user_winners[0].slice(1), 10) - 1];
        if(user_obj.Emoji != null){
            Weekly_Report_Embed.addField('**Top ' + guild_obj.Guild_Name + ' Member Score**', user_obj.Emoji + ' ' + user_obj.name);
        }else{
            Weekly_Report_Embed.addField('**Top ' + guild_obj.Guild_Name + ' Member Score**', user_obj.name);
        }
        if(user_obj.Image != null){
            Weekly_Report_Embed.setThumbnail(user_obj.Image);
        }
    }*/
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.Type == "discussion"){
            client.channels.cache.get(Element.discord).send(Weekly_Report_Embed);
        }
    })
}

function ProcessCommand(message, guild_obj){
    //first function passed to when a message is sent
    var in_string = message.content.toString();
    in_string = in_string.slice(guild_obj.key.length);
    var in_Arr = in_string.split(' ').slice(1);
    var cmd = in_string.split(' ')[0].toLowerCase();
    var users = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    var loop = 0;
    var check = false;
    in_Arr.forEach(Element => {
        check = true;
        if(Element.startsWith('<@!') && Element.length == 22){
            loop = 0;
            check = false;
            while(loop < users.Member_Objects.length){
                if(users.Member_Objects[loop].discord == Element.slice(3, -1)){
                    check = true;
                    loop = users.Member_Objects.length;
                }
                loop++;
            }
        }else if(Element.startsWith('<@') && Element.length == 21){
            loop = 0;
            check = false;
            while(loop < users.Member_Objects.length){
                if(users.Member_Objects[loop].discord == Element.slice(2, -1)){
                    check = true;
                    loop = users.Member_Objects.length;
                }
                loop++;
            }
        }
        if(check == false){
            if(Element.length == 22){
                NewUser(message, guild_obj, Element.slice(3,-1));
            }else{
                NewUser(message, guild_obj, Element.slice(2,-1));
            }
        }
        if(Element.startsWith('<@!') && Element.length == 22){
            loop = 0;
            check = false;
            while(loop < guild_obj.User_Objects.length){
                if(guild_obj.User_Objects[loop].discord == Element.slice(3,-1)){
                    check = true;
                    loop = guild_obj.User_Objects.length;
                }
                loop++;
            }
        }else if(Element.startsWith('<@') && Element.length == 21){
            loop = 0;
            check = false;
            while(loop < guild_obj.User_Objects.length){
                if(guild_obj.User_Objects[loop].discord == Element.slice(2,-1)){
                    check = true;
                    loop = guild_obj.User_Objects.length;
                }
                loop++;
            }
        }
        if(check == false){
            if(Element.length == 22){
                User_Join_Guild(message, guild_obj, Element.slice(3,-1));
            }else{
                User_Join_Guild(message, guild_obj, Element.slice(2,-1));
            }
        }
    })
    loop = 0;
    check = false;
    while(loop < users.Member_Objects.length){
        if(users.Member_Objects[loop].discord == message.author.id){
            check = true;
            loop = users.Member_Objects.length;
        }
        loop++;
    }
    if(check == false){
        NewUser(message, guild_obj, message.author.id);
    }
    check = false;
    loop = 0;
    while(loop < guild_obj.User_Objects.length){
        if(guild_obj.User_Objects[loop].discord == message.author.id){
            check = true;
            loop = guild_obj.User_Objects.length;
        }
        loop++;
    }
    if(check == false){
        User_Join_Guild(message, guild_obj, message.author.id);
    }
    guild_obj = JSON.parse(fs.readFileSync('./Guild_Data/' + guild_obj.id + '.json', 'utf8'));
    if(cmd == 'r' || cmd == 'report'){
        report(message, guild_obj, in_Arr)
    }else if(cmd == 'wiki' || cmd == 'wikipedia' || cmd == 'w'){
        //Wiki(message, guild_obj, in_Arr);
        Print_Wiki_Monster(message, guild_obj, in_Arr[0]);
    }else if(cmd == 'loot' || cmd == 'l'){
        loot(message, guild_obj, in_Arr);
    }else if(cmd == 'in' || cmd == 'pin'){
        Punch(message, guild_obj, in_Arr, true);
    }else if(cmd == 'out' || cmd == 'pout'){
        Punch(message, guild_obj, in_Arr, false);
    }else if(cmd == 'u' || cmd == 'undo'){
        Undo(message, guild_obj, in_Arr);
    }else if(cmd == 'b' || cmd == 'box'){
        Box(message, guild_obj, in_Arr);
    }
}

async function Undo(message, guild_obj, in_Arr){
    //a user wants to undo a command
    //load directory of recent commands, after a selection is made ask the user which command they'd like to undo
    var loop = null;
    var log_json = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var user_discord = null;
    in_Arr.forEach(Element => {
        if(Element.startsWith('<@!') && Element.length == 22){
            user_discord = Element.slice(3,-1);
        }else if(Element.startsWith('<@') && Element.length == 21){
            user_discord = Element.slice(2,-1);
        }
    })
    if(user_discord == null){
        user_discord = message.author.id;
    }
    loop = 0;
    var user = null;
    while(loop < guild_obj.User_Objects.length){
        if(guild_obj.User_Objects[loop].discord == user_discord){
            user = guild_obj.User_Objects[loop].id;
            loop = guild_obj.User_Objects.length;
        }
        loop++;
    }
    if(user == null){//if for some reason the user wasn't found in logs, return an error message. Unable to proceed without a user ID
        switch(guild_obj.language){
            case "english": 
                message.channel.send('Unable to finder user `' + client.users.cache.get(user_discord).username + '` in guild logs.');
                break;
        }
        return;
    }
    var logs_filtered = [];
    log_json.Event_Arr.forEach(Element => {//go through the guild logs and create an array of events that included the user who entered the command
        if(Element.author == user_discord && Element.home_channel == message.channel.id){
            logs_filtered[logs_filtered.length] = Element;
        }
    })
    if(logs_filtered.length == 0){
        switch(guild_obj.language){
            case 'english':
                message.channel.send('No commands from user `' + client.users.cache.get(user_discord).username + '` in channel `' + message.channel.name + '` to undo in guild logs.');
                break;
        }
        return;
    }
    var path = "MENU";
    in_Arr.forEach(Element => {
        if(Element == 'l' || Element == 'loot'){
            path = "L";
        }else if(Element == 'r' || Element == 'report'){
            path = "R";
        }else if(Element == 'b' || Element == 'box'){
            path = "B";
        }else if(Element == 'n' || Element == 'npc'){
            path = "N";
        }else if(Element == 'last'){
            path = "LAST";
        }
    })
    var user_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    
    var select = null;
    const Undo_Embed = new Discord.MessageEmbed()
        .setAuthor('Undo Confirmation', key.image, key.website)
        .setColor(guild_obj.color);
    var anchor = null;
    if(path == "LAST"){
        select = logs_filtered[logs_filtered.length - 1];
        
        if(select.log_type == "L"){
            logs_filtered.forEach(Element => {
                if(Element.id == select.anchor){
                    anchor = Element;
                }
            })
            var boss_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + select.mID + '.json', 'utf8'));
            if(anchor == null && boss_obj.is_Boss == true){
                switch(guild_obj.language){
                    case "english":
                        message.channel.send("Error in undo function.\n```json\nUnable to locate file ID " + select.anchor + '\n\n' + JSON.stringify(select, null, 4) + '```');
                        break;
                }
                return;
            }
        }
        var date = new Date(select.report);
        var user_profiles = [];
        if(select.log_type == "L" && boss_obj.is_Boss == true){
            anchor.users.forEach(Element => {
                user_profiles[user_profiles.length] = client.users.cache.get(user_dir.Member_Objects[parseInt(Element.slice(1), 10) - 1].discord);
            })
        }else{
            select.users.forEach(Element => {
                user_profiles[user_profiles.length] = client.users.cache.get(user_dir.Member_Objects[parseInt(Element.slice(1), 10) - 1].discord);
            })
        }
        var date_disp = [];
        date_disp[0] = date.getDate();
        if(date_disp[0] < 10){
            date_disp[0] = '0' + date_disp[0];
        }
        date_disp[1] = date.getMonth();
        if(date_disp[1] < 10){
            date_disp[1] = '0' + date_disp[1];
        }
        date_disp[2] = date.getFullYear();
        date_disp[3] = date.getHours();
        date_disp[4] = date.getMinutes();
        if(date_disp[4] < 10){
            date_disp[4] = '0' + date_disp[4];
        }
        date_disp[5] = date.getSeconds();
        if(date_disp[5] < 10){
            date_disp[5] = '0' + date_disp[5];
        }
        var title_object = null;
        const filter = m => m.content.author == message.channel.author;
        switch(select.log_type){
            case "R":
                title_object = JSON.parse(fs.readFileSync('./Monster_Data/' + select.mID + '.json', 'utf8')).Boss;
                Undo_Embed
                    .setTitle('Undo ' + title_object + ' Report')
                    .addField('Report Time', date_disp[0] + '/' + date_disp[1] + '/' + date_disp[2] + ' ' + date_disp[3] + ':' + date_disp[4] + ':' + date_disp[5]);
                    if(user_profiles.length != 0){
                        Undo_Embed.addField('Killed by', user_profiles.join(""));
                    }
                    Undo_Embed.addField('Server', select.server);
                    Undo_Embed.setFooter('To undo this command, reply "yes"');
                    var Undo_Prompt = await message.channel.send(Undo_Embed);
                    
                    const R_collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
                    R_collector.on('end', collected => {
                        if(collected.size == 0){
                            message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help undo`');
                            Undo_Prompt.delete();
                            return;
                        }
                        var reply = collected.first().toString().toLowerCase();
                        if(reply == "yes" || reply == "y"){
                            Undo_Prompt.delete();
                            collected.first().delete();
                            Undo_Report(message, guild_obj, select);
                        }else{
                            Undo_Prompt.delete();
                            collected.first().delete();
                        }
                    })
                break;
            case "L": 
                var equip_file = null;
                var equip_str = null;
                var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
                title_object = JSON.parse(fs.readFileSync('./Monster_Data/' + select.mID + '.json', 'utf8')).Boss;
                Undo_Embed
                    .setTitle('Undo ' + title_object + ' Loot Report')
                    .addField('Report Time', date_disp[0] + '/' + date_disp[1] + '/' + date_disp[2] + ' ' + date_disp[3] + ':' + date_disp[4] + ':' + date_disp[5]);
                var looted_items = [];
                select.loot.forEach(Element => {
                    if(Element.split(" ")[0] == 'Gold'){
                        looted_items[looted_items.length] = "<:Gold:834876053029126144> " + Element;
                    }else if(Element.startsWith('i')){
                        looted_items[looted_items.length] = item_dir.Item_Objects[parseInt(Element.split(' ')[0].slice(1), 10) - 1].Title
                        if(Element.split(' ').length == 2){
                            looted_items[looted_items.length - 1] = looted_items.length - 1 + ' ' + Element.split(" ")[1]
                        }
                        if(item_dir.Item_Objects[parseInt(Element.split(' ')[0].slice(1), 10) - 1].Emoji != null){
                            looted_items[looted_items.length - 1] = item_dir.Item_Objects[parseInt(Element.split(' ')[0].slice(1), 10) - 1].Emoji + ' ' + looted_items[looted_items.length - 1];
                        }
                    }else{
                        equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(" ")[0] + '.json', 'utf8'));
                        if(equip_file.is_Static == true){
                            if(equip_file.Emoji != null){
                                looted_items[looted_items.length] = equip_file.Emoji + ' ' + equip_file.Title;
                            }else{
                                looted_items[looted_items.length] = equip_file.Title;
                            }
                        }else if(equip_file.Verieties.length > 0){
                            if(equip_file.Emoji != null){
                                looted_items[looted_items.length] = equip_file.Emoji + ' ' + equip_file.Title + ' (' + equip_file.Verieties[Element.split(" ")[1].slice(1, -1)] + ')';
                            }else{
                                looted_items[looted_items.length] = equip_file.Title + ' (' + equip_file.Verieties[Element.split(" ")[1].slice(1, -1)] + ')';
                            }
                        }else{
                            equip_str = "";
                            if(equip_file.Emoji != null){
                                equip_str = equip_file.Emoji;
                            }
                            equip_str = equip_str + equip_file.Title + ' (';
                            loop = 0;
                            while(loop < equip_file.Stat_Ranges.length){
                                equip_str = equip_str + Element.split(' ')[1].slice(1,-1).split(',')[loop] + ' ' + equip_file.Stat_Ranges[loop];
                                loop++;
                                if(loop == equip_file.Stat_Ranges.length){
                                    equip_str = equip_str + ')';
                                }else{
                                    equip_str = equip_str + ', ';
                                }
                            }
                            looted_items[looted_items.length] = equip_str;
                        }
                    }
                })
                Undo_Embed.addField('Reported Loot', looted_items.join('\n'));
                if(user_profiles.length != 0){
                    Undo_Embed.addField('Looted by', user_profiles.join(""));
                }
                Undo_Embed.addField('Server', select.server);
                Undo_Embed.setFooter('To undo this command reply "yes"');
                var Undo_Prompt = await message.channel.send(Undo_Embed);
                const L_collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
                L_collector.on('end', collected => {
                    if(collected.size == 0){
                        message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help undo`');
                        Undo_Prompt.delete();
                        return;
                    }
                    var reply = collected.first().toString().toLowerCase();
                    if(reply == "yes" || reply == "y"){
                        Undo_Prompt.delete();
                        collected.first().delete();
                        Undo_Loot(message, guild_obj, select, anchor);
                    }else{
                        Undo_Prompt.delete();
                        collected.first().delete();
                    }
                })
                break;
            case "B":
                title_object = JSON.parse(fs.readFileSync('./Box_Data/' + select.bID + '.json', 'utf8')).Title;
                Undo_Embed
                    .setTitle('Undo ' + title_object + ' Report')
                    .addField('Report Time', date_disp[0] + '/' + date_disp[1] + '/' + date_disp[2] + ' ' + date_disp[3] + ':' + date_disp[4] + ':' + date_disp[5]);
                if(user_profiles.length != 0){
                    Undo_Embed.addField('Reported by', user_profiles.join(""));
                }
                Undo_Embed.addField('Server', select.server);
                Undo_Embed.setFooter('To undo this command, reply "yes"');
                var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", 'utf8'));
                var disp_Arr = [];
                var item_file = null;
                console.log(select)
                var loot_Arr = select.contents;
                loot_Arr.forEach(Element => {
                    if(Element.includes('Gold')){
                        if(Element.split("-")[0] == 1){
                            disp_Arr[disp_Arr.length] = "<:Gold:834876053029126144> " + Element.split('-')[1];
                        }else{
                            disp_Arr[disp_Arr.length] = "<:Gold:834876053029126144> " + Element.split('-')[1] + ' (x' + Element.split('-')[0] + ')';
                        }
                    }else if(Element.split('-')[1].startsWith('i')){
                        console.log(Element)
                        item_file = item_dir.Item_Objects[parseInt(Element.split('-')[1].split(' ')[0].slice(1), 10) - 1];
                        if(Element.split('-')[0] == 1){
                            if(item_file.Emoji != null){
                                disp_Arr[disp_Arr.length] = item_file.Emoji + " " + item_file.Title;
                            }else{
                                disp_Arr[disp_Arr.length] = item_file.Title;
                            }
                            if(Element.split(' ').length == 2){
                                disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ' ' + Element.split(' ')[1];
                            }
                        }else{
                            if(Element.split(' ').length == 2){
                                if(item_file.Emoji != null){
                                    disp_Arr[disp_Arr.length] = item_file.Emoji + " " + item_file.Title + ' ' + Element.split(' ')[1] + " (x" + Element.split('-')[0] + ")";
                                }else{
                                    disp_Arr[disp_Arr.length] = item_file.Title + ' ' + Element.split(' ')[1] + " (x" + Element.split("-")[0] + ")";
                                }
                            }else{
                                if(item_file.Emoji != null){
                                    disp_Arr[disp_Arr.length] = item_file.Emoji + " " + item_file.Title + " (x" + Element.split('-')[0] + ")";
                                }else{
                                    disp_Arr[disp_Arr.length] = item_file.Title + " (x" + Element.split("-")[0] + ")";
                                }
                            }
                        }
                    }else if(Element.split('-')[1].startsWith('e')){
                        equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split("-")[1].split(" ")[0] + '.json', 'utf8'));
                        if(equip_file.is_Static == true){
                            if(equip_file.Emoji != null){
                                disp_Arr[disp_Arr.length] = equip_file.Emoji + ' ' + equip_file.Title;
                            }else{
                                disp_Arr[disp_Arr.length] = equip_file.Title;
                            }
                        }else if(equip_file.Verieties.length > 0){
                            if(equip_file.Emoji != null){
                                disp_Arr[disp_Arr.length] = equip_file.Emoji + ' ' + equip_file.Title + ' [' + equip_file.Verieties[parseInt(Element.split(' [')[1].split(']')[0], 10)] + ']';
                            }else{
                                disp_Arr[disp_Arr.length] = equip_file.Title + ' [' + equip_file.Verieties[parseInt(Element.split(' [')[1].split(']')[0], 10)] + ']';
                            }
                        }else if(equip_file.Stat_Ranges.length > 0){
                            if(equip_file.Emoji != null){
                                disp_Arr[disp_Arr.length] = equip_file.Emoji + ' ' + equip_file.Title + ' (';
                            }else{
                                disp_Arr[disp_Arr.length] = equip_file.Title + ' (';
                            }
                            loop = 0;
                            while(loop < equip_file.Stat_Ranges.length){
                                if(loop != 0){
                                    disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ', '
                                }
                                disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + Element.split(' [')[1].split(']')[0].split(",")[loop] + ' ' + equip_file.Stat_Ranges[loop];
                                loop++;
                            }
                            disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ')'
                        }
                        if(parseInt(Element.split('-')[0], 10) > 1){
                            disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ' (x' + Element.split('-')[0] + ')';
                        }
                    }
                })
                console.log(loot_Arr, disp_Arr);
                var disp_Arr_divided = [];
                if(disp_Arr.join('\n').length < 1024){
                    Undo_Embed.addField('**Reported Contents**', disp_Arr.join('\n'))
                }else{
                    disp_Arr_divided[0] = disp_Arr[0];
                    loop = 1;
                    while(loop < disp_Arr.length){
                        if(disp_Arr_divided[disp_Arr_divided.length - 1].length + disp_Arr[loop].length < 1000){
                            disp_Arr_divided[disp_Arr_divided.length - 1] = disp_Arr_divided[disp_Arr_divided.length - 1] + '\n' + disp_Arr[loop];
                        }else{
                            disp_Arr_divided[disp_Arr_divided.length] = disp_Arr[loop];
                        }
                        loop++;
                    }
                    loop = 0
                    while(loop < disp_Arr_divided.length){
                        if(loop + 1 != disp_Arr_divided.length && loop == 0){
                            Undo_Embed.addFields(
                                {name: "**Reported Contents**", value: disp_Arr_divided[0], inline: true},
                                {name: "Continued...", value: disp_Arr_divided[1], inline: true}
                            )
                            loop++;
                        }else if(loop + 1 != disp_Arr_divided.length){
                            Undo_Embed.addFields(
                                {name: "\u200B", value: "\u200B"},
                                {name: "Continued...", value: disp_Arr_divided[loop], inline: true},
                                {name: "Continued...", value: disp_Arr_divided[loop + 1], inline: true}
                            )
                            loop++;
                        }else{
                            Undo_Embed.addField("Continued...", disp_Arr_divided[loop]);
                        }
                        loop++;
                    }
                }
                var Undo_Prompt = await message.channel.send(Undo_Embed);                        
                const B_collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
                B_collector.on('end', collected => {
                    if(collected.size == 0){
                        message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help undo`');
                        Undo_Prompt.delete();
                        return;
                    }
                    var reply = collected.first().toString().toLowerCase();
                    if(reply == "yes" || reply == "y"){
                        Undo_Prompt.delete();
                        collected.first().delete();
                        Undo_Box(message, guild_obj, select);
                    }else{
                        Undo_Prompt.delete();
                        collected.first().delete();
                    }
                })
                break;
        }
    }
}

function Undo_Report(message, guild_obj, select){
    //undo a boss report
    console.log(select);
    var log = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var branch = {
        id: "EMPTY"
    }
    var loop = 0;
    if(select.loot.length != 0){
        while(loop < log.Event_Arr.length){
            if(log.Event_Arr[loop].log_type == "L"){
                if(log.Event_Arr[loop].anchor == select.id){
                    branch = log.Event_Arr[loop].id
                    loop = log.Event_Arr[loop].length;
                }
            }
            loop++;
        }
    }
    var trimmed_log = {
        Event_Arr: []
    }
    log.Event_Arr.forEach(Element => {
        if(Element.id != select.id && Element.id != branch.id){
            trimmed_log.Event_Arr[trimmed_log.Event_Arr.length] = Element;
        }
    })
    fs.writeFileSync('./log/' + guild_obj.id + '/log.json', JSON.stringify(trimmed_log, null, 4), 'utf8');
    var boss_key = fs.readFileSync('./scores/score_key.txt').toString();
    var guild_file = JSON.parse(fs.readFileSync('./scores/' + guild_obj.id + '/main.json', 'utf8'));
    var boss_name = JSON.parse(fs.readFileSync('./Monster_Data/' + select.mID + '.json', 'utf8')).Boss;
    var pos = 0;
    var uID_Arr = select.users;
    while(loop < boss_key.length){
        if(boss_key[loop] == boss_name){
            pos = loop;
            loop = boss_key.length;
        }
        loop++;
    }
    guild_file.Server_Objects.forEach(Element => {
        if(Element.server == select.server){
            Element.array[pos]--;
            Element.total--;
        }
    })
    guild_file.total--;
    fs.writeFileSync('./scores/' + guild_obj.id + '/main.json', JSON.stringify(guild_file, null, 4), 'utf8');
    loop = 0;
    var user_file = null;
    while(loop < uID_Arr.length){
        user_file = JSON.parse(fs.readFileSync('./scores/' + guild_obj.id + '/' + uID_Arr[loop] + '.json', 'utf8'));
        user_file.Server_Objects.forEach(Element => {
            if(Element.server == select.server){
                Element.array[pos]--;
                Element.total--;
            }
        })
        user_file.total--;
        fs.writeFileSync('./scores/' + guild_obj.id + '/' + uID_Arr[loop] + '.json', JSON.stringify(user_file, null, 4), 'utf8');
        loop++;
    }
    switch(guild_obj.language){
        case 'english':
            message.channel.send('Command file deleted from logs ✅ ');
            break;
    }
    
}

function Undo_Loot(message, guild_obj, select, anchor){
    //undo a loot report
    console.log(select, anchor);
    var loop = 0;
    var log = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var trimmed_log = {
        Event_Arr: [

        ]
    }
    if(anchor != null){
        anchor.loot = [];
        log.Event_Arr.forEach(Element => {
            if(Element.id != select.id && Element.id != anchor.id){
                trimmed_log.Event_Arr[trimmed_log.Event_Arr.length] = Element;
            }else if(Element.id == anchor.id){
                trimmed_log.Event_Arr[trimmed_log.Event_Arr.length] = anchor;
            }
        })
    }else{
        log.Event_Arr.forEach(Element => {
            if(Element.id != select.id){
                trimmed_log.Event_Arr[trimmed_log.Event_Arr.length] = Element;
            }
        })
    }
    fs.writeFileSync('./log/' + guild_obj.id + '/log.json', JSON.stringify(trimmed_log, null, 4), 'utf8');
    switch(guild_obj.language){
        case 'english':
            message.channel.send('Command file deleted from logs ✅ ');
            break;
    }   
}

function Undo_Box(message, guild_obj, select){
    var log = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var trimmed_log = {
        Event_Arr: []
    }
    log.Event_Arr.forEach(Element => {
        if(Element.id != select.id){
            trimmed_log.Event_Arr[trimmed_log.Event_Arr.length] = Element;
        }
    })
    fs.writeFileSync('./log/' + guild_obj.id + '/log.json', JSON.stringify(trimmed_log, null, 4), 'utf8');
    switch(guild_obj.language){
        case 'english':
            message.channel.send('Command file deleted from logs ✅ ');
            break;
    }   
}

function NewUser(message, guild_obj, discord_id){
    //a user who does not have a registered file has entered a command
    //set up files for this user to use.
    console.log(discord_id)
    var user_json = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    var loop = 0;
    var check = false;
    while(loop < user_json.Member_Objects.length){
        if(user_json.Member_Objects[loop].discord == discord_id){
            check = true;
            loop = user_json.Member_Objects.length;
        }
        loop++;
    }
    if(check == false){
        var id = user_json.Member_Objects.length.toString();
        while(id.length < 3){
            id = '0' + id;
        }
        var discord_profile = client.users.cache.get(discord_id);
        id  = 'u' + id;
        var user_file = {
            id: id,
            discord: discord_id,
            alt: false,
            main: null,
            guilds: [],
            name: discord_profile.username,
            Emoji: null,
            Image: null
        }
        var NewUser_Embed = new Discord.MessageEmbed()
            .setColor(guild_obj.color);
        switch(guild_obj.language){
            case 'english':
                NewUser_Embed
                    .setAuthor('New User', key.image, key.website)
                    .addField("**Default Profile Settings**", "**Username**: " + user_file.name + "\n**Alternative Account**: false\n**Guild**: " + guild_obj.Guild_Name + '\n**Emoji**: none\n**Image**: none')
                    .addField('**Raven User ID**', user_file.id)
                    .setFooter('To customize your settings use $profile settings\nFor help try $help profile');
                break;
        }
        discord_profile.send(NewUser_Embed);
        user_json.Member_Objects[user_json.Member_Objects.length] = user_file;
        user_json.Total_Members = user_json.Member_Objects.length;
        fs.writeFileSync('./User_Data/users.json', 'utf8', JSON.stringify(user_json, null, 4));
    }
    User_Join_Guild(message, guild_obj, discord_id);

}

function User_Join_Guild(message, guild_obj, discord_id){
    console.log(guild_obj)
    var check = false;
    var loop = 0;
    while(loop < guild_obj.User_Objects.length){
        if(guild_obj.User_Objects[loop].discord == discord_id){
            check = true;
        }
        loop++;
    }
    if(check == true){
        User_Profile(message, guild_obj, discord_id);
        return;
    }
    var user_obj = null;
    var user_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    loop = 0;
    while(loop < user_dir.Member_Objects.length){
        if(user_dir.Member_Objects[loop].discord == discord_id){
            user_obj = user_dir.Member_Objects[loop];
            user_dir.Member_Objects[loop].guilds[user_dir.Member_Objects[loop].guilds.length] = guild_obj.id,
            loop = user_dir.Member_Objects.length;
        }
        loop++;
    }
    fs.writeFileSync('./User_Data/users.json', JSON.stringify(user_dir, null, 4), 'utf8');
    var discord_profile = client.users.cache.get(discord_id);
    var guild_user_file = {
        id: user_obj.id,
        discord: discord_id,
        name: null,
        alt: user_obj.alt,
        main: user_obj.main
    }
    console.log(guild_user_file);
    guild_obj.User_Objects[guild_obj.User_Objects.length] = guild_user_file;
    fs.writeFileSync('./Guild_Data/' + guild_obj.id + '.json', JSON.stringify(guild_obj, null, 4), 'utf8');
    var notif_template = JSON.parse(fs.readFileSync('./notifs/u000.json', 'utf8'));
    fs.writeFileSync('./notifs/' + guild_obj.id + '/' + user_obj.id + '.json', JSON.stringify(notif_template, null, 4), 'utf8');
    
    switch(guild_obj.language){
        case 'english':
            message.channel.send('**' + discord_profile.username + '** has become a member of ' + guild_obj.Guild_Name + '!');
            break;
    }
}

function User_Profile(message, guild_obj, discord_id){
    var user_json = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    var user_obj = null;
    var loop = 0;
    while(loop < user_json.Member_Objects.length){
        if(user_json.Member_Objects[loop].discord == discord_id){
            user_obj = user_json.Member_Objects[loop];
            loop = user_json.Member_Objects.length;
        }
        loop++;
    }
    var guild_user_obj = null;
    loop = 0;
    while(loop < guild_obj.User_Objects.length){
        if(guild_obj.User_Objects[loop].discord == discord_id){
            guild_user_obj = guild_obj.User_Objects[loop];
            loop = guild_obj.User_Objects.length;
        }
        loop++;
    }
    var guild_names = [];
    user_obj.guilds.forEach(Element => {
        guild_names[guild_names.length] = JSON.parse(fs.readFileSync('./Guild_Data/' + Element + '.json', 'utf8')).Guild_Name;
        if(JSON.parse(fs.readFileSync('./Guild_Data/' + Element + '.json', 'utf8')).emoji != null){
            guild_names[guild_names.length - 1] = JSON.parse(fs.readFileSync('./Guild_Data/' + Element + '.json', 'utf8')).emoji + ' ' + guild_names[guild_names.length - 1];
        }
    })
    var Profile_Embed = new Discord.MessageEmbed()
        .setColor(guild_obj.color)
        .setAuthor('Settings', key.image, key.website);
    if(user_obj.Image != null){
        Profile_Embed.setThumbnail(user_obj.Image);
    }
    if(user_obj.alt == true){
        switch(guild_obj.language){
            case 'english':
                Profile_Embed.addField('**User Profile**', "**Username:** " + user_obj.name + '\n**Shortcut:** ' + guild_user_obj.name + '\n**Alternative Account:** true\n**Main Account:** ' + user_obj.main + '\n**Emoji:** ' + user_obj.Emoji + '\n**Guilds**:\n' + guild_names.join('\n'));
                Profile_Embed.setFooter('To customize your settings use ' + guild_obj.key + 'profile settings\nFor help try ' + guild_obj.key + 'help profile');
                break;
        }
    }else{
        switch(guild_obj.language){
            case 'english':
                Profile_Embed.addField('**User Profile**', "**Username:** " + user_obj.name + '\n**Shortcut:** ' + guild_user_obj.name + '\n**Emoji:** ' + user_obj.Emoji + '\n**Guilds**:\n' + guild_names.join('\n'));
                Profile_Embed.setFooter('To customize your settings use ' + guild_obj.key + 'profile settings\nFor help try ' + guild_obj.key + 'help profile');
                break;
        }
    }

    message.channel.send(Profile_Embed);
}

function Join_Guild(guild){
    var guilds_dir = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    var loop = 0;
    var guild_obj = null;
    var check = false;
    while(loop < guilds_dir.Guild_Objects.length){
        if(guilds_dir.Guild_Objects[loop].discord == guild.id){
            guild_obj = guilds_dir.Guild_Objects[loop];
            check = true;
            loop = guilds_dir.Guild_Objects.length;
        }
        loop++;
    }
    if(check == true){
        Guild_Settings(guild, guild_obj);
        return;
    }
    var gID = (guilds_dir.Guild_Objects.length + 1).toString();
    while(gID.length < 3){
        gID = '0' + gID;
    }
    gID = 'g' + gID;
    guild_obj = {
        id: gID,
        discord: guild.id,
        key: "$",
        language: "english"
    };
    guilds_dir.Guild_Objects[guilds_dir.Guild_Objects.length] = guild_obj;
    fs.writeFileSync('./Guild_Data/guilds.json', JSON.stringify(guilds_dir, null, 4), 'utf8');
    console.log(guild_obj);
    var guild_file = {
        Guild_Name: guild.name,
        id: gID,
        discord: guild.id,
        color: "b60e0e",
        key: "$",
        language: "english",
        image: null,
        emoji: null,
        battlefield: true,
        siege: true,
        data_source: false,
        loot_prompt: false,
        private_data: true,
        join_data: new Date().getTime(),
        Total_Members: 0,
        Channel_Objects: [],
        User_Objects: []
    }
    console.log(guild_file);
    fs.writeFileSync('./Guild_Data/' + gID + '.json', JSON.stringify(guild_file, null, 4), 'utf8');
    fs.mkdirSync('./notifs/' + gID);
    fs.mkdirSync('./stats/' + gID);
    fs.mkdirSync('./stats/' + gID + '/Box_Data');
    fs.mkdirSync('./stats/' + gID + '/Craft_Data');
    fs.mkdirSync('./stats/' + gID + '/Enchant_Data');
    fs.mkdirSync('./stats/' + gID + '/Monster_Data');
    fs.mkdirSync('./stats/' + gID + '/NPC_Data');
    var box_dir = JSON.parse(fs.readFileSync('./Box_Data/box.json', 'utf8'));
    var file = {
        History_Arr: []
    }
    box_dir.Box_Objects.forEach(Element => {
        fs.writeFileSync('./stats/' + gID + '/Box_Data/' + Element.bID + '.json', JSON.stringify(file), 'utf8');
    })
    var monster_dir = JSON.parse(fs.readFileSync('./menus/loot.json', 'utf8'));
    monster_dir.Monster_Select.forEach(Element => {
        fs.writeFileSync('./stats/' + gID + '/Monster_Data/' + Element.mID + '.json', JSON.stringify(file), 'utf8');
    })
    var score_template = JSON.parse(fs.readFileSync('./scores/template.json', 'utf8'));
    fs.mkdirSync('./scores/' + gID);
    fs.writeFileSync('./scores/' + gID + '/main.json', JSON.stringify(score_template, null, 4), 'utf8');
    Guild_Settings(guild);
}

function Guild_Settings(guild, guild_obj){
    console.log(guild.channels.cache);
    console.log(guild_obj);
    var guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + guild_obj.id + '.json', 'utf8'));
    console.log(guild_file);
}

async function Wiki(message, guild_obj, in_Arr){
    
}

function report(message, guild_obj, in_Arr){
    //a boss has been reported by a user
    //function must do the following
    /*-----------------------------------------------------
        Determine what server this boss was killed on (based on the channel)
        Determine when the boss was killed
        Determine who killed the boss
        Determine when the boss will next spawn (if applicable)
        Pass function to Report_Reply to display data
        Set a respawn timer (if applicable)
        Load user profiles, are they contributing droprate data?
            If they are contributing droprate data, ask them for drops from the boss
        Call to scoreboard, increase 
    -------------------------------------------------------*/
    //step one - make sure this is an appropriate channel & determine the server
    var server = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            server = Element.Server;
        }
    })
    if(server == null){
        switch(guild_obj.language){
            case "english":
                message.channel.send('This function is restricted to report-type channels. Try `' + guild_obj.key + 'help report` or `' + guild_obj.key + 'help channels`');
                break;
        }
        return;
    }
    //step two - make sense of the input array
    const Boss_Menu = fs.readFileSync('./menus/Boss.txt').toString().split('\n');
    var mID = null;
    var boss_obj = null;
    var loop = 0;
    var check = false;
    while(loop < in_Arr.length){
        in_Arr[loop] = in_Arr[loop].toLowerCase();
        loop++;
    }
    console.log(in_Arr)
    if(in_Arr.length == 0){
        switch(guild_obj.language){
            case "english":
                message.channel.send('Not enough arguments, try `' + guild_obj.key + 'help report`');
                break;
        }
        return;
    }else if(in_Arr.length > 0){
        loop = 0;
        while(loop < Boss_Menu.length){
            Boss_Menu[loop].split('|')[1].split(',').forEach(Element => {
                if(Element == in_Arr[0]){
                    check = true;
                }
            })
            loop++;
            if(check == true){
                mID = loop.toString();
                while(mID.length < 3){
                    mID = '0' + mID;
                }
                mID = 'm' + mID;
                boss_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + mID + '.json', 'utf8'));
                loop = Boss_Menu.length;
            }
        }
        if(check == false){
            switch(guild_obj.language){
                case "english":
                    message.channel.send('Unable to determine `' + in_Arr[0] + '`. Try `' + guild_obj.key + 'help report`');
                    break;
            }
            return;
        }
    }
    var user_discord_ids = [];
    var role_discord_ids = [];
    var users = [];
    var is_Lost = false
    in_Arr.forEach(Element => {
        if(Element.startsWith('<@!')){
            user_discord_ids[user_discord_ids.length] = Element.slice(3,-1);
        }else if(Element.startsWith('<@&')){
            role_discord_ids[role_discord_ids.length] = Element.slice(3,-1);
        }else if(Element.startsWith('<@')){
            user_discord_ids[user_discord_ids.length] = Element.slice(2,-1)
        }else if(Element.startsWith('u') && isNaN(Element.slice(1)) == false){
            users[users.length] = parseInt(Element.slice(1), 10).toString();
            while(users[users.length - 1].length < 3){
                users[users.length - 1] = '0' + users[users.length - 1]
            }
            users[users.length - 1] = 'u' + users[users.length - 1];
        }else if(Element == 'lost' || Element == 'none'){
            is_Lost = true;
        }
    })
    loop = 1;
    while(loop < in_Arr.length){
        guild_obj.User_Objects.forEach(Element => {
            if(Element.name.toLowerCase() == in_Arr[loop]){
                user_discord_ids[user_discord_ids.length] = Element.discord;
            }
        })
        loop++;
    }
    //if there was no user input, set the author as the farmer
    if(user_discord_ids.length == 0 && users.length == 0 && role_discord_ids.length == 0 && is_Lost == false){
        user_discord_ids[0] = message.author.id;
    }
    var user_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    const guild = client.guilds.cache.get(message.guild.id);
    role_discord_ids.forEach(Element => {
        guild.members.cache.forEach(guildMember => {
            if(guildMember.roles.cache.has(Element)){
                user_discord_ids[user_discord_ids.length] = guildMember.user.id;
            }
        })
    })
    user_discord_ids.forEach(Element => {
        pos = null;
        check = false;
        loop = 0;
        while(loop < user_dir.Member_Objects.length){
            if(user_dir.Member_Objects[loop].discord == Element){//find the users file
                check = true;
                //check to make sure this user is not already on the list of users
                if(users.includes(user_dir.Member_Objects[loop].id) == false && users.includes(user_dir.Member_Objects[loop].main) == false){
                    if(user_dir.Member_Objects[loop].alt == true){
                        users[users.length] = user_dir.Member_Objects[loop].main;
                    }else{
                        users[users.length] = user_dir.Member_Objects[loop].id;
                    }
                }
            }
            loop++;
        }
        if(check == false){//user was not found on the list
            NewUser(message, guild_obj, Element);//call NewUser to register the new person
            user_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));//reload the user directory, since a new member has been added
            guild_obj = JSON.parse(fs.readFileSync('./Guild_Data/' + guild_obj.id + '.json', 'utf8'));//reload the guild object since a new member has been added
            loop = 0;
            while(loop < user_dir.Member_Objects.length){
                if(user_dir.Member_Objects[loop].discord == Element){//now that a user has been registered, search for their new ID again
                    users[users.length] = user_dir.Member_Objects[loop].id;
                    loop = user_dir.Member_Objects.length;
                }
                loop++;
            }
        }
    })
    console.log(users)
    
    //next step, determine the death time of the boss, spawn time and if a reminder needs to be set
    //declare variables for calculating all needed times
    //time of death (display and unix epoch)
    //time of report (display and unix epoch)
    //time of respawn (display and unix epoch)
    //time until respawn (unix epoch)
    var date = new Date();
    var time_in = [];
    //time of death
    var death_disp = [];
    var death_epoch = null;
    //time of report
    var report_epoch = Date.now();
    var report_disp = [parseInt(date.getHours(), 10), parseInt(date.getMinutes(), 10), parseInt(date.getSeconds(), 10)];
    //time of respawn
    var respawn_disp = [];
    var respawn_epoch = null;

    //move on to determine the time of death of the boss
    if(in_Arr.length > 1){//get when the boss died from the user
        in_Arr.forEach(Element => {
            if(Element.includes(':')){
                time_in = Element.split(':');
            }
        })
    }
    if(time_in.length == 0){//if the user didn't say when the boss died, assume it died the moment they sent the command
        time_in = [parseInt(date.getHours(), 10), parseInt(date.getMinutes(), 10), parseInt(date.getSeconds(), 10)];
    }
    loop = 0;
    while(loop < time_in.length){
        //turn each input time from a string to an integer, make sense they are all integers
        if(isNaN(time_in[loop])){
            switch(guild_obj.language){
                case "english":
                    message.channel.send('Unable to determine `' + time_in.join(':') + '`. Try `' + guild_obj.key + 'help report`');
                    break;
            }
            return;
        }
        time_in[loop] = parseInt(time_in[loop], 10);
        loop++;
    }
    if(time_in.length == 2){
        //hour was not provided, determine what hour the boss died in
        if(report_disp[1] == time_in[0]){
            if(report_disp[2] == time_in[1]){
                death_disp = [report_disp[0], report_disp[1], report_disp[2]];
            }else if(report_disp[2] > time_in[1]){
                death_disp = [report_disp[0], report_disp[1], time_in[1]];
            }else if(report_disp[2] < time_in[1]){
                death_disp = [(report_disp[0] - 1), report_disp[1], time_in[1]];
            }
        }else if(report_disp[1] > time_in[0]){
            death_disp = [report_disp[0], time_in[0], time_in[1]];
        }else if(report_disp[1] < time_in[0]){
            death_disp = [report_disp[0] - 1, time_in[0], time_in[1]];
        }
        if(death_disp[0] < 0){
            death_disp[0] = death_disp + 24;
        }
    }else if(time_in.length > 3 || time_in.length == 1){
        //too many or too few input integers
        switch(guild_obj.language){
            case "english":
                message.channel.send('Unable to determine `' + in_Arr[0] + '`. Try `' + guild_obj.key + 'help report`');
                break;
        }
        return;
    }else if(time_in.length == 3){
        death_disp = time_in;
    }
    if(death_disp[0] < 0 || death_disp[0] > 23 || death_disp[1] < 0 || death_disp[1] > 59 || death_disp[2] < 0 || death_disp[2] > 59){
        switch(guild_obj.language){
            case "english":
                message.channel.send('Unable to determine `' + death_disp.join(':') + '`. Try `' + guild_obj.key + 'help report`');
                break;
        }
        return;
    }
    //death time has been determiend. Calculate the death epoch time
    
    var report_ms = 0;
    var death_ms = 0;
    report_ms = (report_disp[0] * 3600000) + (report_disp[1] * 60000) + (report_disp[2] * 1000);
    death_ms = (death_disp[0] * 3600000) + (death_disp[1] * 60000) + (death_disp[2] * 1000);
    
    //calculate time elapsed since the death of the boss in milliseconds
    var elapsed = 0;
    if(report_ms == death_ms){
        elapsed = 0;
    }else if(report_ms > death_ms){
        elapsed = report_ms - death_ms;
    }else{
        elapsed = (86400000 - death_ms) + report_ms;
    }
    //we now have the death epoch
    death_epoch = report_epoch - elapsed;
    var respawn_ms = 0;
    var is_respawnable = false;
    if(boss_obj.Respawn_Time != '0:0:0'){//if the boss has a respawn time
        respawn_ms = (parseInt(boss_obj.Respawn_Time.split(':')[0], 10) * 3600000) + (parseInt(boss_obj.Respawn_Time.split(':')[1], 10) * 60000) + (parseInt(boss_obj.Respawn_Time.split(':')[2], 10) * 1000);
        is_respawnable = true;
    }
    respawn_epoch = death_epoch + respawn_ms;
    var maint_json = JSON.parse(fs.readFileSync('./Monster_Data/Maint.json', 'utf8'));//fetch information about the last maintanence
    if(death_epoch > maint_json.Last_Maint_Start_Epoch && death_epoch < maint_json.Last_Maint_Epoch){//was the boss reported to have died during maint?
        switch(guild_obj.language){
            case "english":
                message.channel.send('Unable to record a boss death that occured during Maintenance. Try `' + guild_obj.key + 'help report`');
                break;
        }
        return;
    }
    var remaining_ms = respawn_ms - elapsed;
    var delay = 0;
    if(death_epoch < (maint_json.Last_Maint_Epoch + respawn_ms)){//if the boss was killed within one cycle of the last maint, add a delay if the boss has a maint delay respawn
        delay = (parseInt(boss_obj.Maint_Delay.split(':')[0], 10) * 3600000) + (parseInt(boss_obj.Maint_Delay.split(':')[1], 10) * 60000) + (parseInt(boss_obj.Maint_Delay.split(':')[2], 10) * 1000);
    }
    remaining_ms = remaining_ms + delay;
    respawn_epoch = respawn_epoch + delay;
    //all times have been calculated (including possible variations with maint)
    //all users have been determined
    
    //pass this information on to other functions to continue
    /*
        Create an object to contain all relevant information about this boss kill
        Pass to Report_Reply to send and update a reply embed with all relevant information
        Pass to Record_Kill to set record this boss kill
        Set up reminders (if necessary)
    */
    if(is_respawnable == false){
        respawn_epoch = null;
        remaining_ms = 0;
    }
    var report_obj = {
        type: "monster",
        lID: null,
        boss: boss_obj.Boss,
        map: boss_obj.Map,
        mID: boss_obj.id,
        server: server,
        death: death_epoch,
        respawn: respawn_epoch,
        report: report_epoch,
        guild: guild_obj.id,
        home_guild: message.guild.id,
        home_channel: message.channel.id,
        home_reply: null,
        author: message.author.id,
        users: users,
        image: boss_obj.Image
    }
    Log_Report(guild_obj, report_obj);
    Report_Reply(message, report_obj, null);
    Report_Score(guild_obj, server, boss_obj.Boss, report_obj.users);
    if(guild_obj.loot_prompt == true && report_obj.users.length > 0){
        loot(message, guild_obj, []);
    }
    if(remaining_ms > 2000){//if greater than 2 seconds, set a respawn reminder
        setTimeout(function(){
            Warning(report_obj, 0);
        }, remaining_ms)
    }
    if(remaining_ms > 600000){//if greater than 10 minutes, set a 5 minute reminder
        setTimeout(function(){
            Warning(report_obj, 1);
        }, (remaining_ms - 300000))
    }
    if(remaining_ms > 21600000){//if greater than 6 hours, set a 1 hour reminder
        setTimeout(function(){
            Warning(report_obj, 2);
        }, (remaining_ms - 3600000))
    }
    if(remaining_ms > 345600000){//if greater than 4 days, set a 1 day reminder
        setTimeout(function(){
            Warning(report_obj, 3);
        }, (remaining_ms - 86400000))
    }
}

function Log_Report(guild_obj, report_obj){
    //called from function report()
    //a boss has been reported, store information from this event in log.json for this guild
    var log_json = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var last_id = null;
    var lID = null;
    if(log_json.Event_Arr.length == 0){
        lID = 'l000001';
    }else{
        last_id = parseInt(log_json.Event_Arr[log_json.Event_Arr.length - 1].id.slice(1), 10);
        lID = (last_id + 1).toString();
        while(lID.length < 6){
            lID = '0' + lID;
        }
        lID = 'l' + lID;
    }
    
    var report_obj_reduced = {//the image link, boss title, boss map, gID, home_guild ID are not needed in the log. Cut them off to save space
        id: lID,
        log_type: "R",
        mID: report_obj.mID,
        server: report_obj.server,
        death: report_obj.death,
        respawn: report_obj.respawn,
        report: report_obj.report,
        users: report_obj.users,
        home_channel: report_obj.home_channel,
        author: report_obj.author,
        loot: []
    }
    log_json.Event_Arr[log_json.Event_Arr.length] = report_obj_reduced;
    fs.writeFileSync('./log/' + guild_obj.id + '/log.json', JSON.stringify(log_json, null, 4), 'utf8');
}

function Report_Score(guild_obj, server, boss_name, uID_Arr){
    //record the increased scores in score files on disc
    var boss_key =  fs.readFileSync('./scores/score_key.txt').toString().split('\n');
    var pos = 0;
    var loop = 0;
    while(loop < boss_key.length){
        if(boss_key[loop] == boss_name){
            pos = loop;
            loop = boss_key.length;
        }
        loop++;
    }
    var guild_file = JSON.parse(fs.readFileSync('./scores/' + guild_obj.id + '/main.json', 'utf8'));
    guild_file.Server_Objects.forEach(Element => {
        if(Element.server == server){
            Element.array[pos]++;
            Element.total++;
        }
    })
    guild_file.total++;
    fs.writeFileSync('./scores/' + guild_obj.id + '/main.json', JSON.stringify(guild_file), 'utf8');
    loop = 0;
    var user_file = null;
    while(loop < uID_Arr.length){
        console.log('record score: ' + pos + ' - ' + uID_Arr[loop]);
        user_file = JSON.parse(fs.readFileSync('./scores/' + guild_obj.id + '/' + uID_Arr[loop] + '.json', 'utf8'));
        user_file.Server_Objects.forEach(Element => {
            if(Element.server == server){
                Element.array[pos]++;
                Element.total++;
            }
        })
        user_file.total++;
        fs.writeFileSync('./scores/' + guild_obj.id + '/' + uID_Arr[loop] + '.json', JSON.stringify(user_file, null, 4), 'utf8');
        loop++;
    }
}

async function Report_Reply(message, report_obj, reply_msg){
    //this function is called from report(), all relevant information has already been determined
    //build a message embed to send to the user
    //if there is an active timer, set a delay and call back to report_reply() to update the timer after a setTimeout
    
    var guild_obj = JSON.parse(fs.readFileSync('./Guild_Data/' + report_obj.guild + '.json', 'utf8'));
    var log_json = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var check = false
    var update_json = false;
    if(report_obj.lID != null){
        log_json.Event_Arr.forEach(Element => {
            if(Element.id == report_obj.lID){
                check = true;
                if(Element.home_reply == null && reply_msg != null){
                    Element.home_reply = reply_msg.id;
                    update_json = true;
                }
            }
        })
        if(check == false){
            reply_msg.delete();
            return;
        }
        if(update_json == true){
            fs.writeFileSync('./log/' + guild_obj.id + '/log.json', JSON.stringify(log_json, null, 4), 'utf8');
        }
    }else{
        log_json.Event_Arr.forEach(Element => {
            if(Element.mID == report_obj.mID && Element.author == report_obj.author && Element.report == report_obj.report){
                report_obj.lID = Element.id;
            }
        })
        
    }
    console.log(report_obj);
    var loop = 0;
    const Reply_Embed = new Discord.MessageEmbed()
        .setTitle(report_obj.boss)
        .setAuthor('Black Raven Report', key.image, key.website)
        .setDescription(report_obj.map)
        .setColor(guild_obj.color);
    var death_date = new Date(report_obj.death);
    var respawn_date = null;
    var respawn_time = [];
    var remaining_ms = null;
    var date = new Date();
    var date_ms = date.getTime();
    if(report_obj.respawn != null){
        respawn_date = new Date(report_obj.respawn);
        respawn_time = [respawn_date.getFullYear(), respawn_date.getMonth(), respawn_date.getDate(), parseInt(respawn_date.getHours(), 10), parseInt(respawn_date.getMinutes(), 10), parseInt(respawn_date.getSeconds(), 10)];
        remaining_ms = report_obj.respawn - date_ms;
    }
    var death_time = [death_date.getFullYear(), death_date.getMonth(), death_date.getDate(), death_date.getHours(), death_date.getMinutes(), death_date.getSeconds()];
    loop = 1;
    while(loop < death_time.length){
        if(death_time[loop] < 10){
            death_time[loop] = '0' + death_time[loop].toString();
        }
        loop++;
    }
    Reply_Embed.addField('**Time of Death**', death_time[2] + '/' + death_time[1] + '/' + death_time[0] + '  ' + death_time[3] + ':' + death_time[4] + ':' + death_time[5]);
    if(respawn_date != null){
        loop = 1
        while(loop < respawn_time.length){
            if(respawn_time[loop] < 10){
                respawn_time[loop] = '0' + respawn_time[loop].toString();
            }
            loop++;
        }
        Reply_Embed.addField('**Respawn Time**', respawn_time[2] + '/' + respawn_time[1] + '/' + respawn_time[0] + '  ' + respawn_time[3] + ':' + respawn_time[4] + ':' + respawn_time[5]);
    }
    if(report_obj.users.length > 0){
        var farmer_tags = [];
        
        guild_obj.User_Objects.forEach(Element => {
            loop = 0;
            while(loop < report_obj.users.length){
                if(report_obj.users[loop] == Element.id){
                    farmer_tags[farmer_tags.length] = client.users.cache.get(Element.discord);
                    loop = report_obj.users.length;
                }
                loop++;
            }
        })
        Reply_Embed.addField('**Killed by**', farmer_tags);
    }
    if(remaining_ms != null){
        var timer = [0,0,0];
        while(remaining_ms > 3599999){
            timer[0]++;
            remaining_ms = remaining_ms - 3600000;
        }
        while(remaining_ms > 59999){
            timer[1]++;
            remaining_ms = remaining_ms - 60000;
        }
        timer[2] = parseInt(remaining_ms/1000, 10);
        if(timer[2] == 59){
            timer[2] = 0;
            timer[1]++;
            if(timer[1] == 60){
                timer[1] = 0;
                timer[0]++;
            }
        }
        if(timer[2] < 0){//correct for negative time
            timer[2] = 0;
        }
        if(timer[1] < 10){
            timer[1] = '0' + timer[1].toString();
        }
        if(timer[2] < 10){
            timer[2] = '0' + timer[2].toString();
        }
        if(timer.join(':') != '0:00:00'){
            Reply_Embed.addField('**Timer**', timer.join(':'));
        }
    }
    if(report_obj.image != null){
        Reply_Embed.setThumbnail(report_obj.image);
    }
    switch(report_obj.server){
        case 'BIGMAMA':
            Reply_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Reply_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Reply_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Reply_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Reply_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Reply_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Reply_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Reply_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Reply_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Reply_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Reply_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Reply_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Reply_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    if(reply_msg == null){
        reply_msg = await message.channel.send(Reply_Embed);
    }else{
        reply_msg.edit(Reply_Embed);
    }
    if(report_obj.respawn != null){
        var plan_edit = report_obj.respawn - date.getTime();
        //plan for the next update, when will it be
        //if you update a message too much discord will start to throttle the bot, so limit the edits to be infrequent
        //if it's a long term boss, try doing an edit once an hour, for the last 30 minutes update it a bit faster
        if(plan_edit > 3600000){
            while(plan_edit > 3599999){
                plan_edit = plan_edit - 3600000;
            }
        }else if(plan_edit > 1800000){
            while(plan_edit > 1799999){
                plan_edit = plan_edit - 1800000;
            }
        }else if(plan_edit > 300000){
            while(plan_edit > 299999){
                plan_edit = plan_edit - 300000;
            }
        }else if(plan_edit > 0){
            while(plan_edit > 59999){
                plan_edit = plan_edit - 60000;
            }
        }else if(plan_edit > -10000){
            plan_edit = 15000;
        }else{
            plan_edit = null;
        }
        if(plan_edit != null){
            setTimeout(function(){
                Report_Reply(message, report_obj, reply_msg);
            }, plan_edit)
        }
    }
}

function Warning(report_obj, path){
    //a warning for a boss spawn
    //inputs are report object containing all information about the boss
    //path is an integer 0, 1, 2, 3
    //0 = now, 1 = 5 minute warning, 2 = 1 hour warning, 3 = 1 day warning
    
    //NOTE TO SELF LATER - ADD A CHECK TO SEE IF THE BOSS SPAWN IS STILL HAPPENING
    var guild_obj = JSON.parse(fs.readFileSync('./Guild_Data/' + report_obj.guild + '.json', 'utf8'));
    var body_reply = null;
    switch(guild_obj.language){
        case "english":
            if(path == 0){
                body_reply = 'has respawned!';
            }else if(path == 1){
                body_reply = 'is respawning in 5 minutes!';
            }else if(path == 2){
                body_reply = 'is respawning in 1 hour!';
            }else if(path == 3){
                body_reply = 'is respawning in 1 day!';
            }
            break;
    }
    //for bosses that are on more than one map, add which map the boss is spawning on
    var notif_users = [];
    var notif_obj = null;
    var pos = parseInt(report_obj.mID.slice(1), 10);
    console.log('position: ' + pos)
    guild_obj.User_Objects.forEach(Element => {//check each user in the guild to see if they are signed up for notifications
        notif_obj = null;
        notif_obj = JSON.parse(fs.readFileSync('./notifs/' + report_obj.guild + '/' + Element.id + '.json', 'utf8'));
        switch(report_obj.server){
            case "BIGMAMA":
                if(notif_obj.notifs[pos].notify_bigmama == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "DEVILANG":
                if(notif_obj.notifs[pos].notify_devilang == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "WADANGKA":
                if(notif_obj.notifs[pos].notify_wadangka == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "CALIGO":
                if(notif_obj.notifs[pos].notify_caligo == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "TURTLEZ":
                if(notif_obj.notifs[pos].notify_turtlez == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "NEWSTAR":
                if(notif_obj.notifs[pos].notify_newstar == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "DARLENE":
                if(notif_obj.notifs[pos].notify_darlene == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "BARSLAF":
                if(notif_obj.notifs[pos].notify_barslaf == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "모아임":
                if(notif_obj.notifs[pos].notify_모아임 == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "시리온":
                if(notif_obj.notifs[pos].notify_시리온 == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "파로스":
                if(notif_obj.notifs[pos].notify_파로스 == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "헤이블":
                if(notif_obj.notifs[pos].notify_헤이블 == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
            case "クイー":
                if(notif_obj.notifs[pos].notify_クイー == true){
                    notif_users[notif_users.length] = Element.discord;
                }
                break;
        }
    })
    console.log(notif_users)
    const guild = client.guilds.cache.get(report_obj.home_guild);
    const channel = guild.channels.cache.get(report_obj.home_channel);
    var notif_profiles = [];
    notif_users.forEach(Element => {
        notif_profiles[notif_profiles.length] = guild.members.cache.get(Element);
    })
    const Warning_Embed = new Discord.MessageEmbed()
        .setTitle(report_obj.boss)
        .addField(report_obj.boss, body_reply)
        .setColor(guild_obj.color)
        .setAuthor('Respawn Reminder', key.image, key.website);
    var map_dir = fs.readFileSync('./menus/maps.txt').toString().split('\n');
    var map_check = false;
    map_dir.forEach(Element => {
        if(Element.split('|')[1] == report_obj.map){
            if(Element.split('|')[0] != "null"){
                Warning_Embed.setDescription(Element.split('|').join(' '));
                map_check = true;
            }
        }
    })
    if(map_check == false){
        Warning_Embed.setDescription(report_obj.map);
    }
    switch(report_obj.server){
        case 'BIGMAMA':
            Warning_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Warning_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Warning_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Warning_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Warning_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Warning_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Warning_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Warning_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Warning_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Warning_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Warning_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Warning_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Warning_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    if(report_obj.image != null){
        Warning_Embed.setThumbnail(report_obj.image);
    }
    console.log('notif length ' + notif_profiles.length);
    if(notif_profiles.length == 0){
        channel.send(Warning_Embed);
    }else{
        channel.send(notif_profiles.join(', '), Warning_Embed);
    }
}

function loot(message, guild_obj, in_Arr){
    //a user is reporting loot from a boss or dungeon boss
    //determine which boss entry from log they are trying to report for, then figure out what they looted
    //after those are determined, record the loot data in log.json

    //determine who has called the loot function
    var user = null;
    var server = null;
    var loop = 0;
    guild_obj.User_Objects.forEach(Element => {
        if(Element.discord == message.author.id){
            if(Element.alt == true){
                user = Element.main;
            }else{
                user = Element.id;
            }
        }
    })
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            server = Element.Server;
        }
    })
    if(server == null){
        switch(guild_obj.language){
            case 'english':
                message.channel.send('This command can only be used in report-type channels. Try `' + guild_obj.key + 'help loot`');
                break;
        }
        return;
    }
    if(user == null){
        NewUser(message, guild_obj, message.author.id);
        switch(guild_obj.language){
            case 'english':
                message.channel.send('User `' + message.author.user.username + '` has no kills recorded. Try `' + guild_obj.key + 'help loot` or `' + guild_obj.key + 'help report`');
                break;
        }
        return;
    }
    var log = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var report_obj = null;
    if(in_Arr.length == 0){//user just wants to report loot for their most recent kill
        log.Event_Arr.forEach(Element => {
            if(Element.log_type == "R"){
                if(Element.users.includes(user) && Element.server == server){
                    report_obj = Element;
                }
            }
        })
        if(report_obj == null){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('User `' + message.author.username + '` has no kills recorded on **' + server + '**. Try `' + guild_obj.key + 'help loot` or `' + guild_obj.key + 'help report`');
                    break;
            }
            return;
        }else{
            if(report_obj.loot.length != 0){
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send('Loot has already been reported for this boss. Try `' + guild_obj.key + 'help loot` or `' + guild_obj.key + 'help undo`');
                        break;
                }
                return;
            }else{
                Loot_Reply(message, guild_obj, report_obj);
            }
        }
    }else if(in_Arr.length == 1 && in_Arr[0] == 'menu' || in_Arr.length == 1 && in_Arr[0] == 'list'){
        Loot_Select_Map(message, guild_obj, user, server);
    }else if(in_Arr.length == 1 && in_Arr[0] == 'history' || in_Arr.length == 1 && in_Arr[0] == 'old'){

    }else{
        var loot_menu = JSON.parse(fs.readFileSync('./menus/loot.json', 'utf8'));
        var select = null;
        loot_menu.Monster_Select.forEach(Element => {
            if(Element.Shortcuts.includes(in_Arr.join('')) || Element.mID == in_Arr.join('')){
                select = Element;
            }
        })
        if(select == null){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_Arr.join(' ') + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            return;
        }
        console.log(select)
        var boss_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + select.mID + '.json', 'utf8'));
        if(boss_obj.is_Boss == false){
            var date = new Date();
            var date_ms = date.getTime();
            var report_obj = {
                id: null,
                log_type: "R",
                mID: select.mID,
                server: server,
                death: date_ms,
                respawn: null,
                report: date_ms,
                users: [user],
                home_channel: message.channel.id,
                author: message.author.id,
                loot: [],
                home_reply: null
            }
            Loot_Reply(message, guild_obj, report_obj);
        }
    }
}

async function Loot_Select_Map(message, guild_obj, user, server){
    var maps = fs.readFileSync('./menus/maps.txt').toString().split('\n');
    var map_disp = [];
    var server = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            server = Element.Server;
        }
    })
    if(server == null){
        return;
    }
    maps.forEach(Element => {
        if(Element.split('|')[0] == 'null'){
            map_disp[map_disp.length] = (map_disp.length + 1).toString() + '. ' + Element.split('|')[1];
        }else{
            map_disp[map_disp.length] = (map_disp.length + 1).toString() + '. ' + Element.split('|').join(' ');
        }
    })
    var map_disp_divided = [];
    map_disp.forEach(Element => {
        if(map_disp_divided.length == 0){
            map_disp_divided[0] = Element;
        }else if(map_disp_divided[map_disp_divided.length - 1].length + Element.length < 1000){
            map_disp_divided[map_disp_divided.length - 1] = map_disp_divided[map_disp_divided.length - 1] + '\n' + Element;
        }else{
            map_disp_divided[map_disp_divided.length] = Element;
        }
    })
    const Loot_Embed = new Discord.MessageEmbed()
        .setAuthor('Loot Menu', key.image, key.website)
        .setColor(guild_obj.color)
        .addField('**Select one of the following**', map_disp_divided[0])
        .setFooter('Respond with the number cooresponding to the map');
    var loop = 1;
    while(loop < map_disp_divided.length){
        Loot_Embed.addField('Continued...', map_disp_divided[loop]);
        loop++;
    }
    var map_menu = await message.channel.send(Loot_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            map_menu.delete();
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input.split(' ').length != 1){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            map_menu.delete();
            return;
        }
        if(isNaN(input) || parseInt(input, 10) < 1 || parseInt(input, 10) > map_menu.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            map_menu.delete();
            return;
        }
        map_menu.delete();
        collected.first().delete();
        console.log()
        var map_select = maps[parseInt(input, 10) - 1].split('|')[1];
        Loot_Select_Monster(message, guild_obj, user, server, map_select)
        
    })
}

async function Loot_Select_Monster(message, guild_obj, user, server, map_select){
    var loot_monster_dir = JSON.parse(fs.readFileSync('./menus/loot.json', 'utf8'));
    var monster_menu = [];
    console.log("map selected: " + map_select)
    loot_monster_dir.Monster_Select.forEach(Element => {
        if(Element.Map == map_select){
            monster_menu[monster_menu.length] = JSON.parse(fs.readFileSync('./Monster_Data/' + Element.mID + '.json', 'utf8'));
        }
    })
    console.log(monster_menu);
    var boss_disp = [];
    monster_menu.forEach(Element => {
        if(Element.Emoji != null){
            boss_disp[boss_disp.length] = (boss_disp.length + 1).toString() + '. ' + Element.Emoji + ' ' + Element.Boss;
        }else{
            boss_disp[boss_disp.length] = (boss_disp.length + 1).toString() + '. ' + Element.Boss;
        }
    })
    const boss_select_Embed = new Discord.MessageEmbed()
        .setAuthor("Loot Menu", key.image, key.website)
        .addField('**Select One of the Following**', boss_disp.join('\n'))
        .setColor(guild_obj.color)
        .setFooter('Respond with the number cooresponding to the monster');
    var boss_select_rply = await message.channel.send(boss_select_Embed);
    const filter = m => m.content.author == message.channel.author;
    const boss_collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    boss_collector.on('end', collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            boss_select_rply.delete();
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input.split(' ').length != 1){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            boss_select_rply.delete();
            return;
        }
        if(isNaN(input) || parseInt(input, 10) < 1 || parseInt(input, 10) > monster_menu.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            boss_select_rply.delete();
            return;
        }
        var date = new Date();
        var date_ms = date.getTime();
        boss_select_rply.delete();
        collected.first().delete();
        var pos = parseInt(input, 10) - 1;
        if(monster_menu[pos].is_Boss == false){
            var report_obj = {
                id: null,
                log_type: "R",
                mID: monster_menu[pos].id,
                server: server,
                death: date_ms,
                respawn: null,
                report: date_ms,
                users: [user],
                home_channel: message.channel.id,
                author: message.author.id,
                loot: [],
                home_reply: null
            }
            Loot_Reply(message, guild_obj, report_obj);
        }else{
            var log = null;
        }
    })
}

async function Loot_Reply(message, guild_obj, report_obj){
    console.log(report_obj);
    //the report object from the log json file has been found, build a embed and create a message collector for the user to reply with
    var boss_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + report_obj.mID + '.json', 'utf8'));
    var death_time = new Date(report_obj.death);
    var death_date = [death_time.getFullYear(), death_time.getMonth(), death_time.getDate(), death_time.getHours(), death_time.getMinutes(), death_time.getSeconds()]
    var loop = 0;
    while(loop < death_date.length){
        if(death_date[loop] < 10){
            death_date[loop] = '0' + death_date[loop].toString();
        }
        loop++;
    }
    var user_profiles = [];
    var user_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    report_obj.users.forEach(Element => {
        user_profiles[user_profiles.length] = client.users.cache.get(user_dir.Member_Objects[parseInt(Element.slice(1), 10) - 1].discord);
    })
    const Loot_Embed = new Discord.MessageEmbed()
        .setAuthor('Loot Menu', key.image, key.website)
        .setTitle('**' + boss_obj.Boss + '**')
        .setDescription(boss_obj.Map)
        .setColor(guild_obj.color)
        .addField('**Killed at**', death_date[2] + '/' + death_date[1] + '/' + death_date[0] + '  ' + death_date[3] + ':' + death_date[4] + ':' + death_date[5])
        .addField('**Killed by**', user_profiles.join(' '));
    if(boss_obj.Image != null){
        Loot_Embed.setThumbnail(boss_obj.Image);
    }
    switch(report_obj.server){
        case 'BIGMAMA':
            Loot_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Loot_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Loot_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Loot_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Loot_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Loot_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Loot_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Loot_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Loot_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Loot_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Loot_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Loot_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Loot_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
    var loot_menu = [];
    boss_obj.Loot_Table.forEach(Element => {
        if(Element.split(' ').length > 1){
            if(Element.split(' ')[1].includes('-')){
                loop = parseInt(Element.split(' ')[1].split('-')[0], 10)
                while(loop < (parseInt(Element.split(' ')[1].split('-')[1], 10) + 1)){
                    loot_menu[loot_menu.length] = Element.split(' ')[0] + '(' + loop.toString() + ')';
                }
            }else{
                loot_menu[loot_menu.length] = Element
            }
        }else if(Element == 'i255'){//always have 1 or 2 be an option for pet crystals (i255 is the code for pet crystal)
            loot_menu[loot_menu.length] = 'i255 (1)';
            loot_menu[loot_menu.length] = 'i255 (2)';
        }else{
            loot_menu[loot_menu.length] = Element;
        }
    })
    loop = 0;
    var loot_display = [];
    var equip_file = [];
    var item_file = [];
    while(loop < loot_menu.length){
        if(loot_menu[loop].startsWith('i')){
            item_file = item_dir.Item_Objects[parseInt(loot_menu[loop].split(' ')[0].slice(1), 10) - 1];
            if(item_file.Emoji != null){
                loot_display[loot_display.length] = (loop + 1).toString() + '. ' + item_file.Emoji + ' ' + item_file.Title;
            }else{
                loot_display[loot_display.length] = (loop + 1).toString() + '. ' + item_file.Title;
            }
            if(loot_menu[loop].split(' ').length == 2){
                loot_display[loot_display.length - 1] = loot_display[loot_display.length - 1] + ' ' + loot_menu[loop].split(' ')[1];
            }
        }else if(loot_menu[loop].startsWith('e')){
            equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + loot_menu[loop].split(' ')[0] + '.json', 'utf8'));
            if(equip_file.Emoji != null){
                loot_display[loot_display.length] = (loop + 1).toString() + '. ' + equip_file.Emoji + ' ' + equip_file.Title;
            }else{
                loot_display[loot_display.length] = (loop + 1).toString() + '. ' + equip_file.Title;
            }
        }
        loop++;
    }
    Loot_Embed
        .addField('**Tracked Loot**', loot_display.join('\n'));
    var loot_reply = await message.channel.send(Loot_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help loot`');
            loot_reply.delete();
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel' || in_str[0] == 'none' || in_str[0] == 'nothing'){
            loot_reply.delete();
            collected.first().delete();
            return;
        }
        var looted_items = [];
        var pos = null;
        var gold_reported = false;
        loop = 0;
        while(loop < in_str.length){
            if(boss_obj.is_Boss == true && in_str[loop].includes('g') == true){
                if(in_str[loop].startsWith('g') && in_str[loop].length > 1){
                    if(gold_reported == true){
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send('Can not report duplicate loot `' + in_str[loop] + '`. Try `' + guild_obj.key + 'help loot`');
                                break;
                        }
                        loot_reply.delete();
                        return;
                    }
                    looted_items[looted_items.length] = 'Gold (' + parseInt(in_str[loop].slice(1), 10) + ')';
                    gold_reported = true;
                }else if(in_str[loop] == 'g'){
                    if(gold_reported == true){
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send('Can not report duplicate loot `' + in_str[loop] + '`. Try `' + guild_obj.key + 'help loot`');
                                break;
                        }
                        loot_reply.delete();
                        return;
                    }
                    looted_items[looted_items.length] = 'Gold';
                    gold_reported = true;
                }else{
                    if(gold_reported == true){
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send('Can not report duplicate loot `' + in_str[loop] + '`. Try `' + guild_obj.key + 'help loot`');
                                break;
                        }
                        loot_reply.delete();
                        return;
                    }
                    looted_items[looted_items.length] = 'Gold (' + parseInt(in_str[loop].slice(0, -1), 10) + ')';
                    gold_reported = true;
                }
                if(looted_items[looted_items.length - 1] != "Gold"){
                    if(isNaN(looted_items[looted_items.length - 1].split('(')[1].split(')')[0])){
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send('Unable to determine `' + in_str[loop] + '`. Try `' + guild_obj.key + 'help loot`');
                                break;
                        }
                        loot_reply.delete();
                        return;
                    }
                }
            }
            if(in_str[loop].includes('g')){
                
            }else{
                pos = parseInt(in_str[loop], 10) - 1;
                if(isNaN(pos) || pos < 0 || pos > (loot_menu.length - 1)){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send('Unable to determine `' + in_str[loop] + '`. Try `' + guild_obj.key + 'help loot`');
                            break;
                    }
                    loot_reply.delete();
                    return;
                }
                console.log(looted_items)
                if(looted_items.includes(loot_menu[pos])){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send('Can not report duplicate loot `' + loot_menu[pos] + '`. Try `' + guild_obj.key + 'help loot`');
                            break;
                    }
                    loot_reply.delete();
                    return;
                }
                looted_items[looted_items.length] = loot_menu[pos];
            }
            loop++;
        }
        var is_varied = false
        looted_items.forEach(Element => {
            if(Element.startsWith('e')){
                if(JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(' ')[0] + '.json', 'utf8')).is_Static == false){
                    is_varied = true;
                }
            }
        })
        if(is_varied == false){
            loot_reply.delete();
            collected.first().delete();
            report_obj.loot = looted_items;
            Log_Loot(message, guild_obj, report_obj, boss_obj);
        }else{
            loot_reply.delete();
            collected.first().delete();
            Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, 0);
        }
    })
}

function Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, pos){
    //A followup is required due to a looted item having variable loot
    var equip_file = null;
    if(looted_items[pos].startsWith('e')){
        equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + looted_items[pos].split(' ')[0] + '.json'));
    }
    if(equip_file.is_Static == false){
        if(equip_file.Stat_Ranges.length > 0){
            Range_Loot_Resolve(message, guild_obj, report_obj, boss_obj, looted_items, pos);
        }else{
            Veriety_Loot_Resolve(message, guild_obj, report_obj, boss_obj, looted_items, pos);
        }
    }else{
        report_obj.loot = looted_items;
        Log_Loot(message, guild_obj, report_obj, boss_obj);
    }
}

async function Veriety_Loot_Resolve(message, guild_obj, report_obj, boss_obj, looted_items, pos){
    //part of Resolve_Loot if the needed info is based on a verity type
    var equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + looted_items[pos].split(' ')[0] + '.json', 'utf8'));
    var loot_disp = [];
    const Loot_Embed = new Discord.MessageEmbed()
        .setTitle('**' + equip_file.Title + '**')
        .setAuthor('Loot Menu', key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription('Looted from ' + report_obj.boss);
    if(equip_file.image != null){
        Loot_Embed.setImage(equip_file.image);
    }
    switch(report_obj.server){
        case 'BIGMAMA':
            Loot_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Loot_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Loot_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Loot_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Loot_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Loot_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Loot_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Loot_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Loot_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Loot_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Loot_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Loot_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Loot_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    equip_file.Verieties.forEach(Element => {
        loot_disp[loot_disp.length] = (loot_disp.length + 1).toString() + '. ' + Element;
    })
    Loot_Embed.addField('Which kind of ' + equip_file.Title + ' did you get?', loot_disp);
    var loot_reply = await message.channel.send(Loot_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 }, );
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help loot`');
            loot_reply.delete();
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            loot_reply.delete();
            collected.first().delete();
            return;
        }
        if(in_str.length != 1 || isNaN(in_str[0]) == true){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Can not determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            loot_reply.delete();
            return;
        }
        var selection = parseInt(in_str[0], 10) - 1;
        if(selection < 0 || selection > loot_disp.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Can not etermine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            loot_reply.delete();
            return;
        }
        looted_items[pos] = looted_items[pos] + ' [' + selection.toString() + ']';
        pos++;
        loot_reply.delete();
        collected.first().delete();
        if(pos == looted_items.length){
            report_obj.loot = looted_items;
            Log_Loot(message, guild_obj, report_obj, boss_obj);
        }else{
            Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, pos);
        }
    })
}

async function Range_Loot_Resolve(message, guild_obj, report_obj, boss_obj, looted_items, pos){
    //part of Resolve_Loot if the needed info is based on a verity type
    var equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + looted_items[pos].split(' ')[0] + '.json', 'utf8'));
    var loot_disp = [];
    var loop = 0;
    const Loot_Embed = new Discord.MessageEmbed()
        .setTitle('**' + equip_file.Title + '**')
        .setAuthor('Loot Menu', key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription('Looted from ' + boss_obj.Boss);
    if(equip_file.image != null){
        Loot_Embed.setImage(equip_file.image);
    }
    switch(report_obj.server){
        case 'BIGMAMA':
            Loot_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Loot_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Loot_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Loot_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Loot_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Loot_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Loot_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Loot_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Loot_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Loot_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Loot_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Loot_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Loot_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    equip_file.Stat_Ranges.forEach(Element => {
        loot_disp[loot_disp.length] = Element;
    })
    Loot_Embed.addField('What stats does the ' + equip_file.Title + ' have?', loot_disp.join('\n'));
    var loot_reply = await message.channel.send(Loot_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 }, );
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help loot`');
            loot_reply.delete();
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            loot_reply.delete();
            collected.first().delete();
            return;
        }
        if(in_str.length != equip_file.Stat_Ranges.length){
            console.log('lengths dont match')
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Can not etermine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            loot_reply.delete();
            return;
        }
        loop = 0;
        while(loop < in_str.length){
            if(isNaN(in_str[loop]) || parseInt(in_str[loop], 10) < 0){
                console.log("cant be less than zero or a non-integer");
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send('Can not etermine `' + in_str[loop] + '`. Try `' + guild_obj.key + 'help loot`');
                        break;
                }
                loot_reply.delete();
                return;
            }
            in_str[loop] = parseInt(in_str[loop], 10);
            loop++;
        }
        looted_items[pos] = looted_items + ' [' + in_str.join(',') + ']';
        pos++;
        loot_reply.delete();
        collected.first().delete();
        if(pos == looted_items.length){
            report_obj.loot = looted_items;
            Log_Loot(message, guild_obj, report_obj, boss_obj);
        }else{
            Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, pos);
        }
    })
}

function Log_Loot(message, guild_obj, report_obj, boss_obj){
    
    //loot has been determined. record the loot in log.json and create/send a reply embed
    console.log('arriving at log_loot')
    console.log(report_obj)
    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
    //var equip_dir = JSON.parse(fs.readFileSync('./Equipment_Data/equipment.json', 'utf8'));
    var loot_disp = [];
    var loop = 0;
    const Loot_Embed = new Discord.MessageEmbed()
        .setAuthor('Loot Report', key.image, key.website)
        .setTitle('**' + boss_obj.Boss + '**')
        .setDescription(boss_obj.Map)
        .setColor(guild_obj.color)
    if(boss_obj.Image != null){
        Loot_Embed.setThumbnail(boss_obj.Image);
    }
    switch(report_obj.server){
        case 'BIGMAMA':
            Loot_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Loot_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Loot_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Loot_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Loot_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Loot_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Loot_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Loot_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Loot_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Loot_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Loot_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Loot_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Loot_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    report_obj.loot.forEach(Element => {//want the gold to be at the top of the list
        if(Element.split(' ')[0] == 'Gold'){
            loot_disp[loot_disp.length] = "<:Gold:834876053029126144> " + Element;
        }
    })
    var equip_file = null;
    var item_file = null;
    report_obj.loot.forEach(Element => {
        if(Element.startsWith('i')){
            item_file = item_dir.Item_Objects[parseInt(Element.slice(1), 10) - 1];
            if(item_file.Emoji != null){
                loot_disp[loot_disp.length] = item_file.Emoji + ' ' + item_file.Title;
            }else{
                loot_disp[loot_disp.length] = item_file.Title;
            }
        }else if(Element.startsWith('e')){
            equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split(' ')[0] + '.json', 'utf8'));
            if(equip_file.is_Static == true){
                loot_disp[loot_disp.length] = equip_file.Title;
            }else if(equip_file.Verieties.length > 0){
                loot_disp[loot_disp.length] = equip_file.Title + ' (' + equip_file.Verieties[parseInt(Element.split(' ')[1].slice(1, -1), 10)] + ')';
            }else{
                console.log(Element)
                console.log(equip_file)
                loot_disp[loot_disp.length] = equip_file.Title + ' (' + Element.split(',')[0].split('[')[1].split(']')[0] + ' ' + equip_file.Stat_Ranges[0];
                loop = 1;
                while(loop < equip_file.Stat_Ranges.length){
                    loot_disp[loot_disp.length - 1] = loot_disp[loot_disp.length - 1] + ', ' + Element.split(',')[loop].split(']')[0] + ' ' + equip_file.Stat_Ranges[loop];
                    loop++;
                }
                loot_disp[loot_disp.length - 1] = loot_disp[loot_disp.length - 1] + ')';
            }
            if(equip_file.Emoji != null){
                loot_disp[loot_disp.length - 1] = equip_file.Emoji + ' ' + loot_disp[loot_disp.length - 1];
            }
        }
    })
    Loot_Embed.addField('**Loot**', loot_disp.join('\n'));
    var log_json = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    loop = 0;
    var check = false;
    while(loop < log_json.Event_Arr.length){
        if(log_json.Event_Arr[loop].id == report_obj.id){
            check = true;
            log_json.Event_Arr[loop] = report_obj;
            loop = log_json.Event_Arr.length;
        }
        loop++;
    }
    
    if(check == false && boss_obj.is_Boss == true){
        switch(guild_obj.language){
            case 'english':
                message.channel.send('Error writing file to disc. :/');
                break;
        }
        return;
    }
    var lID = null;
    if(log_json.Event_Arr.length == 0){
        lID = "l000001";
    }else{
        var last_id = parseInt(log_json.Event_Arr[log_json.Event_Arr.length - 1].id.slice(1), 10);
        lID = (last_id + 1).toString();
        while(lID.length < 6){
            lID = '0' + lID;
        }
        lID = 'l' + lID;
    }
    
    var now_ms = new Date().getTime();
    var loot_file = {
        id: lID,
        log_type: "L",
        mID: report_obj.mID,
        server: report_obj.server,
        loot: report_obj.loot,
        users: report_obj.users,
        report: now_ms,
        home_channel: message.channel.id,
        author: message.author.id,
        anchor: report_obj.id
    }
    log_json.Event_Arr[log_json.Event_Arr.length] = loot_file;
    fs.writeFileSync('./log/' + guild_obj.id + '/log.json', JSON.stringify(log_json, null, 4), 'utf8');
    message.channel.send(Loot_Embed);
    console.log(loot_file)
}

function Punch(message, guild_obj, in_Arr, path){
    //a user wants notifications turned on
    //determine which user this command is meant for
    //determine which server this command is meant
    //determine which boss(s) they want notifications for
    //update their file
    
    //determine server
    var server = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            server = Element.Server;
        }
    })
    //determine the users
    var users = [];
    var users_disp = [];
    var loop = null;
    var inloop = null;
    in_Arr.forEach(Element => {
        loop = 0;
        while(loop < guild_obj.User_Objects.length){
            if(guild_obj.User_Objects[loop].discord == Element.slice(3,-1) || guild_obj.User_Objects[loop].discord == Element.slice(2,-1)){
                users[users.length] = guild_obj.User_Objects[loop].id;
                users_disp[users_disp.length] = guild_obj.User_Objects[loop].name;
                loop = guild_obj.User_Objects.length;
            }
            loop++;
        }
    })
    var filter_in_Arr = [];//filter out the username tags now that users have been determined
    in_Arr.forEach(Element => {
        if(Element.startsWith('<@') == false){
            filter_in_Arr[filter_in_Arr.length] = Element;
        }
    })
    in_Arr = [];
    in_Arr = filter_in_Arr;
    if(in_Arr.length == 0){
        switch(guild_obj.language){
            case "english":
                message.channel.send('Must input bosses and/or maps. Try `' + guild_obj.key + 'help pin`');
                break;
        }
        return;
    }
    if(users.length == 0){
        loop = 0;
        while(loop < guild_obj.User_Objects.length){
            if(guild_obj.User_Objects[loop].discord == message.author.id){
                users[0] = guild_obj.User_Objects[loop].id;
                users_disp[0] = guild_obj.User_Objects[loop].name;
                loop = guild_obj.User_Objects.length;
            }
            loop++;
        }
    }
    //users have been determined
    //move on to boss determine
    var mID_Arr = [];
    var map_Arr = [];
    var boss_Arr = [];
    var mID_map_Arr = [];
    var disp_Arr = [];
    var menu = JSON.parse(fs.readFileSync('./menus/notif.json', 'utf8'));
    var check = null;
    var err_Arr = [];
    in_Arr.forEach(Element => {
        check = false;
        loop = 0;
        while(loop < menu.Notif_Objects.length){
            inloop = 0;
            while(inloop < menu.Notif_Objects[loop].shortcuts.length){
                if(Element == menu.Notif_Objects[loop].shortcuts[inloop]){
                    check = true;
                    if(menu.Notif_Objects[loop].isMap == false){
                        boss_Arr[boss_Arr.length] = menu.Notif_Objects[loop];
                    }else{
                        map_Arr[map_Arr.length] = menu.Notif_Objects[loop];
                    }
                }
                inloop++;
            }
            loop++;
        }
        if(check == false){
            err_Arr[err_Arr.length] = Element;
        }
    })
    if(err_Arr.length > 0){
        switch(guild_obj.language){
            case "english": 
                message.channel.send('Unable to determine input(s) `' + err_Arr.join(',') + '`. Try `' + guild_obj.key + 'help pin`');
                break;
        }
    }
    if(boss_Arr.length == 0 && map_Arr.length == 0){
        return;
    }
    //this is a bit poorly written, trying to make it impossible to duplicate punch in
    map_Arr.forEach(Element => {
        if(Element.Title == 'Lighthouse Dungeon' && disp_Arr.includes("Lighthosue Dungeon") == false){
            Element.mIDs.forEach(Element => {
                mID_Arr[mID_Arr.length] = Element;
            })
            disp_Arr[disp_Arr.length] = "Lighthouse Dungeon";
        }
        if(Element.Title == 'Sky Castle' && disp_Arr.includes("Sky Castle") == false){
            Element.mIDs.forEach(Element => {
                mID_Arr[mID_Arr.length] = Element;
            })
            disp_Arr[disp_Arr.length] = "Sky Castle";
        }
        if(Element.Title == 'Islot' && disp_Arr.includes("Sky Castle") == false){
            Element.mIDs.forEach(Element => {
                mID_Arr[mID_Arr.length] = Element;
            })
            disp_Arr[disp_Arr.length] = "Islot";
        }

    })
    map_Arr.forEach(Element => {
        if(Element.Title == 'Lighthosue Dungeon' || Element.Title == 'Sky Castle' || Element.Title == 'Islot'){
            //this has already been done
        }else{
            //go through to make sure there are no duplicates (like sky castle + eastern sky)
            if(Element.Title == "Lighthouse Dungeon 1F" || Element.Title == "Lighthouse Dungeon 2F" || Element.Title == "Lighthouse Dungeon 3F" || Element.Title == "Lighthouse Dungeon 4F" || Element.Title == "Lighthouse Dungeon 5F"){
                if(disp_Arr.includes("Lighthouse Dungeon") == false && disp_Arr.includes(Element.Title) == false){
                    Element.mIDs.forEach(Element => {
                        mID_Arr[mID_Arr.length] = Element;
                    })
                    disp_Arr[disp_Arr.length] = Element.Title;
                }
            }else if(Element.Title == "Ancient Palace" || Element.Title == "Western Sky Castle" || Element.Title == "Eastern Sky Castle" || Element.Title == "Stone Fortress" || Element.Title == "Unknown Maze" || Element.Title == "Fallen Temple"){
                if(disp_Arr.includes("Sky Castle") == false && disp_Arr.includes(Element.Title) == false){
                    Element.mIDs.forEach(Element => {
                        mID_Arr[mID_Arr.length] = Element;
                    })
                    disp_Arr[disp_Arr.length] = Element.Title;
                }
            }else if(Element.Title == "Islot's Lab" || Element.Title == "Islot's Temple"){
                if(disp_Arr.includes("Islot") == false && disp_Arr.includes(Element.Title) == false){
                    Element.mIDs.forEach(Element => {
                        mID_Arr[mID_Arr.length] = Element;
                    })
                    disp_Arr[disp_Arr.length] = Element.Title;
                }
            }else{
                if(disp_Arr.includes(Element.Title) == false){
                    Element.mIDs.forEach(Element => {
                        mID_Arr[mID_Arr.length] = Element;
                    })
                    disp_Arr[disp_Arr.length] = Element.Title;
                }
            }
        }
    })
    boss_Arr.forEach(Element => {
        check = false;
        //make sure not to add a boss that's already on the list
        //some bosses here still have multiple mIDs (bulldozer & hellhound for example)
        Element.mIDs.forEach(Element => {
            if(mID_Arr.includes(Element) == false){
                mID_Arr[mID_Arr.length] = Element;
                check = true;
            }
        })
        if(check == true){
            disp_Arr[disp_Arr.length] = Element.Title;
        }
    })
    if(disp_Arr.includes("All Bosses") && disp_Arr.length > 1){//correct for any mistake I just made
        if(disp_Arr.includes('Battlefield') && disp_Arr.includes('Siege')){
            disp_Arr = ["All Bosses", "Battlefield", "Siege"];
        }else if(disp_Arr.includes("Battlefield")){
            disp_Arr = ["All Bosses", "Battlefield"];
        }else if(disp_Arr.includes("Siege")){
            disp_Arr = ["All Bosses", "Siege"];
        }else{
            disp_Arr = ["All Bosses"];
        }
    }
    if(server == null){
        if(disp_Arr.includes("Battlefield") == false && disp_Arr.includes("Siege") == false){
            switch(guild_obj.language){
                case 'english': 
                    message.channel.send('Please use a report-type channel to sign in & our for boss notifications');
                    break;
            }
            return;
        }else if(disp_Arr.includes("Battlefield") && disp_Arr.includes("Siege")){
            disp_Arr = ["Battlefield", "Siege"];
        }else if(disp_Arr.includes("Battlefield")){
            disp_Arr = ["Battlefield"];
        }else{
            disp_Arr = ["Siege"];
        }
    }
    const Pin_Embed = new Discord.MessageEmbed()
        .setAuthor('Notifications On', key.image, key.website)
        .setColor(guild_obj.color);
    var user_profiles = [];
    var users_json = JSON.parse(fs.readFileSync('./User_Data/users.json'));
    users.forEach(Element => {
        user_profiles[user_profiles.length] = client.users.cache.get(users_json.Member_Objects[parseInt(Element.slice(1), 10) - 1].discord)
    })
    Pin_Embed.addField('Users', user_profiles);
    if(path == true){
        Pin_Embed.addField('Signed in to', disp_Arr.join('\n'));
    }else{
        Pin_Embed.setAuthor('Notifications Off', key.image, key.website);
        Pin_Embed.addField('Signed out of', disp_Arr.join('\n'));
    }
    switch(server){
        case 'BIGMAMA':
            Pin_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Pin_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Pin_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Pin_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Pin_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Pin_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Pin_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Pin_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Pin_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Pin_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Pin_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Pin_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Pin_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    message.channel.send(Pin_Embed);
    var notif_file = null;
    //if path == true, it's punch in
    //if path == false, it's punch out
    console.log(mID_Arr, users)
    users.forEach(Element => {
        notif_file = JSON.parse(fs.readFileSync('./notifs/' + guild_obj.id + '/' + Element + '.json'));
        mID_Arr.forEach(Element => {
            if(Element == 'battlefield'){
                notif_file.notifs[0].notify_battlefield = path;
            }else if(Element == 'siege'){
                notif_file.notifs[0].notify_siege = path;
            }else{
                switch(server){
                    case 'BIGMAMA':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_bigmama = path;
                        break;
                    case 'DEVILANG':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_devilang = path;
                        break;
                    case 'WADANGKA':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_wadangka = path;
                        break;
                    case 'CALIGO':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_caligo = path;
                        break;
                    case 'TURTLEZ':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_turtlez = path;
                        break;
                    case 'NEWSTAR':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_newstar = path;
                        break;
                    case 'DARLENE':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_darlene = path;
                        break;
                    case 'BARSLAF':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_barslaf = path;
                        break;
                    case '모아임':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_모아임 = path;
                        break;
                    case '시리온':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_시리온 = path;
                        break;
                    case '파로스':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_파로스 = path;
                        break;
                    case '헤이블':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_헤이블 = path;
                        break;
                    case 'クイー':
                        notif_file.notifs[parseInt(Element.slice(1), 10)].notify_クイー = path;
                        break;
                }
            }
        })
        fs.writeFileSync('./notifs/' + guild_obj.id + '/' + Element + '.json', JSON.stringify(notif_file, null, 4), 'utf8');
    })
}

function Box(message, guild_obj, in_Arr){
    //a user wants to report box contents
    var user = null;
    var users_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    var loop = 0;
    while(loop < users_dir.Member_Objects.length){
        if(users_dir.Member_Objects[loop].discord == message.author.id){
            if(users_dir.Member_Objects[loop].alt == true){
                user = users_dir.Member_Objects[loop].main;
            }else{
                user = users_dir.Member_Objects[loop].id;
            }
            loop = users_dir.Member_Objects.length;
        }
        loop++;
    }
    if(in_Arr.length == 0){//bring up a menu of all boxes they can report
        Box_Menu(message, guild_obj, user);
    }else if(in_Arr[0] == 'menu'){//bring up a menu of all boxes they can report
        Box_Menu(message, guild_obj, user);
    }else if(in_Arr.length == 1){//user entered a shortcut to the box they want to report
        var box_dir = JSON.parse(fs.readFileSync('./Box_Data/box.json', 'utf8'));
        var select = null;
        box_dir.Box_Objects.forEach(Element => {
            if(Element.Shortcuts.includes(in_Arr[0])){
                select = Element;
            }
        })
        if(select == null){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_Arr[0] + '`. Try `' + guild_obj.key + 'help box`');
                    break;
            }
            return;
        }
        var server = null;
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.discord == message.channel.id){
                server = Element.Server;
            }
        })
        if(server == null){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('This function is restricted to report-type channels. Try `' + guild_obj.key + 'help report` or `' + guild_obj.key + 'help channels`');
                    break;
            }
            return;
        }
        Box_Content_Menu(message, guild_obj, select, user, server);
    }else{//user entered a full command, continue on to Box_Det
        //write this part, it will need to access the shortcuts from the box file to determine inputs.
        var box_dir = JSON.parse(fs.readFileSync('./Box_Data/box.json', 'utf8'));
        var select = null;
        box_dir.Box_Objects.forEach(Element => {
            if(Element.Shortcuts.includes(in_Arr[0])){
                select = Element;
            }
        })
        if(select == null){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_Arr[0] + '`. Try `' + guild_obj.key + 'help box`');
                    break;
            }
            return;
        }
        var server = null;
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.discord == message.channel.id){
                server = Element.Server;
            }
        })
        if(server == null){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('This function is restricted to report-type channels. Try `' + guild_obj.key + 'help report` or `' + guild_obj.key + 'help channels`');
                    break;
            }
            return;
        }
        in_Arr_trimmed = in_Arr.slice(1);
        Box_Content_Manual(message, guild_obj, select, user, server, in_Arr_trimmed);
    }
}

function Box_Content_Manual(message, guild_obj, box_obj, user, server, in_Arr){
    
    //a user has chosen to input contents manually in the initial command
    var id_Arr = {
        Loot_Table: []
    }
    var id_Arr_pass = [];
    var loop = null;
    if(in_Arr[in_Arr.length - 1].startsWith('x') == false && in_Arr[in_Arr.length - 1].startsWith('*') == false){
        in_Arr[in_Arr.length] = 'x1';
    }
    var box_file = JSON.parse(fs.readFileSync('./Box_Data/' + box_obj.bID + '.json', 'utf8'));
    var Shortcuts = [];
    box_file.Loot_Table.forEach(Element => {
        if(Element.id.split(' ').length == 1){
            id_Arr.Loot_Table[id_Arr.Loot_Table.length] = {
                id: Element.id,
                Shortcuts: Element.Shortcuts
            };
            id_Arr_pass[id_Arr_pass.length] = Element.id;
        }else if(Element.id.split(' ')[1].includes('-') == false){
            id_Arr.Loot_Table[id_Arr.Loot_Table.length] = {
                id: Element.id,
                Shortcuts: Element.Shortcuts
            };
            id_Arr_pass[id_Arr_pass.length] = Element.id;
        }else{
            Shortcuts = [];
            Element.Shortcuts.forEach(Element => {
                Shortcuts[Shortcuts.length] = Element;
            })
            //id_Arr_pass[id_Arr_pass.length] = Element.id;
            loop = parseInt(Element.id.split(' (')[1].split('-')[0], 10);
            while(loop < (parseInt(Element.id.split('-')[1].split(')')[0], 10) + 1)){
                Shortcuts = [];
                Element.Shortcuts.forEach(Element => {
                    Shortcuts[Shortcuts.length] = Element + loop.toString();
                })
                id_Arr.Loot_Table[id_Arr.Loot_Table.length] = {
                    id: Element.id.split(' ')[0] + ' (' + loop + ')',
                    Shortcuts: Shortcuts
                }
                id_Arr_pass[id_Arr_pass.length] = Element.id.split(' ')[0] + ' (' + loop + ')';
                loop++;
            }
        }
    })
    var content_selected = [];
    var count = 1;
    loop = 0
    var inloop = null;
    var check = false;
    var is_varied = false;
    var equip_file = null;
    while(loop < in_Arr.length){
        inloop = 0
        check = false;
        while(inloop < id_Arr.Loot_Table.length){
            if(id_Arr.Loot_Table[inloop].Shortcuts.includes(in_Arr[loop])){
                check = true;
                if(id_Arr.Loot_Table[inloop].id.split(' ')[0] == "Gold"){
                    content_selected[content_selected.length] = id_Arr.Loot_Table[inloop].id;
                }else{
                    content_selected[content_selected.length] = inloop;
                }
                if(id_Arr.Loot_Table[inloop].id.startsWith('e')){
                    equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + id_Arr.Loot_Table[inloop].id.split(' ')[0] + '.json', 'utf8'));
                    if(equip_file.is_Static == false){
                        is_varied = true;
                    }
                }
                inloop = id_Arr.Loot_Table.length;
            }
            inloop++;
        }
        if(check == false){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_Arr[loop] + '`. Try `' + guild_obj.key + 'help box` or `' + guild_obj.key + 'help box ' + box_obj.Shortcuts[0] + '`');
                    break;
            }
            return;
        }
        if(in_Arr[loop + 1].startsWith('x') || in_Arr[loop + 1].startsWith('*')){
            count = parseInt(in_Arr[loop + 1].slice(1), 10);
            if(isNaN(count) || count < 1){
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send('Unable to determine `' + in_Arr[loop] + '`. Try `' + guild_obj.key + 'help box` or `' + guild_obj.key + 'help box ' + box_obj.Shortcuts[0] + '`');
                        break;
                }
                return;
            }
            inloop = 0;
            count--;
            while(inloop < count){
                content_selected[content_selected.length] = content_selected[content_selected.length - 1];
                inloop++;
            }
            loop++;
        }
        loop++;
    }
    if(is_varied == true){
        Followup_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr_pass, box_file, 0);
    }else{
        Resolve_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr_pass, box_file);
    }
}

async function Box_Menu(message, guild_obj, user){
    //set up a menu embed and message collector to determine which box they want to report contents for
    var server = null;
    var loop = 0;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            server = Element.Server;
        }
    })
    if(server == null){
        switch(guild_obj.language){
            case 'english':
                message.channel.send('This function is restricted to report-type channels. Try `' + guild_obj.key + 'help report` or `' + guild_obj.key + 'help channels`');
                break;
        }
        return;
    }
    var box_json = JSON.parse(fs.readFileSync("./Box_Data/box.json", 'utf8'));
    var box_disp = [];
    var box_json_Active = [];
    box_json.Box_Objects.forEach(Element => {
        if(Element.Active == true){
            box_json_Active[box_json_Active.length] = Element;
            if(Element.Emoji != null){
                box_disp[box_disp.length] = (box_disp.length + 1).toString() + '. ' + Element.Emoji + ' ' + Element.Title;
            }else{
                box_disp[box_disp.length] = (box_disp.length + 1).toString() + '. ' + Element.Title;
            }
        }
    })
    var box_disp_divided = [];
    box_disp.forEach(Element => {
        if(box_disp_divided.length == 0){
            box_disp_divided[0] = Element;
        }else if(box_disp_divided[box_disp_divided.length - 1].length + Element.length < 1000){
            box_disp_divided[box_disp_divided.length - 1] = box_disp_divided[box_disp_divided.length - 1] + '\n' + Element;
        }else{
            box_disp_divided[box_disp_divided.length] = Element;
        }
    })
    const Box_Menu_Embed = new Discord.MessageEmbed()
        .setAuthor('Box Menu', key.image, key.website)
        .setColor(guild_obj.color)
        .setFooter('Respond with the number cooresponding to the box');
    loop = 0;
    while(loop < box_disp_divided.length){
        if(loop == 0){
            Box_Menu_Embed.addField('**Select one of the following**', box_disp_divided[0]);
        }else{
            Box_Menu_Embed.addField('Continued...', box_disp_divided[loop]);
        }
        loop++;
    }
    var Box_Menu_Reply = await message.channel.send(Box_Menu_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            map_menu.delete();
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input.split(' ').length != 1){
            switch(guild_obj.language){
                case 'english': 
                    message.channel.send('Unable to determine input `' + input + '`. Try `' + guild_obj.key + 'help box`');
                    break;
            }
            Box_Menu_Reply.delete();
            return;
        }
        var pos = parseInt(input) - 1;
        if(isNaN(pos) || pos < 0 || pos > (box_json_Active.length - 1)){
            switch(guild_obj.language){
                case 'english': 
                    message.channel.send('Unable to determine input `' + input + '`. Try `' + guild_obj.key + 'help box`');
                    break;
            }
            Box_Menu_Reply.delete();
            return;
        }
        Box_Menu_Reply.delete();
        collected.first().delete();
        var selected = box_json_Active[pos];
        console.log(selected);
        Box_Content_Menu(message, guild_obj, selected, user, server);
    })
}

async function Box_Content_Menu(message, guild_obj, box_obj, user, server){
    //a box has been selected, create a menu and messageCollector to get the reply of the box contents

    //fetch relevant directories and data
    var box_file = JSON.parse(fs.readFileSync('./Box_Data/' + box_obj.bID + '.json', 'utf8'));
    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
    var equip_dir = JSON.parse(fs.readFileSync('./Equipment_Data/equipment.json', 'utf8'));
    var item_obj = null;
    var equip_obj = null;

    var gold_range = false;
    var range = null;
    var loop = 0;
    var disp_Arr = [];
    var id_Arr = [];
    box_file.Loot_Table.forEach(Element => {
        if(Element.id.startsWith('Gold')){
            if(Element.id.includes("-")){
                gold_range = true;
                range = Element.id.split(' (')[1].split(')')[0];
            }else{
                disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + ". <:Gold:834876053029126144>" + Element.id;
                id_Arr[id_Arr.length] = Element.id;
            }
        }else if(Element.id.startsWith('i')){
            item_obj = item_dir.Item_Objects[parseInt(Element.id.split(' ')[0].slice(1), 10) - 1];
            if(Element.id.split(' ').length == 2){
                if(Element.id.includes('-')){
                    loop = parseInt(Element.id.split(' ')[1].split('-')[0].slice(1), 10);
                    while(loop < parseInt(Element.id.split(' ')[1].split('-')[1].split(')')[0], 10) + 1){
                        if(item_obj.Emoji != null){
                            disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + item_obj.Emoji + ' ' + item_obj.Title + ' (' + loop.toString() + ')';
                        }else{
                            disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + item_obj.Title + ' (' + loop.toString() + ')';
                        }
                        id_Arr[id_Arr.length] = Element.id.split(' ')[0] + ' (' + loop.toString() + ')';
                        loop++;
                    }
                }else{
                    if(item_obj.Emoji != null){
                        disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + item_obj.Emoji + ' ' + item_obj.Title + ' ' + Element.id.split(' ')[1];
                    }else{
                        disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + item_obj.Title + ' ' + Element.id.split(' ')[1];
                    }
                    id_Arr[id_Arr.length] = Element.id;
                }
            }else{
                if(item_obj.Emoji != null){
                    disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + item_obj.Emoji + ' ' + item_obj.Title;
                }else{
                    disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + item_obj.Title;
                }
                id_Arr[id_Arr.length] = Element.id;
            }
        }else if(Element.id.startsWith('e')){
            equip_file = equip_dir.Equip_Objects[parseInt(Element.id.slice(1), 10) - 1];
            if(equip_file.Emoji != null){
                disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + equip_file.Emoji + ' ' + equip_file.Title;
            }else{
                disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + '. ' + equip_file.Title;
            }
            id_Arr[id_Arr.length] = Element.id;
        }
    })
    var disp_Arr_divided = [];
    loop = 0;
    while(loop < disp_Arr.length){
        if(loop == 0){
            disp_Arr_divided[0] = disp_Arr[0];
        }else if(disp_Arr_divided[disp_Arr_divided.length - 1].length + disp_Arr[loop].length < 1000){
            disp_Arr_divided[disp_Arr_divided.length - 1] = disp_Arr_divided[disp_Arr_divided.length - 1] + '\n' + disp_Arr[loop];
        }else{
            disp_Arr_divided[disp_Arr_divided.length] = disp_Arr[loop];
        }
        loop++;
    }
    const Box_Embed = new Discord.MessageEmbed()
        .setAuthor('Box Menu', key.image, key.website)
        .setFooter('Respond with the number cooresponding to the content\nYou can report multiple boxes in the same command.')
        .setTitle(box_file.Title)
        //.addField("**Select one of the following**", disp_Arr_divided[0])
        .setColor(guild_obj.color);
    if(box_file.Image != null){
        Box_Embed.setThumbnail(box_file.Image);
    }
    if(disp_Arr_divided.length == 1){
        Box_Embed.addField('**Select from the following**', disp_Arr_divided[0]);
    }else if(disp_Arr_divided.length == 2){
        Box_Embed.addFields(
            { name: "**Select from the following**", value: disp_Arr_divided[0], inline: true},
            { name: "Continued...", value: disp_Arr_divided[1], inline: true}
        )
    }else if(disp_Arr_divided.length == 3){
        Box_Embed.addFields(
            { name: "**Select from the following**", value: disp_Arr_divided[0], inline: true},
            { name: "Continued...", value: disp_Arr_divided[1], inline: true}
        )
        Box_Embed.addField('Continued...', disp_Arr_divided[2]);
    }
    if(gold_range == true){
        Box_Embed.addField('**Reporting <:Gold:834876053029126144> Gold...**', "To report gold format your reply as 'g####'\nFor example: g1340 for 'Gold (1340)'\nAccepted Gold range for **" + box_file.Title + '** is (' + range + ')');
    }
    var Box_Reply = await message.channel.send(Box_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 600000});
    collector.on('end', collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            Box_Reply.delete();
            return;
        }
        var input = collected.first().content.toString().toLowerCase().split(" ");
        if(input.length == 1 && input[0] == 'cancel' || input.length == 1 && input[0] == 'none'){
            collected.first().delete();
            Box_Reply.delete();
            return;
        }
        if(input[input.length - 1].startsWith('x') == false){
            input[input.length] = 'x1';
        }
        var content_selected = [];
        loop = 0;
        var inloop = null;
        var count = 0;
        var pos = null;
        var gold_input = null;
        while(loop < input.length){
            pos = parseInt(input[loop], 10) - 1;
            if(input[loop].startsWith('g')){
                gold_input = parseInt(input[loop].slice(1), 10);
                if(gold_input < parseInt(range.split('-')[0], 10) || gold_input > parseInt(range.split('-')[1], 10)){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send('Unable to determine input: `' + input[loop] + '`.\nValid gold range for **' + box_file.Title + '** is `(' + range + ')`. Try `' + guild_obj.key + 'help box`');
                            break;
                    }
                    return;
                }
                pos = 'Gold (' + gold_input + ')';
            }else{
                if(isNaN(pos) == true || pos < 0 || pos > (id_Arr.length - 1)){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send('Unable to determine input: `' + input[loop] + '`. Try `' + guild_obj.key + 'help box`');
                            break;
                    }
                    return;
                }  
            }
            if(input[loop + 1].startsWith('x') || input[loop + 1].startsWith('*')){
                count = parseInt(input[loop + 1].slice(1), 10);
                if(isNaN(count) || count < 1){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send('Unable to determine `' + input[loop + 1] + '`. Try `' + guild_obj.key + 'help box`');
                            break;
                    }
                    return;
                }
                loop++;
            }else{
                count = 1;
            }
            inloop = 0;
            while(inloop < count){
                content_selected[content_selected.length] = pos;
                inloop++;
            }
            loop++;
        }
        var is_varied = false;
        var equip_file = null;
        content_selected.forEach(Element => {//check to see if the reported box contents includes an item with variable stats that need to be recorded
            if(isNaN(Element) == false){
                if(id_Arr[Element].startsWith('e')){
                    equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + id_Arr[Element].split(" ")[0] + '.json', 'utf8'));
                    if(equip_file.is_Static == false){
                        is_varied = true;
                    }
                }
            }
        })
        collected.first().delete();
        Box_Reply.delete();
        console.log("CONTENT SELECTED:" + content_selected);
        if(is_varied == true){
            Followup_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file, 0);
        }else{
            Resolve_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file)
        }
    })
}

function Followup_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file, pos){
    //a user has entered the contents of a box, but at least one of the items they looted has variable stats that have to be recorded
    //build a message embed and send a embed requesting the item stats
    //create a message collector to get the reply
    //if more than one item in the content_selected array has variable stats, call Followup_box_Contents() repeatedly until they have all been recorded
    //once they have been recorded, pass on to Resolve_Box_Contents to finish the process

    console.log(content_selected);
    console.log(id_Arr);
    var equip_file = null;
    var check = false;
    if(content_selected[pos].toString().split(' ')[0] == 'Gold' == false){
        if(id_Arr[content_selected[pos]].toString().startsWith('e')){
            equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + id_Arr[content_selected[pos]].split(' ')[0] + '.json'));
            if(equip_file.Verieties.length > 0){
                Veriety_Content_Resolve(message, guild_obj, server, user, content_selected, id_Arr, box_file, equip_file, pos);
                check = true;
            }else if(equip_file.Stat_Ranges.length > 0){
                Range_Content_Resolve(message, guild_obj, server, user, content_selected, id_Arr, box_file, equip_file, pos);
                check = true;
            }
        }
    }
    if(check == false){
        pos++;
        if(pos == content_selected.length){
            Resolve_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file);
        }else{
            Followup_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file, pos);
        }
    }
}

async function Veriety_Content_Resolve(message, guild_obj, server, user, content_selected, id_Arr, box_file, equip_file, pos){
    //part of Resolve_Loot if the needed info is based on a verity type
    
    var loot_disp = [];
    const Box_Embed = new Discord.MessageEmbed()
        .setTitle('**' + equip_file.Title + '**')
        .setAuthor('Box Content Menu', key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription('Looted from ' + box_file.Title);
    if(equip_file.image != null){
        Box_Embed.setImage(equip_file.image);
    }
    switch(server){
        case 'BIGMAMA':
            Box_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Box_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Box_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Box_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Box_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Box_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Box_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Box_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Box_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Box_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Box_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Box_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Box_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    equip_file.Verieties.forEach(Element => {
        loot_disp[loot_disp.length] = (loot_disp.length + 1).toString() + '. ' + Element;
    })
    Box_Embed.addField('Which kind of ' + equip_file.Title + ' did you get?', loot_disp);
    var content_reply = await message.channel.send(Box_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 }, );
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help loot`');
            content_reply.delete();
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            content_reply.delete();
            collected.first().delete();
            return;
        }
        if(in_str.length != 1 || isNaN(in_str[0]) == true){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Can not determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            content_reply.delete();
            return;
        }
        var selection = parseInt(in_str[0], 10) - 1;
        if(selection < 0 || selection > loot_disp.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Can not etermine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            content_reply.delete();
            return;
        }
        if(id_Arr.includes(id_Arr[content_selected[pos]] + ' [' + selection.toString() + ']')){
            loop = 0;
            while(loop < id_Arr.length){
                if(id_Arr[loop] == id_Arr[content_selected[pos]] + ' [' + selection.toString() + ']'){
                    content_selected[pos] = loop;
                    loop = id_Arr.length;
                }
                loop++;
            }
        }else{
            id_Arr[id_Arr.length] = id_Arr[content_selected[pos]] + ' [' + selection.toString() + ']';
            content_selected[pos] = id_Arr.length - 1;
        }
        
        pos++;
        content_reply.delete();
        collected.first().delete();
        if(pos == content_selected.length){
            Resolve_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file);
        }else{
            Followup_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file, pos);
        }
    })
}

async function Range_Content_Resolve(message, guild_obj, server, user, content_selected, id_Arr, box_file, equip_file, pos){
    var loot_disp = [];
    const Box_Embed = new Discord.MessageEmbed()
        .setTitle('**' + equip_file.Title + '**')
        .setAuthor('Box Content Menu', key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription('Looted from ' + box_file.Title);
    if(equip_file.image != null){
        Box_Embed.setImage(equip_file.image);
    }
    equip_file.Stat_Ranges.forEach(Element => {
        loot_disp[loot_disp.length] = Element;
    })
    Box_Embed.addField('What stats does the ' + equip_file.Title + ' have?', loot_disp.join('\n'));
    switch(server){
        case 'BIGMAMA':
            Box_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Box_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Box_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Box_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Box_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Box_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Box_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Box_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Box_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Box_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Box_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Box_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Box_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    var content_reply = await message.channel.send(Box_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 }, );
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help loot`');
            content_reply.delete();
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            content_reply.delete();
            collected.first().delete();
            return;
        }
        if(in_str.length != equip_file.Stat_Ranges.length){
            console.log('lengths dont match')
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to etermine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            loot_reply.delete();
            return;
        }
        loop = 0;
        while(loop < in_str.length){
            if(isNaN(in_str[loop]) || parseInt(in_str[loop], 10) < 0){
                console.log("cant be less than zero or a non-integer");
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send('Unable to determine `' + in_str[loop] + '`. Try `' + guild_obj.key + 'help loot`');
                        break;
                }
                loot_reply.delete();
                return;
            }
            in_str[loop] = parseInt(in_str[loop], 10);
            loop++;
        }

        var selection = in_str.join(',');
        if(id_Arr.includes(id_Arr[content_selected[pos]] + ' [' + selection.toString() + ']')){
            loop = 0;
            while(loop < id_Arr.length){
                if(id_Arr[loop] == id_Arr[content_selected[pos]] + ' [' + selection.toString() + ']'){
                    content_selected[pos] = loop;
                    loop = id_Arr.length;
                }
                loop++;
            }
        }else{
            id_Arr[id_Arr.length] = id_Arr[content_selected[pos]] + ' [' + selection.toString() + ']';
            content_selected[pos] = id_Arr.length - 1;
        }
        
        pos++;
        content_reply.delete();
        collected.first().delete();
        if(pos == content_selected.length){
            Resolve_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file);
        }else{
            Followup_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file, pos);
        }
    })
}

function Resolve_Box_Contents(message, guild_obj, server, user, content_selected, id_Arr, box_file){
    var loop = null;
    var inloop = null;
    var condense_Arr = [];
    content_selected.forEach(Element => {
        if(Element.toString().split(" ")[0] == 'Gold' && condense_Arr.includes(Element) == false){
            condense_Arr[condense_Arr.length] = Element;
        }
    })
    var swap = null;
    loop = 0;
    while(loop < condense_Arr.length){
        inloop = 0;
        while(inloop < (condense_Arr.length - 1)){
            if(parseInt(condense_Arr[inloop].split(' (')[1].split(')')[0], 10) < parseInt(condense_Arr[inloop + 1].split(' (')[1].split(')')[0], 10)){
                swap = condense_Arr[inloop];
                condense_Arr[inloop] = condense_Arr[inloop + 1];
                condense_Arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    content_selected.forEach(Element => {
        if(condense_Arr.includes(Element) == false){
            condense_Arr[condense_Arr.length] = Element;
        }
    })
    while(loop < condense_Arr.length){
        inloop = 0;
        while(inloop < (condense_Arr.length - 1)){
            if(isNaN(condense_Arr[inloop]) == false){
                if(condense_Arr[inloop] > condense_Arr[inloop + 1]){
                    swap = condense_Arr[inloop];
                    condense_Arr[inloop] = condense_Arr[inloop + 1];
                    condense_Arr[inloop + 1] = swap;
                }
            }
            inloop++;
        }
        loop++;
    }
    var count_Arr = [];
    condense_Arr.forEach(Element => {
        count_Arr[count_Arr.length] = 0;
    })
    content_selected.forEach(Element => {
        loop = 0;
        while(loop < condense_Arr.length){
            if(condense_Arr[loop] == Element){
                count_Arr[loop]++;
                loop = condense_Arr.length;
            }
            loop++;
        }
    })
    loop = 0;
    while(loop < condense_Arr.length){
        if(condense_Arr[loop].toString().split(" ")[0] != "Gold" && isNaN(condense_Arr[loop]) == false){
            condense_Arr[loop] = id_Arr[condense_Arr[loop]];
        }
        loop++;
    }
    Box_Log(message, guild_obj, server, user, box_file, condense_Arr, count_Arr);
}

function Box_Log(message, guild_obj, server, user, box_file, condense_Arr, count_Arr){
    //everything has been determined. Create a log file and write it to disc on log.json
    //create a message embed and send it to the user to confirm their input
    var loop = 0;
    var loot_Arr = [];
    if(condense_Arr.length != count_Arr.length){
        message.channel.send('```js\nError\nvar condense_Arr.length != count_Arr.length\nfunction Box_Log() aborted```');
        return;
    }
    var count = 0;
    while(loop < condense_Arr.length){
        count = count + count_Arr[loop];
        loot_Arr[loop] = count_Arr[loop].toString() + '-' + condense_Arr[loop].toString();
        loop++;
    }
    var date = new Date();
    var date_ms = date.getTime();
    var log_file = {
        id: null,
        log_type: "B",
        bID: box_file.bID,
        server: server,
        report: date_ms,
        home_channel: message.channel.id,
        author: message.author.id,
        users: [user],
        count: count,
        contents: loot_Arr
    }
    var log_json = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + '/log.json', 'utf8'));
    var lID = null;
    var lID_last = null;
    if(log_json.Event_Arr.length == 0){
        lID_last = 'l000000';
    }else{
        lID_last = log_json.Event_Arr[log_json.Event_Arr.length - 1].id;
    }
    var lID_int = parseInt(lID_last.slice(1), 10);
    lID = (lID_int + 1).toString();
    while(lID.length < 6){
        lID = '0' + lID;
    }
    lID = 'l' + lID;
    log_file.id = lID;
    log_json.Event_Arr[log_json.Event_Arr.length] = log_file;
    fs.writeFileSync('./log/' + guild_obj.id + '/log.json', JSON.stringify(log_json, null, 4), 'utf8');
    
    //build embed reply for log file
    console.log(log_file);
    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
    var equip_dir = JSON.parse(fs.readFileSync('./Equipment_Data/equipment.json', 'utf8'));
    const Box_Embed = new Discord.MessageEmbed()
        .setAuthor('Box Report', key.image, key.website)
        .setTitle('**' + box_file.Title + ' (x' + count + ')**')
        .setColor(guild_obj.color)
        .addField('**Reported by**', message.author);
    if(box_file.Image != null){
        Box_Embed.setThumbnail(box_file.Image);
    }
    if(count == 1){
        Box_Embed.setTitle('**' + box_file.Title + '**');
    }
    switch(server){
        case 'BIGMAMA':
            Box_Embed.setFooter('bigmama server', 'https://i.imgur.com/XoTZJoB.png');
            break;
        case 'DEVILANG':
            Box_Embed.setFooter('devilang server', 'https://i.imgur.com/fpiEbI6.png');
            break;
        case 'WADANGKA':
            Box_Embed.setFooter('wadangka server', 'https://i.imgur.com/XMllcx2.png');
            break;
        case 'CALIGO':
            Box_Embed.setFooter('caligo server', 'https://i.imgur.com/Ug8jLUA.png');
            break;
        case 'TURTLEZ':
            Box_Embed.setFooter('turtlez server', 'https://i.imgur.com/ydxMUmy.png');
            break;
        case 'NEWSTAR':
            Box_Embed.setFooter('newstar server', 'https://i.imgur.com/gNCRkxe.png');
            break;
        case 'DARLENE':
            Box_Embed.setFooter('darlene server', 'https://i.imgur.com/jYAOwkJ.png');
            break;
        case 'BARSLAF':
            Box_Embed.setFooter('barslaf server', 'https://i.imgur.com/ZLaU6ej.png');
            break;
        case '모아임':
            Box_Embed.setFooter('모아임 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '시리온':
            Box_Embed.setFooter('시리온 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '파로스':
            Box_Embed.setFooter('파로스 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case '헤이블':
            Box_Embed.setFooter('헤이블 server', 'https://i.imgur.com/LXot5tN.png');
            break;
        case 'クイー':
            Box_Embed.setFooter('クイー server', 'https://i.imgur.com/CGshRRg.png');
            break;
    }
    var disp_Arr = [];
    var item_file = null;
    var equip_file = null;
    loot_Arr.forEach(Element => {
        if(Element.includes('Gold')){
            if(Element.split("-")[0] == 1){
                disp_Arr[disp_Arr.length] = "<:Gold:834876053029126144> " + Element.split('-')[1];
            }else{
                disp_Arr[disp_Arr.length] = "<:Gold:834876053029126144> " + Element.split('-')[1] + ' (x' + Element.split('-')[0] + ')';
            }
        }else if(Element.split('-')[1].startsWith('i')){
            console.log(Element)
            item_file = item_dir.Item_Objects[parseInt(Element.split('-')[1].split(' ')[0].slice(1), 10) - 1];
            if(parseInt(Element.split('-')[0], 10) == 1){
                if(item_file.Emoji != null){
                    disp_Arr[disp_Arr.length] = item_file.Emoji + " " + item_file.Title;
                }else{
                    disp_Arr[disp_Arr.length] = item_file.Title;
                }
                if(Element.split(' ').length == 2){
                    disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ' ' + Element.split(' ')[1];
                }
            }else{
                if(Element.split(' ').length == 2){
                    if(item_file.Emoji != null){
                        disp_Arr[disp_Arr.length] = item_file.Emoji + " " + item_file.Title + ' ' + Element.split(' ')[1] + " (x" + Element.split('-')[0] + ")";
                    }else{
                        disp_Arr[disp_Arr.length] = item_file.Title + ' ' + Element.split(' ')[1] + " (x" + Element.split("-")[0] + ")";
                    }
                }else{
                    if(item_file.Emoji != null){
                        disp_Arr[disp_Arr.length] = item_file.Emoji + " " + item_file.Title + " (x" + Element.split('-')[0] + ")";
                    }else{
                        disp_Arr[disp_Arr.length] = item_file.Title + " (x" + Element.split("-")[0] + ")";
                    }
                }
            }
            
        }else if(Element.split('-')[1].startsWith('e')){
            equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + Element.split("-")[1].split(" ")[0] + '.json', 'utf8'));
            if(equip_file.is_Static == true){
                if(equip_file.Emoji != null){
                    disp_Arr[disp_Arr.length] = equip_file.Emoji + ' ' + equip_file.Title;
                }else{
                    disp_Arr[disp_Arr.length] = equip_file.Title;
                }
            }else if(equip_file.Verieties.length > 0){
                if(equip_file.Emoji != null){
                    disp_Arr[disp_Arr.length] = equip_file.Emoji + ' ' + equip_file.Title + ' [' + equip_file.Verieties[parseInt(Element.split(' [')[1].split(']')[0], 10)] + ']';
                }else{
                    disp_Arr[disp_Arr.length] = equip_file.Title + ' [' + equip_file.Verieties[parseInt(Element.split(' [')[1].split(']')[0], 10)] + ']';
                }
            }else if(equip_file.Stat_Ranges.length > 0){
                if(equip_file.Emoji != null){
                    disp_Arr[disp_Arr.length] = equip_file.Emoji + ' ' + equip_file.Title + ' (';
                }else{
                    disp_Arr[disp_Arr.length] = equip_file.Title + ' (';
                }
                loop = 0;
                while(loop < equip_file.Stat_Ranges.length){
                    if(loop != 0){
                        disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ', '
                    }
                    disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + Element.split(' [')[1].split(']')[0].split(",")[loop] + ' ' + equip_file.Stat_Ranges[loop];
                    loop++;
                }
                disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ')'
            }
            if(parseInt(Element.split('-')[0], 10) > 1){
                disp_Arr[disp_Arr.length - 1] = disp_Arr[disp_Arr.length - 1] + ' (x' + Element.split('-')[0] + ')';
            }
        }
    })
    var disp_Arr_divided = [];
    if(disp_Arr.join('\n').length < 1024){
        Box_Embed.addField('**Reported Contents**', disp_Arr.join('\n'))
    }else{
        disp_Arr_divided[0] = disp_Arr[0];
        loop = 1;
        while(loop < disp_Arr.length){
            if(disp_Arr_divided[disp_Arr_divided.length - 1].length + disp_Arr[loop].length < 1000){
                disp_Arr_divided[disp_Arr_divided.length - 1] = disp_Arr_divided[disp_Arr_divided.length - 1] + '\n' + disp_Arr[loop];
            }else{
                disp_Arr_divided[disp_Arr_divided.length] = disp_Arr[loop];
            }
            loop++;
        }
        loop = 0
        while(loop < disp_Arr_divided.length){
            if(loop + 1 != disp_Arr_divided.length && loop == 0){
                Box_Embed.addFields(
                    {name: "**Reported Contents**", value: disp_Arr_divided[0], inline: true},
                    {name: "Continued...", value: disp_Arr_divided[1], inline: true}
                )
                loop++;
            }else if(loop + 1 != disp_Arr_divided.length){
                Box_Embed.addFields(
                    {name: "\u200B", value: "\u200B"},
                    {name: "Continued...", value: disp_Arr_divided[loop], inline: true},
                    {name: "Continued...", value: disp_Arr_divided[loop + 1], inline: true}
                )
                loop++;
            }else{
                Box_Embed.addField("Continued...", disp_Arr_divided[loop]);
            }
            loop++;
        }
    }
    message.channel.send(Box_Embed)
}

function Print_Wiki_Monster(message, guild_obj, mID){
    //a monster has been selected from wiki. Fetch data from file and build a reply
    /*
        Right now English is the only option
        Other languages may be added later but that will be a massive effort. Finish the main features in english first

        Think about adding custom emojis to make the card look nicer
    */
    var monster_obj = JSON.parse(fs.readFileSync('./wiki/monster/' + mID + '.json', 'utf8'));
    var is_null = false;
    var loop = 0;
    //fill in empty data with "unknown"
    if(monster_obj.Level == null){
        monster_obj.Level = 'Unknown';
        is_null = true;
    }
    if(monster_obj.Attack_Style == null){
        monster_obj.Attack_Style = 'Unknown';
        is_null = true;
    }
    if(monster_obj.Aggressive == null){
        monster_obj.Aggressive = 'Unknown';
        is_null = true;
    }
    if(monster_obj.Exp_Gained == null){
        monster_obj.Exp_Gained = 'Unknown';
        is_null = true;
    }
    if(monster_obj.Health == null){
        monster_obj.Health = 'Unknown';
        is_null = true;
    }
    if(monster_obj.Fame_Gained == null && monster_obj.Type == 'Boss'){
        monster_obj.Fame_Gained = 'Unknown';
        is_null = true;
    }
    if(monster_obj.Zone.length != monster_obj.Spawn_Points.length && monster_obj.Type == 'Boss' || monster_obj.Zone.length != monster_obj.Spawn_Points.length && monster_obj.Type == 'Mini-Boss' || monster_obj.Zone.length != monster_obj.Spawn_Points.length && monster_obj.Type == 'Dungeon Boss'){
        is_null = true;
    }
    //begin building the reply embed
    const Wiki_Embed = new Discord.MessageEmbed()
        .setAuthor('Black Raven Wiki', key.image, key.website)
        .setColor(guild_obj.color);
    //create the basic information field
    if(monster_obj.Type == 'Monster'){
        Wiki_Embed.addField('**' + monster_obj.Title + '**', '**Level**: ' + monster_obj.Level + '\n**Aggressive**: ' + monster_obj.Aggressive + '\n**Attack Style**: ' + monster_obj.Attack_Style + '\n**Experience Gained**: ' + monster_obj.Exp_Gained + '\n**Health Points**: ' + monster_obj.Health);
    }else if(monster_obj.Type == 'Mini-Boss'){
        Wiki_Embed.addField('**' + monster_obj.Title + ' (Mini-Boss)**', '**Level**: ' + monster_obj.Level + '\n**Aggressive**: ' + monster_obj.Aggressive + '\n**Attack Style**: ' + monster_obj.Attack_Style + '\n**Experience Gained**: ' + monster_obj.Exp_Gained + '\n**Health Points**: ' + monster_obj.Health);
    }else{
        Wiki_Embed.addField('**' + monster_obj.Title + ' (' + monster_obj.Type + ')**', '**Level**: ' + monster_obj.Level + '\n**Aggressive**: ' + monster_obj.Aggressive + '\n**Attack Style**: ' + monster_obj.Attack_Style + '\n**Experience Gained**: ' + monster_obj.Exp_Gained + '\n**Health Points**: ' + monster_obj.Health + '\n**Fame Gained**: ' + monster_obj.Fame_Gained);
    }
    //if there are special skills, add them in
    if(monster_obj.Special_Skills.length > 0){
        var special_skills = '';
        monster_obj.Special_Skills.forEach(Element => {
            if(Element.Effect == null){
                Element.Effect = 'Unknown'
                is_null = true
            }
            if(Element.Counter == null){
                Element.Counter = 'Unknown',
                is_null = true;
            }
            special_skills = special_skills + '**' + Element.Skill + '**\nEffect: ' + Element.Effect + '\nCounter: ' + Element.Counter + '\n'
        })
        Wiki_Embed.addField('**Special Skills**', special_skills)
    }
    //add the item drops this monster has
    Wiki_Embed.addField("**Item Drops**", monster_obj.Item_Drops.join('\n'));
    if(monster_obj.Item_Drops.length > 0){
        if(monster_obj.Item_Drops[0].includes('?')){
            is_null = true;
        }
    }
    //add the map this monster is found in (and spawn points if applicable)
    if(monster_obj.Type == 'Monster' || monster_obj.Spawn_Points.length != monster_obj.Zone.length){
        Wiki_Embed.addField('**Found in**', monster_obj.Zone.join('\n'));
    }else{
        var zone_body = [];
        loop = 0;
        while(loop < monster_obj.Zone.length){
            zone_body[zone_body.length] = '**' + monster_obj.Zone[loop] + '**\n' + monster_obj.Spawn_Points[loop];
            loop++;
        }
        Wiki_Embed.addField("Found in", zone_body.join('\n'));
    }
    //add respawn time
    if(monster_obj.Respawn_Time == "None"){
        //no respawn time (dungeon monster)
    }else if(monster_obj.Respawn_Time == null){
        Wiki_Embed.addField("**Respawn Time**", "Unknown");
        is_null = true;
    }else{
        var time = monster_obj.Respawn_Time.split(':');
        var time_display = [0,0,0,0];
        time[0] = parseInt(time[0], 10);
        time[1] = parseInt(time[1], 10);
        time[2] = parseInt(time[2], 10);
        while(time[0] > 23){
            time_display[0]++;
            time[0] = time[0] - 24;
        }
        time_display[1] = time[0];
        time_display[2] = time[1];
        time_display[3] = time[2];
        var time_str = '';
        //create a string to display the respawn time in a normal way
        if(time_display[0] == 1){
            time_str = '1 day ';
        }else if(time_display[0] > 1){
            time_str = time_display[0].toString() + ' days ';
        }
        if(time_display[1] == 1){
            time_str = time_str + '1 hour ';
        }else if(time_display[1] > 1){
            time_str = time_str + time_display[1].toString() + ' hours '
        }
        if(time_display[2] == 1){
            time_str = time_str + '1 minute ';
        }else if(time_display[2] > 1){
            time_str = time_str + time_display[2] + ' minutes ';
        }
        if(time_display[3] == 1){
            time_str = time_str + '1 second ';
        }else if(time_display[3] > 1){
            time_str = time_str + time_display[3] + ' seconds '
        }
        Wiki_Embed.addField("**Respawn Time**", time_str);
    }
    //if the monster has special skills, display them
    if(monster_obj.Special_Skills.length > 0){
        loop = 0;

    }
    if(monster_obj.Thumbnail != null){
        Wiki_Embed.setThumbnail(monster_obj.Thumbnail);
    }
    if(monster_obj.Image != null){
        Wiki_Embed.setImage(monster_obj.Image);
    }
    if(monster_obj.Notes.length > 0){
        Wiki_Embed.addField("**Notes**", monster_obj.Notes.join('\n'));
    }
    if(monster_obj.Flavor_Text != null){
        Wiki_Embed.setDescription(monster_obj.Flavor_Text);
    }
    if(is_null == true){
        Wiki_Embed.setFooter("This file has missing data.\nWant to help complete it?\nApply to become an editor");
    }
    console.log(Wiki_Embed);
    message.channel.send(Wiki_Embed);
}


function Stats(message, guild_obj, in_Arr){
    if(in_Arr.length == 0){

    }else if(in_Arr.length > 0){
        
    }
}

async function Stats(message, guild_obj){

}

client.login(key.token)