const print = console.log;
const write = prpt => process.stdout.write(prpt);
const fs = require('fs');

const request = require('request');
const emoji = require('node-emoji'); 

const DJS11 = require('djs11');
const client = new DJS11.Client();

client.login(fs.readFileSync('./token.txt').toString());

client.on('ready', () => {
	client.user.setPresence({
		status: 'invisible'
	});
});

if(typeof(Array.prototype.includes) !== 'function') {
    Array.prototype.includes = function(val) {
        for(var item of this) {
            if(item === val) return true;
        }
        
        return false;
    };
}

if(!fs.existsSync('./msg.csv')) {
	fs.writeFileSync('./msg.csv', '"시간","타임스탬프","전송자 ID","전송자 이름","길드","채널","메시지 ID","메시지","플래그"\r\n');
}

function date(tm) {
	var _date = tm ? (new Date(tm)) : (new Date());

	var hour = _date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	var min  = _date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	var sec  = _date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	var year = _date.getFullYear();

	var month = _date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	var day  = _date.getDate();
	day = (day < 10 ? "0" : "") + day;

	return {
		unix: _date.getTime(),
		str: year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec
	};
}

client.on('messageDelete', msg => {
	var msgcntnt = msg.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/["]/g, '""');
	
	if(msg['embeds'].length && !msg.content) {
		for(var embed of msg['embeds']) {
			msgcntnt += `${embed['title'] || msg.author.username}: ${embed['description']}\n`;
		}
	}
	if(msg['system']) {
		switch(msg['type']) {
			case 'GUILD_MEMBER_JOIN':
				msgcntnt = '서버에 참가함.';
			break; case 'PINS_ADD':
				msgcntnt = '메시지를 고정함.';
			break; default:
				msgcntnt = '서버를 부스트했거나 채널 이름이나 아이콘을 변경, 혹은 통화를 시작함.';
		}
	}

	if(!msg['embeds'].length && !msg['system'] && msg['content'].length >= 2) {
		for(var chr=0; chr<msg['content'].length-1; chr++) {
			const emj = String(msg['content'][chr]) + String(msg['content'][chr+1]);
			
			if(emoji.hasEmoji(emj) && emoji.find(emj)['key'] != emj) {
				msgcntnt = msgcntnt.replace(emj, ':' + emoji.find(emj)['key'] + ':');
			}
		}
	}
	
	fs.appendFile('./msg.csv', 
		'"'   + date().str + '",' +
		'"\'' + date().unix + '",' +
		'"\'' + msg.member.user.id + '",' + 
		'"'   + msg.member.user.tag + '",' + 
		'"'   + msg.guild.name + '",' +
		'"'   + msg.channel.name + '",' +
		'"\'' + msg.id + '",' + 
		'"'   + msgcntnt + '",' + 
		'"'   + '삭제' + '"\r\n'
	, x => 3);
});

client.on('typingStart', (channel, user) => fs.appendFile('./msg.csv', 
	'"'   + date().str + '",' +
	'"\'' + date().unix + '",' +
	'"\'' + user.id + '",' + 
	'"'   + user.tag + '",' + 
	'"'   + channel.guild.name + '",' +
	'"'   + channel.name + '",' +
	'"'   + '-' + '",' + 
	'"' + '메시지를 입력하기 시작함.' + '",' + 
	'"'   + '입력' + '"\r\n'
, x => 3));

client.on('typingStop', (channel, user) => fs.appendFile('./msg.csv', 
	'"'   + date().str + '",' +
	'"\'' + date().unix + '",' +
	'"\'' + user.id + '",' + 
	'"'   + user.tag + '",' + 
	'"'   + channel.guild.name + '",' +
	'"'   + channel.name + '",' +
	'"'   + '-' + '",' + 
	'"' + '메시지 입력 멈춤.' + '",' + 
	'"'   + '입력' + '"\r\n'
, x => 3));

client.on('userUpdate', (o, n) => {
	if(o.tag == n.tag) return;
	
	fs.appendFile('./msg.csv', 
		'"'   + date().str + '",' +
		'"\'' + date().unix + '",' +
		'"\'' + o.id + '",' + 
		'"'   + o.tag + '",' + 
		'"'   + '-' + '",' +
		'"'   + '-' + '",' +
		'"'   + '-' + '",' + 
		'"'   + '이름을 ' + o.tag + '에서 ' + n.tag + '(으)로 변경' + '",' + 
		'"'   + '사용자' + '"\r\n'
	, x => 3);
});

const statuses = {
	online:    '온라인',
	idle:      '자리 비움',
	dnd:       '다른 용무 중',
	offline:   '오프라인',
	invisible: '오프라인 표시'
};

client.on('presenceUpdate', (om, nm) => fs.appendFile('./msg.csv', 
	'"'   + date().str + '",' +
	'"\'' + date().unix + '",' +
	'"\'' + om.user.id + '",' + 
	'"'   + om.user.tag + '",' + 
	'"'   + om.guild.name + '",' +
	'"'   + '-' + '",' +
	'"'   + '-' + '",' +
	'"' + (
		om.presence.status != nm.presence.status ? (
			'현재 상태를 ' + statuses[om.presence.status] + '에서 ' + 
			statuses[nm.presence.status] + '으로 변경'
		) : (
			nm.presence.status !== 'offline' && nm.presence.game ? (
				'게임'
			) : (
				'기타 상태 변경'
			)
		)
	) + '",' + 
	'"'   + '상태' + '"\r\n'
, x => 3));

client.on('guildMemberAdd', member => fs.appendFile('./msg.csv', 
	'"'   + date().str + '",' +
	'"\'' + date().unix + '",' +
	'"\'' + member.user.id + '",' + 
	'"'   + member.user.tag + '",' + 
	'"'   + member.guild.name + '",' +
	'"'   + '-' + '",' +
	'"'   + '-' + '",' +
	'"' + '서버에 참가함.' + '",' + 
	'"'   + '길드' + '"\r\n'
, x => 3));

client.on('guildMemberRemove', member => fs.appendFile('./msg.csv', 
	'"'   + date().str + '",' +
	'"\'' + date().unix + '",' +
	'"\'' + member.user.id + '",' + 
	'"'   + member.user.tag + '",' + 
	'"'   + member.guild.name + '",' +
	'"'   + '-' + '",' +
	'"'   + '-' + '",' +
	'"' + '서버를 떠남.' + '",' + 
	'"'   + '길드' + '"\r\n'
, x => 3));

client.on('voiceStateUpdate', (oldMember, newMember) => {
	var newUserChannel = newMember.voiceChannel;
	var oldUserChannel = oldMember.voiceChannel;
	
	var oldch = oldMember.guild.channels.get(oldMember['voiceChannelID']);
	var newch = newMember.guild.channels.get(newMember['voiceChannelID']);

	// print(newMember.guild.channels.);
	// print(oldMember);

	if(oldUserChannel === undefined && newUserChannel !== undefined) {
		fs.appendFile('./msg.csv', 
			'"'   + date().str + '",' +
			'"\'' + date().unix + '",' +
			'"\'' + oldMember.user.id + '",' + 
			'"'   + oldMember.user.tag + '",' + 
			'"'   + oldMember.guild.name + '",' +
			'"\'' + newch.name + '",' +
			'"'   + '-' + '",' +
			'"' + newch.name + ' 통화실에 접속함.' + '",' + 
			'"'   + '음성' + '"\r\n'
		, x => 3);
	} else if(oldUserChannel !== undefined && newUserChannel === undefined) {
		fs.appendFile('./msg.csv', 
			'"'   + date().str + '",' +
			'"\'' + date().unix + '",' +
			'"\'' + oldMember.user.id + '",' + 
			'"'   + oldMember.user.tag + '",' + 
			'"'   + oldMember.guild.name + '",' +
			'"\'' + oldch.name + '",' +
			'"'   + '-' + '",' +
			'"' + oldch.name + ' 통화실을 나감.' + '",' + 
			'"'   + '음성' + '"\r\n'
		, x => 3);
	} else if(oldch.id != newch.id) {
		fs.appendFile('./msg.csv', 
			'"'   + date().str + '",' +
			'"\'' + date().unix + '",' +
			'"\'' + oldMember.user.id + '",' + 
			'"'   + oldMember.user.tag + '",' + 
			'"'   + oldMember.guild.name + '",' +
			'"\'' + newch.name + '",' +
			'"'   + '-' + '",' +
			'"'   + oldch.name + ' 통화실에서 ' + newch.name + ' 통화실로 이동함.' + '",' + 
			'"'   + '음성' + '"\r\n'
		, x => 3);
	} else {
		if(oldMember.serverDeaf != newMember.serverDeaf) {
			fs.appendFile('./msg.csv', 
				'"'   + date().str + '",' +
				'"\'' + date().unix + '",' +
				'"\'' + oldMember.user.id + '",' + 
				'"'   + oldMember.user.tag + '",' + 
				'"'   + oldMember.guild.name + '",' +
				'"\'' + newch.name + '",' +
				'"'   + '-' + '",' +
				'"'   + (
					newMember.serverDeaf ? '서버에 의해 헤드셋 꺼짐' : '서버에 의한 헤드셋 강제 음소거 해제'
				) + '",' + 
				'"'   + '음성' + '"\r\n'
			, x => 3);
		} else if(oldMember.serverMute != newMember.serverMute) {
			fs.appendFile('./msg.csv', 
				'"'   + date().str + '",' +
				'"\'' + date().unix + '",' +
				'"\'' + oldMember.user.id + '",' + 
				'"'   + oldMember.user.tag + '",' + 
				'"'   + oldMember.guild.name + '",' +
				'"\'' + newch.name + '",' +
				'"'   + '-' + '",' +
				'"'   + (
					newMember.serverMute ? '서버에 의해 마이크 꺼짐' : '서버에 의한 마이크 강제 음소거 해제'
				) + '",' + 
				'"'   + '음성' + '"\r\n'
			, x => 3);
		} else if(oldMember.selfDeaf != newMember.selfDeaf) {
			fs.appendFile('./msg.csv', 
				'"'   + date().str + '",' +
				'"\'' + date().unix + '",' +
				'"\'' + oldMember.user.id + '",' + 
				'"'   + oldMember.user.tag + '",' + 
				'"'   + oldMember.guild.name + '",' +
				'"\'' + newch.name + '",' +
				'"'   + '-' + '",' +
				'"'   + (
					newMember.selfDeaf ? '헤드셋 음소거' : '헤드셋 음소거 해제'
				) + '",' + 
				'"'   + '음성' + '"\r\n'
			, x => 3);
		} else if(oldMember.selfMute != newMember.selfMute) {
			fs.appendFile('./msg.csv', 
				'"'   + date().str + '",' +
				'"\'' + date().unix + '",' +
				'"\'' + oldMember.user.id + '",' + 
				'"'   + oldMember.user.tag + '",' + 
				'"'   + oldMember.guild.name + '",' +
				'"\'' + newch.name + '",' +
				'"'   + '-' + '",' +
				'"'   + (
					newMember.selfMute ? '마이크 음소거' : '마이크 음소거 해제'
				) + '",' + 
				'"'   + '음성' + '"\r\n'
			, x => 3);
		}
	}
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
	function find(snowflake, collection) {
		var retval = false;
		collection.forEach(item => {
			if(item.id == snowflake) retval = true;
		});
		
		return retval;
	}
	
	var msgstr = '';
	
	const Permissions = DJS11.Permissions;
	var oldarr = [], newarr = [];
	
	oldMember.roles.forEach(role => {
		if(!find(role.id, newMember.roles)) {
			msgstr = role.name + ' 역할 회수';
		}
		try {
			oldarr = oldarr.concat(new Permissions(role.permissions).toArray());
		} catch(e) {}
	});
	
	newMember.roles.forEach(role => {
		if(!find(role.id, oldMember.roles)) {
			msgstr = role.name + ' 역할 부여';
		}
		try {
			newarr = newarr.concat(new Permissions(role.permissions).toArray());
		} catch(e) {}
	});
	
	if(!msgstr) return;
	
	oldarr = oldarr.filter((a, b, c) => c.indexOf(a) == b);
	newarr = newarr.filter((a, b, c) => c.indexOf(a) == b);
	
	var ret = '';
	
	for(perm in Permissions.FLAGS) {
		if(!oldarr.includes(perm) && newarr.includes(perm)) {
			ret += '+' + perm.toLowerCase() + ' ';
		}
		else if(oldarr.includes(perm) && !newarr.includes(perm)) {
			ret += '-' + perm.toLowerCase() + ' ';
		}
	}
	
	fs.appendFile('./msg.csv', 
		'"'   + date().str + '",' +
		'"\'' + date().unix + '",' +
		'"\'' + oldMember.user.id + '",' + 
		'"'   + oldMember.user.tag + '",' + 
		'"'   + oldMember.guild.name + '",' +
		'"'   + '-' + '",' +
		'"'   + '-' + '",' +
		'"' + '사용자 권한 설정 [대상: ' + newMember.user.username + '] [역할: ' + msgstr + '] [권한: ' + (ret ? ret : '변경 없음') + ']' + '",' + 
		'"'   + '길드' + '"\r\n'
	, x => 3);
});

client.on('messageUpdate', (o, msg) => {
	var msgcntnt = msg.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/["]/g, '""');
	
	if(msg['embeds'].length && !msg.content) {
		for(var embed of msg['embeds']) {
			msgcntnt += `${embed['title'] || msg.author.username}: ${embed['description']}\n`;
		}
	}
	if(msg['system']) {
		switch(msg['type']) {
			case 'GUILD_MEMBER_JOIN':
				msgcntnt = '서버에 참가함.';
			break; case 'PINS_ADD':
				msgcntnt = '메시지를 고정함.';
			break; default:
				msgcntnt = '서버를 부스트했거나 채널 이름이나 아이콘을 변경, 혹은 통화를 시작함.';
		}
	}
	
	fs.appendFile('./msg.csv', 
		'"'   + date().str + '",' +
		'"\'' + date().unix + '",' +
		'"\'' + msg.member.user.id + '",' + 
		'"'   + msg.member.user.tag + '",' + 
		'"'   + msg.guild.name + '",' +
		'"'   + msg.channel.name + '",' +
		'"\'' + msg.id + '",' + 
		'"'   + msgcntnt + '",' + 
		'"'   + '수정' + '"\r\n'
	, x => 3);
});

client.on('messageReactionAdd', (reaction, user) => {
	var emkey = reaction['_emoji']['name'];

	if(emoji.hasEmoji(emkey)) {
		emkey = emoji.find(emkey)['key'];
	}

	const message = reaction['message']['content'];  // 1
	const username = user.username;  // 2
	const emojichr = reaction['_emoji']['name'];  // 3
	const channel = reaction['message']['channel']['id'];  // 4
	const emojikey = emkey;  // 5
	const userid = user.id;  // 6
	const server = client.channels.get(channel).guild.id;
	
	fs.appendFile('./msg.csv', 
		'"'   + date().str + '",' +
		'"\'' + date().unix + '",' +
		'"\'' + user.id + '",' + 
		'"'   + user.tag + '",' + 
		'"'   + reaction.message.guild.name + '",' +
		'"'   + reaction.message.channel.name + '",' +
		'"\'' + reaction.message.id + '",' +
		'"'   + emojikey + '로 반응함.' + '",' + 
		'"'   + '반응' + '"\r\n'
	, x => 3);
});

client.on('messageReactionRemove', (reaction, user) => {
	fs.appendFile('./msg.csv', 
		'"'   + date().str + '",' +
		'"\'' + date().unix + '",' +
		'"\'' + user.id + '",' + 
		'"'   + user.tag + '",' + 
		'"'   + reaction.message.guild.name + '",' +
		'"'   + reaction.message.channel.name + '",' +
		'"\'' + reaction.message.id + '",' +
		'"'   + emojikey + ' 반응을 지움.' + '",' + 
		'"'   + '반응' + '"\r\n'
	, x => 3);
});

client.on('message', msg => {
	if(msg.guild.id == '707851339828297759') return;
	
	function download(url) {
		request.get(url)
			.on('response', r => print('완료!'))
			.pipe(fs.createWriteStream('./' + String(Math.floor(Math.random() * 100000000)) + '_' + msg.attachments.first().filename.replace(/(?:[^A-Za-zㄱ-힣0-9. _-])/g, '')));
	}
	
	print('>>> ' + msg.content.replace(/\n/g, ' '));
	
	const dt = date(Number(msg['createdTimestamp'])), tsp = dt.str;
	var msgcntnt = msg.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/["]/g, '""');
	var flag = '일반';
	
	if(msg['embeds'].length && !msg.content) {
		flag = '임베드';
		for(var embed of msg['embeds']) {
			msgcntnt += `${embed['title'] || msg.author.username}: ${embed['description']}\n`;
		}
	}
	if(msg['system']) {
		flag = '시스템';
		switch(msg['type']) {
			case 'GUILD_MEMBER_JOIN':
				msgcntnt = '서버에 참가함.';
			break; case 'PINS_ADD':
				msgcntnt = '메시지를 고정함.';
			break; default:
				msgcntnt = '서버를 부스트했거나 채널 이름이나 아이콘을 변경, 혹은 통화를 시작함.';
		}
	}

	if(!msg['embeds'].length && !msg['system'] && msg['content'].length >= 2) {
		for(var chr=0; chr<msg['content'].length-1; chr++) {
			const emj = String(msg['content'][chr]) + String(msg['content'][chr+1]);
			
			if(emoji.hasEmoji(emj) && emoji.find(emj)['key'] != emj) {
				msgcntnt = msgcntnt.replace(emj, ':' + emoji.find(emj)['key'] + ':');
			}
		}
	}
	
	fs.appendFile('./msg.csv', 
		'"'   + tsp + '",' +
		'"\'' + dt.unix + '",' +
		'"\'' + msg.member.user.id + '",' + 
		'"'   + msg.member.user.tag + '",' + 
		'"'   + msg.guild.name + '",' +
		'"'   + msg.channel.name + '",' +
		'"\'' + msg.id + '",' + 
		'"'   + msgcntnt + '",' + 
		'"'   + flag + '"\r\n'
	, x => 3);
	
	var num = 0;
	msg.attachments.forEach(attachment => {
		write('<<< 첨부파일 ' + msg.attachments.size + '개 중 ' + ++num + '번째 다운로드 중... ');
		download(attachment.url);
	});
});
