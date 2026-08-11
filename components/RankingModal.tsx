import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Trophy } from "lucide-react";
import { getRanking } from "@/lib/api";

interface Player {
  _id: string;
  name: string;
  xp: number;
  level: number;
}

export function RankingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [ranking, setRanking] = useState<Player[]>([]);

  useEffect(() => {
    if (isOpen) {
      getRanking()
        .then((data) => setRanking(data.ranking))
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Hall da Fama
        </h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-zinc-500">
              <th>Nome</th>
              <th>XP</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((p, i) => (
              <tr key={p._id || `${p.name}-${i}`} className="border-t">
                <td className="py-2">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`} {p.name}
                </td>
                <td>{p.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button className="mt-4 w-full" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}
