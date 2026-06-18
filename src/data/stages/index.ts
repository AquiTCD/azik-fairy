import { StageData } from "../azikRules";
import { filterStageWords } from "./wordValidator";
import chunksManifest from "./chunks/manifest.json";

export type StageMeta = Omit<StageData, "words"> & { wordCount: number };

export const STAGE_MANIFEST: StageMeta[] = [
  { id: "lev1-sokuon",        category: "Lev1",    azikLevel: "Lev1a", wordCount: 2113, name: "小さい「っ」",                description: "「っ」は [;] 一打で！同じ子音を2回打つ従来のやり方は捨てよう。",                    concept: "っ(促音)を [;] で入力することだけを練習する。ん・シャ行・チャ行はまだ使わない。" },
  { id: "lev1-hatsuon-q",     category: "Lev1",    azikLevel: "Lev1b", wordCount:  638, name: "ん",                          description: "「ん」は [q] 一打で！N キーは忘れよう。Lev2 で更に短縮できるようになる。",           concept: "ん→[q] の習得。子音前置の撥音拡張 (kz等) は Lev2a で学ぶ。このステージでは ho+q のように「前の音節＋q」で打つ。" },
  { id: "lev1-sha",           category: "Lev1",    azikLevel: "Lev1c", wordCount:  740, name: "シャ行 [X]",                  description: "「しゃ/しゅ/しょ」は [x] で2打鍵に短縮。SHA/SYA などは忘れよう。",                    concept: "x*系 (xa/xu/xo/xz/xj/xl/xh/xp) の習得。チャ行 [C] は Lev1d で学ぶ。" },
  { id: "lev1-cha",           category: "Lev1",    azikLevel: "Lev1d", wordCount:  526, name: "チャ行 [C]",                  description: "「ちゃ/ちゅ/ちょ」は [c] で2打鍵に短縮。CHA/CYA などは忘れよう。",                    concept: "c*系 (ca/cu/co/cz/cj/cl/ch/cp) の習得。シャ行 [X] と合わせて x*/c* を使い分ける。" },
  { id: "lev1-summary",       category: "Lev1",    azikLevel: "Lev1d", wordCount: 3041, name: "Lev1 まとめ文章",              description: "「っ」「ん」「シャ行」「チャ行」の総まとめ。",                                         concept: "Lev1全体の総合練習。っ[;]・ん[q]・シャ行[x]・チャ行[c] をすべて活用する文章。" },
  { id: "lev2a-an-z",        category: "Lev2a",   azikLevel: "Lev2a", wordCount: 1601, name: "撥音「〜あん」[Z]",            description: "「〜あん」を子音＋[z] で！かん→kz, さん→sz, たん→tz, なん→nz など。",               concept: "あん拡張キー [Z]。子音+Z = 〜あん。例: kz=かん, sz=さん, tz=たん, nz=なん, hz=はん, mz=まん, gz=がん。" },
  { id: "lev2a-in-k",        category: "Lev2a",   azikLevel: "Lev2a", wordCount:  942, name: "撥音「〜いん」[K]",            description: "「〜いん」を子音＋[k] で！きん→kk, しん→sk, にん→nk, ちん→tk など。",               concept: "いん拡張キー [K]。子音+K = 〜いん。例: kk=きん, sk=しん, nk=にん, tk=ちん, bk=びん。" },
  { id: "lev2a-un-j",        category: "Lev2a",   azikLevel: "Lev2a", wordCount:  385, name: "撥音「〜うん」[J]",            description: "「〜うん」を子音＋[j] で！くん→kj, すん→sj, ぶん→bj, ぐん→gj など。",               concept: "うん拡張キー [J]。子音+J = 〜うん。例: kj=くん, sj=すん, bj=ぶん, gj=ぐん, hj=ふん。" },
  { id: "lev2a-en-d",        category: "Lev2a",   azikLevel: "Lev2a", wordCount: 1488, name: "撥音「〜えん」[D]",            description: "「〜えん」を子音＋[d] で！けん→kd, せん→sd, てん→td, ねん→nd など。",               concept: "えん拡張キー [D]。子音+D = 〜えん。例: kd=けん, sd=せん, td=てん, nd=ねん, gd=げん。" },
  { id: "lev2a-on-l",        category: "Lev2a",   azikLevel: "Lev2a", wordCount:  780, name: "撥音「〜おん」[L]",            description: "「〜おん」を子音＋[l] で！こん→kl, そん→sl, とん→tl, のん→nl など。",               concept: "おん拡張キー [L]。子音+L = 〜おん。例: kl=こん, sl=そん, tl=とん, hl=ほん, ml=もん。" },
  { id: "lev2a-summary",     category: "Lev2a",   azikLevel: "Lev2a", wordCount: 7041, name: "撥音まとめ文章",               description: "Z/K/J/D/L の5つの撥音拡張をフル活用する文章練習。",                                   concept: "Lev2a総合練習。5つの撥音拡張キー (Z/K/J/D/L) を自然な文章の中で使いこなす。" },
  { id: "lev2b-ai-q",        category: "Lev2b",   azikLevel: "Lev2b", wordCount: 1915, name: "二重母音「〜あい」[Q]",        description: "「〜あい」を子音＋[q] で！かい→kq, さい→sq, たい→tq, ない→nq など。",               concept: "あい拡張キー [Q]。子音+Q = 〜あい。注: q 単打は ん。例: kq=かい, sq=さい, tq=たい, gq=がい。" },
  { id: "lev2b-uu-h",        category: "Lev2b",   azikLevel: "Lev2b", wordCount:  497, name: "二重母音「〜うう」[H]",        description: "「〜うう」を子音＋[h] で！くう→kh, すう→sh, つう→th, ふう→hh など。",               concept: "うう拡張キー [H]。子音+H = 〜うう。例: kh=くう, sh=すう, th=つう, hh=ふう, gh=ぐう。" },
  { id: "lev2b-ei-w",        category: "Lev2b",   azikLevel: "Lev2b", wordCount: 1015, name: "二重母音「〜えい」[W]",        description: "「〜えい」を子音＋[w] で！けい→kw, せい→sw, てい→tw, へい→hw など。",               concept: "えい拡張キー [W]。子音+W = 〜えい。例: kw=けい, sw=せい, tw=てい, hw=へい, gw=げい。" },
  { id: "lev2b-ou-p",        category: "Lev2b",   azikLevel: "Lev2b", wordCount: 2339, name: "二重母音「〜おう」[P]",        description: "「〜おう」を子音＋[p] で！こう→kp, そう→sp, とう→tp, のう→np など。",               concept: "おう拡張キー [P]。子音+P = 〜おう。例: kp=こう, sp=そう, tp=とう, np=のう, gp=ごう。" },
  { id: "lev2b-summary",     category: "Lev2b",   azikLevel: "Lev2b", wordCount: 8127, name: "二重母音まとめ文章",           description: "Q/H/W/P の4つの二重母音短縮をフル活用する文章練習。",                                 concept: "Lev2b総合練習。4つの二重母音拡張キー (Q/H/W/P) を自然な文章の中で使いこなす。" },
  { id: "lev3a-chouon-colon",category: "Lev3a",   azikLevel: "Lev3a", wordCount: 2812, name: "長音互換 [:]",                 description: "長音「ー」を [-] の隣の [:] で。指を大きく動かさずに済む互換キー。",                    concept: "長音ー を[:] で入力する互換キー練習。通常の[-]も使えるが[:]のほうが打ちやすい。" },
  { id: "lev3a-g-youon",     category: "Lev3a",   azikLevel: "Lev3a", wordCount: 1025, name: "拗音Y代用 [G]",               description: "拗音の Y を [g] で代用。きゃ→kga, にゃ→nga, りゃ→rga など左手が楽になる。",           concept: "Y→G代用キー。拗音 kya/nya/hya 等を kga/nga/hga と打つ。左手の負担を軽減する。" },
  { id: "lev3a-compat-f",   category: "Lev3a",   azikLevel: "Lev3a", wordCount:  236, name: "語尾互換 [F]",                 description: "き→kf, で→df, ぬ→nf, ふ→hf, む→mf, ゆ→yf, じゅ→jf で1打削減！",                  concept: "F互換キー練習。末尾i/u代わりにFを使う短縮入力。kf=き, df=で, nf=ぬ, hf=ふ, mf=む, yf=ゆ, jf=じゅ。" },
  { id: "lev3a-summary",     category: "Lev3a",   azikLevel: "Lev3a", wordCount: 5454, name: "互換キーI まとめ文章",         description: "長音 [:]・拗音代用 [G]・語尾互換 [F] を組み合わせた文章練習。",                       concept: "Lev3a総合練習。長音[:]、Y→G代用、F互換キーを自然な文章で使いこなす。" },
  { id: "lev3b-foreign-kana",    category: "Lev3b",   azikLevel: "Lev3b", wordCount:  771, name: "外来語拡張 [TGI/DCI/TGU]",       description: "「てぃ」→[tgi]、「でぃ」→[dci]、「とぅ」→[tgu]。外来語の特殊音節をAZIKで短縮しよう。",                  concept: "外来語拡張キーの練習。てぃ[tgi]・でぃ[dci]・とぅ[tgu] を含む外来語カタカナ語。設定で「外来語拡張」がONの場合に有効。" },
  { id: "lev3b-zc-zf-za-ze", category: "Lev3b",   azikLevel: "Lev3b", wordCount:  339, name: "ざ[ZC] ぜ[ZF]",               description: "打ちにくい「ざ[za]」を [zc] に、「ぜ[ze]」を [zf] に変えて省力化。",                    concept: "Lev3b互換キー第1組。ざ[za→zc], ぜ[ze→zf] の代替入力。" },
  { id: "lev3b-zv-zx-zai-zei",category: "Lev3b",  azikLevel: "Lev3b", wordCount:  217, name: "ざい[ZV] ぜい[ZX]",           description: "打ちにくい「ざい[zq]」を [zv] に、「ぜい[zw]」を [zx] に変えて省力化。",               concept: "Lev3b互換キー第2組。ざい[zq→zv], ぜい[zw→zx] の代替入力。" },
  { id: "lev3b-sf-ss-sai-sei",category: "Lev3b",  azikLevel: "Lev3b", wordCount:  763, name: "さい[SF] せい[SS]",            description: "打ちにくい「さい[sq]」を [sf] に、「せい[sw]」を [ss] に変えて省力化。",                concept: "Lev3b互換キー第3組。さい[sq→sf], せい[sw→ss] の代替入力。" },
  { id: "lev3b-summary",     category: "Lev3b",   azikLevel: "Lev3b", wordCount: 1331, name: "互換キーII まとめ文章",        description: "ZC/ZF/ZV/ZX/SF/SS の互換キーをフルに使う文章練習。",                                  concept: "Lev3b総合練習。6つの互換キー (ZC/ZF/ZV/ZX/SF/SS) を自然な文章で使いこなす。" },
  { id: "lev4-special-ext-1",category: "Lev4",    azikLevel: "Lev4",  wordCount:   28, name: "特殊拡張ショートカット",       description: "日本語頻出パターンを2打で！こと[kt]・もの[mn]・する[sr]・ます[ms]など。",            concept: "Lev4語短縮キー。日本語で頻出する機能語・助動詞を2打で入力する。" },
  { id: "lev4-summary",      category: "Lev4",    azikLevel: "Lev4",  wordCount: 25371, name: "特殊拡張まとめ文章",          description: "特殊拡張キーを交えた自然な日本語文章の練習。",                                         concept: "Lev4総合練習。語短縮キーを含む自然な文章を打つ。" },
  { id: "practice-words-1",  category: "Practice", azikLevel: "Practice", wordCount: 18324, name: "実戦1. 日常単語（撥音・二重母音）", description: "日常でよく使う単語でAZIK拡張をフル活用する総合練習。",               concept: "制限なし総合練習。Lev2a/2b の拡張キーが多数含まれる日常語を実戦形式で打つ。" },
  { id: "practice-words-2",  category: "Practice", azikLevel: "Practice", wordCount:  5481, name: "実戦2. 日常単語（多種混合）",      description: "促音・撥音・二重母音・拗音がすべて混ざった日常語の実戦練習。",            concept: "制限なし総合練習。すべてのAZIK拡張が入り乱れた日常語を実戦形式で打つ。" },
  { id: "practice-sentences", category: "Practice", azikLevel: "Practice", wordCount:  9227, name: "実戦3. 日常文章",               description: "日常会話でよく使うフレーズをAZIKで自然に打てるようにする練習。",          concept: "制限なし文章練習。日常会話フレーズを実戦形式で打つ。" },
  { id: "preset-momotaro",               category: "Challenge", wordCount:  18, name: "桃太郎",           description: "日本の代表的な昔話。おじいさんとおばあさん、そして桃から生まれた桃太郎の冒険物語。" },
  { id: "preset-urashimataro",           category: "Challenge", wordCount:  16, name: "浦島太郎",         description: "竜宮城を訪れた浦島太郎と、玉手箱の物語。" },
  { id: "preset-rashomon",               category: "Challenge", wordCount:  21, name: "羅生門",           description: "芥川龍之介の短編。荒廃した羅生門を舞台にした、人間の利己心を描いた物語。" },
  { id: "preset-melos",                  category: "Challenge", wordCount:  16, name: "走れメロス",       description: "太宰治の短編。友情と信頼をテーマにした、メロスの疾走の物語。" },
  { id: "preset-kumo-no-ito",            category: "Challenge", wordCount:  19, name: "蜘蛛の糸",         description: "芥川龍之介の短編。お釈迦様が地獄のカンダタに垂らした蜘蛛の糸の物語。" },
  { id: "preset-sangetsuki",             category: "Challenge", wordCount:  17, name: "山月記",           description: "中島敦の短編。虎に変身した李徴と旧友袁傪の再会を描いた物語。" },
  { id: "preset-chumon-no-oi-ryoriten",  category: "Challenge", wordCount:  18, name: "注文の多い料理店", description: "宮沢賢治の短編童話。山の中の不思議なレストランを訪れた紳士たちの物語。" },
  { id: "preset-wagahai-wa-neko-de-aru", category: "Challenge", wordCount:  15, name: "吾輩は猫である",   description: "夏目漱石の長編小説の冒頭。名前のない猫の視点から描かれる人間観察。" },
  { id: "preset-gongitsune",             category: "Challenge", wordCount:  18, name: "ごん狐",           description: "新美南吉の童話。いたずらっ子の子狐ごんと兵十の切ない物語。" },
];

export const STAGES: StageMeta[] = STAGE_MANIFEST;

export async function loadStage(id: string): Promise<StageData> {
  const manifest = chunksManifest as Record<string, number>;
  let stage: StageData;

  if (manifest[id] !== undefined) {
    const chunkIdx = Math.floor(Math.random() * manifest[id]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore vite:dynamic-import-vars is stricter than webpack; Next.js build works fine
    const mod = await import(/* @vite-ignore */ `./chunks/${id}-${chunkIdx}.json`);
    stage = mod.default as StageData;
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore vite:dynamic-import-vars is stricter than webpack; Next.js build works fine
    const mod = await import(/* @vite-ignore */ `./${id}.json`);
    stage = mod.default as StageData;
  }

  return filterStageWords(stage);
}
