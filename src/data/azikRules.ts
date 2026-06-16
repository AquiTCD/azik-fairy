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
  "っ": { normal: ["ltu", "ltsu"], azik: [";"] },
  "ー": { normal: ["-"], azik: ["-", ":"] },

  // --- 小書き仮名 (外来語表記用フォールバック) ---
  "ぁ": { normal: ["xa", "la"], azik: ["xa", "la"] },
  "ぃ": { normal: ["xi", "li"], azik: ["xi", "li"] },
  "ぅ": { normal: ["xu", "lu"], azik: ["xu", "lu"] },
  "ぇ": { normal: ["xe", "le"], azik: ["xe", "le"] },
  "ぉ": { normal: ["xo", "lo"], azik: ["xo", "lo"] },
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
  "きゃ": { normal: ["kya"], azik: ["kga", "kya"] },
  "きゅ": { normal: ["kyu"], azik: ["kgu", "kyu"] },
  "きょ": { normal: ["kyo"], azik: ["kgo", "kyo"] },
  "きゅう": { normal: ["kyuu"], azik: ["kgh"] },
  "きょう": { normal: ["kyou"], azik: ["kgp"] },
  "きゃん": { normal: ["kyan"], azik: ["kgz"] },
  "きゅん": { normal: ["kyun"], azik: ["kgj"] },
  "きょん": { normal: ["kyon"], azik: ["kgl"] },

  "ぎゃ": { normal: ["gya"], azik: ["gya"] },
  "ぎゅ": { normal: ["gyu"], azik: ["gyu"] },
  "ぎょ": { normal: ["gyo"], azik: ["gyo"] },
  "ぎゅう": { normal: ["gyuu"], azik: ["gyh"] },
  "ぎょう": { normal: ["gyou"], azik: ["gyp"] },

  "にゃ": { normal: ["nya"], azik: ["nga", "nya"] },
  "にゅ": { normal: ["nyu"], azik: ["ngu", "nyu"] },
  "にょ": { normal: ["nyo"], azik: ["ngo", "nyo"] },
  "にゅう": { normal: ["nyuu"], azik: ["ngh"] },
  "にょう": { normal: ["nyou"], azik: ["ngp"] },

  "ひゃ": { normal: ["hya"], azik: ["hga", "hya"] },
  "ひゅ": { normal: ["hyu"], azik: ["hgu", "hyu"] },
  "ひょ": { normal: ["hyo"], azik: ["hgo", "hyo"] },
  "ひゅう": { normal: ["hyuu"], azik: ["hgh"] },
  "ひょう": { normal: ["hyou"], azik: ["hgp"] },

  "みゃ": { normal: ["mya"], azik: ["mga", "mya"] },
  "みゅ": { normal: ["myu"], azik: ["mgu", "myu"] },
  "みょ": { normal: ["myo"], azik: ["mgo", "myo"] },
  "みゅう": { normal: ["myuu"], azik: ["mgh"] },
  "みょう": { normal: ["myou"], azik: ["mgp"] },

  "りゃ": { normal: ["rya"], azik: ["rya"] },
  "りゅ": { normal: ["ryu"], azik: ["ryu"] },
  "りょ": { normal: ["ryo"], azik: ["ryo"] },
  "りゅう": { normal: ["ryuu"], azik: ["ryh"] },
  "りょう": { normal: ["ryou"], azik: ["ryp"] },

  "ぴゃ": { normal: ["pya"], azik: ["pga", "pya"] },
  "ぴゅ": { normal: ["pyu"], azik: ["pgu", "pyu"] },
  "ぴょ": { normal: ["pyo"], azik: ["pgo", "pyo"] },
  "ぴゅう": { normal: ["pyuu"], azik: ["pgh"] },
  "ぴょう": { normal: ["pyou"], azik: ["pgp"] },

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
  "しゃん": { normal: ["syan", "shan"], azik: ["xz"] },
  "しゅん": { normal: ["syun", "shun"], azik: ["xj"] },
  "しょん": { normal: ["syon", "shon"], azik: ["xl"] },
  "しゅう": { normal: ["syuu", "shuu"], azik: ["xh"] },
  "しょう": { normal: ["syou", "shou"], azik: ["xp"] },

  "ちゃ": { normal: ["tya", "cha"], azik: ["ca"] },
  "ちぃ": { normal: ["tyi"], azik: ["ci"] },
  "ちゅ": { normal: ["tyu", "chu"], azik: ["cu"] },
  "ちぇ": { normal: ["tye", "che"], azik: ["ce", "cf"] },
  "ちょ": { normal: ["tyo", "cho"], azik: ["co"] },
  "ちゃん": { normal: ["tyan", "chan"], azik: ["cz"] },
  "ちゅん": { normal: ["tyun", "chun"], azik: ["cj"] },
  "ちょん": { normal: ["tyon", "chon"], azik: ["cl"] },
  "ちゅう": { normal: ["tyuu", "chuu"], azik: ["ch"] },
  "ちょう": { normal: ["tyou", "chou"], azik: ["cp"] },

  "じゃ": { normal: ["zya", "ja"], azik: ["ja"] },
  "じゅ": { normal: ["zyu", "ju"], azik: ["ju", "jf"] },
  "じょ": { normal: ["zyo", "jo"], azik: ["jo"] },
  "じゃん": { normal: ["zyan", "jan"], azik: ["jz"] },
  "じゅん": { normal: ["zyun", "jun"], azik: ["jj"] },
  "じょん": { normal: ["zyon", "jon"], azik: ["jl"] },
  "じゅう": { normal: ["zyuu", "juu"], azik: ["jh"] },
  "じょう": { normal: ["zyou", "jou"], azik: ["jp"] },
  "じぇ":   { normal: ["je"], azik: ["je"] },

  // --- ファ行 ---
  "ふぁ": { normal: ["fa"], azik: ["fa", "fz"] },
  "ふぃ": { normal: ["fi"], azik: ["fi", "fk"] },
  "ふぇ": { normal: ["fe"], azik: ["fe", "fd"] },
  "ふぉ": { normal: ["fo"], azik: ["fo", "fl"] },

  // --- 外来語拗音 (AzikT x0108eng.txt) ---
  "うぁ": { normal: ["wha"], azik: ["wha"] },
  "うぃ": { normal: ["whi", "wi"], azik: ["whi", "wi"] },
  "うぇ": { normal: ["whe", "we"], azik: ["whe", "we"] },
  "うぉ": { normal: ["who"], azik: ["who"] },
  "てぃ": { normal: ["thi", "texi"], azik: ["tgi"] },
  "でぃ": { normal: ["dhi", "dexi"], azik: ["dci"] },
  "とぅ": { normal: ["twu", "toxu"], azik: ["tgu"] },
  "どぅ": { normal: ["dwu", "doxu"], azik: ["dcu"] },
  "てゅ": { normal: ["tyu", "teyu"], azik: ["tyu"] },
  "でゅ": { normal: ["dyu", "deyu"], azik: ["dyu"] },
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
};

// -------------------------------------------------------------
// カスタムルールをマージする関数
// -------------------------------------------------------------
export interface AzikFeatures {
  enableSpecial: boolean;                    // 特殊拡張 (こと/もの/する等)
  enableForeign: boolean;                    // 外来語拡張 (tgi/dci/tgu/dcu)
  nAlternative: "off" | "left" | "all";     // 撥音ZキーへのN代替: off=Zのみ / left=左手子音のみ / all=全子音
}

// QWERTYキーボードで左手で打つ子音 (b/c/d/f/g/r/s/t/v/w/x/z)
const LEFT_HAND_CONSONANTS = new Set(['b', 'c', 'd', 'f', 'g', 'r', 's', 't', 'v', 'w', 'x', 'z']);

const SPECIAL_KANAS = new Set(["こと", "もの", "する", "です", "ます", "という"]);
const FOREIGN_KANAS = new Set(["てぃ", "でぃ", "とぅ", "どぅ", "てゅ", "でゅ", "ふゅ", "ふょ"]);

export function mergeCustomAzikRules(
  customRules: Record<string, string[]>,
  features: AzikFeatures = { enableSpecial: true, enableForeign: true, nAlternative: "left" }
): Record<string, AzikMapping> {
  const merged = JSON.parse(JSON.stringify(AZIK_DICTIONARY)) as Record<string, AzikMapping>;

  const baseRules = [
    { parent: "あん", defaultKey: "z" },
    { parent: "いん", defaultKey: "k" },
    { parent: "うん", defaultKey: "j" },
    { parent: "えん", defaultKey: "d" },
    { parent: "おん", defaultKey: "l" },
    { parent: "あい", defaultKey: "q" },
    { parent: "うう", defaultKey: "h" },
    { parent: "えい", defaultKey: "w" },
    { parent: "おう", defaultKey: "p" },
  ];

  for (const key of ["ん", "っ", "ー"] as const) {
    if (customRules[key]?.length) merged[key].azik = customRules[key];
  }

  const specialRules = ["こと", "もの", "する", "です", "ます", "という"];
  for (const key of specialRules) {
    if (customRules[key]?.length) merged[key].azik = customRules[key];
  }

  // 撥音/二重母音拡張キーをdictionary全体に伝播。
  // 複数カスタムキー対応: defaultKeyで終わるazikショートカットをcustomKeys全員で展開する。
  for (const rule of baseRules) {
    const customKeys = customRules[rule.parent];
    if (!customKeys?.length) continue;
    for (const [, map] of Object.entries(merged)) {
      const newAzik: string[] = [];
      for (const k of map.azik) {
        if (k.length >= 2 && k.endsWith(rule.defaultKey)) {
          for (const ck of customKeys) {
            newAzik.push(k.slice(0, -1) + ck);
          }
        } else {
          newAzik.push(k);
        }
      }
      map.azik = [...new Set(newAzik)];
    }
  }

  // フィーチャーフラグ: OFFにした機能のazikショートカットを通常入力に戻す
  if (!features.enableSpecial) {
    for (const kana of SPECIAL_KANAS) {
      if (merged[kana]) merged[kana].azik = [...merged[kana].normal];
    }
  }

  if (!features.enableForeign) {
    for (const kana of FOREIGN_KANAS) {
      if (merged[kana]) merged[kana].azik = [...merged[kana].normal];
    }
  }

  // N代替: 撥音Zショートカット (sz/tz/gz等) に N を追加する
  if (features.nAlternative !== "off") {
    for (const [kana, map] of Object.entries(merged)) {
      if (kana.length < 2 || !kana.endsWith("ん")) continue;
      const extra: string[] = [];
      for (const k of map.azik) {
        if (k.length >= 2 && k.endsWith("z")) {
          const firstChar = k[0];
          if (features.nAlternative === "all" || LEFT_HAND_CONSONANTS.has(firstChar)) {
            extra.push(k.slice(0, -1) + "n");
          }
        }
      }
      if (extra.length > 0) {
        map.azik = [...new Set([...map.azik, ...extra])];
      }
    }
  }

  return merged;
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
          const combinedAzik = nextSeg.azik.map(a => sokuonKey + a);

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
// TSV (Google日本語入力) / CSV・conf (SKK kana-rule.conf) のパーサー
// -------------------------------------------------------------
export function parseExternalRomajiTable(text: string): Record<string, string[]> {
  const customRules: Record<string, string[]> = {};
  const targetKanas = [
    "ん", "っ",
    "あん", "いん", "うん", "えん", "おん",
    "あい", "うう", "えい", "おう"
  ];

  const push = (key: string, val: string) => {
    if (!customRules[key]) customRules[key] = [];
    if (!customRules[key].includes(val)) customRules[key].push(val);
  };

  if (!text) return customRules;

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let parts: string[] = [];
    if (trimmed.includes("\t")) {
      parts = trimmed.split("\t");
    } else if (trimmed.includes(",")) {
      parts = trimmed.split(",");
    }

    if (parts.length >= 2) {
      const romaji = parts[0].trim().toLowerCase();
      const kana = parts[1].trim();

      // 直接マッピング: 1文字ローマ字 → 対象かな (重複なく複数収集)
      if (romaji.length === 1 && targetKanas.includes(kana)) {
        push(kana, romaji);
        continue;
      }

      // 2文字エントリの k* 系から撥音/二重母音の拡張キーを推論
      // 例: kz,かん → あん=z、kq,かい → あい=q (複数エントリがあれば両方収集)
      if (romaji.length === 2 && romaji[0] === "k") {
        const KA_SERIES_TO_ABSTRACT: Record<string, string> = {
          "かん": "あん", "きん": "いん", "くん": "うん", "けん": "えん", "こん": "おん",
          "かい": "あい", "くう": "うう", "けい": "えい", "こう": "おう",
        };
        const abstractPattern = KA_SERIES_TO_ABSTRACT[kana];
        if (abstractPattern) push(abstractPattern, romaji[1]);
      }
    }
  }

  return customRules;
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
