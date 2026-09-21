import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function PageContainer({ children }: Props) {
  return <div className="hos-page-container">{children}</div>;
}
