//author: _dandera, github @idandera
//purpose: twom discord bot. various uses detailed in README.md
//created 2021-04-11
//last edited 2024-03-22


const { count } = require('console');
//const { channel } = require('diagnostics_channel');
const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");
const { emitKeypressEvents } = require('readline');
const { SourceTextModule } = require('vm');
const key = JSON.parse(fs.readFileSync('./key.json', 'utf8'));
//temp_parse_MLootData();
//Init_Timers();
//archive_logs();
var Init_Timers_Check = false;
var Set_Maint = false;

/*--------------------------------------------TO DO--------------------------------------------
    
    Set up the role-add system
    Set up the role-remove system
    Fix check command in home channels
    in undo function, need a way to scrub through data other than the last entered command
    in stat function, need a way to view user-specific data
    add in leaderboards for bosses & maps
    add scoreboards for maps
    be able to cancel timers
    Store redundant data?
    Set up user settings, privacy and custom settings for view
    
    A wiki is vital. That was one of the top used functions
    use the code from the new stale oreos system. It was way faster than the old varient

---------------------------------------------------------------------------------------------*/
/*--------------------------------------------DONE--------------------------------------------
    - register new member is up and working
    - join new guild is working
    - reporting a boss is up and working
    - reporting boxes is up and running
    - reporting boss and monster loot is completely done ( i think )
---------------------------------------------------------------------------------------------*/
/*--------------------------------------------BUGS--------------------------------------------
    - Respawn time freaks out when the report time is after midnight and death time is after midnight (FIXED)
    - $help stat boss returns empty
    - undo last will bring up command from user who did not enter the undo command
    - when a new member joins, the DM that is sent contains undefined variables
    - siege reminders dont work
    - log_type L is writing to log.json twice. Same id both times. (for example check Log ID "l000522") Doesn't cause a catostrophic failure but it does mess with $undo
    - something seems wrong with $stat boss. in data set g003 it is showing the incorrect drop rate for Weapon A. There is only one reported drop but it is showing a display for as if it dropped twice. Possibly linked to the double reporting from duplicate log_type "L"
    - $c bf and $c siege both cause a crash. Tries to open ./Monster_Data/battlefield.json and ./Monster_Data/siege.json which do not exist
---------------------------------------------------------------------------------------------*/



//thinking about how to maintain boss time privacy
//for people who are okay with sharing drop rate stats, make it so that the stats do not update in real time as they report boss times
//maybe make stats update all at once at the end of the week, user log.json for each guild to trim log file size and also update stats at the same time
//this process will be, cpu intensive. So maybe do it when twom does their own maint.

client.on('ready', () => {
    console.log("connected as " + client.user.tag);
    client.user.setActivity('Not dead yet');
    if(Init_Timers_Check == false){
        Init_Timers();
        Init_Timers_Check = true;
    }
    var next_maint = JSON.parse(fs.readFileSync("./maint/maint_next.json", "utf8"));
    var date = new Date().getTime();
    var maint_duration = 3600000 * parseInt(next_maint.Maint_Duration.split(":")[0], 10);
    maint_duration = maint_duration + (60000 * parseInt(next_maint.Maint_Duration.split(":")[1], 10));
    maint_duration = maint_duration + (1000 * parseInt(next_maint.Maint_Duration.split(":")[2], 10));
    if(date < next_maint.Maint_Start + maint_duration && Set_Maint == false){
        set_Maint = true;
        //Maint_Start();
    }
    //announce_update();
    //archive_logs();
    //Clean_Monster_Data()
    //parse_history();
    //Clean_Score_Data();
    //temp_custom_timers();
})

function temp_custom_timers(){
    var guilds_dir = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var boss_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var notif_arr = [];
    var notif_obj = null
    boss_dir.Boss_Select.forEach(Element => {
        var m_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
        var notif_obj = {
            "mID": null,
            "now": true,
            "s15": false,
            "s30": false,
            "m1": false,
            "m2": false,
            "m3": false,
            "m4": false,
            "m5": false,
            "m10": false,
            "m15": false,
            "m30": false,
            "m45": false,
            "h1": false,
            "m90": false,
            "h2": false,
            "h3": false,
            "h4": false,
            "h5": false,
            "h6": false,
            "h12": false,
            "d1": false,
            "d2": false,
            "d3": false,
            "d4": false,
            "d5": false,
            "d6": false
        }
        notif_obj.mID = Element.mID;
        var respawn_time = m_file.Respawn_Time.split(":");
        if(parseInt(respawn_time[0], 10) < 48){
            notif_obj.d1 = true;
        }else{
            notif_obj.d1 = false;
        }
        if(parseInt(respawn_time[0], 10) > 3){
            notif_obj.h1 = true
        }else{
            notif_obj.h1 = false
        }
        if(parseInt(respawn_time[1], 10) > 12 || parseInt(respawn_time[0], 10) > 0){
            notif_obj.m5 = true;
        }else{
            notif_obj.m5 = false;
        }
        notif_arr[notif_arr.length] = notif_obj;
    })
    guilds_dir.Guild_Objects.forEach(Element => {
        var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
        guild_file.Notif_Objects = notif_arr;
        fs.writeFileSync("./Guild_Data/" + Element.id + ".json", JSON.stringify(guild_file, null, 4), "utf8");
    })
    console.log(JSON.stringify(notif_arr, null, 4).length);
}

function announce_update(){
    var announcement_embed = new Discord.MessageEmbed()
        .setAuthor("Black Raven Update Notes", key.image, key.website)
        .setColor("703611")
        .setDescription("Updated Loot Tables")
        .addField("**Added Wingfril's Treasure to loot table for**", "Areuke, Morty, Mushroom Bulldozer, Flower Bulldozer, Actaemon, Glucose, Overload, Soul Lich")
        .addField("**Added Donguri Leaf to loot table for**", "RECLUSE");
    //var announcement = "Weekly Reports are back! The error codes have been resolved, Reports were not generated the past two weeks, sorry about that.";
    var guilds_json = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var loop = 0;
    while(loop < guilds_json.Guild_Objects.length){
        var guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + guilds_json.Guild_Objects[loop].id + ".json", "utf8"));
        var home_check = false;
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.Type == "home"){
                var channel = client.channels.cache.get(Element.discord);
                if(channel != undefined){
                    home_check = true;
                    channel.send(announcement_embed);
                    //channel.send("Taking Raven offline for Maint...");
                }
            }
        })
        if(home_check == false && guild_obj.Channel_Objects.length > 0){
            var channel = client.channels.cache.get(guild_obj.Channel_Objects[0].discord);
            if(channel != undefined){
                channel.send("Error. No home channel found, defaulting to `" + guild_obj.Channel_Objects[0].id + "`\n\n");
                channel.send(announcement_embed);
                //channel.send("Taking Raven offline for Maint...");
            }
        }
        
        loop++;
    }
}

/*
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
*/

function parse_history(){
    var box_dir = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
    var boss_dir = JSON.parse(fs.readFileSync("./menus/boss.json", "utf8"));
    var users_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var guild_dir = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var box_Arr = [];
    var boss_Arr = [];
    box_dir.Box_Objects.forEach(Element => {
        box_Arr[box_Arr.length] = 0;
    })
    boss_dir.Boss_Select.forEach(Element => {
        boss_Arr[boss_Arr.length] = 0;
    })
    var loop = 0;
    var inloop = null;
    while(loop < users_dir.Member_Objects.length){
        var user_file = null;
        user_file = JSON.parse(fs.readFileSync('./User_Data/' + users_dir.Member_Objects[loop].id + ".json", "utf8"));
        
        //initilize user file
        box_Arr = [];
        boss_Arr = [];
        box_dir.Box_Objects.forEach(Element => {
            box_Arr[box_Arr.length] = 0;
        })
        boss_dir.Boss_Select.forEach(Element => {
            boss_Arr[boss_Arr.length] = 0;
        })
        user_file.User_Object.Exp = 0;
        user_file.Box_Data = box_Arr;
        user_file.Monster_Data = boss_Arr;
        //gather data for parse
        var user_data = [];
        console.log("scrubbing user ID " + user_file.User_Object.id);
        var trimmed_guilds = [];
        user_file.User_Object.guilds.forEach(Element => {
            if(Element == "g003" || Element == "g007" || Element == "g006" || Element == "g010"){
                trimmed_guilds[trimmed_guilds.length] = Element;
            }
        })
        trimmed_guilds.forEach(Element => {
            user_data = [];
            var log_json = JSON.parse(fs.readFileSync("./log/" + Element + "/log.json", "utf8"));
            inloop = 0;
            while(inloop < log_json.Event_Arr.length){
                if(log_json.Event_Arr[inloop].log_type == "B" && log_json.Event_Arr[inloop].users[0] == user_file.User_Object.id || log_json.Event_Arr[inloop].log_type == "R" && log_json.Event_Arr[inloop].users.includes(user_file.User_Object.id)){
                    console.log("extract " + log_json.Event_Arr[inloop].id + " from " + Element + " log")
                    user_data[user_data.length] = log_json.Event_Arr[inloop];
                }
                inloop++;
            }
            inloop = 0;
            while(inloop < box_dir.Box_Objects.length){
                var stat_file = JSON.parse(fs.readFileSync("./stats/" + Element + "/Box_Data/" + box_dir.Box_Objects[inloop].bID + ".json", "utf8"));
                var stat_loop = 0;
                console.log("scanning stat file ./stats/" + Element + "/Box_Data/" + box_dir.Box_Objects[inloop].bID + ".json");
                while(stat_loop < stat_file.History_Arr.length){
                    if(stat_file.History_Arr[stat_loop].users.includes(user_file.User_Object.id)){
                        user_data[user_data.length] = stat_file.History_Arr[stat_loop];
                        user_data[user_data.length - 1].log_type = "B";
                        user_data[user_data.length - 1].bID = box_dir.Box_Objects[inloop].bID;
                    }
                    stat_loop++;
                }
                inloop++;
            }
            inloop = 0;
            while(inloop < boss_dir.Boss_Select.length){
                var stat_file = JSON.parse(fs.readFileSync("./stats/" + Element + "/Monster_Data/" + boss_dir.Boss_Select[inloop].mID + ".json", "utf8"));
                var stat_loop = 0;
                console.log("scanning stat file ./stats/" + Element + "/Monster_Data/" + boss_dir.Boss_Select[inloop].mID + ".json");
                while(stat_loop < stat_file.History_Arr.length){
                    if(stat_file.History_Arr[stat_loop].users.includes(user_file.User_Object.id)){
                        user_data[user_data.length] = stat_file.History_Arr[stat_loop];
                        user_data[user_data.length - 1].log_type = "R";
                        user_data[user_data.length - 1].mID = boss_dir.Boss_Select[inloop].mID;
                    }
                    stat_loop++;
                }
                inloop++;
            }
            //all relevant data is extracted
            //process data and write to file
            var Exp = 0;
            user_data.forEach(Element => {
                var pos = 0;
                if(Element.log_type == "B"){
                    if(Element.bID == "b001"){
                        console.log(Element);
                    }
                    var box_file = JSON.parse(fs.readFileSync("./Box_Data/" + Element.bID + ".json", "utf8"));
                    pos = parseInt(Element.bID.slice(1), 10) - 1;
                    if(isNaN(Element.count)){
                        Element.count = 0;
                        var content_loop = 0;
                        while(content_loop < Element.contents.length){
                            Element.count = Element.count + parseInt(Element.contents[content_loop].split("-")[0], 10);
                            content_loop++;
                        }
                    }
                    Exp = Exp + (box_file.Exp * Element.count);
                    user_file.Box_Data[pos] = user_file.Box_Data[pos] + Element.count; 
                    var content_loop = 0;
                    while(content_loop < Element.contents.length){
                        if(Element.contents[content_loop].split("-")[1].startsWith("e")){
                            var equip_file = JSON.parse(fs.readFileSync("./Equipment_Data/" + Element.contents[content_loop].split("-")[1].split(" ")[0] + ".json", "utf8"));
                            Exp = Exp + (parseInt(Element.contents[content_loop].split("-")[0], 10) * equip_file.Exp);
                        }
                        content_loop++;
                    }
                }else if(Element.log_type == "R"){
                    var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
                    inloop = 0;
                    while(inloop < boss_dir.Boss_Select.length){
                        if(boss_dir.Boss_Select[inloop].mID == Element.mID){
                            pos = inloop;
                            inloop = boss_dir.Boss_Select.length;
                        }
                        inloop++;
                    }
                    Exp = Exp + boss_file.Exp;
                    user_file.Monster_Data[pos] = user_file.Monster_Data[pos] + 1;
                    var loot_loop = 0;
                    while(loot_loop < Element.loot.length){
                        if(Element.loot[loot_loop].startsWith("e")){
                            var equip_file = JSON.parse(fs.readFileSync("./Equipment_Data/" + Element.loot[loot_loop].split(" ")[0] + ".json", "utf8"));
                            Exp = Exp + equip_file.Exp;
                        }else{
                            Exp++;
                        }
                        loot_loop++;
                    }
                }
            })
            user_file.User_Object.Exp = user_file.User_Object.Exp + Exp;
        })
        console.log(user_file);
        fs.writeFileSync("./User_Data/" + user_file.User_Object.id + ".json", JSON.stringify(user_file, null, 4), "utf8");
        console.log(box_Arr, boss_Arr);
        loop++;
    }

}

function temp_parse_MData(){
    var boss_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    var equip_dir = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    boss_dir.Boss_Select.forEach(Element => {
        var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
        
    })
}

function temp_parse_MLootData(){
    var boss_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    var equip_dir = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    var loop = 0;
    var inloop = 0;
    var swap = 0;
    boss_dir.Boss_Select.forEach(Element => {
        var monster_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
        var item_loot_table = [];
        var equip_loot_table = [];
        loop = 0;
        while(loop < monster_file.Loot_Table.length){
            if(monster_file.Loot_Table[loop].startsWith("i")){
                item_loot_table[item_loot_table.length] = monster_file.Loot_Table[loop];
            }else{
                equip_loot_table[equip_loot_table.length] = monster_file.Loot_Table[loop];
            }
            loop++;
        }
        loop = 0;
        while(loop < item_loot_table.length){
            inloop = 0;
            while(inloop < (item_loot_table.length - 1)){
                if(parseInt(item_loot_table[inloop].split(" ")[0].slice(1), 10) > parseInt(item_loot_table[inloop + 1].split(" ")[0].slice(1), 10)){
                    //console.log("mID " + monster_file.id + " swap item id " + item_loot_table[inloop]);
                    swap = item_loot_table[inloop];
                    item_loot_table[inloop] = item_loot_table[inloop + 1];
                    item_loot_table[inloop + 1] = swap;
                }
                inloop++;
            }
            loop++;
        }
        if(equip_loot_table.length > 1){
            loop = 0;
            while(loop < equip_loot_table.length){
                inloop = 0;
                while(inloop < (equip_loot_table.length - 1)){
                    if(parseInt(equip_loot_table[inloop].split(" ")[0].slice(1), 10) > parseInt(equip_loot_table[inloop + 1].split(" ")[0].slice(1), 10)){
                        //console.log("mID " + monster_file.id + " swap equip id " + equip_loot_table[inloop]);
                        swap = equip_loot_table[inloop];
                        equip_loot_table[inloop] = equip_loot_table[inloop + 1];
                        equip_loot_table[inloop + 1] = swap;
                    }
                    inloop++;
                }
                loop++;
            }
        }
        var new_loot_table = [];
        item_loot_table.forEach(Element => {
            new_loot_table[new_loot_table.length] = Element;
        })
        equip_loot_table.forEach(Element => {
            new_loot_table[new_loot_table.length] = Element;
        })
        monster_file.Loot_Table = new_loot_table;
        var loot_dir = [];
        new_loot_table.forEach(Element => {
            if(Element.startsWith('i')){
                loot_dir[loot_dir.length] = {
                    id: Element,
                    Title: item_dir.Item_Objects[parseInt(Element.split(" ")[0].slice(1), 10) - 1].Title,
                    Shortcuts: [],
                    Exp: 0
                }
                switch(Element.split(" ")[0]){
                    case "i001": 
                        loot_dir[loot_dir.length - 1].Shortcuts = ["armord", "armd"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i002":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["weapond", "weapd"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i003":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["armorc", "armc"];
                        loot_dir[loot_dir.length - 1].Exp = 20;
                        break;
                    case "i004":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["weaponc", "weapc"];
                        loot_dir[loot_dir.length - 1].Exp = 30;
                        break;
                    case "i005":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["armorb", "armb"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i006":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["weaponb", "weapb"];
                        loot_dir[loot_dir.length - 1].Exp = 30;
                        break;
                    case "i007":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["armora", "arma"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i008":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["weapona", "weapa"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i009":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["armors", "arms"];
                        loot_dir[loot_dir.length - 1].Exp = 150;
                        break;
                    case "i010":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["weapons", "weaps"];
                        loot_dir[loot_dir.length - 1].Exp = 250;
                        break;
                    case "i351":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["oldscroll", "os"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i344":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["smalltreasurebox", "smallbox", "stb"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i347":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["oldbox", "ob"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i348":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ancienttreasure", "treasure", "at"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i349":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["strangetreasure", "strange", "treasure", "st"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i350":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wingfrilstreasure", "wingfriltreasure", "wingfril", "wingfrils", "treasure", "wt"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i356":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["jomaspendant", "jomas", "joma", "jp"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i371":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["potionbag", "potbag", "pb"];
                        loot_dir[loot_dir.length - 1].Exp = 3;
                        break;
                    case "i287":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["gemstone", "gem", "gs"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i403":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dungchest", "chest", "dc", "dc20"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i404":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dungchest", "chest", "dc", "dc25"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i405":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dungchest", "chest", "dc", "dc30"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i406":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dungchest", "chest", "dc", "dc35"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i407":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dungchest", "chest", "dc", "dc40"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i255":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["petcrystal", "pet", "crystal", "pc"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i415":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["restoration", "restore", "por"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i416":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["threat", "pot"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i417":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["vanishing", "vanish", "pov"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i294":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["fallenmagicstone", "fallenstone", "fallen", "fms"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i291":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shinningmagicstone", "shinning", "shining", "magicstone", "sms"];
                        loot_dir[loot_dir.length - 1].Exp = 7;
                        break;
                    case "i292":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["magicrune", "mrune", "mr"];
                        loot_dir[loot_dir.length - 1].Exp = 8;
                        break;
                    case "i395":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["brokenmagicstone", "broken", "magicstone", "bms"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i396":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["darkpiece", "dpiece", "piece", "dp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i256":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["heavyleather", "hleather", "heavy", "leather", "hl"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i260":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["smallbag", "small", "bag", "sb"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i357":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wildboarstailhair", "tailhair", "wbth", "hair", "tail", "th"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i483":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lessermanapotion", "lessermana", "lmp", "mana"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i480":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lesserhealingpotion", "lesserhealing", "lhp", "health", "hp"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i481":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["healingpotion", "healing", "heal", "hp"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i482":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lessermanapotion", "lessermana", "lmp", "mana"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i484":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["manapotion", "mana", "mp"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i032":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bullrush2", "bullrush", "br2", "br", "bull", "rush"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i188":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["curepoison2", "curepoison", "cure", "cure2", "cp2", "cp"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i257":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bulldozerstooth", "bulldozertooth", "tooth", "bdt", "bt"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i258":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mysticstone", "mystic", "stone", "ms"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i025":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["parry3", "parry", "p3"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i180":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["iceprison2", "iceprison", "ice", "ice2", "prison", "prison2", "ip2", "ip"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i261":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["spidersilkbag", "bag", "spiderbag", " ssbag", "ssb"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i358":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["spidersilk", "silk", "ss"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i359":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["damagedpamphlet", "damaged", "damage", "pamphlet", "pamph", "dp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i360":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["oldfeather", "old", "feather", "of"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i412":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lesserrestorationpotion", "lesser", "restoration", "restpotion", "lrp"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i039":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wildcharge1", "wildcharge", "charge", "wc1", "wc"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i108":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ensnare2", "ensnare", "ens2", "ens"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i165":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["freezingtrap3", "freezingtrap", "freeze3", "freeze", "ft3", "ft"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i262":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["strangehat", "strange", "hat", "shat", "sh"];
                        loot_dir[loot_dir.length - 1].Exp = 20;
                        break;
                    case "i361":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ganodermalucidum", "ganoderma", "lucidum", "gl"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i362":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mushroomspore", "spore", "mspore", "msp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i016":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["tauntingblow", "tauntingblow2", "taunt2", "taunt", "tb2", "tb"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i035":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["drowsiness", "drowsiness1", "drowsi", "drowsi1", "drow", "drow1"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i164":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["freezingtrap2", "freezingtrap", "freezing2", "freezing", "freeze2", "freeze", "ft2", "ft"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i259":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["phantomskneecap", "phantomkneecap", "kneecap", "knee", "pkc", "pk"];
                        loot_dir[loot_dir.length - 1].Exp = 20;
                        break;
                    case "i048":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["slam2", "slam"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i184":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["firebolt2", "firebolt", "fb2", "fb"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i199":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["flare1", "flare"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i203":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["carnivalize1", "carnivalize", "carn1", "carn"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i263":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["coraldust", "cdust", "dust", "cd"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i363":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["redcoral", "rcoral", "red"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i364":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["greencrystal", "green", "gcrystal", "gc"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i264":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["woopabronzebell", "bronze", "bell", "wbb", "bb"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i265":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["woopacrystalscale", "crystalscale", "scale", "cscale", "wcs"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i266":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wooparoopatotem", "wrtotem", "totem", "wrt"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i365":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mysticoil", "moil", "mo"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i267":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["turtlecrown", "crown", "tcrown", "tc"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i268":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["redturtleshell", "redshell", "rts", "red"];
                        loot_dir[loot_dir.length - 1].Exp = 20;
                        break;
                    case "i269":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["blueturtleshell", "blueshell", "bts", "blue"];
                        loot_dir[loot_dir.length - 1].Exp = 20;
                        break;
                    case "i200":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["flare2", "flare", "f2"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i366":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["oldfemalering", "oldfemale", "ring", "ofring", "ofr"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i369":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["magicextractionscroll", "extraction", "extract", "magicextraction", "magicextract", "mescroll", "mes"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i367":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["madgarsheart", "madgarheart", "heart", "<3", "mh"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i368":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["madgarsbone", "madgarbone", "mbone", "mb"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i370":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["pieceofbone", "piece", "bone", "pob"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i372":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["femalebone", "femaleb", "fb"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i223":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["healingwave1", "healingwave", "wave1", "wave", "hw1", "hw"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i270":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["design", "designblackskullarmor", "dbsa", "d:bsa"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i271":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["blackskull", "bskull", "bs"];
                        loot_dir[loot_dir.length - 1].Exp =  25;
                        break;
                    case "i272":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["kooiicardq", "cardq", "kcq", "q"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i273":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["kooiicardk", "cardk", "kck", "k"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i373":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["thickbandage", "thick", "bandage", "tb"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i374":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sleepykooiidoll", "kooiidoll", "doll", "skd"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i375":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wellbeingherbbread", "wellbeing", "herb", "bread", "wbhb", "whb"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i378":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dongryujuice", "dongryu", "juice", "djuice", "dj"];
                        loot_dir[loot_dir.length - 1].Exp = 2;
                        break;
                    case "i207":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["icelance1", "icelance", "lance1", "lance", "il1", "il"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i274":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["kooiicarda", "carda", "kca", "a"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i376":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["awakenkooiidoll", "awaken", "kooiidoll", "doll", "akd", "adoll"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i211":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["flameofkataru1", "flameofkataru", "kataru1", "kataru", "kat1", "kat", "fok1", "fok"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i220":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["curseofdoom2", "curseofdoom", "curse", "curse2", "doom", "doom2", "cod", "cod2"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i377":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lizardleather", "lizleather", "lleather", "ll"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i276":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["designhighlevelbone", "highlevelbone", "design", "dhlb", "high", "hlb"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i068":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["willofelemental", "willofelemental2", "will2", "will", "woe2", "woe"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i075":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hardenbody1", "hardenbody", "harden1", "harden", "hb1", "hb"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i231":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["firestorm1", "firestorm", "storm1", "storm", "fs1", "fs"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i232":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["firestorm2", "firestorm", "storm2", "storm", "fs2", "fs"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i277":;
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ancientexperimenttoken", "experimenttoken", "token", "aet"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i204":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["carnivalize2", "carnivalize", "carn2", "carn"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i380":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hallwaykey", "hallway", "key", "hwkey", "hwk"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i381":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["piratecoin", "pcoin", "pc"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i278":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["piratecarda", "carda", "pca", "a"]
                        loot_dir[loot_dir.length - 1].Exp =  25;
                        break;
                    case "i040":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wildcharge2", "wildcharge", "wc2", "wc"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i413":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bulldozerstailbone", "tailbone", "bdtb", "tb", "btb"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i112":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["impactshot2", "impactshot", "impact2", "impact", "imp2", "imp"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i279":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ravenfeather", "rfeather", "raven", "feather", "rf"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i280":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["kamakeetoken", "kamakee", "token", "kt"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i281":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["nutritionbeverage", "nutrition", "beverage", "bev", "nut", "nb"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i053":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["toughness", "tough", "toughness3", "tough3"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i049":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["slam3", "slam"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i113":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["impactshot3", "impactshot", "impact3", "impact", "imp", "imp3"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i121":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sharpeye3", "sharpeye", "sharp3", "sharp", "se3", "se"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i201":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["flare3", "flare"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i064":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lastresistance2", "lastresistance", "last2", "last", "lr2", "lr"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i137":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["stoneskin3", "stoneskin", "stone3", "stone", "ss3", "ss"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i213":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["flameofkataru3", "flameofkataru", "kataru3", "kataru", "kat3", "kat"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i178":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shield4", "shieldiv", "siv", "s4"];
                        loot_dir[loot_dir.length - 1].Exp = 500;
                        break;
                    case "i148":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["souldrainshot2", "souldrainshot", "soul2", "soul", "sds2", "sds"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i382":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["beesting", "sting", "bsting", "bs"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i383":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ironore", "ore", "iore", "io"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i080":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["stampede2", "stampede", "stamp2", "stamp"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i282":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["threadofmagic", "thread", "magic", "tom"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i283":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dezorubasdesign", "design", "dezorubas", "dezodesign", "dd"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i384":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["thickleather", "thick", "leather", "tleather", "tl"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i088":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["heavystrike2", "heavystrike", "heavy2", "heavy", "hs2", "hs"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i252":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["neutralize2", "neutralize", "neut2", "neut"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i284":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hqabrasive", "hqabr", "hqa", "hq"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i414":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["youngfoxstail", "young", "foxstail", "foxtail", "yft"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i236":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["silence2", "silence", "sil2", "sil"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i084":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shoutofcalmness2", "shoutofcalmness", "shout2", "shout", "calmness2", "calmness", "soc2", "soc"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i240":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sarasblessing2", "sarasblessing", "sara2", "sara", "sb2", "sb"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i152":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["clarity2", "clarity", "clar2", "clar"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i247":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hellfire1", "hellfire", "hf1", "hf"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i251":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["neutralize1", "neutralize", "neut1", "neut"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i286":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["jodesdesign", "jodes", "design", "jode", "jd"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i248":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hellfire2", "hellfire", "hf2", "hf"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i156":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["powershot2", "powershot", "ps2", "ps"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i386":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["specialcottoncloth", "specialcloth", "cottoncloth", "cotton", "cloth", "scc"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i385":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["blackironore", "blackore", "ironore", "bio", "black", "iron", "ore"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i395":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["skybatwing", "skybat", "wing", "batwing", "sbw"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i388":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["nut"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i389":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bolt"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i390":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["magicmarble", "marble", "mmarble", "mm"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i288":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shinningmetal", "shiningmetal", "shinning", "shining", "metal", "sm"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i391":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["gunpowder", "gun", "powder", "gpowder", "gp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i392":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["stonepowder", "stone", "powder", "spowder", "sp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i393":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["elementcrystal", "element", "ecrystal", "ec"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i290":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ancientwood", "awood", "wood", "ancwood", "aw"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i394":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["gargoylewing", "gargoyle", "wing", "garg", "gwing", "gw"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i293":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["titaniumingot", "titingot", "ingot", "tingot", "ti"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i076":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hardenbody2", "hardenbody", "harden2", "harden", "hb2", "hb"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i295":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["theperfectdarkness", "perfectdarkness", "perfect", "tpd"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i397":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["soulstone", "soul", "sstone", "ss"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i296":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["caligosscale", "caligoscale", "cscale", "scale", "cs"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i297":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["caligosbone", "caligobone", "cbone", "bone", "cb"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i298":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["caligoshands", "caligohands", "hands", "hand", "chand", "ch"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i299":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["caligoboots", "cboots", "boots", "cboot", "boot"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i300":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wayoftwohands1p", "twohands1p", "twoth1p", "1p", "twohands"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i301":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["aboutlevitation2p", "aboutlevitation", "levitation", "about", "levitate", "al2p", "2p"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i302":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bullseye3p", "bullseye", "be3p", "be", "3p"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i303":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["blackjunoshorn", "bjhorn", "bjh"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i304":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ancientleather", "ancleather", "aleather", "leather", "al"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i305":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["designblackjunoshelmet", "design", "dbjh"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i306":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["frostironore", "frost", "ironore", "ore", "fio"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i355":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["adventurersbag", "adventurerbag", "adventurer", "adventure", "bag", "abag", "ab"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i071":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["fatalattack1", "fatalattack", "fatal1", "fatal", "fa1", "fa"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i143":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["instinctstimulus1", "instinctstimulus", "instinct1", "instinct", "stimulus1", "stimulus", "is1", "is"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i307":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["designcrystalrobe", "design", "crystalrobe", "dcr"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i308":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["frostironrefiningtool", "refiningtool", "refining", "tool", "firt", "refine"]
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i309":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["aboutlevitation3p", "aboutlevitation", "levitation", "about", "al3p", "al", "3p"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i310":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["thewayoftwohands2p", "twohands", "wayoftwohands", "twoth2p", "th2p", "2p"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i311":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bullseye1p", "bullseye", "be1p", "be", "1p"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i312":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wadangkasseal", "wadangkaseal", "wseal", "seal", "ws"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i313":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["soulpowder", "soul", "powder", "spowder", "sp"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i140":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["amplifysense2", "amplifysense", "amplify2", "amplify", "as2", "as"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i314":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["poisonousbeestine", "beesting", "sting", "poisonsting", "pbs"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i315":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sealoftheforestkeeper", "forestkeeper", "seal", "sofk", "sfk"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i399":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["froggybloody", "froggy", "blood", "fblood", "fb"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i400":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["poisonpouch", "poison", "pouch", "pp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i352":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["swamptreasure", "treasure", "swamp", "streasure", "st"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i316":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["essenceofcorruption", "essence", "corruption", "corrupt", "eoc", "ec"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i317":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["specialmagicalrobe", "specialrobe", "magicalrobe", "smrobe", "smr"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i353":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mazetreasure", "maze", "treasure", "mtreasure", "mt"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i318":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["fadedring", "faded", "ring", "fring", "fr"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i401":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hopefulmagicessence", "hopeful", "magicessence", "esssence", "hope", "hme"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i402":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["crownrockexperimentbottle", "experimentbottle", "bottle", "experiment", "creb", "eb"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i319":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ancientmagicpowder", "magicpowder", "powder", "amp"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i510":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["superhealingpotion", "superhealing", "shp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i511":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["supermanapotion", "supermana", "smp"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i320":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["starpiece", "spiece", "piece"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i321":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["starpowder", "spowder"];
                        loot_dir[loot_dir.length - 1].Exp = 25;
                        break;
                    case "i322":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["brokennecklace", "broken", "necklace", "neck", "bn"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i354":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["snowfieldaltartreasure", "snowfield", "altartreasure", "treasure", "sfatreasure", "sfat"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i338":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["executionrune", "execution", "execute", "exe", "er"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i339":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["torturerune", "torture", "tort", "tr"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i340":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["biomagicpowerrune", "biomagicpower", "biomagic", "bmpr"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i341":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["fivecoloredleather", "fivecolored", "five", "fcleather", "fcl"];
                        loot_dir[loot_dir.length - 1].Exp = 50;
                        break;
                    case "i342":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["enchantedbone", "enchantbone", "ebone", "bone"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i343":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["enchantedleather", "echantleather", "eleather", "el"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i330":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["abyssguardtoken", "abyss", "guardtoken", "token", "agt"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i331":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["manacore", "core", "mcore", "mc"];
                        loot_dir[loot_dir.length - 1].Exp = 15;
                        break;
                    case "i332":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["grudgefulparchment", "grudgeful", "grudge", "parchment", "parch", "gp"];
                        loot_dir[loot_dir.length - 1].Exp = 10;
                        break;
                    case "i333":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["stainedexperimentjournal", "stained", "experimentjournal", "experiment", "journal", "sej"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i334":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["magicpowerbreath", "magicpower", "breath", "mpb"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i335":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mercyrune", "mercy", "mrune", "mr"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i336":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["penitencerune", "penitence", "penrune", "prune", "pr"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i337":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["resurrectionrune", "resurrection", "ressurect", "rrune", "rr"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i325":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["3rdcore", "3core", "third", "3rd", "3c"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i326":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["4thcore", "4core", "fourth", "4th", "4c"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i327":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["5thcore", "5core", "fifth", "5th", "5c"];
                        loot_dir[loot_dir.length - 1].Exp = 5;
                        break;
                    case "i217":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["prayerofprotection3", "prayer3", "prayerofprotection", "prayer", "pop3", "pop"];
                        loot_dir[loot_dir.length - 1].Exp = 400;
                        break;
                    case "i411":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["brokenmolar", "broken", "molar", "bm"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i534":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["discoloredheart", "discolored", "heart", "dh"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                        break;
                    case "i535":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["prohibitedexperimentjournal", "experimentjournal", "prohibited", "experiment", "journal", "pej"];
                        loot_dir[loot_dir.length - 1].Exp = 100;
                    }
            }else{
                var equip_file = JSON.parse(fs.readFileSync("./Equipment_Data/" + Element.split(" ")[0] + ".json", "utf8"));
                loot_dir[loot_dir.length] = {
                    id: Element,
                    Title: equip_file.Title,
                    Shortcuts: [],
                    Exp: equip_file.Exp
                }
                switch(Element){
                    case "e176":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["caninering", "canine", "ring", "cr"];
                        break;
                    case "e003":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["caninetoothofmadness", "canine", "toothofmadness", "sword", "ctom", "ctm"];
                        break;
                    case "e191":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bulldozercloak", "cloak", "bdcloak", "bdc", "bc"];
                        break;
                    case "e164":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sparklingnecklace", "sparkling", "spark", "necklace", "neck", "sn"];
                        break;
                    case "e070":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mushroomrobe", "mushrobe", "robe", "mr"];
                        break;
                    case "e206":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["fungiskinshield", "fungiskin", "shield", "fshield", "fs"];
                        break;
                    case "e004":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["longsword", "long", "sword", "lsword", "ls"];
                        break;
                    case "e019":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["compositebow", "composite", "comp", "bow", "cbow", "cb"];
                        break;
                    case "e034":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["magicianstaff", "magician", "mag", "staff", "mstaff", "wand", "ms"];
                        break;
                    case "e002":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bluntshortsword", "blunt", "shortsword", "bluntsword", "bss"];
                        break;
                    case "e020":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["swirlingbow", "swirling", "swirl", "bow"];
                        break;
                    case "e051":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bonearmor", "barmor", "ba"];
                        break;
                    case "e005":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sharplongsword", "sharplong", "sharp", "sword", "slsword", "sls"];
                        break;
                    case "e167":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["darkskull", "dskull", "ds"];
                        break;
                    case "e207":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["skullshield", "shield", "ss"];
                        break;
                    case "e144":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["powergloves", "pgloves", "power", "gloves", "pg"];
                        break;
                    case "e061":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lizardleatheramor", "lizardarmor", "lizardarm", "llarmor", "llarm", "lla"];
                        break;
                    case "e006":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["katana", "kata", "sword"];
                        break;
                    case "e021":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["greatbow", "great", "gbow", "bow"];
                        break;
                    case "e036":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["noviceshamanswand", "novice", "shamans", "shaman", "wand", "nsw"];
                        break;
                    case "e193":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["cloakofhalfdeath", "halfdeath", "cohd", "half"];
                        break;
                    case "e194":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["cloakofdeath", "cod", "death"];
                        break;
                    case "e200":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["beltofregeneration", "belt", "regeneration", "regen", "bor"];
                        break;
                    case "e007":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["vikingsword", "viking", "vik", "sword", "vs"];
                        break;
                    case "e022":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["classicbow", "classic", "class", "cbow", "bow", "cb"];
                        break;
                    case "e037":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shamanswand", "shamanwand", "shamans", "shamans", "wand", "swand", "sw"];
                        break;
                    case "e110":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shamanshat", "shamans", "shaman", "hat", "shat", "sh"];
                        break;
                    case "e179":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["guardiansring", "guardianring", "guardians", "guardian", "ring", "gring", "gr"];
                        break;
                    case "e008":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["gladius", "glad", "sword"];
                        break;
                    case "e023":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hunterbow", "hunter", "hunt", "bow", "hbow", "hb"];
                        break;
                    case "e038":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mysticwand", "mystic", "wand", "myst", "mwand", "mw"];
                        break;
                    case "e117":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wingwingboots", "wingwing", "wwboots", "wwboot", "wwb"];
                        break;
                    case "e086":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["piratehat", "phat", "hat"];
                        break;
                    case "e170":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["piratenecklace", "necklace", "neck"];
                        break;
                    case "e214":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["piratering", "ring", "pring"];
                        break;
                    case "e130":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["heavyironboots", "heavy", "boots", "boot", "iron", "hib"];
                        break;
                    case "e210":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["towershield", "tower", "shield", "tshield", "ts"];
                        break;
                    case "e010":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["rapier", "rap", "sword"];
                        break;
                    case "e025":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["hornbow", "horn", "bow"];
                        break;
                    case "e040":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["spiritualwand", "spiritual", "spirit", "wand", "swand"];
                        break;
                    case "e041":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wandofchaos", "chaos", "wand", "woc"];
                        break;
                    case "e211":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["ironcoveredshield", "ironcovered", "covered", "shield", "ics"];
                        break;
                    case "e012":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["darksteelsword", "darksteel", "sword", "dssword", "dss"];
                        break;
                    case "e027":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["dezorubasbow", "dezorubabow", "dezobow", "dezoruba", "dezo"];
                        break;
                    case "e042":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wandoftranquility", "wand", "tranquility", "tranq"];
                        break;
                    case "e212":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["darksteelshield", "darksteel", "shield", "dsshield", "dss"];
                        break;
                    case "e011":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["runeblade", "rune", "blade", "rb", "sword"];
                        break;
                    case "e026":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["battlebow", "battle", "bbow", "bow", "bb"];
                        break;
                    case "e043":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["holeofsilence", "silence", "hole", "wand", "hos"];
                        break;
                    case "e013":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["warsword", "wsword", "sword", "ws"];
                        break;
                    case "e028":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["warbow", "wbow", "bow", "wb"];
                        break;
                    case "e014":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["kaisor", "kai", "sword"];
                        break;
                    case "e029":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shadowbow", "shadow", "shad", "bow"];
                        break;
                    case "e044":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["staffstruckbylightning", "staffstuckbylightning", "staff", "lightning", "stuck", "struck", "ssbl"];
                        break;
                    case "e163":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["mothernature", "mother", "nature", "mn", "necklace", "neck"];
                        break;
                    case "e136":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["shoesoftranquility", "tranquility", "tranq", "shoes", "shoe", "sot"];
                        break;
                    case "e137":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["titaniumboots", "titboots", "boots", "boot", "tboots", "tb"];
                        break;
                    case "e135":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["bootsofdarkness", "boots", "boot", "darkness", "bod"];
                        break;
                    case "e203":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["otherworldbelt", "otherworld", "owbelt", "belt", "owb"];
                        break;
                    case "e063":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sturdyyetiarmor", "sturdyyeti", "yeti", "yetiarmor", "sya"];
                        break;
                    case "e148":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["seruangsheart", "seruangs", "seruang", "heart", "sheart", "sh"];
                        break;
                    case "e215":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["helmofthegreyboulder", "helm", "greyboulder", "hgb", "grey", "boulder"];
                        break;
                    case "e216":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["capoftheblueforest", "cap", "hat", "blueforest", "cbf"]
                        break;
                    case "e052":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["armorofthegreyboulder", "greyboulder", "aotgb", "agb", "grey", "boulder"];
                        break;
                    case "e062":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lightarmoroftheblueforest", "blueforest", "lightarmor", "forest", "laotbf", "labf"];
                        break;
                    case "e075":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["robeofthebluewaterfall", "robe", "bluewaterfall", "waterfall", "rotbw", "rbw", "rbwf"];
                        break;
                    case "e195":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["passionatecloak", "passionate", "passion", "cloak"];
                        break;
                    case "e134":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["snowyfieldscursedboots", "snowy", "boots", "cursed", "sfcb", "cb"];
                        break;
                    case "e132":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sharkungreaves", "sharkun", "greaves", "boots", "boot", "sg"];
                        break;
                    case "e213":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["spartanshield", "spartan", "sparta", "shield"];
                        break;
                    case "e147":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["thedeadsgloves", "deadsgloves", "deadgloves", "dead", "gloves", "tdg", "dg"];
                        break;
                    case "e035":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["wooparoopastaff", "wooparoopa", "wrstaff", "wrs"];
                        break;
                    case "e150":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["oatwillsleathergloves", "oatwillleather", "oatwill", "gloves", "olg"];
                        break;
                    case "e201":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["beltofbelief", "belief", "belt", "bob", "bb"];
                        break;
                    case "e131":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["monksboots", "monkboots", "monks", "monk", "boots", "boot", "mb"];
                        break;
                    case "e209":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["crystalshield", "crystal", "shield", "cshield", "cs"];
                        break;
                    case "e133":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["toxicboots", "toxic", "boots", "boot", "tox", "tb"];
                        break;
                    case "e154":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["irongolemgloves", "irongolem", "golemgloves", "igg"];
                        break;
                    case "e155":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["scoutgloves", "scout", "sgloves", "sg"];
                        break;
                    case "e156":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["sagesgloves", "sages", "sage", "sagegloves", "sg"];
                        break;
                    case "e160":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["glovesofpurification", "purification", "purify", "pure", "gop", "gp"];
                        break;
                    case "e161":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["glovesoftheforestelf", "forestelf", "elf", "gotfe", "gfe"];
                        break;
                    case "e162":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["gauntletsofvictory", "gauntlets", "gauntlet", "victory", "vict", "vic", "gov", "gv"];
                        break;
                    case "e015":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["burningblade", "burning", "burn", "sword", "blade", "bb"];
                        break;
                    case "e030":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["imperialbow", "imperial", "imp", "bow", "ib"];
                        break;
                    case "e045":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["holeofdestruction", "hole", "destruction", "hod", "destruct"];
                        break;
                    case "e138":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["snowfieldtracerboots", "snowfield", "tracer", "sftb", "stb"];
                        break;
                    case "e139":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["lightengravingshoes", "lightengraving", "engraving", "light", "les"];
                        break;
                    case "e140":
                        loot_dir[loot_dir.length - 1].Shortcuts = ["berserkerboots", "berserker", "berserk", "bb"];
                        break;
                }
            }
            monster_file.Loot_menu = loot_dir;
        })
        console.log(monster_file);
        fs.writeFileSync("./Monster_Data/" + Element.mID + ".json", JSON.stringify(monster_file, null, 4), "utf8");
    })
}

/*
Correct_User_Score();
function Correct_User_Score(){
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var users = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var boss_key = fs.readFileSync("./scores/score_key.txt").toString().split("\n");
    var users_arr = [];
    var loop = 0;
    users.Member_Objects.forEach(Element => {
        users_arr[users_arr.length] = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"));
        loop = 0;
        while(loop < boss_key.length){
            users_arr[users_arr.length - 1].Monster_Data[loop] = 0;
            loop++;
        }
    })
    loop = 0;
    var inloop = 0;
    var pos = null;
    while(loop < guilds.Guild_Objects.length){
        var log = JSON.parse(fs.readFileSync("./log/" + guilds.Guild_Objects[loop].id + "/log.json", "utf8"));
        log.Event_Arr.forEach(Element => {
            if(Element.log_type == "R" && Element.users.length > 0){
                var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
                inloop = 0;
                while(inloop < boss_key.length){
                    if(boss_key[inloop] == boss_file.Boss){
                        pos = inloop;
                        inloop = boss_key.length;
                    }
                    inloop++;
                }
                
                var user_pointer = null;
                inloop = 0;
                while(inloop < Element.users.length){
                    console.log("add point " + Element.users[inloop] + " for boss " + Element.mID);
                    user_pointer = parseInt(Element.users[inloop].slice(1,4), 10) - 1;
                    users_arr[user_pointer].Monster_Data[pos]++;
                    inloop++;
                }
            }
        })
        loop++;
    }
    loop = 0;
    while(loop < users_arr.length){
        fs.writeFileSync("./User_Data/" + users.Member_Objects[loop].id + ".json", JSON.stringify(users_arr[loop], null, 4), "utf8");
        loop++;
    }
}
*/


client.on('guildCreate', guild => {
    console.log('Joined new guild ' + guild.name);
    Join_Guild(guild);
})

client.on('guildDelete', guild => {
    console.log('Left guild ' + guild.name);
    //LeaveGuild(guild);
})

client.on('channelDelete', channel => {
    console.log('channel deleted #' + channel.name);
    Channel_Del(channel);
})

client.on('guildMemberRemove', guildMember => {

})

client.on('message', message => {
    var guild_data = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    if(message.guild != null){
        console.log(message.guild.name + "  #" + message.channel.name + " - " + message.content.toString());
    }
    var loop = 0;
    var guild_obj = null;
    if(message.guild == null){
        if(message.author.id != client.user.id){
            message.channel.send("Dan lacks motivation to code for commands in DMs, go bug him about it");
        }
    }else{
        while(loop < guild_data.Guild_Objects.length){
            if(guild_data.Guild_Objects[loop].discord == message.guild.id){
                guild_obj = guild_data.Guild_Objects[loop];
                loop = guild_data.Guild_Objects.length;
            }
            loop++;
        }
        if(guild_obj == null){
            Join_Guild(message.guild);
            guild_data = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
            //fetch the created guild object
            loop = 0;
            while(loop < guild_data.Guild_Objects.length){
                if(guild_data.Guild_Objects[loop].discord == message.guild.id){
                    guild_obj = guild_data.Guild_Objects[loop];
                    loop = guild_data.Guild_Objects.length;
                }
                loop++;
            }

        }
        var guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + guild_obj.id + '.json', 'utf8'));
        var ch_id = null;
        guild_file.Channel_Objects.forEach(Element => {
            if(Element.discord == message.channel.id){
                ch_id = Element;
            }
        })
        if(ch_id == null){
            if(message.content.includes(client.user.id)){
                New_Channel_Invite(message, guild_obj);
            }else{
                return;
            }
        }
        if(message.content.startsWith(guild_obj.key)){
            ProcessCommand(message, guild_file);
        }
        
        if(message.author.id == "252099253940387851"){
            console.log(message.content.length, message.content)
            if(message.content == 'init'){
                //Init_Timers();
            }else if(message.content == "run_archive"){
                archive_logs();
            }else if(message.content == "guild_join"){
                Guild_Home_Init(message.guild, guild_file);
            }else if(message.content == "test_archive"){
                clean_logs();
            }else if(message.content.split(" ")[0] == "console" && message.content.split(" ")[1] == "box" && message.content.split(" ").length == 3){
                New_Box(message.content.split(" ")[2]);
            }else if(message.content.split(" ")[0] == "console" && message.content.split(" ")[1] == "maint"){
                Raven_Maint();
            }else if(message.content.split(" ")[0] == "console" && message.content.split(" ")[1] == "boss" && message.content.split(" ").length == 3){
                New_Boss(message.content.split(" ")[2]);
            }
        }
    }
    
})

/*
function New_Server(){
    //this must be set manually
    var new_server = "KANOS";//THIS WILL NEED TO BE UPDATED
    var guilds_json = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    guilds_json.Guild_Objects.forEach(Element => {
        var notif_json = JSON.parse(fs.readFileSync("./notifs/" + Element.id + ".json", "utf8"));
        var loop = 1;//no need to add servers for notifs[0] since its for Battlefield and Siege
        while(loop < notif_json.notifs.length){
            notif_json.notifs[loop].notify_kanos = [];
            loop++;
        }
        fs.writeFileSync("./notifs/" + Element.id + ".json", JSON.stringify(notif_json, null, 4));
    })
    var notif_json = JSON.parse(fs.readFileSync("./notifs/g000.json", "utf8"));
    var loop = 1;
    while(loop < notif_json.notifs.length){
        notif_json.notifs[loop].notify_kanos = [];
        loop++;
    }
    fs.writeFileSync("./notifs/g000.json", JSON.stringify(notif_json, null, 4));
    fs.writeFileSync("./notifs/u000.json", JSON.stringify(notif_json, null, 4));
}*/

function Maint_Start(){
    var event = JSON.parse(fs.readFileSync("./maint/event.json", "utf8"));
    var next_maint = JSON.parse(fs.readFileSync("./maint/maint_next.json", "utf8"));
    console.log(next_maint);
    var maint_embed = new Discord.MessageEmbed()
        .setAuthor('TWOM Maintanence', key.image, key.website)
        .setTitle("**" + next_maint.Update_Title + "**");
    next_maint.Announcement_Data.forEach(Element => {
        maint_embed.addField("**" + Element.Title + "**", Element.Body);
    })
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    guilds.Guild_Objects.forEach(Element => {
        Init_Maint(maint_embed, Element.id, next_maint);
    })
}

async function Init_Maint(maint_embed, gID, maint_json){
    var channels = [];
    var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + gID + ".json", "utf8"));
    const guild = client.guilds.cache.get(guild_file.discord);
    guild_file.Channel_Objects.forEach(Element => {
        if(Element.Maint == true){
            channels[channels.length] = Element.discord;
        }
    })
    //var current_time = new Date.getTime();
    var messages = [];
    var duration_ms = 0;
    duration_ms = 3600000 * parseInt(maint_json.Maint_Duration.split(":")[0], 10);
    duration_ms = duration_ms + 60000 * parseInt(maint_json.Maint_Duration.split(":")[1], 10);
    duration_ms = duration_ms + 1000 * parseInt(maint_json.Maint_Duration.split(":")[2], 10);
    channels.forEach(Element => {
        var channel = client.channels.cache.get(Element);
        if(channel == undefined){
            console.log("error in ~ " + Element, gID);
        }else{
            channel.send(maint_embed);
        }
    })
}

function Raven_Maint(){
    const guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var announcement = "Raven is back up. Public data view has been added, view data submitted from other guilds in stats! More updates when I have time to write more code.";
    guilds.Guild_Objects.forEach(Element => {
        var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
        var loop = 0;
        var discord_guild = client.guilds.cache.get(guild_file.discord);
        while(loop < guild_file.Channel_Objects.length){
            if(guild_file.Channel_Objects[loop].Type == "home"){
                var chnl = discord_guild.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                chnl.send(announcement);
            }
            loop++;
        }
    })
    console.log('done');
}

function Init_Timers(){
    Reboot_Bosses();
    var date = new Date();
    var date_ms = date.getTime();
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
    //determine how long until the siege on wed & sat
    
    //determine how long until the time to run the weekly archive function
    var archive_log_baseline = 1641081599000;
    remain_ms = date_ms - archive_log_baseline;
    while(remain_ms > 604799999){
        remain_ms = remain_ms - 604800000;
    }
    console.log("archive_log: " + remain_ms + "ms");
    setTimeout(function(){
        archive_logs();
        setInterval(function(){
            archive_logs();
        }, 604800000)
    }, remain_ms)
    

}

function Reboot_Bosses(){
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var date = new Date()
    var date_ms = date.getTime()
    guilds.Guild_Objects.forEach(Element => {
        var log = JSON.parse(fs.readFileSync("./log/" + Element.id + "/log.json", "utf8"));
        var active_Arr = [];
        log.Event_Arr.forEach(Element => {
            if(Element.log_type == "R"){
                if(Element.respawn != null){
                    if(Element.respawn > date_ms){
                        active_Arr[active_Arr.length] = Element;
                    }
                }
            }
        })
        var guild_id = Element;
        active_Arr.forEach(Element => {
            console.log(Element);
            var delay = Element.respawn - date_ms;
            var boss_obj = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
            var report_obj = {
                type: "mosnter",
                lID: Element.id,
                boss: boss_obj.Boss,
                map: boss_obj.Map,
                mID: Element.mID,
                server: Element.server,
                death: Element.death,
                respawn: Element.respawn,
                report: Element.respawn,
                guild: guild_id.id,
                home_guild: guild_id.discord,
                home_channel: Element.home_channel,
                home_reply: null,
                author: Element.author,
                users: Element.users,
                image: boss_obj.Image
            }
            if(Element.home_reply != null){
                var channel = client.channels.cache.get(Element.home_channel);
                var rply_msg = channel.messages.cache.get(Element.home_reply);
                report_obj.home_reply = Element.home_reply;
                Report_Reply(rply_msg, report_obj, rply_msg);
            }
            setTimeout(function(){
                Warning(report_obj, 0);
            }, delay)
            if(delay > 86400000){
                setTimeout(function(){
                    Warning(report_obj, 3);
                }, delay - 86400000)
            }
            if(delay > 3600000){
                setTimeout(function(){
                    Warning(report_obj, 2);
                }, delay - 3600000)
            }
            if(delay > 300000){
                setTimeout(function(){
                    Warning(report_obj, 1);
                }, delay - 300000)
            }
        })
    })
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
        var bf_Embed = new Discord.MessageEmbed()
            .setTitle("We are taking reservations for the Battlefield!")
            .setThumbnail("https://i.imgur.com/ERlJG9H.png");
        guilds.Guild_Objects.forEach(Element => {
            guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + Element.id + '.json', 'utf8'));
            bf_Embed.setColor(guild_file.color);
            loop = 0;
            while(loop < guild_file.Channel_Objects.length){
                if(guild_file.Channel_Objects[loop].Battlefield == true){
                    if(guild_file.Channel_Objects[loop].color != null){
                        bf_Embed.setColor(guild_file.Channel_Objects[loop].color);
                    }
                    profiles = [];
                    var notif_file = JSON.parse(fs.readFileSync("./notifs/" + guild_file.id + ".json", "utf8"));
                    notif_file.notifs[0].notify_battlefield.forEach(Element => {
                        var User_json = JSON.parse(fs.readFileSync("./User_Data/" + Element + ".json", "utf8"));
                        profiles[profiles.length] = client.users.cache.get(User_json.User_Object.discord);
                        /*
                        if(User_json.User_Object.alt.length > 0){
                            var inloop = 0;
                            while(inloop < User_json.alt.length){
                                profiles[profiles.length] = client.users.cache.get(User_json.alt[inloop]);
                                inloop++;
                            }
                        }*/
                    })
                    channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                    if(profiles.length > 0){
                        channel.send("Battlefield in 10 minutes\n" + profiles, bf_Embed);
                    }else{
                        channel.send(bf_Embed);
                    }
                }
                loop++;
            }
        })
    }
}

function bf_one_minute(){
    var guilds = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    var maint = JSON.parse(fs.readFileSync('./Monster_Data/Maint.json', 'utf8'));
    if(maint.is_Maint == false){
        var guild_file = null;
        var loop = 0;
        var notif_file = null;
        var profiles = [];
        var channel = null;
        var bf_Embed = new Discord.MessageEmbed()
            .setTitle("The battle at Wingstrom Battlefield will begin in a few minutes")
            .setThumbnail("https://i.imgur.com/ERlJG9H.png");
        guilds.Guild_Objects.forEach(Element => {
            guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + Element.id + '.json', 'utf8'));
            bf_Embed.setColor(guild_file.color);
            loop = 0;
            while(loop < guild_file.Channel_Objects.length){
                if(guild_file.Channel_Objects[loop].Battlefield == true){
                    if(guild_file.Channel_Objects[loop].color != null){
                        bf_Embed.setColor(guild_file.Channel_Objects[loop].color);
                    }
                    profiles = [];
                    var notif_file = JSON.parse(fs.readFileSync("./notifs/" + guild_file.id + ".json", "utf8"));
                    notif_file.notifs[0].notify_battlefield.forEach(Element => {
                        var User_json = JSON.parse(fs.readFileSync("./User_Data/" + Element + ".json", "utf8"));
                        profiles[profiles.length] = client.users.cache.get(User_json.discord);
                        if(User_json.User_Object.alt.length > 0){
                            var inloop = 0;
                            while(inloop < User_json.alt.length){
                                profiles[profiles.length] = client.users.cache.get(User_json.alt[inloop]);
                                inloop++;
                            }
                        }
                    })
                    channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                    if(profiles.length > 0){
                        channel.send("Battlefield in 1 minute\n" + profiles, bf_Embed);
                    }else{
                        channel.send(bf_Embed);
                    }
                }
                loop++;
            }
        })
    }
}

function bf_warning(){
    var guilds = JSON.parse(fs.readFileSync('./Guild_Data/guilds.json', 'utf8'));
    var maint = JSON.parse(fs.readFileSync('./Monster_Data/Maint.json', 'utf8'));
    var bf_Embed = new Discord.MessageEmbed()
        .setTitle("Battlefield Has begun!")
        .setThumbnail("https://i.imgur.com/kBbcenJ.png")
    if(maint.is_Maint == false){
        var guild_file = null;
        var loop = 0;
        var notif_file = null;
        var profiles = [];
        var channel = null;
        guilds.Guild_Objects.forEach(Element => {
            guild_file = JSON.parse(fs.readFileSync('./Guild_Data/' + Element.id + '.json', 'utf8'));
            bf_Embed.setColor(guild_file.color);
            loop = 0;
            while(loop < guild_file.Channel_Objects.length){
                if(guild_file.Channel_Objects[loop].Battlefield == true){
                    if(guild_file.Channel_Objects[loop].color != null){
                        bf_Embed.setColor(guild_file.Channel_Objects[loop].color);
                    }
                    channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                    channel.send(bf_Embed);
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

function clean_logs(){
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var guilds_objs_Arr = [];
    guilds.Guild_Objects.forEach(Element => {
        guilds_objs_Arr[guilds_objs_Arr.length] = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
    })
    var users = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var user_objs_Arr = [];
    users.Member_Objects.forEach(Element => {
        user_objs_Arr[user_objs_Arr.length] = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"));
    })
    var logs_Arr = [];
    guilds.Guild_Objects.forEach(Element => {
        logs_Arr[logs_Arr.length] = JSON.parse(fs.readFileSync("./log/" + Element.id + "/log.json", "utf8"));
    })
    var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    var equip_dir = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    var monster_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var loot_dir = JSON.parse(fs.readFileSync("./menus/loot.json", "utf8"));
    var box_dir = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
    //all directories loaded
    //proceed to clean logs
    //remove and file all log entries older than one week and move them to appropriate directories
    //create an analysis of logged data
    //generate list of top farmers from the past week by tallying exp gained from items reported
    //generate list of top guilds from the past week by tallying exp gained from items reported
    //generate most reported box
    //generate most reported boss
    //generate most reported equip
    //generate top global items for data that is now public
    var new_public_data_key = [];
    monster_dir.Boss_Select.forEach(Element => {
        new_public_data_key[new_public_data_key.length] = Element.mID;
    })
    equip_dir.Equip_Objects.forEach(Element => {
        new_public_data_key[new_public_data_key.length] = Element.eID;
    })
    box_dir.Box_Objects.forEach(Element => {
        new_public_data_key[new_public_data_key.length] = Element.bID;
    })
    var Embeds_Arr = [];
    guilds_objs_Arr.forEach(Element => {
        Embeds_Arr[Embeds_Arr.length] = new Discord.MessageEmbed()
            .setAuthor("Weekly Roundup", key.image, key.website)
            .setTitle("**" + Element.Guild_Name + " Weekly Report**")
            .setColor(Element.color);
        if(Element.emoji != null){
            Embeds_Arr[Embeds_Arr.length - 1].setTitle("**" + Element.emoji + " " + Element.Guild_Name + " Weekly Report**");
        }
    })
    var cut_off_date = Date.now() - 604800000;
    var loop = 0;
    while(loop < logs_Arr.length){
        var trimmed_log = []
        logs_Arr[loop].Event_Arr.forEach(Element => {

        })
    }
}

function archive_logs(){
    //gather data
    var date = new Date();
    var date_ms = date.getTime();
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var log_Arrs = [];
    var cut_off_log_Arrs = [];
    var public_status = [];
    var new_public_data = [];
    var gID_Arr = [];
    //at the end of this we will want two data sets. total new public data & guild-specific data to calculate weekly scores
    var loop = null;
    guilds.Guild_Objects.forEach(Element => {
        var guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
        gID_Arr[gID_Arr.length] = Element.id;
        log_Arrs[log_Arrs.length] = JSON.parse(fs.readFileSync("./log/" + Element.id + "/log.json", "utf8"));
        //store old log _ just incase
        fs.writeFileSync("./log/" + Element.id + "/" + date_ms + "_log.json", JSON.stringify(log_Arrs[log_Arrs.length - 1], null, 4), "utf8");
        public_status[public_status.length] = guild_obj.private_data;//a guild set to private will be boolean true
    })
    //cut data
    var date = new Date();
    var date_ms = date.getTime();
    var cut_off = date_ms - 604800000;
    loop = 0;
    while(loop < log_Arrs.length){
        var trimmed_Event_Array = [];
        var to_stat_archive = [];
        log_Arrs[loop].Event_Arr.forEach(Element => {
            console.log('filing... [' + gID_Arr[loop] + "] " + Element.id);
            if(Element.report < cut_off && Element.log_type != "L" && Element.log_type != "D" && Element.users.length > 0){
                to_stat_archive[to_stat_archive.length] = Element;
                if(public_status[loop] == false && Element.log_type != "L" && Element.log_type != "D"){
                    new_public_data[new_public_data.length] = Element;
                }
            }else if(Element.report > cut_off){
                trimmed_Event_Array[trimmed_Event_Array.length] = Element;
            }
        })
        log_Arrs[loop].Event_Arr = trimmed_Event_Array;
        cut_off_log_Arrs[loop] = {
            Event_Arr: to_stat_archive
        };
        loop++;
    }
    //final results include:
    //log_Arrs is an array of all data from the past week that will remain in recent logs
    //cut_off_log_Arrs is an array of all data over a week old that will be sent to stat archives
    //new_public_data is an array of all data that is now viewable to all guilds
    
    //file all week+ old data to stat archives
    loop = 0;
    while(loop < cut_off_log_Arrs.length){
        cut_off_log_Arrs[loop].Event_Arr.forEach(Element => {
            if(Element.log_type == "R"){
                var stat_Arr = JSON.parse(fs.readFileSync("./stats/" + gID_Arr[loop] + "/Monster_Data/" + Element.mID + ".json", "utf8"));
                var reduced_log = {
                    server: Element.server,
                    death: Element.death,
                    users: Element.users,
                    home_channel: Element.home_channel,
                    author: Element.author,
                    loot: Element.loot
                }
                stat_Arr.History_Arr[stat_Arr.History_Arr.length] = reduced_log;
                //console.log("writing... " + JSON.stringify(stat_Arr, null, 4) + "\nNew Addition: " + JSON.stringify(reduced_log, null, 4));
                fs.writeFileSync("./stats/" + gID_Arr[loop] + /Monster_Data/ + Element.mID + ".json", JSON.stringify(stat_Arr, null, 4), "utf8");
            }else if(Element.log_type == "B"){
                var stat_Arr = JSON.parse(fs.readFileSync("./stats/" + gID_Arr[loop] + "/Box_Data/" + Element.bID + ".json", "utf8"));
                var reduced_log = {
                    server: Element.server,
                    report: Element.report,
                    users: Element.users,
                    count: Element.count,
                    contents: Element.contents
                }
                stat_Arr.History_Arr[stat_Arr.History_Arr.length] = reduced_log;
                //console.log("writing... " + JSON.stringify(stat_Arr, null, 4) + "\nNew Addition: " + JSON.stringify(reduced_log, null, 4));
                fs.writeFileSync("./stats/" + gID_Arr[loop] + "/Box_Data/" + Element.bID + ".json", JSON.stringify(stat_Arr, null, 4), "utf8");
            }
        })
        loop++;
    }
    //file all trimmed logs to appropriate files
    loop = 0;
    while(loop < log_Arrs.length){
        fs.writeFileSync("./log/" + gID_Arr[loop] + "/log.json", JSON.stringify(log_Arrs[loop], null, 4), "utf8");
        loop++;
    }
    //call report cards
    Weekly_Roundup(log_Arrs, new_public_data);
}

function Weekly_Roundup(log_Arrs, new_public_data){
    //create an embed to send to each guild that includes global stats and server-specific stats for the week
    //calculate guild rankings
    var scores = [];
    var loop = 0;
    var l_loop = null;
    var boss_json = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var box_json = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
    var equip_json = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    var equipment_files = [];
    var box_files = [];
    loop = 0;
    while(loop < box_json.Box_Objects.length){
        box_files[box_files.length] = JSON.parse(fs.readFileSync("./Box_Data/" + box_json.Box_Objects[loop].bID + ".json", "utf8"));
        loop++;
    }
    loop = 0;
    while(loop < equip_json.Equip_Objects.length){
        equipment_files[equipment_files.length] = JSON.parse(fs.readFileSync("./Equipment_Data/" + equip_json.Equip_Objects[loop].eID + ".json", "utf8"));
        loop++;
    }
    loop = 0;
    while(loop < log_Arrs.length){
        scores[loop] = 0;
        log_Arrs[loop].Event_Arr.forEach(Element => {
            if(Element.users.length > 0 && Element.log_type != "D" && Element.log_type != "L"){
                if(Element.log_type == "R"){
                    var m_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
                    scores[loop] = scores[loop] + m_file.Exp;
                    l_loop = 0;
                    while(l_loop < Element.loot.length){
                        if(Element.loot[l_loop] == "Gold"){
                            scores[loop]++;
                        }else if(Element.loot[l_loop].startsWith("Gold") && Element.loot[l_loop].split(" ").length == 2){
                            scores[loop] = scores[loop] + 5;
                        }else{
                            var sort = 0;
                            while(sort < m_file.Loot_menu.length){
                                if(Element.loot[l_loop].split(" ")[0] == m_file.Loot_menu[sort].id){
                                    if(Element.loot[l_loop].split(" ").length == 1 || Element.loot[l_loop].startsWith("e")){
                                        scores[loop] = scores[loop] + m_file.Loot_menu[sort].Exp;
                                    }else{
                                        scores[loop] = scores[loop] + (m_file.Loot_menu[sort].Exp * parseInt(Element.loot[l_loop].split(" ")[1].slice(1,-1), 10));
                                    }
                                }
                                sort++;
                            }
                        }
                        l_loop++;
                    }
                }else if(Element.log_type == "B"){
                    var b_file = JSON.parse(fs.readFileSync("./Box_Data/" + Element.bID + ".json", "utf8"));
                    scores[loop] = (b_file.Exp * Element.count) + scores[loop];
                }
            }
        })
        loop++;
    }
    var guilds_dir = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8")).Guild_Objects;
    var guild_files = [];
    guilds_dir.forEach(Element => {
        guild_files[guild_files.length] = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
    })
    //sort scores high to low
    loop = 0;
    l_loop = 0;
    var log_Arrs_sorted = [];
    log_Arrs.forEach(Element => {
        log_Arrs_sorted[log_Arrs_sorted.length] = Element;
    })
    var swap = null;
    while(loop < scores.length){
        l_loop = 1;
        while(l_loop < scores.length){
            if(scores[l_loop - 1] < scores[l_loop]){
                swap = scores[l_loop];
                scores[l_loop] = scores[l_loop - 1];
                scores[l_loop - 1] = swap;
                swap = guild_files[l_loop];
                guild_files[l_loop] = guild_files[l_loop - 1];
                guild_files[l_loop - 1] = swap;
                swap = log_Arrs_sorted[l_loop];
                log_Arrs_sorted[l_loop] = log_Arrs_sorted[l_loop - 1];
                log_Arrs_sorted[l_loop - 1] = swap;
            }
            l_loop++;
        }
        loop++;
    }
    //scores set for each server set
    //the rest of the data will be more guild - specific, break off into guild-based data
    //determine - player with most EXP
    //determine - most reported boss
    //determine - most reported box
    var Roundup_Embed_Arr = [];
    var filtered_guild_scores = [];
    var filtered_guild_files = [];
    var guild_rank_display = [];
    var log_Arr_Marker = 0;
    guild_files.forEach(Element => {
        //build arrays for each scoreboard
        console.log('building embed for ' + Element.Guild_Name);
        box_scores = [];
        boss_scores = [];
        user_scores = [];
        filtered_guild_scores = [];
        filtered_guild_files = [];
        loop = 0;
        var check = false;
        var home_guild_place = 0;
        while(loop < guild_files.length){//clean out guilds with private data from appearing on leaderboards in other guilds
            if(scores[loop] > 0){
                /*if(guild_files[loop].Guild_Name == Element.Guild_Name){
                    check = true;
                }*/
                if(guild_files[loop].private_data == false){
                    filtered_guild_scores[filtered_guild_scores.length] = scores[loop];
                    filtered_guild_files[filtered_guild_files.length] = guild_files[loop];
                }else if(guild_files[loop].private_data == true && guild_files[loop].id == Element.id){//dont delete a guild from their own leaderboard
                    filtered_guild_scores[filtered_guild_scores.length] = scores[loop];
                    filtered_guild_files[filtered_guild_files.length] = guild_files[loop];
                }
            }else if(guild_files[loop].id == Element.id){
                filtered_guild_scores[filtered_guild_scores.length] = scores[loop];
                filtered_guild_files[filtered_guild_files.length] = guild_files[loop];
                loop = guild_files.length;
            }
            loop++
        }
        /*
        if(check == false){
            loop = 0;
            while(loop < guild_files.length){
                if(guild_files[loop].Guild_Name == Element.Guild_Name){
                    home_guild_place = loop + 1;
                    loop = guild_files.length;
                }
                loop++;
            }
        }*/
        //remove guilds with a score of zero
        loop = 0;
        guild_rank_display = [];
        //console.log(filtered_guild_files);
        while(loop < filtered_guild_files.length){
            if(filtered_guild_files[loop].emoji == null){
                guild_rank_display[loop] = (loop + 1) + ". " + filtered_guild_files[loop].Guild_Name;
            }else{
                guild_rank_display[loop] = (loop + 1) + ". " + filtered_guild_files[loop].emoji + " " + filtered_guild_files[loop].Guild_Name
            }
            loop++;            
        }
        /*if(check == false){
            if(filtered_guild_files[home_guild_place - 1].emoji == null){
                guild_rank_display[home_guild_place - 1] = (home_guild_place) + ". " + filtered_guild_files[home_guild_place - 1].Guild_Name;
            }else{
                guild_rank_display[home_guild_place - 1] = (home_guild_place) + ". " + filtered_guild_files[home_guild_place - 1].emoji + " " + filtered_guild_files[loop].Guild_Name
            }
        }*/
        console.log(guild_rank_display);
        //Guild Rankings set
        //build user rankings for the guild
        //most farmed boss
        //most reported box
        var boss_count = [];
        var box_count = [];
        var equip_count = [];
        var guild_user_Arr = [];
        var boss_pointer = [];
        if(log_Arrs_sorted[log_Arr_Marker].Event_Arr.length > 0){//if no data was reported, do not bother anaylzing data
            loop = 0;
            while(loop < boss_json.Boss_Select.length){
                boss_count[boss_count.length] = 0;
                boss_pointer[boss_pointer.length] = boss_json.Boss_Select[loop].mID;
                loop++;
            }
            loop = 0;
            while(loop < box_json.Box_Objects.length){
                box_count[box_count.length] = 0;
                loop++;
            }
            loop = 0;
            while(loop < equip_json.Equip_Objects.length){
                equip_count[equip_count.length] = 0;
                loop++;
            }
            loop = 0;
            while(loop < Element.User_Objects.length){
                guild_user_Arr[guild_user_Arr.length] = 0;
                loop++;
            }
            loop = 0;
            var inloop = 0;
            var uloop = 0;
            var iloop = 0;
            console.log("analyzing log data for " + Element.Guild_Name);
            while(loop < log_Arrs_sorted[log_Arr_Marker].Event_Arr.length){
                //no need to analyze log_type "L" and log_type "D" as they branch out to log type R
                if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].log_type == "R"){
                    //add point to # of bosses killed (if users isnt length 0)
                    if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].users.length > 0){
                        //var reference = monster_files[parseInt(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].mID.slice(1,4), 10) - 1];
                        var reference = JSON.parse(fs.readFileSync("./Monster_Data/" + log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].mID + ".json", "utf8"));
                        if(parseInt(reference.id.slice(1,4), 10) > 140){
                            var pointer_loop = 139;
                            while(pointer_loop < boss_pointer.length){
                                if(reference.id == boss_pointer[pointer_loop]){
                                    boss_count[pointer_loop]++;
                                    pointer_loop = boss_pointer.length;
                                }
                                pointer_loop++;
                            }
                        }else{
                            boss_count[parseInt(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].mID.slice(1,4), 10) - 1]++;
                        }
                        inloop = 0;
                        while(inloop < guild_files[log_Arr_Marker].User_Objects.length){
                            if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].users.includes(guild_files[log_Arr_Marker].User_Objects[inloop].id)){
                                guild_user_Arr[inloop] = guild_user_Arr[inloop] + reference.Exp;
                                if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].loot.length > 0){
                                    uloop = 0;
                                    while(uloop < log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].loot.length){
                                        if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].loot[uloop] == "Gold"){
                                            guild_user_Arr[inloop] = guild_user_Arr[inloop]++;
                                        }else if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].loot[uloop].startsWith("Gold (")){
                                            guild_user_Arr[inloop] = guild_user_Arr[inloop] + 5;
                                        }else{
                                            iloop = 0;
                                            while(iloop < reference.Loot_menu.length){
                                                if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].loot[uloop] == reference.Loot_menu[iloop].id){
                                                    guild_user_Arr[inloop] = guild_user_Arr[inloop] + reference.Loot_menu[iloop].Exp;
                                                    iloop = reference.Loot_menu.length;
                                                }
                                                iloop++;
                                            }
                                        }
                                        uloop++;
                                    }
                                }
                            }
                            inloop++;
                        }
                    }
                }else if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].log_type == "B"){
                    var reference = box_files[parseInt(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].bID.slice(1,4), 10) - 1];
                    //box_count[parseInt(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].bID.slice(1,4), 10) - 1] + log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].count;
                    box_count[parseInt(reference.bID.slice(1, 4), 10) - 1] = box_count[parseInt(reference.bID.slice(1, 4), 10) - 1] + log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].count;
                    inloop = 0;
                    while(inloop < guild_files[log_Arr_Marker].User_Objects.length){
                        if(log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].users[0] == guild_files[log_Arr_Marker].User_Objects[inloop].id){
                            guild_user_Arr[inloop] = (log_Arrs_sorted[log_Arr_Marker].Event_Arr[loop].count * reference.Exp) + guild_user_Arr[inloop];
                            inloop = guild_files[log_Arr_Marker].User_Objects.length;
                        }
                        inloop++;
                    }
                }//will need to return to this if NPC and crafting data is ever added
                loop++;
            }
            console.log(box_count);
            //organize and trim scoreboards
            //user scores
            loop = 0;
            var guild_user_files = [];
            while(loop < guild_user_Arr.length){
                guild_user_files[guild_user_files.length] = JSON.parse(fs.readFileSync("./User_Data/" + Element.User_Objects[loop].id + ".json", "utf8"));
                loop++;
            }
            loop = 0;
            while(loop < guild_user_Arr.length){
                inloop = 1;
                while(inloop < guild_user_Arr.length){
                    if(guild_user_Arr[inloop - 1] < guild_user_Arr[inloop]){
                        swap = guild_user_Arr[inloop];
                        guild_user_Arr[inloop] = guild_user_Arr[inloop - 1];
                        guild_user_Arr[inloop - 1] = swap;
                        swap = guild_user_files[inloop];
                        guild_user_files[inloop] = guild_user_files[inloop - 1];
                        guild_user_files[inloop - 1] = swap;
                    }
                    inloop++;
                }
                loop++;
            }
            loop = 0;
            var user_display = [];
            while(loop < guild_user_Arr.length && loop < 10 && guild_user_Arr[loop] > 0){
                var string_length = guild_user_files[loop].User_Object.name.toString().length;
                var name_spacer = guild_user_files[loop].User_Object.name + " "
                while(name_spacer.length < 20){
                    name_spacer = name_spacer + "-";
                }
                user_display[loop] = (loop + 1) + ". " + guild_user_files[loop].User_Object.Emoji + " " + name_spacer + " " + guild_user_Arr[loop];
                loop++;
            }
            loop = 0;
            while(loop < boss_count.length){
                inloop = 1;
                while(inloop < boss_count.length){
                    if(boss_count[inloop - 1] < boss_count[inloop]){
                        swap = boss_count[inloop - 1];
                        boss_count[inloop - 1] = boss_count[inloop];
                        boss_count[inloop] = swap;
                        swap = boss_pointer[inloop - 1];
                        boss_pointer[inloop - 1] = boss_pointer[inloop];
                        boss_pointer[inloop] = swap;
                    }
                    inloop++;
                }
                loop++;
            }
            var boss_display = [];
            loop = 0;
            while(loop < boss_count.length && loop < 5 && boss_count[loop] > 0){
                var reference = JSON.parse(fs.readFileSync("./Monster_Data/" + boss_pointer[loop] + ".json", "utf8"));
                if(reference.Emoji == null){
                    boss_display[loop] = (loop + 1).toString() + ". " + reference.Boss;
                }else{
                    boss_display[loop] = (loop + 1).toString() + ". " + reference.Emoji + " " + reference.Boss;
                }
                loop++;
            }
            var box_pointer = [];
            loop = 0;
            while(loop < box_count.length){
                box_pointer[loop] = box_json.Box_Objects[loop].bID;
                loop++;
            }
            loop = 0;
            while(loop < box_count.length){
                inloop = 1;
                while(inloop < box_count.length){
                    if(box_count[inloop - 1] < box_count[inloop]){
                        swap = box_count[inloop - 1];
                        box_count[inloop - 1] = box_count[inloop];
                        box_count[inloop] = swap;
                        swap = box_pointer[inloop - 1];
                        box_pointer[inloop - 1] = box_pointer[inloop];
                        box_pointer[inloop] = swap;
                    }
                    inloop++;
                }
                loop++;
            }
            var box_display = [];
            loop = 0;
            while(loop < box_count.length && loop < 5 && box_count[loop] > 0){
                var reference = JSON.parse(fs.readFileSync("./Box_Data/" + box_pointer[loop] + ".json", "utf8"));
                if(reference.Emoji == null){
                    box_display[loop] = (loop + 1).toString() + ". " + reference.Title;
                }else{
                    box_display[loop] = (loop + 1).toString() + ". " + reference.Emoji + " " + reference.Title;
                }
                loop++;
            }
        }
        


        //create Embed
        Roundup_Embed_Arr[Roundup_Embed_Arr.length] = new Discord.MessageEmbed()
            .setAuthor("Black Raven Report", key.image, key.website)
            .setTitle("Weekly Roundup Report")
            .setColor(Element.color)
            .addField("<:SymbolofGuildmark:1167669905370390570> **Guild Rankings** <:SymbolofGuildmark:1167669905370390570>", guild_rank_display.join("\n"));
        if(guild_user_Arr.length > 0){
            if(Element.emoji == null){
                Roundup_Embed_Arr[Roundup_Embed_Arr.length - 1].addField(Element.Guild_Name + " User Scoreboard", user_display.join("\n"))
            }else{
                Roundup_Embed_Arr[Roundup_Embed_Arr.length - 1].addField(Element.emoji + " " + Element.Guild_Name + " User Scoreboard", user_display.join("\n"))
            }
            console.log(boss_display.join("\n"));
            if(boss_display.length > 0){
                Roundup_Embed_Arr[Roundup_Embed_Arr.length - 1].addField("Most Farmed Bosses", boss_display.join("\n"));
            }
            console.log(box_display.join("\n"));
            if(box_display.length > 0){
                Roundup_Embed_Arr[Roundup_Embed_Arr.length - 1].addField("Most Reported Treasures", box_display.join("\n"));
            }
            
        }
        loop = 0;
        var home_check = false;
        while(loop < Element.Channel_Objects.length){
            if(Element.Channel_Objects[loop].Type == "home"){
                var home_channel = null;
                home_check = true;
                home_channel = client.channels.cache.get(Element.Channel_Objects[loop].discord);
                if(home_channel != undefined){
                    home_channel.send(Roundup_Embed_Arr[Roundup_Embed_Arr.length - 1]);
                }
            }
            loop++;
        }
        if(home_check == false && Element.Channel_Objects.length > 0){
                var home_channel = client.channels.cache.get(Element.Channel_Objects[0].discord);
                home_channel.send("No home-type channel found, defaulting to " + Element.Channel_Objects[0].id);
                if(home_channel != undefined){
                    home_channel.send(Roundup_Embed_Arr[Roundup_Embed_Arr.length - 1]);
                }
            }
        log_Arr_Marker++;
    })
    
}

function Print_server_cards(){

}

/*
function file_to_archive(gID, Event_Array){
    var file = null;
    var reduced_event = null;
    console.log("guild ID " + gID + " filing to archive " + Event_Array.length + " items")
    Event_Array.forEach(Element => {
        if(Element.log_type == "R" && Element.users.length > 0){
            file = JSON.parse(fs.readFileSync("./stats/" + gID + "/Monster_Data/" + Element.mID + ".json", "utf8"));
            reduced_event = null;
            reduced_event = {
                server: Element.server,
                death: Element.death,
                users: Element.users,
                home_channel: Element.home_channel,
                author: Element.author,
                loot: Element.loot
            }
            file.History_Arr[file.History_Arr.length] = reduced_event;
            fs.writeFileSync("./stats/" + gID + "/Monster_Data/" + Element.mID + ".json", JSON.stringify(file, null, 4), "utf8");
        }else if(Element.log_type == "B"){
            file = JSON.parse(fs.readFileSync("./stats/" + gID + "/Box_Data/" + Element.bID + ".json", "utf8"));
            reduced_event = null;
            reduced_event = {
                server: Element.server,
                report: Element.report,
                users: Element.users,
                count: Element.count,
                contents: Element.contents
            }
            file.History_Arr[file.History_Arr.length] = reduced_event;
            fs.writeFileSync("./stats/" + gID + "/Box_Data/" + Element.bID + ".json", JSON.stringify(file, null, 4), "utf8");
        }
    })
}
*/


async function New_Channel_Invite(message, guild_obj){
    guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + guild_obj.id + ".json", "utf8"));
    var confirm_invite = new Discord.MessageEmbed()
        .setAuthor("Channel Registration", key.image, key.website)
        .setTitle("**Invite Black Raven to #" + message.channel.name + "?**")
        .setColor(guild_obj.color)
        .setDescription("To continue reply 'yes'");
    var confirm_reply = await message.channel.send(confirm_invite);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out.")
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                confirm_reply.delete(); 
            }
            return;
        }
        var reply = collected.first().content.toString().toLowerCase();
        console.log(collected.first().content);
        if(reply == "yes" || reply == "y"){
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                collected.first().delete();
                confirm_reply.delete();
            }
            New_Channel(message, guild_obj);
        }else{
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                collected.first().delete();
                confirm_reply.delete();
            }
            message.channel.send("Invite canceled.");
        }
    })
}

function New_Channel(message, guild_obj){
    guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + guild_obj.id + ".json", "utf8"));
    var ch_id = null;
    var check_id = null;
    var check = null;
    var loop = 1;
    while(ch_id == null){
        check_id = loop.toString();
        while(check_id.length < 3){
            check_id = '0' + check_id;
        }
        check_id = "ch" + check_id;
        check = false;
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.id == check_id){
                check = true;
            }
        })
        if(check == false){
            ch_id = check_id;
        }else{
            loop++;
        }
    }
    var channel_obj = {
        id: ch_id,
        discord: message.channel.id,
        Type: null,
        Server: null,
        Battlefield: false,
        Siege: false,
        Maint: false,
        Private: false,
        Color: null,
        Root: [],
        Boss_Warnings: true
    }
    guild_obj.Channel_Objects[guild_obj.Channel_Objects.length] = channel_obj;
    fs.writeFileSync("./Guild_Data/" + guild_obj.id + ".json", JSON.stringify(guild_obj, null, 4), "utf8");
    var confirmed_Embed = new Discord.MessageEmbed()
        .setAuthor("New Channel", key.image, key.website)
        .addField("**#" + message.channel.name + " Channel Settings**", "**Type:** not yet set\n**Server:** not yet set\n**Battlefield Reminders:** Off\n**Siege Battle Reminders:** Off\n**Maintanence Reminders:** Off\n**Private Timers:** Off\n**Color:** not yet set")
        .setColor(guild_obj.color)
        .setFooter("To change settings use '" + guild_obj.key + "settings channel'. For help use '" + guild_obj.key + "help channel");
    message.channel.send(confirmed_Embed);
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
        if(Element.startsWith('<@!')){
            loop = 0;
            check = false;
            while(loop < users.Member_Objects.length){
                if(users.Member_Objects[loop].discord == Element.slice(3, -1) || users.Member_Objects[loop].alt.includes(Element.slice(3, -1))){
                    check = true;
                    loop = users.Member_Objects.length;
                }
                loop++;
            }
        }else if(Element.startsWith('<@') && Element.startsWith("<@&") == false){
            loop = 0;
            check = false;
            while(loop < users.Member_Objects.length){
                if(users.Member_Objects[loop].discord == Element.slice(2, -1) || users.Member_Objects[loop].alt.includes(Element.slice(2, -1))){
                    check = true;
                    loop = users.Member_Objects.length;
                }
                loop++;
            }
        }
        if(check == false){
            if(Element.startsWith("<@!")){
                NewUser(message, guild_obj, Element.slice(3,-1));
            }else{
                NewUser(message, guild_obj, Element.slice(2,-1));
            }
        }
    })
    loop = 0;
    check = false;
    while(loop < users.Member_Objects.length){
        if(users.Member_Objects[loop].discord == message.author.id || users.Member_Objects[loop].alt.includes(message.author.id)){
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
        if(guild_obj.User_Objects[loop].discord == message.author.id || guild_obj.User_Objects[loop].alt.includes(message.author.id)){
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
        message.channel.send("Sorry the wiki is still under construction");
    }else if(cmd == 'dungeon' || cmd == "dung" || cmd == 'd'){
        Dungeon(message, guild_obj, in_Arr);
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
    }else if(cmd == 'help' || cmd == 'h'){
        Help(message, guild_obj, in_Arr);
    }else if(cmd == 'stat' || cmd == 'stats' || cmd == 's'){
        Stats(message, guild_obj, in_Arr);
    }else if(cmd == 'check' || cmd == 'c'){
        Check(message, guild_obj, in_Arr);
    }else if(cmd == 'channel' || cmd == 'channels'){
        Channel_Settings(message, guild_obj, in_Arr);
    }else if(cmd == 'settings' || cmd == 'setting'){
        Settings(message, guild_obj, in_Arr);
    }else if(cmd == 'guild'){
        Guild_Settings(message, guild_obj, in_Arr);
    }else if(cmd == "profile"){
        User_Profile(message, guild_obj, message.author.id);
    }else if(cmd == "exp" || cmd == "experience"){
        User_Exp(message, guild_obj);
    }else if(cmd == "lb" || cmd == "leaderboard"){
        leader_boards(message, guild_obj);
    }else if(cmd == "score"){
        Score(message, guild_obj, in_Arr);
    }else if(cmd == "time" || cmd == "t"){
        var date = new Date();
        var date_arr = [];
        date_arr[0] = date.getHours();
        date_arr[1] = date.getMinutes();
        date_arr[2] = date.getSeconds();
        date_arr[3] = date.getFullYear();
        date_arr[4] = date.getMonth() + 1;
        date_arr[5] = date.getDate();
        loop = 0;
        while(loop < date_arr.length){
            if(date_arr[loop] < 10){
                date_arr[loop] = "0" + date_arr[loop];
            }
            loop++;
        }
        message.channel.send(date_arr[3] + "-" + date_arr[4] + "-" + date_arr[5] + " " + date_arr[0] + ":" + date_arr[1] + ":" + date_arr[2]);
    }else if(cmd == "spawn" || cmd == "sp" || cmd == "st" || cmd == "spawntime"){
        Check_Spawn(message, guild_obj, in_Arr);
    }else if(cmd == "history" || cmd == "hist" || cmd == "h"){
        history(message, guild_obj, in_Arr);
    }else if(cmd == "memberlist" || cmd == "members" || cmd == "ml"){
        member_list(message, guild_obj, in_Arr);
    }else if(cmd == "notif" || cmd == "notifs" || cmd == "notifications" || cmd == "notification"){
        check_notifs(message, guild_obj, in_Arr);
    }else if(cmd == "badge" || cmd == "badges"){
        badges(message, guild_obj)
    }
}

async function Undo(message, guild_obj, in_Arr){
    //a user wants to undo a command
    //load directory of recent commands, after a selection is made ask the user which command they'd like to undo
    var loop = null;
    var log_json = JSON.parse(fs.readFileSync('./log/' + guild_obj.id + '/log.json', 'utf8'));
    var user_discord = null;
    in_Arr.forEach(Element => {
        if(Element.startsWith('<@!')){
            user_discord = Element.slice(3,-1);
        }else if(Element.startsWith('<@') && Element.startsWith("<@&") == false){
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Undo_Embed.setColor(channel_obj.color);
        }
    }
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
        date_disp[1] = date.getMonth() + 1;
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
                            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                                Undo_Prompt.delete();
                            }
                            return;
                        }
                        var reply = collected.first().toString().toLowerCase();
                        if(reply == "yes" || reply == "y"){
                            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                                Undo_Prompt.delete();
                                collected.first().delete();
                            }
                            
                            Undo_Report(message, guild_obj, select);
                        }else{
                            switch(guild_obj.language){
                                case 'english':
                                    message.channel.send("Undo command canceled.")
                                    break;
                            }
                            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                                Undo_Prompt.delete();
                                collected.first().delete();
                            }
                            
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
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                        }
                        
                        return;
                    }
                    var reply = collected.first().toString().toLowerCase();
                    if(reply == "yes" || reply == "y"){
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                            collected.first().delete();
                        }
                        
                        Undo_Loot(message, guild_obj, select, anchor);
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send("Undo command canceled.")
                                break;
                        }
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                            collected.first().delete();
                        }
                        
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
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                        }
                        
                        return;
                    }
                    var reply = collected.first().toString().toLowerCase();
                    if(reply == "yes" || reply == "y"){
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                            collected.first().delete();
                        }
                        Undo_Box(message, guild_obj, select);
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send("Undo command canceled.")
                                break;
                        }
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                            collected.first().delete();
                        }
                    }
                })
                break;
            case "D":
                var report_branches = [];
                select.branches.forEach(Element => {
                    var branch_lID = Element;
                    log_json.Event_Arr.forEach(Element => {
                        if(Element.id == branch_lID){
                            report_branches[report_branches.length] = Element;
                        }
                    })
                })
                var profiles = [];
                select.users.forEach(Element => {
                    profiles[profiles.length] = client.users.cache.get(user_dir.Member_Objects[parseInt(Element.slice(1), 10) - 1].discord);
                })
                var date = new Date(select.report);
                var date_disp = [];
                date_disp[0] = date.getDate();
                date_disp[1] = date.getMonth();
                date_disp[2] = date.getFullYear();
                date_disp[3] = date.getHours();
                date_disp[4] = date.getMinutes();
                if(date_disp[4] < 10){
                    date_disp[4] = "0" + date_disp[4];
                }
                date_disp[5] = date.getSeconds();
                if(date_disp[5] < 10){
                    date_disp[5] = "0" + date_disp[5];
                }   
                var body = [];        
                report_branches.forEach(Element => {
                    var file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
                    if(file.Emoji != null){
                        body[body.length] = file.Emoji + " " + file.Boss;
                    }else{
                        body[body.length] = file.Boss;
                    }
                })   
                Undo_Embed
                    .setFooter('To undo this command, reply "yes"')
                    .addField("**Dungeon Completed By**", profiles.join("\n"))
                    .addField("**Reported At**", date_disp[0] + "/" + date_disp[1] + "/" + date_disp[2] + " " + date_disp[3] + ":" + date_disp[4] + ":" + date_disp[5])
                    .addField("**Dungeon Bosses Killed**", body.join("\n"))
                    .addField("**Server**", select.server);
                var Undo_Prompt = await message.channel.send(Undo_Embed);
                const D_collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
                D_collector.on('end', collected => {
                    if(collected.size == 0){
                        message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help undo`');
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                        }
                        return;
                    }
                    var reply = collected.first().toString().toLowerCase();
                    if(reply == "yes" || reply == "y"){
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                            collected.first().delete();
                        }
                        Undo_Dungeon(message, guild_obj, select);
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send("Undo command canceled.")
                                break;
                        }
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            Undo_Prompt.delete();
                            collected.first().delete();
                        }
                    }
                })
                break;
        }
    }else if(path == "MENU"){

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
    var boss_key = fs.readFileSync("./scores/score_key.txt").toString().split("\n");
    var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + select.mID + ".json", "utf8"));
    var pos = 0;
    loop = 0;
    while(loop < boss_key.length){
        if(boss_key[loop] == boss_file.Boss){
            pos = loop;
            loop = boss_key.length;
        }
        loop++;
    }
    console.log("remove score for boss " + boss_file.id + " from users " + select.users);
    select.users.forEach(Element => {
        var user_file = JSON.parse(fs.readFileSync("./User_Data/" + Element + ".json", "utf8"));
        user_file.Monster_Data[pos] = user_file.Monster_Data[pos] - 1;
        fs.writeFileSync("./User_Data/" + Element + ".json", JSON.stringify(user_file, null, 4), "utf8");
    })
    /*var boss_key = fs.readFileSync('./scores/score_key.txt').toString();
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
    }*/
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

function Undo_Dungeon(message, guild_obj, select){
    var log_json = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
    var trimmed_log = {
        Event_Arr: []
    };
    log_json.Event_Arr.forEach(Element => {
        if(Element.id != select.id && select.branches.includes(Element.id) == false){
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
    if(discord_id.startsWith("!")){
        discord_id = discord_id.slice(1);
    }
    if(discord_id.length < 17){
        message.channel.send("Error in function `NewUser`. Invalid discord ID: . `" + discord_id + "`");
        return;
    }
    console.log(discord_id);
    var user_json = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    var loop = 0;
    var check = false;
    while(loop < user_json.Member_Objects.length){
        if(user_json.Member_Objects[loop].discord == discord_id || user_json.Member_Objects[loop].alt.includes(discord_id)){
            check = true;
            loop = user_json.Member_Objects.length;
        }
        loop++;
    }
    if(check == false){
        var id = (user_json.Member_Objects.length + 1).toString();
        while(id.length < 3){
            id = '0' + id;
        }
        var discord_profile = client.users.cache.get(discord_id);
        id  = 'u' + id;
        var user_file = {
            id: id,
            discord: discord_id,
            alt: [],
            main: null,
            guilds: [],
            home_guild: guild_obj.id,
            name: discord_profile.username,
            Emoji: null,
            Image: null,
            mobile: true
        }
        var faction_rand = Math.floor(Math.random() * 2);
        var faction = null;
        var chevron = null;
        if(faction_rand == 0){
            faction = "L";
            chevron = "<:1st_Chevron:846569476912578563>";
        }else{
            faction = "S";
            chevron = "<:S1_Chevron:846569477235277824>";
        }
        var box_dir = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
        var boss_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
        var box_Arr = [];
        var boss_Arr = [];
        box_dir.Box_Objects.forEach(Element => {
            box_Arr[box_Arr.length] = 0;
        })
        boss_dir.Boss_Select.forEach(Element => {
            boss_Arr[boss_Arr.length] = 0;
        })
        var user_ind_file = {
            User_Object: {
                id: id,
                discord: discord_id,
                alt: [],
                guilds: [],
                home_guild: guild_obj.id,
                name: discord_profile.username,
                Emoji: chevron,
                Image: null,
                mobile: true,
                Accounts: [],
                Exp: 0,
                Faction: faction,
                Badges: [],
                Rank: "Recruit",
                private: false
            },
            Box_Data: box_Arr,
            Monster_Data: boss_Arr,
            NPC_Data: [],
            Equipment_Data: []
        }
        fs.writeFileSync("./User_Data/" + id + ".json", JSON.stringify(user_ind_file, null, 4), "utf8");
        var NewUser_Embed = new Discord.MessageEmbed()
            .setColor(guild_obj.color);
        var channel_obj = null;
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.discord == message.channel.id){
                channel_obj = Element;
            }
        })
        if(channel_obj != null){
            if(channel_obj.color != null){
                NewUser_Embed.setColor(channel_obj.color);
            }
        }
        switch(guild_obj.language){
            case 'english':
                NewUser_Embed
                    .setAuthor('New User', key.image, key.website)
                    .addField("**Default Profile Settings**", "**Username**: " + user_file.name + "\n**Alternative Account**: None\n**Guild**: " + guild_obj.Guild_Name + '\n**Emoji**: none\n**Image**: none')
                    .addField('**Raven User ID**', user_file.id)
                    .setFooter('To customize your settings use $profile settings\nFor help try $help profile');
                break;
        }
        discord_profile.send(NewUser_Embed);
        user_json.Member_Objects[user_json.Member_Objects.length] = user_file;
        user_json.Total_Members = user_json.Member_Objects.length;
        fs.writeFileSync('./User_Data/users.json', JSON.stringify(user_json, null, 4), "utf8");
    }
    User_Join_Guild(message, guild_obj, discord_id);

}

function User_Join_Guild(message, guild_obj, discord_id){
    //console.log(guild_obj)
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
            user_dir.Member_Objects[loop].guilds[user_dir.Member_Objects[loop].guilds.length] = guild_obj.id;
            loop = user_dir.Member_Objects.length;
        }else if(user_dir.Member_Objects[loop].alt.includes(discord_id)){
            user_obj = user_dir.Member_Objects[loop];
            if(user_dir.Member_Objects[loop].guilds.includes(guild_obj.id) == false){
                user_dir.Member_Objects[loop].guilds[user_dir.Member_Objects[loop].guilds.length] = guild_obj.id;
            }
            loop = user_dir.Member_Objects.length;
        }
        loop++;
    }
    if(user_obj == null){
        message.channel.send("Error in `USER_JOIN_GUILD` unable to find user package in directory.");
        return;
    }
    fs.writeFileSync('./User_Data/users.json', JSON.stringify(user_dir, null, 4), 'utf8');
    var discord_profile = client.users.cache.get(discord_id);
    var guild_user_file = {
        id: user_obj.id,
        discord: discord_id,
        name: null,
        alt: user_obj.alt,
        moderator: false
    }
    var user_ind_file = JSON.parse(fs.readFileSync("./User_Data/" + user_obj.id + ".json", "utf8"));
    user_ind_file.User_Object.guilds[user_ind_file.User_Object.guilds.length] = guild_obj.id;
    fs.writeFileSync("./User_Data/" + user_obj.id + ".json", JSON.stringify(user_ind_file, null, 4), "utf8");
    var discord_profile = message.guild.members.cache.get(discord_id);
    if(discord_profile.hasPermission("ADMINISTRATOR") || discord_id == "252099253940387851"){
        guild_user_file.moderator = true;
    }
    console.log(guild_user_file);
    guild_obj.User_Objects[guild_obj.User_Objects.length] = guild_user_file;
    fs.writeFileSync('./Guild_Data/' + guild_obj.id + '.json', JSON.stringify(guild_obj, null, 4), 'utf8');
    /*var score_template = JSON.parse(fs.readFileSync('./scores/template.json', 'utf8'));
    fs.writeFileSync('./scores/' + guild_obj.id + '/' + user_obj.id + '.json', JSON.stringify(score_template, null, 4), 'utf8');
    */
    switch(guild_obj.language){
        case 'english':
            message.channel.send('**' + discord_profile.user.username + '** has become a member of ' + guild_obj.Guild_Name + '!');
            break;
    }
}
/*
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Profile_Embed.setColor(channel_obj.color);
        }
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
}*/

function User_Profile(message, guild_obj, discord_id){
    var in_Arr = message.content.toString().toLowerCase().split(" ");
    var uID = null;
    console.log(discord_id);
    in_Arr.forEach(Element => {
        if(Element.startsWith("u") && isNaN(Element.slice(1)) == false){
            var u_int = parseInt(Element.slice(1), 10);
            if(u_int < 10){
                uID = "u00" + u_int;
            }else if(u_int < 100){
                uID = "u0" + u_int;
            }else{
                uID = "u" + u_int;
            }
        }
    })
    if(uID == null && message.content.toString().split(" ").length > 1){
        Profile_Settings(message, guild_obj, message.content.toString().toLowerCase().split(" ").slice(1));
        return;
    }
    var guild_user_profile = null
    var user_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var User_Pointer = null;
    user_dir.Member_Objects.forEach(Element => {
        if(Element.discord == discord_id && uID == null || Element.alt.includes(discord_id) && uID == null){
            User_Pointer = Element;
        }else if(Element.id == uID){
            User_Pointer = Element;
        }
    })
    if(User_Pointer == null){
        message.channel.send("Unable to find user file address `" + uID + "`");
        return;
    }
    var user_profile = JSON.parse(fs.readFileSync("./User_Data/" + User_Pointer.id + ".json", "utf8"));
    console.log(user_profile, User_Pointer);
    var home_guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + user_profile.User_Object.home_guild + ".json", "utf8"));
    var User_Embed = new Discord.MessageEmbed()
        .setAuthor("User Profile", key.image, key.website)
        .setTitle(user_profile.User_Object.Emoji + " **" + user_profile.User_Object.name + " Profile**")
        .setColor(guild_obj.color);
    if(home_guild_obj.emoji == null){
        User_Embed.setDescription("Home Guild ~ " + home_guild_obj.Guild_Name);
    }else{
        User_Embed.setDescription("Home Guild " + home_guild_obj.emoji + " " + home_guild_obj.Guild_Name);
    }
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            User_Embed.setColor(channel_obj.color);
        }
    }
    if(user_profile.User_Object.private == true && user_profile.User_Object.guilds.includes(guild_obj.id) == false){
        User_Embed = new Discord.MessageEmbed()
            .setTitle("User ID " + user_profile.User_Object.id + " is set to private");
        message.channel.send(User_Embed);
        return;
    }
    if(user_profile.User_Object.alt == true){
        var main_account = JSON.parse(fs.readFileSync("./User_Data/" + user_profile.User_Object.main + ".json", "utf8"));
        console.log(main_account);
        User_Embed.addField("**Main Account**", main_account.User_Object.name);
        User_Embed.addField("**Main Account User ID**", main_account.User_Object.id);
        User_Embed.setFooter("To view main account use `$profile " + main_account.User_Object.id + "`");
        message.channel.send(User_Embed);
        return;
    }
    if(user_profile.User_Object.Emoji != null){
        User_Embed.setTitle("**" + user_profile.User_Object.Emoji + " " + user_profile.User_Object.name + "**")
    }
    if(user_profile.User_Object.Image != null){
        User_Embed.setThumbnail(user_profile.User_Object.Image);
    }
    var account_body = [];
    var account_server = [];
    user_profile.User_Object.Accounts.forEach(Element => {
        if(Element.Class == "m"){
            account_body[account_body.length] = "<:Magician:846552434184552448> " + Element.Name;
        }else if(Element.Class == "r"){
            account_body[account_body.length] = "<:Ranger:846552449145765890> " + Element.Name;
        }else{
            account_body[account_body.length] = "<:Warrior:846552465666605076> " + Element.Name;
        }
        account_server[account_server.length] = Element.Server;
    })
    var loop = 0;
    var badge_JSON = JSON.parse(fs.readFileSync("./User_Data/badges.json", "utf8"));
    var badge_body = [];
    user_profile.User_Object.Badges.forEach(Element => {
        var badge_item = badge_JSON.Badge_Objects[parseInt(Element.slice(2), 10) - 1];
        badge_body[badge_body.length] = badge_item.Emoji + " " + badge_item.Title;
    })
    if(badge_body.length > 0){
        User_Embed.addField("**Badges**", badge_body.join("\n"));
    }else{
        User_Embed.addField("**Badges**", "No badges earned");
    }
    User_Embed.setFooter("User ID: " + user_profile.User_Object.id);
    if(account_body.length > 0){
        var servers = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
        servers.Server_Objects.forEach(Element => {
            var server_body = [];
            loop = 0;
            while(loop < account_body.length){
                if(account_server[loop] == Element.Server){
                    server_body[server_body.length] = account_body[loop];
                }
                loop++;
            }
            if(server_body.length > 0){
                User_Embed.addField(Element.Emoji + " **" + Element.Server + " Accounts**", server_body.join("\n"));
            }
        })
    }else{
        User_Embed.addField("**Accounts**", "No accounts registered");
    }
    User_Embed.addField("**EXP**", "**Rank:** " + user_profile.User_Object.Rank + "\n**Total Exp:** " + user_profile.User_Object.Exp);
    message.channel.send(User_Embed);
}

function User_Exp(message, guild_obj){
    var in_Arr = message.content.toLowerCase().split(" ").slice(1);
    var user_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var uID = [];
    var user = [];
    var error = [];
    in_Arr.forEach(Element => {
        if(Element.startsWith("u") && isNaN(Element.slice(1)) == false && parseInt(Element.slice(1), 10) < user_dir.Total_Members){
            //entered a valid user ID, still make sure it's correctly formatted
            if(parseInt(Element.slice(1), 10) < 10){
                uID[uID.length] = "u00" + Element.slice(1);
            }else if(parseInt(Element.slice(1), 10) < 100){
                uID[uID.length] = "u0" + Element.slice(1);
            }else{
                uID[uID.length] = "u" + Element.slice(1);
            }
        }else if(Element.startsWith("<@!")){
            users[users.length] = Element.split("<@!")[1].split(">")[0];
        }else if(Element.startsWith("<@") && Element.startsWith("<@&") == false){
            users[users.length] = Element.split("<@")[1].split(">")[0];
        }else{
            error[error.length] = Element;
        }
    })
    if(error.length != 0){
        switch(guild_obj.language){
            case "english":
                message.channel.send("Unable to determine input(s) `" + error.join(", ") + "`. Try " + guild_obj.key + "help exp.");
                break;
        }
    }
    if(uID.length == 0 && user.length == 0 && error.length != 0){
        return;
    }else if(uID.length == 0 && user.length == 0 && error.length == 0){
        user[0] = message.author.id;
    }
    var uID_Arr = []
    user_dir.Member_Objects.forEach(Element => {
        if(uID_Arr.includes(Element.id) == false && uID.includes(Element.id) || uID_Arr.includes(Element.id) == false && user.includes(Element.discord)){
            uID_Arr[uID_Arr.length] = Element.id;
        }else if(Element.alt.length > 0){
            var loop = 0;
            while(loop < Element.alt.length){
                if(uID_Arr.includes(Element.id) == false && user.includes(Element.alt[loop])){
                    uID_Arr[uID_Arr.length] = Element.id;
                    loop = Element.alt.length;
                }
                loop++;
            }
        }
    })
    console.log(uID_Arr);
    /*
        1st chevron - recruit - 0 to 1000 exp
        2nd chevron - scout - 1000 to 5000 exp
        3rd chevron - Combat Soldier - 5000 to 20000 exp
        4th chevron - Veteran Soldier - 20000 to 50000 exp
        5th chevron - Apprentice Knight - 50000 to 100000 exp
        6th chevron - Fighter - 100000 to 200000 exp
        7th chevron - Elite Fighter - 200000 to 500000 exp
        8th chevron - Field Commander - 500000 to 1mil exp
        9th chevron - Commander - 1 mil to 3 mil exp
        10th chevron - General - 3 mil + exp

            lanos                                sira
        1 - <:1st_Chevron:846569476912578563>       <:S1_Chevron:846569477235277824>
        2 - <:2ndChevron:846569477217976330>        <:S2_Chevron:846569477063966771>
        3 - <:3rdChevron:846569476819910668>        <:S3_Chevron:846569476870635542>
        4 - <:4thChevron:846569477247074314>        <:S4_Chevron:846569477352194058>
        5 - <:5thChevron:846569477087690783>        <:S5_Chevron:846569477390598154>
        6 - <:6thChevron:846569476861853707>        <:S6_Chevron:846569477340266506>
        7 - <:7th_Chevron:846569476782948375>       <:S7_Chevron:846569477411045376>
        8 - <:8th_Chevron:846569477393874945>       <:S8_Chevron:846569477306449920>
        9 - <:9th_Chevron:846569477302648832>       <:S9_Chevron:846569477302779914>
        10 - <:10th_Chevron:846569477042077697>     <:S10_Chevron:846569477264506932>
    */
    var ranks = ["Recruit", "Scout", "Combat Soldier", "Veteran Soldier", "Apprentice Knight", "Fighter", "Elite Fighter", "Field Commander", "Commander", "General"];
    var Exp_Ranks = [1000, 5000, 20000, 50000, 100000, 200000, 500000, 1000000, 3000000];
    var lanos_chevrons = ["<:1st_Chevron:846569476912578563>", "<:2ndChevron:846569477217976330>", "<:3rdChevron:846569476819910668>", "<:4thChevron:846569477247074314>", "<:5thChevron:846569477087690783>", "<:6thChevron:846569476861853707>", "<:7th_Chevron:846569476782948375>", "<:8th_Chevron:846569477393874945>", "<:9th_Chevron:846569477302648832>", "<:10th_Chevron:846569477042077697>"];
    var siras_chevrons = ["<:S1_Chevron:846569477235277824>", "<:S2_Chevron:846569477063966771>", "<:S3_Chevron:846569476870635542>", "<:S4_Chevron:846569477352194058>", "<:S5_Chevron:846569477390598154>", "<:S6_Chevron:846569477340266506>", "<:S7_Chevron:846569477411045376>", "<:S8_Chevron:846569477306449920>", "<:S9_Chevron:846569477302779914>", "<:S10_Chevron:846569477264506932>"];
    uID_Arr.forEach(Element => {
        var user_json = JSON.parse(fs.readFileSync("./User_Data/" + Element + ".json", "utf8"));
        var rank = null;
        var next_rank = null;
        var current_Exp = user_json.User_Object.Exp;
        var level_Exp = 0;
        var current_Chevron = null;
        var next_Chevron = null;
        var loop = 0;
        while(loop < 10){
            if(current_Exp < Exp_Ranks[loop]){
                rank = ranks[loop];
                if(user_json.User_Object.Faction == "L"){
                    current_Chevron = lanos_chevrons[loop];
                }else{
                    current_Chevron = siras_chevrons[loop];
                }
                if(rank != "General"){
                    next_rank = ranks[loop + 1];
                    level_Exp = Exp_Ranks[loop] - current_Exp;
                    if(user_json.User_Object.Faction == "L"){
                        next_Chevron = lanos_chevrons[loop + 1];
                    }else{
                        next_Chevron = siras_chevrons[loop + 1];
                    }
                }
                loop = 10;
            }
            loop++;
        }
        var Reply_Embed = new Discord.MessageEmbed()
            .setAuthor("Exp Progress", key.image, key.website)
            .setColor(guild_obj.color);
        if(rank != "General"){
            Reply_Embed.addField("**" + user_json.User_Object.name + " Experience**", "**Current Rank:** " + current_Chevron + " " + rank + "\n**Next Rank:** " + next_Chevron + " " + next_rank + "\n**Current Exp:** " + current_Exp + "\n**Exp to rank up:** " + level_Exp);
        }else{
            Reply_Embed.addField("**" + user_json.User_Object.name + " Experience**", "**Current Rank:** " + current_Chevron + " General\n**Current Exp:** " + current_Exp);
        }
        message.channel.send(Reply_Embed);
    })
}

function leader_boards(message, guild_obj){
    var in_Arr = message.content.toString().split(" ").slice(1);
    var user_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var user_obj = null;
    user_dir.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id || Element.alt.includes(message.author.id)){
            user_obj = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"))
        }
    })
    if(in_Arr.length == 0){//total exp ranking, global
        var user_JSONs = [];
        user_dir.Member_Objects.forEach(Element => {
            user_JSONs[user_JSONs.length] = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"));
        })
        var top_ten = [];
        var loop = 0;
        user_JSONs.forEach(Element => {
            if(top_ten.length < 10){
                top_ten[top_ten.length] = Element.User_Object;
            }else{
                var check = false;
                var lowest = null;
                loop = 0;
                lowest = Element;
                while(loop < 10){
                    if(top_ten[loop].Exp > Element.User_Object.Exp){
                        //carry on
                    }else{
                        check = true;
                        loop = 10;
                    }
                    loop++;
                }
                if(check == true){
                    loop = 1;
                    lowest = 0;
                    while(loop < 10){
                        if(top_ten[loop].Exp < top_ten[lowest].Exp){
                            lowest = loop;
                        }
                        loop++;
                    }
                    top_ten[lowest] = Element.User_Object;
                }
            }
        })
        //The top ten users have been identified
        //does the top ten include the user who entered the query?
        var author_included = false;
        top_ten.forEach(Element => {
            if(Element.id == user_obj.User_Object.id){
                author_included = true;
            }
        })
        var author_pos = null;
        if(author_included == false){
            author_pos = 1;
            user_JSONs.forEach(Element => {
                if(Element.User_Object.Exp > user_obj.User_Object.Exp){
                    author_pos++;
                }
            })
        }
        console.log(author_included);
        loop = 0;
        var inloop = 0;
        while(loop < top_ten.length){
            inloop = 0;
            while(inloop < top_ten.length - 1){
                if(top_ten[inloop].Exp < top_ten[inloop + 1].Exp){
                    var swap = top_ten[inloop];
                    top_ten[inloop] = top_ten[inloop + 1];
                    top_ten[inloop + 1] = swap;
                }
                inloop++;
            }
            loop++;
        }
        var body = [];
        top_ten.forEach(Element => {
            var home_guild_emoji = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.home_guild + ".json", "utf8")).emoji;
            if(home_guild_emoji == null){
                body[body.length] = (body.length + 1).toString() + ". " + Element.Emoji + " " + Element.name;
            }else{
                body[body.length] = (body.length + 1).toString() + ". " + Element.Emoji + " " + home_guild_emoji + " " + Element.name;
            }
            
        })
        if(author_included == false){
            body[body.length] = author_pos + ". " + user_obj.User_Object.Emoji + " " + user_obj.User_Object.name;
        }
        var Reply_Embed = new Discord.MessageEmbed()
            .setAuthor("Raven Leaderboards", key.image, key.website)
            .setColor(guild_obj.color)
            .addField("**Global Leaderboard**", body.join("\n"));
        message.channel.send(Reply_Embed);
    }
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
    guilds_dir.Total_Guilds = guilds_dir.Guild_Objects.length;
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
        Boss_Score_Messages: true,
        Exp_Messages: true,
        Box_Score_Messages: true,
        loot_prompt: false,
        private_data: false,
        join_date: new Date().getTime(),
        Total_Members: 0,
        Channel_Objects: [],
        User_Objects: []
    }
    console.log(guild_file);
    fs.writeFileSync('./Guild_Data/' + gID + '.json', JSON.stringify(guild_file, null, 4), 'utf8');
    fs.mkdirSync('./stats/' + gID);
    fs.mkdirSync('./stats/' + gID + '/Box_Data');
    fs.mkdirSync('./stats/' + gID + '/Craft_Data');
    fs.mkdirSync('./stats/' + gID + '/Enchant_Data');
    fs.mkdirSync('./stats/' + gID + '/Monster_Data');
    fs.mkdirSync('./stats/' + gID + '/NPC_Data');
    var notif_template = JSON.parse(fs.readFileSync("./notifs/g000.json", "utf8"));
    fs.writeFileSync("./notifs/" + gID + ".json", JSON.stringify(notif_template, null, 4), "utf8");
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
    //var score_template = JSON.parse(fs.readFileSync('./scores/template.json', 'utf8'));
    fs.mkdirSync("./log/" + gID);
    var log = {
        Event_Arr: []
    }
    fs.writeFileSync("./log/" + gID + "/log.json", JSON.stringify(log, null, 4), "utf8");
    //fs.mkdirSync('./scores/' + gID);
    //fs.writeFileSync('./scores/' + gID + '/main.json', JSON.stringify(score_template, null, 4), 'utf8');
    //Guild_Home_Init(guild, guild_file);
}

function New_Box(bID){
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var template = JSON.parse(fs.readFileSync("./stats/template.json", "utf8"));
    guilds.Guild_Objects.forEach(Element => {
        fs.writeFileSync("./stats/" + Element.id + "/Box_Data/" + bID + ".json", JSON.stringify(template, null, 4), "utf8");
    })
    var box_file = JSON.parse(fs.readFileSync("./Box_Data/" + bID + ".json", "utf8"));
    var box_Embed = new Discord.MessageEmbed()
        .setAuthor("Black Raven Update", key.image, key.website);
    if(box_file.Emoji != null){
        box_Embed.setTitle(box_file.Emoji + " **" + box_file.Title + "**");
    }else{
        box_Embed.setTitle("**" + box_file.Title + "**");
    }
    if(box_file.Image != null){
        box_Embed.setThumbnail(box_file.Image);
    }
    var User_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    User_dir.Member_Objects.forEach(Element => {
        var user_json = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"));
        user_json.Box_Data[user_json.Box_Data.length] = 0;
        fs.writeFileSync("./User_Data/" + Element.id + ".json", JSON.stringify(user_json, null, 4), "utf8");
    })
    var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    var equip_dir = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    var box_dir = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
    var box_pointer = box_dir.Box_Objects[parseInt(bID.slice(1), 10) - 1];
    if(box_file.Emoji != null){
        box_Embed.addField(box_file.Emoji + " **" + box_file.Title + " Shortcuts**", box_pointer.Shortcuts.join("\n"));
    }else{
        box_Embed.addField("**" + box_file.Title + " Shortcuts**", box_pointer.Shortcuts.join("\n"));
    }
    box_Embed.setDescription("Treasure Experience: " + box_file.Exp);
    var loop = 0;
    box_file.Loot_Table.forEach(Element => {
        if(Element.id.startsWith("i")){
            loop = 0;
            while(loop < item_dir.Item_Objects.length){
                if(item_dir.Item_Objects[loop].iID == Element.id.split(" ")[0]){
                    var item_file = item_dir.Item_Objects[loop];
                    if(item_file.Emoji != null){
                        if(Element.id.split(" ").length == 1){
                            box_Embed.addField(item_file.Emoji + " **" + item_file.Title + "**", Element.Shortcuts.join("\n"));
                        }else{
                            box_Embed.addField(item_file.Emoji + " **" + item_file.Title + " " + Element.id.split(" ")[1] + "**", Element.Shortcuts.join("\n"));
                        }
                    }else{
                        if(Element.id.split(" ").length == 1){
                            box_Embed.addField("**" + item_file.Title + "**", Element.Shortcuts.join("\n"));
                        }else{
                            box_Embed.addField("**" + item_file.Title + " " + Element.id.split(" ")[1] + "**"), Element.Shortcuts.join("\n");
                        }
                    }
                    loop = item_dir.Item_Objects.length;
                }
                loop++;
            }
        }else{
            loop = 0;
            while(loop < equip_dir.Equip_Objects.length){
                if(equip_dir.Equip_Objects[loop].eID == Element.id.split(" ")[0]){
                    var equip_file = equip_dir.Equip_Objects[loop];
                    if(equip_file.Emoji != null){
                        box_Embed.addField(equip_file.Emoji + " **" + equip_file.Title + "**", Element.Shortcuts.join("\n"));
                    }else{
                        box_Embed.addField("**" + equip_file.Title + "**", Element.Shortcuts.join("\n"));
                    }
                    loop = equip_dir.Equip_Objects.length;
                }
                loop++;
            }
        }
    })
    guilds.Guild_Objects.forEach(Element => {
        var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
        box_Embed.setColor(guild_file.color);
        loop = 0;
        var home_check = false;
        while(loop < guild_file.Channel_Objects.length){
            if(guild_file.Channel_Objects[loop].Type == "home"){
                var home_channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                home_check = true;
                home_channel.send(box_Embed);
            }
            loop++;
        }
        if(home_check == false && guild_file.Channel_Objects.length > 0){
            var home_channel = client.channels.cache.get(guild_file.Channel_Objects[0].discord);
            home_channel.send('Error in Guild `' + Element.id + '` no home channel found. Defaulting to `' + guild_file.Channel_Objects[0].id + "`");
            home_channel.send(box_Embed);
        }
    })
    console.log(box_Embed);
}

function New_Equip(eID){

}

function New_Boss(mID){
    //a new boss has been added to the game
    console.log("initilizing mID " + mID);
    var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + mID + ".json"), "utf8");
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var boss_main = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var mID_file = null;
    boss_main.Boss_Select.forEach(Element => {
        if(Element.mID == mID){
            mID_file = Element;
        }
    })
    if(mID_file == null){
        console.log("failed to locate new mID file " + mID);
        return;
    }
    var score_key_txt = fs.readFileSync("./scores/score_key.txt").toString();
    score_key_txt = score_key_txt.split("\n");
    score_key_txt[score_key_txt.length] = mID_file.Title;
    fs.writeFileSync("./scores/score_key.txt", score_key_txt.join("\n"));
    //score key updated
    //var score_template = JSON.parse(fs.readFileSync("./scores/template.json", "utf8"));
    score_template.Server_Objects.forEach(Element => {
        Element.array[Element.array.length] = 0;
    })
    //fs.writeFileSync("./scores/template.json", JSON.stringify(score_template, null, 4), "utf8");
    //score template updated
    var guild_array_file = null;
    var guild_file_main = null;
    var loop = 0;
    guilds.Guild_Objects.forEach(Element => {
        //update main file
        /*console.log("update guild " + Element.id + "main score file");
        guild_array_file = JSON.parse(fs.readFileSync("./scores/" + Element.id + "/main.json", "utf8"));
        loop = 0;
        while(loop < guild_array_file.Server_Objects.length){
            guild_array_file.Server_Objects[loop].array[guild_array_file.Server_Objects[loop].length] = 0;
            loop++;
        }
        fs.writeFileSync("./scores/" + Element.id + "/main.json", JSON.stringify(guild_array_file, null, 4), "utf8");
        //update user files
        var user_loop = 0;
        guild_file_main = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json"), "utf8");
        while(user_loop < guild_file_main.User_Objects.length){
            guild_array_file = JSON.parse(fs.readFileSync("./scores/" + Element.id + "/" + guild_file_main.User_Objects[user_loop].id + ".json"), "utf8");
            loop = 0;
            while(loop < guild_array_file.Server_Objects.length){
                guild_array_file.Server_Objects[loop].array[guild_array_file.Server_Objects[loop].length] = 0;
                loop++;
            }
            fs.writeFileSync("./scores/" + Element.id + "/" + guild_file_main.User_Objects[user_loop].id + ".json", JSON.stringify(guild_array_file, null, 4), "utf8");
            console.log('update guild ' + Element.id + " user score file " + guild_file_main.User_Objects[user_loop].id);
            user_loop++;
        }*/
        //create stat file for new boss
        var stat_template = JSON.parse(fs.readFileSync("./stats/template.json", "utf8"));
        console.log('update stat file ' + Element.id);
        fs.writeFileSync("./stats/" + Element.id + "/Monster_Data/" + mID + ".json", JSON.stringify(stat_template, null, 4), "utf8");
    })
    //update user files (outside guilds)
    var user_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var user_file = null;
    user_dir.Member_Objects.forEach(Element => {
        user_file = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"));
        user_file.Monster_Data[user_file.Monster_Data.length] = 0;
        fs.writeFileSync("./User_Data/" + Element.id + ".json", JSON.stringify(user_file, null, 4), "utf8");
        console.log('writing user file + ' + Element.id);
    })
    console.log("all files updated for " + mID);
    //update notif files
    var notif_template = JSON.parse(fs.readFileSync("./notifs/g000.json", "utf8"));
    var blank_notif_obj = {
        boss: boss_file.Title,
        mID: mID,
        notify_bigmama: [],
        notify_devilang: [],
        notify_wadangka: [],
        notify_caligo: [],
        notify_turtlez: [],
        notify_newstar: [],
        notify_darlene: [],
        notify_barslaf: [],
        notify_kanos: [],
        notify_모아임: [],
        notify_시리온: [],
        notify_파로스: [],
        notify_헤이블: [],
        notify_クイー: []
    }
    notif_template.notifs[notif_template.notifs.length] = blank_notif_obj;
    fs.writeFileSync("./notifs/g000.json", JSON.stringify(notif_template, null, 4), "utf8");
    fs.writeFileSync("./notifs/u000.json", JSON.stringify(notif_template, null, 4), "utf8");
    guilds.Guild_Objects.forEach(Element => {
        notif_template = JSON.parse(fs.readFileSync("./notifs/" + Element.id + ".json", "utf8"));
        notif_template.notifs[notif_template.notifs.length] = blank_notif_obj;
        fs.writeFileSync("./notifs/" + Element.id + ".json", JSON.stringify(notif_template.notifs, null, 4), "utf8");
    })
    
    //generate update announcement
    
    var Boss_Embed = new Discord.MessageEmbed()
        .setAuthor("Black Raven Update", key.image, key.website);
    
    console.log(boss_file);
    if(boss_file.Emoji != null){
        Boss_Embed.setTitle("**" + boss_file.Boss + "**");
    }else{
        Boss_Embed.setTitle(boss_file.Emoji + " **" + boss_file.Boss + "**");
    }
    if(boss_file.Image != null){
        Boss_Embed.setThumbnail(boss_file.Image);
    }
    var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    var equip_dir = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    var pointer_menu = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var pointer = null;
    pointer_menu.Boss_Select.forEach(Element => {
        if(Element.mID == mID){
            pointer = Element;
        }
    })
    Boss_Embed.setDescription("Boss Experience " + boss_file.Exp);
    Boss_Embed.addField("** " + boss_file.Boss + " Shortcuts**", pointer.Shortcuts.join("\n"));
    Boss_Embed.addField("**Respawn Time**", boss_file.Respawn_Time);
    var loot_arr = [];
    var item_obj = null;
    var item_pointer = 0;
    var equip_file = null;
    boss_file.Loot_Table.forEach(Element => {
        if(Element.startsWith('i')){
            item_pointer = parseInt(Element.slice(1), 10) - 1;
            item_obj = item_dir.Item_Objects[item_pointer];
            if(item_obj.Emoji != null){
                loot_arr[loot_arr.length] = item_obj.Title;
            }else{
                loot_arr[loot_arr.length] = item_obj.Title;
            }
        }else if(Element.startsWith('e')){
            equip_file = JSON.parse(fs.readFileSync("./Equipment_Data/" + Element) + ".json", "utf8");
            if(equip_file.Emoji != null && equip_file.Emoji != "null"){
                loot_arr[loot_arr.length] = equip_file.Emoji + " " + equip_file.Title;
            }else{
                loot_arr[loot_arr.length] = equip_file.Title;
            }
        }
        
    })
    Boss_Embed.addField("**Tracked Loot**", loot_arr.join("\n"));
    guilds.Guild_Objects.forEach(Element => {
        var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
        Boss_Embed.setColor(guild_file.color);
        loop = 0;
        while(loop < guild_file.Channel_Objects.length){
            if(guild_file.Channel_Objects[loop].Type == "home"){
                var home_channel = client.channels.cache.get(guild_file.Channel_Objects[loop].discord);
                home_channel.send(Boss_Embed);
            }
            loop++;
        }
    })
    console.log(Boss_Embed);
}

function Settings(message, guild_obj, in_Arr){

}

function Guild_Home_Init(guild, guild_obj){
    var loop = 0;
    guild.channels.cache.forEach(Element => {
        console.log("Channel loop: " + loop);
        console.log(Element);
        loop++;
    })
}

function Guild_Settings(message, guild_obj, in_Arr){
    //guild settings function

    if(in_Arr.length == 0){
        var guild_Embed = new Discord.MessageEmbed()
            .setAuthor("Guild Settings", key.image, key.website)
            .setColor(guild_obj.color)
            .setFooter(guild_obj.id);
        if(guild_obj.emoji != null){
            guild_Embed.setTitle("**" + guild_obj.emoji + " " + guild_obj.Guild_Name + "**");
        }else{
            guild_Embed.setTitle("**" + guild_obj.Guild_Name + " Settings**");
        }
        var body = [];
        body[0] = "**Guild Name:** " + guild_obj.Guild_Name;
        body[1] = "**Command Key:** " + guild_obj.key;
        body[2] = "**Guild Color:** " + guild_obj.color;
        body[3] = "**Language:** " + guild_obj.language;
        if(guild_obj.image == null){
            body[4] = "**Guild Image:** Not yet set";
        }else{
            body[4] = "**Guild Image:** attached below";
            guild_Embed.setImage(guild_obj.image);
        }
        if(guild_obj.emoji != null){
            body[5] = "**Guild Emoji:** " + guild_obj.emoji;
        }else{
            body[5] = "**Guild Emoji:** Not yet set";
        }
        if(guild_obj.loot_prompt == false){
            body[6] = "**Automatic Loot Prompt:** Off"; 
        }else{
            body[6] = "**Automatic Loot Prompt:** On"; 
        }
        if(guild_obj.private_data == false){
            body[7] = "**Statistics Data:** Public";
        }else{
            body[7] = "**Statistics Data:** Private";
        }
        var j_date = new Date(guild_obj.join_date);
        guild_Embed
            .setDescription("Joined on " + j_date.getDate() + "/" + (j_date.getMonth() + 1) + "/" + j_date.getFullYear())
            .addField("**Guild Settings**", body.join("\n"));
        message.channel.send(guild_Embed);
    }else{
        var user_obj = null;
        guild_obj.User_Objects.forEach(Element => {
            if(Element.discord == message.author.id){
                user_obj = Element;
            }
        })
        var mod_check = true;
        if(user_obj != null){
            if(user_obj.moderator == false){
                mod_check = false;
            }
        }else{
            mod_check = false;
        }
        if(mod_check == false){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("This command can only be used by moderators, or users given permission to use restricted commands by server admins.");
                    break;
            }
            return;
        }
        if(in_Arr[0] == "name" || in_Arr[0] == "guildname"){
            Update_Guild(message, guild_obj, "name");
        }else if(in_Arr[0] == "color"){
            Update_Guild(message, guild_obj, "color");
        }else if(in_Arr[0] == "key" || in_Arr[0] == "prompt"){
            Update_Guild(message, guild_obj, "key");
        }else if(in_Arr[0] == "language" || in_Arr[0] == "lang"){
            Update_Guild(message, guild_obj, "language");
        }else if(in_Arr[0] == "emoji"){
            Update_Guild(message, guild_obj, "emoji");
        }else if(in_Arr[0] == "image"){
            Update_Guild(message, guild_obj, "image");
        }else if(in_Arr[0] == "loot" || in_Arr[0] == "lootprompt"){
            Update_Guild(message, guild_obj, "loot");
        }else if(in_Arr[0] == "private" || in_Arr[0] == "privacy"){
            Update_Guild(message, guild_obj, "private");
        }else{
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + in_Arr[0] + "`. Try `" + guild_obj.key + "help guild`");
                    break;
            }
        }
    }
}

async function Update_Guild(message, guild_obj, path){
    //user wants to udpate guild settings
    //before calling this function user permission was already checked and which item they wanted to update
    //build a message embed based on the item they wish to change, create a message collector to get their response

    var guild_Embed = new Discord.MessageEmbed()
        .setAuthor("Update Guild Settings")
        .setColor(guild_obj.color);
    switch(path){
        case 'name':
            guild_Embed.addField("**Guild Name**", "Current Guild Name: " + guild_obj.Guild_Name);
            guild_Embed.addField("**Update Guild Name**", "Reply with the new guild name or reply 'cancel'");
            break;
        case 'color':
            guild_Embed.addField("**Guild Color**", "Current Guild Color: " + guild_obj.color);
            guild_Embed.addField("**Update Guild Color**", "Reply with the new guild color in the form of a valid hex code\nReply 'cancel' to make no changes");
            break;
        case 'key':
            guild_Embed.addField("**Guild Key**", "Current Key: " + guild_obj.key);
            guild_Embed.addField("**Update Guild Key**", "Reply with the character would like to be the key used to enter commands.\nChanging this will change it for everyone in this discord server.\nReply 'cancel' to make no changes");
            guild_Embed.setFooter("New guild key must be a special character or punctuation, for example: $ or ?")
            break;
        case 'language':
            guild_Embed.addField("**Guild Language**", "Current language: " + guild_obj.language);
            guild_Embed.addField("**Select from the following languages**", "1. English");
            guild_Embed.addField("Note from Dan,", "More languages will be added in future updates. Assistance with translation is appreciated.");
            break;
        case 'emoji':
            guild_Embed.addField("**Guild Emoji**", "Current Emoji: " + guild_obj.emoji);
            guild_Embed.addField("**Update Guild Emoji**", "Reply with the Emoji you would like to appear by your guild in statistics menus.\nUse either a Unicode emoji or an emoji from a discord server Black Raven is a member of.");
            break;
        case 'image':
            if(guild_obj.image == null){
                guild_Embed.addField("**Guild Image**", "Current Image: Attached below");
                guild_Embed.addField("**Update Guild Image**", "Reply with a *DIRECT LINK* to an image hosted on the web.")
            }else{
                guild_Embed.addField("**Guild Image**", "Current Image: Not yet set");
                guild_Embed.addField("**Update Guild Image**", "Reply with a *DIRECT LINK* to an image hosted on the web.")
            }
            break;
        case 'loot':
            if(guild_obj.loot_prompt == false){
                guild_Embed.addField("**Automatic Loot Prompts**", "Current setting: Off")
                guild_Embed.addField("**Turn On Automatic Loot Prompts?**", "To confirm reply 'yes'");
            }else{
                guild_Embed.addField("**Automatic Loot Prompts**", "Current setting: On")
                guild_Embed.addField("**Turn Off Automatic Loot Prompts?**", "To confirm reply 'yes'");
            }
            break;
        case 'private':
            if(guild_obj.private_data == false){
                guild_Embed.addField("**Guild Data Privacy**", "Current setting: public");
                guild_Embed.addField("**Set Guild Data to Pirvate?**", "to confirm reply 'yes'");
            }else{
                guild_Embed.addField("**Guild Data Privacy**", "Current setting: private");
                guild_Embed.addField("**Set Guild Data to Public?**", "to confirm reply 'yes'");
            }
            break;
    }
    var Guild_Prompt = await message.channel.send(guild_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out.");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Guild_Prompt.delete();
            }
            return;
        }
        var reply = collected.first().content.toString().toLowerCase();
        var confirm_Embed = new Discord.MessageEmbed()
            .setAuthor("Guild Settings", key.image, key.website)
            .setColor(guild_obj.color)
            .setFooter(guild_obj.id);
        guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + guild_obj.id + ".json", "utf8"));
        if(reply == "cancel" || reply == "cancle"){
            confirm_Embed.setDescription("No changes made");
        }else{
            switch(path){
                case 'name':
                    confirm_Embed.setDescription("Guild name set to: " + collected.first().content.toString());
                    guild_obj.Guild_Name = collected.first().content.toString();
                    break;
                case 'color':
                    var hex = parseInt(reply, 16);
                    if(isNaN(hex) == false && reply.length == 6){
                        guild_obj.color = reply;
                        confirm_Embed.setDescription("Guild color set to '" + reply + "'");
                        confirm_Embed.setColor(reply);
                    }else{
                        confirm_Embed.setDescription("Unable to determine '" + reply + "'");
                        confirm_Embed.addField("Check color-hex for valid hex codes", "https://www.color-hex.com/");
                    }
                    break;
                case 'key':
                    var valid_keys = ["!", "$", "%", "^", "&", "*", "(", ")", "_", "-", "=", "+", "[", "]", "{", "}", "|", ";", ":", "'", '"', "<", ">", ",", ".", "€", "¥", "£", "฿", "₱"];
                    if(valid_keys.includes(reply)){
                        confirm_Embed.setDescription("Guild key set to: " + reply);
                        guild_obj.key = reply;
                        var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
                        guilds.Guild_Objects.forEach(Element => {
                            if(Element.id == guild_obj.id){
                                Element.key = reply;
                            }
                        })
                        fs.writeFileSync("./Guild_Data/guilds.json", JSON.stringify(guilds, null, 4), "utf8");
                    }else{
                        confirm_Embed.addField("**Invalid key**", "list of valid keys: " + valid_keys.join(" "));
                    }
                    break;
                case 'language':
                    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
                    var language = null;
                    if(reply == "1"){
                        language = 'english'
                        confirm_Embed.setDescription("Guild language set to English");
                        guild_obj.language = "english";
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine `" + reply + '`. Try `' + guild_obj.key + "help guild`");
                                break;
                        }
                    }
                    if(language != null){
                        guilds.Guild_Objects.forEach(Element => {
                            if(Element.id == guild_obj.id){
                                Element.language = language;
                            }
                        })
                    }
                    fs.writeFileSync("./Guild_Data/guilds.json", JSON.stringify(guilds, null, 4), "utf8");
                    break;
                case 'emoji':
                    confirm_Embed.setDescription("Guild Emoji set to: " + collected.first().content);
                    guild_obj.emoji = collected.first().content;
                    break;
                case 'image':
                    confirm_Embed.setDescription("Currently unavailable.\nIn the mean time, contact Dan to have your image entered manually");
                    break;
                case 'loot':
                    if(reply == "y" || reply == "yes"){
                        if(guild_obj.loot_prompt == false){
                            confirm_Embed.setDescription("Automatic loot prompts turned on");
                            guild_obj.loot_prompt = true;
                        }else{
                            confirm_Embed.setDescription("Automatic loot prompts turned off");
                            guild_obj.loot_prompt = false;
                        }
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel'");
                                break;
                        }
                    }
                    break;
                case 'private':
                    if(reply == "y" || reply == "yes"){
                        if(guild_obj.private_data == false){
                            confirm_Embed.setDescription("Guild data set to private");
                            guild_obj.private_data = true;
                        }else{
                            confirm_Embed.setDescription("Guild data set to public");
                            guild_obj.private_data = false;
                        }
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel'");
                                break;
                        }
                    }
                    break;
            }
            fs.writeFileSync("./Guild_Data/" + guild_obj.id + ".json", JSON.stringify(guild_obj, null, 4), "utf8");
        }
        
        message.channel.send(confirm_Embed);
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            collected.first().delete();
            Guild_Prompt.delete();
        }
        
    })
}

function member_list(message, guild_obj, in_Arr){
    //display a list of members in this guild
    var channel_obj = null;
    var loop = 0;
    while(loop < guild_obj.Channel_Objects.length){
        if(guild_obj.Channel_Objects[loop].discord == message.channel.id){
            channel_obj = guild_obj.Channel_Objects[loop];
            loop = guild_obj.Channel_Objects.length;
        }
        loop++;
    }
    var reply_embed = new Discord.MessageEmbed()
        .setColor(guild_obj.color)
        .setAuthor("Guild Info", key.image, key.website)
        .setFooter("Guild ID: " + guild_obj.id)
    if(guild_obj.emoji == null){
        reply_embed.setTitle("**" + guild_obj.Guild_Name + " Member List**");
    }else{
        reply_embed.setTitle(guild_obj.emoji + " **" + guild_obj.Guild_Name + " Member List**");
    }
    if(channel_obj.color != null){
        reply_embed.setColor(channel_obj.color);
    }
    var disp_Arr = [];
    guild_obj.User_Objects.forEach(Element => {
        var user_file = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"));
        disp_Arr[disp_Arr.length] = user_file.User_Object.id + " ~ " + user_file.User_Object.Emoji + " " + user_file.User_Object.name;
    })
    console.log(disp_Arr, disp_Arr.join("\n").length);
    if(disp_Arr.join("\n").length < 1024){
        reply_embed.addField("Member list 1 of 1", disp_Arr.join("\n"));
    }else{
        var disp_Arr_trimmed = [];
        var page = 1;
        var pages = Math.floor(disp_Arr.join("\n").length/1024) + 1;
        disp_Arr.forEach(Element => {
            if(disp_Arr_trimmed.join("\n").length + Element.length < 1020){
                disp_Arr_trimmed[disp_Arr_trimmed.length] = Element;
            }else{
                reply_embed.addField("Member list " + page + " of " + pages, disp_Arr_trimmed.join("\n"));
                page++;
                disp_Arr_trimmed = [];
                disp_Arr_trimmed[0] = Element;
            }
        })
        console.log(disp_Arr_trimmed);
        if(page == pages){
            reply_embed.addField("Member list " + page + " of " + pages, disp_Arr_trimmed.join("\n"));
        }
    }
    message.channel.send(reply_embed);
}

function Channel_Settings(message, guild_obj, in_Arr){
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj == null){
        message.channel.send("Error. Unable to find channel <#" + message.channel.id + ">");
        return;
    }
    if(in_Arr.length == 0){
        console.log(channel_obj);
        var ch_Settings_Embed = new Discord.MessageEmbed()
            .setAuthor("Channel Settings", key.image, key.website)
            .setColor(guild_obj.color);
        if(channel_obj.color != null){
            ch_Settings_Embed.setColor(channel_obj.color);
        }
        var body = [];
        if(channel_obj.Type == null){
            body[0] = "**Type:** Not yet set";
        }else{
            body[0] = "**Type:** " + channel_obj.Type;
        }
        if(channel_obj.Type != "discussion" && channel_obj.Server == null){
            body[1] = "**Server:** Not yet set"; 
        }else if(channel_obj.Type != "discussion"){
            body[1] = "**Server:** " + channel_obj.Server;
        }
        if(channel_obj.Battlefield == false){
            body[body.length] = "**Battlefield Reminders:** Off";
        }else{
            body[body.length] = "**Battlefield Reminders:** On";
        }
        if(channel_obj.Siege == false){
            body[body.length] = "**Siege Battle Reminders:** Off";
        }else{
            body[body.length] = "**Siege Battle Reminders:** On";
        }
        if(channel_obj.Maint == false){
            body[body.length] = "**Maintanence Reminders:** Off";
        }else{
            body[body.length] = "**Maintanence Reminders:** On";
        }
        if(channel_obj.Private == false && channel_obj.Type == "report"){
            body[body.length] = "**Private Channel:** Off";
        }else if(channel_obj.Type == "report"){
            body[body.length] = "**Private Channel:** On";
        }
        if(channel_obj.color == null){
            body[body.length] = "**Color:** Not yet set";
        }else{
            body[body.length] = "**Color:** " + channel_obj.color;
        }
        if(channel_obj.Type == "notif"){
            var root_arr = [];
            if(channel_obj.Root.length == 0){
                body[body.length] = "**Root Report Channel:** none"
            }else{
                channel_obj.Root.forEach(Element => {
                    root_arr[root_arr.length] = Element;
                })
                var loop = 0;
                while(loop < root_arr.length){
                    var inloop = 0;
                    while(inloop < guild_obj.Channel_Objects.length){
                        if(guild_obj.Channel_Objects[inloop].id == root_arr[loop]){
                            root_arr[loop] = "#" + client.channels.cache.get(guild_obj.Channel_Objects[inloop].discord).name;
                            inloop = guild_obj.Channel_Objects.length;
                        }
                        inloop++;
                    }
                    loop++;
                }
                if(root_arr.length == 1){
                    body[body.length] = "**Root Report Channel:** " + root_arr[0];
                }else{
                    body[body.length] = "**Root Report Channels:** \n" + root_arr.join('\n');
                }
            }
        }
        if(channel_obj.Type == "report" && channel_obj.Boss_Warnings == true){
            body[body.length] = "**Boss Respawn Warnings:** On";
        }else if(channel_obj.Type == "report" && channel_obj.Boss_Warnings == false){
            body[body.length] = "**Boss Respawn Warnings:** Off";
        }
        ch_Settings_Embed.addField("**#" + message.channel.name + "** Settings", body.join("\n"));
        ch_Settings_Embed.setFooter("To change channel settings use '" + guild_obj.key + "settings channel [setting]'. For help use '" + guild_obj.key + "help channel'");
        message.channel.send(ch_Settings_Embed);
        return;
    }
    var user_obj = null;
    guild_obj.User_Objects.forEach(Element => {
        if(Element.discord == message.author.id){
            user_obj = Element;
        }
    })
    var mod_check = true;
    if(user_obj != null){
        if(user_obj.moderator == false){
            mod_check = false;
        }
    }else{
        mod_check = false;
    }
    if(mod_check == false){
        switch(guild_obj.language){
            case 'english':
                message.channel.send("This command can only be used by moderators, or users given permission to use restricted commands by server admins.");
                break;
        }
        return;
    }
    //user put in arguments. Wants to update settings
    //settings that can be updated are: type, server, bf reminders, siege reminders, maint reminders, privacy and color
    //determine which setting they are trying to change and continue on to updating it
    if(in_Arr[0] == "type"){
        Update_Channel(message, guild_obj, channel_obj, "type");
    }else if(in_Arr[0] == "server"){
        Update_Channel(message, guild_obj, channel_obj, "server");
    }else if(in_Arr[0] == "battlefield" || in_Arr[0] == "bf"){
        Update_Channel(message, guild_obj, channel_obj, "battlefield");
    }else if(in_Arr[0] == "siege" || in_Arr[0] == "siegebattle" || in_Arr[0] == "guildsiege"){
        Update_Channel(message, guild_obj, channel_obj, "siege");
    }else if(in_Arr[0] == "maintanence" || in_Arr[0] == "maint"){
        Update_Channel(message, guild_obj, channel_obj, "maint");
    }else if(in_Arr[0] == "privacy" || in_Arr[0] == "private"){
        Update_Channel(message, guild_obj, channel_obj, "private");
    }else if(in_Arr[0] == "color"){
        Update_Channel(message, guild_obj, channel_obj, "color");
    }else if(in_Arr[0] == "root"){
        Update_Channel(message, guild_obj, channel_obj, "root");
    }else if(in_Arr[0] == 'warnings' || in_Arr[0] == 'respawn' || in_Arr[0] == 'warning' || in_Arr[0] == 'notif' || in_Arr[0] == 'notifs'){
        Update_Channel(message, guild_obj, channel_obj, 'respawn')
    }
}

function Channel_Del(channel){
    console.log(channel);
    //check to see if raven was registered to this channel
    var guild = client.guilds.cache.get(channel.guild.id);
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var loop = 0;
    var gID = null;
    while(loop < guilds.Guild_Objects.length){
        if(guilds.Guild_Objects[loop].discord == guild.id){
            gID = guilds.Guild_Objects[loop].id;
            loop = guilds.Guild_Objects.length;
        }
        loop++;
    }
    var guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + gID + ".json", "utf8"));
    loop = 0;
    var new_channels_arr = [];
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord != channel.id){
            new_channels_arr[new_channels_arr.length] = Element;
        }
    })
    if(new_channels_arr.length != guild_obj.Channel_Objects.length){
        console.log('channel delete registered');
        guild_obj.Channel_Objects = new_channels_arr;
        fs.writeFileSync("./Guild_Data/" + gID + ".json", JSON.stringify(guild_obj, null, 4), "utf8");
    }else{
        console.log('no registered channel was deleted. abort function');
    }
}

function Profile_Settings(message, guild_obj, in_Arr){
    //user wants to either view their settings or update a setting
    //profile settings include
    /*
        - is this an alt account?
        - if this is an alt account, what is your main account
        - is this a main account? What are your alt acccounts
        - name
        - mobile vs desktop mode
        - thumbnail image
        - accounts?
            - ability to add an account
            - ability to remove an account
        - Faction
        - privacy
    */
    var path = in_Arr[0];
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    var user_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var user_pointer = null;
    user_dir.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id || Element.alt.includes(message.author.id)){
            user_pointer = Element;
        }
    })
    if(user_pointer == null){
        message.channel.send("Unable to find user `" + message.author.user.username + "` file address");
        return;
    }
    var user_profile = JSON.parse(fs.readFileSync("./User_Data/" + user_pointer.id + ".json", "utf8"));
    var home_guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + user_profile.User_Object.home_guild + ".json", "utf8"));
    if(path == "settings" || path == "setting"){
        var User_Embed = new Discord.MessageEmbed()
            .setAuthor("profile settings", key.image, key.website)
            .setColor(guild_obj.color)
            .setFooter("User ID: " + user_pointer.id)
            .setTitle(user_profile.User_Object.Emoji + " **" + user_profile.User_Object.name + " Profile Settings**");
        if(channel_obj.color != null){
            User_Embed.setColor(channel_obj.color);
        }
        var body = [];
        body[0] = "**Name:** " + user_profile.User_Object.name;
        body[1] = "**Alternate Account:** " + user_profile.User_Object.alt;
        body[2] = "**Thumbnail:** " + user_profile.User_Object.Image;
        if(user_profile.User_Object.mobile == false){
            body[3] = "**View Mode:** Desktop";
        }else{
            body[3] = "**View Mode:** Mobile";
        }
        if(user_profile.User_Object.Faction == "L"){
            body[4] = "**Faction:** Lanos";  
        }else{
            body[4] = "**Faction:** Siras";
        }
        if(user_profile.User_Object.private == false){
            body[5] = "**Privacy:** Public";
        }else{
            body[5] = "**Privacy:** Private";
        }
        if(home_guild_obj.emoji == null){
            body[6] = "**Home Guild:** " + home_guild_obj.Guild_Name;
        }else{
            body[6] = "**Home Guild:** " + home_guild_obj.emoji + " " + home_guild_obj.Guild_Name;
        }
        User_Embed.addField("**<:RefiningTool:834973795323347004> Settings**", body.join("\n"));
        var account_body = [];
        var account_server = [];
        user_profile.User_Object.Accounts.forEach(Element => {
            if(Element.Class == "m"){
                account_body[account_body.length] = "<:Magician:846552434184552448> " + Element.Name;
            }else if(Element.Class == "r"){
                account_body[account_body.length] = "<:Ranger:846552449145765890> " + Element.Name;
            }else{
                account_body[account_body.length] = "<:Warrior:846552465666605076> " + Element.Name;
            }
            account_server[account_server.length] = Element.Server;
        })
        var loop = 0;
        if(account_body.length > 0){
            var servers = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
            servers.Server_Objects.forEach(Element => {
                var server_body = [];
                loop = 0;
                while(loop < account_body.length){
                    if(account_server[loop] == Element.Server){
                        server_body[server_body.length] = account_body[loop];
                    }
                    loop++;
                }
                if(server_body.length > 0){
                    User_Embed.addField(Element.Emoji + " **" + Element.Server + " Accounts**", server_body.join("\n"));
                }
            })
        }else{
            User_Embed.addField("**Accounts**", "No accounts registered");
        }
        message.channel.send(User_Embed);
    }else if(path == "alt" || path == "alternative"){
        Update_Profile(message, guild_obj, channel_obj, user_pointer, user_profile, "alt");
    }else if(path == "mobile" || path == "desktop" || path == "view"){
        Update_Profile(message, guild_obj, channel_obj, user_pointer, user_profile, "view");
    }else if(path == "accounts" || path == "account" || path == "character" || path == "characters" || path == "char"){
        Update_Profile(message, guild_obj, channel_obj, user_pointer, user_profile, "accounts");
    }else if(path == "faction" || path == "lanos" || path == "sira"){
        Update_Profile(message, guild_obj, channel_obj, user_pointer, user_profile, "faction");
    }else if(path == "privacy" || path == "private" || path == "public"){
        Update_Profile(message, guild_obj, channel_obj, user_pointer, user_profile, "privacy");
    }else if(path == "name" || path == "username" || path == "displayname"){
        Update_Profile(message, guild_obj, channel_obj, user_pointer, user_profile, "name");
    }else{
        switch(guild_obj.language){
            case "english":
                message.channel.send("Unable to determine `" + path + "`. Try `" + guild_obj.key + "help profile`");
                break;
        }
    }
}

async function Update_Profile(message, guild_obj, channel_obj, user_pointer, user_profile, path){
    console.log(user_pointer);
    console.log("USER_POINTER ^^\nUSER_PROFILE vv");
    console.log(user_profile);
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color);
    switch(path){
        case "alt":

            break;
        case "view":
            
            break;
        case "accounts":
            if(user_profile.User_Object.Accounts.length == 0){
                Add_Character(message, guild_obj, channel_obj, user_pointer, user_profile);
            }else{
                profile_embed.addField("**Add/Remove Character**", "1. Add a character\n2. Remove a character")
                var profile_response = await message.channel.send(profile_embed);
                const filter = m => m.content.author == message.channel.author;
                const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
                collector.on("end", collected => {
                    if(collected.size == 0){
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send("Operation timed out");
                                break;
                        }
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            profile_response.delete();
                        }
                        return;
                    }
                    if(collected.first().content.toString().toLowerCase() == "cancel"){
                        switch(guild_obj.language){
                            case 'english':
                                message.channel.send("Operation canceled.")
                                break;
                        }
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            profile_response.delete();
                            collected.first().delete();
                        }
                        return;
                    }
                    var input = collected.first().content.toString().toLowerCase();
                    if(input == "1" || input == "add"){
                        Add_Character(message, guild_obj, channel_obj, user_pointer, user_profile);
                    }else if(input == "2" || input == "remove"){
                        Remove_Character(message, guild_obj, channel_obj, user_pointer, user_profile);
                    }else{
                        message.channel.send("unable to determine `" + input + "` try " + guild_obj.key + "help profile");
                    }
                    if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                        profile_response.delete();
                        collected.first().delete();
                    }
                })
            }
            break;
        case "faction":
            var new_faction = null;
            if(user_profile.User_Object.Faction == "L"){
                new_faction = "Siras";
            }else{
                new_faction = "Lanos";
            }
            profile_embed.addField("**Change Faction**", "Change to " + new_faction + "\nReply 'yes' to confirm");
            var profile_response = await message.channel.send(profile_embed);
            const filter = m => m.content.author == message.channel.author;
            const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
            collector.on("end", collected => {
                if(collected.size == 0){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send("Operation timed out");
                            break;
                    }
                    if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                        profile_response.delete();
                    }
                    return;
                }
                if(collected.first().content.toString().toLowerCase() == "cancel"){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send("Operation canceled.")
                            break;
                    }
                    if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                        profile_response.delete();
                        collected.first().delete();
                    }
                    return;
                }
                if(collected.first().content.toString().toLowerCase() == "yes" || collected.first().content.toString().toLowerCase() == "y"){
                    //user has confirmed their change in faction
                    if(new_faction == "Siras"){
                        user_profile.User_Object.Faction = "S";
                    }else{
                        user_profile.User_Object.Faction = "L";
                    }
                    var user_rank = user_profile.User_Object.Rank;
                    var ranks = ["Recruit", "Scout", "Combat Soldier", "Veteran Soldier", "Apprentice Knight", "Fighter", "Elite Fighter", "Field Commander", "Commander", "General"];
                    var lanos_chevrons = ["<:1st_Chevron:846569476912578563>", "<:2ndChevron:846569477217976330>", "<:3rdChevron:846569476819910668>", "<:4thChevron:846569477247074314>", "<:5thChevron:846569477087690783>", "<:6thChevron:846569476861853707>", "<:7th_Chevron:846569476782948375>", "<:8th_Chevron:846569477393874945>", "<:9th_Chevron:846569477302648832>", "<:10th_Chevron:846569477042077697>"];
                    var siras_chevrons = ["<:S1_Chevron:846569477235277824>", "<:S2_Chevron:846569477063966771>", "<:S3_Chevron:846569476870635542>", "<:S4_Chevron:846569477352194058>", "<:S5_Chevron:846569477390598154>", "<:S6_Chevron:846569477340266506>", "<:S7_Chevron:846569477411045376>", "<:S8_Chevron:846569477306449920>", "<:S9_Chevron:846569477302779914>", "<:S10_Chevron:846569477264506932>"];
                    var rank_loop = 0;
                    while(rank_loop < ranks.length){
                        if(user_rank == ranks[rank_loop]){
                            if(new_faction == "Lanos"){
                                user_profile.User_Object.Emoji = lanos_chevrons[rank_loop];
                            }else{
                                user_profile.User_Object.Emoji = siras_chevrons[rank_loop];
                            }
                            rank_loop = ranks.length
                        }
                        rank_loop++;
                    }
                    fs.writeFileSync("./User_Data/" + user_profile.User_Object.id + ".json", JSON.stringify(user_profile, null, 4), "utf8");
                    if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                        profile_response.delete();
                        collected.first().delete();
                    }
                    var profile_updated = new Discord.MessageEmbed()
                        .setAuthor("Update Profile", key.image, key.website)
                        .setColor(guild_obj.color)
                        .setDescription("updated user " + user_profile.User_Object.name + " faction to " + new_faction)
                        .setFooter("User ID: " + user_profile.User_Object.id);
                        message.channel.send(profile_updated);
                }
            })
            
            break;
        case "privacy":
            User_Privacy(message, guild_obj, channel_obj, user_pointer, user_profile);
            break;
        case "name":
            Update_Username(message, guild_obj, channel_obj, user_pointer, user_profile);
            break;
    }
}

async function Update_Username(message, guild_obj, channel_obj, user_pointer, user_obj){
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color)
        .addField("**Update Display Username**", "Respond with a new username less that 33 characters\nCurrent Username: " + user_obj.User_Object.name)
        .setFooter("This username will be displayed on profile, leaderbaords and other raven stat menus");
    if(channel_obj.color != null){
        profile_embed.setColor(channel_obj.color);
    }
    var response = await message.channel.send(profile_embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Opteration timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
            }
        }
        var response = collected.first().content.toString();
        if(response.includes("<") || response.includes(">") || response.includes("@") || response.includes(":") || response.includes("\n") || response.includes("\r")){
            message.channel.send("Invalid username `" + response + "`\n. Your username can not includes `<, >, @, :` or a discord emoji");
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            return;
        }else if(response.length > 32){
            message.channel.send("Invalid username, your username must be less than 33 characters");
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            return;
        }else{
            var response_embed = new Discord.MessageEmbed()
                .setAuthor("Update Profile", key.image, key.website)
                .setColor(guild_obj.color)
                .addField("**Updated Display Username**", response);
            if(channel_obj.color != null){
                response_embed.setColor(channel_obj.color);
            }
            var users_json = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
            users_json.Member_Objects[parseInt(user_obj.User_Object.id.slice(1), 10) - 1].name = response;
            fs.writeFileSync("./User_Data/users.json", JSON.stringify(users_json, null, 4), "utf8");
            user_obj.User_Object.name = response;
            fs.writeFileSync("./User_Data/" + user_obj.User_Object.id + ".json", JSON.stringify(user_obj, null, 4), "utf8");
            message.channel.send(response_embed)
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                collected.first().delete();
                profile_embed.delete();
            }
        }
    })
}

async function User_Privacy(message, guild_obj, channel_obj, user_pointer, user_obj){
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color)
        .setFooter("Reply `yes` to update your privacy setting");
    if(channel_obj.color != null){
        profile_embed.setColor(channel_obj.color);
    }
    if(user_obj.User_Object.private == false){
        profile_embed.addField("**Set Profile to Private?**", "Setting your profile to private removes you from searches and menus in other servers. Other servers will no longer have access to your stat and profile summary.");
    }else{
        profile_embed.addField("**Set Profile to Public?**", "Setting your profile to public allows your droprates, score and profile summary to be viewed in other servers. Your boss timers and timer history will remain private.");
    }
    var response = await message.channel.send(profile_embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Opteration timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
            }
        }
        var response = collected.first().content.toString().toLowerCase();
        if(response == "yes" || response == "y"){
            var response_embed = new Discord.MessageEmbed()
                .setAuthor("Update Profile", key.image, key.website)
                .setColor(guild_obj.color);
            if(channel_obj.color != null){
                response_embed.setColor(channel_obj.color);
            }
            if(user_obj.User_Object.private == false){
                user_obj.User_Object.private = true;
                response_embed.setDescription("**Profile privacy set to Private**");
            }else{
                user_obj.User_Object.private = false;
                response_embed.setDescription("**Profile privacy set to Public**");
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            message.channel.send(response_embed);
            fs.writeFileSync("./User_Data/" + user_obj.User_Object.id + ".json", JSON.stringify(user_obj, null, 4), "utf8");
            return;
        }else{
            message.channel.send("Command Canceled");
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                collected.first().delete();
                profile_embed.delete();
            }
        }
    })
}

async function Add_Character(message, guild_obj, channel_obj, user_pointer, user_obj){
    //user wants to add a character to their profile
    //we will need to know what server it is on, what class it is, and what it's name is
    //start with the server
    var servers = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    var server_disp = [];
    servers.Server_Objects.forEach(Element => {
        if(Element.Emoji != null){
            server_disp[server_disp.length] = (server_disp.length + 1).toString() + ". " + Element.Emoji + " " + Element.Server;
        }else{
            server_disp[server_disp.length] = (server_disp.length + 1).toString() + '. ' + Element.Server;
        }
    })
    var profile_embed1 = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color)
        .addField("**Select Your Server**", server_disp.join("\n"))
        .setFooter("Select from the above menu with the number corresponding to the server");
    var profile_response1 = await message.channel.send(profile_embed1);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response1.delete();
            }
            return;
        }
        if(collected.first().content.toString().toLowerCase() == "cancel"){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation canceled.")
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response1.delete();
                collected.first().delete();
            }
            return;
        }
        var select = null;
        var loop = 0;
        while(loop < servers.Server_Objects.length){
            if(collected.first().content.toString().toLowerCase() == servers.Server_Objects[loop].Server.toLowerCase()){
                select = servers.Server_Objects[loop];
                loop = servers.Server_Objects.length;
            }else if(collected.first().content.toString() == (loop + 1).toString()){
                select = servers.Server_Objects[loop];
                loop = servers.Server_Objects.length;
            }
            loop++;
        }
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            profile_response1.delete();
            collected.first().delete();
        }
        console.log(select);
        if(select == null){
            message.channel.send("Unable to determine `" + collected.first().content + "` try " + guild_obj.key + "help profile");
        }else{
            Add_Character_Cont(message, guild_obj, channel_obj, user_pointer, user_obj, select);
        }
    })
}

async function Add_Character_Cont(message, guild_obj, channel_obj, user_pointer, user_obj, selected_server){
    //user wants to add a character to their profile
    //Next, will need to chose a class
    var class_disp = [
        "1. <:Warrior:846552465666605076> Warrior",
        "2. <:Ranger:846552449145765890> Ranger",
        "3. <:Magician:846552434184552448> Magician"];
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color)
        .addField("**Select Your Class**", class_disp.join("\n"))
        .setFooter("Select from the above menu with the number corresponding to the class");
    var profile_response = await message.channel.send(profile_embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
            }
            return;
        }
        if(collected.first().content.toString().toLowerCase() == "cancel"){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation canceled.")
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            return;
        }
        var select = null;
        var input = collected.first().content.toString().toLowerCase();
        if(isNaN(parseInt(input, 10)) == false){
            input = parseInt(input, 10).toString();
        }
        if(input == "1" || input == "warrior" || input == "warr" || input == "w" || input == "war"){
            select = "w";
        }else if(input == "2" || input == "ranger" || input == "rang" || input == "r"){
            select = "r";
        }else if(input == "3" || input == "magician" || input == "mage" || input == "m" || input == "wizard"){
            select = "m";
        }
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            profile_response.delete();
            collected.first().delete();
        }
        console.log(select);
        if(select == null){
            message.channel.send("Unable to determine `" + collected.first().content + "` try " + guild_obj.key + "help profile");
        }else{
            Add_Character_Name(message, guild_obj, channel_obj, user_pointer, user_obj, selected_server, select);
        }
    })
}

async function Add_Character_Name(message, guild_obj, channel_obj, user_pointer, user_obj, selected_server, selected_class){
    var valid_characters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color)
        .addField("**What is your username?**", "1 to 10 characters, no special characters");
    var profile_response = await message.channel.send(profile_embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
            }
            return;
        }
        var input = collected.first().content.toString()
        var english_server = false;
        var valid_check = true;
        if(selected_server.Server == "BIGMAMA" || selected_server.Server == "DEVILANG" || selected_server.Server == "WADANGKA" || selected_server.Server == "CALIGO" || selected_server.Server == "TURTLEZ" || selected_server.Server == "NEWSTAR" || selected_server.Server == "DARLENE" || selected_server.Server == "BARSLAF" || selected_server.Server == "KANOS"){
            english_server = true;
            input.split("").forEach(Element => {
                if(valid_characters.includes(Element.toLowerCase()) == false){
                    valid_check = false;
                }
            })
        }
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            profile_response.delete();
            collected.first().delete();
        }
        console.log("enter username function\n" + user_obj);
        if(input.length > 10){
            message.channel.send("`" + input + "` is over 10 characters long");
        }else if(english_server == true && valid_check == false){
            message.channel.send("`" + input + "` is not a valid username");
        }else{
            Add_Character_Verify(message, guild_obj, channel_obj, user_pointer, user_obj, selected_server, selected_class, input);
        }
        
        
    })
}

async function Add_Character_Verify(message, guild_obj, channel_obj, user_pointer, user_obj, selected_server, selected_class, input_username){
    console.log(selected_server.Server, selected_class, input_username);
    //check to make sure the account isnt already registered.
    var check = false;
    user_obj.User_Object.Accounts.forEach(Element => {
        console.log("CHECKING... " + Element.Name + " - " + Element.Server);
        if(Element.Name.toLowerCase() == input_username.toLowerCase() && Element.Server == selected_server.Server){
            check = true;
        }
    })
    if(check == true){
        if(selected_server.Emoji != null){
            message.channel.send("The character `" + input_username + "` on server " + selected_server.Emoji + selected_server.Server + " has already been registered to your profile.");
        }else{
            message.channel.send("The character `" + input_username + "` on server " + selected_server.Server + " has already been registered to your profile.");
        }
        return;
    }
    //check to see if this character is registered to another account
    var users_json = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var check = false;
    var match_arr = [];
    users_json.Member_Objects.forEach(Element => {
        if(Element.id != user_obj.User_Object.id){
            console.log("CHECKING... " + Element.id + " For account " + input_username + " on server " + selected_server.Server);
            var user_file = JSON.parse(fs.readFileSync("./User_Data/" + Element.id + ".json", "utf8"));
            var loop = 0;
            while(loop < user_file.User_Object.Accounts.length){
                if(user_file.User_Object.Accounts[loop].Name.toLowerCase() == input_username.toLowerCase() && user_file.User_Object.Accounts[loop].Server == selected_server.Server){
                    match_arr[match_arr.length] = user_file.User_Object;
                    console.log("FOUND MATCH IN " + Element.id);
                }
                loop++;
            }
        }
    })
    var class_disp = null;
    if(selected_class == "w"){
        class_disp = "<:Warrior:846552465666605076> " + input_username; 
    }else if(selected_class == "r"){
        class_disp = "<:Ranger:846552449145765890> " + input_username;
    }else{
        class_disp = "<:Magician:846552434184552448> " + input_username;
    }
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color);
    if(selected_server.Emoji != null){
        profile_embed.addField("**Confirm Character**", selected_server.Emoji + " " + selected_server.Server + "\n" + class_disp + "\nReply `yes` to confirm");
    }else{
        profile_embed.addField("**Confirm Character**", selected_server.Server + "\n" + class_disp + "\nReply `yes` to confirm");
    }
    if(channel_obj.color != null){
        profile_embed.setColor(channel_obj.color);
    }
    var uID_Arr = [];
    match_arr.forEach(Element => {
        uID_Arr[uID_Arr.length] = Element.id;
    })
    if(match_arr.length == 1){
        profile_embed.addField("**WARNING**", "User " + uID_Arr[0] + " already has " + class_disp + " on " + selected_server.Server + " registered to their profile. Do you want to proceed?\nThis user will be notified that you registered this character to your profile.\n\nIf you are the owner of this account, contact a moderator.");
    }else if(match_arr.length > 1){
        profile_embed.addField("**WARNING**", "Users " + uID_Arr.join(",") + " already have " + class_disp + " on " + selected_server.Server + " registered to their profiles. Do you want to proceed?\nThese users will be notified that you registered this character to your profile.\n\nIf you are the owner of this account, contact a moderator.");
    }
    var profile_response = await message.channel.send(profile_embed);
    const filter = m => m.content.author == message.channel.author;
    const collecter = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collecter.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Opteration Timed Out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
            }
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input == 'cancel' || input == 'no'){
            message.channel.send("Canceling Operation");
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            return;
        }else if(input == "yes" || input == "y" || input == "confirm"){
            var reply_embed = new Discord.MessageEmbed()
                .setAuthor("Update Profile", key.image, key.website)
                .setColor(guild_obj.Color);
            if(channel_obj.Color != null){
                reply_embed.setColor(channel_obj.Color);
            }
            if(selected_server.Emoji != null){
                reply_embed.addField("**Confirmed New Character Added**", selected_server.Emoji + " " + selected_server.Server + "\n" + class_disp);
            }else{
                reply_embed.addField("**Confirmed New Character Added**", selected_server.Server + "\n" + class_disp);
            }
            reply_embed.setFooter("This character is unverified. Contact a Raven moderator to have your characters verified");
            message.channel.send(reply_embed);
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            if(match_arr.length > 0){
                var loop = 0;
                while(loop < match_arr.length){
                    var user = client.users.cache.get(match_arr[loop].discord);
                    user.send("User `" + user_obj.User_Object.id + "` (" + user_obj.User_Object.name + ") has registered the character " + class_disp + " in the server " + selected_server.Server + "\n\nTo dispute this contact a moderator.")
                    loop++;
                }
            }
            user_obj.User_Object.Accounts[user_obj.User_Object.Accounts.length] = {
                "Name": input_username,
                "Class": selected_class,
                "Server": selected_server.Server.toUpperCase(),
                "Verified": false
            }
            fs.writeFileSync("./User_Data/" + user_obj.User_Object.id + ".json", JSON.stringify(user_obj, null, 4), "utf8");
        }
    })
}

async function Remove_Character(message, guild_obj, channel_obj, user_pointer, user_obj){
    //remove a character
    //build a menu of all registered characters and have them chose from the menu, then confirm
    var emojis = [
        "<:Warrior:846552465666605076> ",
        "<:Ranger:846552449145765890> ",
        "<:Magician:846552434184552448> "];
    var char_arr = [];
    var server = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription("Chose from the below menu for a character to remove from your profile");
    if(channel_obj.Color != null){
        profile_embed.setColor = channel_obj.Color;
    }
    server.Server_Objects.forEach(Element => {
        var loop = 0;
        var server_chars = [];
        while(loop < user_obj.User_Object.Accounts.length){
            if(user_obj.User_Object.Accounts[loop].Server == Element.Server){
                if(user_obj.User_Object.Accounts[loop].Class == "w"){
                    server_chars[server_chars.length] = (char_arr.length + 1).toString() + ". " + emojis[0] + user_obj.User_Object.Accounts[loop].Name;
                }else if(user_obj.User_Object.Accounts[loop].Class == "r"){
                    server_chars[server_chars.length] = (char_arr.length + 1).toString() + ". " + emojis[1] + user_obj.User_Object.Accounts[loop].Name;
                }else{
                    server_chars[server_chars.length] = (char_arr.length + 1).toString() + ". " + emojis[2] + user_obj.User_Object.Accounts[loop].Name;
                }
                char_arr[char_arr.length] = user_obj.User_Object.Accounts[loop];
            }
            loop++;
        }
        if(server_chars.length > 0){
            console.log(server_chars);
            if(Element.Emoji == null){
                profile_embed.addField("**" + Element.Server + "**", server_chars.join("\n"));
            }else{
                profile_embed.addField(Element.Emoji + " **" + Element.Server + "**", server_chars.join("\n"));
            }
        }
    })
    var profile_response = await message.channel.send(profile_embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
            }
            return;
        }
        if(collected.first().content.toString().toLowerCase() == "cancel"){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation canceled.")
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            return;
        }
        var input = parseInt(collected.first().content.toString(), 10);
        if(isNaN(input) == true || input < 1 || input > char_arr.length){
            message.channel.send("Unable to determine `" + collected.first().content.toString() + "`");
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
        }else{
            //valid response detected
            var delete_selected = char_arr[input - 1];
            console.log(delete_selected);
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            Confirm_Delete_Character(message, guild_obj, channel_obj, user_pointer, user_obj, delete_selected);
        }
        
    })
}

async function Confirm_Delete_Character(message, guild_obj, channel_obj, user_pointer, user_obj, selected_char){
    //confirm the users choice
    var profile_embed = new Discord.MessageEmbed()
        .setAuthor("Update Profile", key.image, key.website)
        .setColor(guild_obj.Color)
        .setDescription("Confirm your choice\nDelete this character from your profile? Reply `yes` to confirm.");
    if(channel_obj.Color != null){
        profile_embed.setColor(channel_obj.Color);
    }
    var char_disp = null;
    var emojis = [
        "<:Warrior:846552465666605076> ",
        "<:Ranger:846552449145765890> ",
        "<:Magician:846552434184552448> "];
    if(selected_char.Class == "w"){
        char_disp = emojis[0] + " " + selected_char.Name;
    }else if(selected_char.Class == "r"){
        char_disp = emojis[1] + " " + selected_char.Name;
    }else{
        char_disp = emojis[2] + " " + selected_char.Name;
    }
    var servers = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    servers.Server_Objects.forEach(Element => {
        if(Element.Server == selected_char.Server){
            if(Element.Emoji != null){
                profile_embed.addField(Element.Emoji + " **" + Element.Server + "**", char_disp);
            }else{
                profile_embed.addField("**" + Element.Server + "**", char_disp);
            }
        }
    })
    if(selected_char.Verified == true){
        profile_embed.setFooter("This character has been verified by Raven moderators");
    }else{
        profile_embed.setFooter("This character is not verified by Raven moderators");
    }
    var profile_response = await message.channel.send(profile_embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
            }
            return;
        }
        if(collected.first().content.toString().toLowerCase() == "cancel"){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation canceled.")
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input == "yes" || input == "y" || input == "confirm"){
            var trimmed_arr = [];
            user_obj.User_Object.Accounts.forEach(Element => {
                if(Element.Name != selected_char.Name || Element.Server != selected_char.Server){
                    trimmed_arr[trimmed_arr.length] = Element;
                }
            })
            user_obj.User_Object.Accounts = [];
            user_obj.User_Object.Accounts = trimmed_arr;
            fs.writeFileSync("./User_Data/" + user_obj.User_Object.id + ".json", JSON.stringify(user_obj, null, 4), "utf8");
            profile_embed.setDescription("The following character has been deleted from your profile");
            profile_embed.setFooter(" ");
            message.channel.send(profile_embed);
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
        }else{
            message.channel.send("Unable to determine input `" + collected.first().toString() + "`");
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                profile_response.delete();
                collected.first().delete();
            }
        }
    })
}

async function Update_Channel(message, guild_obj, channel_obj, path){
    //user has determined which setting in a channel they would like to change. Continue on to construct the question
    //create a messagecollector to recieve the reply or confirmation, then update settings in json file for guild
    var Channel_Embed = new Discord.MessageEmbed()
        .setAuthor("Update Channel", key.image, key.website)
        .setColor(guild_obj.color);
    if(channel_obj.color != null){
        Channel_Embed.setColor(channel_obj.color);
    }
    var loop = null;
    var errors = false;
    switch(path){
        case 'type':
            Channel_Embed.addField("**Update Channel Type**", "Current Channel Type: " + channel_obj.Type);
            Channel_Embed.addField("**Chose A New Channel Type**", "1. Home Channel\n2. Discussion Channel\n3. Report Channel\n4. Boss Notifs Channel");
            if(channel_obj.Type == 'home'){
                Channel_Embed.addField("**Warning**", "You are attempting to change the type of your current Home channel. It is recommended that you use a home channel for Raven to operate");
            }
            break;
        case 'server':
            if(channel_obj.Type == "report"){
                Channel_Embed.addField("**Update Server Setting**", "Current Channel Server: " + channel_obj.Server);
                var server_Arr = fs.readFileSync("./menus/servers.txt").toString().split("\n");
                var body = [];
                server_Arr.forEach(Element => {
                    body[body.length] = (body.length + 1).toString() + ". " + Element;
                })
                Channel_Embed.addField("**Select A New Server**", body.join("\n"));
            }else{
                Channel_Embed.setDescription("Server setting can only be applied to report-type channels");
                errors = true;
            }
            break;
        case 'battlefield':
            Channel_Embed.addField("**Battlefield Reminders**", "Current Setting: " + channel_obj.Battlefield);
            if(channel_obj.Battlefield == false){
                Channel_Embed.addField("**Change Battlefield Reminders to On**", "Reply 'yes' to confirm");
            }else{
                Channel_Embed.addField("**Change Battlefield Reminders to Off**", "Reply 'yes' to confirm");
            }
            break;
        case 'siege':
            Channel_Embed.addField("**Siege Battle Reminders**", "Current Setting: " + channel_obj.Siege);
            if(channel_obj.Siege == false){
                Channel_Embed.addField("**Change Siege Battle Reminders to On**", "Reply 'yes' to confirm");
            }else{
                Channel_Embed.addField("**Change Siege Battle Reminders to Off**", "Reply 'yes' to confirm");
            }
            break;
        case 'maint':
            Channel_Embed.addField("**Maintanence Reminders**", "Current Setting: " + channel_obj.Maint);
            if(channel_obj.Maint == false){
                Channel_Embed.addField("**Change Maintanence Reminders to On**", "Reply 'yes' to confirm");
            }else{
                Channel_Embed.addField("**Change Maintanence Reminders to Off**", "Reply 'yes' to confirm");
            }
            break;
        case 'private':
            if(channel_obj.Type == "report"){
                Channel_Embed.addField("**Privacy Setting**", "Current Setting: " + channel_obj.Private);
                if(channel_obj.Private == false){
                    Channel_Embed.addField("**Make This Channel Private?**", "Reply 'yes' to confirm");
                    Channel_Embed.setFooter("Making this channel private will make it so that users in other channels can not view boss respawn times reported in this channel");
                }else{
                    Channel_Embed.addField("**Make This Channel Public?**", "Reply 'yes' to confirm");
                    Channel_Embed.setFooter("Making this channel private will make it so that users in other channels can view boss respawn times reported in this channel")
                }
            }else{
                Channel_Embed.setDescription("Privacy setting can only be applied to report-type channels");
                errors = true;
            }
            break;
        case 'color':
            Channel_Embed.addField("**Channel Color**", "Current Setting: " + channel_obj.color);
            Channel_Embed.addField("**Update Channel Color**", "Reply with the new guild color in the form of a valid hex code\nOr, reply 'remove' to change color back to guild default.\nReply 'cancel' to make no change");
            break;
        case 'root':
            if(channel_obj.Type == "notif"){
                var report_channels_arr = [];
                var chIDs = [];
                guild_obj.Channel_Objects.forEach(Element => {
                    if(Element.Type == "report"){
                        report_channels_arr[report_channels_arr.length] = Element.discord;
                        chIDs[chIDs.length] = Element.id;
                    }
                })
                var loop = 0;
                while(loop < report_channels_arr.length){
                    report_channels_arr[loop] = (loop + 1).toString() + ". " + chIDs[loop] + " -- #" + client.channels.cache.get(report_channels_arr[loop]).name;
                    loop++;
                }
                console.log(message.channel);
                var root_arr = [];
                if(channel_obj.Root.length == 0){
                    Channel_Embed.addField("**Root Report Channel**", "Current setings: none");
                    Channel_Embed.addField("**Update Root Report Channel(s)**", report_channels_arr.join("\n"));
                }else{
                    channel_obj.Root.forEach(Element => {
                        root_arr[root_arr.length] = Element;
                    })
                    var loop = 0;
                    while(loop < root_arr.length){
                        var inloop = 0;
                        while(inloop < guild_obj.Channel_Objects.length){
                            if(guild_obj.Channel_Objects[inloop].id == root_arr[loop]){
                                root_arr[loop] = client.channels.cache.get(guild_obj.Channel_Objects[inloop].discord);
                                inloop = guild_obj.Channel_Objects.length;
                            }
                            inloop++;
                        }
                        loop++;
                    }
                    if(root_arr.length == 1){
                        body[body.length] = "**Root Report Channel:** " + root_arr[0];
                    }else{
                        body[body.length] = "**Root Report Channels:** " + root_arr.join(' ');
                    }
                }
            }else{
                Channel_Embed.setDescription("Root Report Channels are restricted to notif-type channels");
                errors = true;
            }
            
            break;
        case 'respawn': 
            Channel_Embed.addField("**Boss Respawn Warnings**", "Current Setting: " + channel_obj.Boss_Warnings);
            if(channel_obj.Boss_Warnings == true){
                Channel_Embed.addField("**Turn Boss Respawn Warnings Off?**", "reply 'yes' to confirm\n\n**Warning**: If you do not have a seperate notifs channel for bosses, This will turn off all notifications for boss spawns reported in this channel");
            }else{
                Channel_Embed.addField("**Turn Boss Respawn Warnings On?**", "reply 'yes' to confirm\n\n**Warning**: if you have have a notifs-type channel for respawn messages this will send duplicate messages to both channels.");
            }
            break;
    }
    var Channel_Prompt = await message.channel.send(Channel_Embed);
    if(errors == true){
        return;
    }
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out.");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Channel_Prompt.delete();
            }
            return;
        }
        var reply = collected.first().content.toString().toLowerCase();
        var confirm_Embed = new Discord.MessageEmbed()
            .setAuthor("Channel Settings", key.image, key.website)
            .setColor(guild_obj.color)
            .setFooter(channel_obj.id);
        if(channel_obj.color != null){
            confirm_Embed.setColor(channel_obj.color);
        }
        if(reply == 'cancel' || reply == 'cancle'){
            confirm_Embed.setDescription("No changes made");
        }else{
            switch(path){
                case 'type':
                    var home_check = false;
                    guild_obj.Channel_Objects.forEach(Element => {
                        if(Element.id != channel_obj.id && Element.Type == 'home'){
                            home_check == true;
                        }
                    })
                    if(reply == "1" && home_check == false){
                        channel_obj.Type = "home";
                        confirm_Embed.setDescription("Channel type updated to 'home'");
                    }else if(reply == "1"){
                        confirm_Embed.setDescription("Unable to change type to 'home'.\nThere can only be one Home channel per discord server");
                    }else if(reply == "2"){
                        channel_obj.Type = "discussion";
                        confirm_Embed.setDescription("Channel type updated to 'discussion'");
                    }else if(reply == "3"){
                        channel_obj.Type = "report";
                        confirm_Embed.setDescription("Channel type updated to 'report'");
                    }else if(reply == "4"){
                        channel_obj.Type = "notif";
                        confirm_Embed.setDescription("Channel type updated to `Boss Notifications`");
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel");
                        }
                    }
                    break;
                case 'server':
                    var select_num = parseInt(reply, 10) - 1;
                    var server_Arr = fs.readFileSync("./menus/servers.txt").toString().split("\n");
                    if(isNaN(select_num) == true || select_num < 0 || select_num > server_Arr.length - 1){
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel");
                        }
                    }else{
                        var server_select = server_Arr[select_num];
                        channel_obj.Server = server_select;
                        confirm_Embed.setDescription("Channel server updated to '" + server_select + "'");
                    }
                    break;
                case 'battlefield':
                    if(reply == "y" || reply == "yes"){
                        if(channel_obj.Battlefield == false){
                            confirm_Embed.setDescription("Battlefield reminders set to on");
                            channel_obj.Battlefield = true;
                        }else{
                            confirm_Embed.setDescription("Battlefield reminders set to off");
                            channel_obj.Battlefield = false;
                        }
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel'");
                                break;
                        }
                    }
                    break;
                case 'siege':
                    if(reply == "y" || reply == "yes"){
                        if(channel_obj.Siege == false){
                            confirm_Embed.setDescription("Siege Battles reminders set to on");
                            channel_obj.Siege = true;
                        }else{
                            confirm_Embed.setDescription("Siege Battles reminders set to off");
                            channel_obj.Siege = false;
                        }
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel'");
                                break;
                        }
                    }
                    break;
                case 'maint':
                    if(reply == "y" || reply == "yes"){
                        if(channel_obj.Maint == false){
                            confirm_Embed.setDescription("Maintanence reminders set to on");
                            channel_obj.Maint = true;
                        }else{
                            confirm_Embed.setDescription("Maintanence reminders set to off");
                            channel_obj.Maint = false;
                        }
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel'");
                                break;
                        }
                    }
                    break;
                case 'private':
                    if(reply == "y" || reply == "yes"){
                        if(channel_obj.Private == false){
                            confirm_Embed.setDescription("Channel set to private");
                            channel_obj.Private = true;
                        }else{
                            confirm_Embed.setDescription("Channel set to public");
                            channel_obj.Private = false;
                        }
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel'");
                                break;
                        }
                    }
                    break;
                case 'color':
                    var hex = parseInt(reply, 16);
                    if(reply == 'remove' || reply == 'none'){
                        channel_obj.color = null;
                        confirm_Embed.setColor(guild_obj.color);
                        confirm_Embed.setDescription("Channel color removed.");
                    }else if(reply == 'cancel' || reply == 'cancle'){
                        confirm_Embed.setDescription("No changes made.");
                    }else if(isNaN(hex) == false && reply.length == 6){
                        channel_obj.color = reply;
                        confirm_Embed.setDescription("Channel color set to '" + reply + "'");
                        confirm_Embed.setColor(reply);
                    }else{
                        confirm_Embed.setDescription("Unable to determine '" + reply + "'");
                        confirm_Embed.addField("Check color-hex for valid hex codes", "https://www.color-hex.com/");
                    }
                    break;
                case 'root':
                    var selection = reply.split(" ");
                    var loop = 0;
                    var valid = true;
                    while(loop < selection.length && valid == true){
                        //check each selection for a valid response
                        selection[loop] = parseInt(selection[loop], 10) - 1;
                        //use arr chIDs to reference
                        if(isNaN(selection[loop]) == true || selection[loop] < 0 || selection[loop] > chIDs.length){
                            valid = false;
                            confirm_Embed.setDescription("Unable to determine `" + reply.split(" ")[loop] + "`");
                        }
                        loop++;
                    }
                    if(valid == true){
                        var loop = 0;
                        var confirm_body = [];
                        console.log(report_channels_arr);
                        while(loop < selection.length){
                            if(channel_obj.Root.includes(chIDs[selection[loop]])){
                                //make no change
                            }else{
                                channel_obj.Root[channel_obj.Root.length] = chIDs[loop];
                                confirm_body[confirm_body.length] = chIDs[loop] + " -- #" + report_channels_arr[loop].split("#")[1];
                            }
                            loop++;
                        }
                        confirm_Embed.setDescription("Updated Root Channels");
                        confirm_Embed.addField("**Report Root Channels added**", confirm_body.join("\n"));
                    }
                    break;
                case 'respawn': 
                    if(reply == "y" || reply == "yes"){
                        if(channel_obj.Boss_Warnings == false){
                            confirm_Embed.setDescription("Boss Respawn Messages for #" + message.channel.name + " set to on");
                            channel_obj.Boss_Warnings = true;
                        }else{
                            confirm_Embed.setDescription("Boss Respawn Messages for #" + message.channel.name + " set to off");
                            channel_obj.Boss_Warnings = false;
                        }
                    }else{
                        switch(guild_obj.language){
                            case 'english':
                                confirm_Embed.setDescription("Unable to determine '" + reply + "'. Try '" + guild_obj.key + "help channel'");
                                break;
                        }
                    }
                    break;
            }
            //refresh guild file incase it has been updated since the start of the function
            guild_obj = JSON.parse(fs.readFileSync("./Guild_Data/" + guild_obj.id + ".json", "utf8"));
            loop = 0;
            while(loop < guild_obj.Channel_Objects.length){
                if(guild_obj.Channel_Objects[loop].id == channel_obj.id){
                    guild_obj.Channel_Objects[loop] = channel_obj;
                    loop = guild_obj.Channel_Objects.length;
                }
                loop++;
            }
        }
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            collected.first().delete();
            Channel_Prompt.delete();
        }
        
        fs.writeFileSync("./Guild_Data/" + guild_obj.id + ".json", JSON.stringify(guild_obj, null, 4), "utf8");
        message.channel.send(confirm_Embed);
    })
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
            
            if(check == true){
                var boss_json_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
                //manuall set mID for bosses that appear on multiple maps. the loop matching name wont work right
                if(Boss_Menu[loop].split("|")[0] == "Bulldozer Jr. (Woody-Weedy Forest)"){
                    mID = "m001";
                }else if(Boss_Menu[loop].split("|")[0] == "Bulldozer Jr. (Woody-Wordy Forest)"){
                    mID = "m002";
                }else if(Boss_Menu[loop].split("|")[0] == "BULLDOZER (Woody-Weedy Forest)"){
                    mID = "m003"
                }else if(Boss_Menu[loop].split("|")[0] == "BULLDOZER (Woody-Wordy Forest)"){
                    mID = "m004";
                }else if(Boss_Menu[loop].split("|")[0] == "BULLDOZER'S BROTHER (Woody-Weedy Forest)"){
                    mID = "m005";
                }else if(Boss_Menu[loop].split("|")[0] == "BULLDOZER'S BROTHER (Woody-Wordy Forest)"){
                    mID = "m006";
                }else if(Boss_Menu[loop].split("|")[0] == "Mutant Woopa (Wingfril Island Beach)"){
                    mID = "m011";
                }else if(Boss_Menu[loop].split("|")[0] == "Mutant Woopa (Island with the Lighthouse)"){
                    mID = "m012";
                }else if(Boss_Menu[loop].split("|")[0] == "CHIEF WOOPAROOPA (Wingfril Island Beach)"){
                    mID = "m013";
                }else if(Boss_Menu[loop].split("|")[0] == "CHIEF WOOPAROOPA (Island with the Lighthouse)"){
                    mID = "m014";
                }else if(Boss_Menu[loop].split("|")[0] == "Hellhound (Maze Forest)"){
                    mID = "m101";
                }else if(Boss_Menu[loop].split("|")[0] == "Hellhound (Maze Forest Caves)"){
                    mID = "m102";
                }else if(Boss_Menu[loop].split("|")[0] == "Death Stalker (Maze Forest)"){
                    mID = "m103";
                }else if(Boss_Menu[loop].split("|")[0] == "Death Stalker (Maze Forest Caves)"){
                    mID = "m104";
                }else if(Boss_Menu[loop].split("|")[0] == "Dark Golem (Maze Forest)"){
                    mID = "m105";
                }else if(Boss_Menu[loop].split("|")[0] == "Dark Golem (Maze Forest Caves)"){
                    mID = "m106";
                }else{
                    var dir_loop = 6;
                    while(dir_loop < boss_json_dir.Boss_Select.length){
                        if(boss_json_dir.Boss_Select[dir_loop].Title == Boss_Menu[loop].split("|")[0]){
                            mID = boss_json_dir.Boss_Select[dir_loop].mID;
                            dir_loop = boss_json_dir.Boss_Select.length;
                        }
                        dir_loop++;
                    }
                }
                /*
                mID = loop.toString();
                if(Boss_Menu[loop - 1].split("|")[0] == "Big Foot"){
                    mID = "218";
                }
                while(mID.length < 3){
                    mID = '0' + mID;
                }
                mID = 'm' + mID;*/
                boss_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + mID + '.json', 'utf8'));
                loop = Boss_Menu.length;
            }
            loop++;
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
    loop = 1;
    while(loop < in_Arr.length){
        if(in_Arr[loop] == "u" && loop < in_Arr.length - 1){
            if(isNaN(in_Arr[loop + 1]) == false){
                in_Arr[loop] = "u" + in_Arr[loop + 1];
                in_Arr[loop + 1] = "";
            }
        }
        loop++;
    }
    in_Arr.forEach(Element => {
        if(Element.startsWith('<@!')){
            user_discord_ids[user_discord_ids.length] = Element.slice(3,-1);
        }else if(Element.startsWith('<@&')){
            role_discord_ids[role_discord_ids.length] = Element.slice(3,-1);
        }else if(Element.startsWith('<@')){
            user_discord_ids[user_discord_ids.length] = Element.slice(2,-1)
        }else if(Element.startsWith('u') && isNaN(Element.slice(1)) == false && Element.length > 1){
            //check if user input is valid
            users[users.length] = parseInt(Element.slice(1), 10).toString();
            while(users[users.length - 1].length < 3){
                users[users.length - 1] = '0' + users[users.length - 1]
            }
            users[users.length - 1] = 'u' + users[users.length - 1];
        }else if(Element == 'lost' || Element == 'none'){
            is_Lost = true;
        }
    })
    loop = 0;
    var u_err_arr = [];
    var total_raven_users = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8")).Total_Members;
    while(loop < users.length){
        console.log("checking " + users[loop] + " " + parseInt(users[loop].slice(1)) + " against " + total_raven_users);
        if(total_raven_users > (parseInt(users[loop].slice(1), 10) - 1) && parseInt(users[loop].slice(1), 10) > 0){
            var temp_u_file = JSON.parse(fs.readFileSync("./User_Data/" + users[loop] + ".json", "utf8"));
            if(temp_u_file.User_Object.guilds.includes(guild_obj.id)){
                //user is a valid entry
            }else{
                u_err_arr[u_err_arr.length] = users[loop]
            }
        }else{
            u_err_arr[u_err_arr.length] = users[loop];
        }
        loop++;
    }
    if(u_err_arr.length == 1){
        message.channel.send("User ID `" + u_err_arr.join(",") + "` is not  member of " + guild_obj.Guild_Name);
        return;
    }else if(u_err_arr.length > 1){
        message.channel.send("User IDs `" + u_err_arr.join(",") + '` are not members of ' + guild_obj.Guild_Name);
        return;
    }
    loop = 1;
    while(loop < in_Arr.length){
        guild_obj.User_Objects.forEach(Element => {
            if(Element.name != null){
                if(Element.name.toLowerCase() == in_Arr[loop]){
                    user_discord_ids[user_discord_ids.length] = Element.discord;
                }
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
            if(user_dir.Member_Objects[loop].discord == Element || user_dir.Member_Objects[loop].alt.includes(Element)){//find the users file
                check = true;
                //check to make sure this user is not already on the list of users
                if(users.includes(user_dir.Member_Objects[loop].id) == false){
                    users[users.length] = user_dir.Member_Objects[loop].id;
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
                if(user_dir.Member_Objects[loop].discord == Element || user_dir.Member_Objects[loop].alt.includes(Element)){//now that a user has been registered, search for their new ID again
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
            }else if(isNaN(Element) == false && Element.toString().length == 4){
                time_in[0] = Element.split("")[0] + Element.split("")[1];
                time_in[1] = Element.split("")[2] + Element.split("")[3];
            }else if(isNaN(Element) == false && Element.toString().length == 6){
                time_in[0] = Element.split("")[0] + Element.split("")[1];
                time_in[1] = Element.split("")[2] + Element.split("")[3];
                time_in[2] = Element.split("")[4] + Element.split("")[5];
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
                if(death_disp[0] < 0){
                    death_disp[0] = death_disp[0] + 24;
                }
            }
        }else if(report_disp[1] > time_in[0]){
            death_disp = [report_disp[0], time_in[0], time_in[1]];
        }else if(report_disp[1] < time_in[0]){
            death_disp = [report_disp[0] - 1, time_in[0], time_in[1]];
            if(death_disp[0] < 0){
                death_disp[0] = death_disp[0] + 24;
            }
        }
        if(death_disp[0] < 0){
            death_disp[0] = death_disp + 24;
        }
    }else if(time_in.length > 3 || time_in.length == 1){
        //too many or too few input integers
        switch(guild_obj.language){
            case "english":
                message.channel.send('Unable to determine `' + time_in.join(":") + '`. Try `' + guild_obj.key + 'help report`');
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
    Boss_Score(message, guild_obj.id, users, boss_obj.id);
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

async function Report_Reply(message, report_obj, reply_msg){
    //this function is called from report(), all relevant information has already been determined
    //build a message embed to send to the user
    //if there is an active timer, set a delay and call back to report_reply() to update the timer after a setTimeout
    if(message == null){
        return;
    }
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                reply_msg.delete();
            }
            
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
    console.log("updating log ID " + report_obj.lID + " in guild " + report_obj.guild);
    var monster_file = JSON.parse(fs.readFileSync("./Monster_Data/" + report_obj.mID + ".json", "utf8"));
    var loop = 0;
    const Reply_Embed = new Discord.MessageEmbed()
        .setTitle(report_obj.boss)
        .setAuthor('Black Raven Report', key.image, key.website)
        .setDescription(report_obj.map)
        .setColor(guild_obj.color);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Reply_Embed.setColor(channel_obj.color);
        }
    }
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
    death_time[1] = death_time[1] + 1;
    respawn_time[1] = respawn_time[1] + 1;
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
        if(monster_file.Exp != 0){
            Reply_Embed.addField('**Experience Rewarded**', monster_file.Exp + " Exp");
        }
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
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == report_obj.server){
            Footer_img = Element.Footer;
        }
    })
    Reply_Embed.setFooter(report_obj.server.toLowerCase() + " server", Footer_img);
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

function Boss_Score(message, gID, uID_Arr, mID){
    var boss_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var boss_key = fs.readFileSync("./scores/score_key.txt").toString().split("\n");
    var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + mID + ".json", "utf8"));
    var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + gID + ".json", "utf8"));
    var channel_obj = null;
    guild_file.Channel_Objects.forEach(Element => {
        if(message.channel.id == Element.discord){
            channel_obj = Element;
        }
    })
    var pos = null;
    var loop = 0;
    while(loop < boss_key.length){
        if(boss_key[loop] == boss_file.Boss){
            pos = loop;
            loop = boss_key.length;
        }
        loop++;
    }
    if(pos == null){
        console.log("failed to locate " + mID + " in boss_key.txt, abort Boss_Score function")
        pos = 0;
        message.channel.send("Internal error in `function Boss_Score()` Unable to locate file `" + mID + "`")
        return;
    }
    console.log("function boss_score adding for " + mID + " to users " + uID_Arr);
    uID_Arr.forEach(Element => {
        var user_json = JSON.parse(fs.readFileSync("./User_Data/" + Element + ".json", "utf8"));
        user_json.Monster_Data[pos]++;
        var new_score = user_json.Monster_Data[pos]
        fs.writeFileSync("./User_Data/" + Element + ".json", JSON.stringify(user_json, null, 4), "utf8");
        Badge_Update(message, gID, user_json);
        if(guild_file.Boss_Score_Messages == true && channel_obj.Private == false){
            var home_channel = null;
            guild_file.Channel_Objects.forEach(Element => {
                if(Element.Type == "home"){
                    home_channel = message.guild.channels.cache.get(Element.discord);
                }
            })
            if(home_channel != null){
                if(new_score == 1){
                    switch(guild_file.language){
                        case "english":
                            //home_channel.send("Congratulations **" + user_json.User_Object.name + "** on your first registered kill of **" + boss_file.Boss + "**");
                            break;
                    }
                }else if(new_score / 100 == Math.floor(new_score/100) && new_score < 1001 || new_score / 1000 == Math.floor(new_score/1000) && new_score > 1000){
                    switch(guild_file.language){
                        case "english":
                            if(boss_file.Emoji == null){
                                home_channel.send("Congratulations **" + user_json.User_Object.Emoji + " " + user_json.User_Object.name + "** on reporting your " + new_score + "th kill of **" + boss_file.Boss + "**");
                            }else{
                                home_channel.send("Congratulations **" + user_json.User_Object.Emoji + " " + user_json.User_Object.name + "** on reporting your " + new_score + "th kill of " + boss_file.Emoji + " **" + boss_file.Boss + "**");
                            }
                            break;
                    }
                }
            }
        }
        Exp_Update(message, gID, Element, boss_file.Exp);
    })
}

function Badge_Update(message, gID, user_json){
    var badges_json = JSON.parse(fs.readFileSync("./User_Data/badges.json", "utf8")).Badge_Objects;
    var score_key = fs.readFileSync("./scores/score_key.txt").toString().split("\n");
    var new_badges = [];
    var loop = 0;
    badges_json.forEach(Element => {
        if(user_json.User_Object.Badges.includes(Element.id) == false){//check to see if a user has a badge
            //user does not have this badge, check to see if they have met criteria
            if(Element.Type == "Monster"){
                var check = false;
                loop = 0;
                while(loop < Element.Requirement.length && check == false){
                    if(user_json.Monster_Data[Element.Requirement[loop]] == 0){
                        check = true;
                    }
                    loop++;
                }
                if(check == false){
                    new_badges[new_badges.length] = Element.id;
                }

            }else if(Element.Type == "Boss Total"){
                var check = false;
                loop = 0;
                while(loop < user_json.Monster_Data.length && check == false){
                    if(user_json.Monster_Data[loop] > Element.Requirement - 1){
                        check = true;
                    }
                    loop++;
                }
                if(check == true){
                    new_badges[new_badges.length] = Element.id;
                }
            }
        }
    })
    if(new_badges.length > 0){
        var guild_json = JSON.parse(fs.readFileSync("./Guild_Data/" + gID + ".json", "utf8"));
        var disp_Arr = [];
        new_badges.forEach(Element => {
            user_json.User_Object.Badges[user_json.User_Object.Badges.length] = Element;
            var pos = parseInt(Element.slice(2), 10) - 1;
            if(badges_json[pos].Emoji == null){
                disp_Arr[disp_Arr.length] = badges_json[pos].Title;
            }else{
                disp_Arr[disp_Arr.length] = badges_json[pos].Emoji + " " + badges_json[pos].Title;
            }
        })
        fs.writeFileSync("./User_Data/" + user_json.User_Object.id + ".json", JSON.stringify(user_json, null, 4), "utf8");
        var home_chnl = null;
        var channel_obj = null;
        guild_json.Channel_Objects.forEach(Element => {
            if(Element.Type == "home"){
                home_chnl = client.channels.cache.get(Element.discord);
            }
            if(Element.discord == message.channel.id){
                channel_obj = Element;
            }
        })
        if(home_chnl == null){
            if(disp_Arr.length == 1){
                message.channel.send(user_json.User_Object.Emoji + " **" + user_json.User_Object.name + "** has earned the badge **" + disp_Arr[0] + "**");
            }else{
                message.channel.send(user_json.User_Object.Emoji + " **" + user_json.User_Object.name + "** has earned the badges **" + disp_Arr.join("**, **") + "**");
            }
        }else{
            if(disp_Arr.length == 1){
                home_chnl.send(user_json.User_Object.Emoji + " **" + user_json.User_Object.name + "** has earned the badge **" + disp_Arr[0] + "**");
            }else{
                home_chnl.send(user_json.User_Object.Emoji + " **" + user_json.User_Object.name + "** has earned the badges **" + disp_Arr.join("**, **") + "**");
            }
        }
        Exp_Update(message, gID, user_json.User_Object.id, 5000*new_badges.length);
    }
}

function badges(message, guild_obj){
    var badges_arr = JSON.parse(fs.readFileSync("./User_Data/badges.json", "utf8"));
    var users_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var user_obj = null;
    var loop = 0;
    while(loop < users_dir.Member_Objects.length){
        if(users_dir.Member_Objects[loop].discord == message.author.id){
            user_obj = JSON.parse(fs.readFileSync("./User_Data/" + users_dir.Member_Objects[loop].id + ".json", "utf8"));
            loop = users_dir.Total_Members;
        }
        loop++;
    }
    var channel_obj = null;
    loop = 0;
    while(loop < guild_obj.Channel_Objects.length){
        if(guild_obj.Channel_Objects[loop].discord == message.channel.id){
            channel_obj = guild_obj.Channel_Objects[loop];
        }
        loop++;
    }
    var badges_embed = new Discord.MessageEmbed()
        .setAuthor("Earned badges", key.image, key.website)
        .setColor(guild_obj.color)
        .setTitle("**Badge Progression**");
    if(channel_obj.color != null){
        badges_embed.setColor(channel_obj.color);
    }
    console.log(badges_arr.Badge_Objects.length);
    badges_arr.Badge_Objects.forEach(Element => {
        if(Element.Type == "Reward"){
            if(user_obj.User_Object.Badges.includes(Element.id)){
                badges_embed.addField(Element.Emoji + " **" + Element.Title + "** (1/1) ✅", Element.Flavor_Text);
            }else{
                badges_embed.addField(Element.Emoji + " **" + Element.Title + "** (0/1)", Element.Flavor_Text);
            }
        }else if(Element.Type == "Monster"){
            var progression = 0;
            var total = Element.Requirement.length;
            loop = 0;
            while(loop < total){
                if(user_obj.Monster_Data[Element.Requirement[loop]] > 0){
                    progression++;
                }
                loop++;
            }
            if(progression == total){
                badges_embed.addField(Element.Emoji + " **" + Element.Title + "** (" + total + "/" + total + ") ✅", Element.Flavor_Text);
            }else{
                badges_embed.addField(Element.Emoji + " **" + Element.Title + "** (" + progression + "/" + total + ")", Element.Flavor_Text);
            }
        }else if(Element.Type == "Boss Total"){
            var progression = 0;
            loop = 0;
            while(loop < user_obj.Monster_Data.length){
                if(user_obj.Monster_Data[loop] > progression){
                    progression = user_obj.Monster_Data[loop];
                }
                loop++;
            }
            if(progression > Element.Requirement - 1){
                badges_embed.addField(Element.Emoji + " **" + Element.Title + "** (" + Element.Requirement + "/" + Element.Requirement + ") ✅", Element.Flavor_Text);
            }else{
                badges_embed.addField(Element.Emoji + " **" + Element.Title + "** (" + progression + "/" + Element.Requirement + ")", Element.Flavor_Text);
            }
        }
    })
    message.channel.send(badges_embed);
}

function Exp_Update(message, gID, uID, amount){
    var user_json = JSON.parse(fs.readFileSync("./User_Data/" + uID + ".json", "utf8"));
    var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + gID + ".json", "utf8"));
    var home_channel = null;
    var channel_obj = null
    guild_file.Channel_Objects.forEach(Element => {
        if(Element.Type == "home"){
            home_channel = Element;
        }
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(home_channel == null){
        home_channel = channel_obj
    }
    user_json.User_Object.Exp = user_json.User_Object.Exp + amount;
    console.log("adding " + amount + "Exp to " + user_json.User_Object.id);
    /*
        1st chevron - recruit - 0 to 1000 exp
        2nd chevron - scout - 1000 to 5000 exp
        3rd chevron - Combat Soldier - 5000 to 20000 exp
        4th chevron - Veteran Soldier - 20000 to 50000 exp
        5th chevron - Apprentice Knight - 50000 to 100000 exp
        6th chevron - Fighter - 100000 to 200000 exp
        7th chevron - Elite Fighter - 200000 to 500000 exp
        8th chevron - Field Commander - 500000 to 1mil exp
        9th chevron - Commander - 1 mil to 3 mil exp
        10th chevron - General - 3 mil + exp

            lanos                                sira
        1 - <:1st_Chevron:846569476912578563>       <:S1_Chevron:846569477235277824>
        2 - <:2ndChevron:846569477217976330>        <:S2_Chevron:846569477063966771>
        3 - <:3rdChevron:846569476819910668>        <:S3_Chevron:846569476870635542>
        4 - <:4thChevron:846569477247074314>        <:S4_Chevron:846569477352194058>
        5 - <:5thChevron:846569477087690783>        <:S5_Chevron:846569477390598154>
        6 - <:6thChevron:846569476861853707>        <:S6_Chevron:846569477340266506>
        7 - <:7th_Chevron:846569476782948375>       <:S7_Chevron:846569477411045376>
        8 - <:8th_Chevron:846569477393874945>       <:S8_Chevron:846569477306449920>
        9 - <:9th_Chevron:846569477302648832>       <:S9_Chevron:846569477302779914>
        10 - <:10th_Chevron:846569477042077697>     <:S10_Chevron:846569477264506932>
    */
    var update_check = false;
    if(user_json.User_Object.Exp < 1000 && user_json.User_Object.Rank != "Recruit" ){
        user_json.User_Object.Rank = "Recruit";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:1st_Chevron:846569476912578563>";
        }else{
            user_json.User_Object.Emoji = "<:S1_Chevron:846569477235277824>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 999 && user_json.User_Object.Exp < 5000 && user_json.User_Object.Rank != "Scout"){
        user_json.User_Object.Rank = "Scout";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:2ndChevron:846569477217976330>";
        }else{
            user_json.User_Object.Emoji = "<:S2_Chevron:846569477063966771>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 4999 && user_json.User_Object.Exp < 20000 && user_json.User_Object.Rank != "Combat Soldier"){
        user_json.User_Object.Rank = "Combat Soldier";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:3rdChevron:846569476819910668>";
        }else{
            user_json.User_Object.Emoji = "<:S3_Chevron:846569476870635542>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 19999 && user_json.User_Object.Exp < 50000 && user_json.User_Object.Rank != "Veteran Soldier"){
        user_json.User_Object.Rank = "Veteran Soldier";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:4thChevron:846569477247074314>";
        }else{
            user_json.User_Object.Emoji = "<:S4_Chevron:846569477352194058>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 49999 && user_json.User_Object.Exp < 100000 && user_json.User_Object.Rank != "Apprentice Knight"){
        user_json.User_Object.Rank = "Apprentice Knight";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:5thChevron:846569477087690783>";
        }else{
            user_json.User_Object.Emoji = "<:S5_Chevron:846569477390598154>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 99999 && user_json.User_Object.Exp < 200000 && user_json.User_Object.Rank != "Fighter"){
        user_json.User_Object.Rank = "Fighter";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:6thChevron:846569476861853707>";
        }else{
            user_json.User_Object.Emoji = "<:S6_Chevron:846569477340266506>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 199999 && user_json.Exp < 500000 && user_json.Rank != "Elite Fighter"){
        user_json.User_Object.Rank = "Elite Fighter";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:7th_Chevron:846569476782948375>";
        }else{
            user_json.User_Object.Emoji = "<:S7_Chevron:846569477411045376>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 499999 && user_json.User_Object.Exp < 1000000 && user_json.User_Object.Rank != "Field Commander"){
        user_json.User_Object.Rank = "Field Commander";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:8th_Chevron:846569477393874945>";
        }else{
            user_json.User_Object.Emoji = "<:S8_Chevron:846569477306449920>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 999999 && user_json.User_Object.Exp < 3000000 && user_json.User_Object.Rank != "Commander"){
        user_json.User_Object.Rank = "Scout";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:9th_Chevron:846569477302648832>";
        }else{
            user_json.User_Object.Emoji = "<:S9_Chevron:846569477302779914>";
        }
        update_check = true;
    }else if(user_json.User_Object.Exp > 2999999 && user_json.User_Object.Rank != "General"){
        user_json.User_Object.Rank = "Scout";
        if(user_json.User_Object.Faction == "L"){
            user_json.User_Object.Emoji = "<:10th_Chevron:846569477042077697>";
        }else{
            user_json.User_Object.Emoji = "<:S10_Chevron:846569477264506932>";
        }
        update_check = true;
    }
    fs.writeFileSync("./User_Data/" + uID + ".json", JSON.stringify(user_json, null, 4), "utf8");
    if(update_check == true && guild_file.Exp_Messages == true){
        var chnl =  message.guild.channels.cache.get(home_channel.discord);
        chnl.send("Congratulations **" + user_json.User_Object.name + "** on ranking up to " + user_json.User_Object.Emoji + " " + user_json.User_Object.Rank + "!!!");
    }
}

function Dungeon(message, guild_obj, in_Arr){
    //user has called for the dungeon command
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj == null){
        message.channel.send("This command can only be used in report-type channels.");
        return;
    }
    if(channel_obj.Type != "report"){
        message.channel.send("This command can only be used in report-type channels.");
        return;
    }
    var server = channel_obj.Server;
    var users = [];
    var dungeon_Nums = ["20", "25", "30", "35", "40", "42", "44", "46", "48", "50"];
    if(in_Arr.length == 0){
        message.channel.send("Not enough arguments. Try `" + guild_obj.key + "help dungeon` for help");
        return;
    }
    var dung_in = in_Arr[0];
    var upper_bound = null;
    var lower_bound = null;
    if(dung_in.includes('-')){
        lower_bound = dung_in.split("-")[0];
        upper_bound = dung_in.split("-")[1];
        if(dung_in.split("-").length != 2){
            message.channel.send("Improper command format. Try `" + guild_obj.key + "help dungeon` for help");
        }
    }else{
        upper_bound = dung_in;
        lower_bound = dung_in;
    }
    if(dungeon_Nums.includes(upper_bound) == false || dungeon_Nums.includes(lower_bound) == false){
        message.channel.send("Unable to determine `" + in_Arr[0] + "`. Try `" + guild_obj.key + "help dungeon` for help");
        return;
    }
    var mID_killed = [];
    if(lower_bound == "20"){
        mID_killed[0] = "m121";
        mID_killed[1] = "m122";
        mID_killed[2] = "m123";
    }
    if(lower_bound == "25" || upper_bound == "25" || parseInt(lower_bound, 10) < 25 && parseInt(upper_bound, 10) > 25){
        mID_killed[mID_killed.length] = "m124";
        mID_killed[mID_killed.length] = "m125";
        mID_killed[mID_killed.length] = "m126";
    }
    if(lower_bound == "30" || upper_bound == "30" || parseInt(lower_bound, 10) < 30 && parseInt(upper_bound, 10) > 30){
        mID_killed[mID_killed.length] = "m127";
        mID_killed[mID_killed.length] = "m128";
        mID_killed[mID_killed.length] = "m129";
    }
    if(lower_bound == "35" || upper_bound == "35" || parseInt(lower_bound, 10) < 35 && parseInt(upper_bound, 10) > 35){
        mID_killed[mID_killed.length] = "m130";
        mID_killed[mID_killed.length] = "m131";
        mID_killed[mID_killed.length] = "m132";
    }
    if(lower_bound == "40" || upper_bound == "40" || parseInt(lower_bound, 10) < 40 && parseInt(upper_bound, 10) > 40){
        mID_killed[mID_killed.length] = "m133";
        mID_killed[mID_killed.length] = "m134";
        mID_killed[mID_killed.length] = "m135";
    }
    if(upper_bound == "42" || parseInt(upper_bound, 10) > 42){
        mID_killed[mID_killed.length] = "m136";
    }
    if(upper_bound == "44" || parseInt(upper_bound, 10) > 44){
        mID_killed[mID_killed.length] = "m137";
    }
    if(upper_bound == "46" || parseInt(upper_bound, 10) > 46){
        mID_killed[mID_killed.length] = "m138";
    }
    if(upper_bound == "48" || upper_bound == "50"){
        mID_killed[mID_killed.length] = "m139";
    }
    if(upper_bound == "50"){
        mID_killed[mID_killed.length] = "m140";
    }
    console.log(mID_killed);
    if(mID_killed.length == 0){
        message.channel.send("Unable to determine `" + in_Arr[0] + '`. Try `' + guild_obj.key + "help dungeon` for help.");
        return;
    }
    var loop = null;
    var user_discord_ids = [];
    var role_ids = [];
    var check = false;
    var users_json = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    if(in_Arr.length > 1){
        loop = 1;
        while(loop < in_Arr.length){
            if(in_Arr[loop].startsWith("<@!")){
                user_discord_ids[user_discord_ids.length] = in_Arr[loop].slice(3,-1);
            }else if(in_Arr[loop].startsWith("<@&")){
                role_ids[role_ids.length] = in_Arr[loop].slice(3,-1);
                //tagged a role
            }else if(in_Arr[loop].startsWith("<@")){
                user_discord_ids[user_discord_ids.length] = in_Arr[loop].slice(2,-1);
            }else if(in_Arr[loop].startsWith("u")){
                var u_num = parseInt(in_Arr[loop].slice(1), 10);
                if(isNaN(u_num)){
                    check = true;
                    err_Arr[err_Arr.length] = in_Arr[loop];
                }else if(u_num - 1 < users_json.Total_Members && u_num > 0){
                    var u_file = JSON.parse(fs.readFileSync("./User_Data/" + users_json.Member_Objects[u_num - 1].id + ".json", "utf8"));
                    if(u_file.User_Object.guilds.includes(guild_obj.id)){
                        user_discord_ids[user_discord_ids.length] = u_file.User_Object.discord;
                    }else{
                        check = true;
                        err_Arr[err_Arr.length] = in_Arr[loop];
                    }
                }else{
                    check = true;
                    err_Arr[err_Arr.length] = in_Arr[loop];
                }
            }else{
                var single_check = false;
                guild_obj.User_Objects.forEach(Element => {
                    if(in_Arr[loop] == Element.name){
                        user_discord_ids[user_discord_ids.length] = Element.discord;
                        single_check = true;
                    }
                })
                if(single_check == false){
                    check = true;
                    err_Arr[err_Arr.length] = in_Arr[loop];
                }
                j
            }
            loop++;
        }
    }
    if(check == true){
        if(err_Arr.length == 1){
            message.channel.send("Unable to determine input `" + err_Arr[0] + "`. Try `" + guild_obj.key + "help dungeon`");
        }else{
            message.channel.send("Unable to determine inputs `" + err_Arr.join(",") + "`. Try `" + guild_obj.key + "help dungeon`");
        }
        return;
    }
    if(role_ids.length > 0){
        loop = 0;
        var guild = message.guild;
        while(loop < role_ids.length){
            guild.members.cache.forEach(member => {
                if(member.roles.cache.has(role_ids[loop])){
                    user_discord_ids[user_discord_ids.length] = member.user.id;
                }
            })
            loop++;
        }
    }
    if(user_discord_ids.length == 0){
        user_discord_ids[0] = message.author.id;
    }
    //a full list of discord IDs has been obtained. Move on to creating response and logging the kills on file
    var uIDs_Arr = [];
    loop = 0;
    while(loop < user_discord_ids.length){
        guild_obj.User_Objects.forEach(Element => {
            if(Element.discord == user_discord_ids[loop] && uIDs_Arr.includes(Element) == false && Element.alt == false){
                uIDs_Arr[uIDs_Arr.length] = Element;
            }else if(Element.discord == user_discord_ids[loop] && uIDs_Arr.includes(Element) == false){
                var main_uID = Element.main;
                guild_obj.User_Objects.forEach(Element => {
                    if(Element.id == main_uID && uIDs_Arr.includes(Element) == false){
                        uIDs_Arr[uIDs_Arr.length] = Element;
                    }
                })
            }
        })
        loop++;
    }
    var uID_Arr = [];
    uIDs_Arr.forEach(Element => {
        uID_Arr[uID_Arr.length] = Element.id;
    })
    var date = new Date();
    var date_ms = date.getTime();
    var lID = null;
    var log_json = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
    var last_pos = null;
    if(log_json.Event_Arr.length > 0){
        last_pos = parseInt(log_json.Event_Arr[log_json.Event_Arr.length - 1].id.slice(1), 10);
    }else{
        last_pos = 0;
    }
    var report_lIDs = [];
    loop = 0;
    while(loop < mID_killed.length){
        lID = (last_pos + 1);
        lID = lID.toString();
        while(lID.length < 6){
            lID = "0" + lID;
        }
        lID = "l" + lID;
        report_lIDs[report_lIDs.length] = lID;
        var report_log = null;
        report_log = {
            id: lID,
            log_type: "R",
            mID: mID_killed[loop],
            server: channel_obj.Server,
            death: date_ms,
            respawn: null,
            report: date_ms,
            users: uID_Arr,
            home_channel: message.channel.id,
            author: message.author.id,
            loot: [],
            home_reply: null
        }
        log_json.Event_Arr[log_json.Event_Arr.length] = report_log;
        last_pos++;
        loop++;
    }
    lID = (last_pos + 1);
    lID = lID.toString();
    while(lID.length < 6){
        lID = "0" + lID;
    }
    lID = "l" + lID;
    var dung_log = {
        id: lID,
        log_type: "D",
        server: channel_obj.Server,
        report: date_ms,
        users: uID_Arr,
        home_channel: message.channel.id,
        author: message.author.id,
        branches: report_lIDs
    }
    log_json.Event_Arr[log_json.Event_Arr.length] = dung_log;
    fs.writeFileSync("./log/" + guild_obj.id + "/log.json", JSON.stringify(log_json, null, 4), "utf8");
    var date_disp = [];
    date_disp[0] = date.getDate();
    date_disp[1] = date.getMonth() + 1;
    date_disp[2] = date.getFullYear();
    date_disp[3] = date.getHours();
    date_disp[4] = date.getMinutes();
    if(date_disp[4] < 10){
        date_disp[4] = "0" + date_disp[4];
    }
    date_disp[5] = date.getSeconds();
    if(date_disp[5] < 10){
        date_disp[5] = "0" + date_disp[5];
    }
    var Dungeon_Embed = new Discord.MessageEmbed()
        .setAuthor("Dungeon Reprot", key.image, key.website)
        .setColor(guild_obj.color)
        .setTitle("**Dungeons Completed**")
        .setDescription("Report contents of treasures with " + guild_obj.key + "box and dungeon boss loot with " + guild_obj.key + "loot");
    if(channel_obj.color != null){
        Dungeon_Embed.setColor(channel_obj.color);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == channel_obj.Server){
            Footer_img = Element.Footer;
        }
    })
    Dungeon_Embed.setFooter(channel_obj.Server.toLowerCase() + " server", Footer_img);
    var body = [];
    uIDs_Arr.forEach(Element => {
        body[body.length] = client.users.cache.get(Element.discord);
    })
    Dungeon_Embed.addField("**Completed By**", body.join("\n"));
    body = [];
    var file = null;
    var Exp = 0;
    mID_killed.forEach(Element => {
        file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
        Exp = Exp + file.Exp;
        if(file.Emoji != null){
            body[body.length] = file.Emoji + " " + file.Boss;
        }else{
            body[body.length] = file.Boss;
        }
        if(body.length == mID_killed.length){
            if(file.Image != null){
                Dungeon_Embed.setThumbnail(file.Image);
            }
        }
    })
    Dungeon_Embed.addField("**Completed At**", date_disp[0] + "/" + date_disp[1] + "/" + date_disp[2] + " " + date_disp[3] + ":" + date_disp[4] + ":" + date_disp[5]);
    Dungeon_Embed.addField("**Dungeon Bosses Killed**", body.join("\n"));
    if(Exp > 0){
        Dungeon_Embed.addField("**Experience Rewarded**", Exp + " Exp");
    }
    message.channel.send(Dungeon_Embed)
    mID_killed.forEach(Element => {
        Boss_Score(message, guild_obj.id, uID_Arr, Element);
    })
}

function Check(message, guild_obj, in_Arr){
    //user wants to check respawn time(s)

    if(in_Arr.length == 0){
        //user wants a list of all currently running timers
        Check_All(message, guild_obj);
        return;
    }
    var dir = JSON.parse(fs.readFileSync("./menus/notif.json", "utf8"));
    var select_mIDs = [];
    var err_Arr = [];
    var loop = 0;
    while(loop < in_Arr.length){
        dir.Notif_Objects.forEach(Element => {
            if(Element.shortcuts.includes(in_Arr[loop])){
                Element.mIDs.forEach(Element => {
                    if(select_mIDs.includes(Element) == false){
                        select_mIDs[select_mIDs.length] = Element;
                    }
                })
                in_Arr[loop] = null;
            }
        })
        if(in_Arr[loop] != null){
            err_Arr[err_Arr.length] = in_Arr[loop];
        }
        loop++;
    }
    if(err_Arr.length > 0){
        switch(guild_obj.language){
            case 'english':
                message.channel.send("Unable to determine `" + err_Arr.join(",") + "`. Try `" + guild_obj.key + "help check` or `" + guild_obj.key + "help bosses`");
                break;
        }
        return;
    }
    var open_channels = [];
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
            open_channels[0] = Element.discord;
        }else if(Element.private_data == false){
            open_channels[open_channels.length] = Element.discord;
        }
    })
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.private_data == false && Element.Server == channel_obj.Server && Element.discord != channel_obj.discord){
            open_channels[open_channels.length] = Element.discord;
        }
    })
    if(channel_obj.Type == "home"){
        message.channel.send("check command for `home-type` channels is currently not working, sorry.");
        return;
    }
    //channels we can pull times from has been defined
    var log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
    var date = new Date()
    var date_ms = date.getTime();
    var active_Objects = [];
    var active_mIDs = [];
    console.log(select_mIDs);
    log.Event_Arr.forEach(Element => {
        if(Element.log_type == "R"){
            if(select_mIDs.includes(Element.mID)){
                if(Element.respawn != null){
                    if(Element.respawn > date_ms){
                        active_Objects[active_Objects.length] = Element;
                        active_mIDs[active_mIDs.length] = Element.mID;
                    }
                }
            }
        }
    })
    //active timers have been sorted from log
    var check_presence = [];
    select_mIDs.forEach(Element => {
        if(active_mIDs.includes(Element)){
            check_presence[check_presence.length] = true;
        }else{
            check_presence[check_presence.length] = false;
        }
    })
    var loop = 0;
    var swap = null;
    var inloop = null;
    while(loop < active_Objects.length){
        inloop = 1;
        while(inloop < active_Objects.length){
            if(active_Objects[inloop].respawn > active_Objects[inloop - 1].respawn){
                swap = active_Objects[inloop];
                active_Objects[inloop] = active_Objects[inloop - 1];
                active_Objects[inloop - 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    var body = [];
    active_Objects.forEach(Element => {
        var respawn = Element.respawn - date_ms;
        var respawn_disp = [0, 0, 0];
        while(respawn > 3599999){
            respawn = respawn - 3600000;
            respawn_disp[0]++;
        }
        while(respawn > 59999){
            respawn = respawn - 60000;
            respawn_disp[1]++;
        }
        respawn_disp[2] = parseInt(respawn/1000, 10);
        if(respawn_disp[1] < 10){
            respawn_disp[1] = "0" + respawn_disp[1];
        }
        if(respawn_disp[2] < 10){
            respawn_disp[2] = "0" + respawn_disp[2];
        }
        var file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
        if(file.Emoji != null){
            body[body.length] = file.Emoji + " " + file.Boss + " - " + respawn_disp.join(":");
        }else{
            body[body.length] = file.Boss + " - " + respawn_disp.join(":");
        }
    })
    var body_divided = [];
    if(body.join("\n").length > 2000){
        body_divided[0] = body.join("\n");
    }else if(body.length > 0){
        body_divided[0] = body[0];
        loop = 1;
        while(loop < body.length){
            if(body_divided[body_divided.length - 1].length + body[loop].length > 2000){
                body_divided[body_divided.length] = body[loop];
            }else{
                body_divided[body_divided.length - 1] = body_divided[body_divided.length - 1] + "\n" + body[loop];
            }
            loop++;
        }
    }
    var absent_body = [];
    loop = 0;
    while(loop < select_mIDs.length){
        if(check_presence[loop] == false){
            var boss_obj = JSON.parse(fs.readFileSync("./Monster_Data/" + select_mIDs[loop] + ".json", "utf8"));
            if(boss_obj.Emoji != null){
                absent_body[absent_body.length] = boss_obj.Emoji + " " + boss_obj.Boss;
            }else{
                absent_body[absent_body.length] = boss_obj.Boss;
            }
        }
        loop++;
    }
    console.log(absent_body);
    var absent_body_divided = [];
    if(absent_body.join("\n").length > 2000){
        loop = 1;
        absent_body_divided[0] = absent_body[0];
        while(loop < absent_body.length){
            if(absent_body_divided[absent_body_divided.length - 1].length + absent_body[loop] > 2000){
                absent_body_divided[absent_body_divided.length] = absent_body[loop];
            }else{
                absent_body_divided[absent_body_divided.length - 1] = absent_body_divided[absent_body_divided.length - 1] + "\n" + absent_body[loop];
            }
            loop++;
        }
    }else if(absent_body.length > 0){
        absent_body_divided[0] = absent_body.join("\n");
    }
    var check_Embed = new Discord.MessageEmbed()
        .setAuthor("Check Timers", key.image, key.website)
        .setColor(guild_obj.color);
    if(channel_obj.color != null){
        check_Embed.setColor(channel_obj.color);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == channel_obj.Server){
            Footer_img = Element.Footer;
        }
    })
    check_Embed.setFooter(channel_obj.Server.toLowerCase() + " server", Footer_img);
    
    if(body_divided.length == 0){
        check_Embed.addField("**Active Timers**", "No Active Timers")
    }else{
        body_divided.forEach(Element => {
            check_Embed.addField("**Active Timers**", Element);
        })
    }
    if(absent_body_divided.length > 0){
        absent_body_divided.forEach(Element => {
            check_Embed.addField("**Inactive Timers**", Element);
        })
    }
    console.log(check_Embed);
    message.channel.send(check_Embed);
}

function Check_All(message, guild_obj){
    //user wants a list of all actively running timers
    //gather a list of report channels that aren't set to private
    var channel_ids = [];
    var channel_obj = null;
    var server = null;
    var loop = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            server = Element.Server;
            channel_obj = Element;
            channel_ids[0] = Element.discord;
        }
    })
    if(channel_obj.Type == "home"){
        message.channel.send("Check command for `home-type` channels is currently not working, Sorry.");
        return;
    }
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.Private == false && Element.Server == server){
            channel_ids[channel_ids.length] = Element.discord;
        }
    })
    //list of open channels has been determined.
    var log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
    var date = new Date();
    var date_ms = date.getTime();
    var active_Objects = [];
    log.Event_Arr.forEach(Element => {
        if(Element.log_type == "R"){
            if(Element.respawn != null && channel_ids.includes(Element.home_channel)){
                if(Element.respawn > date_ms){
                    active_Objects[active_Objects.length] = Element;
                }
            }
        }
    })
    console.log("active objects", active_Objects);
    if(active_Objects.length == 0){
        switch(guild_obj.language){
            case 'english':
                message.channel.send("No active boss timers found in **" + server + "**");
                break;
        }
        return;
    }
    var swap = null;
    var inloop = null;
    loop = 0;
    while(loop < active_Objects.length){
        inloop = 1;
        while(inloop < active_Objects.length){
            if(active_Objects[inloop].respawn > active_Objects[inloop - 1].respawn){
                swap = active_Objects[inloop];
                active_Objects[inloop] = active_Objects[inloop - 1];
                active_Objects[inloop - 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    var body = [];
    active_Objects.forEach(Element => {
        var respawn = Element.respawn - date_ms;
        var respawn_disp = [0, 0, 0];
        while(respawn > 3599999){
            respawn = respawn - 3600000;
            respawn_disp[0]++;
        }
        while(respawn > 59999){
            respawn = respawn - 60000;
            respawn_disp[1]++;
        }
        respawn_disp[2] = parseInt(respawn/1000, 10);
        if(respawn_disp[1] < 10){
            respawn_disp[1] = "0" + respawn_disp[1];
        }
        if(respawn_disp[2] < 10){
            respawn_disp[2] = "0" + respawn_disp[2];
        }
        var file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
        if(file.Emoji != null){
            body[body.length] = file.Emoji + " " + file.Boss + " - " + respawn_disp.join(":");
        }else{
            body[body.length] = file.Boss + " - " + respawn_disp.join(":");
        }
    })
    var body_divided = [];
    if(body.join("\n").length > 2000){
        body_divided[0] = body.join("\n");
    }else{
        body_divided[0] = body[0];
        loop = 1;
        while(loop < body.length){
            if(body_divided[body_divided.length - 1].length + body[loop].length > 2000){
                body_divided[body_divided.length] = body[loop];
            }else{
                body_divided[body_divided.length - 1] = body_divided[body_divided.length - 1] + "\n" + body[loop];
            }
            loop++;
        }
    }
    var check_Embed = new Discord.MessageEmbed()
        .setAuthor("Check Timers", key.image, key.website)
        .setTitle("**All Running Boss Timers**")
        .setColor(guild_obj.color);
    if(channel_obj.color != null){
        check_Embed.setColor(channel_obj.color);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == server){
            Footer_img = Element.Footer;
        }
    })
    check_Embed.setFooter(server.toLowerCase() + " server", Footer_img);
    body_divided.forEach(Element => {
        check_Embed.addField("**Timers**", Element);
    })
    message.channel.send(check_Embed);
}

function Check_Spawn(message, guild_obj, in_Arr){
    //user wants to check respawn time(s)
    console.log("im at check spawn");
    if(in_Arr.length == 0){
        //user wants a list of all currently running timers
        Check_All_Spawn(message, guild_obj);
        return;
    }
    var dir = JSON.parse(fs.readFileSync("./menus/notif.json", "utf8"));
    var select_mIDs = [];
    var err_Arr = [];
    var loop = 0;
    while(loop < in_Arr.length){
        dir.Notif_Objects.forEach(Element => {
            if(Element.shortcuts.includes(in_Arr[loop])){
                Element.mIDs.forEach(Element => {
                    if(select_mIDs.includes(Element) == false){
                        select_mIDs[select_mIDs.length] = Element;
                    }
                })
                in_Arr[loop] = null;
            }
        })
        if(in_Arr[loop] != null){
            err_Arr[err_Arr.length] = in_Arr[loop];
        }
        loop++;
    }
    if(err_Arr.length > 0){
        switch(guild_obj.language){
            case 'english':
                message.channel.send("Unable to determine `" + err_Arr.join(",") + "`. Try `" + guild_obj.key + "help spawn` or `" + guild_obj.key + "help bosses`");
                break;
        }
        return;
    }
    var open_channels = [];
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
            open_channels[0] = Element.discord;
        }else if(Element.private_data == false){
            open_channels[open_channels.length] = Element.discord;
        }
    })
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.private_data == false && Element.Server == channel_obj.Server && Element.discord != channel_obj.discord){
            open_channels[open_channels.length] = Element.discord;
        }
    })
    if(channel_obj.Type == "home"){
        message.channel.send("spawn time command for `home-type` channels is currently not working, sorry.");
        return;
    }
    //channels we can pull times from has been defined
    var log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
    var date = new Date()
    var date_ms = date.getTime();
    var active_Objects = [];
    var active_mIDs = [];
    console.log(select_mIDs);
    log.Event_Arr.forEach(Element => {
        if(Element.log_type == "R"){
            if(select_mIDs.includes(Element.mID)){
                if(Element.respawn != null){
                    if(Element.respawn > date_ms){
                        active_Objects[active_Objects.length] = Element;
                        active_mIDs[active_mIDs.length] = Element.mID;
                    }
                }
            }
        }
    })
    //active timers have been sorted from log
    var check_presence = [];
    select_mIDs.forEach(Element => {
        if(active_mIDs.includes(Element)){
            check_presence[check_presence.length] = true;
        }else{
            check_presence[check_presence.length] = false;
        }
    })
    var loop = 0;
    var swap = null;
    var inloop = null;
    while(loop < active_Objects.length){
        inloop = 1;
        while(inloop < active_Objects.length){
            if(active_Objects[inloop].respawn > active_Objects[inloop - 1].respawn){
                swap = active_Objects[inloop];
                active_Objects[inloop] = active_Objects[inloop - 1];
                active_Objects[inloop - 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    var body = [];
    active_Objects.forEach(Element => {
        var respawn_disp = [0, 0, 0, 0, 0, 0];
        var respawn_date = new Date(Element.respawn);
        respawn_disp[0] = respawn_date.getHours();
        respawn_disp[1] = respawn_date.getMinutes();
        respawn_disp[2] = respawn_date.getSeconds();
        respawn_disp[4] = respawn_date.getMonth();
        respawn_disp[4]++;
        respawn_disp[3] = respawn_date.getDate();
        respawn_disp[5] = respawn_date.getFullYear();
        loop = 0;
        while(loop < respawn_disp.length){
            if(respawn_disp[loop] < 10){
                respawn_disp[loop] = "0" + respawn_disp[loop];
            }
            loop++;
        }
        var file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
        if(file.Emoji != null){
            body[body.length] = file.Emoji + " " + file.Boss + " - " + respawn_disp[3] + '/' + respawn_disp[4] + '/' + respawn_disp[5] + " ~ " + respawn_disp[0] + ':' + respawn_disp[1] + ":" + respawn_disp[2];
        }else{
            body[body.length] = file.Boss + " - " + respawn_disp[3] + '/' + respawn_disp[4] + '/' + respawn_disp[5] + " ~ " + respawn_disp[0] + ':' + respawn_disp[1] + ":" + respawn_disp[2];
        }
    })
    var body_divided = [];
    if(body.join("\n").length > 2000){
        body_divided[0] = body.join("\n");
    }else if(body.length > 0){
        body_divided[0] = body[0];
        loop = 1;
        while(loop < body.length){
            if(body_divided[body_divided.length - 1].length + body[loop].length > 2000){
                body_divided[body_divided.length] = body[loop];
            }else{
                body_divided[body_divided.length - 1] = body_divided[body_divided.length - 1] + "\n" + body[loop];
            }
            loop++;
        }
    }
    var absent_body = [];
    loop = 0;
    while(loop < select_mIDs.length){
        if(check_presence[loop] == false){
            var boss_obj = JSON.parse(fs.readFileSync("./Monster_Data/" + select_mIDs[loop] + ".json", "utf8"));
            if(boss_obj.Emoji != null){
                absent_body[absent_body.length] = boss_obj.Emoji + " " + boss_obj.Boss;
            }else{
                absent_body[absent_body.length] = boss_obj.Boss;
            }
        }
        loop++;
    }
    console.log(absent_body);
    var absent_body_divided = [];
    if(absent_body.join("\n").length > 2000){
        loop = 1;
        absent_body_divided[0] = absent_body[0];
        while(loop < absent_body.length){
            if(absent_body_divided[absent_body_divided.length - 1].length + absent_body[loop] > 2000){
                absent_body_divided[absent_body_divided.length] = absent_body[loop];
            }else{
                absent_body_divided[absent_body_divided.length - 1] = absent_body_divided[absent_body_divided.length - 1] + "\n" + absent_body[loop];
            }
            loop++;
        }
    }else if(absent_body.length > 0){
        absent_body_divided[0] = absent_body.join("\n");
    }
    var current_time = new Date();
    var current_arr = [];
    current_arr[0] = current_time.getDate();
    current_arr[1] = current_time.getMonth() + 1;
    current_arr[2] = current_time.getFullYear();
    current_arr[3] = current_time.getHours();
    if(current_arr[3] < 10){
        current_arr[3] = "0" + current_arr[3];
    }
    current_arr[4] = current_time.getMinutes();
    if(current_arr[4] < 10){
        current_arr[4] = "0" + current_arr[4];
    }
    current_arr[5] = current_time.getSeconds();
    if(current_arr[5] < 10){
        current_arr[5] = "0" + current_arr[5];
    }
    var check_Embed = new Discord.MessageEmbed()
        .setAuthor("Respawn Times", key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription("Current Time: " + current_arr[0] + "/" + current_arr[1] + "/" + current_arr[2] + " ~ " + current_arr[3] + ":" + current_arr[4] + ":" + current_arr[5]);
    if(channel_obj.color != null){
        check_Embed.setColor(channel_obj.color);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == channel_obj.Server){
            Footer_img = Element.Footer;
        }
    })
    check_Embed.setFooter(channel_obj.Server.toLowerCase() + " server", Footer_img);

    if(body_divided.length == 0){
        check_Embed.addField("**Respawn Times**", "No Active Timers")
    }else{
        body_divided.forEach(Element => {
            check_Embed.addField("**Respawn Times**", Element);
        })
    }
    if(absent_body_divided.length > 0){
        absent_body_divided.forEach(Element => {
            check_Embed.addField("**Inactive Timers**", Element);
        })
    }
    console.log(check_Embed);
    message.channel.send(check_Embed);
}

function Check_All_Spawn(message, guild_obj){
    //user wants a list of all actively running timers
    //gather a list of report channels that aren't set to private
    var channel_ids = [];
    var channel_obj = null;
    var server = null;
    var loop = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            server = Element.Server;
            channel_obj = Element;
            channel_ids[0] = Element.discord;
        }
    })
    if(channel_obj.Type == "home"){
        message.channel.send("Check command for `home-type` channels is currently not working, Sorry.");
        return;
    }
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.Private == false && Element.Server == server){
            channel_ids[channel_ids.length] = Element.discord;
        }
    })
    //list of open channels has been determined.
    var log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
    var date = new Date();
    var date_ms = date.getTime();
    var active_Objects = [];
    log.Event_Arr.forEach(Element => {
        if(Element.log_type == "R"){
            if(Element.respawn != null && channel_ids.includes(Element.home_channel)){
                if(Element.respawn > date_ms){
                    active_Objects[active_Objects.length] = Element;
                }
            }
        }
    })
    console.log("active objects", active_Objects);
    if(active_Objects.length == 0){
        switch(guild_obj.language){
            case 'english':
                message.channel.send("No active boss timers found in **" + server + "**");
                break;
        }
        return;
    }
    var swap = null;
    var inloop = null;
    loop = 0;
    while(loop < active_Objects.length){
        inloop = 1;
        while(inloop < active_Objects.length){
            if(active_Objects[inloop].respawn > active_Objects[inloop - 1].respawn){
                swap = active_Objects[inloop];
                active_Objects[inloop] = active_Objects[inloop - 1];
                active_Objects[inloop - 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    var body = [];
    active_Objects.forEach(Element => {
        var respawn = new Date(Element.respawn);
        var respawn_disp = [0, 0, 0, 0, 0, 0]
        respawn_disp[0] = respawn.getDate();
        respawn_disp[1] = respawn.getMonth();
        respawn_disp[1]++;
        respawn_disp[2] = respawn.getFullYear();
        respawn_disp[3] = respawn.getHours();
        respawn_disp[4] = respawn.getMinutes();
        respawn_disp[5] = respawn.getSeconds();
        loop = 0;
        while(loop < respawn_disp.length){
            if(respawn_disp[loop] < 10){
                respawn_disp[loop] = "0" + respawn_disp[loop];
            }
            loop++;
        }
        var file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element.mID + ".json", "utf8"));
        if(file.Emoji != null){
            body[body.length] = file.Emoji + " " + file.Boss + " - " + respawn_disp[0] + '/' + respawn_disp[1] + '/' + respawn_disp[2] + ' ~ ' + respawn_disp[3] + ':' + respawn_disp[4] + ':' + respawn_disp[5];
        }else{
            body[body.length] = file.Boss + " - " + respawn_disp[0] + '/' + respawn_disp[1] + '/' + respawn_disp[2] + ' ~ ' + respawn_disp[3] + ':' + respawn_disp[4] + ':' + respawn_disp[5];
        }
    })
    var body_divided = [];
    if(body.join("\n").length > 2000){
        body_divided[0] = body.join("\n");
    }else{
        body_divided[0] = body[0];
        loop = 1;
        while(loop < body.length){
            if(body_divided[body_divided.length - 1].length + body[loop].length > 2000){
                body_divided[body_divided.length] = body[loop];
            }else{
                body_divided[body_divided.length - 1] = body_divided[body_divided.length - 1] + "\n" + body[loop];
            }
            loop++;
        }
    }
    var current_time = new Date();
    var current_arr = [];
    current_arr[0] = current_time.getDate();
    current_arr[1] = current_time.getMonth();
    current_arr[1]++;
    current_arr[2] = current_time.getFullYear();
    current_arr[3] = current_time.getHours();
    if(current_arr[3] < 10){
        current_arr[3] = "0" + current_arr[3];
    }
    current_arr[4] = current_time.getMinutes();
    if(current_arr[4] < 10){
        current_arr[4] = "0" + current_arr[4];
    }
    current_arr[5] = current_time.getSeconds();
    if(current_arr[5] < 10){
        current_arr[5] = "0" + current_arr[5];
    }
    var check_Embed = new Discord.MessageEmbed()
        .setAuthor("Respawn Times", key.image, key.website)
        .setTitle("**All Active Respawn Times**")
        .setColor(guild_obj.color)
        .setDescription("Current Time: " + current_arr[0] + "/" + current_arr[1] + "/" + current_arr[2] + " ~ " + current_arr[3] + ":" + current_arr[4] + ":" + current_arr[5]);
    if(channel_obj.color != null){
        check_Embed.setColor(channel_obj.color);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == server){
            Footer_img = Element.Footer;
        }
    })
    check_Embed.setFooter(server.toLowerCase() + " server", Footer_img);
    body_divided.forEach(Element => {
        check_Embed.addField("**Respawn Times**", Element);
    })
    message.channel.send(check_Embed);
}

function Warning(report_obj, path){
    //a warning for a boss spawn
    //inputs are report object containing all information about the boss
    //path is an integer 0, 1, 2, 3
    //0 = now, 1 = 5 minute warning, 2 = 1 hour warning, 3 = 1 day warning
    
    //NOTE TO SELF LATER - ADD A CHECK TO SEE IF THE BOSS SPAWN IS STILL HAPPENING
   
    var log = JSON.parse(fs.readFileSync("./log/" + report_obj.guild + "/log.json", "utf8"));
    var loop = log.Event_Arr.length - 1;
    console.log("checking " + report_obj.guild + " log for lID " + report_obj.lID);
    var undo_check = false;
    while(loop > -1){
        if(log.Event_Arr[loop].id == report_obj.lID && log.Event_Arr[loop].death == report_obj.death){
            console.log("confirmed log " + report_obj.lID + " remains in logs");
            undo_check = true;
            loop = 0;
        }
        loop--;
    }
    var date = new Date();
    var date_arr = [];
    date_arr[0] = date.getHours();
    date_arr[1] = date.getMinutes();
    date_arr[2] = date.getSeconds();
    if(undo_check == false){
        console.log("log ID " + report_obj.lID + " deleted, canceling warning message");
    }else{
        var guild_obj = JSON.parse(fs.readFileSync('./Guild_Data/' + report_obj.guild + '.json', 'utf8'));
        var body_reply = null;
        var reduced = null;
        switch(guild_obj.language){
            case "english":
                if(path == 0){
                    body_reply = 'has respawned!';
                    reduced = "respawned";
                }else if(path == 1){
                    date_arr[1] = date_arr[1] + 5;
                    body_reply = report_obj.boss + ' is respawning in 5 minutes!';
                    reduced = "5 minutes";
                }else if(path == 2){
                    date_arr[0] = date_arr[0] + 1;
                    body_reply = report_obj.boss + ' is respawning in 1 hour!';
                    reduced = "1 hour";
                }else if(path == 3){
                    body_reply = 'is respawning in 1 day!';
                    reduced = "1 day";
                }
                break;
        }
        if(date_arr[1] > 59){
            date_arr[1] = date_arr[1] - 60;
            date_arr[0]++;
        }
        if(date_arr[0] > 23){
            date_arr[0] = date_arr[0] - 24; 
        }
        if(date_arr[0] < 10){
            date_arr[0] = "0" + date_arr[0];
        }else{
            date_arr[0] = date_arr[0].toString();
        }
        if(date_arr[1] < 10){
            date_arr[1] = "0" + date_arr[1];
        }else{
            date_arr[1] = date_arr[1].toString();
        }
        if(date_arr[2] < 10){
            date_arr[2] = "0" + date_arr[2];
        }else{
            date_arr[2] = date_arr[2].toString();
        }
        //for bosses that are on more than one map, add which map the boss is spawning on
        var notif_users = [];
        var pos = 0;
        var notif_obj = JSON.parse(fs.readFileSync("./notifs/" + report_obj.guild + ".json", "utf8"));
        loop = 0;
        if(reduced != "respawned"){
            reduced = reduced + " (" + date_arr.join(":") + ")";
        }
        while(loop < notif_obj.notifs.length){
            if(notif_obj.notifs[loop].mID == report_obj.mID){
                pos = loop;
                loop = notif_obj.notifs.length;
            }
            loop++;
        }
        switch(report_obj.server){
            case "BIGMAMA":
                notif_users = notif_obj.notifs[pos].notify_bigmama;
                break;
            case "DEVILANG":
                notif_users = notif_obj.notifs[pos].notify_devilang;
                break;
            case "WADANGKA":
                notif_users = notif_obj.notifs[pos].notify_wadangka;
                break;
            case "CALIGO":
                notif_users = notif_obj.notifs[pos].notify_caligo;
                break;
            case "TURTLEZ":
                notif_users = notif_obj.notifs[pos].notify_turtlez;
                break;
            case "NEWSTAR":
                notif_users = notif_obj.notifs[pos].notify_newstar;
                break;
            case "DARLENE":
                notif_users = notif_obj.notifs[pos].notify_darlene;
                break;
            case "BARSLAF":
                notif_users = notif_obj.notifs[pos].notify_barslaf;
                break;
            case "모아임":
                notif_users = notif_obj.notifs[pos].notify_모아임;
                break;
            case "시리온":
                notif_users = notif_obj.notifs[pos].notify_시리온;
                break;
            case "파로스":
                notif_users = notif_obj.notifs[pos].notify_파로스;
                break;
            case "헤이블":
                notif_users = notif_obj.notifs[pos].notify_헤이블;
                break;
            case "クイー":
                notif_users = notif_obj.notifs[pos].notify_クイー;
                break;
        }
        const guild = client.guilds.cache.get(report_obj.home_guild);
        const channel = guild.channels.cache.get(report_obj.home_channel);
        loop = 0;
        var notif_handles = [];
        notif_users.forEach(Element => {
            var user_JSON = JSON.parse(fs.readFileSync("./User_Data/" + Element + ".json", "utf8"));
            notif_handles[notif_handles.length] = user_JSON.User_Object.discord;
            if(user_JSON.User_Object.alt.length > 0){
                loop = 0;
                while(loop < user_JSON.alt.length){
                    notif_handles[notif_handles.length] = user_JSON.User_Object.alt[loop];
                    loop++;
                }
            }
        })
        var notif_profiles = [];
        var channel_check = false;
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.discord == report_obj.home_channel){
                channel_check = true;
            }
        })
        notif_handles.forEach(Element => {
            /*if(guild.members.cache.includes(Element)){
                notif_profiles[notif_profiles.length] = guild.members.cache.get(Element);
            }*/
            notif_profiles[notif_profiles.length] = guild.members.cache.get(Element);
            //notif_profiles[notif_profiles.length] = "<@" + Element + ">";
        })
        var monster_file = JSON.parse(fs.readFileSync("./Monster_Data/" + report_obj.mID + ".json"), "utf8");
        const Warning_Embed = new Discord.MessageEmbed()
            .setTitle(report_obj.boss)
            //.addField(report_obj.boss, body_reply)
            .setColor(guild_obj.color)
            .setAuthor('Respawn Reminder', key.image, key.website);
        if(path == 0 || path == 3){
            Warning_Embed.addField(report_obj.boss, body_reply);
        }else{
            Warning_Embed.addField(body_reply, "Respawn time: " + date_arr.join(":"));
        }
        var channel_obj = null;
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.discord == channel.id){
                channel_obj = Element;
            }
        })
        var notif_channels = [];
        guild_obj.Channel_Objects.forEach(Element => {
            if(Element.Root.includes(channel_obj.id)){
                notif_channels[notif_channels.length] = Element;
            }
        })
        if(channel_obj != null){
            if(channel_obj.color != null){
                Warning_Embed.setColor(channel_obj.color);
            }
        }
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
        var Footer_img = null;
        var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
        server_JSON.Server_Objects.forEach(Element => {
            if(Element.Server == report_obj.server){
                Footer_img = Element.Footer;
            }
        })
        Warning_Embed.setFooter(report_obj.server.toLowerCase() + " server", Footer_img);
        if(report_obj.image != null){
            Warning_Embed.setThumbnail(report_obj.image);
        }
        console.log('notif length ' + notif_profiles.length);
        if(channel_obj.Boss_Warnings == true){
            if(channel_check == true){
                if(notif_profiles.length == 0){
                    channel.send(Warning_Embed);
                }else{
                    channel.send(report_obj.boss + " - " + reduced + "\n" + notif_profiles.join(', '), Warning_Embed);
                }
            }
        }
        notif_channels.forEach(Element => {
            var channel = client.channels.cache.get(Element.discord);
            if(Element.color != null){
                Warning_Embed.setColor(Element.Color);
            }else{
                Warning_Embed.setColor(guild_obj.color);
            }
            if(notif_profiles.length == 0){
                channel.send(Warning_Embed);
            }else{
                channel.send(report_obj.boss + " - " + reduced + "\n" + notif_profiles.join(', '), Warning_Embed);
            }
        })
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
        var filtered_log = [];
        log.Event_Arr.forEach(Element => {
            if(Element.log_type == "R"){
                if(Element.users.includes(user) && Element.loot.length == 0){
                    filtered_log[filtered_log.length] = Element;
                }
            }
        })
        if(filtered_log.length == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("No bosses killed by `" + message.author.username + "` with unreported loot found in logs.");
                    break;
            }
            return;
        }
        Loot_Log_Menu(message, guild_obj, user, server, filtered_log, 0);
    }else{
        var loot_menu = JSON.parse(fs.readFileSync('./menus/loot.json', 'utf8'));
        var select = null;
        loot_menu.Monster_Select.forEach(Element => {
            if(Element.Shortcuts.includes(in_Arr.join('')) || Element.mID == in_Arr.join('')){
                select = Element;
            }
        })
        console.log(in_Arr.join(''));
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
        }else{
            var report_obj = null;
            log.Event_Arr.forEach(Element => {
                if(Element.log_type == "R"){
                    if(Element.mID == select.mID && Element.users.includes(user)){
                        report_obj = Element;
                    }
                }
            })
            if(report_obj == null){
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send("User `" + message.author.username + "` has no recorded kills of **" + select.Title + "** on **" + server + "**");
                        break;
                }
            }else if(report_obj.loot.length > 0){
                var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
                var return_err_Embed = new Discord.MessageEmbed()
                    .setAuthor("Loot Report", key.image, key.website)
                    .setColor(guild_obj.color)
                    .setTitle("**" + boss_obj.Boss + " Loot Report**");
                var channel_obj = null;
                guild_obj.Channel_Objects.forEach(Element => {
                    if(Element.discord == message.channel.id){
                        channel_obj = Element;
                    }
                })
                if(channel_obj != null){
                    if(channel_obj.color != null){
                        return_err_Embed.setColor(channel_obj.color);
                    }
                }
                var equip_file = null;
                var item_file = null;
                var loot_disp = [];
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
                    }else if(Element.startsWith("Gold")){
                        loot_disp[loot_disp.length] = "<:Gold:834876053029126144> " + Element;
                    }
                })
                return_err_Embed.addField('**Loot**', loot_disp.join('\n'));
                var date = new Date(report_obj.death);
                return_err_Embed.setDescription(date.getDate + "/" + date.getMonth + "/" + date.getFullYear() + ", " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
                console.log(guild_obj)
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send("Loot for **" + boss_obj.Boss + "** has already been reported", return_err_Embed);
                        break;
                }
                console.log('loot already reported')
            }else{
                Loot_Reply(message, guild_obj, report_obj);
            }
        }
    }
}

async function Loot_Log_Menu(message, guild_obj, user, server, Log_Array, page){
    var disp_Arr = [];
    var select_Arr = [];
    var total_pages = Log_Array.length/10;
    var loop = (Log_Array.length - 1) - (page * 10);
    var stop = loop - 10;
    var monster_file = null;
    console.log(Log_Array);
    console.log(loop);
    while(loop > stop && loop > -1){
        monster_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Log_Array[loop].mID + ".json", "utf8"));
        var date = new Date(Log_Array[loop].death);
        var Date_Arr = [date.getDate(), date.getMonth(), date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()];
        var date_loop = 0;
        while(date_loop < Date_Arr.length){
            if(Date_Arr[loop] < 10){
                Date_Arr[loop] = "0" + Date_Arr[loop].toString();
            }
            date_loop++;
        }
        var Date_String = Date_Arr[0] + "/" + Date_Arr[1] + "/" + Date_Arr[2] + " ~ " + Date_Arr[3] + ":" + Date_Arr[4] + ":" + Date_Arr[5];
        /*var Date_Arr = date.getDate() + "/" + date.getMonth() + 1 + "/" + date.getFullYear() + ", " + date.getHours() + ":";
        log 
        if(date.getMinutes() < 10){
            Date_Arr = Date_Arr + '0' + date.getMinutes() + ":";
        }else{
            Date_Arr = Date_Arr + date.getMinutes() + ":";
        }
        if(date.getSeconds() < 10){
            Date_Arr = Date_Arr + '0' + date.getSeconds();
        }else{
            Date_Arr = Date_Arr + date.getSeconds();
        }*/
        if(monster_file.Emoji != null){
            disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + ". " + monster_file.Emoji + " " + monster_file.Boss + " - " + Date_String;
        }else{
            disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + ". " + monster_file.Boss + " - " + Date_String;
        }
        select_Arr[select_Arr.length] = Log_Array[loop];
        loop--;
    }
    if(page > 0){
        disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + ". Previous Page";
        select_Arr[select_Arr.length] = "prev";
    }
    if(Log_Array.length/10 > (page + 1)){
        disp_Arr[disp_Arr.length] = (disp_Arr.length + 1).toString() + ". Next Page";
        select_Arr[select_Arr.length] = "next";
    }
    if(total_pages.toString().includes(".")){
        total_pages = (total_pages + 1).toString().split(".")[0];
    }
    console.log(total_pages, disp_Arr);
    
    var Loot_Menu_Embed = new Discord.MessageEmbed()
        .setAuthor("Log Menu", key.image, key.website)
        .setColor(guild_obj.color)
        .setTitle("**Recent Boss Kills**")
        .addField("Log Page " + (page + 1) + " of " + total_pages, disp_Arr.join("\n"))
        .setFooter("Respond with the number corresponding to the boss report set you'd like to report loot for");
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Loot_Menu_Embed.setColor(channel_obj.color);
        }
    }
    var menu_prompt = await message.channel.send(Loot_Menu_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                menu_prompt.delete();
            }
            
            return;
        }
        if(collected.first().content.toString().toLowerCase() == "cancel"){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation canceled.")
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                menu_prompt.delete();
                collected.first().delete();
            }
            
            return;
        }
        var reply = parseInt(collected.first().content.toString(), 10) - 1;
        if(isNaN(reply) || reply < 0 || reply > (select_Arr.length - 1)){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + collected.first().content.toString() + "`. Try `" + guild_obj.key + "help loot` or `" + guild_obj.key + 'help loot history`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                menu_prompt.delete();
                collected.first().delete();
            }
            
            return;
        }
        var selected = select_Arr[reply];
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            menu_prompt.delete();
            collected.first().delete();
        }
        
        if(selected == 'prev' || selected == "previous" || selected == "p"){
            Loot_Log_Menu(message, guild_obj, user, server, Log_Array, page - 1);
        }else if(selected == 'next' || selected == "n"){
            Loot_Log_Menu(message, guild_obj, user, server, Log_Array, page + 1);
        }else{
            Loot_Reply(message, guild_obj, selected);
        }
    })
    
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Loot_Embed.setColor(channel_obj.color);
        }
    }
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                map_menu.delete();
            }
           
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input.split(' ').length != 1){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                map_menu.delete();
            }
            
            return;
        }
        if(isNaN(input) || parseInt(input, 10) < 1 || parseInt(input, 10) > map_menu.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                map_menu.delete();
            }
            
            return;
        }
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            map_menu.delete();
            collected.first().delete(); 
        }
        
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            boss_select_Embed.setColor(channel_obj.color);
        }
    }
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                boss_select_rply.delete();
            }
            
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input.split(' ').length != 1){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                boss_select_rply.delete();
            }
            
            return;
        }
        if(isNaN(input) || parseInt(input, 10) < 1 || parseInt(input, 10) > monster_menu.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Unable to determine `" + input + "`, try `" + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                boss_select_rply.delete();
            }
            
            return;
        }
        var date = new Date();
        var date_ms = date.getTime();
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            boss_select_rply.delete();
            collected.first().delete(); 
        }
        
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
            var log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
            var report_obj = null;
            log.Event_Arr.forEach(Element => {
                if(Element.log_type == "R"){
                    if(Element.mID == monster_menu[pos].id && Element.users.includes(user)){
                        report_obj = Element;
                    }
                }
            })
            if(report_obj == null){
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send("User `" + message.author.username + "` has no recorded kills of **" + monster_menu[pos].Boss + "** on **" + server + "**");
                        break;
                }
            }else if(report_obj.loot.length > 0){
                var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
                var return_err_Embed = new Discord.MessageEmbed()
                    .setAuthor("Loot Report", key.image, key.website)
                    .setColor(guild_obj.color)
                    .setTitle("**" + monster_menu[pos].Boss + " Loot Report**");
                var channel_obj = null;
                guild_obj.Channel_Objects.forEach(Element => {
                    if(Element.discord == message.channel.id){
                        channel_obj = Element;
                    }
                })
                if(channel_obj != null){
                    if(channel_obj.color != null){
                        return_err_Embed.setColor(channel_obj.color);
                    }
                }
                var equip_file = null;
                var item_file = null;
                var loot_disp = [];
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
                    }else if(Element.startsWith("Gold")){
                        loop_disp[loot_disp.length] = "<:Gold:834876053029126144> " + Element;
                    }
                })
                return_err_Embed.addField('**Loot**', loot_disp.join('\n'));
                var date = new Date(report_obj.death);
                return_err_Embed.setDescription(date.getDate + "/" + date.getMonth + "/" + date.getFullYear() + ", " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
                console.log(guild_obj)
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send("Loot for **" + monster_menu[pos].Boss + "** has already been reported", return_err_Embed);
                        break;
                }
                console.log('loot already reported')
            }else{
                Loot_Reply(message, guild_obj, report_obj);
            }
        }
    })
}

async function Loot_Reply(message, guild_obj, report_obj){
    console.log(report_obj);
    //the report object from the log json file has been found, build a embed and create a message collector for the user to reply with
    var boss_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + report_obj.mID + '.json', 'utf8'));
    var death_time = new Date(report_obj.death);
    var death_date = [death_time.getFullYear(), death_time.getMonth(), death_time.getDate(), death_time.getHours(), death_time.getMinutes(), death_time.getSeconds()]
    death_date[1]++;
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Loot_Embed.setColor(channel_obj.color);
        }
    }
    if(boss_obj.Image != null){
        Loot_Embed.setThumbnail(boss_obj.Image);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == report_obj.server){
            Footer_img = Element.Footer;
        }
    })
    Loot_Embed.setFooter(report_obj.server.toLowerCase() + " server", Footer_img);
    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
    var loot_menu = [];
    boss_obj.Loot_Table.forEach(Element => {
        if(Element.split(' ').length > 1){
            if(Element.split(' ')[1].includes('-')){
                loop = parseInt(Element.split(' (')[1].split('-')[0], 10)
                while(loop < (parseInt(Element.split(' ')[1].split('-')[1].split(")")[0], 10) + 1)){
                    loot_menu[loot_menu.length] = Element.split(' ')[0] + ' (' + loop.toString() + ')';
                    loop++;
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
            }
            
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel' || in_str[0] == 'none' || in_str[0] == 'nothing'){
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
                collected.first().delete();
            }
            message.channel.send("Command canceled.");
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
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            loot_reply.delete();
                        }
                       
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
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            loot_reply.delete();
                        }
                        
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
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            loot_reply.delete();
                        }
                        
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
                        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                            loot_reply.delete();
                        }
                        
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
                    if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                        loot_reply.delete();
                    }
                    
                    return;
                }
                console.log(looted_items)
                if(looted_items.includes(loot_menu[pos])){
                    switch(guild_obj.language){
                        case 'english':
                            message.channel.send('Can not report duplicate loot `' + loot_menu[pos] + '`. Try `' + guild_obj.key + 'help loot`');
                            break;
                    }
                    if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                        loot_reply.delete();
                    }
                    
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
                collected.first().delete();
            }
            
            report_obj.loot = looted_items;
            Log_Loot(message, guild_obj, report_obj, boss_obj);
        }else{
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
                collected.first().delete();
            }
           
            Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, 0);
        }
    })
}

function Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, pos){
    //A followup is required due to a looted item having variable loot
    var equip_file = null;
    console.log(report_obj);
    if(looted_items[pos].startsWith('e')){
        equip_file = JSON.parse(fs.readFileSync('./Equipment_Data/' + looted_items[pos].split(' ')[0] + '.json'));
        if(equip_file.is_Static == false){
            if(equip_file.Stat_Ranges.length > 0){
                Range_Loot_Resolve(message, guild_obj, report_obj, boss_obj, looted_items, pos);
            }else{
                Veriety_Loot_Resolve(message, guild_obj, report_obj, boss_obj, looted_items, pos);
            }
        }else{
            pos++;
            if(pos == looted_items.length){
                report_obj.loot = looted_items;
                Log_Loot(message, guild_obj, report_obj, boss_obj);
            }else{
                Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, pos);
            }
        }
    }else{
        pos++;
        if(pos == looted_items.length){
            report_obj.loot = looted_items;
            Log_Loot(message, guild_obj, report_obj, boss_obj);
        }else{
            Resolve_Loot(message, guild_obj, report_obj, boss_obj, looted_items, pos);
        }
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Loot_Embed.setColor(channel_obj.color);
        }
    }
    if(equip_file.image != null){
        Loot_Embed.setImage(equip_file.image);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == report_obj.server){
            Footer_img = Element.Footer;
        }
    })
    Loot_Embed.setFooter(report_obj.server.toLowerCase() + " server", Footer_img);
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
            }
            
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
                collected.first().delete();
            }
            message.channel.send("Command canceled.");
            return;
        }
        if(in_str.length != 1 || isNaN(in_str[0]) == true){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
            }
            
            return;
        }
        var selection = parseInt(in_str[0], 10) - 1;
        if(selection < 0 || selection > loot_disp.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
            }
            
            return;
        }
        looted_items[pos] = looted_items[pos] + ' [' + selection.toString() + ']';
        pos++;
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            loot_reply.delete();
            collected.first().delete();
        }
        
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Loot_Embed.setColor(channel_obj.color);
        }
    }
    if(equip_file.image != null){
        Loot_Embed.setImage(equip_file.image);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == report_obj.server){
            Footer_img = Element.Footer;
        }
    })
    Loot_Embed.setFooter(report_obj.server.toLowerCase() + " server", Footer_img);
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
            }
            
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
                collected.first().delete();
            }
            message.channel.send("Command canceled.");
            return;
        }
        if(in_str.length != equip_file.Stat_Ranges.length){
            console.log('lengths dont match')
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
            }
            
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
                if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                    loot_reply.delete();
                }
                
                return;
            }
            in_str[loop] = parseInt(in_str[loop], 10);
            loop++;
        }
        looted_items[pos] = looted_items[pos] + ' [' + in_str.join(',') + ']';
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            loot_reply.delete();
            collected.first().delete();
        }
        pos++;
        
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
    var user_profiles = [];
    var user_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    report_obj.users.forEach(Element => {
        user_profiles[user_profiles.length] = client.users.cache.get(user_dir.Member_Objects[parseInt(Element.slice(1), 10) - 1].discord);
    })
    const Loot_Embed = new Discord.MessageEmbed()
        .setAuthor('Loot Report', key.image, key.website)
        .setTitle('**' + boss_obj.Boss + '**')
        .setDescription(boss_obj.Map)
        .addField("**Looted by**", user_profiles.join("\n"))
        .setColor(guild_obj.color);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Loot_Embed.setColor(channel_obj.color);
        }
    }
    if(boss_obj.Image != null){
        Loot_Embed.setThumbnail(boss_obj.Image);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == report_obj.server){
            Footer_img = Element.Footer;
        }
    })
    Loot_Embed.setFooter(report_obj.server.toLowerCase() + " server", Footer_img);
    report_obj.loot.forEach(Element => {//want the gold to be at the top of the list
        if(Element.split(' ')[0] == 'Gold'){
            loot_disp[loot_disp.length] = "<:Gold:834876053029126144> " + Element;
            Exp++;
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
    var Exp = 0;
    loot_file.loot.forEach(Element => {
        loop = 0;
        if(Element == "Gold"){
            Exp = Exp + 1;
        }else if(Element.startsWith("Gold") && Element.split(" ").length == 2){
            Exp = Exp + 5;
        }else{
            while(loop < boss_obj.Loot_menu.length){
                if(Element.split(" ")[0] == boss_obj.Loot_menu[loop].id){
                    if(Element.startsWith("i") && Element.split(" ").length == 1 || Element.startsWith("e")){
                        Exp = Exp + boss_obj.Loot_menu[loop].Exp;
                    }else{
                        Exp = Exp + (boss_obj.Loot_menu[loop].Exp * parseInt(Element.split(" ")[1].slice(1,-1), 10));
                    }
                    loop = boss_obj.Loot_menu.length;
                }
                loop++;
            }
        }
    })
    Loot_Embed.addField("**Exp Rewarded**", Exp + " Exp");
    loot_file.users.forEach(Element => {
        Exp_Update(message, guild_obj.id, Element, Exp);
    })
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Pin_Embed.setColor(channel_obj.color);
        }
    }
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
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == server){
            Footer_img = Element.Footer;
        }
    })
    Pin_Embed.setFooter(server.toLowerCase() + " server", Footer_img);
    message.channel.send(Pin_Embed);
    var notif_file = null;
    //if path == true, it's punch in
    //if path == false, it's punch out
    console.log(mID_Arr, users);
    var notif_json = JSON.parse(fs.readFileSync("./notifs/" + guild_obj.id + ".json", "utf8"));
    console.log(mID_Arr);
    mID_Arr.forEach(Element => {
        var old_Arr = [];
        var new_Arr = [];
        if(Element == "battlefield"){
            old_Arr = notif_json.notifs[0].notify_battlefield;
            if(path == true){
                new_Arr = old_Arr;
                loop = 0;
                while(loop < users.length){
                     if(old_Arr.includes(users[loop]) == false){
                        new_Arr[new_Arr.length] = users[loop];
                    }
                    loop++;
                }
            }else{
                loop = 0;
                while(loop < old_Arr.length){
                    if(users.includes(old_Arr[loop]) == false){
                        new_Arr[new_Arr.length] = old_Arr[loop];
                    }
                    loop++;
                }
            }
            notif_json.notifs[0].notify_battlefield = new_Arr;
        }else if(Element == "siege"){
            old_Arr = notif_json.notifs[0].notify_siege;
            if(path == true){
                new_Arr = old_Arr;
                loop = 0;
                while(loop < users.length){
                     if(old_Arr.includes(users[loop]) == false){
                        new_Arr[new_Arr.length] = users[loop];
                    }
                    loop++;
                }
            }else{
                loop = 0;
                while(loop < old_Arr.length){
                    if(users.includes(old_Arr[loop]) == false){
                        new_Arr[new_Arr.length] = old_Arr[loop];
                    }
                    loop++;
                }
            }
            notif_json.notifs[0].notify_siege = new_Arr;
        }else{
            var pos = 1;
            loop = 1;
            while(loop < notif_json.notifs.length){
                if(notif_json.notifs[loop].mID == Element){
                    pos = loop;
                    loop = notif_json.notifs.length;
                }
                loop++;
            }
            switch(server){
                case 'BIGMAMA':
                    old_Arr = notif_json.notifs[pos].notify_bigmama;
                    break;
                case 'DEVILANG':
                    old_Arr = notif_json.notifs[pos].notify_devilang;
                    break;
                case 'WADANGKA':
                    old_Arr = notif_json.notifs[pos].notify_wadangka;
                    break;
                case 'CALIGO':
                    old_Arr = notif_json.notifs[pos].notify_caligo;
                    break;
                case 'TURTLEZ':
                    old_Arr = notif_json.notifs[pos].notify_turtlez;
                    break;
                case 'NEWSTAR':
                    old_Arr = notif_json.notifs[pos].notify_newstar;
                    break;
                case 'DARLENE':
                    old_Arr = notif_json.notifs[pos].notify_darlene;
                    break;
                case 'BARSLAF':
                    old_Arr = notif_json.notifs[pos].notify_barslaf;
                    break;
                case '모아임':
                    old_Arr = notif_json.notifs[pos].notify_모아임;
                    break;
                case '시리온':
                    old_Arr = notif_json.notifs[pos].notify_시리온;
                    break;
                case '파로스':
                    old_Arr = notif_json.notifs[pos].notify_파로스;
                    break;
                case '헤이블':
                    old_Arr = notif_json.notifs[pos].notify_헤이블;
                    break;
                case 'クイー':
                    old_Arr = notif_json.notifs[pos].notify_クイー;
                    break;
            }
            if(path == true){
                new_Arr = old_Arr;
                loop = 0;
                while(loop < users.length){
                     if(old_Arr.includes(users[loop]) == false){
                        new_Arr[new_Arr.length] = users[loop];
                    }
                    loop++;
                }
            }else{
                loop = 0;
                while(loop < old_Arr.length){
                    if(users.includes(old_Arr[loop]) == false){
                        new_Arr[new_Arr.length] = old_Arr[loop];
                    }
                    loop++;
                }
            }
            switch(server){
                case 'BIGMAMA':
                    notif_json.notifs[pos].notify_bigmama = new_Arr;
                    break;
                case 'DEVILANG':
                    notif_json.notifs[pos].notify_devilang = new_Arr;
                    break;
                case 'WADANGKA':
                    notif_json.notifs[pos].notify_wadangka = new_Arr;
                    break;
                case 'CALIGO':
                    notif_json.notifs[pos].notify_caligo = new_Arr;
                    break;
                case 'TURTLEZ':
                    notif_json.notifs[pos].notify_turtlez = new_Arr;
                    break;
                case 'NEWSTAR':
                    notif_json.notifs[pos].notify_newstar = new_Arr;
                    break;
                case 'DARLENE':
                    notif_json.notifs[pos].notify_darlene = new_Arr;
                    break;
                case 'BARSLAF':
                    notif_json.notifs[pos].notify_barslaf = new_Arr;
                    break;
                case '모아임':
                    notif_json.notifs[pos].notify_모아임 = new_Arr;
                    break;
                case '시리온':
                    notif_json.notifs[pos].notify_시리온 = new_Arr;
                    break;
                case '파로스':
                    notif_json.notifs[pos].notify_파로스 = new_Arr;
                    break;
                case '헤이블':
                    notif_json.notifs[pos].notify_헤이블 = new_Arr;
                    break;
                case 'クイー':
                    notif_json.notifs[pos].notify_クイー = new_Arr;
                    break;
            }
        }
    })
    fs.writeFileSync("./notifs/" + guild_obj.id + ".json", JSON.stringify(notif_json, null, 4), "utf8");
}

function check_notifs(message, guild_obj, in_Arr){
    var user_file = null;
    var users_json = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var loop = null;
    if(in_Arr.length == 1){
        if(in_Arr[0].startsWith("u")){
            var u_num = parseInt(in_Arr[0].slice(1), 10);
            if(isNaN(u_num) || u_num < 1 || u_num > users_json.Total_Members){
                message.channel.send("Unable to determine input `" + in_Arr[0] + "`. Try `" + guild_obj.key + "help notifs`");
                return;
            } 
            if(u_num < 10){
                user_file = JSON.parse(fs.readFileSync("./User_Data/u00" + u_num + ".json", "utf8"));
            }else if(u_num < 100){
                user_file = JSON.parse(fs.readFileSync("./User_Data/u0" + u_num + ".json", "utf8"));
            }else{
                user_file = JSON.parse(fs.readFileSync("./User_Data/u" + u_num + ".json", "utf8"));
            }
        }else if(in_Arr[0].startsWith("<@")){
            if(in_Arr[0].startsWith("<@&")){
                //follow up with this
            }else if(in_Arr[0].startsWith("<@!")){
                var u_num = in_Arr[0].split("<@!")[1].split(">")[0];
                loop = 0;
                while(loop < users_json.Member_Objects.length){
                    if(users_json.Member_Objects[loop].discord == u_num){
                        user_file = JSON.parse(fs.readFileSync("./User_Data/" + users_json.Member_Objects[loop].id + ".json", "utf8"));
                        loop = users_json.Total_Members;
                    }
                    loop++;
                }
            }else if(in_Arr[0].startsWith("<@")){
                var u_num = in_Arr[0].split("<@")[1].split(">")[0]
                loop = 0;
                while(loop < users_json.Member_Objects.length){
                    if(users_json.Member_Objects[loop].discord == u_num){
                        user_file = JSON.parse(fs.readFileSync("./User_Data/" + users_json.Member_Objects[loop].id + ".json", "utf8"));
                        loop = users_json.Total_Members;
                    }
                    loop++;
                }
            }
            if(user_file == null){
                message.channel.send("Unable to locate user `" + in_Arr[0] + "`");
                return;
            }
        }else{
            message.channel.send("Unable to determine input `" + in_Arr[0] + "`. Try `" + guild_obj.key + "help notifs`");
            return
        }
    }else if(in_Arr.length > 1){
        message.channel.send("Too many arguments. Try `" + guild_obj.key + "help notifs`");
        return
    }else{
        loop = 0;
        while(loop < users_json.Member_Objects.length){
            if(users_json.Member_Objects[loop].discord == message.author.id){
                user_file = JSON.parse(fs.readFileSync("./User_Data/" + users_json.Member_Objects[loop].id + ".json", "utf8"));
                loop = users_json.Total_Members;
            }
            loop++;
        }
    }
    if(user_file == null){
        message.channel.send("Error in `function check_notifs()` Unable to determine target user");
        return;
    }
    if(user_file.User_Object.guilds.includes(guild_obj.id) == false){
        message.channel.send("User `" + user_file.User_Object.id + "` is not a member of **" + guild_obj.Guild_Name + "**");
        return;
    }
    var channel_obj = null;
    loop = 0;
    while(loop < guild_obj.Channel_Objects.length){
        if(guild_obj.Channel_Objects[loop].discord == message.channel.id){
            channel_obj = guild_obj.Channel_Objects[loop];
            loop = guild_obj.Channel_Objects.length;
        }
        loop++;
    }
    var notif_embed = new Discord.MessageEmbed()
        .setAuthor("Notifications", key.image, key.website)
        .setColor(guild_obj.Color)
        .setTitle(user_file.User_Object.Emoji + " **" + user_file.User_Object.name + " Current Notification Settings**");
    if(channel_obj.color != null){
        notif_embed.setColor(channel_obj.color);
    }
    var notif_file = JSON.parse(fs.readFileSync("./notifs/" + guild_obj.id + ".json", "utf8")).notifs;
    var bf = false;
    var siege = false;
    if(notif_file[0].notify_battlefield.includes(user_file.User_Object.id)){
        bf = true;
    }
    if(notif_file[0].notify_siege.includes(user_file.User_Object.id)){
        siege = true;
    }
    if(bf == true && siege == true){
        notif_embed.addField("**Misc Notifications**", "<:CrownRockFlag:1196662569247711242> Guild Siege\n<:BF_Treasure:1196663302764372089> Battlefield");
    }else if(bf == true){
        notif_embed.addField("**Misc Notifications**", "<:BF_Treasure:1196663302764372089> Battlefield");
    }else if(siege == true){
        notif_embed.addField("**Misc Notifications**", "<:CrownRockFlag:1196662569247711242> Guild Siege");
    }
    var bigmama = [];
    var devilang = [];
    var wadangka = [];
    var caligo = [];
    var turtlez = [];
    var newstar = [];
    var darlene = [];
    var barslaf = [];
    var kanos = [];
    var 모아임 = [];
    var 시리온 = []
    var 파로스 = [];
    var 헤이블 = [];
    var クイー = [];
    loop = 1;
    while(loop < notif_file.length){
        if(notif_file[loop].notify_bigmama.includes(user_file.User_Object.id)){
            bigmama[bigmama.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_devilang.includes(user_file.User_Object.id)){
            devilang[devilang.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_wadangka.includes(user_file.User_Object.id)){
            wadangka[wadangka.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_caligo.includes(user_file.User_Object.id)){
            caligo[caligo.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_turtlez.includes(user_file.User_Object.id)){
            turtlez[turtlez.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_newstar.includes(user_file.User_Object.id)){
            newstar[newstar.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_darlene.includes(user_file.User_Object.id)){
            darlene[darlene.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_barslaf.includes(user_file.User_Object.id)){
            barslaf[barslaf.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_kanos.includes(user_file.User_Object.id)){
            kanos[kanos.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_모아임.includes(user_file.User_Object.id)){
            모아임[모아임.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_시리온.includes(user_file.User_Object.id)){
            시리온[시리온.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_파로스.includes(user_file.User_Object.id)){
            파로스[파로스.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_헤이블.includes(user_file.User_Object.id)){
            헤이블[헤이블.length] = notif_file[loop].mID;
        }
        if(notif_file[loop].notify_クイー.includes(user_file.User_Object.id)){
            クイー[クイー.length] = notif_file[loop].mID;
        }
        loop++;
    }
    var servers = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    var disp_Arr = [];
    var field_count = 0;
    if(bf == true || siege == true){
        field_count = 1;
    }
    if(bigmama.length > 0){
        bigmama.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "BIGMAMA"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(devilang.length > 0){
        devilang.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "DEVILANG"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(wadangka.length > 0){
        wadangka.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "WADANGKA"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(caligo.length > 0){
        caligo.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "CALIGO"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(turtlez.length > 0){
        turtlez.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "TURTLEZ"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(newstar.length > 0){
        newstar.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "NEWSTAR"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(darlene.length > 0){
        darlene.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "DARLENE"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(barslaf.length > 0){
        barslaf.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "BARSLAF"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(kanos.length > 0){
        kanos.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "KANOS"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(모아임.length > 0){
        모아임.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "모아임"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(시리온.length > 0){
        시리온.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "시리온"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(파로스.length > 0){
        파로스.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "파로스"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(헤이블.length > 0){
        헤이블.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "헤이블"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(クイー.length > 0){
        クイー.forEach(Element => {
            var boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
            if(Element == "m001" || Element == "m002" || Element == "m003" || Element == "m004" || Element == "m005" || Element == "m006" || Element == "m011" || Element == "m012" || Element == "m013" || Element == "m014" || Element == "m101" || Element == "m102" || Element == "m103" || Element == "m104" || Element == "m105" || Element == "m106"){
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss + " (" + boss_file.Map + ")";
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss + " (" + boss_file.Map + ")";
                }
            }else{
                if(boss_file.Emoji == null){
                    disp_Arr[disp_Arr.length] = boss_file.Boss;
                }else{
                    disp_Arr[disp_Arr.length] = boss_file.Emoji + " " + boss_file.Boss;
                }
            }
        })
        var title = null;
        servers.Server_Objects.forEach(Element => {
            if(Element.Server == "クイー"){
                if(Element.Emoji == null){
                    title = Element.Server;
                }else{
                    title = Element.Emoji + " " + Element.Server;
                }
            }
        })
        if(disp_Arr.join("\n").length < 256){
            if(field_count > 25){
                notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
            }else{
                field_count++;
                notif_embed.addField("**Server " + title + "**", disp_Arr.join("\n"));
            }
            
        }else{
            var trim_disp_Arr = [];
            loop = 0;
            while(loop < disp_Arr.length){
                if(trim_disp_Arr.join(("\n")).length + disp_Arr[loop].length > 254){
                    if(field_count > 25){
                        notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                    }else{
                        field_count++;
                        notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                        trim_disp_Arr = [];
                        trim_disp_Arr[0] = disp_Arr[loop];
                    }
                }else{
                    trim_disp_Arr[trim_disp_Arr.length] = disp_Arr[loop];
                }
                loop++;
            }
            if(trim_disp_Arr.length > 0){
                if(field_count > 25){
                    notif_embed.setFooter("Insufficient Space in Discord Embed, some settings were cut.");
                }else{
                    notif_embed.addField("**Server " + title + "**", trim_disp_Arr.join("\n"));
                    field_count++;
                }
            }
        }
    }
    if(field_count == 0){
        notif_embed.setFooter("No Notifications Currently Active");
    }
    message.channel.send(notif_embed).catch(err => {
        message.channel.send("Message Embed Failure. Maximum Size Exceeded\nYou did it, contact Dan");
    });
}

function Box(message, guild_obj, in_Arr){
    //a user wants to report box contents
    var user = null;
    var users_dir = JSON.parse(fs.readFileSync('./User_Data/users.json', 'utf8'));
    var loop = 0;
    while(loop < users_dir.Member_Objects.length){
        if(users_dir.Member_Objects[loop].discord == message.author.id || users_dir.Member_Objects[loop].alt.includes(message.author.id)){
            user = users_dir.Member_Objects[loop].id;
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
    var in_Arr_filtered = [];
    in_Arr.forEach(Element => {
        if(Element.length > 0){
            in_Arr_filtered[in_Arr_filtered.length] = Element;
        }
    })
    if(in_Arr_filtered.length != in_Arr.length){
        in_Arr = [];
        in_Arr = in_Arr_filtered;
    }
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Box_Menu_Embed.setColor(channel_obj.color);
        }
    }
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Box_Menu.Reply.delete();
            }
            
            return;
        }
        var input = collected.first().content.toString().toLowerCase();
        if(input.split(' ').length != 1){
            switch(guild_obj.language){
                case 'english': 
                    message.channel.send('Unable to determine input `' + input + '`. Try `' + guild_obj.key + 'help box`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Box_Menu_Reply.delete();
            }
            
            return;
        }
        var pos = parseInt(input) - 1;
        if(isNaN(pos) || pos < 0 || pos > (box_json_Active.length - 1)){
            switch(guild_obj.language){
                case 'english': 
                    message.channel.send('Unable to determine input `' + input + '`. Try `' + guild_obj.key + 'help box`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Box_Menu_Reply.delete();
            }
            
            return;
        }
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            Box_Menu_Reply.delete();
            collected.first().delete();
        }
        
        
        
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Box_Embed.setColor(channel_obj.color);
        }
    }
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Box_Reply.delete();
            }
            
            return;
        }
        var input = collected.first().content.toString().toLowerCase().split(" ");
        if(input.length == 1 && input[0] == 'cancel' || input.length == 1 && input[0] == 'none'){
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                collected.first().delete();
                Box_Reply.delete();
            }
            message.channel.send("Canceled command.");
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
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
           collected.first().delete();
            Box_Reply.delete(); 
        }
        
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Box_Embed.setColor(channel_obj.color);
        }
    }
    if(equip_file.image != null){
        Box_Embed.setImage(equip_file.image);
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == server){
            Footer_img = Element.Footer;
        }
    })
    Box_Embed.setFooter(server.toLowerCase() + " server", Footer_img);
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
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                content_reply.delete();
            }
            
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                content_reply.delete();
                collected.first().delete();
            }
            message.channel.send("Command canceled.");
            return;
        }
        if(in_str.length != 1 || isNaN(in_str[0]) == true){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                content_reply.delete();
            }
            return;
        }
        var selection = parseInt(in_str[0], 10) - 1;
        if(selection < 0 || selection > loot_disp.length){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                content_reply.delete();
            }
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
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            content_reply.delete();
            collected.first().delete();
        }
        pos++;
       
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Box_Embed.setColor(channel_obj.color);
        }
    }
    if(equip_file.image != null){
        Box_Embed.setImage(equip_file.image);
    }
    equip_file.Stat_Ranges.forEach(Element => {
        loot_disp[loot_disp.length] = Element;
    })
    Box_Embed.addField('What stats does the ' + equip_file.Title + ' have?', loot_disp.join('\n'));
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == server){
            Footer_img = Element.Footer;
        }
    })
    Box_Embed.setFooter(server.toLowerCase() + " server", Footer_img);
    var content_reply = await message.channel.send(Box_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 }, );
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out. Try `' + guild_obj.key + 'help loot`');
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                content_reply.delete();
            }
            
            return;
        }
        var in_str = collected.first().content.toString().toLowerCase().split(' ');
        if(in_str[0] == 'cancel'){
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                content_reply.delete();
                collected.first().delete();
            }
            message.channel.send("Command canceled.");
            return;
        }
        if(in_str.length != equip_file.Stat_Ranges.length){
            console.log('lengths dont match')
            switch(guild_obj.language){
                case 'english':
                    message.channel.send('Unable to determine `' + in_str + '`. Try `' + guild_obj.key + 'help loot`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                loot_reply.delete();
            }
            
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
                if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                    content_reply.delete();
                }
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
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            content_reply.delete();
            collected.first().delete();
        }
        pos++;
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
    var Exp = 0;
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
    
    Exp = box_file.Exp * count;

    //build embed reply for log file
    console.log(log_file);
    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
    var equip_dir = JSON.parse(fs.readFileSync('./Equipment_Data/equipment.json', 'utf8'));
    const Box_Embed = new Discord.MessageEmbed()
        .setAuthor('Box Report', key.image, key.website)
        .setTitle('**' + box_file.Title + ' (x' + count + ')**')
        .setColor(guild_obj.color)
        .addField('**Reported by**', message.author);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Box_Embed.setColor(channel_obj.color);
        }
    }
    if(box_file.Image != null){
        Box_Embed.setThumbnail(box_file.Image);
    }
    if(count == 1){
        Box_Embed.setTitle('**' + box_file.Title + '**');
    }
    var Footer_img = null;
    var server_JSON = JSON.parse(fs.readFileSync("./menus/servers.json", "utf8"));
    server_JSON.Server_Objects.forEach(Element => {
        if(Element.Server == server){
            Footer_img = Element.Footer;
        }
    })
    Box_Embed.setFooter(server.toLowerCase() + " server", Footer_img);
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
                Exp = Exp + equip_file.Exp * parseInt(Element.split("-")[0]);
            }else{
                Exp = Exp + equip_file.Exp;
            }
        }
    })
    Box_Embed.addField("**Experience Rewarded**", Exp + " Exp");
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
    Box_Score(message, guild_obj.id, user, box_file.bID, loot_Arr, count)
}

function Box_Score(message, gID, uID, bID, contents_Arr, count){
    var box_file = JSON.parse(fs.readFileSync("./Box_Data/" + bID + ".json", "utf8"));
    var guild_file = JSON.parse(fs.readFileSync("./Guild_Data/" + gID + ".json", "utf8"));
    var user_json = JSON.parse(fs.readFileSync("./User_Data/" + uID + ".json", "utf8"));
    var pos = parseInt(bID.slice(1), 10) - 1;
    var Exp = 0;
    Exp = count * box_file.Exp;
    contents_Arr.forEach(Element => {
        if(Element.split("-")[1].startsWith("e")){
            var eID = Element.split("-")[1].split(" ")[0];
            var equip_file = JSON.parse(fs.readFileSync("./Equipment_Data/" + eID + ".json", "utf8"));
            Exp = parseInt(Element.split("-")[0], 10) * equip_file.Exp;
        }
    })
    user_json.Box_Data[pos] = user_json.Box_Data[pos] + count;
    fs.writeFileSync("./User_Data/" + uID + ".json", JSON.stringify(user_json, null, 4), "utf8");
    // TO DO -- Congrats messages for reporting box milestones
    var loop = user_json.Box_Data[pos] - count;
    var first = false;
    var milestone = null;
    while(loop < (user_json.Box_Data[pos] + 1)){
        if(loop == 1){
            first = true;
        }else if(loop < 101 && loop/10 == Math.floor(loop/10)){
            milestone = loop;
        }else if(loop > 100 && loop < 1001 && loop/100 == Math.floor(loop/100)){
            milestone = loop;
        }else if(loop > 1000 && loop/1000 == Math.floor(loop/1000)){
            milestone = loop;
        }
        loop++;
    }
    var box_title = null;
    if(box_file.Emoji != null){
        box_title = box_file.Emoji + " " + box_file.Title;
    }else{
        box_title = box_file.Title;
    }
    var response = [];
    if(first == true){
        switch(guild_file.language){
            case "english":
                response[0] = "Congratulations **" + user_json.User_Object.name + "** on reporting your first " + box_title + "!!!";
        }
    }
    if(milestone != null){
        switch(guild_file.language){
            case "english":
                response[response.length] = "Congratulations **" + user_json.User_Object.name + "** on reporting your " + milestone + "th " + box_title + "!!!";
        }
    }
    if(response.length > 0 && guild_file.Box_Score_messages == true){
        var channel = null;
        guild_file.Channel_Objects.forEach(Element => {
            if(Element.Type == "home"){
                channel = client.channels.cache.get(Element.discord);
            }
        })
        if(channel == null){
            channel = message.channel;
        }
        channel.send(response.join("\n"));
    }
    Exp_Update(message, gID, uID, Exp);
}

function Print_Wiki_Monster(message, guild_obj, mID){
    //a monster has been selected from wiki. Fetch data from file and build a reply
    /*
        Right now English is the only option
        Other languages may be added later but that will be a massive effort. Finish the main features in english first

        Think about adding custom emojis to make the card look nicer
    */
    if(mID.length != 4 || mID.startsWith('m') == false || parseInt(mID.slice(1), 10) < 1 || parseInt(mID.slice(1), 10) > 272){
        message.channel.send('Invalid file ID. Current file range m001 - m272');
        return;
    }
    
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
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Wiki_Embed.setColor(channel_obj.color);
        }
    }
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
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    if(in_Arr.length == 0){

    }else if(in_Arr.length == 1){
        if(in_Arr[0] == 'boss'){

        }else if(in_Arr[0] == 'box' || in_Arr[0] == 'treasure'){

        }
    }else{
        if(in_Arr[0] == 'boss'){
            var boss_dir = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
            var select = null;
            boss_dir.Boss_Select.forEach(Element => {
                if(Element.Shortcuts.includes(in_Arr[1]) == true){
                    select = Element;
                }
            })
            if(select == null){
                switch(guild_obj.language){
                    case 'english': 
                        message.channel.send('Unable to determine `' + in_Arr[1] + '`. Try `' + guild_obj.key + 'help stat boss`');
                        break;
                }
                return;
            }
            Stat_Data_Select_Boss(message, guild_obj, select, in_Arr, []);
        }else if(in_Arr[0] == 'box' || in_Arr[0] == 'treasure'){
            var box_dir = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
            var select = null;
            box_dir.Box_Objects.forEach(Element => {
                if(Element.Shortcuts.includes(in_Arr[1])){
                    select = Element;
                }
            })
            if(select == null){
                switch(guild_obj.language){
                    case 'english': 
                        message.channel.send('Unable to determine `' + in_Arr[1] + '`. Try `' + guild_obj.key + 'help stat box`');
                        break;
                }
                return;
            }
            Stat_Data_Select_Box(message, guild_obj, select, in_Arr, []);
        }
    }
}

async function Stat_Data_Select_Boss(message, guild_obj, select, in_Arr, filters){
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var boss_obj = JSON.parse(fs.readFileSync("./Monster_Data/" + select.mID + ".json", "utf8"));
    var guild_logs = [];
    var guild_objs = null;
    guilds.Guild_Objects.forEach(Element => {
        guild_objs = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
        if(guild_objs.private_data == false && Element.id != guild_obj.id){
            guild_logs[guild_logs.length] = guild_objs;
        }
    })
    var user_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var user_pointer = null;
    user_dir.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id || Element.alt.includes(message.author.id)){
            user_pointer = Element;
        }
    })
    var display_mode = null;
    if(user_pointer != null){
        var user_profile = JSON.parse(fs.readFileSync("./User_Data/" + user_pointer.id + ".json", "utf8"));
        if(user_profile.User_Object.mobile == false){
            display_mode = "desktop";
        }else{
            display_mode = "mobile";
        }
    }else{
        display_mode = "mobile";
    }
    in_Arr.forEach(Element => {
        if(Element == "desktop" || Element == "computer" || Element == "comp"){
            display_mode = "desktop";
        }
    })
    var history_log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + '/log.json', "utf8"));
    var home_log = JSON.parse(fs.readFileSync("./stats/" + guild_obj.id + "/Monster_Data/" + select.mID + ".json", "utf8")).History_Arr;
    history_log.Event_Arr.forEach(Element => {
        if(Element.log_type == "R"){
            if(Element.mID == select.mID && Element.users.length > 0){
                home_log[home_log.length] = Element;
            }
        }
    })
    var loop = 0;
    while(loop < guild_logs.length){
        guild_logs[loop] = {
            Guild_Object: guild_logs[loop],
            log: JSON.parse(fs.readFileSync("./stats/" + guild_logs[loop].id + "/Monster_Data/" + select.mID + ".json", "utf8")).History_Arr
        }
        loop++;
    }
    var trimmed_guild_logs = [];
    guild_logs.forEach(Element => {
        if(Element.log.length > 0){
            trimmed_guild_logs[trimmed_guild_logs.length] = Element;
        }
    })
    var body = [];
    loop = 1;
    var selected_object_Array = [];
    if(home_log.length > 0){
        selected_object_Array[0] = {
            Guild_Object: guild_obj,
            log: home_log,
            count: home_log.length
        }
    }
    //sort through data from foreign guilds. Determine which guilds have the most relevant data for the user and rank them
    //only display the top 9/10 guilds (10 if the home guild has no data, 9 if the home guild has data)
    //first count how many data points each guild has. Guilds with no data have already been filtered out
    trimmed_guild_logs.forEach(Element => {
        Element.log.forEach(Element => {
            //counting = counting + Element.loot.length;
        })
        Element.count = Element.log.length;
        Element.selected = false;
    })
    var check_greatest = 0;
    var check_pos = null;
    var inloop = 0;
    loop = 0;
    while(loop < trimmed_guild_logs.length && selected_object_Array.length < 11){
        inloop = 0;
        check_greatest = 0;
        check_pos = null;
        while(inloop < trimmed_guild_logs.length){
            if(trimmed_guild_logs[inloop].count > check_greatest && trimmed_guild_logs[inloop].selected == false){
                check_greatest = trimmed_guild_logs[inloop].count
                check_pos = inloop;
                trimmed_guild_logs[inloop].selected = true;
            }
            inloop++;
        }
        if(check_pos != null){
            selected_object_Array[selected_object_Array.length] = trimmed_guild_logs[check_pos];
        }else{
            loop = trimmed_guild_logs.length;
        }
        
    }
    selected_object_Array.forEach(Element => {
        if(Element.Guild_Object.emoji != null){
            body[body.length] = (body.length + 1).toString() + ". " + Element.Guild_Object.emoji + " " + Element.Guild_Object.Guild_Name;
        }else{
            body[body.length] = (body.length + 1).toString() + ". " + Element.Guild_Object.Guild_Name;
        }
    })
    var Data_Select_Embed = new Discord.MessageEmbed()
        .setAuthor('Select Data Set', key.image, key.website)
        .setColor(guild_obj.color);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Data_Select_Embed.setColor(channel_obj.color);
        }
    }
    if(select.Emoji != null){
        Data_Select_Embed.setTitle("**" + select.Emoji + " " + select.Title + " Data Sets**")
    }else{
        Data_Select_Embed.setTitle("**" + select.Title + " Data Sets**");
    }
    var count_Arr_disp = [];
    selected_object_Array.forEach(Element => {
        count_Arr_disp[count_Arr_disp.length] = Element.count;
    })
    console.log(body);
    if(select.Image != null){
        Data_Select_Embed.setThumbnail(select.Image);
    }
    if(body.length > 0){
        if(display_mode == "mobile"){
            var body_mobile = [];
            loop = 0;
            while(loop < body.length){
                body_mobile[loop] = body[loop] + " - Size: " + count_Arr_disp[loop];
                loop++;
            }
            Data_Select_Embed.addField("**Guild Data Sets**", body_mobile.join("\n"));
        }else if(display_mode == "desktop"){
            Data_Select_Embed.addFields(
                {name: "**Guild Data Sets**", value: body.join("\n"), inline: true},
                {name: "**Data Set Size**", value: count_Arr_disp.join("\n"), inline: true}
            )
        }
        Data_Select_Embed.setFooter("Respond with the number corresponding to the data set you'd like to view. To combine multiple data sets, respond with multiple numbers corresponding to the data sets");
    }else{
        Data_Select_Embed.setDescription("No Data Found.");
        message.channel.send(Data_Select_Embed);
        return;
    }
    var Data_Set_Reply = await message.channel.send(Data_Select_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out, try `" + guild_obj.key + 'help stat box`');
                    break;
            }if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Data_Set_Reply.delete();
            }
            
            return;
        }
        var select_Arr = collected.first().content.toString().toLowerCase().split(' ');
        loop = 0;
        while(loop < select_Arr.length){
            select_Arr[loop] = parseInt(select_Arr[loop], 10);
            if(isNaN(select_Arr[loop]) == true || select_Arr[loop] < 1 || select_Arr[loop] > 10){
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send("Unable to determine `" + select_Arr.join(" ") + "`. Try `" + guild_obj.key + 'help stat box`');
                        break;
                }
                return;
            }
            loop++;
        }
        var selection_positions = [];
        select_Arr.forEach(Element => {
            if(selection_positions.includes(Element) == false){
                selection_positions[selection_positions.length] = Element;
            }
        })
        var data_set_Out = {
            Event_Array: []
        };
        selection_positions.forEach(Element => {
            loop = 0;
            filters[filters.length] = selected_object_Array[Element - 1].Guild_Object.id;
            while(loop < selected_object_Array[Element - 1].log.length){
                data_set_Out.Event_Array[data_set_Out.Event_Array.length] = selected_object_Array[Element - 1].log[loop];
                loop++;
            }
        })
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            collected.first().delete();
            Data_Set_Reply.delete();  
        }
        
        Print_Boss_Stats(message, guild_obj, boss_obj, data_set_Out, filters, display_mode);
    })
}

async function Stat_Data_Select_Box(message, guild_obj, select, in_Arr, filters){
    var guilds = JSON.parse(fs.readFileSync("./Guild_Data/guilds.json", "utf8"));
    var box_obj = JSON.parse(fs.readFileSync("./Box_Data/" + select.bID + ".json", "utf8"));
    var guild_logs = [];
    var guild_objs = null;
    guilds.Guild_Objects.forEach(Element => {
        guild_objs = JSON.parse(fs.readFileSync("./Guild_Data/" + Element.id + ".json", "utf8"));
        if(guild_objs.private_data == false && guild_objs.id != guild_obj.id){
            guild_logs[guild_logs.length] = guild_objs;
        }
    })
    var user_dir = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var user_pointer = null;
    user_dir.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id || Element.alt.includes(message.author.id)){
            user_pointer = Element;
        }
    })
    var display_mode = null;
    if(user_pointer != null){
        var user_profile = JSON.parse(fs.readFileSync("./User_Data/" + user_pointer.id + ".json", "utf8"));
        if(user_profile.User_Object.mobile == false){
            display_mode = "desktop";
        }else{
            display_mode = "mobile";
        }
    }else{
        display_mode = "mobile";
    }
    var history_log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + '/log.json', "utf8"));
    var home_log = JSON.parse(fs.readFileSync("./stats/" + guild_obj.id + "/Box_Data/" + select.bID + ".json", "utf8")).History_Arr;
    history_log.Event_Arr.forEach(Element => {
        if(Element.log_type == "B"){
            if(Element.bID == select.bID){
                home_log[home_log.length] = Element;
            }
        }
    })
    var loop = 0;
    while(loop < guild_logs.length){
        guild_logs[loop] = {
            Guild_Object: guild_logs[loop],
            log: JSON.parse(fs.readFileSync("./stats/" + guild_logs[loop].id + "/Box_Data/" + select.bID + ".json", "utf8")).History_Arr
        }
        loop++;
    }
    var trimmed_guild_logs = [];
    guild_logs.forEach(Element => {
        if(Element.log.length > 0){
            trimmed_guild_logs[trimmed_guild_logs.length] = Element;
        }
    })
    var body = [];
    loop = 1;
    var counting = 0;
    var selected_object_Array = [];
    if(home_log.length > 0){
        home_log.forEach(Element => {
            Element.contents.forEach(Element => {
                counting = counting + parseInt(Element.split("-")[0], 10);
            })
        })
        selected_object_Array[0] = {
            Guild_Object: guild_obj,
            log: home_log,
            count: counting
        }
    }
    //sort through data from foreign guilds. Determine which guilds have the most relevant data for the user and rank them
    //only display the top 9/10 guilds (10 if the home guild has no data, 9 if the home guild has data)
    //first count how many data points each guild has. Guilds with no data have already been filtered out
    trimmed_guild_logs.forEach(Element => {
        counting = 0;
        Element.log.forEach(Element => {
            Element.contents.forEach(Element => {
                counting = counting + parseInt(Element.split("-")[0], 10);
            })
        })
        Element.count = counting;
        Element.selected = false;
    })
    var check_greatest = 0;
    var check_pos = null;
    var inloop = 0;
    loop = 0;
    while(loop < trimmed_guild_logs.length && selected_object_Array.length < 11){
        inloop = 0;
        check_greatest = 0;
        check_pos = null;
        while(inloop < trimmed_guild_logs.length){
            if(trimmed_guild_logs[inloop].count > check_greatest && trimmed_guild_logs[inloop].selected == false){
                check_greatest = trimmed_guild_logs[inloop].count
                check_pos = inloop;
                trimmed_guild_logs[inloop].selected = true;
            }
            inloop++;
        }
        if(check_pos != null){
            selected_object_Array[selected_object_Array.length] = trimmed_guild_logs[check_pos];
        }else{
            loop = trimmed_guild_logs.length;
        }
        
    }
    selected_object_Array.forEach(Element => {
        if(Element.Guild_Object.emoji != null){
            body[body.length] = (body.length + 1).toString() + ". " + Element.Guild_Object.emoji + " " + Element.Guild_Object.Guild_Name;
        }else{
            body[body.length] = (body.length + 1).toString() + ". " + Element.Guild_Object.Guild_Name;
        }
    })
    var Data_Select_Embed = new Discord.MessageEmbed()
        .setAuthor('Select Data Set', key.image, key.website)
        .setColor(guild_obj.color)
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Data_Select_Embed.setColor(channel_obj.color);
        }
    }
    if(select.Emoji != null){
        Data_Select_Embed.setTitle("**" + select.Emoji + " " + select.Title + " Data Sets**")
    }else{
        Data_Select_Embed.setTitle("**" + select.Title + " Data Sets**");
    }
    var count_Arr_disp = [];
    selected_object_Array.forEach(Element => {
        count_Arr_disp[count_Arr_disp.length] = Element.count;
    })
    console.log(body);
    if(select.Image != null){
        Data_Select_Embed.setThumbnail(select.Image);
    }
    if(body.length > 0){
        if(display_mode == "mobile"){
            var body_mobile = [];
            loop = 0;
            while(loop < body.length){
                body_mobile[loop] = body[loop] + " - Size: " + count_Arr_disp[loop];
                loop++;
            }
            Data_Select_Embed.addField("**Guild Data Sets**", body_mobile.join("\n"));
        }else if(display_mode == "desktop"){
            Data_Select_Embed.addFields(
                {name: "**Guild Data Sets**", value: body.join("\n"), inline: true},
                {name: "**Data Set Size**", value: count_Arr_disp.join("\n"), inline: true}
            )
        }
        Data_Select_Embed.setFooter("Respond with the number corresponding to the data set you'd like to view. To combine multiple data sets, respond with multiple numbers corresponding to the data sets");
    }else{
        Data_Select_Embed.setDescription("No Data Found.");
        message.channel.send(Data_Select_Embed);
        return;
    }
    var Data_Set_Reply = await message.channel.send(Data_Select_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on("end", collected => {
        if(collected.size == 0){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Operation timed out, try `" + guild_obj.key + 'help stat box`');
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Data_Set_Reply.delete();
            }
            
            return;
        }
        var select_Arr = collected.first().content.toString().toLowerCase().split(' ');
        if(select_Arr.length == 1 && select_Arr[0] == "cancel"){
            switch(guild_obj.language){
                case 'english':
                    message.channel.send("Command canceled");
                    break;
            }
            if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
                Data_Set_Reply.delete();
                collected.first().delete();
            }
            return;
        }
        loop = 0;
        while(loop < select_Arr.length){
            select_Arr[loop] = parseInt(select_Arr[loop], 10);
            if(isNaN(select_Arr[loop]) == true || select_Arr[loop] < 1 || select_Arr[loop] > 10){
                switch(guild_obj.language){
                    case 'english':
                        message.channel.send("Unable to determine `" + select_Arr.join(" ") + "`. Try `" + guild_obj.key + 'help stat box`');
                        break;
                }
                return;
            }
            loop++;
        }
        var selection_positions = [];
        select_Arr.forEach(Element => {
            if(selection_positions.includes(Element) == false){
                selection_positions[selection_positions.length] = Element;
            }
        })
        var data_set_Out = {
            Event_Array: []
        };
        selection_positions.forEach(Element => {
            loop = 0;
            filters[filters.length] = selected_object_Array[Element - 1].Guild_Object.id;
            while(loop < selected_object_Array[Element - 1].log.length){
                data_set_Out.Event_Array[data_set_Out.Event_Array.length] = selected_object_Array[Element - 1].log[loop];
                loop++;
            }
        })
        if(message.guild.members.cache.get(client.user.id).hasPermission("MANAGE_MESSAGES")){
            collected.first().delete();
            Data_Set_Reply.delete();
        }
        Print_Box_Stats(message, guild_obj, box_obj, data_set_Out, filters, display_mode);
    })
}

function Print_Boss_Stats(message, guild_obj, boss_obj, data_Arr, filters, display_mode){
    //data has been selected. Now calculate statics from data set
    //create a message embed and send reply containing calculated statistics
    console.log(data_Arr);
    console.log(boss_obj);
    var id_Arr = [];
    var amounts = [];
    id_Arr[0] = "Gold";
    amounts[0] = 0;
    var loop = 0;
    var gold_total = 0;
    boss_obj.Loot_Table.forEach(Element => {
        if(Element.split(" ").length == 1){
            id_Arr[id_Arr.length] = Element;
            amounts[amounts.length] = 0;
        }else{
            loop = parseInt(Element.split(" (")[1].split("-")[0], 10);
            while(loop < (parseInt(Element.split(" (")[1].split("-")[1].split(")")[0], 10) + 1)){
                id_Arr[id_Arr.length] = Element.split(" ")[0] + " (" + loop + ")";
                amounts[amounts.length] = 0;
                loop++;
            }
        }
    })
    var gold_Arr = [];
    var gold_amounts = [];
    data_Arr.Event_Array.forEach(Element => {
        Element.loot.forEach(Element => {
            if(Element.startsWith("Gold")){
                amounts[0]++;
                if(Element.split(" ").length == 2){
                    gold_total++;
                    if(gold_Arr.includes(parseInt(Element.split(" (")[1].split(")")[0], 10)) == true){
                        loop = 0;
                        while(loop < gold_Arr.length){
                            if(gold_Arr[loop] == parseInt(Element.split(" (")[1].split(")")[0], 10)){
                                gold_amounts[loop]++;
                                loop = gold_Arr.length;
                            }
                            loop++;
                        }
                    }else{
                        gold_Arr[gold_Arr.length] = parseInt(Element.split(" (")[1].split(")")[0], 10);
                        gold_amounts[gold_amounts.length] = 1;
                    }
                }
            }else if(Element.split(" ").length > 1 && Element.startsWith("e")){
                loop = 0;
                while(loop < id_Arr.length){
                    if(id_Arr[loop] == Element.split(" ")[0]){
                        amounts[loop]++;
                        loop = id_Arr.length;
                    }
                    loop++;
                }
            }else{
                loop = 0;
                while(loop < id_Arr.length){
                    if(id_Arr[loop] == Element){
                        amounts[loop]++;
                        loop = id_Arr.length;
                    }
                    loop++;
                }
            }
        })
    })
    if(boss_obj.id == "m038"){//boatswain branka
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i381 (3)"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m016"){//turtle zzz
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i267"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m121"){//jack in the box
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i403"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m122"){//ghost witch
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i403"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m123"){//captain twin
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i403"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m124"){//evil spirit
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i404"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m125"){//walking dead
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i404"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m126"){//mutanthydra
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i404"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m127"){//morphling
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i405"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m128"){//mystery
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i405"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m129"){//maltarguardian
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i405"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m132"){//whitewadangka
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i406"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m133"){//reason scream
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i407"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m134"){//gluttony
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i407"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m135"){//themama
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i407"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m136"){//deep darkness
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i351"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m137"){//burning darkness
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i351"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m138"){//sorrowful darkness
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i351"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m139"){//harsh darkness
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i351"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m140"){//endless darkness
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i351"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }else if(boss_obj.id == "m080"){//Elemental Queen
        loop = 0;
        while(loop < id_Arr.length){
            if(id_Arr[loop] == "i395"){
                amounts[loop] = data_Arr.Event_Array.length;
                loop = id_Arr.length;
            }
            loop++;
        }
    }
    var swap = null;
    var inloop = null;
    var trimmed_id_Arr = [];
    var trimmed_amounts = [];
    loop = 0;
    while(loop < id_Arr.length){
        if(amounts[loop] > 0){
            trimmed_id_Arr[trimmed_id_Arr.length] = id_Arr[loop];
            trimmed_amounts[trimmed_amounts.length] = amounts[loop];
        }
        loop++;
    }
    var body_disp = [];
    var drop_rates = [];
    loop = 0;
    while(loop < trimmed_id_Arr.length){
        inloop = 1;
        while(inloop < trimmed_id_Arr.length){
            if(trimmed_amounts[inloop] > trimmed_amounts[inloop - 1]){
                swap = trimmed_amounts[inloop];
                trimmed_amounts[inloop] = trimmed_amounts[inloop - 1];
                trimmed_amounts[inloop - 1] = swap;
                swap = trimmed_id_Arr[inloop];
                trimmed_id_Arr[inloop] = trimmed_id_Arr[inloop - 1];
                trimmed_id_Arr[inloop - 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    loop = 0;
    while(loop < trimmed_amounts.length){
        drop_rates[loop] = ((trimmed_amounts[loop] / data_Arr.Event_Array.length) * 100);
        if(drop_rates[loop] == 10 || drop_rates[loop] > 10){
            drop_rates[loop] = drop_rates[loop].toString();
            if(drop_rates[loop].length > 6){
                drop_rates[loop] = drop_rates[loop].slice(0, -1 * (drop_rates[loop].length - 6));
            }
        }else{
            drop_rates[loop] = drop_rates[loop].toString();
            if(drop_rates[loop].length > 5){
                drop_rates[loop] = drop_rates[loop].slice(0, -1 * (drop_rates[loop].length - 5));
            }
        }
        drop_rates[loop] = parseFloat(drop_rates[loop], 10);
        loop++;
    }
    
    var file = null;
    var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    trimmed_id_Arr.forEach(Element => {
        if(Element == "Gold"){
            body_disp[body_disp.length] = "<:Gold:834876053029126144> Gold";
        }else if(Element.startsWith('e')){
            file = JSON.parse(fs.readFileSync("./Equipment_Data/" + Element + ".json", "utf8"));
            if(file.Emoji != null){
                body_disp[body_disp.length] = file.Emoji + " " + file.Title;
            }else{
                body_disp[body_disp.length] = file.Title;
            }
        }else if(Element.split(" ").length == 2){
            file = item_dir.Item_Objects[parseInt(Element.split(" ")[0].slice(1), 10) - 1];
            if(file.Emoji != null){
                body_disp[body_disp.length] = file.Emoji + " " + file.Title + " " + Element.split(" ")[1];
            }else{
                body_disp[body_disp.length] = file.Title + " " + Element.split(" ")[1];
            }
        }else{
            file = item_dir.Item_Objects[parseInt(Element.slice(1), 10) - 1];
            if(file.Emoji != null){
                body_disp[body_disp.length] = file.Emoji + " " + file.Title;
            }else{
                body_disp[body_disp.length] = file.Title;
            }
        }
    })
    
    var Stat_Embed = new Discord.MessageEmbed()
        .setAuthor("Boss Statistics", key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription("Sample Size: " + data_Arr.Event_Array.length);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Stat_Embed.setColor(channel_obj.color);
        }
    }
    if(filters.length == 1){
        Stat_Embed.setFooter("Data Set: " + filters[0]);
    }else{
        Stat_Embed.setFooter("Data Sets: " + filters.join(" "));
    }
    if(boss_obj.Emoji != null){
        Stat_Embed.setTitle("**" + boss_obj.Emoji + " " + boss_obj.Boss + "**");
    }else{
        Stat_Embed.setTitle("**" + boss_obj.Boss + "**");
    }
    if(boss_obj.Image != null){
        Stat_Embed.setThumbnail(boss_obj.Image);
    }
    if(body_disp.length > 0){
        if(display_mode == "mobile"){
            var loop = 0;
            var body = [];
            while(loop < body_disp.length){
                body[body.length] = drop_rates[loop] + "% - " + body_disp[loop];
                loop++;
            }
            Stat_Embed.addField("**Loot Drop Rates**", body.join("\n"));
        }else if(display_mode == "desktop"){
            Stat_Embed.addFields(
                {name: "Loot", value: body_disp.join("\n"), inline: true},
                {name: "Drop Rate", value: drop_rates.join("\n"), inline: true}
            )
        }
    }
    if(gold_Arr.length > 0){
        loop = 0;
        while(loop < gold_Arr.length){
            inloop = 1;
            while(inloop < gold_Arr.length){
                if(gold_Arr[inloop] > gold_Arr[inloop - 1]){
                    swap = gold_Arr[inloop];
                    gold_Arr[inloop] = gold_Arr[inloop - 1];
                    gold_Arr[inloop - 1] = swap;
                    swap = gold_amounts[inloop];
                    gold_amounts[inloop] = gold_amounts[inloop - 1];
                    gold_amounts[inloop - 1] = swap;
                }
                inloop++;
            }
            loop++;
        }
        console.log(gold_Arr);
        console.log(gold_amounts);
        console.log(gold_total);
        var avg = 0;
        var median = null;
        var maximum = gold_Arr[0];
        var minimum = gold_Arr[gold_Arr.length - 1];
        loop = 0;
        inloop = 0;//this inloop is acting as a determination of the median
        while(loop < gold_Arr.length){
            avg = avg + (gold_Arr[loop] * gold_amounts[loop]);
            inloop = inloop + gold_amounts[loop];
            if((gold_total/2) < inloop && median == null){
                console.log('set median');
                median = gold_Arr[loop];
            }
            loop++;
        }
        avg = avg/gold_total;
        if(avg == 10 || avg > 10){
            avg = avg.toString();
            if(avg.length > 6){
                avg = avg.slice(0, -1 * (avg.length - 6));
            }
        }else{
            avg = avg.toString();
            if(avg.length > 5){
                avg = avg.slice(0, -1 * (avg.length - 5));
            }
        }
        avg = parseFloat(avg, 10);
        Stat_Embed.addField("**<:Gold:834876053029126144> Gold Break-down**", "**Maximum:** " + maximum + "\n**Minimum:** " + minimum + "\n**Median:** " + median + "\n**Average:** " + avg);
    }

    message.channel.send(Stat_Embed);
}

function Print_Box_Stats(message, guild_obj, box_obj, data_Arr, filters, display_mode){
    //an array of data points has been gathered
    var item_dir = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    var equip_dir = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    console.log(box_obj);
    var Box_Stat_Embed = new Discord.MessageEmbed()
        .setAuthor("Treasure Statistics", key.image, key.website)
        .setColor(guild_obj.color);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Box_Stat_Embed.setColor(channel_obj.color);
        }
    }
    if(filters.length == 1){
        Box_Stat_Embed.setFooter("Data Set: " + filters);
    }else{
        Box_Stat_Embed.setFooter("Data Sets: " + filters.join(' '));
    }
        
    if(box_obj.Emoji != null){
        Box_Stat_Embed.setTitle("**" + box_obj.Emoji + " " + box_obj.Title + "**");
    }else{
        Box_Stat_Embed.setTitle("**" + box_obj.Title + "**");
    }
    if(box_obj.Image != null){
        Box_Stat_Embed.setThumbnail(box_obj.Image);
    }
    var is_varied = false;
    var loop = 0;
    var inloop = null;
    var main_body = [];
    var variable_bodies = [];
    var clear_min = null;
    box_obj.Loot_Table.forEach(Element => {
        is_varied = false;
        if(main_body.includes(Element.id.split(" ")[0]) == false){
            loop = 0;
            clear_min = 0;
            while(loop < box_obj.Loot_Table.length){
                if(box_obj.Loot_Table[loop].id != Element.id && box_obj.Loot_Table[loop].id.split(" ")[0] == Element.id.split(" ")[0] && main_body.includes(Element.id.split(" ")[0]) == false){
                    clear_min++;
                }
                loop++;
            }
            if(clear_min > 2){
                is_varied = true;
                variable_bodies[variable_bodies.length] = Element.id.split(" ")[0];
                main_body[main_body.length] = Element.id.split(" ")[0];
            }
            if(is_varied == false && Element.id.split(" ").length == 2){
                if(Element.id.split(" ")[1].split("-").length == 2){
                    if((parseInt(Element.id.split(" ")[1].split("-")[1].split(")")[0], 10) - parseInt(Element.id.split(" ")[1].split("-")[0].split("(")[1], 10)) > 2){
                        is_varied = true;
                        variable_bodies[variable_bodies.length] = Element.id.split(" ")[0];
                        main_body[main_body.length] = Element.id.split(" ")[0];
                    }else{
                        is_varied = true;
                        inloop = parseInt(Element.id.split(" ")[1].split("-")[0].split("(")[1], 10);
                        while(inloop < (parseInt(Element.id.split(" ")[1].split("-")[1].split(")")[0], 10) + 1)){
                            main_body[main_body.length] = Element.id.split(" ")[0] + " (" + inloop + ")";
                            inloop++;
                        }
                    }
                }
            }
            if(is_varied == false){
                main_body[main_body.length] = Element.id;
            }
        }
    })
    console.log(main_body);
    console.log(variable_bodies);
    if(main_body.length > 1){
        var data = [];
        main_body.forEach(Element => {
            data[data.length] = 0;
        })
        data_Arr.Event_Array.forEach(Element => {
            Element.contents.forEach(Element => {
                loop = 0;
                while(loop < main_body.length){
                    if(main_body[loop].split(" ").length == 1){
                        if(Element.split("-")[1] == main_body[loop] || Element.split("-")[1].split(" ")[0] == main_body[loop]){
                            data[loop] = data[loop] + parseInt(Element.split("-")[0], 10);
                            loop = main_body.length;
                        }
                    }else{            
                        if(Element.split("-")[1] == main_body[loop]){
                            data[loop] = data[loop] + parseInt(Element.split("-")[0], 10);
                            loop = main_body.length;
                        }
                    }
                    loop++;
                }
            })
        })
        var total = 0;
        data.forEach(Element => {
            total = total + Element;
        })
        var drop_rates = [];
        data.forEach(Element => {
            drop_rates[drop_rates.length] = (Element / total) * 100;
        })
        loop = 0;
        var swap = 0;
        while(loop < main_body.length){
            inloop = 0;
            while(inloop < main_body.length){
                if(drop_rates[inloop] > drop_rates[inloop - 1]){
                    swap = drop_rates[inloop];
                    drop_rates[inloop] = drop_rates[inloop - 1];
                    drop_rates[inloop - 1] = swap;
                    swap = main_body[inloop];
                    main_body[inloop] = main_body[inloop - 1];
                    main_body[inloop - 1] = swap;
                }
                inloop++;
            }
            loop++;
        }
        loop = 0;
        while(loop < drop_rates.length){
            if(drop_rates[loop] == 10 || drop_rates[loop] > 10){
                drop_rates[loop] = drop_rates[loop].toString();
                if(drop_rates[loop].length > 6){
                    drop_rates[loop] = drop_rates[loop].slice(0, -1 * (drop_rates[loop].length - 6));
                }
            }else{
                drop_rates[loop] = drop_rates[loop].toString();
                if(drop_rates[loop].length > 5){
                    drop_rates[loop] = drop_rates[loop].slice(0, -1 * (drop_rates[loop].length - 5));
                }
            }
            drop_rates[loop] = parseFloat(drop_rates[loop], 10);
            loop++;
        }
        while(drop_rates[drop_rates.length - 1] == 0){
            drop_rates = drop_rates.slice(0, -1);
            main_body = main_body.slice(0, -1);
        }
        var file = null;
        disp_main_body = [];
        main_body.forEach(Element => {
            if(Element.startsWith('i')){
                if(Element.split(" ").length == 1){
                    file = item_dir.Item_Objects[parseInt(Element.slice(1), 10) - 1];
                }else{
                    file = item_dir.Item_Objects[parseInt(Element.split(" ")[0].slice(1), 10) - 1];
                }
                if(file.Emoji != null){
                    disp_main_body[disp_main_body.length] = file.Emoji + " " + file.Title;
                }else{
                    disp_main_body[disp_main_body.length] = file.Title;
                }
                if(Element.split(" ").length == 2){
                    disp_main_body[disp_main_body.length - 1] = disp_main_body[disp_main_body.length - 1] + ' ' + Element.split(" ")[1];
                }
            }else if(Element.startsWith('e')){
                file = JSON.parse(fs.readFileSync("./Equipment_Data/" + Element + ".json", "utf8"));
                if(file.Emoji != null){
                    disp_main_body[disp_main_body.length] = file.Emoji + " " + file.Title;
                }else{
                    disp_main_body[disp_main_body.length] = file.Title;
                }
            }else if(Element.startsWith('Gold')){
                disp_main_body[disp_main_body.length] = "<:Gold:834876053029126144> " + Element;
            }
        })
        console.log(drop_rates)
        if(display_mode == "mobile"){
            var body = [];
            loop = 0;
            while(loop < disp_main_body.length){
                body[body.length] = drop_rates[loop] + "% - " + disp_main_body[loop];
                loop++;
            }
            Box_Stat_Embed.addField("**Content Rates**", body.join("\n"));
        }else if(display_mode == "desktop"){
            Box_Stat_Embed.addFields(
                {name: "**Contents**", value: disp_main_body.join('\n'), inline: true},
                {name: "**Rates**", value: drop_rates.join('\n'), inline: true}
            );
        }
        
        Box_Stat_Embed.setDescription("Sample Size: " + total);
    }
    variable_bodies.forEach(Element => {
        var amounts_raw = [];
        loop = 0;
        while(loop < box_obj.Loot_Table.length){
            if(box_obj.Loot_Table[loop].id.split(" ")[0] == Element){
                amounts_raw[amounts_raw.length] = box_obj.Loot_Table[loop].id.split(" (")[1].split(")")[0];
            }
            loop++;
        }
        var amounts = [];
        amounts_raw.forEach(Element => {
            if(Element.includes("-")){
                loop = parseInt(Element.split("-")[0], 10);
                while(loop < (parseInt(Element.split("-")[1], 10) + 1)){
                    amounts[amounts.length] = loop;
                    loop++;
                }
            }else{
                amounts[amounts.length] = parseInt(Element, 10);
            }
        })
        var data = [];
        var id_Arr = [];
        loop = 0;
        while(loop < amounts.length){
            data[data.length] = 0;
            id_Arr[id_Arr.length] = Element + " (" + amounts[loop] + ")";
            loop++;
        }
        data_Arr.Event_Array.forEach(Element => {
            Element.contents.forEach(Element => {
                loop = 0;
                while(loop < id_Arr.length){
                    if(Element.split("-")[1] == id_Arr[loop]){
                        data[loop] = data[loop] + parseInt(Element.split("-")[0], 10);
                        loop = id_Arr.length;
                    }
                    loop++;
                }
            })
        })
        var trimmed_id_Arr = [];
        var trimmed_data = [];
        loop = 0;
        while(loop < id_Arr.length){
            if(data[loop] > 0){
                trimmed_id_Arr[trimmed_id_Arr.length] = id_Arr[loop];
                trimmed_data[trimmed_data.length] = data[loop];
            }
            loop++;
        }
        if(trimmed_id_Arr.length > 10){
            if(Element.startsWith('i')){
                var file = item_dir.Item_Objects[parseInt(Element.slice(1), 10) - 1];
            }else{
                var file = {
                    iID: "Gold",
                    Title: "Gold",
                    Emoji: "<:Gold:834876053029126144>"
                }
            }
            var total = 0;
            var minimum = null;
            var maximum = null;
            var avg = 0;
            var median = 0;
            loop = 0;
            while(loop < trimmed_id_Arr.length){
                total = total + trimmed_data[loop];
                avg = avg + (trimmed_data[loop] * parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10));
                if(trimmed_data[loop] > 0){
                    if(minimum == null){
                        minimum = parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10);
                        maximum = parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10);
                    }else{
                        if(parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10) > maximum){
                            maximum = parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10);
                        }
                        if(parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10) < minimum){
                            minimum = parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10);
                        }
                    }
                }
                loop++;
            }
            avg = (avg / total);
            var pos = 0;
            loop = 0;
            while(loop < trimmed_id_Arr.length && pos < (total/2)){
                if(trimmed_data[loop] > 0){
                    median = trimmed_id_Arr[loop].split(" (")[1].split(")")[0];
                    pos = pos + trimmed_data[loop];
                }
                loop++;
            }
            if(file.Emoji != null){
                Box_Stat_Embed.addFields(
                    {name: "** " + file.Emoji + " " + file.Title + " Break-down**", value: "**Maximum:** " + maximum + "\n**Minimum:** " + minimum + "\n**Median:** " + median + "\n**Average:** " + parseFloat(avg.toString().slice(0, -1 * (avg.toString().length - 6)), 10), inline: false}
                )
            }else{
                Box_Stat_Embed.addFields(
                    {name: "**" + file.Title + " Break-down**", value: "**Maximum:** " + maximum + "\n**Minimum:** " + minimum + "\n**Median:** " + median + "\n**Average:** " + parseFloat(avg.toString().slice(0, -1 * (avg.toString().length - 6)), 10), inline: false}
                )
            }
        }else if(trimmed_id_Arr.length > 0){  
            if(Element.startsWith('i')){
                var file = item_dir.Item_Objects[parseInt(Element.slice(1), 10) - 1];
            }else{
                var file = {
                    iID: "Gold",
                    Title: "Gold",
                    Emoji: "<:Gold:834876053029126144>"
                }
            }
            var total = 0;
            trimmed_data.forEach(Element => {
                total = total + Element;
            })
            var drop_rate = [];
            var avg = 0;
            trimmed_data.forEach(Element => {
                drop_rate[drop_rate.length] = (Element / total) * 100;
            })
            loop = 0;
            while(loop < drop_rate.length){
                avg = avg + (trimmed_data[loop] * parseInt(trimmed_id_Arr[loop].split(" (")[1].split(")")[0], 10));
                if(drop_rate[loop] == 10 || drop_rate[loop] > 10){
                    drop_rate[loop] = drop_rate[loop].toString();
                    if(drop_rate[loop].length > 6){
                        drop_rate[loop] = drop_rate[loop].slice(0, -1 * (drop_rate[loop].length - 6));
                    }
                }else{
                    drop_rate[loop] = drop_rate[loop].toString();
                    if(drop_rate[loop].length > 5){
                        drop_rate[loop] = drop_rate[loop].slice(0, -1 * (drop_rate[loop].length - 5));
                    }
                }
                drop_rate[loop] = parseFloat(drop_rate[loop], 10);
                loop++;
            }
            avg = avg / total;
            var disp_Arr = [];
            trimmed_id_Arr.forEach(Element => {
                disp_Arr[disp_Arr.length] = file.Title + " " + Element.split(" ")[1];
            })
            disp_Arr[disp_Arr.length] = "**Average**";
            if(avg == 10 || avg > 10){
                avg = avg.toString();
                if(avg.length > 6){
                    avg = avg.slice(0, -1 * (avg.length - 6));
                }
            }else{
                avg = avg.toString();
                if(avg.length > 5){
                    avg = avg.slice(0, -1 * (avg.length - 5));
                }
            }
            avg = parseFloat(avg, 10);
            drop_rate[drop_rate.length] = "**" + avg + "**";
            if(display_mode == "mobile"){
                var body = [];
                loop = 0;
                while(loop < disp_Arr.length - 1){
                    body[body.length] = drop_rate[loop] + "% - " + disp_Arr[loop];
                    loop++;
                }
                body[body.length] = "**Average: **" + drop_rate[drop_rate.length - 1].split("**")[1];
                if(file.Emoji != null){
                    Box_Stat_Embed.addField("**" + file.Emoji + " " + file.Title + " Break-down**", body.join("\n"));
                }else{
                    Box_Stat_Embed.addField("**" + file.Title + " Break-down**", body.join("\n"));
                }
            }else if(display_mode == "desktop"){
                if(file.Emoji != null){
                    Box_Stat_Embed.addFields(
                        {name: "\u200B", value: "\u200B"},
                        {name: "**" + file.Emoji + " " + file.Title + " Break-down**", value: disp_Arr.join('\n'), inline: true},
                        {name: "**Rates**", value: drop_rate.join("\n"), inline: true}
                    );
                }else{
                    Box_Stat_Embed.addFields(
                        {name: "\u200B", value: "\u200B"},
                        {name: "**" + file.Title + " Break-down**", value: disp_Arr.join('\n'), inline: true},
                        {name: "**Rates**", value: drop_rate.join("\n"), inline: true}
                    );
                }
            }
            
        }
    })
    //console.log(data_Arr.Event_Array);

    message.channel.send(Box_Stat_Embed);
}

function Score(message, guild_obj, in_Arr){
    //scores command, accept a variety of in_Arr inputs to view report counts
    //use User_Data to reference report counts
    //removing /scores/ folder as its redundant for storage
    var channel_obj = null;
    console.log(in_Arr);
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    var loop = 0;
    if(in_Arr.length == 0){
        //user entered no arguments, provide a general summary
        loop = 0;
        var user_id = null;
        while(loop < guild_obj.User_Objects.length){
            if(guild_obj.User_Objects[loop].discord == message.author.id){
                user_id = guild_obj.User_Objects[loop].id;
                loop = guild_obj.User_Objects.length;
            }
            loop++;
        }
        score_summary(message, guild_obj, channel_obj, user_id);
    }else if(in_Arr.length == 1){
        if(in_Arr[0].startsWith("<@") && in_Arr[0].startsWith("<@&") == false|| in_Arr[0].startsWith("<!@")){//another user is being tagged in the score command
            //get user discord
            var discord_id = null;
            if(in_Arr[0].startsWith("<@")){
                discord_id = in_Arr[0].slice(2, -1);
            }else{
                discord_id = in_Arr[0].slice(3, -1);
            }
            console.log(discord_id);
            loop = 0;
            var user_id = null;
            while(loop < guild_obj.User_Objects.length){
                if(guild_obj.User_Objects[loop].discord == discord_id){
                    user_id = guild_obj.User_Objects[loop].id;
                    loop = guild_obj.User_Objects.length;
                }
                loop++;
            }
            score_summary(message, guild_obj, channel_obj, user_id);
        }else if(in_Arr[0].startsWith('u') && isNaN(in_Arr[0].slice(1)) == false){//another user is being tagged using raven's uID
            var user_num = parseInt(in_Arr[0].slice(1), 10);
            var user_id = null;
            if(user_num < 10 && user_num > 0){
                user_id = "u00" + user_num.toString();
            }else if(user_num > 9 && user_num < 100){
                user_id = "u0" + user_num.toString();
            }else if(user_num > 99){
                user_id = "u" + user_num.toString();
            }else{
                message.channel.send('Unable to locate user ID `' + in_Arr[0] + "`");
                return;
            }
            //check to see if the user ID is valid
            var users = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
            if(user_num > users.Total_Members){
                message.channel.send("User ID `" + user_id + "` does not exist");
                return;
            }
            var user_file = JSON.parse(fs.readFileSync("./User_Data/" + user_id + ".json", "utf8"));
            console.log(user_file);
            if(user_file.User_Object.private == false){
                score_summary(message, guild_obj, channel_obj, user_file.User_Object.id);
            }else{
                if(user_file.User_Object.guilds.includes(guild_obj.id)){
                    score_summary(message, guild_obj, channel_obj, user_file.User_Object.id);
                }else{
                    message.channel.send("User ID `" + user_id + "` profile is set to private");
                }
            }
        }
    }else if(in_Arr[0] == "boss"){
        console.log("score boss input ~ " + in_Arr[1]);
        var boss_json = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
        var map_json = JSON.parse(fs.readFileSync("./menus/maps.json", "utf8"));
        var select = null;
        var loop = 0;
        while(loop < boss_json.Boss_Select.length){
            if(boss_json.Boss_Select[loop].Shortcuts.includes(in_Arr[1])){
                select = boss_json.Boss_Select[loop].mID;
                loop = boss_json.Boss_Select.length;
            }
            loop++;
        }
        loop = 0;
        while(loop < map_json.Map_Objects.length && select == null){
            if(map_json.Map_Objects[loop].Shortcuts.includes(in_Arr[1])){
                select = map_json.Map_Objects[loop].pID;
            }
            loop++;
        }
        console.log("determine select ~ " + select);
        if(select == null){
            message.channel.send("Unable to determine `" + in_Arr[1] + "` try `" + guild_obj.key + "help score`");
            return;
        }else if(in_Arr.length == 2 && select.startsWith("m")){
            loop = 0;
            var user_id = null;
            var discord_id = message.author.id;
            while(loop < guild_obj.User_Objects.length){
                if(guild_obj.User_Objects[loop].discord == discord_id){
                    user_id = guild_obj.User_Objects[loop].id;
                    loop = guild_obj.User_Objects.length;
                }
                loop++;
            }
            boss_score_summary(message, guild_obj, channel_obj, user_id, select)
        }else if(in_Arr.length == 2 && select.startsWith("p")){
            loop = 0;
            var user_id = null;
            var discord_id = message.author.id;
            while(loop < guild_obj.User_Objects.length){
                if(guild_obj.User_Objects[loop].discord == discord_id){
                    user_id = guild_obj.User_Objects[loop].id;
                    loop = guild_obj.User_Objects.length;
                }
                loop++;
            }
            //map_score_summary(message, guild_obj, channel_obj, user_id, select);
        }else{
            //there are additional inputs
            //additional filters, possibly tagged user
            message.channel.send("This part of `$score boss` is still under construction...")
        }
    }else if(in_Arr[0] == "boss" && in_Arr.length == 1){
        message.channel.send("Not enough arguments. Try `" + guild_obj.key + "help score boss`");
        return;
    }
    //message.channel.send(Score_Embed);
}

function score_summary(message, guild_obj, channel_obj, uID){
    //user entered no arguments, provide a general summary
    var Score_Embed = new Discord.MessageEmbed()
        .setAuthor("Score Summary", key.image, key.website)
        .setColor(guild_obj.color);
    if(channel_obj.color != null){
        Score_Embed.setColor(channel_obj.color);
    }
    var loop = 0;
    var inloop = null;
    var user_file = null;
    user_file = JSON.parse(fs.readFileSync("./User_Data/" + uID + ".json", "utf8"));
    var swap = null;
    Score_Embed.setFooter("User ID: " + user_file.User_Object.id);
    Score_Embed.setTitle(user_file.User_Object.Emoji + " **" + user_file.User_Object.name + "** Scoreboard");
    console.log("Build Score Sheet for " + user_file.User_Object.id);
    var boss_key = fs.readFileSync("./scores/score_key.txt").toString().split("\n");
    var boss_json = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var box_json = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
    var equip_json = JSON.parse(fs.readFileSync("./Equipment_Data/equipment.json", "utf8"));
    //parse Boss Data first
    var boss_total = 0;
    loop = 0;
    while(loop < boss_key.length){
        boss_total = boss_total + user_file.Monster_Data[loop];
        loop++;
    }
    if(boss_total > 0){
        //user has reported boss kills, provide most farmed bosses
        loop = 0;
        while(loop < boss_key.length){
            inloop = 1;
            while(inloop < boss_key.length){
                if(user_file.Monster_Data[inloop - 1] < user_file.Monster_Data[inloop]){
                    swap = user_file.Monster_Data[inloop];
                    user_file.Monster_Data[inloop] = user_file.Monster_Data[inloop - 1];
                    user_file.Monster_Data[inloop - 1] = swap;
                    swap = boss_key[inloop];
                    boss_key[inloop] = boss_key[inloop - 1];
                    boss_key[inloop - 1] = swap; 
                }
                inloop++;
            }
            loop++;
        }
        var boss_disp = [];
        boss_disp[0] = "**Total Bosses Reported: " + boss_total + "**";
        loop = 0;
        var reference = null;
        while(loop < 10 && user_file.Monster_Data[loop] > 0){
            inloop = 0;
            reference = null;
            while(inloop < boss_json.Boss_Select.length){
                if(boss_key[loop] == boss_json.Boss_Select[inloop].Title){
                    reference = JSON.parse(fs.readFileSync("./Monster_Data/" + boss_json.Boss_Select[inloop].mID + ".json", "utf8"));
                    inloop = boss_json.Boss_Select.length;
                }
                inloop++;
            }
            if(reference != null){
                if(reference.Emoji != null){
                    boss_disp[boss_disp.length] = boss_disp.length.toString() + ". " + reference.Emoji + " " + reference.Boss + " -- " + user_file.Monster_Data[loop];
                }else{
                    boss_disp[boss_disp.length] = boss_disp.length.toString() + ". " + reference.Boss + " -- " + user_file.Monster_Data[loop];
                }
            }
            loop++;
        }
        Score_Embed.addField("**Boss Score Summary**", boss_disp.join("\n"))
    }else{
        Score_Embed.addField("**Boss Score Summary**", "**Total Bosses Reported: 0**");
    }
    //next parse Box Scores
    var box_total = 0;
    loop = 0;
    while(loop < user_file.Box_Data.length){
        box_total = box_total + user_file.Box_Data[loop];
        loop++;
    }
    if(box_total > 0){
        loop = 0;
        while(loop < user_file.Box_Data.length){
            inloop = 1;
            while(inloop < user_file.Box_Data.length){
                if(user_file.Box_Data[inloop - 1] < user_file.Box_Data[inloop]){
                    swap = user_file.Box_Data[inloop];
                    user_file.Box_Data[inloop] = user_file.Box_Data[inloop - 1];
                    user_file.Box_Data[inloop - 1] = swap;
                    swap = box_json.Box_Objects[inloop];
                    box_json.Box_Objects[inloop] = box_json.Box_Objects[inloop - 1];
                    box_json.Box_Objects[inloop - 1] = swap;
                }
                inloop++;
            }
            loop++;
        }
        var box_disp = [];
        box_disp[0] = "**Total Treasures Reported: " + box_total + "**";
        loop = 0;
        while(loop < 10 && user_file.Box_Data[loop] > 0){
            var reference = JSON.parse(fs.readFileSync("./Box_Data/" + box_json.Box_Objects[loop].bID + ".json", "utf8"));
            if(reference.Emoji != null){
                box_disp[box_disp.length] = box_disp.length.toString() + ". " + reference.Emoji + " " + reference.Title + " -- " + user_file.Box_Data[loop];
            }else{
                box_disp[box_disp.length] = box_disp.length.toString() + ". " + reference.Title + " -- " + user_file.Box_Data[loop];
            }
            loop++;
        }
        Score_Embed.addField("**Treasure Score Summary**", box_disp.join("\n"));
    }else{
        Score_Embed.addField("**Treasure Score Summary**", "**Total Treasures Reported: 0**");
    }
    message.channel.send(Score_Embed);
}

function boss_score_summary(message, guild_obj, channel_obj, uID, mID){
    //get score for a specific boss
    var score_key = fs.readFileSync("./scores/score_key.txt").toString().split("\n");
    var m_file = JSON.parse(fs.readFileSync("./Monster_Data/" + mID + ".json", "utf8"));
    var u_file = JSON.parse(fs.readFileSync("./User_Data/" + uID + ".json", "utf8"));
    var index = null;
    var loop = 0;
    console.log(uID.Monster_Data);
    while(loop < score_key.length && index == null){
        if(score_key[loop] == m_file.Boss){
            index = loop;
        }
        loop++;
    }
    if(index == null){
        message.channel.send("Internal error function `boss_score_summary()`");
        return;
    }
    var score_embed = new Discord.MessageEmbed()
        .setTitle(u_file.User_Object.Emoji + " " + u_file.User_Object.name + " Scoreboard")
        .setColor(guild_obj.color)
        .setAuthor("Score Summary", key.image, key.website);
    if(channel_obj.color != null){
        score_embed.setColor(channel_obj.color);
    }
    if(m_file.Emoji != null){
        score_embed.setDescription(m_file.Emoji + " " + m_file.Boss + " -- " + u_file.Monster_Data[index]);
    }else{
        score_embed.setDescription(m_file.Boss + " -- " + u_file.Monster_Data[index]);
    }
    message.channel.send(score_embed);
}

function map_score_summary(message, guild_obj, channel_obj, uID, pID){
    //get score for monsters on a specific map
    var u_file = JSON.parse(fs.readFileSync("./User_Data/" + uID + ".json", "utf8"));
    var map_json = JSON.parse(fs.readFileSync("./menus/maps.json", "utf8"));
    var map_obj = map_json.Map_Objects[parseInt(pID.slice(1), 10) - 1];
    var boss_json = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var score_key = fs.readFileSync("./scores/score_key.txt").toString().split("\n");
    console.log(map_obj)
    var mID_Arr = [];
    var loop = null;
    boss_json.Boss_Select.forEach(Element => {
        if(Element.Map == map_obj.Title){
            mID_Arr[mID_Arr.length] = Element.mID;
        }
    })
    console.log(mID_Arr);
    var m_file_Arr = [];
    var index_Arr = [];
    mID_Arr.forEach(Element => {
        m_file_Arr[m_file_Arr.length] = JSON.parse(fs.readFileSync("./Monster_Data/" + Element + ".json", "utf8"));
        loop = 0;
        while(loop < score_key.length){
            if(m_file_Arr[m_file_Arr.length - 1].Boss == score_key[loop]){
                index_Arr[index_Arr.length] = loop;
                loop = score_key.length;
            }
            loop++;
        }
    })
    var score_Arr = [];
    loop = 0;
    while(loop < mID_Arr.length){
        score_Arr[loop] = parseInt(u_file.Monster_Data[index_Arr[loop]], 10);
        loop++;
    }
    var total = 0;
    score_Arr.forEach(Element => {
        total = total + Element;
    })
    

    var score_embed = new Discord.MessageEmbed()
        .SetAuthor("Score Summary", key.image, key.website)
        .setColor(guild_obj.color)
        .setDescription("Total Score: " + total);
    if(channel_obj.color != null){
        score_embed.setColor(channel_obj.color);
    }
}

function history(message, guild_obj, in_Arr){
    //history command, bring up a history of a selected item or boss
    //history of a boss will be $history boss [bossname]
    //history of a loot item from a boss will be $history [bossname] [item]
    //history of an item dropped from multiple bosses $history [item] ~~ this will be hard to code
    //add filters to the end of the input, users with uID or @ tags, and servers
    //add time cut offs, "day" "week" "month" "year" "2-11months"
    console.log(in_Arr);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    const guild = client.guilds.cache.get(message.guild.id);
    var date_now = new Date()
    var users_json = JSON.parse(fs.readFileSync("./User_Data/users.json", "utf8"));
    var in_Arr_trim = [];
    var filters = [];
    var loop = 0;
    var error_Arr = [];
    var time_filt = false;
    while(loop < in_Arr.length){
        in_Arr[loop] = in_Arr[loop].toLowerCase();
        loop++;
    }
    in_Arr.forEach(Element => {
        if(Element.startsWith("u") && isNaN(Element.slice(1)) == false){
            //user ID
            console.log("user id input: " + Element);
            if(parseInt(Element.slice(1), 10) < 10){
                filters[filters.length] = "u00" + parseInt(Element.slice(1), 10);
            }else if(parseInt(Element.slice(1), 10) < 100){
                filters[filters.length] = "u0" + parseInt(Element.slice(1), 10);
            }else{
                filters[filters.length] = "u" + parseInt(Element.slice(1), 10);
            }
            //make sure its a valid user id and is in this server
            if(parseInt(filters[filters.length - 1].slice(1), 10) - 1 < users_json.Total_Members){//is this ID valid?
                var user_file = JSON.parse(fs.readFileSync("./User_Data/" + filters[filters.length - 1] + ".json", "utf8"));
                if(user_file.User_Object.guilds.includes(guild_obj.id) == false){//is this user a member of this guild
                    error_Arr[error_Arr.length] = filters[filters.length - 1];
                }
            }
        }else if(Element.startsWith("<@")){
            var check = false;
            console.log("discord id tagged: " + Element);
            //user tag or role tag
            if(Element.startsWith("<@&")){//tagged a role
                var role_id = Element.slice(3, -1);
                var member_Arr = [];
                guild.members.cache.forEach(Element => {
                    if(Element.roles.cache.has(role_id)){
                        member_Arr[member_Arr.length] = Element.id;
                    }
                })
                member_Arr.forEach(Element => {
                    loop = 0;
                    var check = false;
                    while(loop < users_json.Member_Objects.length){
                        if(users_json.Member_Objects[loop].discord == Element){
                            check = true;
                            filters[filters.length] = users_json.Member_Objects[loop].id;
                        }
                        loop++;
                    }
                    if(check == false){
                        error_Arr[error_Arr.length] = guild.members.cache.get(Element).user.username;
                    }
                })
            }else if(Element.startsWith("<@!")){
                var discord_id = Element.slice(3,-1);
                loop = 0;
                while(loop < users_json.Member_Objects.length){
                    if(users_json.Member_Objects[loop].discord == discord_id){
                        filters[filters.length] = users_json.Member_Objects[loop].id;
                        loop = users_json.Total_Members;
                        check = true;
                    }
                    loop++;
                }
            }else{
                var discord_id = Element.slice(2, -1);
                loop = 0;
                while(loop < users_json.Member_Objects.length){
                    if(users_json.Member_Objects[loop].discord == discord_id){
                        filters[filters.length] = users_json.Member_Objects[loop].id;
                        loop = users_json.Total_Members;
                        check = true;
                    }
                    loop++;
                }
            }
        }else if(Element.includes("day")){
            if(time_filt == true){
                error_Arr[error_Arr.length] = Element;
            }else{
                time_filt = true;
                if(Element == "day"){
                    filters[filters.length] = date_now.getTime() - 86400000;
                }else{
                    var days = parseInt(Element, 10);
                    if(isNaN(days)){
                        error_Arr[error_Arr.length] = Element;
                    }else{
                        filters[filters.length] = date_now.getTime() - (86400000 * days);
                    }
                }
            }
        }else if(Element.includes("week")){time_filt = true;
            if(Element == "week"){
                filters[filters.length] = date_now.getTime() - 604800000;
            }else{
                var weeks = parseInt(Element, 10);
                if(isNaN(weeks)){
                    error_Arr[error_Arr.length] = Element;
                }else{
                    filters[filters.length] = date_now.getTime() - (604800000 * weeks);
                }
            }
        }else if(Element.includes("month")){
            time_filt = true;
            if(Element == "month"){
                filters[filters.length] = date_now.getTime() - 2629800000;
            }else{
                var months = parseInt(Element, 10);
                if(isNaN(months)){
                    error_Arr[error_Arr.length] = Element;
                }else{
                    filters[filters.length] = date_now.getTime() - (2629800000 * months);
                }                
            }
        }else if(Element.includes("year")){
            time_filt = true;
            if(Element == "year"){
                filters[filters.length] = date_now.getTime() - 31557600000;
            }else{
                var years = parseInt(Element, 10);
                if(isNaN(years)){
                    error_Arr[error_Arr.length] = Element;
                }else{
                    filters[filters.length] = date_now.getTime() - (31557600000 * years);
                }
            }
        }else{
            in_Arr_trim[in_Arr_trim.length] = Element;
        }
    })
    console.log(filters);
    if(error_Arr.length == 1){
        message.channel.send("Unable to determine input `" + error_Arr[0] + "`");
        return;
    }else if(error_Arr.length > 1){
        message.channel.send("Unable to determine inputs `" + error_Arr.join(", "));
        return;
    }
    if(in_Arr_trim.length == 0){//no input, asking for a full history
        //come back to this later
        message.channel.send("Complete server history is currently unavailable.");
        return;
    }else if(in_Arr_trim[0] == "boss" && in_Arr.length == 1){//asking for a complete boss history
        message.channel.send("Complete server boss history is currently unavailable.");
        return;
    }else if(in_Arr_trim[0] == "box" && in_Arr.length == 1 || in_Arr_trim[0] == "treasure" && in_Arr.length == 1){//asking for a complete treasure history
        message.channel.send("Complete server treasure history is currently unavailable");
    }else if(in_Arr_trim[0] == "boss"){
        //determine any filters
        boss_history(message, guild_obj, channel_obj, in_Arr_trim, filters);    
    }else if(in_Arr_trim[0] == "box"){
        message.channel.send("Treasure/Box server history is currently unavailable");
    }else if(in_Arr_trim[0] == "loot"){
        message.channel.send("Loot server history is currently unavailable");
    }else{
        message.channel.send("Unable to determine `" + in_Arr[0] + "` try `" + guild_obj.key + "help history`");
        return;
    }
}

function boss_history(message, guild_obj, channel_obj, in_Arr, filters){
    if(in_Arr.length != 2){
        message.channel.send("Unable to determine input(s) `" + in_Arr.slice(1).join(",") + "`" + " try `" + guild_obj.key + "help history boss`");
        return;
    }
    var Boss_Menu = JSON.parse(fs.readFileSync("./menus/Boss.json", "utf8"));
    var boss_file = null;
    var loop = 0;
    while(loop < Boss_Menu.Boss_Select.length){
        if(Boss_Menu.Boss_Select[loop].Shortcuts.includes(in_Arr[1])){
            boss_file = JSON.parse(fs.readFileSync("./Monster_Data/" + Boss_Menu.Boss_Select[loop].mID + ".json", "utf8"));
            loop = Boss_Menu.Boss_Select.length;
        }
        loop++;
    }
    if(boss_file == null){
        message.channel.send("Unable to determine boss input `" + in_Arr[1] + "` try `" + guild_obj.key + "help history boss` or `" + guild_obj.key + "help bosses [map]`");
        return;
    }
    //boss determined, load log
    //load any relevant stat files
    var trimmed_log = [];
    var log = JSON.parse(fs.readFileSync("./log/" + guild_obj.id + "/log.json", "utf8"));
    var stat_archive = JSON.parse(fs.readFileSync("./stats/" + guild_obj.id + "/Monster_Data/" + boss_file.id + ".json", "utf8"));
    var user_filters = [];
    var time_filter = 0;
    filters.forEach(Element => {
        if(Element.toString().startsWith("u")){
            user_filters[user_filters.length] = Element;
        }else{
            time_filter = Element;
        }
    })
    log.Event_Arr.forEach(Element => {
        if(Element.log_type == "R"){//found possible hit
            if(Element.mID == boss_file.id){
                if(Element.death > time_filter && Element.users.length > 0){
                    if(user_filters.length == 0){
                        trimmed_log[trimmed_log.length] = Element;
                    }else{
                        //check for user filter
                        var loop = 0;
                        while(loop < user_filters.length){
                            if(Element.users.includes(user_filters[loop])){
                                trimmed_log[trimmed_log.length] = Element;
                                loop = user_filters.length;
                            }
                            loop++;
                        }
                    }
                }
            }
        }
    })
    trimmed_log = trimmed_log.reverse()
    var temp_trim_log = [];
    stat_archive.History_Arr.forEach(Element => {
        if(Element.death > time_filter){
            if(user_filters.length == 0){
                temp_trim_log[temp_trim_log.length] = Element;
            }else{
                var loop = 0;
                while(loop < user_filters.length){
                    if(Element.users.includes(user_filters[loop])){
                        temp_trim_log[temp_trim_log.length] = Element;
                        loop = user_filters.length;
                    }
                    loop++;
                }
            }
        }
    })
    temp_trim_log = temp_trim_log.reverse();
    temp_trim_log.forEach(Element => {
        trimmed_log[trimmed_log.length] = Element;
    })
    //we have compiled a trimmed log matching the filters
    var history_embed = new Discord.MessageEmbed()
        .setAuthor("Recall Boss History", key.image, key.website)
        .setColor(guild_obj.color);
    if(channel_obj.color != null){
        history_embed.setColor(channel_obj.color);
    }
    if(filters.length > 0){
        var filters_disp = [];
        if(user_filters.length > 0){
            filters_disp[0] = "Filtering for user(s) " + user_filters.join(",");
        }
        if(time_filter != 0){
            var filter_date = new Date(time_filter);
            var filter_date_disp = [];
            filter_date_disp[0] = filter_date.getDate();
            filter_date_disp[1] = filter_date.getMonth() + 1;
            if(filter_date_disp[1] < 10){
                filter_date_disp[1] = "0" + filter_date_disp[1].toString();
            }
            filter_date_disp[2] = filter_date.getFullYear();
            filter_date_disp[3] = filter_date.getHours();
            filter_date_disp[4] = filter_date.getMinutes();
            if(filter_date_disp[4] < 10){
                filter_date_disp[4] = "0" + filter_date_disp[4].toString();
            }
            filter_date_disp[5] = filter_date.getSeconds();
            if(filter_date_disp[5] < 10){
                filter_date_disp[5] = "0" + filter_date_disp[5].toString();
            }
            filters_disp[filters_disp.length] = "Filtering for log entries after " + filter_date_disp[0] + "/" + filter_date_disp[1] + "/" + filter_date_disp[2] + " ~ " + filter_date_disp[3] + ":" + filter_date_disp[4] + ":" + filter_date_disp[5];
        }
        history_embed.setDescription(filters_disp.join("\n"));
    }
    if(boss_file.Emoji == null){
        history_embed.setTitle("**" + boss_file.Boss + "** (" + Boss_file.Map + ")");
    }else{
        history_embed.setTitle(boss_file.Emoji + " **" + boss_file.Boss + "** (" + boss_file.Map + ")");
    }
    var loop = 0;
    if(trimmed_log.length > 25){
        history_embed.setFooter("Continued.....\nRead more in the attached file")
    }
    console.log(trimmed_log);
    var items = JSON.parse(fs.readFileSync("./Item_Data/items.json", "utf8"));
    while(loop < trimmed_log.length && loop < 25){
        var death_date = new Date(trimmed_log[loop].death);
        var ddd = [];
        ddd[0] = death_date.getDate();
        ddd[1] = death_date.getMonth() + 1;
        if(ddd[1] < 10){
            ddd[1] = "0" + ddd[1].toString();
        }
        ddd[2] = death_date.getFullYear();
        ddd[3] = death_date.getHours();
        ddd[4] = death_date.getMinutes();
        if(ddd[4] < 10){
            ddd[4] = "0" + ddd[4].toString();
        }
        ddd[5] = death_date.getSeconds();
        if(ddd[5] < 10){
            ddd[5] = "0" + ddd[5].toString();
        }
        var user_disp = [];
        trimmed_log[loop].users.forEach(Element => {
            var user_file = JSON.parse(fs.readFileSync("./User_Data/" + Element + ".json", "utf8"));
            user_disp[user_disp.length] = user_file.User_Object.name;
        })
        var loot_disp = [];
        trimmed_log[loop].loot.forEach(Element => {
            if(Element == "Gold"){
                loot_disp[loot_disp.length] = "<:Gold:834876053029126144> Gold"
            }else if(Element.startsWith("Gold (")){
                loot_disp[loot_disp.length] = "<:Gold:834876053029126144> " + Element;
            }else if(Element.startsWith("i")){
                console.log(Element, Element.split(" ")[0].split("i")[1])
                var item_json = items.Item_Objects[parseInt(Element.split(" ")[0].split("i")[1], 10) - 1];
                if(item_json.Emoji == null){
                    loot_disp[loot_disp.length] = item_json.Title;
                }else{
                    loot_disp[loot_disp.length] = item_json.Emoji + " " + item_json.Title;
                }
            }else if(Element.startsWith("e")){
                var equip_file = JSON.parse(fs.readFileSync("./Equipment_Data/" + Element.split(" ")[0] + ".json", "utf8"));
                if(equip_file.is_Static == true){
                    if(equip_file.Emoji == null){
                        loot_disp[loot_disp.length] = equip_file.Title;
                    }else{
                        loot_disp[loot_disp.length] = equip_file.Emoji + " " + equip_file.Title;
                    }
                }else if(equip_file.Verieties.length > 0){
                    if(equip_file.Emoji == null){
                        loot_disp[loot_disp.length] = equip_file.Title + " (" + Element.split("[")[1].split("]")[0] + ")";
                    }else{
                        loot_disp[loot_disp.length] = equip_file.Emoji + " " + equip_file.Title + " (" + Element.split("[")[1].split("]")[0] + ")";
                    }
                }else{
                    var equip_loop = 0;
                    var equip_arr = Element.split("[")[1].split("]")[0].split(",");
                    var stat_disp = [];
                    while(equip_loop < equip_file.Stat_Ranges.length){
                        stat_disp[equip_loop] = equip_arr[equip_loop] + " " + equip_file.Stat_Ranges[equip_loop];
                        equip_loop++;
                    }
                    if(equip_file.Emoji == null){
                        loot_disp[loot_disp.length] = equip_file.Title + " (" + stat_disp.join(", ") + ")";
                    }else{
                        loot_disp[loot_disp.length] = equip_file.Emoji + " " + equip_file.Title + " (" + stat_disp.join(", ") + ")"
                    }
                }
                
            }
        })
        if(loot_disp.length > 0){
            history_embed.addField("-   **" + ddd[0] + "/" + ddd[1] + "/" + ddd[2] + " ~ " + ddd[3] + ":" + ddd[4] + ":" + ddd[5] + "**", "**Reported by**\n" + user_disp.join("\n") + "\n**Loot Reported**\n" + loot_disp.join("\n"));
        }else{
            history_embed.addField("-   **" + ddd[0] + "/" + ddd[1] + "/" + ddd[2] + " ~ " + ddd[3] + ":" + ddd[4] + ":" + ddd[5] + "**", "**Reported by**\n" + user_disp.join("\n") + "\n**Loot Reported**\nNo Loot Reported");
        }
        loop++;
    }
    message.channel.send(history_embed);
}

function Help(message, guild_obj, in_Arr){
    var ky = guild_obj.key;
    var Help_Embed = new Discord.MessageEmbed()
        .setAuthor('Command Documentation', key.image, key.website)
        .setColor(guild_obj.color);
    var channel_obj = null;
    guild_obj.Channel_Objects.forEach(Element => {
        if(Element.discord == message.channel.id){
            channel_obj = Element;
        }
    })
    if(channel_obj != null){
        if(channel_obj.color != null){
            Help_Embed.setColor(channel_obj.color);
        }
    }
    if(in_Arr.length == 0){
        Help_Embed.addField('**Black Raven Commands**', ky + "report\n" + ky + "loot\n" + ky + "box\n" + ky + "check\n" + ky + "spawntime\n" + ky + "pin\n" + ky + "pout\n" + ky + "undo\n" + ky + "history\n" + ky + "stat\n" + ky + "score\n" + ky + "channel\n" + ky + "guild\n" + ky + "memberlist\n" + ky + "wiki");
        Help_Embed.setFooter("For more information about each command reply " + ky + "help [command]\nFor more general information about this bot's functions, enter " + ky + "help about");
    }
    if(in_Arr.length == 1){
        if(in_Arr[0] == "report" || in_Arr[0] == "r"){
            Help_Embed
                .setTitle("**Report Bosses Command**")
                .addField("**Command Inputs**", "The report command accepts three parameter inputs. Boss name, Time of boss death (UTC/in-game-time) and the farmers farming it\nOnly the boss name is required, other inputs are optional.\nThe boss name must be the first input, for a list of recognized boss names try " + ky + "help bosses or " + ky + "help monsters")
                .addField("**Examples**", ky + "r tank 29:15 @raven @dan\ntank died at 29 minutes, 15 seconds and was killed by raven and dan.\n" + ky + "r barslaf 10:40:00 none\nBarslaf died at 10 hours 40 minutes, killed by players not on our team.\n" + ky + "r forestkeeper\nCorrupted Forest Keeper died the moment the command was entered, killed by me.")
                .setFooter("For tutorials visit the black raven YouTube channel. [null link]");
        }else if(in_Arr[0] == "box" || in_Arr[0] == "b"){
            Help_Embed
                .setTitle("**Box Command**")
                .addField("**Command Inputs**", "Report the contents of a treasure chest to raven to track drop rates.\nEither navigate the menus by initially entering '" + ky + "box' or enter '" + ky + "b [box name] [box contents]\nIt is possible to enter as many boxes as you can fit in one discord message (2000 characters)\nTo report multiple boxes simply list the contents of each box, seperating each by a single space.\nIf multiple boxes give the same loot, you can enter them in as a multiplier ex: 'acoin x4'")
                .addField("**Examples**", "" + ky + "b wingfril g3054 oldscroll x3 scc3\nOpening 5 wingfril treasures you recieved gold (3054), 3 old scrolls and Special Cotton Cloth (3)\n" + ky + "b giftbox pb pb acoin x1 adoll x2\nOpening 6 Gift Boxes, you recieved 2 potion bags, an ancient coin and 2 Awaken Kooii Dolls")
                .setFooter("For more information on recognized shorthand enter " + ky + "help [box name]\nFor a list of all tracked boxes enter " + ky + "help box list");
        }else if(in_Arr[0] == "pin"){
            Help_Embed
                .setTitle("**Notification Sign Up Command**")
                .addField("**Command Inputs**", "Sign up for @notifications from the bot when certain events occur. All bosses and mini bosses can have notifications turned on, as well as battlefield and guild siege.\nEither list all items you would like notifications for in the command or enter in groupings.\nTo sign up for all minibosses and bosses in a map you can enter in map names in the command.")
                .addField("**Examples**", "" + ky + "pin bf siege\nNotifications for battlefield and siege are turned on\n" + ky + "pin blackskull awakenkooii whiteskull\nNotifications for BLACKSKULL, AWAKEN KOOII and WHITESKULL are on\n" + ky + "pin aridgrassland\nAll minibosses and bosses in Arid Grasslands have notifications turned on.")
                .setFooter("For a list of recognized monsters and bosses try " + ky + "help bosses or " + ky + "help maps");
        }else if(in_Arr[0] == "pout"){
            Help_Embed
                .setTitle("**Notification Sign Out Command**")
                .addField("**Command Inputs**", "Sign out for @notifications from the bot when certain events occur. All bosses and mini bosses can have notifications turned off, as well as battlefield and guild siege.\nEither list all items you would like notifications turned off in the command or enter in groupings.\nTo sign out for all minibosses and bosses in a map you can enter in map names in the command.")
                .addField("**Examples**", "" + ky + "pout bf siege\nNotifications for battlefield and siege are turned off\n" + ky + "pout blackskull awakenkooii whiteskull\nNotifications for BLACKSKULL, AWAKEN KOOII and WHITESKULL are off\n" + ky + "pout aridgrassland\nAll minibosses and bosses in Arid Grasslands have notifications turned off.\n" + ky + "pout all\nAll bosses and mini bosses have notifications turned off\nNote: " + ky + "pout all does not turn notifications for siege and battlefield off")
                .setFooter("For a list of recognized monsters and bosses try " + ky + "help bosses or " + ky + "help maps");
        }else if(in_Arr[0] == "loot"){
            Help_Embed
                .setTitle("**Loot Command**")
                .addField("**Command Inputs**", "Report the loot from your boss farming using the loot command. Raven will track drop rates and other statistics with provided data.\nEntering the command with no inputs will return a menu of tracked loot from the most recent boss kill. Or enter a boss name to bring up the loot menu for that boss.\nThe loot command can also be used to track item stat rarities\nIf desired, gold amounts can also be tracked, using 'g###' notation")
                .addField("**Loot Menu Interaction**", "When a monster has been selected for loot report, a menu of tracked loot will appear. Respond with the numbers corresponding to the loot on the list in your reply.\nIf a mistake is made, it can be undone and retried with the '" + ky + "undo' command")
                .setFooter("For tutorials, visit the black raven YouTube channel. [null link]");
        }else if(in_Arr[0] == "monsters" || in_Arr[0] == 'bosses' || in_Arr[0] == "boss" || in_Arr[0] == "monster"){
            Help_Embed
                .addField("**Monsters & Bosses**", "There are multiple recognized abbreviations and shortcuts for every boss and mini boss. Mini bosses that appear on multiple maps (ex: Mutant Woopa) have seperate abbreviations for the mini boss on each map.\nThere are too many bosses to fit in one message, for a list of abbreviations enter\n'" + ky + "help bosses [map]'\nFor a list of maps enter\n'" + ky + "help maps'");
        }else if(in_Arr[0] == "map" || in_Arr[0] == "maps"){
            var maps = JSON.parse(fs.readFileSync("./menus/maps.json", "utf8"));
            var maps_disp = [];
            maps.Map_Objects.forEach(Element => {
                if(Element.Emoji != null){
                    maps_disp[maps_disp.length] = "**" + Element.Emoji + " " + Element.Title + "**\n" + Element.Shortcuts.join(" - ");
                }else{
                    maps_disp[maps_disp.length] = "**" + Element.Title + "**\n" + Element.Shortcuts.join(" - ");
                }
            })
            if(maps_disp.join('\n').length > 2000){
                var maps_divided = [];
                maps_divided[0] = maps_disp[0];
                maps_disp.forEach(Element => {
                    if(Element.startsWith("**Woody-Weedy Forest**") == false){
                        if(maps_divided[maps_divided.length - 1].length + Element.length < 1022){
                            maps_divided[maps_divided.length - 1] = maps_divided[maps_divided.length - 1] + '\n' + Element;
                        }else{
                            maps_divided[maps_divided.length] = Element;
                        }
                    }
                })
                maps_divided.forEach(Element => {
                    if(Element.startsWith("**Woody-Weedy Forest**")){
                        Help_Embed.addField("**Maps**", Element);
                    }else{
                        Help_Embed.addField("**Continued...**", Element);
                    }
                })
            }else{
                Help_Embed.addField("**Maps**", maps_disp.join("\n"));
            }
        }else if(in_Arr[0] == "stat" || in_Arr[0] == "stats" || in_Arr[0] == "statistics"){
            Help_Embed.addField("**Statistics Command**", "Check the statistics for select bosses, treasures or items.");
            Help_Embed.addField("**Boss Statistics**", ky + "stat boss [boss name]\nSelect from the top data sets to view drop rate data");
            Help_Embed.addField("**Treasure Statistics**", ky + "stat box [box name]\nSelect from the top data sets to view content rate data");
            Help_Embed.addField("**Filters**", "Filter data sets by server and/or by user\n**" + ky + "stat boss [boss name] [server]**\nexample: " + ky + "stat boss gatekeeper newstar\n**" + ky + "stat boss [boss name] [username]**\nexample: " + ky + "stat boss gatekeeper dan\nFiltering data by server and/or user will show data only matching the filters.");
        }else if(in_Arr[0] == "score"){
            Help_Embed.addField("**User Scores Command**", "Check scoreboards and rankings.\n**" + ky + "score**\nCheck rankings\n**" + ky + "score [boss name]**\nCheck rankings for a particular boss\n**" + ky + "score [map]**\nCheck rankings for a particular map\n**" + ky + "score [username]**\nCheck a user's score");
        }else if(in_Arr[0] == "check" || in_Arr[0] == "c"){
            Help_Embed.addField("**Check Timers Command**", "Check currently running boss timers\n**" + ky + "check**\nCheck all active boss timers\n**" + ky + "check [map]**\nCheck all boss timers on a map\n**" + ky + "check [boss name]**\nCheck remaining time for a boss timer.\nYou can input multiple maps and bosses into the same command.");
        }else if(in_Arr[0] == "channel"){
            Help_Embed.addField("**Channel Settings**", "Change channel settings\nYou must be a moderator to access this command.\n**" + ky + "channel type**\nChange channel type to report, discussion or home.\nReport channel - for reporting bosses\ndiscussion channel - report commands won't work\nhome channel - where Black Raven will post announcements.\n**" + ky + "channel server**\nChange which server the channel is reporting for.\n**" + ky + "channel bf**\nTurn Battlefield reminders on or off\n**" + ky + "channel siege**\nTurn Siege Battle reminders on or off\n**" + ky + "channel maint**\nTurn Maintanence reminders on or off\n**" + ky + "channel privacy**\nset report channel to private or public\nSetting a channel to private will lock boss times to only that channel\n**" + ky + "channel color**\nChange the color of Black Raven replies in that channel");
            Help_Embed.setFooter("For more information on each setting. Try " + ky + "help channel [setting]");
        }else if(in_Arr[0] == "guild"){
            Help_Embed.addField("**Guild Settings**", "Guild Settings\nYou must be a moderator to access this command\n**" + ky + "guild name**\nChange guild name. This name will appear in guild rankings and stat menus in other Discord Servers.\n**" + ky + "guild color**\nChange the color of Black Raven replies for the whole discord server\n**" + ky + "guild key**\nChange the command key for Black Raven commands.\n**" + ky + "guild language**\nChange the language setting for the whole server.\n**" + ky + "guild emoji**\nChange the guild Emoji. This emoji will appear in guild rankings and Stat menus in other discord servers.\n**" + ky + "guild image**\nChange the guild cover photo. This photo will be used if your guild wins the top score in a week.\n**" + ky + "guild lootprompt**\nTurn automatic loot prompts on or off\n**" + ky + "guild privacy**\nSet guild stats to public or private.\nSetting this to public allows other discord servers to view your droprates and other statistics.\nBoss times remain private.");
            Help_Embed.setFooter("For more information on each setting. Try " + ky + "help guild [setting]");
        }else if(in_Arr[0] == "memberlist" || in_Arr[0] == "members" || in_Arr[0] == "ml"){
            Help_Embed.addField("**Member List**", "Quickly display a list of current guild members, use this command to easily obtain your guild members raven IDs which can be used to more easily report group boss kills");
        }else if(in_Arr[0] == "history" || in_Arr[0] == "hist"){
            Help_Embed.addField("**History Command**", "This function is still under construction, please check back at a later date.");
        }
    }else if(in_Arr.length == 2){
        if(in_Arr[0] == "box" || in_Arr[0] == 'b'){
            var box_dir = JSON.parse(fs.readFileSync("./Box_Data/box.json", "utf8"));
            if(in_Arr[1] == "list" || in_Arr[1] == "menu"){
                box_dir.Box_Objects.forEach(Element => {
                    if(Element.Title.startsWith('Dungeon')){
                        if(Element.Title == "Dungeon Chest 20" || Element.Title == "Dungeon Treasure 20"){
                            Help_Embed.addField(Element.Emoji + '**' + Element.Title + "**", Element.Shortcuts.join(' - '));
                        }
                    }else if(Element.Active == true){
                        if(Element.Emoji != null){
                            Help_Embed.addField(Element.Emoji + "**" + Element.Title + "**", Element.Shortcuts.join(' - '));
                        }else{
                            Help_Embed.addField("**" + Element.Title + "**", Element.Shortcuts.join(' - '));
                        }
                    }
                    Help_Embed.setFooter("For other Dungeon Chests & Treasures, simply change the number (ex 25t, 40c)\nFor Information about each box enter '" + ky + "help box [box name]'");
                })
            }else{
                var select = null;
                box_dir.Box_Objects.forEach(Element => {
                    if(Element.Shortcuts.includes(in_Arr[1])){
                        select = Element;
                    }
                })
                if(select == null){
                    Help_Embed
                        .setTitle("**Box Information**")
                        .addField("Error", "Unable to determine input '" + in_Arr[1] + "'");
                }else{
                    var item_dir = JSON.parse(fs.readFileSync('./Item_Data/items.json', 'utf8'));
                    var equip_dir = JSON.parse(fs.readFileSync('./Equipment_Data/equipment.json', 'utf8'));
                    var is_Range = false;
                    var example_title = null;
                    var example_shortcut = null;
                    var Box_File = JSON.parse(fs.readFileSync('./Box_Data/' + select.bID + '.json', 'utf8'));
                    if(Box_File.Image != null){
                        Help_Embed.setThumbnail(Box_File.Image);
                    }
                    if(Box_File.Emoji != null){
                        Help_Embed.setTitle("**" + Box_File.Emoji + " " + Box_File.Title + " " + Box_File.Emoji + '**');
                    }else{
                        Help_Embed.setTitle("**" + Box_File.Title + "**");
                    }
                    Box_File.Loot_Table.forEach(Element => {
                        if(Element.id.startsWith('Gold')){
                            Help_Embed.addField("**<:Gold:834876053029126144> " + Element.id + "**", "g" + Element.id.split(' (')[1].split(')')[0]);
                        }else if(Element.id.startsWith('e')){
                            if(equip_dir.Equip_Objects[parseInt(Element.id.slice(1), 10) - 1].Emoji != null){
                                Help_Embed.addField('**' + equip_dir.Equip_Objects[parseInt(Element.id.slice(1), 10) - 1].Emoji + " " + equip_dir.Equip_Objects[parseInt(Element.id.slice(1), 10) - 1].Title + '**', Element.Shortcuts.join(' - '))
                            }else{
                                Help_Embed.addField('**' + equip_dir.Equip_Objects[parseInt(Element.id.slice(1), 10) - 1].Title + '**', Element.Shortcuts.join(' - '))
                            }
                        }else if(Element.id.startsWith('i') && Element.id.split(" ").length == 1){
                            if(item_dir.Item_Objects[parseInt(Element.id.slice(1), 10) - 1].Emoji != null){
                                Help_Embed.addField('**' + item_dir.Item_Objects[parseInt(Element.id.slice(1), 10) - 1].Emoji + " " + item_dir.Item_Objects[parseInt(Element.id.slice(1), 10) - 1].Title + "**", Element.Shortcuts.join(' - '));
                            }else{
                                Help_Embed.addField('**' + item_dir.Item_Objects[parseInt(Element.id.slice(1), 10) - 1].Title + "**", Element.Shortcuts.join(' - '));
                            }
                        }else if(Element.id.startsWith('i') && Element.id.split(" ").length == 2){
                            if(item_dir.Item_Objects[parseInt(Element.id.split(" ")[0].slice(1), 10) - 1].Emoji != null){
                                Help_Embed.addField('**' + item_dir.Item_Objects[parseInt(Element.id.split(" ")[0].slice(1), 10) - 1].Emoji + " " + item_dir.Item_Objects[parseInt(Element.id.split(" ")[0].slice(1), 10) - 1].Title + " " + Element.id.split(" ")[1] + "**", Element.Shortcuts.join(' - '));
                            }else{
                                Help_Embed.addField('**' + item_dir.Item_Objects[parseInt(Element.id.split(" ")[0].slice(1), 10) - 1].Title + " " + Element.id.split(" ")[1] + "**", Element.Shortcuts.join(' - '));
                            }
                            example_file = item_dir.Item_Objects[parseInt(Element.id.split(" ")[0].slice(1), 10) - 1].Title;
                            example_shortcut = Element.Shortcuts[Element.Shortcuts.length - 1];
                            is_Range = true;
                        }
                    })
                    if(is_Range == true){
                        Help_Embed.setFooter("For items with variable amounts obtained from each box (ex: " + example_file + ") include the amount at the end of the input, (ex: " + example_shortcut + "4) for 4 " + example_file + "s");
                    }
                }
            }
        }else if(in_Arr[0] == "bosses" || in_Arr[0] == "boss" || in_Arr[0] == "monsters" || in_Arr[0] == "monster"){
            var map_dir = JSON.parse(fs.readFileSync("./menus/maps.json", "utf8"));
            var monster_dir = JSON.parse(fs.readFileSync('./menus/loot.json', 'utf8'));
            var selected_map = null;
            map_dir.Map_Objects.forEach(Element => {
                if(Element.Shortcuts.includes(in_Arr[1])){
                    selected_map = Element.Title;
                }
            })
            if(selected_map == null){
                message.channel.send("Unable to determine `" + in_Arr[1] + '`');
                return;
            }
            var boss_obj = null;
            monster_dir.Monster_Select.forEach(Element => {
                if(Element.Map == selected_map){
                    boss_obj = JSON.parse(fs.readFileSync('./Monster_Data/' + Element.mID + '.json', 'utf8'));
                    if(boss_obj.Emoji != null){
                        Help_Embed.addField("**" + boss_obj.Emoji + ' ' + boss_obj.Boss + "**", Element.Shortcuts.join(' - '));
                    }else{
                        Help_Embed.addField("**" + boss_obj.Boss + "**", Element.Shortcuts.join(" - "));
                    }
                }
            })
            Help_Embed.setTitle("**" + selected_map + " Shortcuts**");
        }else if(in_Arr[0] == "channel"){
            if(in_Arr[1] == "type"){
                Help_Embed.addField("**Channel Types**", "There are three channel types:Report, Home, and Discussion");
                Help_Embed.addField("**Home Channel**", "The home channel is the channel where Black Raven will post announcements, including scoreboard updates and Weekly Rankings.\nThere can only be one Home channel per discord server. If there is no home channel, the announcements will not be made.");
                Help_Embed.addField("**Report Channel**", "Report-type channels are unrestricted Black Raven channels, with all commands working.");
                Help_Embed.addField("**Discussion Channel**", "Discussion-type channels make all Black Raven commands available, except for report-type commands. Including Report, Box Npc and Craft.\n");
            }else if(in_Arr[1] == "server"){
                Help_Embed.addField("**Server Setting**", "Chose which in-game server a channel will be set to. This will automatically assign reports in the channel to that server");
            }else if(in_Arr[1] == "battlefield" || in_Arr[1] == "bf"){
                Help_Embed.addField("**Battlefield Setting**", "Battlefield Reminders can be turned on and off in a channel. There is a 10 minute warning before Battlefield will begin and a message announcing it has begun");
            }else if(in_Arr[1] == "siege" || in_Arr[1] == "siegebattle" || in_Arr[1] == "guildsiege"){
                Help_Embed.addField("**Siege Battle Setting**", "Siege Battle Reminders can be turned on and off in a channel. There is a 30 minute warning before Siege Battle begins, a message announcing it has begun and a message announcing Siege Battle has ended");
            }else if(in_Arr[1] == "maintanence" || in_Arr[1] == "maint"){
                Help_Embed.addField("**Maintanence Setting**", "Maintanence reminders can be turned on and off in a channel. There is a 30 minute warning before Maintanence begins, and an announcement when maintanence begins.\nA timer will appear that actively counts down to when in-game servers will reopen.\nIf Maintanence is extended, this will also be announced.");
            }else if(in_Arr[1] == "privacy" || in_Arr[1] == "private"){
                Help_Embed.addField("**Privacy Setting**", "Private channels can be turned on and off. When a channel is private, all boss times reported in that channel will only be visible in this channel. Users using " + ky + "check in other channels will not be able to view boss times from the private channel. If a channel is set to public, boss times will be viewable in other channels on the discord server.");
            }else if(in_Arr[1] == "color"){
                Help_Embed.addField("**Color Setting**", "Channels can have colors independent from the guild color. This will change the color of Black Raven embeds in this channel. To enter a new color, enter a valid hex code");
                Help_Embed.setFooter("to get color hex codes. Visit https://www.color-hex.com/");
            }else{
                Help_Embed.setDescription("Unable to determine " + in_Arr[1] + ". Try " + ky + "help channel");
            }
        }else if(in_Arr[0] == "guild"){
            if(in_Arr[1] == "name" || in_Arr[1] == "guildname"){
                Help_Embed.addField("**Guild Name Setting**", "Change the name of your guild in Menus and Ranking Boards. The name you enter is what will appear in menus and ranking boards in other discord servers.\nInnapropriate guild names will be removed by Black Raven administrators.");
            }else if(in_Arr[1] == "color"){
                Help_Embed.addField("**Guild Color Setting**", "Change the color of Black Raven replies for the discord server. Enter in a valid Hex Code to change the color.\nIf individual channels have a custom color, the reply will be in the color of the channel.")
                Help_Embed.setFooter("To get color hex codes. Visit https://www.color-hex.com/");
            }else if(in_Arr[1] == "key" || in_Arr[1] == "prompt"){
                Help_Embed.addField("**Command Prompt Key Setting**", "Change the prompt key for Black Raven commands. By default the key is $, but it can be changed to any special character or punctuation with a few exceptions. If the default key conflicts with other bots in your discord server, Black Raven can change it's key.\nTo change it, use " + ky + "guild key, and respond with the character you would like to be the new key.");
            }else if(in_Arr[1] == "language" || in_Arr[1] == "lang"){
                Help_Embed.addField("**Language Setting**", "Black Raven can change language settings. Right now only English is available, but more translations will be released.\nHelp with translations is appreciated.");
            }else if(in_Arr[1] == "emoji"){
                Help_Embed.addField("**Guild Emoji Setting**", "Change the emoji representing your guild. This can be a custom emoji or a unicode emoji. This emoji will appear in Guild Rankings and Stat menus in other discord servers.\nMake sure to use an emoji that Black Raven can use, and not an emoji from a server Black Raven is not a member of.");
            }else if(in_Arr[1] == "image"){
                Help_Embed.addField("**Guild Image Setting**", "Change your guild Cover Photo. If your guild wins the weekly ranking, it will appear in the ranking announcement in every discord server Black Raven is in.");
            }else if(in_Arr[1] == "loot" || in_Arr[1] == "lootprompt"){
                Help_Embed.addField("**Loot Prompt Setting**", "Turn on or off automatic Loot Prompts. If turned on, Right after every boss report, Black Raven will immediately prompt the user what loot they recieved from the boss.\nIf turned off, loot can still be reported, but the " + ky + "loot command will need to be used.");
            }else if(in_Arr[1] == "private" || in_Arr[1] == "privacy"){
                Help_Embed.addField("**Guild Privacy Setting**", "Turn your guild data to either Private or Public. If turned to public, other discord servers will be able to view droprate data from your reports. This does not make your boss times public, and statistics are not updated in real time to keep your boss times secret.\nIf set to private, other discord servers will not be able to see your statistics. Your guild will also not appear on Guild Rankings.");
            }else{
                Help_Embed.setDescription("*Unable to determine " + in_Arr[1] + ". Try " + ky + "help guild");
            }
        }else if(in_Arr[0] == "stat" || in_Arr[0] == "stats" || in_Arr[0] == "statistics"){
            if(in_Arr[1] == "boss" || in_Arr[1] == "monster"){
                Help_Embed.addField("**Boss Droprate Statistics**", "Check droprate statistics from various bosses from a veriety of data sets. Guilds that have made their data public will appear in the menu, you can chose one or a combination of guilds to view droprate data. Additional filters can also be applied, like server or user to view data from just one server or just one individual. For more info on filters, Try " + ky + "help stat filter");
                Help_Embed.setFooter("For a list of recognized bosses try " + ky + "help boss [map]");
            }else if(in_Arr[1] == "box" || in_Arr[1] == "treasure"){
                Help_Embed.addField("**Treasure Statistics**", "Check treasure content statistics from various boxes from a veriety of data sets. Guilds that have made their data public will appear in the menu, you can chose one or a combination of guilds to view droprate data. Additional filters can also be applied, like server or user to view data from just one server or just one individual. For more info on filters, Try " + ky + "help stat filter");
                Help_Embed.setFooter("For a list of recognized boxes try " + ky + "help box list");
            }else if(in_Arr[1] == "npc"){
                Help_Embed.addField("**NPC Statistics**", "Check NPC trading statistics from various NPCs from a veriety of data sets. Guilds that have made their data public will appear in the menu, you can chose one or a combination of guilds to view data. Additional filters can also be applied, like server or user to view data from just one server or just one individual. For more info on filters, Try " + ky + "help stat filter");
                Help_Embed.setFooter("For a list of recognized NPCs try " + ky + "help npc list");
            }else if(in_Arr[1] == "craft" || in_Arr[1] == "crafting"){
                Help_Embed.addField("**Craft Statistics**", "Check crafting statistics from a veriety of data sets. Guilds that have made their data public will appear in the menu, you can chose one or a combination of guilds to view data. Additional filters can also be applied, like server or user to view data from just one server or just one individual. For more info on filters, Try " + ky + "help stat filter");
                Help_Embed.setFooter("For a list of regonized crafting options try " + ky + "help craft list");
            }else if(in_Arr[1] == "equipment" || in_Arr[1] == "equip"){
                Help_Embed.addField("**Equipment Statistics**", "Check Equipment statistics from a veriety of data sets. Guilds that have made their data public will appear in the menu, you can chose one or a combination of guilds to view data. Additional filters can also be applied, like server or user to view data from just one server or just one individual. For more info on filters, Try " + ky + "help stat filter");
                Help_Embed.setFooter("For a list of recognized equipment try " + ky + "help equip list");
            }else if(in_Arr[1] == "filter" || in_Arr[1] == "filter"){
                Help_Embed.setDescription("This feature is under construction");
            }else{
                Help_Embed.setDescription("Unable to determine '" + in_Arr[1] + "'. Try " + ky + "help stat");
            }
        }
    }
    message.channel.send(Help_Embed);
}

client.login(key.token)