import type { EmojiReaction } from '../../types'

const AVAILABLE_EMOJIS = ['❤️', '🔥', '💪', '🎉', '😍']

interface Props {
  reactions: EmojiReaction[]
  currentUserId: number
  onReact: (emoji: string) => void
}

export function EmojiReactions({ reactions, currentUserId, onReact }: Props) {
  // Aggregate counts
  const counts: Record<string, { count: number; includesMe: boolean }> = {}
  for (const r of reactions) {
    if (!counts[r.emoji]) {
      counts[r.emoji] = { count: 0, includesMe: false }
    }
    counts[r.emoji]!.count++
    if (r.user_id === currentUserId) {
      counts[r.emoji]!.includesMe = true
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {AVAILABLE_EMOJIS.map(emoji => {
        const info = counts[emoji]
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className={`emoji-btn ${info?.includesMe ? 'emoji-btn-active' : ''}`}
          >
            <span className="text-sm">{emoji}</span>
            {info && info.count > 0 && (
              <span className="text-[10px] font-medium">{info.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
