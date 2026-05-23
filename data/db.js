// 数据源 - 可替换为 localStorage 或 API
const DB = {

  tweets: [
    {id:1,name:"林小雨",handle:"@linxiaoyu",verified:true,time:"2小时",text:"今天用 AI 写了一段代码，效率提升了三倍。以前需要半天的工作，现在一小时搞定。技术真的在改变我们的工作方式 🚀",avatar:"林",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:1024,retweets:238,replies:56,views:"8.3万",liked:true,retweeted:false,bookmarked:false,listTags:[1,2]},
    {id:2,name:"科技日报",handle:"@techdaily",verified:true,time:"4小时",text:"【重磅】国内首款自研芯片正式量产，性能超越国际同类产品20%。这标志着我国在半导体领域取得重大突破，打破了长期以来的技术封锁。",avatar:"科",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",likes:5820,retweets:2341,replies:428,views:"42万",liked:false,retweeted:false,bookmarked:false},
    {id:3,name:"创业老王",handle:"@chuangyelaowang",verified:false,time:"6小时",text:"创业第三年的感悟：\n\n1. 找到真正的痛点比找资金更重要\n2. 团队比产品更关键\n3. 现金流是命脉\n4. 不要追风口，要做有价值的事\n5. 失败是最好的老师\n\n共勉 💪",avatar:"王",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",likes:892,retweets:445,replies:103,views:"6.1万",liked:false,retweeted:false,bookmarked:false,listTags:[3]},
    {id:4,name:"摄影师阿明",handle:"@photographer_aming",verified:false,time:"8小时",text:"早晨六点的城市，属于少数清醒的人。",avatar:"阿",avatarBg:"linear-gradient(135deg,#43e97b,#38f9d7)",likes:3201,retweets:189,replies:67,views:"15万",liked:false,retweeted:false,bookmarked:false,media:[
      {bg:"linear-gradient(135deg,#0f2027,#203a43,#2c5364)",icon:"🏙️"},
      {bg:"linear-gradient(135deg,#e65c00,#f9d423)",icon:"🌅"},
      {bg:"linear-gradient(135deg,#232526,#414345)",icon:"🌆"},
      {bg:"linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d)",icon:"🌄"}
    ]},
    {id:5,name:"前端开发者社区",handle:"@fe_community",verified:true,time:"10小时",text:"Vue 4.0 正式发布！主要更新：\n• 全新编译器，性能提升 50%\n• 更好的 TypeScript 支持\n• 全新的响应式系统\n• 更小的包体积\n\n大家都用上了吗？评论区分享体验！",avatar:"前",avatarBg:"linear-gradient(135deg,#fa709a,#fee140)",likes:4567,retweets:1823,replies:312,views:"28.9万",liked:false,retweeted:false,bookmarked:false,listTags:[1],poll:{tweetId:5,endsIn:"还剩18小时",options:[{label:"已经用上了，体验很好",votes:4521},{label:"准备升级，观望中",votes:2341},{label:"还在用 Vue 3，暂时不升级",votes:1678},{label:"不用 Vue，路过看看",votes:892}]},media:[
      {bg:"linear-gradient(135deg,#42b883,#35495e)",icon:"💚"},
      {bg:"linear-gradient(135deg,#42b883,#64d8a0)",icon:"🚀"}
    ]},
    {id:6,name:"每日财经",handle:"@daily_finance",verified:true,time:"12小时",text:"今日市场回顾：A股三大指数全线上涨，沪指涨1.2%，深成指涨1.8%，创业板涨2.3%。新能源、半导体、AI板块领涨。",avatar:"财",avatarBg:"linear-gradient(135deg,#a18cd1,#fbc2eb)",likes:721,retweets:356,replies:89,views:"5.4万",liked:false,retweeted:false,bookmarked:false},
    {id:7,name:"电影爱好者",handle:"@movie_fan2026",verified:false,time:"14小时",text:"强烈推荐这部电影！《星际穿越》重映，诺兰的宏大叙事和汉斯·季默的配乐依然震撼。每一帧都是艺术品。",avatar:"电",avatarBg:"linear-gradient(135deg,#ffecd2,#fcb69f)",likes:2341,retweets:876,replies:201,views:"19.2万",liked:false,retweeted:false,bookmarked:false,media:[
      {bg:"linear-gradient(135deg,#0c0c1d,#1a1a3e,#2d1b69)",icon:"🎬"}
    ]},
    {id:8,name:"产品经理小李",handle:"@pm_xiaoli",verified:true,time:"16小时",text:"好的产品不是功能堆砌出来的，而是对用户需求的深刻理解。少即是多，克制是一种能力。",avatar:"李",avatarBg:"linear-gradient(135deg,#a1c4fd,#c2e9fb)",likes:1823,retweets:934,replies:156,views:"12.8万",liked:true,retweeted:false,bookmarked:false},
    {id:9,name:"美食达人",handle:"@foodie_daily",verified:false,time:"18小时",text:"分享一家藏在巷子里的老字号砂锅粥，开了三十年了。地址就在城隍庙后街，每天限量供应，去晚了可就没有啦！",avatar:"美",avatarBg:"linear-gradient(135deg,#ff9a9e,#fecfef)",likes:1567,retweets:234,replies:89,views:"8.7万",liked:false,retweeted:false,bookmarked:false},
    {id:10,name:"旅行家小周",handle:"@travel_zhou",verified:true,time:"20小时",text:"刚从西藏回来，洗涤心灵之旅。青藏高原的天空蓝得不像真的，牦牛比人还多。强烈建议大家有机会都去一次！",avatar:"旅",avatarBg:"linear-gradient(135deg:#a8edea,#fed6e3)",likes:4523,retweets:1234,replies:345,views:"32.1万",liked:false,retweeted:false,bookmarked:false,media:[{bg:"linear-gradient(135deg,#56ab2f,#a8e063)",icon:"🏔️"},{bg:"linear-gradient(135deg,#2193b0,#6dd5ed)",icon:"🏖️"},{bg:"linear-gradient(135deg,#ee9ca7,#ffdde1)",icon:"🕊️"}]},
    {id:11,name:"程序员老张",handle:"@coder_laozhang",verified:false,time:"22小时",text:"写代码十年了，最大的感悟是：注释不是给机器看的，是给未来的自己看的。别偷懒，写好注释。",avatar:"程",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:2341,retweets:567,replies:123,views:"15.6万",liked:false,retweeted:false,bookmarked:false},
    {id:12,name:"游戏评测师",handle:"@game_reviewer",verified:true,time:"1天前",text:"《黑神话：悟空》DLC终于来了！新增三个章节，Boss战难度爆表，画质又有提升。STEAM直接冲！",avatar:"游",avatarBg:"linear-gradient(135deg,#667eea,#f093fb)",likes:8923,retweets:3456,replies:678,views:"67.8万",liked:false,retweeted:false,bookmarked:false,poll:{tweetId:12,endsIn:"还剩2天",options:[{label:"已经买了，太好玩了！",votes:6721},{label:"准备入手",votes:3456},{label:"等打折再买",votes:1892}]}},
    {id:13,name:"健身教练阿杰",handle:"@fitness_ajie",verified:false,time:"1天前",text:"减脂不是饿肚子，是调整饮食结构。给大家分享我的每日三餐食谱，简单易做，亲测有效！",avatar:"健",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",likes:1234,retweets:456,replies:234,views:"9.2万",liked:false,retweeted:false,bookmarked:false},
    {id:14,name:"音乐博主小雅",handle:"@music_xiaoya",verified:false,time:"1天前",text:"推荐一首最近单曲循环的歌《漠河舞厅》，听完让人想起那些错过的爱情和再也回不去的时光。",avatar:"音",avatarBg:"linear-gradient(135deg,#fa709a,#fee140)",likes:3456,retweets:1234,replies:456,views:"23.4万",liked:false,retweeted:false,bookmarked:false},
    {id:15,name:"读书笔记",handle:"@book_notes",verified:false,time:"1天前",text:"《人类简史》读完了，最震撼的观点是：人类之所以能统治地球，是因为我们能够想象不存在的东西。这是认知革命的核心。",avatar:"书",avatarBg:"linear-gradient(135deg,#a18cd1,#fbc2eb)",likes:987,retweets:234,replies:78,views:"6.5万",liked:false,retweeted:false,bookmarked:false},
    {id:16,name:"科技极客",handle:"@tech_geek",verified:true,time:"2天前",text:"苹果又发布新品了！iPhone 18 配置曝光：A20芯片 + 8K屏幕 + 固态按键。这次牙膏挤得有点多啊。",avatar:"极",avatarBg:"linear-gradient(135deg,#43e97b,#38f9d7)",likes:5678,retweets:2345,replies:567,views:"45.6万",liked:false,retweeted:false,bookmarked:false},
    {id:17,name:"宠物博主",handle:"@pet_blog",verified:false,time:"2天前",text:"我家猫主子今天学会了开柜门！养猫的都知道，猫的智商真的是被低估了。它们只是在装傻而已 😺",avatar:"宠",avatarBg:"linear-gradient(135deg,#ffecd2,#fcb69f)",likes:7891,retweets:2345,replies:789,views:"56.7万",liked:false,retweeted:false,bookmarked:false},
    {id:18,name:"法律顾问",handle:"@legal_advisor",verified:true,time:"2天前",text:"很多创业者容易忽视的法律风险：股权分配、知识产权保护、劳动纠纷。建议创业初期就找专业律师咨询，别等出问题再后悔。",avatar:"法",avatarBg:"linear-gradient(135deg,#a1c4fd,#c2e9fb)",likes:456,retweets:123,replies:45,views:"3.2万",liked:false,retweeted:false,bookmarked:false},
    {id:19,name:"心理咨询师",handle:"@psychologist_ai",verified:true,time:"3天前",text:"焦虑的本质是对未来的恐惧。当你感到焦虑时，试着把注意力拉回当下。深呼吸，问自己：现在能做什么？",avatar:"心",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",likes:2345,retweets:678,replies:234,views:"18.9万",liked:false,retweeted:false,bookmarked:false},
    {id:20,name:"天文爱好者",handle:"@astro_fan",verified:false,time:"3天前",text:"今晚有流星雨！预计每小时可以看到120颗流星。高峰期在凌晨2点到4点，找个光污染少的地方，带上你的愿望去吧！",avatar:"天",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:6789,retweets:3456,replies:890,views:"52.3万",liked:false,retweeted:false,bookmarked:false},
    {id:21,name:"历史老师王",handle:"@history_teacher",verified:true,time:"3天前",text:"唐朝为什么能成为历史上最开放的朝代？因为李家人有胡人血统，文化包容性强。这说明什么？开放带来繁荣。",avatar:"历",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",likes:1234,retweets:345,replies:123,views:"8.9万",liked:false,retweeted:false,bookmarked:false},
    {id:22,name:"时尚博主",handle:"@fashion_blog",verified:false,time:"4天前",text:"2026年流行色预测：#年度代表色「PANTONE 15-1335」Terra Rose 陶土玫瑰，温暖又高级！这件单品你入手了吗？",avatar:"时",avatarBg:"linear-gradient(135deg,#fa709a,#fee140)",likes:3456,retweets:890,replies:234,views:"21.7万",liked:false,retweeted:false,bookmarked:false},
    {id:23,name:"户外运动",handle:"@outdoor_sports",verified:false,time:"4天前",text:"徒步穿越可可西里，终于看到了藏羚羊！这是世界上最艰苦的徒步路线之一，但也是最震撼的。高原反应真的要命，但值了。",avatar:"户",avatarBg:"linear-gradient(135deg,#43e97b,#38f9d7)",likes:4567,retweets:1234,replies:345,views:"34.5万",liked:false,retweeted:false,bookmarked:false},
    {id:24,name:"科技评论员",handle:"@tech_critic",verified:true,time:"5天前",text:"OpenAI 发布 GPT-5，性能提升10倍。这次直接能写小说、做设计、编音乐了。留给人类的时间不多了？",avatar:"评",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:8901,retweets:4567,replies:1234,views:"78.9万",liked:false,retweeted:false,bookmarked:false,listTags:[2]},
    {id:25,name:"教育工作者",handle:"@edu_worker",verified:false,time:"5天前",text:"教育的本质是点燃火焰，不是灌满容器。现在AI时代，死记硬背已经没用了，培养创造力和批判性思维才是关键。",avatar:"教",avatarBg:"linear-gradient(135deg,#a18cd1,#fbc2eb)",likes:1678,retweets:456,replies:178,views:"11.2万",liked:false,retweeted:false,bookmarked:false},
    {id:26,name:"养生专家",handle:"@health_expert",verified:false,time:"6天前",text:"早起第一杯水要喝温的，不要喝凉的。晚上11点前必须睡觉，这是养肝的黄金时间。健康是最大的财富。",avatar:"养",avatarBg:"linear-gradient(135deg,#ff9a9e,#fecfef)",likes:2345,retweets:567,replies:234,views:"15.8万",liked:false,retweeted:false,bookmarked:false},
    {id:27,name:"投资顾问",handle:"@invest_advisor",verified:true,time:"6天前",text:"2026年投资建议：配置30%股票、30%债券、20%黄金、20%现金。不要把鸡蛋放在一个篮子里，分散风险才是王道。",avatar:"投",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",likes:3456,retweets:890,replies:345,views:"26.4万",liked:false,retweeted:false,bookmarked:false},
    {id:28,name:"摄影技巧",handle:"@photo_tips",verified:false,time:"7天前",text:"学会这三招，手机也能拍大片：1️⃣ 利用光线 2️⃣ 三分构图 3️⃣ 后期调色。收藏起来慢慢练！",avatar:"摄",avatarBg:"linear-gradient(135deg,#fa709a,#fee140)",likes:5678,retweets:2345,replies:678,views:"42.3万",liked:false,retweeted:false,bookmarked:false},
    {id:29,name:"程序员小明",handle:"@coder_xiaoming",verified:false,time:"7天前",text:"为什么程序员喜欢用命令行？因为GUI是给用户用的，我们是来控制电脑的，不是被电脑控制的。",avatar:"程",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:3456,retweets:1234,replies:456,views:"25.1万",liked:false,retweeted:false,bookmarked:false},
    {id:30,name:"生活小妙招",handle:"@life_hacks",verified:false,time:"1周前",text:"把过期牛奶用来浇花，花会长得特别好！还有用香蕉皮擦皮鞋，鞋子又亮又干净。这些生活小妙招你都知道吗？",avatar:"生",avatarBg:"linear-gradient(135deg:#43e97b,#38f9d7)",likes:4567,retweets:1678,replies:456,views:"35.6万",liked:false,retweeted:false,bookmarked:false},
    {id:101,name:"王坤",handle:"@wangkun",verified:false,time:"4月9日",text:"26.4、9 天气有点冷 下雨",avatar:"王",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:3,retweets:0,replies:3,views:"98",liked:false,retweeted:false,bookmarked:false},
    {id:102,name:"王坤",handle:"@wangkun",verified:false,time:"3月27日",text:"又快清明节了",avatar:"王",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",likes:5,retweets:0,replies:0,views:"108",liked:false,retweeted:false,bookmarked:false}
  ],
  notifications: [
    {id:1,type:"mention",name:"S.",handle:"@s_example",avatar:"S",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",text:"So, let me get this straight. We're not entitled to clean water, but AI data centers are???",time:"2小时",unread:true,extra:{icon:"star",iconColor:"#a855f7"},target:"",tweetId:3},
    {id:2,type:"follow",name:"诗雅",handle:"@shiya",avatar:"诗",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",text:"关注了你",time:"4月27日",unread:true},
    {id:3,type:"like",name:"はるみ@おふぱこ/プロフ見てね",handle:"@harumi",avatar:"は",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",text:"喜欢了你的回复",time:"4月19日",unread:false,target:"多大",multi:true,others:[{avatar:"は",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)"}],tweetId:1},
    {id:4,type:"like",name:"Amelia",handle:"@amelia",avatar:"A",avatarBg:"linear-gradient(135deg,#43e97b,#38f9d7)",text:"喜欢了你的回复",time:"4月19日",unread:false,target:"哪里的",tweetId:5},
    {id:5,type:"like",name:"无",handle:"@wu",avatar:"无",avatarBg:"linear-gradient(135deg,#fa709a,#fee140)",text:"和另外 2 人喜欢了你的回复",time:"4月16日",unread:false,target:"无聊的一笔",multi:true,others:[{avatar:"",avatarBg:"#333"},{avatar:"",avatarBg:"#555"}],tweetId:8},
    {id:6,type:"follow",name:"张伟",handle:"@zhangwei",avatar:"张",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",text:"关注了你",time:"5小时前",unread:false},
    {id:7,type:"like",name:"李娜",handle:"@lina_tech",avatar:"李",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",text:"赞了你的帖子",time:"1小时前",unread:true,target:"今天用 AI 写了一段代码...",tweetId:1},
    {id:8,type:"reply",name:"王珊珊",handle:"@wangshanshan",avatar:"王",avatarBg:"linear-gradient(135deg,#fa709a,#fee140)",text:"回复了你的帖子：说的太对了！",time:"3小时前",unread:true,target:"创业第三年的感悟",tweetId:3},
    {id:9,type:"mention",name:"科技日报",handle:"@techdaily",avatar:"科",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",text:"提及了你：@wangkun",time:"6小时前",unread:false,target:"今天 AI 领域又有新突破",tweetId:2}
  ],
  messages: [
    {id:1,name:"张伟",handle:"@zhangwei",avatar:"张",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",preview:"好的，明天见！",time:"14:32",unread:1,online:true,messages:[
      {sent:false,text:"你好，看了你的帖子很有感触",time:"今天 14:20"},
      {sent:true,text:"谢谢！你是做什么工作的？",time:"今天 14:22"},
      {sent:false,text:"我是产品经理，也在关注 AI 领域",time:"今天 14:25"},
      {sent:false,text:"有空可以聊聊合作",time:"今天 14:26"},
      {sent:true,text:"好的，明天见！",time:"今天 14:32"}
    ]},
    {id:2,name:"李娜",handle:"@lina_tech",avatar:"李",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",preview:"那个开源项目有兴趣一起做吗",time:"昨天",unread:0,online:true,messages:[
      {sent:false,text:"嗨，王坤",time:"昨天 10:00"},
      {sent:false,text:"看到你做的「言」App 很棒",time:"昨天 10:01"},
      {sent:true,text:"谢谢夸奖！有什么建议吗？",time:"昨天 10:15"},
      {sent:false,text:"那个开源项目有兴趣一起做吗",time:"昨天 10:20"}
    ]},
    {id:3,name:"陈明",handle:"@chenming_ai",avatar:"陈",avatarBg:"linear-gradient(135deg,#43e97b,#38f9d7)",preview:"下周技术分享会你能来吗",time:"周一",unread:2,online:false,messages:[
      {sent:false,text:"王坤，下周技术分享会你能来吗",time:"周一 09:00"}
    ]}
  ],
  replies: {
    2: [
      {id:201,replyTo:2,name:"程序员小张",handle:"@coder_zhang",avatar:"张",avatarBg:"linear-gradient(135deg,#4facfe,#00f2fe)",time:"3小时前",text:"太激动了！终于等到了这一天！国产芯片加油 💪",likes:342,liked:false},
      {id:202,replyTo:2,name:"科技爱好者",handle:"@techfan",avatar:"科",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",time:"3小时前",text:"期待更多突破，打破技术封锁！",likes:189,liked:false}
    ],
    5: [
      {id:203,replyTo:5,name:"Vue开发者",handle:"@vue_dev",avatar:"V",avatarBg:"#42b883;color:#fff",time:"9小时前",text:"已经用上了，性能确实提升明显！编译速度感觉快了一倍",likes:567,liked:false},
      {id:204,replyTo:5,name:"前端新手",handle:"@fe_newbie",avatar:"新",avatarBg:"linear-gradient(135deg,#a1c4fd,#c2e9fb)",time:"9小时前",text:"刚升级，还在适应新语法，不过文档写得很清楚",likes:234,liked:false}
    ],
    101: [
      {id:205,replyTo:101,name:"林小雨",handle:"@linxiaoyu",avatar:"林",avatarBg:"linear-gradient(135deg,#667eea,#764ba2)",time:"4月9日",text:"注意保暖啊！最近天气变化太大了 😷",likes:12,liked:false},
      {id:206,replyTo:101,name:"陈明",handle:"@chenming_ai",avatar:"陈",avatarBg:"linear-gradient(135deg,#43e97b,#38f9d7)",time:"4月9日",text:"这边也是，早上还得穿外套",likes:8,liked:false},
      {id:207,replyTo:101,name:"产品经理小李",handle:"@pm_xiaoli",avatar:"李",avatarBg:"linear-gradient(135deg,#a1c4fd,#c2e9fb)",time:"4月9日",text:"记得带伞 ☔",likes:5,liked:false}
    ],
    102: [
      {id:208,replyTo:102,name:"张伟",handle:"@zhangwei",avatar:"张",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",time:"3月27日",text:"时间过得真快，又要清明扫墓了 🙏",likes:3,liked:false},
      {id:209,replyTo:102,name:"诗雅",handle:"@shiya",avatar:"诗",avatarBg:"linear-gradient(135deg,#f093fb,#f5576c)",time:"3月27日",text:"是啊，准备回老家一趟",likes:2,liked:false}
    ]
  },
  bookmarks: [1, 5, 8, 12, 19, 24],
  searchResults: [],
  likersList: [
    {name:'林小雨',handle:'@linxiaoyu',avatar:'林',avatarBg:'linear-gradient(135deg,#667eea,#764ba2)',verified:true,following:true},
    {name:'はるみ',handle:'@harumi',avatar:'は',avatarBg:'linear-gradient(135deg,#4facfe,#00f2fe)',verified:false,following:false},
    {name:'Amelia',handle:'@amelia',avatar:'A',avatarBg:'linear-gradient(135deg,#43e97b,#38f9d7)',verified:false,following:false},
    {name:'诗雅',handle:'@shiya',avatar:'诗',avatarBg:'linear-gradient(135deg,#f093fb,#f5576c)',verified:false,following:true},
    {name:'无',handle:'@wu',avatar:'无',avatarBg:'linear-gradient(135deg,#fa709a,#fee140)',verified:false,following:false}
  ]

};
