import { ReactNode } from "react";

interface EmptyPlaceholderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyPlaceholder({
  title,
  description,
  action
}: EmptyPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 h-60">
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-md">{description}</p>
      {action}
    </div>
  );
} 