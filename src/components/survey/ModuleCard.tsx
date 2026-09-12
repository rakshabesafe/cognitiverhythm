import Link from "next/link";
import { ProgressRing } from "@/components/ui/ProgressRing";

interface ModuleCardProps {
  href: string;
  title: string;
  description: string;
  answered: number;
  total: number;
  completed: boolean;
}

export function ModuleCard({ href, title, description, answered, total, completed }: ModuleCardProps) {
  const percent = total > 0 ? (answered / total) * 100 : 0;
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-raised"
    >
      <ProgressRing percent={percent} />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="truncate text-sm text-muted">{description}</p>
        <p className="mt-1 text-xs text-muted">
          {answered}/{total} answered{completed ? " · Complete" : ""}
        </p>
      </div>
    </Link>
  );
}
