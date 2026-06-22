// -*- coding: utf-8 -*-
// AZIKのローマ字マッピング辞書定義
export interface AzikMapping {
  normal: string[]; // 通常のローマ字入力パターン
  azik: string[];   // AZIKでの推奨・短縮入力パターン
}

export interface AzikSegment {
  kana: string;     // ひらがな音節 (例: "かん")
  normal: string[]; // 許容する通常ローマ字 (例: ["kan"])
  azik: string[];   // 許容するAZIK短縮ローマ字 (例: ["kz", "kn"])
}

export interface TypingWord {
  kanji: string;      // 表示用漢字 (例: "簡単")
  kana: string;       // ひらがな (例: "かんたん")
  segments: AzikSegment[]; // 解析済みの音節セグメント
}

export interface StageData {
  id: string;
  category: "Lev1" | "Lev2a" | "Lev2b" | "Lev3a" | "Lev3b" | "Lev4" | "Practice" | "Challenge";
  azikLevel?: string;  // 最大許容AZIKレベル (wordValidator.AzikLevel)
  name: string;
  description: string;
  concept?: string;    // ステージのコンセプト・採用語句のルール説明
  words: Omit<TypingWord, "segments">[]; // 登録単語（実行時に自動でsegmentsを生成する）
}

// -------------------------------------------------------------
// AZIK デフォルト変換辞書データベース
// -------------------------------------------------------------
export const AZIK_DICTIONARY: Record<string, AzikMapping> = {
  // --- 1文字の母音・特殊子音 ---
  "あ": { normal: ["a"], azik: ["a"] },
  "い": { normal: ["i"], azik: ["i"] },
  "う": { normal: ["u"], azik: ["u"] },
  "え": { normal: ["e"], azik: ["e"] },
  "お": { normal: ["o"], azik: ["o"] },
  "ん": { normal: ["nn", "xn"], azik: ["q"] },
  "っ": { normal: ["ltu", "ltsu", "xtu"], azik: [";"] },
  "ー": { normal: ["-"], azik: ["-", ":"] },

  // --- 小書き仮名 (外来語表記用フォールバック) ---
  // ぁぃぅぇぉ: azik では x は し行専用（xa=しゃ等、2文字）と被るため x+単母音を除外。
  // ゃゅょ: xya/xyu/xyo は し行 xa/xi/xu/xe/xo と3文字 vs 2文字で別キー。競合なし、そのまま。
  "ぁ": { normal: ["xa", "la"], azik: ["la"] },
  "ぃ": { normal: ["xi", "li"], azik: ["li"] },
  "ぅ": { normal: ["xu", "lu"], azik: ["lu"] },
  "ぇ": { normal: ["xe", "le"], azik: ["le"] },
  "ぉ": { normal: ["xo", "lo"], azik: ["lo"] },
  "ゃ": { normal: ["xya", "lya"], azik: ["xya"] },
  "ゅ": { normal: ["xyu", "lyu"], azik: ["xyu"] },
  "ょ": { normal: ["xyo", "lyo"], azik: ["xyo"] },

  // --- 五十音（清音） ---
  "か": { normal: ["ka"], azik: ["ka"] },
  "き": { normal: ["ki"], azik: ["ki", "kf"] },
  "く": { normal: ["ku"], azik: ["ku"] },
  "け": { normal: ["ke"], azik: ["ke"] },
  "こ": { normal: ["ko"], azik: ["ko"] },


  "さ": { normal: ["sa"], azik: ["sa"] },
  "し": { normal: ["si", "shi"], azik: ["si", "shi"] },
  "す": { normal: ["su"], azik: ["su"] },
  "せ": { normal: ["se"], azik: ["se"] },
  "そ": { normal: ["so"], azik: ["so"] },

  "た": { normal: ["ta"], azik: ["ta"] },
  "ち": { normal: ["ti", "chi"], azik: ["ti", "chi"] },
  "つ": { normal: ["tu", "tsu"], azik: ["tu", "tsu"] },
  "て": { normal: ["te"], azik: ["te"] },
  "と": { normal: ["to"], azik: ["to"] },

  "な": { normal: ["na"], azik: ["na"] },
  "に": { normal: ["ni"], azik: ["ni"] },
  "ぬ": { normal: ["nu"], azik: ["nu", "nf"] },
  "ね": { normal: ["ne"], azik: ["ne"] },
  "の": { normal: ["no"], azik: ["no"] },

  "は": { normal: ["ha"], azik: ["ha"] },
  "ひ": { normal: ["hi"], azik: ["hi"] },
  "ふ": { normal: ["hu", "fu"], azik: ["hu", "fu", "hf"] },
  "へ": { normal: ["he"], azik: ["he"] },
  "ほ": { normal: ["ho"], azik: ["ho"] },

  "ま": { normal: ["ma"], azik: ["ma"] },
  "み": { normal: ["mi"], azik: ["mi"] },
  "む": { normal: ["mu"], azik: ["mu", "mf"] },
  "め": { normal: ["me"], azik: ["me"] },
  "も": { normal: ["mo"], azik: ["mo"] },

  "や": { normal: ["ya"], azik: ["ya"] },
  "ゆ": { normal: ["yu"], azik: ["yu", "yf"] },
  "よ": { normal: ["yo"], azik: ["yo"] },

  "ら": { normal: ["ra"], azik: ["ra"] },
  "り": { normal: ["ri"], azik: ["ri"] },
  "る": { normal: ["ru"], azik: ["ru"] },
  "れ": { normal: ["re"], azik: ["re"] },
  "ろ": { normal: ["ro"], azik: ["ro"] },

  "わ": { normal: ["wa"], azik: ["wa"] },
  "を": { normal: ["wo"], azik: ["wo"] },

  // --- 濁音・半濁音 ---
  "が": { normal: ["ga"], azik: ["ga"] },
  "ぎ": { normal: ["gi"], azik: ["gi"] },
  "ぐ": { normal: ["gu"], azik: ["gu"] },
  "げ": { normal: ["ge"], azik: ["ge"] },
  "ご": { normal: ["go"], azik: ["go"] },

  "ざ": { normal: ["za"], azik: ["za", "zc"] },
  "じ": { normal: ["zi", "ji"], azik: ["zi", "ji"] },
  "ず": { normal: ["zu"], azik: ["zu"] },
  "ぜ": { normal: ["ze"], azik: ["ze", "zf"] },
  "ぞ": { normal: ["zo"], azik: ["zo"] },

  "だ": { normal: ["da"], azik: ["da"] },
  "ぢ": { normal: ["di"], azik: ["di"] },
  "づ": { normal: ["du"], azik: ["du"] },
  "で": { normal: ["de"], azik: ["de", "df"] },
  "ど": { normal: ["do"], azik: ["do"] },

  "ば": { normal: ["ba"], azik: ["ba"] },
  "び": { normal: ["bi"], azik: ["bi"] },
  "ぶ": { normal: ["bu"], azik: ["bu"] },
  "べ": { normal: ["be"], azik: ["be"] },
  "ぼ": { normal: ["bo"], azik: ["bo"] },

  "ぱ": { normal: ["pa"], azik: ["pa"] },
  "ぴ": { normal: ["pi"], azik: ["pi"] },
  "ぷ": { normal: ["pu"], azik: ["pu"] },
  "ぺ": { normal: ["pe"], azik: ["pe"] },
  "ぽ": { normal: ["po"], azik: ["po"] },

  // --- 撥音拡張（〜ん） ---
  // SKK互換: 母音キー (a/i/u/e/o) は打鍵で即確定するため「母音+拡張キー」の組み合わせは不可。
  // あん/いん/うん/えん/おん は「母音 + ん[q]」の2打として入力する（例: うん → u+q）。
  // 子音前置パターン (かん=kz, しん=sk 等) のみAZIK短縮対象。

  "かん": { normal: ["kan"], azik: ["kz"] },
  "きん": { normal: ["kin"], azik: ["kk"] },
  "くん": { normal: ["kun"], azik: ["kj"] },
  "けん": { normal: ["ken"], azik: ["kd"] },
  "こん": { normal: ["kon"], azik: ["kl"] },

  "さん": { normal: ["san"], azik: ["sz"] },
  "しん": { normal: ["sin", "shin"], azik: ["sk"] },
  "すん": { normal: ["sun"], azik: ["sj"] },
  "せん": { normal: ["sen"], azik: ["sd"] },
  "そん": { normal: ["son"], azik: ["sl"] },

  "たん": { normal: ["tan"], azik: ["tz"] },
  "ちん": { normal: ["tin", "chin"], azik: ["tk"] },
  "つん": { normal: ["tun", "tsun"], azik: ["tj"] },
  "てん": { normal: ["ten"], azik: ["td"] },
  "とん": { normal: ["ton"], azik: ["tl"] },

  "なん": { normal: ["nan"], azik: ["nz", "nn"] },
  "にん": { normal: ["nin"], azik: ["nk"] },
  "ぬん": { normal: ["nun"], azik: ["nj"] },
  "ねん": { normal: ["nen"], azik: ["nd"] },
  "のん": { normal: ["non"], azik: ["nl"] },

  "はん": { normal: ["han"], azik: ["hz"] },
  "ひん": { normal: ["hin"], azik: ["hk"] },
  "ふん": { normal: ["hun", "fun"], azik: ["hj"] },
  "へん": { normal: ["hen"], azik: ["hd"] },
  "ほん": { normal: ["hon"], azik: ["hl"] },

  "まん": { normal: ["man"], azik: ["mz"] },
  "みん": { normal: ["min"], azik: ["mk"] },
  "むん": { normal: ["mun"], azik: ["mj"] },
  "めん": { normal: ["men"], azik: ["md"] },
  "もん": { normal: ["mon"], azik: ["ml"] },

  "やん": { normal: ["yan"], azik: ["yz"] },
  "ゆん": { normal: ["yun"], azik: ["yj"] },
  "よん": { normal: ["yon"], azik: ["yl"] },

  "らん": { normal: ["ran"], azik: ["rz"] },
  "りん": { normal: ["rin"], azik: ["rk"] },
  "るん": { normal: ["run"], azik: ["rj"] },
  "れん": { normal: ["ren"], azik: ["rd"] },
  "ろん": { normal: ["ron"], azik: ["rl"] },

  "わん": { normal: ["wan"], azik: ["wz"] },

  "がん": { normal: ["gan"], azik: ["gz"] },
  "ぎん": { normal: ["gin"], azik: ["gk"] },
  "ぐん": { normal: ["gun"], azik: ["gj"] },
  "げん": { normal: ["gen"], azik: ["gd"] },
  "ごん": { normal: ["gon"], azik: ["gl"] },

  "ざん": { normal: ["zan"], azik: ["zz"] },
  "じん": { normal: ["zin", "jin"], azik: ["zk", "jk"] },
  "ずん": { normal: ["zun"], azik: ["zj"] },
  "ぜん": { normal: ["zen"], azik: ["zd"] },
  "ぞん": { normal: ["zon"], azik: ["zl"] },

  "だん": { normal: ["dan"], azik: ["dz"] },
  "でん": { normal: ["den"], azik: ["dd"] },
  "どん": { normal: ["don"], azik: ["dl"] },

  "ばん": { normal: ["ban"], azik: ["bz"] },
  "びん": { normal: ["bin"], azik: ["bk"] },
  "ぶん": { normal: ["bun"], azik: ["bj"] },
  "べん": { normal: ["ben"], azik: ["bd"] },
  "ぼん": { normal: ["bon"], azik: ["bl"] },

  "ぱん": { normal: ["pan"], azik: ["pz"] },
  "ぴん": { normal: ["pin"], azik: ["pk"] },
  "ぷん": { normal: ["pun"], azik: ["pj"] },
  "ぺん": { normal: ["pen"], azik: ["pd"] },
  "ぽん": { normal: ["pon"], azik: ["pl", "pf"] },

  // --- 二重母音拡張 ---
  // SKK互換: 母音始まりの「あい/うう/えい/おう」はAZIK短縮なし（母音即確定のため）。
  // 例: えいが = え[e] + い[i] + が[ga]。子音前置パターンのみ短縮対象 (かい=kq, けい=kw 等)。

  "かい": { normal: ["kai"], azik: ["kq"] },
  "くう": { normal: ["kuu"], azik: ["kh"] },
  "けい": { normal: ["kei"], azik: ["kw"] },
  "こう": { normal: ["kou"], azik: ["kp"] },

  "さい": { normal: ["sai"], azik: ["sq", "sf"] },
  "すう": { normal: ["suu"], azik: ["sh"] },
  "せい": { normal: ["sei"], azik: ["sw", "ss"] },
  "そう": { normal: ["sou"], azik: ["sp"] },

  "たい": { normal: ["tai"], azik: ["tq"] },
  "つう": { normal: ["tuu", "tsuu"], azik: ["th"] },
  "てい": { normal: ["tei"], azik: ["tw"] },
  "とう": { normal: ["tou"], azik: ["tp"] },

  "ない": { normal: ["nai"], azik: ["nq"] },
  "ぬう": { normal: ["nuu"], azik: ["nh"] },
  "ねい": { normal: ["nei"], azik: ["nw"] },
  "のう": { normal: ["nou"], azik: ["np"] },

  "はい": { normal: ["hai"], azik: ["hq"] },
  "ふう": { normal: ["huu", "fuu"], azik: ["hh"] },
  "へい": { normal: ["hei"], azik: ["hw"] },
  "ほう": { normal: ["hou"], azik: ["hp"] },

  "まい": { normal: ["mai"], azik: ["mq"] },
  "むう": { normal: ["muu"], azik: ["mh"] },
  "めい": { normal: ["mei"], azik: ["mw"] },
  "もう": { normal: ["mou"], azik: ["mp"] },

  "やい": { normal: ["yai"], azik: ["yq"] },
  "ゆう": { normal: ["yuu"], azik: ["yh"] },
  "よう": { normal: ["you"], azik: ["yp"] },

  "らい": { normal: ["rai"], azik: ["rq"] },
  "るう": { normal: ["ruu"], azik: ["rh"] },
  "れい": { normal: ["rei"], azik: ["rw"] },
  "ろう": { normal: ["rou"], azik: ["rp"] },

  "わい": { normal: ["wai"], azik: ["wq"] },

  "がい": { normal: ["gai"], azik: ["gq"] },
  "ぐう": { normal: ["guu"], azik: ["gh"] },
  "げい": { normal: ["gei"], azik: ["gw"] },
  "ごう": { normal: ["gou"], azik: ["gp"] },

  "ざい": { normal: ["zai"], azik: ["zq", "zv"] },
  "ずう": { normal: ["zuu"], azik: ["zh"] },
  "ぜい": { normal: ["zei"], azik: ["zw", "zx"] },
  "ぞう": { normal: ["zou"], azik: ["zp"] },

  "だい": { normal: ["dai"], azik: ["dq"] },
  "でい": { normal: ["dei"], azik: ["dw"] },
  "どう": { normal: ["dou"], azik: ["dp"] },

  "ばい": { normal: ["bai"], azik: ["bq"] },
  "ぶう": { normal: ["buu"], azik: ["bh"] },
  "べい": { normal: ["bei"], azik: ["bw"] },
  "ぼう": { normal: ["bou"], azik: ["bp"] },

  "ぱい": { normal: ["pai"], azik: ["pq"] },
  "ぷう": { normal: ["puu"], azik: ["ph"] },
  "ぺい": { normal: ["pei"], azik: ["pw"] },
  "ぽう": { normal: ["pou"], azik: ["pp"] },

  // --- 拗音 ---
  "きゃ": { normal: ["kya"], azik: ["kga"] },
  "きゅ": { normal: ["kyu"], azik: ["kgu"] },
  "きょ": { normal: ["kyo"], azik: ["kgo"] },
  "きゅう": { normal: ["kyuu"], azik: ["kgh", "kyh"] },
  "きょう": { normal: ["kyou"], azik: ["kgp", "kyp"] },
  "きゃん": { normal: ["kyan"], azik: ["kgz", "kyz", "kgn", "kyn"] },
  "きゅん": { normal: ["kyun"], azik: ["kgj", "kyj"] },
  "きょん": { normal: ["kyon"], azik: ["kgl", "kyl"] },

  "ぎゃ": { normal: ["gya"], azik: ["gya"] },
  "ぎゅ": { normal: ["gyu"], azik: ["gyu"] },
  "ぎょ": { normal: ["gyo"], azik: ["gyo"] },
  "ぎゅう": { normal: ["gyuu"], azik: ["gyh"] },
  "ぎょう": { normal: ["gyou"], azik: ["gyp"] },

  "にゃ": { normal: ["nya"], azik: ["nga"] },
  "にゅ": { normal: ["nyu"], azik: ["ngu"] },
  "にょ": { normal: ["nyo"], azik: ["ngo"] },
  "にゅう": { normal: ["nyuu"], azik: ["ngh", "nyh"] },
  "にょう": { normal: ["nyou"], azik: ["ngp", "nyp"] },

  "ひゃ": { normal: ["hya"], azik: ["hga"] },
  "ひゅ": { normal: ["hyu"], azik: ["hgu"] },
  "ひょ": { normal: ["hyo"], azik: ["hgo"] },
  "ひゅう": { normal: ["hyuu"], azik: ["hgh", "hyh"] },
  "ひょう": { normal: ["hyou"], azik: ["hgp", "hyp"] },

  "みゃ": { normal: ["mya"], azik: ["mga"] },
  "みゅ": { normal: ["myu"], azik: ["mgu"] },
  "みょ": { normal: ["myo"], azik: ["mgo"] },
  "みゅう": { normal: ["myuu"], azik: ["mgh", "myh"] },
  "みょう": { normal: ["myou"], azik: ["mgp", "myp"] },

  "りゃ": { normal: ["rya"], azik: ["rya"] },
  "りゅ": { normal: ["ryu"], azik: ["ryu"] },
  "りょ": { normal: ["ryo"], azik: ["ryo"] },
  "りゅう": { normal: ["ryuu"], azik: ["ryh"] },
  "りょう": { normal: ["ryou"], azik: ["ryp"] },

  "ぴゃ": { normal: ["pya"], azik: ["pga"] },
  "ぴゅ": { normal: ["pyu"], azik: ["pgu"] },
  "ぴょ": { normal: ["pyo"], azik: ["pgo"] },
  "ぴゅう": { normal: ["pyuu"], azik: ["pgh", "pyh"] },
  "ぴょう": { normal: ["pyou"], azik: ["pgp", "pyp"] },

  "びゃ": { normal: ["bya"], azik: ["bya"] },
  "びゅ": { normal: ["byu"], azik: ["byu"] },
  "びょ": { normal: ["byo"], azik: ["byo"] },
  "びゅう": { normal: ["byuu"], azik: ["byh"] },
  "びょう": { normal: ["byou"], azik: ["byp"] },

  // --- シャ・チャ・ジャ行 ---
  "しゃ": { normal: ["sya", "sha"], azik: ["xa"] },
  "しぃ": { normal: ["syi"], azik: ["xi"] },
  "しゅ": { normal: ["syu", "shu"], azik: ["xu"] },
  "しぇ": { normal: ["sye", "she"], azik: ["xe"] },
  "しょ": { normal: ["syo", "sho"], azik: ["xo"] },
  "しゃん": { normal: ["syan", "shan", "xan"], azik: ["xz"] },
  "しゅん": { normal: ["syun", "shun", "xun"], azik: ["xj"] },
  "しょん": { normal: ["syon", "shon", "xon"], azik: ["xl"] },
  "しゅう": { normal: ["syuu", "shuu", "xuu"], azik: ["xh"] },
  "しょう": { normal: ["syou", "shou", "xou"], azik: ["xp"] },

  "ちゃ": { normal: ["tya", "cha", "cya"], azik: ["ca"] },
  "ちぃ": { normal: ["tyi"], azik: ["ci"] },
  "ちゅ": { normal: ["tyu", "chu", "cyu"], azik: ["cu"] },
  "ちぇ": { normal: ["tye", "che"], azik: ["ce", "cf"] },
  "ちょ": { normal: ["tyo", "cho", "cyo"], azik: ["co"] },
  "ちゃん": { normal: ["tyan", "chan", "can"], azik: ["cz"] },
  "ちゅん": { normal: ["tyun", "chun", "cun"], azik: ["cj"] },
  "ちょん": { normal: ["tyon", "chon", "con"], azik: ["cl"] },
  "ちゅう": { normal: ["tyuu", "chuu", "cuu"], azik: ["ch"] },
  "ちょう": { normal: ["tyou", "chou", "cou"], azik: ["cp"] },

  "じゃ": { normal: ["zya", "ja", "jya"], azik: ["ja"] },
  "じゅ": { normal: ["zyu", "ju", "jyu"], azik: ["ju", "jf"] },
  "じょ": { normal: ["zyo", "jo", "jyo"], azik: ["jo"] },
  "じゃん": { normal: ["zyan", "jan"], azik: ["jz"] },
  "じゅん": { normal: ["zyun", "jun"], azik: ["jj"] },
  "じょん": { normal: ["zyon", "jon"], azik: ["jl"] },
  "じゅう": { normal: ["zyuu", "juu"], azik: ["jh"] },
  "じょう": { normal: ["zyou", "jou"], azik: ["jp"] },
  "じぇ":   { normal: ["je", "zye"], azik: ["je"] },

  // --- ファ行 ---
  "ふぁ": { normal: ["fa"], azik: ["fa", "fz"] },
  "ふぃ": { normal: ["fi"], azik: ["fi", "fk"] },
  "ふぇ": { normal: ["fe"], azik: ["fe", "fd"] },
  "ふぉ": { normal: ["fo"], azik: ["fo", "fl"] },

  // --- 外来語拗音 (AzikT x0108eng.txt) ---
  "うぁ": { normal: ["wha"], azik: ["wha"] },
  "うぃ": { normal: ["whi", "wi"], azik: ["whi", "wi"] },
  "うぇ": { normal: ["whe", "we"], azik: ["whe", "we"] },
  "うぉ": { normal: ["who", "wso"], azik: ["who"] },
  "てぃ": { normal: ["thi", "texi"], azik: ["tgi"] },
  "でぃ": { normal: ["dhi", "dexi"], azik: ["dci"] },
  "とぅ": { normal: ["twu", "toxu"], azik: ["tgu"] },
  "どぅ": { normal: ["dwu", "doxu"], azik: ["dcu"] },
  "てゅ": { normal: ["tyu", "teyu"], azik: ["tyu"] },
  "でゅ": { normal: ["dhu"], azik: ["dhu"] },
  "ふゅ": { normal: ["fyu"],         azik: ["fyu"] },
  "ふょ": { normal: ["fyo"],         azik: ["fyo"] },

  // --- 特殊拡張キー (AzikT x0401word1.txt より) ---
  "かも": { normal: ["kamo"],          azik: ["km"] },
  "から": { normal: ["kara"],          azik: ["kr"] },
  "がら": { normal: ["gara"],          azik: ["gr"] },
  "こと": { normal: ["koto"],          azik: ["kt"] },
  "ごと": { normal: ["goto"],          azik: ["gt"] },
  "ざる": { normal: ["zaru"],          azik: ["zr"] },
  "した": { normal: ["sita", "shita"], azik: ["st"] },
  "する": { normal: ["suru"],          azik: ["sr"] },
  "たち": { normal: ["tati", "tachi"], azik: ["tt"] },
  "たび": { normal: ["tabi"],          azik: ["tb"] },
  "ため": { normal: ["tame"],          azik: ["tm"] },
  "たら": { normal: ["tara"],          azik: ["tr"] },
  "だち": { normal: ["dati", "dachi"], azik: ["dt"] },
  "である": { normal: ["dearu"],       azik: ["dr"] },
  "です": { normal: ["desu"],          azik: ["ds"] },
  "でも": { normal: ["demo"],          azik: ["dm"] },
  "なる": { normal: ["naru"],          azik: ["nr"] },
  "にち": { normal: ["niti", "nichi"], azik: ["nt"] },
  "ねば": { normal: ["neba"],          azik: ["nb"] },
  "ひと": { normal: ["hito"],          azik: ["ht"] },
  "びと": { normal: ["bito"],          azik: ["bt"] },
  "ます": { normal: ["masu"],          azik: ["ms"] },
  "また": { normal: ["mata"],          azik: ["mt"] },
  "もの": { normal: ["mono"],          azik: ["mn"] },
  "よる": { normal: ["yoru"],          azik: ["yr"] },
  "られ": { normal: ["rare"],          azik: ["rr"] },
  "わた": { normal: ["wata"],          azik: ["wt"] },
  "われ": { normal: ["ware"],          azik: ["wr"] },
  "という": { normal: ["toiu"],        azik: ["tb"] },

  // --- 歴史的仮名 ---
  "ゐ": { normal: ["wyi"], azik: ["wyi", "yi"] },
  "ゑ": { normal: ["wye"], azik: ["wye"] },

  // --- 小書き特殊 ---
  "ゎ": { normal: ["xwa"], azik: ["xwa"] },
  "ヵ": { normal: ["xka"], azik: ["xka"] },
  "ヶ": { normal: ["xke"], azik: ["xke"] },

  // --- いぇ ---
  "いぇ": { normal: ["ye"], azik: ["ye"] },

  // --- ぢ拗音 ---
  "ぢゃ": { normal: ["dya"], azik: ["dya"] },
  "ぢゅ": { normal: ["dyu"], azik: ["dyu"] },
  "ぢょ": { normal: ["dyo"], azik: ["dyo"] },
  "ぢぇ": { normal: ["dye"], azik: ["dye"] },

  // --- つ系外来語 ---
  "つぁ": { normal: ["tsa"], azik: ["tsa"] },
  "つぇ": { normal: ["tse"], azik: ["tse"] },
  "つぃ": { normal: ["tsi"], azik: ["tsi"] },
  "つぉ": { normal: ["tso"], azik: ["tso"] },

  // --- ゔ系（hiragana） ---
  "ゔ":   { normal: ["vu"],        azik: ["vu"] },
  "ゔぁ": { normal: ["va"],        azik: ["va"] },
  "ゔぃ": { normal: ["vi"],        azik: ["vi"] },
  "ゔぇ": { normal: ["ve", "vye"], azik: ["ve"] },
  "ゔぉ": { normal: ["vo"],        azik: ["vo"] },
  "ゔゃ": { normal: ["vya"],       azik: ["vya"] },
  "ゔゅ": { normal: ["vyu"],       azik: ["vyu"] },
  "ゔょ": { normal: ["vyo"],       azik: ["vyo"] },
  "ゔぁん": { normal: ["van"], azik: ["vn", "vz"] },
  "ゔぁい": { normal: ["vai"], azik: ["vq"] },
  "ゔぇん": { normal: ["ven"], azik: ["vd"] },
  "ゔぃん": { normal: ["vin"], azik: ["vk"] },
  "ゔぉん": { normal: ["von"], azik: ["vl"] },
  "ゔぉう": { normal: ["vou"], azik: ["vp"] },
  "ゔぇい": { normal: ["vei"], azik: ["vw"] },

  // --- ぇ拗音（正典 table_14 準拠） ---
  "きぇ": { normal: ["kye"], azik: ["kge", "kye"] },
  "にぇ": { normal: ["nye"], azik: ["nge", "nye"] },
  "ひぇ": { normal: ["hye"], azik: ["hge", "hye"] },
  "みぇ": { normal: ["mye"], azik: ["mge", "mye"] },
  "りぇ": { normal: ["rye"], azik: ["rye"] },
  "ぎぇ": { normal: ["gye"], azik: ["gye"] },
  "ぴぇ": { normal: ["pye"], azik: ["pge", "pye"] },
  "びぇ": { normal: ["bye"], azik: ["bye"] },

  // --- き系欠落拡張（正典 table_15/16 準拠） ---
  "きゃい": { normal: ["kyai"], azik: ["kgq", "kyq"] },
  "きぇん": { normal: ["kyen"], azik: ["kgd", "kyd"] },
  "きぇい": { normal: ["kyei"], azik: ["kgw", "kyw"] },

  // --- し系欠落拡張 ---
  "しゃい": { normal: ["syai", "shai", "xai"], azik: ["xq"] },
  "しぇん": { normal: ["syen", "shen", "xen"], azik: ["xd"] },
  "しぇい": { normal: ["syei", "shei", "xei"], azik: ["xw"] },

  // --- ち系欠落拡張 ---
  "ちゃい": { normal: ["tyai", "chai", "cai"], azik: ["cq"] },
  "ちぇん": { normal: ["tyen", "chen", "cen"], azik: ["cd"] },
  "ちぇい": { normal: ["tyei", "chei", "cei"], azik: ["cw"] },

  // --- じ系欠落拡張 ---
  "じゃい": { normal: ["zyai", "jai"], azik: ["jq"] },
  "じぇん": { normal: ["zyen", "jen"], azik: ["jd"] },
  "じぇい": { normal: ["zyei", "jei"], azik: ["jw"] },

  // --- に系欠落拡張（正典 table_15/16 準拠） ---
  "にゃん": { normal: ["nyan"], azik: ["ngz", "nyz", "ngn", "nyn"] },
  "にゅん": { normal: ["nyun"], azik: ["ngj", "nyj"] },
  "によん": { normal: ["nyon"], azik: ["ngl", "nyl"] },
  "にゃい": { normal: ["nyai"], azik: ["ngq", "nyq"] },
  "にぇん": { normal: ["nyen"], azik: ["ngd", "nyd"] },
  "にぇい": { normal: ["nyei"], azik: ["ngw", "nyw"] },

  // --- ひ系欠落拡張 ---
  "ひゃん": { normal: ["hyan"], azik: ["hgz", "hyz", "hgn", "hyn"] },
  "ひゅん": { normal: ["hyun"], azik: ["hgj", "hyj"] },
  "ひょん": { normal: ["hyon"], azik: ["hgl", "hyl"] },
  "ひゃい": { normal: ["hyai"], azik: ["hgq", "hyq"] },
  "ひぇん": { normal: ["hyen"], azik: ["hgd", "hyd"] },
  "ひぇい": { normal: ["hyei"], azik: ["hgw", "hyw"] },

  // --- み系欠落拡張 ---
  "みゃん": { normal: ["myan"], azik: ["mgz", "myz", "mgn", "myn"] },
  "みゅん": { normal: ["myun"], azik: ["mgj", "myj"] },
  "みょん": { normal: ["myon"], azik: ["mgl", "myl"] },
  "みゃい": { normal: ["myai"], azik: ["mgq", "myq"] },
  "みぇん": { normal: ["myen"], azik: ["mgd", "myd"] },
  "みぇい": { normal: ["myei"], azik: ["mgw", "myw"] },

  // --- り系欠落拡張 ---
  "りゃん": { normal: ["ryan"], azik: ["ryz", "ryn"] },
  "りゅん": { normal: ["ryun"], azik: ["ryj"] },
  "りょん": { normal: ["ryon"], azik: ["ryl"] },
  "りゃい": { normal: ["ryai"], azik: ["ryq"] },
  "りぇん": { normal: ["ryen"], azik: ["ryd"] },
  "りぇい": { normal: ["ryei"], azik: ["ryw"] },

  // --- ぎ系欠落拡張（正典 table_17/18 準拠） ---
  "ぎゃん": { normal: ["gyan"], azik: ["gyz", "gyn"] },
  "ぎゅん": { normal: ["gyun"], azik: ["gyj"] },
  "ぎょん": { normal: ["gyon"], azik: ["gyl"] },
  "ぎゃい": { normal: ["gyai"], azik: ["gyq"] },
  "ぎぇん": { normal: ["gyen"], azik: ["gyd"] },
  "ぎぇい": { normal: ["gyei"], azik: ["gyw"] },

  // --- び系欠落拡張 ---
  "びゃん": { normal: ["byan"], azik: ["byz", "byn"] },
  "びゅん": { normal: ["byun"], azik: ["byj"] },
  "びょん": { normal: ["byon"], azik: ["byl"] },
  "びゃい": { normal: ["byai"], azik: ["byq"] },
  "びぇん": { normal: ["byen"], azik: ["byd"] },
  "びぇい": { normal: ["byei"], azik: ["byw"] },

  // --- ぴ系欠落拡張 ---
  "ぴゃん": { normal: ["pyan"], azik: ["pgz", "pyz", "pgn", "pyn"] },
  "ぴゅん": { normal: ["pyun"], azik: ["pgj", "pyj"] },
  "ぴょん": { normal: ["pyon"], azik: ["pgl", "pyl"] },
  "ぴゃい": { normal: ["pyai"], azik: ["pgq", "pyq"] },
  "ぴぇん": { normal: ["pyen"], azik: ["pgd", "pyd"] },
  "ぴぇい": { normal: ["pyei"], azik: ["pgw", "pyw"] },
};

// -------------------------------------------------------------
// -------------------------------------------------------------
// かな文字列に対して有効なキー列の全集合を生成する
// -------------------------------------------------------------

/**
 * kana文字列を構成する全セグメント分割パターンを再帰列挙し、
 * 各分割のキー直積を合算して有効なキー列の集合を返す。
 *
 * filter(sub, allKeys) でステージ/ユーザー設定によるキー絞り込みを渡せる。
 * filter が空配列を返したパスは除外される。
 * memo は再帰呼び出しごとに生成して渡す（呼び出し元は省略可）。
 */
export function buildValidKeys(
  kana: string,
  dictionary: Record<string, AzikMapping> = AZIK_DICTIONARY,
  filter: (sub: string, allKeys: string[]) => string[] = (_s, k) => k,
  longestMatchOnly: boolean = false,
  isSubTarget?: (sub: string) => boolean,
): string[] {
  return _bvk(kana, dictionary, filter, longestMatchOnly, isSubTarget, 0, new Map());
}

function _bvk(
  kana: string,
  dictionary: Record<string, AzikMapping>,
  filter: (sub: string, allKeys: string[]) => string[],
  longestMatchOnly: boolean,
  isSubTarget: ((sub: string) => boolean) | undefined,
  pos: number,
  memo: Map<number, string[]>,
): string[] {
  if (pos === kana.length) return [""];
  if (memo.has(pos)) return memo.get(pos)!;

  const results = new Set<string>();
  let foundValidAtThisPos = false;

  for (let len = Math.min(4, kana.length - pos); len >= 1; len--) {
    const sub = kana.substring(pos, pos + len);
    const entry = dictionary[sub];
    if (!entry) continue;

    const allKeys = [...entry.normal, ...entry.azik];
    const allowed = filter(sub, allKeys);
    if (allowed.length === 0) continue;

    // isSubTarget あり: 既に長い一致が見つかった後は非ターゲット分割をスキップ
    // (ターゲットキーを持つ短い分割は許可)
    if (longestMatchOnly && foundValidAtThisPos && isSubTarget && !isSubTarget(sub)) continue;

    const suffixes = _bvk(kana, dictionary, filter, longestMatchOnly, isSubTarget, pos + len, memo);
    for (const key of allowed) {
      for (const suf of suffixes) {
        results.add(key + suf);
      }
    }
    foundValidAtThisPos = true;

    // isSubTarget なし: 最初の有効一致で即 break (Practice モード等)
    if (longestMatchOnly && !isSubTarget) break;
  }

  const arr = Array.from(results);
  memo.set(pos, arr);
  return arr;
}

// -------------------------------------------------------------
// ひらがな文字列をAZIKセグメントに分解する自動解析器
// -------------------------------------------------------------
export function splitIntoAzikSegments(
  kana: string,
  dictionary: Record<string, AzikMapping> = AZIK_DICTIONARY
): AzikSegment[] {
  const result: AzikSegment[] = [];
  let i = 0;

  while (i < kana.length) {
    if (kana[i] === "っ" && i + 1 < kana.length) {
      // 「っ」の後に続く文字列を再帰的にパースし、その最初のセグメントを結合対象とする。
      // これにより、「とう」や「かん」のように二重母音・撥音拡張を含むセグメントを破壊せずに
      // 「っとう」「っかん」として正しく結合でき、AZIKショートカット（;tp や ;kz）が有効になります。
      const nextSegs = splitIntoAzikSegments(kana.substring(i + 1), dictionary);
      if (nextSegs.length > 0) {
        const nextSeg = nextSegs[0];
        const isConsonant = (c: string) => c && !["a", "i", "u", "e", "o", "q"].includes(c);
        
        const normalConsonants = nextSeg.normal.map(n => n[0]).filter(isConsonant);
        const azikConsonants = nextSeg.azik.map(a => a[0]).filter(isConsonant);

        if (normalConsonants.length > 0 && azikConsonants.length > 0) {
          const combinedNormal = nextSeg.normal.map(n => n[0] + n);
          const sokuonKey = dictionary["っ"]?.azik[0] || ";";
          // AZIKショートカット（;kq 等）に加えて、っ→; + 通常入力のハイブリッドも生成する。
          // 例: っかい → [";kq", ";kai"] により、Lev1aフォーカスモードで ;kai が有効になる。
          const combinedAzik = [
            ...nextSeg.azik.map(a => sokuonKey + a),
            ...nextSeg.normal.map(n => sokuonKey + n),
          ];

          result.push({
            kana: "っ" + nextSeg.kana,
            normal: Array.from(new Set(combinedNormal)),
            azik: Array.from(new Set(combinedAzik)),
          });

          i += 1 + nextSeg.kana.length;
          continue;
        }
      }
    }

    let found = false;
    for (let len = 4; len >= 1; len--) {
      if (i + len <= kana.length) {
        const subStr = kana.substring(i, i + len);
        if (dictionary[subStr]) {
          result.push({
            kana: subStr,
            normal: dictionary[subStr].normal,
            azik: dictionary[subStr].azik,
          });
          i += len;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      const char = kana[i];
      result.push({
        kana: char,
        normal: [char.toLowerCase()],
        azik: [char.toLowerCase()],
      });
      i++;
    }
  }

  return result;
}

// -------------------------------------------------------------
// タイピング単語データを生成するヘルパー関数
// -------------------------------------------------------------
export function createTypingWord(
  kanji: string,
  kana: string,
  dictionary: Record<string, AzikMapping> = AZIK_DICTIONARY
): TypingWord {
  return {
    kanji,
    kana,
    segments: splitIntoAzikSegments(kana, dictionary),
  };
}


// -------------------------------------------------------------
// お題全体の理論最小打鍵数を計算するヘルパー
// -------------------------------------------------------------
export function calculateOptimalKeyCounts(words: TypingWord[]): { totalNormal: number; totalAzik: number } {
  let totalNormal = 0;
  let totalAzik = 0;
  words.forEach(word => {
    word.segments.forEach(seg => {
      const minNormal = Math.min(...seg.normal.map(p => p.length));
      const minAzik = Math.min(...seg.azik.map(p => p.length));
      totalNormal += minNormal;
      totalAzik += minAzik;
    });
  });
  return { totalNormal, totalAzik };
}
