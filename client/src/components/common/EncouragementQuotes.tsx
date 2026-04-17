const QUOTES = [
  '又近了一步！坚持就是胜利 💪',
  '每一次存钱都是对未来的承诺 ✨',
  '积少成多，聚沙成塔 🏗️',
  '你的坚持值得被看见 🌟',
  '今天的储蓄是明天的自由 🦋',
  '两颗心一起努力，没有什么做不到 💕',
  '又存了一格，太棒了！🎉',
  '距离目标更近了，加油！🔥',
  '你的毅力令人佩服 🏆',
  '一步一个脚印，终会到达 🎯',
]

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]!
}

export function EncouragementQuote({ quote }: { quote: string }) {
  return (
    <div className="encouragement-banner">
      <p className="text-sm text-gold font-medium">{quote}</p>
    </div>
  )
}
