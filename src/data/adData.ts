export interface Ad {
  label: string;
  url: string;
  emoji: string;
  category: "keyboard" | "parts" | "mouse" | "wristrest" | "accessories";
}

const TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "";

const amzn = (asin: string) => `https://www.amazon.co.jp/dp/${asin}?tag=${TAG}`;
const amznSearch = (query: string) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}&tag=${TAG}`;

export const ADS: Ad[] = [
  // キーボード
  { label: "HHKB Professional HYBRID Type-S", url: amzn("B082TWQ5SW"), emoji: "🏆", category: "keyboard" },
  { label: "HHKB Studio", url: amznSearch("HHKB Studio"), emoji: "🕹️", category: "keyboard" },
  { label: "REALFORCE R3 テンキーレス", url: amznSearch("REALFORCE R3"), emoji: "⌨️", category: "keyboard" },
  { label: "REALFORCE R3S テンキーレス", url: amznSearch("REALFORCE R3S"), emoji: "⌨️", category: "keyboard" },
  { label: "Keychron K シリーズ", url: amznSearch("Keychron K メカニカルキーボード"), emoji: "⌨️", category: "keyboard" },
  { label: "Keychron Q1 Max", url: amznSearch("Keychron Q1 Max"), emoji: "⌨️", category: "keyboard" },
  { label: "NuPhy Halo75 V2", url: amznSearch("NuPhy Halo75 V2"), emoji: "✨", category: "keyboard" },
  { label: "NuPhy Air75 V2 ロープロファイル", url: amznSearch("NuPhy Air75 V2"), emoji: "✨", category: "keyboard" },
  { label: "Kinesis Advantage360", url: amznSearch("Kinesis Advantage360"), emoji: "🦋", category: "keyboard" },
  { label: "Mistel BAROCCO MD770 左右分離", url: amznSearch("Mistel MD770"), emoji: "🔀", category: "keyboard" },
  { label: "ARCHISS Maestro 2S", url: amznSearch("ARCHISS Maestro 2S"), emoji: "⌨️", category: "keyboard" },
  { label: "EPOMAKER RT100 レトロキーボード", url: amznSearch("EPOMAKER RT100"), emoji: "📺", category: "keyboard" },
  { label: "Razer Huntsman V3 Pro", url: amznSearch("Razer Huntsman V3 Pro"), emoji: "🎮", category: "keyboard" },
  { label: "Logicool G PRO X TKL", url: amznSearch("Logicool G PRO X TKL"), emoji: "🎮", category: "keyboard" },

  // 自作キーボードパーツ
  { label: "Gateron メカニカルスイッチ", url: amznSearch("Gateron キースイッチ"), emoji: "🔧", category: "parts" },
  { label: "Gateron Baby Kangaroo スイッチ", url: amznSearch("Gateron Baby Kangaroo"), emoji: "🦘", category: "parts" },
  { label: "Gateron Oil King スイッチ", url: amznSearch("Gateron Oil King"), emoji: "🛢️", category: "parts" },
  { label: "Kailh Box White スイッチ", url: amznSearch("Kailh Box White"), emoji: "🔊", category: "parts" },
  { label: "PBT キーキャップセット", url: amznSearch("PBT キーキャップ 日本語"), emoji: "🎨", category: "parts" },
  { label: "XVX ロープロファイル キーキャップ", url: amznSearch("XVX キーキャップ"), emoji: "🎨", category: "parts" },
  { label: "キースイッチ潤滑剤セット", url: amznSearch("キースイッチ 潤滑剤 ルブ"), emoji: "🧴", category: "parts" },
  { label: "キースイッチオープナー & ルブ板", url: amznSearch("キースイッチオープナー ルブ"), emoji: "🛠️", category: "parts" },
  { label: "Durock V2 ねじ込みスタビライザー", url: amznSearch("Durock V2 スタビライザー"), emoji: "🔧", category: "parts" },
  { label: "キーボード防音ポロンシート", url: amznSearch("キーボード 消音 フォーム ポロン"), emoji: "🔇", category: "parts" },
  { label: "自作キーボード はんだごてセット", url: amznSearch("はんだごて 温度調節 電子工作"), emoji: "🔥", category: "parts" },

  // マウス・ポインティングデバイス
  { label: "ロジクール MX ERGO トラックボール", url: amzn("B07B4TZJ5B"), emoji: "🖱️", category: "mouse" },
  { label: "Apple Magic Trackpad", url: amznSearch("Apple Magic Trackpad"), emoji: "🖱️", category: "mouse" },
  { label: "ELECOM ハンディトラックボール", url: amznSearch("ELECOM トラックボール"), emoji: "🖱️", category: "mouse" },
  { label: "ロジクール MX Master 3S", url: amznSearch("Logicool MX Master 3S"), emoji: "🖱️", category: "mouse" },
  { label: "Logicool G PRO X SUPERLIGHT 2", url: amznSearch("G PRO X SUPERLIGHT 2"), emoji: "🏆", category: "mouse" },
  { label: "Kensington SlimBlade Pro", url: amznSearch("Kensington SlimBlade Pro"), emoji: "🔮", category: "mouse" },

  // リストレスト
  { label: "パームレスト ウォルナット無垢材", url: amznSearch("パームレスト ウッド キーボード"), emoji: "🛋️", category: "wristrest" },
  { label: "FILCO ウッドパームレスト", url: amznSearch("FILCO ウッドパームレスト"), emoji: "🪵", category: "wristrest" },
  { label: "ゲルパームレスト メモリーフォーム", url: amznSearch("パームレスト ゲル メモリーフォーム"), emoji: "🛋️", category: "wristrest" },
  { label: "HyperX リストレスト クールゲル", url: amznSearch("HyperX リストレスト"), emoji: "❄️", category: "wristrest" },
  { label: "ウールフェルト パームレスト", url: amznSearch("フェルト パームレスト キーボード"), emoji: "🐑", category: "wristrest" },

  // 周辺グッズ
  { label: "大型デスクマット 900×400", url: amznSearch("デスクマット 大型 900"), emoji: "🗂️", category: "accessories" },
  { label: "キーボードスタンド テンティング調整", url: amznSearch("キーボードスタンド チルト"), emoji: "📐", category: "accessories" },
  { label: "USBハブ 7ポート 有線", url: amznSearch("USBハブ 7ポート"), emoji: "🔌", category: "accessories" },
  { label: "BenQ ScreenBar モニターライト", url: amznSearch("BenQ ScreenBar"), emoji: "💡", category: "accessories" },
  { label: "EPOMAKER コイルケーブル USB-C", url: amznSearch("EPOMAKER コイルケーブル"), emoji: "➰", category: "accessories" },
  { label: "山崎実業 キーボードスライダー", url: amznSearch("山崎実業 キーボードスライダー"), emoji: "🗄️", category: "accessories" },
  { label: "アクリル製キーボードルーフ", url: amznSearch("キーボードルーフ アクリル"), emoji: "🛡️", category: "accessories" },
  { label: "電動エアダスター 充電式", url: amznSearch("電動エアダスター"), emoji: "💨", category: "accessories" },
  { label: "キーボード掃除用 スライムクリーナー", url: amznSearch("キーボード 掃除 スライム"), emoji: "🦠", category: "accessories" },
  { label: "フェルト製デスクマット", url: amznSearch("デスクマット フェルト キーボード"), emoji: "🐏", category: "accessories" },
];

export function getRandomAds(count: number): Ad[] {
  const shuffled = [...ADS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ADS.length));
}
